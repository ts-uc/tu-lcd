import { build } from "esbuild";
import { minify } from "html-minifier-terser";
import fs from "node:fs/promises";
import path from "node:path";

const outDir = "public";
await fs.mkdir(outDir, { recursive: true });

const jsResult = await build({
  entryPoints: ["src/main.js"],
  bundle: true,
  minify: true,
  format: "iife",
  platform: "browser",
  target: "es2018",
  write: false,
});

const cssResult = await build({
  entryPoints: ["src/style.css"],
  bundle: true,
  minify: true,
  loader: { ".css": "css" },
  write: false,
});

const jsCode = jsResult.outputFiles[0].text;
const cssCode = cssResult.outputFiles[0].text;

const tpl = await fs.readFile("src/index.html", "utf8");
const htmlRaw = tpl
  .replace("<!-- INLINE_CSS -->", `<style>${cssCode}</style>`)
  .replace("<!-- INLINE_JS -->", `<script>${jsCode}</script>`);

const htmlMin = await minify(htmlRaw, {
  collapseWhitespace: true,
  removeComments: true,
  removeRedundantAttributes: true,
  minifyCSS: false,
  minifyJS: false,
});

const outPath = path.join(outDir, "index.html");
await fs.writeFile(outPath, htmlMin, "utf8");
console.log(`✅ Built: ${outPath}`);
