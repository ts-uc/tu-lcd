import fs from "node:fs/promises";
import { buildIndex } from "./build_index.mjs";
import { buildSw } from "./build_sw.mjs";
import { fetchStationData } from "./fetch_station_data.mjs";
import { buildDb } from "./build_db.mjs";
import { writeStationsJson } from "./build_static_json.mjs";

const outDir = "public";
await fs.mkdir(outDir, { recursive: true });

// DB取得・構築
await fetchStationData();
await buildDb();

// 駅一覧JSON作成
await writeStationsJson();

// --- static → public コピー ---
await fs.cp("static", outDir, { recursive: true });

// index.htmlビルド
await buildIndex(outDir);

// sw.jsビルド
await buildSw(outDir);
