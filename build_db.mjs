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

    db.exec(`INSERT INTO prefs (pref_cd, pref_name) VALUES
      (1, '北海道'),
      (2, '青森県'),
      (3, '岩手県'),
      (4, '宮城県'),
      (5, '秋田県'),
      (6, '山形県'),
      (7, '福島県'),
      (8, '茨城県'),
      (9, '栃木県'),
      (10, '群馬県'),
      (11, '埼玉県'),
      (12, '千葉県'),
      (13, '東京都'),
      (14, '神奈川県'),
      (15, '新潟県'),
      (16, '富山県'),
      (17, '石川県'),
      (18, '福井県'),
      (19, '山梨県'),
      (20, '長野県'),
      (21, '岐阜県'),
      (22, '静岡県'),
      (23, '愛知県'),
      (24, '三重県'),
      (25, '滋賀県'),
      (26, '京都府'),
      (27, '大阪府'),
      (28, '兵庫県'),
      (29, '奈良県'),
      (30, '和歌山県'),
      (31, '鳥取県'),
      (32, '島根県'),
      (33, '岡山県'),
      (34, '広島県'),
      (35, '山口県'),
      (36, '徳島県'),
      (37, '香川県'),
      (38, '愛媛県'),
      (39, '高知県'),
      (40, '福岡県'),
      (41, '佐賀県'),
      (42, '長崎県'),
      (43, '熊本県'),
      (44, '大分県'),
      (45, '宮崎県'),
      (46, '鹿児島県'),
      (47, '沖縄県');
    `);
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
