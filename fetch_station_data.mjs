#!/usr/bin/env node
import { execSync } from "node:child_process";
import fs from "node:fs/promises";

const EXT_REPO = "https://github.com/ts-uc/StationAPI.git";
const EXT_BRANCH = "dev";
const EXT_DIR = "data"; // 取得したいディレクトリ
const DEST_DIR = "station_data";

export async function fetchStationData() {
  // --- DEST_DIR 削除 ---
  await fs.rm(DEST_DIR, { recursive: true, force: true });

  // --- git clone ---
  execSync(
    `git clone --depth=1 --filter=tree:0 --sparse -b ${EXT_BRANCH} ${EXT_REPO} ${DEST_DIR}`,
    { stdio: "inherit" }
  );

  // --- sparse-checkout 設定 ---
  execSync(`git -C ${DEST_DIR} sparse-checkout set --no-cone ${EXT_DIR}`, {
    stdio: "inherit",
  });
}
