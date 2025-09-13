import fs from "node:fs/promises";
import { buildIndex } from "./build_index.mjs";
import { buildSw } from "./build_sw.mjs";
import { fetchStationData } from "./fetch_station_data.mjs";

const outDir = "public";
await fs.mkdir(outDir, { recursive: true });

await fetchStationData();

// --- static → public コピー ---
await fs.cp("static", outDir, { recursive: true });

// index.htmlビルド
await buildIndex(outDir);

// sw.jsビルド
await buildSw(outDir);
