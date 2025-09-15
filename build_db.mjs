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

// 追加：全角の英数＆丸括弧だけ半角にする
function toHalfWidthAlnumParen(s) {
  if (typeof s !== "string") return s;
  return s.replace(/（|）|[０-９Ａ-Ｚａ-ｚ]/g, (ch) => {
    if (ch === "（") return "(";
    if (ch === "）") return ")";
    const code = ch.charCodeAt(0);
    // ０-９, Ａ-Ｚ, ａ-ｚ を半角へ（U+FEE0 差分）
    if (
      (code >= 0xff10 && code <= 0xff19) || // ０-９
      (code >= 0xff21 && code <= 0xff3a) || // Ａ-Ｚ
      (code >= 0xff41 && code <= 0xff5a) // ａ-ｚ
    ) {
      return String.fromCharCode(code - 0xfee0);
    }
    return ch;
  });
}

function foldMacronToASCII(s) {
  return s
    .replace(/Ā/g, "A")
    .replace(/ā/g, "a")
    .replace(/Ē/g, "E")
    .replace(/ē/g, "e")
    .replace(/Ī/g, "I")
    .replace(/ī/g, "i")
    .replace(/Ō/g, "O")
    .replace(/ō/g, "o")
    .replace(/Ū/g, "U")
    .replace(/ū/g, "u");
}

function normalizeStationNameR(s) {
  if (typeof s !== "string") return s;
  const raw = s.trim();

  // 完全大文字維持の例外
  const keepAllUpper = new Set(["TOKYO SKYTREE", "TOBU WORLD SQUARE"]);
  if (keepAllUpper.has(raw.toUpperCase())) {
    return raw.toUpperCase();
  }

  // 記号と空白を除いた文字がすべて大文字かチェック
  const lettersOnly = raw.replace(/[^A-Za-zĀĒĪŌŪāēīōū]/g, "");
  if (!lettersOnly) return s;
  if (lettersOnly !== lettersOnly.toUpperCase()) return s;

  const lowerKeepWords = new Set([
    "CHO",
    "MACHI",
    "MAE",
    "KOUEN",
    "KOEN",
    "KOENMAE",
    "DORI",
    "GUCHI",
    "BASHI",
    "CHUO",
    "KITA",
    "MINAMI",
    "NISHI",
    "HIGASHI",
  ]);

  const parts = raw.split(/([ -])/); // 区切り保持

  for (let i = 0; i < parts.length; i++) {
    const token = parts[i];
    if (token === " " || token === "-") continue;

    const foldedUpper = foldMacronToASCII(token).toUpperCase();
    const lowerToken = token.toLowerCase();

    const isSentenceStart = i === 0; // 全体の先頭だけ特別扱い

    if (lowerKeepWords.has(foldedUpper)) {
      if (isSentenceStart) {
        // 文頭は頭大文字＋残り小文字
        parts[i] = lowerToken.replace(/^([A-Za-zĀĒĪŌŪāēīōū])/, (m) =>
          m.toUpperCase()
        );
      } else {
        // 文中はすべて小文字
        parts[i] = lowerToken;
      }
      continue;
    }

    // 通常語はタイトルケース
    parts[i] = lowerToken.replace(/^([A-Za-zĀĒĪŌŪāēīōū])/, (m) =>
      m.toUpperCase()
    );
  }

  return parts.join("");
}

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
          const values = cols.map((c) => {
            let v = r[c];
            if (v === "" || v == null) return null;

            // 既存の line_name / station_name の半角化（あなたの関数）
            if (
              (table === "lines" && c === "line_name") ||
              (table === "stations" && c === "station_name")
            ) {
              v = toHalfWidthAlnumParen(v);
            }

            // ★ 追加：station_name_r の整形ルール
            if (table === "stations" && c === "station_name_r") {
              v = normalizeStationNameR(v);
            }

            return v;
          });

          stmt.bind(values);
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

    db.exec(`UPDATE stations AS s
    SET station_list_name = CASE
      -- 1) 同名 & 同一都道府県内 で station_g_cd が異なる駅がある → 会社名を付与
      WHEN EXISTS (
        SELECT 1
        FROM stations AS s2
        WHERE s2.station_name = s.station_name
          AND s2.pref_cd     = s.pref_cd
          AND s2.station_g_cd <> s.station_g_cd
      ) THEN
        s.station_name || '(' ||
          (SELECT c.company_name
          FROM lines AS l
          JOIN companies AS c ON c.company_cd = l.company_cd
          WHERE l.line_cd = s.line_cd
          LIMIT 1) || ')'

      -- 2) それ以外で、同名だが station_g_cd が異なる駅がどこかにある → 都道府県名を付与
      WHEN EXISTS (
        SELECT 1
        FROM stations AS s3
        WHERE s3.station_name = s.station_name
          AND s3.station_g_cd <> s.station_g_cd
      ) THEN
        s.station_name || '(' ||
          (SELECT p.pref_name
          FROM prefs AS p
          WHERE p.pref_cd = s.pref_cd
          LIMIT 1) || ')'

      -- 3) それ以外 → 駅名のみ
      ELSE s.station_name
    END;
    `);

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
