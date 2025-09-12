import { applyScaling } from "./scaling.js";
import {
  lineEl,
  onChangeLine,
  onPageLoad,
  settingSelectors,
  onChangeSettings,
  moveNextStatus,
  autoEl,
  onChangeAuto,
} from "./settings.js";
import { tick } from "./tick.js";

/* ===================== 設定変数（単一情報源） ===================== */
let state = {
  settings: {
    isInboundLeft: true,
    line: null,
    auto: null,
    isInbound: false,
    trainType: "普　通",
    position: "",
    positionStatus: "stopping",
    stopStations: null,
    terminalDisp: true,
  },
  info: {
    next: "",
    dest: "",
  },
  tick: {
    idx: 0,
  },
};

/* ===================== ヘルパ ===================== */

export const rafApply = () => requestAnimationFrame(applyScaling);

// 初回反映 & 5秒ごとに更新
setInterval(() => {
  tick(state);
}, 3000);

/* ===================== 設定画面表示切替 ===================== */

document.getElementById("header-panel").addEventListener(
  "dblclick",
  () => {
    document.body.classList.toggle("lcd-only");
  },
  { passive: true }
);

/* ===================== 駅送り ===================== */
document.getElementById("main-panel").addEventListener("click", () => {
  moveNextStatus(state);
});

/* ===================== 設定変更時 ===================== */

autoEl.addEventListener("change", () => {
  onChangeAuto(state);
});

lineEl.addEventListener("change", () => {
  onChangeLine(state);
});

settingSelectors.forEach((el) =>
  el.addEventListener("change", () => {
    onChangeSettings(state);
  })
);

/* ===================== ページ読み込み時 ===================== */

document.addEventListener("DOMContentLoaded", () => {
  onPageLoad(state);
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
