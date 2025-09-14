import { build } from "esbuild";
import { minify } from "html-minifier-terser";
import fs from "node:fs/promises";
import path from "node:path";
import { getDummyChars } from "./generate_dummy_font.mjs";

const JS_ENTRY_PATH = "src/main.js";
const CSS_ENTRY_PATH = "src/style.css";
const HTML_ENTRY_PATH = "src/index.html";
const HTML_OUT = "index.html";

export async function buildIndex(outDir) {
  // --- JS ---
  const jsResult = await build({
    entryPoints: [JS_ENTRY_PATH],
    bundle: true,
    minify: true,
    format: "iife",
    platform: "browser",
    target: ["chrome71"],
    write: false,
  });

  // --- CSS ---
  const cssResult = await build({
    entryPoints: [CSS_ENTRY_PATH],
    bundle: true,
    minify: true,
    loader: { ".css": "css" },
    target: ["chrome71"],
    write: false,
  });

  const jsCode = jsResult.outputFiles[0].text;
  const cssCode = cssResult.outputFiles[0].text;
  // --- 全ファイルの文字をユニークに抽出 + エスケープ ---
  const dummyCharsJa = await getDummyChars();
  // --- HTML テンプレート処理 ---
  const tpl = await fs.readFile(HTML_ENTRY_PATH, "utf8");
  const htmlRaw = tpl
    .replace("<!-- INLINE_CSS -->", `<style>${cssCode}</style>`)
    .replace("<!-- INLINE_JS -->", `<script>${jsCode}</script>`)
    .replaceAll("<!-- DUMMY_CHARS -->", dummyCharsJa); // ← ここで埋め込む

  const htmlMin = await minify(htmlRaw, {
    collapseWhitespace: true,
    removeComments: true,
    removeRedundantAttributes: true,
    minifyCSS: false,
    minifyJS: false,
  });

  // --- 出力 ---
  const outPath = path.join(outDir, HTML_OUT);
  await fs.writeFile(outPath, htmlMin, "utf8");
}
