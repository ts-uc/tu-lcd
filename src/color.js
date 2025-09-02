// HEX (#000000) → HSV
function hexToHsv(hex) {
  // #を取り除く
  hex = hex.replace(/^#/, "");
  if (hex.length === 3) {
    hex = hex
      .split("")
      .map((c) => c + c)
      .join("");
  }
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;

  let h = 0;
  if (d !== 0) {
    if (max === r) {
      h = ((g - b) / d) % 6;
    } else if (max === g) {
      h = (b - r) / d + 2;
    } else {
      h = (r - g) / d + 4;
    }
    h *= 60;
    if (h < 0) h += 360;
  }

  const s = max === 0 ? 0 : d / max;
  const v = max;

  return { h, s, v }; // h: 0–360, s: 0–1, v: 0–1
}

// HSV → HEX (#000000)
function hsvToHex(h, s, v) {
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;

  let r = 0,
    g = 0,
    b = 0;
  if (h >= 0 && h < 60) {
    r = c;
    g = x;
    b = 0;
  } else if (h >= 60 && h < 120) {
    r = x;
    g = c;
    b = 0;
  } else if (h >= 120 && h < 180) {
    r = 0;
    g = c;
    b = x;
  } else if (h >= 180 && h < 240) {
    r = 0;
    g = x;
    b = c;
  } else if (h >= 240 && h < 300) {
    r = x;
    g = 0;
    b = c;
  } else {
    r = c;
    g = 0;
    b = x;
  }

  const R = Math.round((r + m) * 255);
  const G = Math.round((g + m) * 255);
  const B = Math.round((b + m) * 255);

  return "#" + [R, G, B].map((v) => v.toString(16).padStart(2, "0")).join("");
}

// ==== 使用例 ====
// HEX → HSV
console.log(hexToHsv("#ff0000")); // { h: 0, s: 1, v: 1 }
// HSV → HEX
console.log(hsvToHex(120, 1, 1)); // "#00ff00"

function setColor(baseColor, propertyName, ratioS, ratioV) {
  const hsv = hexToHsv(baseColor);
  const colorSet = hsvToHex(hsv.h, hsv.s * ratioS, 1 - (1 - hsv.v) * ratioV);
  document.documentElement.style.setProperty(propertyName, colorSet);
}

export function setColors(baseColor) {
  setColor(baseColor, "--next", 1, 1);
  setColor(baseColor, "--dest-dark", 0.96, 0.58);
  setColor(baseColor, "--dest-bright", 0.44, 0.13);
  setColor(baseColor, "--header-bottom", 0.54, 0.29);
  setColor(baseColor, "--bg", 0.1, 0.08);
  setColor(baseColor, "--map-light", 0.41, 0.17);
  setColor(baseColor, "--map-dark", 0.94, 1);
  setColor(baseColor, "--disabled", 0.29, 0.5);
}
