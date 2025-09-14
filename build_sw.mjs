import fs from "node:fs/promises";
import path from "node:path";
import { execSync } from "node:child_process";

const SW_ENTRY_PATH = "src/sw.js";
const SW_OUT = "sw.js";

export async function buildSw(outDir) {
  // --- コミットハッシュ取得 ---
  const commitHash = (() => {
    try {
      return execSync("git rev-parse --short HEAD").toString().trim();
    } catch {
      return "local"; // git がない場合のフォールバック
    }
  })();

  const CACHE_NAME = `tu-lcd-${commitHash}`;

  // sw.js も出力（キャッシュ名を含む）
  const swSrc = await fs.readFile(SW_ENTRY_PATH, "utf8");
  const swOut = swSrc.replaceAll("%%CACHE_NAME%%", CACHE_NAME);
  await fs.writeFile(path.join(outDir, SW_OUT), swOut, "utf8");
}
