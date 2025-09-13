// get_dummy_chars.mjs
import fs from "node:fs/promises";
import sqlite3InitModule from "@sqlite.org/sqlite-wasm";

/**
 * public/station.db を読み込み、指定カラムで使われている全ての文字と
 * ひらがな/カタカナ/数字/ラテン/マクロン付き母音/「終点」を合算して
 * ユニークな並び（コードポイント順）の文字列で返す
 */
export async function getDummyChars(dbPath = "public/station.db") {
  const sqlite3 = await sqlite3InitModule(); // Nodeはインメモリ運用に対応

  // ---- DB をインメモリへデシリアライズ（WAL不可の点は公式通り）----
  const fileBytes = new Uint8Array(await fs.readFile(dbPath));
  const p = sqlite3.wasm.allocFromTypedArray(fileBytes);
  const db = new sqlite3.oo1.DB(); // :memory:
  const flags =
    sqlite3.capi.SQLITE_DESERIALIZE_FREEONCLOSE |
    sqlite3.capi.SQLITE_DESERIALIZE_READONLY;
  db.checkRc(
    sqlite3.capi.sqlite3_deserialize(
      db.pointer,
      "main",
      p,
      fileBytes.byteLength,
      fileBytes.byteLength,
      flags
    )
  );

  // ---- 指定カラムの文字を収集 ----
  const rows = [];
  const collect = (sql) =>
    db.exec({
      sql,
      rowMode: "array",
      callback: (r) => {
        if (r[0]) rows.push(String(r[0]));
      },
    });

  collect("SELECT line_name   FROM lines    WHERE line_name   IS NOT NULL");
  collect("SELECT line_name_h FROM lines    WHERE line_name_h IS NOT NULL");
  collect("SELECT line_name   FROM aliases  WHERE line_name   IS NOT NULL");
  collect("SELECT company_name FROM companies WHERE company_name IS NOT NULL");
  collect("SELECT station_name FROM stations  WHERE station_name IS NOT NULL");
  collect("SELECT type_name    FROM types     WHERE type_name    IS NOT NULL");

  // ---- 文字セット作成（DB由来 + 指定カテゴリ）----
  const chars = new Set();
  const addStr = (s) => {
    for (const ch of s) chars.add(ch);
  };
  const addRange = (a, b) => {
    let x = a.codePointAt(0);
    const y = b.codePointAt(0);
    for (; x <= y; x++) chars.add(String.fromCodePoint(x));
  };

  // DB 由来
  for (const s of rows) addStr(s);

  // ひらがな（ぁ..ゖ）+ 濁点/半濁点/ゝゞ/ゔ
  addRange("ぁ", "ゖ");
  addStr("゙゚゛゜ゝゞゔ");

  // カタカナ（ァ..ヺ）+ 長音/・/ヵ/ヶ
  addRange("ァ", "ヺ");
  addStr("ー・ヵヶ");

  // ASCII 数字 / ラテン
  addRange("0", "9");
  addRange("A", "Z");
  addRange("a", "z");

  // マクロン付き母音（小/大）
  addStr("āēīōūĀĒĪŌŪ");

  // 「終点」
  addStr("終点");

  // コードポイント順に整列して結合
  const out = Array.from(chars).sort(
    (a, b) => a.codePointAt(0) - b.codePointAt(0)
  );

  db.close();
  return out.join("");
}

// 直接実行されたときは結果を出力
if (import.meta.url === `file://${process.argv[1]}`) {
  getDummyChars().then(
    (s) => {
      console.log(s);
    },
    (e) => {
      console.error(e);
      process.exit(1);
    }
  );
}
