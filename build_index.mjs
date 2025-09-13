import { build } from "esbuild";
import { minify } from "html-minifier-terser";
import fs from "node:fs/promises";
import path from "node:path";
import { getDummyChars } from "./generate_dummy_font.mjs";

export async function buildIndex(outDir) {
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
  // --- 全ファイルの文字をユニークに抽出 + エスケープ ---
  const dummyChars = getDummyChars();
  // --- HTML テンプレート処理 ---
  const tpl = await fs.readFile("src/index.html", "utf8");
  const htmlRaw = tpl
    .replace("<!-- INLINE_CSS -->", `<style>${cssCode}</style>`)
    .replace("<!-- INLINE_JS -->", `<script>${jsCode}</script>`)
    .replaceAll(
      "<!-- DUMMY_CHARS -->",
      `<div style="display:none">${dummyChars}</div>`
    ); // ← ここで埋め込む

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
}
