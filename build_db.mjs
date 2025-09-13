// load_csv_embedded.mjs
import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { parse } from "csv-parse/sync";

// ====== 埋め込み設定 ======
const DB = "public/station.db";
const SCHEMA = "schema.sql";
const FILES = [
  "station_data/data/1!companies.csv",
  "station_data/data/2!lines.csv",
  "station_data/data/3!stations.csv",
  "station_data/data/4!types.csv",
  "station_data/data/5!station_station_types.csv",
  "station_data/data/6!aliases.csv",
  "station_data/data/7!line_aliases.csv",
];
// ==========================

export function buildDb() {
  if (fs.existsSync(DB)) {
    fs.unlinkSync(DB);
    console.log(`removed old ${DB}`);
  }

  const db = new Database(DB);
  db.pragma("journal_mode=WAL");
  db.exec(fs.readFileSync(SCHEMA, "utf8"));

  const q = (s) => `"${String(s).replaceAll('"', '""')}"`;

  // ファイル名 → テーブル名 ("1!companies.csv" → "companies")
  const tableNameFrom = (file) => {
    const base = path.basename(file, path.extname(file)); // "1!companies"
    const parts = base.split("!");
    return parts.length > 1 ? parts[1] : parts[0]; // "companies"
  };

  for (const f of FILES) {
    const table = tableNameFrom(f);
    const rows = parse(fs.readFileSync(f), {
      columns: true,
      skip_empty_lines: true,
    });
    if (!rows.length) {
      console.warn(`skip empty: ${f}`);
      continue;
    }

    const tcols = db
      .prepare(`PRAGMA table_info(${q(table)});`)
      .all()
      .map((c) => c.name);
    const cols = Object.keys(rows[0]).filter((c) => tcols.includes(c));
    if (!cols.length) {
      console.warn(`no matching columns: ${f} -> ${table}`);
      continue;
    }

    const stmt = db.prepare(
      `INSERT INTO ${q(table)} (${cols.map(q).join(",")}) VALUES (${cols
        .map(() => "?")
        .join(",")})`
    );

    // --- DEFAULT カウンタ（テーブルごとにカラム単位で管理）---
    const counters = Object.fromEntries(cols.map((c) => [c, 0]));

    db.transaction(() => {
      for (const r of rows) {
        const values = cols.map((c) => {
          if (r[c] === "" || r[c] == null) return null;
          if (r[c] === "DEFAULT") {
            counters[c] += 1;
            return counters[c];
          }
          return r[c];
        });
        stmt.run(values);
      }
    })();

    console.log(`OK: ${f} -> ${table} (${rows.length} rows)`);
  }

  db.exec("VACUUM");
  db.close();
}
