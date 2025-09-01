import lineData from "./line_data.json" assert { type: "json" };
import { applyScaling } from "./scaling.js";
import {
  lineEl,
  onChangeLine,
  onPageLoad,
  settingSelectors,
  onChangeSettings,
  moveNextStatus,
} from "./settings.js";
import { tick } from "./tick.js";

/* ===================== 設定変数（単一情報源） ===================== */
let settings = {
  isInboundLeft: true,
  line: null,
  auto: null,
  isInbound: false,
  trainType: "普　通",
  position: "",
  positionStatus: "stopping",
  stopStations: null,
};

/* ===================== ヘルパ ===================== */

export const rafApply = () => requestAnimationFrame(applyScaling);

// 初回反映 & 5秒ごとに更新
setInterval(() => {
  tick(settings);
}, 3000);

/* ===================== 設定画面表示切替 ===================== */

document.documentElement.setAttribute("data-setting", "normal");
document.querySelector("#h-type-box").addEventListener("dblclick", () => {
  const mode =
    document.documentElement.getAttribute("data-setting") === "normal"
      ? "setting"
      : "normal";
  document.documentElement.setAttribute("data-setting", mode);
  rafApply();
});

/* ===================== 駅送り ===================== */
document.getElementById("normal-panel").addEventListener("click", () => {
  moveNextStatus(settings);
});

/* ===================== 設定変更時 ===================== */

lineEl.addEventListener("change", () => {
  onChangeLine(settings);
});

settingSelectors.forEach((el) =>
  el.addEventListener("change", () => {
    onChangeSettings(settings);
  })
);

/* ===================== ページ読み込み時 ===================== */

document.addEventListener("DOMContentLoaded", () => {
  onPageLoad(settings);
});

/* ===================== リサイズ/フォントロード後調整 ===================== */
let resizeTid = 0;
window.addEventListener("resize", () => {
  clearTimeout(resizeTid);
  resizeTid = setTimeout(rafApply, 100);
});

window.addEventListener("load", () => {
  rafApply();
  setTimeout(rafApply, 0);
});

/* ===================== PWA用 ===================== */

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then(() => console.log("Service Worker registered"))
      .catch((err) => console.error("SW registration failed:", err));
  });
}
