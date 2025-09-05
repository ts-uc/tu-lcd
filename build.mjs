import { build } from "esbuild";
import { minify } from "html-minifier-terser";
import fs from "node:fs/promises";
import path from "node:path";
import { execSync } from "node:child_process";

const outDir = "public";
await fs.mkdir(outDir, { recursive: true });

// --- コミットハッシュ取得 ---
let commitHash = process.env.VERCEL_GIT_COMMIT_SHA;
if (!commitHash) {
  try {
    commitHash = execSync("git rev-parse --short HEAD").toString().trim();
  } catch {
    commitHash = "local"; // git がない場合のフォールバック
  }
}
const CACHE_NAME = `hk-lcd-${commitHash}`;

// --- JS ---
const jsResult = await build({
  entryPoints: ["src/main.js"],
  bundle: true,
  minify: true,
  format: "iife",
  platform: "browser",
  target: ["chrome71"],
  write: false,
});

// --- CSS ---
const cssResult = await build({
  entryPoints: ["src/style.css"],
  bundle: true,
  minify: true,
  loader: { ".css": "css" },
  target: ["chrome71"],
  write: false,
});

const jsCode = jsResult.outputFiles[0].text;
const cssCode = cssResult.outputFiles[0].text;

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

const allFiles = await loadAllFiles("src");

// --- 全ファイルの文字をユニークに抽出 + エスケープ ---
const dummyChars = escapeHtml(
  [...new Set(Object.values(allFiles).join(""))].join("")
);

// --- HTML テンプレート処理 ---
const tpl = await fs.readFile("src/index.html", "utf8");
const htmlRaw = tpl
  .replace("<!-- INLINE_CSS -->", `<style>${cssCode}</style>`)
  .replace("<!-- INLINE_JS -->", `<script>${jsCode}</script>`)
  .replaceAll(
    "<!-- DUMMY_CHARS -->",
    `<div style="display:none">${dummyChars}</div>`
  )
  .replaceAll("%%CACHE_NAME%%", CACHE_NAME); // ← ここで埋め込む

const htmlMin = await minify(htmlRaw, {
  collapseWhitespace: true,
  removeComments: true,
  removeRedundantAttributes: true,
  minifyCSS: false,
  minifyJS: false,
});

// --- 出力 ---
const outPath = path.join(outDir, "index.html");
await fs.writeFile(outPath, htmlMin, "utf8");

// sw.js も出力（キャッシュ名を含む）
const swSrc = await fs.readFile("src/sw.js", "utf8");
const swOut = swSrc.replaceAll("%%CACHE_NAME%%", CACHE_NAME);
await fs.writeFile(path.join(outDir, "sw.js"), swOut, "utf8");

console.log(`✅ Built: ${outPath}`);
