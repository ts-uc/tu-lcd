// color.js — HEX ⇄ OKLCH 変換（OKLCHは {l, c, h} オブジェクト）

const clamp01 = (x) => Math.min(1, Math.max(0, x));
const rad = (deg) => (deg * Math.PI) / 180;
const deg = (rad) => (rad * 180) / Math.PI;

// --- sRGB companding ---
const srgbToLinear = (c) =>
  c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
const linearToSrgb = (c) =>
  c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055;

// --- HEX ⇄ RGB ---
function hexToRgb(hex) {
  let h = hex.replace(/^#/, "").trim();
  if (h.length === 3)
    h = h
      .split("")
      .map((c) => c + c)
      .join("");
  if (!/^[0-9a-fA-F]{6}$/.test(h)) throw new Error(`Invalid HEX: ${hex}`);
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
}
function rgbToHex([r, g, b]) {
  const to2 = (n) => n.toString(16).padStart(2, "0");
  return `#${to2(r)}${to2(g)}${to2(b)}`;
}

// --- sRGB → OKLab ---
function srgb01ToOklab([R, G, B]) {
  const r = srgbToLinear(R);
  const g = srgbToLinear(G);
  const b = srgbToLinear(B);

  const l = 0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b;
  const m = 0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b;
  const s = 0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b;

  const l_ = Math.cbrt(l);
  const m_ = Math.cbrt(m);
  const s_ = Math.cbrt(s);

  const L = 0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_;
  const a = 1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_;
  const b2 = 0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_;
  return [L, a, b2];
}

// --- OKLab → sRGB ---
function oklabToSrgb01([L, a, b]) {
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b;

  const l = l_ ** 3;
  const m = m_ ** 3;
  const s = s_ ** 3;

  let r = +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
  let g = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
  let b2 = -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s;

  r = linearToSrgb(r);
  g = linearToSrgb(g);
  b2 = linearToSrgb(b2);

  return [clamp01(r), clamp01(g), clamp01(b2)];
}

// --- OKLab ⇄ OKLCH ---
const labToLch = ([L, a, b]) => {
  const C = Math.hypot(a, b);
  let H = deg(Math.atan2(b, a));
  if (H < 0) H += 360;
  return { l: L, c: C, h: H };
};
const lchToLab = ({ l, c, h }) => {
  const a = c * Math.cos(rad(h));
  const b = c * Math.sin(rad(h));
  return [l, a, b];
};

// --- 公開API ---
// HEX → OKLCH {l,c,h}
function hexToOklch(hex) {
  const [r8, g8, b8] = hexToRgb(hex);
  const [R, G, B] = [r8, g8, b8].map((n) => n / 255);
  const lab = srgb01ToOklab([R, G, B]);
  return labToLch(lab);
}

// OKLCH {l,c,h} → HEX
function oklchToHex({ l, c, h }) {
  const lab = lchToLab({ l, c, h });
  const [R, G, B] = oklabToSrgb01(lab);
  const rgb = [R, G, B].map((x) => Math.round(x * 255));
  return rgbToHex(rgb);
}

function setColor(baseColor, propertyName, l, ratioC) {
  const baseOklch = hexToOklch(baseColor);
  const c = baseOklch.c * ratioC;
  const h = baseOklch.h;
  if (CSS.supports("color", "oklch(0.5 0.2 $)")) {
    document.documentElement.style.setProperty(
      propertyName,
      `oklch(${l} ${c} ${h})`
    );
  } else {
    document.documentElement.style.setProperty(
      propertyName,
      oklchToHex({
        l: l,
        c: c,
        h: h,
      })
    );
  }
}

export function setColors(baseColor) {
  setColor(baseColor, "--next", 0.5886, 1);
  setColor(baseColor, "--h-0", 0.7761, 0.8759);
  setColor(baseColor, "--h-6-25", 0.8141, 0.8528);
  setColor(baseColor, "--h-12-5", 0.7635, 0.879);
  setColor(baseColor, "--h-18-75", 0.7133, 0.9553);
  setColor(baseColor, "--h-25", 0.6486, 1.0469);
  setColor(baseColor, "--h-50", 0.6486, 1.0469);
  setColor(baseColor, "--h-100", 0.6436, 0.9938);
  setColor(baseColor, "--header-bottom", 0.7936, 0.672);
  setColor(baseColor, "--bg", 0.9491, 0.1432);
  setColor(baseColor, "--m-0", 0.7689, 0.54);
  setColor(baseColor, "--m-22", 0.8516, 0.5015);
  setColor(baseColor, "--m-56", 0.7167, 0.6355);
  setColor(baseColor, "--m-89", 0.605, 1.01);
  setColor(baseColor, "--m-100", 0.6023, 0.9345);
  setColor(baseColor, "--disabled", 0.8247, 0.3605);
}
