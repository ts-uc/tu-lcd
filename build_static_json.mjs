import fs from "node:fs/promises";
import sqlite3InitModule from "@sqlite.org/sqlite-wasm";

const DB_PATH = "public/station.db";
const OUT_JSON = "public/stations.json";

export async function writeStationsJson() {
  const sqlite3 = await sqlite3InitModule();

  let db;
  try {
    // まずは素直にファイルを read-only/immutable で開く（Nodeなら大抵これでOK）
    const uri = `file:${DB_PATH}?mode=ro&immutable=1`;
    db = new sqlite3.oo1.DB(uri);
  } catch (e1) {
    // フォールバック: deserialize（Buffer → Uint8Array に変換必須）
    const buf = await fs.readFile(DB_PATH);
    const u8 = new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);

    db = new sqlite3.oo1.DB(); // :memory:
    const { capi, wasm } = sqlite3;

    if (!capi.sqlite3_deserialize) {
      throw new Error("sqlite3_deserialize is not available in this build");
    }

    // バイト列を WASM ヒープに確保
    const pData = wasm.allocFromTypedArray(u8);
    // "main" の C 文字列ポインタを確保（← cstrToPtr ではなく allocCString）
    const pzSchema = wasm.allocCString("main");

    const rc = capi.sqlite3_deserialize(
      db.pointer,
      pzSchema,
      pData,
      u8.byteLength,
      u8.byteLength,
      capi.SQLITE_DESERIALIZE_FREEONCLOSE | capi.SQLITE_DESERIALIZE_READONLY
    );
    // C 文字列は不要になったので解放
    wasm.dealloc(pzSchema);

    if (rc !== 0) {
      throw new Error(`sqlite3_deserialize failed rc=${rc}`);
    }
  }

  try {
    const rows = [];
    db.exec({
      sql: `
        SELECT
          s.station_cd,
          COALESCE(s.station_list_name, s.station_name) AS station_list_name,
          l.line_name_h
        FROM stations s
        JOIN lines l ON l.line_cd = s.line_cd
        ORDER BY s.station_cd
      `,
      rowMode: "object",
      callback: (r) => {
        rows.push({
          i: r.station_cd,
          s: r.station_list_name,
          l: r.line_name_h,
        });
      },
    });

    await fs.writeFile(OUT_JSON, JSON.stringify({ stations: rows }), "utf8");
    console.log(`wrote: ${OUT_JSON}`);
  } finally {
    db.close();
  }
}

// 直接実行用
if (import.meta.url === `file://${process.argv[1]}`) {
  writeStationsJson().catch((e) => {
    console.error(e);
    process.exitCode = 1;
  });
}
