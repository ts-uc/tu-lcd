import lineData from "./line_data.json" assert { type: "json" };
import { applyScaling } from "./scaling.js";
import {
  lineEl,
  onChangeLine,
  onPageLoad,
  settingSelectors,
  onChangeSettings,
} from "./settings.js";
import { updateDOMs } from "./dom_updater.js";
import { tick } from "./tick.js";
import { onClickFsButton, updateLabel } from "./fullscreen.js";

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
// ※ 初期値セット処理は削除（populateSettingsOnce も呼び出しもしない）
const elSettings = document.getElementById("settings-panel");
const elNormal = document.getElementById("normal-panel");
document.querySelector("#h-type-box").addEventListener("dblclick", () => {
  const showingSettings = elSettings.style.display === "block";
  elSettings.style.display = showingSettings ? "none" : "block";
  elNormal.style.display = showingSettings ? "block" : "none";
  rafApply();
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

/* ===================== 全画面表示 ===================== */

const btn = document.getElementById("fs-btn");
btn.addEventListener("click", onClickFsButton);
document.addEventListener("fullscreenchange", updateLabel);
document.addEventListener("webkitfullscreenchange", updateLabel);
updateLabel();

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
