import lineData from "./line_data.json" assert { type: "json" };
import typeData from "./type_data.json" assert { type: "json" };
import diagramData from "./diagram_data.json" assert { type: "json" };
import { applyScaling } from "./scaling";
import { resetTick } from "./tick";
import { updateDOMs } from "./dom_updater.js";
import { setColors } from "./color.js";
import { onChangeAutoSettings } from "./change_auto.js";

/* ===================== 設定フォーム要素参照 ===================== */
export const autoEl = document.getElementById("auto-select");
export const lineEl = document.getElementById("line-select");

const layoutDirEl = document.getElementById("layout-dir-select");
const directionEl = document.getElementById("direction-select");
const trainTypeEl = document.getElementById("train-type-select");
const positionStatusEl = document.getElementById("position-status-select");
const currentStationEl = document.getElementById("current-station");
const stopStationsEl = document.getElementById("stop-stations");
const terminalDispEl = document.getElementById("terminal-disp-select");

export const settingSelectors = [
  layoutDirEl,
  directionEl,
  trainTypeEl,
  positionStatusEl,
  currentStationEl,
  stopStationsEl,
];

// ページ読み込み時
export function onPageLoad(settings) {
  const diagramList = Object.keys(diagramData);
  diagramList.forEach((diagramName) => {
    autoEl.insertAdjacentHTML(
      "beforeend",
      `<option value="${diagramName}">${diagramName}</option>`
    );
  });

  // line_data から辞書を作成
  const lineList = Object.entries(lineData).map(([id, obj]) => ({
    id,
    name: obj.lineName,
    hidden: obj.hidden == true,
  }));

  // option を追加
  lineList.forEach((line) => {
    if (line.hidden) {
      lineEl.insertAdjacentHTML(
        "beforeend",
        `<option disabled value="${line.id}">?????</option>`
      );
    } else {
      lineEl.insertAdjacentHTML(
        "beforeend",
        `<option value="${line.id}">${line.name}</option>`
      );
    }
  });

  const typeList = Object.keys(typeData);
  typeList.forEach((typeName) => {
    trainTypeEl.insertAdjacentHTML(
      "beforeend",
      `<option value="${typeName}">${typeName}</option>`
    );
  });

  // デフォルト値セット
  // 自動
  settings.auto = "manual";
  autoEl.value = settings.auto || "manual";

  // 設置方向
  settings.isInboundLeft = true;
  layoutDirEl.value = settings.isInboundLeft ? "inbound-left" : "inbound-right";

  // 路線
  settings.line = lineList[0].id;
  lineEl.value = settings.line || "";

  onChangeLine(settings);
}

export function onChangeAuto(settings) {
  settings.auto = autoEl.value || null;

  onChangeAutoSettings(settings);

  if (settings.auto === "manual") {
    lineEl.disabled = false;
    directionEl.disabled = false;
    trainTypeEl.disabled = false;
    positionStatusEl.disabled = false;
    currentStationEl.disabled = false;
    stopStationsEl.disabled = false;
    terminalDispEl.disabled = false;
  } else {
    lineEl.disabled = true;
    directionEl.disabled = true;
    trainTypeEl.disabled = true;
    positionStatusEl.disabled = true;
    currentStationEl.disabled = true;
    stopStationsEl.disabled = true;
    terminalDispEl.disabled = true;
  }
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
  directionEl.value = settings.isInbound ? "inbound" : "outbound";
  // 列車種別
  settings.trainType = "普通";
  trainTypeEl.value = settings.trainType || "";
  // 現在地
  settings.position = stations[0];
  currentStationEl.value = settings.position || "";
  // 状態
  settings.positionStatus = "stopping";
  positionStatusEl.value = settings.positionStatus || "";
  // 停車駅
  settings.stopStations = [...stations];
  Array.from(stopStationsEl.options).forEach((opt) => {
    opt.selected = settings.stopStations.includes(opt.value);
  });
  settings.terminalDisp = true;
  terminalDispEl.value = settings.terminalDisp ? "on" : "off";

  // ラインカラー置き換え
  lineColor = lineData[settings.line].color;
  setColors(lineColor);

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
  console.log(settings);
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

  // 設置方向
  layoutDirEl.value = settings.isInboundLeft ? "inbound-left" : "inbound-right";
  lineEl.value = settings.line || "";
  autoEl.value = settings.auto || "";
  directionEl.value = settings.isInbound ? "inbound" : "outbound";
  trainTypeEl.value = settings.trainType || "";
  positionStatusEl.value = settings.positionStatus || "";
  currentStationEl.value = settings.position || "";
  terminalDispEl.value = settings.terminalDisp ? "on" : "off";

  // multiple select
  Array.from(stopStationsEl.options).forEach((opt) => {
    opt.selected = settings.stopStations.includes(opt.value);
  });

  lineColor = lineData[settings.line].color;
  setColors(lineColor);
  raf(settings);
  resetTick(settings);
}

/* ===== フォーム → settings 反映 ===== */
export function setSettings(settings) {
  settings.isInboundLeft = layoutDirEl.value === "inbound-left";
  settings.isInbound = directionEl.value === "inbound";
  settings.line = lineEl.value || null;
  settings.auto = autoEl.value || null;
  settings.trainType = trainTypeEl.value || "";
  settings.position = currentStationEl.value || "";
  settings.positionStatus = positionStatusEl.value || "";
  settings.stopStations = Array.from(stopStationsEl.selectedOptions).map(
    (o) => o.value
  );
  settings.terminalDisp = terminalDispEl.value === "on";
}

function moveNextStation(settings) {
  const stations = lineData[settings.line].stations;
  let idx = stations.indexOf(settings.position);
  if (settings.isInbound && idx > 0) {
    settings.position = stations[idx - 1];
    currentStationEl.value = settings.position || "";
  }

  if (!settings.isInbound && idx !== -1 && idx < stations.length - 1) {
    settings.position = stations[idx + 1];
    currentStationEl.value = settings.position || "";
  }
}

export function moveNextStatus(settings) {
  if (settings.auto !== "manual") {
    return;
  }

  if (settings.positionStatus === "stopping") {
    moveNextStation(settings);
    settings.positionStatus = "next";
  } else if (!settings.stopStations.includes(settings.position)) {
    moveNextStation(settings);
    settings.positionStatus = "next";
  } else if (settings.positionStatus === "soon") {
    settings.positionStatus = "stopping";
  } else {
    settings.positionStatus = "soon";
  }
  positionStatusEl.value = settings.positionStatus || "";
  raf(settings);
  resetTick(settings);
}
