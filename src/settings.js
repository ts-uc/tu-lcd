import lineData from "./line_data.json" assert { type: "json" };
import { applyScaling } from "./scaling";
import { resetTick } from "./tick";
import { updateDOMs } from "./dom_updater.js";

/* ===================== 設定フォーム要素参照 ===================== */
export const lineEl = document.getElementById("line-select");

const layoutDirEls = document.querySelectorAll('input[name="layout-dir"]');
const autoEl = document.getElementById("auto-select");
const directionEls = document.querySelectorAll('input[name="direction"]');
const trainTypeEl = document.getElementById("train-type-select");
const currentStationEl = document.getElementById("current-station");
const positionStatusEls = document.querySelectorAll(
  'input[name="position-status"]'
);
const stopStationsEl = document.getElementById("stop-stations");

export const settingSelectors = [
  ...layoutDirEls,
  ...directionEls,
  ...positionStatusEls,
  autoEl,
  trainTypeEl,
  currentStationEl,
  stopStationsEl,
];

// ページ読み込み時
export function onPageLoad(settings) {
  // line_data から辞書を作成
  const lineList = Object.entries(lineData).map(([id, obj]) => ({
    id,
    name: obj.lineName,
  }));

  // option を追加
  lineList.forEach((line) => {
    lineEl.insertAdjacentHTML(
      "beforeend",
      `<option value="${line.id}">${line.name}</option>`
    );
  });

  // デフォルト値セット

  // 設置方向
  settings.isInboundLeft = true;
  qs('input[name="layout-dir"][value="inbound-left"]').checked =
    !!settings.isInboundLeft;
  qs('input[name="layout-dir"][value="inbound-right"]').checked =
    !settings.isInboundLeft;

  // 路線
  settings.line = lineList[0].id;
  lineEl.value = settings.line || "";

  onChangeLine(settings);
}

// 路線変更時
export function onChangeLine(settings) {
  // 設定読み込み
  settings.line = lineEl.value || null;

  const stations = lineData[settings.line].stations;

  // 現在地/直前後 のoptionを追加
  currentStationEl.innerHTML = "";
  stations.forEach((station) => {
    currentStationEl.insertAdjacentHTML(
      "beforeend",
      `<option value="${station}">${station}</option>`
    );
  });

  // 停車駅 の option を追加
  stopStationsEl.innerHTML = "";
  stations.forEach((station) => {
    stopStationsEl.insertAdjacentHTML(
      "beforeend",
      `<option value="${station}">${station}</option>`
    );
  });

  // 進行方向
  settings.isInbound = false;
  qs('input[name="direction"][value="inbound"]').checked = !!settings.isInbound;
  qs('input[name="direction"][value="outbound"]').checked = !settings.isInbound;
  // 列車種別
  settings.trainType = "普　通";
  trainTypeEl.value = settings.trainType || "";
  // 現在地
  settings.position = stations[0];
  currentStationEl.value = settings.position || "";
  // 状態
  settings.positionStatus = "stopping";
  positionStatusEls.forEach((el) => {
    el.checked = el.value === settings.positionStatus;
  });
  // 停車駅
  settings.stopStations = [...stations];
  Array.from(stopStationsEl.options).forEach((opt) => {
    opt.selected = settings.stopStations.includes(opt.value);
  });

  // ラインカラー置き換え
  lineColor = lineData[settings.line].color;
  const hsl = hexToHsl(lineColor);
  document.documentElement.style.setProperty("--h", hsl.h);

  raf(settings);
  resetTick(settings);
}

const raf = (settings) =>
  requestAnimationFrame(() => {
    updateDOMs(settings);
    applyScaling();
  });

export function onChangeSettings(settings) {
  setSettings(settings);
  raf(settings);
}

const qs = (sel, root = document) => root.querySelector(sel);

/* ===== settings → フォーム反映 ===== */
export function applySettings(settings) {
  // 設置方向
  qs('input[name="layout-dir"][value="inbound-left"]').checked =
    !!settings.isInboundLeft;
  qs('input[name="layout-dir"][value="inbound-right"]').checked =
    !settings.isInboundLeft;

  // 進行方向
  qs('input[name="direction"][value="inbound"]').checked = !!settings.isInbound;
  qs('input[name="direction"][value="outbound"]').checked = !settings.isInbound;

  // その他
  lineEl.value = settings.line || "";
  autoEl.value = settings.auto || "";
  trainTypeEl.value = settings.trainType || "";
  currentStationEl.value = settings.position || "";

  // 状態
  if (settings.positionStatus != null) {
    positionStatusEls.forEach((el) => {
      el.checked = el.value === settings.positionStatus;
    });
  } else {
    // 何も未選択なら先頭を既定に（任意）
    const checked = qs('input[name="position-status"]:checked');
    if (!checked && positionStatusEls[0]) positionStatusEls[0].checked = true;
  }

  // multiple select
  Array.from(stopStationsEl.options).forEach((opt) => {
    opt.selected = settings.stopStations.includes(opt.value);
  });
}

/* ===== フォーム → settings 反映 ===== */
export function setSettings(settings) {
  settings.isInboundLeft =
    qs('input[name="layout-dir"]:checked')?.value === "inbound-left";
  settings.isInbound =
    qs('input[name="direction"]:checked')?.value === "inbound";
  settings.line = lineEl.value || null;
  settings.auto = autoEl.value || null;
  settings.trainType = trainTypeEl.value || "";
  settings.position = currentStationEl.value || "";
  settings.positionStatus =
    qs('input[name="position-status"]:checked')?.value ?? "";
  settings.stopStations = Array.from(stopStationsEl.selectedOptions).map(
    (o) => o.value
  );
}

function hexToHsl(hex) {
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

  const max = Math.max(r, g, b),
    min = Math.min(r, g, b);
  let h,
    s,
    l = (max + min) / 2;

  if (max === min) {
    h = s = 0; // グレースケール
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h = Math.round(h * 60);
  }
  return { h, s: s * 100, l: l * 100 };
}
