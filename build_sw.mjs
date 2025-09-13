import fs from "node:fs/promises";
import path from "node:path";
import { execSync } from "node:child_process";

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
  const swSrc = await fs.readFile("src/sw.js", "utf8");
  const swOut = swSrc.replaceAll("%%CACHE_NAME%%", CACHE_NAME);
  await fs.writeFile(path.join(outDir, "sw.js"), swOut, "utf8");
}
