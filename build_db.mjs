// build_db.mjs
import fs from "node:fs";
import path from "node:path";
import { parse } from "csv-parse/sync";
import sqlite3InitModule from "@sqlite.org/sqlite-wasm";

const DB_PATH = "public/station.db";
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

const tableNameFrom = (file) => {
  const base = path.basename(file, path.extname(file)); // "1!companies"
  const parts = base.split("!");
  return parts.length > 1 ? parts[1] : parts[0];
};
const qIdent = (s) => `"${String(s).replaceAll('"', '""')}"`;

export async function buildDb() {
  if (fs.existsSync(DB_PATH)) fs.unlinkSync(DB_PATH);

  const sqlite3 = await sqlite3InitModule(); // npm 版は wasm の場所解決が内蔵
  const db = new sqlite3.oo1.DB(); // :memory:
  try {
    db.exec(fs.readFileSync(SCHEMA, "utf8"));

    const tableCols = (table) => {
      const rows = [];
      db.exec({
        sql: `PRAGMA table_info(${qIdent(table)});`,
        rowMode: "array",
        callback: (ary) => rows.push(ary),
      });
      return rows.map((r) => r[1]); // name
    };

    for (const f of FILES) {
      const table = tableNameFrom(f);
      const rows = parse(fs.readFileSync(f), {
        columns: true,
        skip_empty_lines: true,
      });
      if (!rows.length) continue;

      const tcols = tableCols(table);
      const cols = Object.keys(rows[0]).filter((c) => tcols.includes(c));
      if (!cols.length) continue;

      db.exec("BEGIN");
      try {
        const placeholders = cols.map(() => "?").join(",");
        const sql = `INSERT INTO ${qIdent(table)} (${cols
          .map(qIdent)
          .join(",")}) VALUES (${placeholders})`;
        const stmt = db.prepare(sql);
        for (const r of rows) {
          stmt.bind(
            cols.map((c) => (r[c] === "" || r[c] == null ? null : r[c]))
          );
          stmt.step();
          stmt.reset();
        }
        stmt.finalize();
        db.exec("COMMIT");
      } catch (e) {
        db.exec("ROLLBACK");
        throw e;
      }
    }

    db.exec("VACUUM");

    const bytes = sqlite3.capi.sqlite3_js_db_export(db);
    fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
    fs.writeFileSync(DB_PATH, bytes); // ← これで .db を作成
    console.log(`wrote: ${DB_PATH} (${bytes.length} bytes)`);
  } finally {
    db.close();
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  buildDb().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
