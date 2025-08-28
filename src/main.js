import lineData from "./line_data.json" assert { type: "json" };
import { applyScaling } from "./scaling.js";
import { applySettings, getSettings, settingSelectors } from "./settings.js";
import { updateDOMs } from "./dom_updater.js";
import { tick, resetTick } from "./tick.js";

const data = lineData.abukyu;

/* ===================== 設定変数（単一情報源） ===================== */
let settings = {
  isInboundLeft: true,
  route: null,
  auto: null,
  isInbound: false,
  trainType: "普　通",
  position: data.stations[0],
  positionStatus: "stopping",
  stopStations: [...data.stations],
};

/* ===================== ヘルパ ===================== */

const rafUpdate = () =>
  requestAnimationFrame(() => {
    updateDOMs(settings);
  });

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

function updateSettingsAndUpdate() {
  settings = getSettings();
  rafUpdate();
  rafApply();
}

const currentStationEl = document.getElementById("current-station");
const stopStationsEl = document.getElementById("stop-stations");

// 変更監視
settingSelectors.forEach((el) =>
  el.addEventListener("change", updateSettingsAndUpdate)
);

/* ===================== 初期化 ===================== */
/** フォームの選択肢はロード時に一度だけ構築（初期値は settings から applySettings で反映） */
function buildFormOptionsOnce() {
  // 現在地／直前駅
  currentStationEl.innerHTML = data.stations
    .map((s) => `<option value="${s}">${s}</option>`)
    .join("");

  // 停車駅（multiple）
  stopStationsEl.innerHTML = data.stations
    .map((s) => `<option value="${s}">${s}</option>`)
    .join("");

  // 種別の候補（既存の <option> を使う運用なら不要。必要なら以下を利用）
  // 例: trainTypeEl.innerHTML = Object.keys(data.kana).slice(0,3).map(t => `<option value="${t}">${t}</option>`).join("");
}

document.addEventListener("DOMContentLoaded", () => {
  buildFormOptionsOnce(); // ←選択肢だけ作る（初期値はここでは入れない）
  applySettings(settings); // ←初期値は settings を反映
  rafUpdate();
  resetTick(settings);
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
