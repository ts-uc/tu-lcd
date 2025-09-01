const qsa = (sel, root = document) => [...root.querySelectorAll(sel)];
const vw = (v) => window.innerWidth * (v / 100);

/** 任意軸で max を超えた分だけ縮小（transform 前置にも対応） */
function scaleToFit(el, { maxPx, axis = "x", origin = "center", prefix = "" }) {
  if (!el) return;
  const a = axis.toLowerCase();
  const actual = a === "y" ? el.scrollHeight : el.scrollWidth;
  if (actual > maxPx) {
    const scale = maxPx / actual;
    const scaleStr = a === "y" ? `scaleY(${scale})` : `scaleX(${scale})`;
    el.style.transform = `${prefix}${prefix ? " " : ""}${scaleStr}`;
  } else {
    el.style.transform = prefix;
  }
  el.style.transformOrigin = origin;
}

export function applyScaling() {
  // 駅名
  qsa(".m-name").forEach((el) => {
    if (el.classList.contains("en")) {
      scaleToFit(el, {
        maxPx: vw(13),
        axis: "x",
        origin: "bottom left",
        prefix: "rotate(-75deg)",
      });
    } else {
      scaleToFit(el, {
        maxPx: vw(12.5),
        axis: "y",
        origin: "bottom center",
        prefix: "translateX(-50%)",
      });
    }
  });
  // 種別
  qsa(".h-type").forEach((el) => {
    scaleToFit(el, { maxPx: vw(18), axis: "x", origin: "center" });
  });
  // 行先
  qsa(".h-dest").forEach((el) => {
    scaleToFit(el, { maxPx: vw(32), axis: "x", origin: "left" });
  });
  // 次駅
  qsa(".h-next-c").forEach((el) => {
    scaleToFit(el, { maxPx: vw(25), axis: "x", origin: "center" });
  });
  qsa(".n-c").forEach((el) => {
    scaleToFit(el, { maxPx: vw(50), axis: "x", origin: "center" });
  });
}
