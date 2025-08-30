import { build } from "esbuild";
import { minify } from "html-minifier-terser";
import fs from "node:fs/promises";
import path from "node:path";

const outDir = "public";
await fs.mkdir(outDir, { recursive: true });

// --- JS ---
const jsResult = await build({
  entryPoints: ["src/main.js"],
  bundle: true,
  minify: true,
  format: "iife",
  platform: "browser",
  target: "es2018",
  write: false,
});

// --- CSS ---
const cssResult = await build({
  entryPoints: ["src/style.css"],
  bundle: true,
  minify: true,
  loader: { ".css": "css" },
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
        // バイナリは無視（画像など）
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
  );

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
console.log(`✅ Built: ${outPath}`);
