import fs from "node:fs/promises";
import path from "node:path";

// --- エスケープ関数 ---
function escapeHtml(str) {
  return str.replace(/[&<>"']/g, (ch) => {
    switch (ch) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case '"':
        return "&quot;";
      case "'":
        return "&#39;";
    }
  });
}

// --- src 配下すべてのテキストファイルを読み込み ---
async function loadAllFiles(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  let result = {};
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      Object.assign(result, await loadAllFiles(full));
    } else {
      try {
        const text = await fs.readFile(full, "utf8");
        result[full] = text;
      } catch {
        // バイナリは無視
      }
    }
  }
  return result;
}

export async function getDummyChars() {
  const allFiles = await loadAllFiles("src");

  // --- 全ファイルの文字をユニークに抽出 + エスケープ ---
  const dummyChars = escapeHtml(
    [...new Set(Object.values(allFiles).join(""))].join("")
  );

  return dummyChars;
}
