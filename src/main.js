import lineData from "./line_data.json" assert { type: "json" };
import { rafApply } from "./scaling.js";
import { applySettings, getSettings, settingSelectors } from "./settings.js";

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
const qs = (sel, root = document) => root.querySelector(sel);

function setTexts(map) {
  for (const [id, text] of Object.entries(map)) {
    const el = document.getElementById(id);
    if (el) el.textContent = text ?? "";
  }
}

/* ===================== DOM 更新 ===================== */
function computeOrdered() {
  const stations = settings.isInbound
    ? [...data.stations].reverse()
    : data.stations;
  const stops = settings.isInbound
    ? [...settings.stopStations].reverse()
    : settings.stopStations;
  return { stations, stops };
}

function computeNextDest() {
  const { stations, stops } = computeOrdered();
  const posIndex = stations.indexOf(settings.position);
  const current = stations[posIndex];
  let next = "";
  for (let i = posIndex + 1; i < stations.length; i++) {
    if (stops.includes(stations[i])) {
      next = stations[i];
      break;
    }
  }
  const dest = stops[stops.length - 1] || "";
  return { current, next, dest };
}

function updateDOMs() {
  const { current, next, dest } = computeNextDest();

  setTexts({
    // ヘッダー
    "h-type-kanji": settings.trainType,
    "h-type-kana": data.kana[settings.trainType],
    "h-type-en": data.en[settings.trainType],
    "h-dest-kanji": dest,
    "h-dest-kana": data.kana[dest],
    "h-dest-en": data.en[dest],
    "h-next-c-kanji": next,
    "h-next-c-kana": data.kana[next],
    "h-next-c-en": data.en[next],
  });

  // 駅名パネル
  if (settings.positionStatus == "next") {
    setTexts({
      "h-next-l-kanji": "つぎは",
      "h-next-l-kana": "つぎは",
      "h-next-l-en": "Next",
      "n-c-kana": data.kana[next],
      "n-l-kanji": "つぎは",
      "n-c-kanji": next,
      "n-r-kanji": "です",
      "n-l-zh-cn": "下一站",
      "n-c-zh-cn": data.zhCn[next],
      "n-l-ko": "다음역은",
      "n-c-ko": data.ko[next],
      "n-r-ko": "입니다",
      "n-l-en": "Next",
      "n-c-en": data.en[next],
    });
  } else if (settings.positionStatus == "soon") {
    setTexts({
      "h-next-l-kanji": "まもなく",
      "h-next-l-kana": "まもなく",
      "h-next-l-en": "Soon",
      "n-c-kana": data.kana[next],
      "n-l-kanji": "まもなく",
      "n-c-kanji": next,
      "n-r-kanji": "です",
      "n-l-zh-cn": "马上就到",
      "n-c-zh-cn": data.zhCn[next],
      "n-l-ko": "이번 역은",
      "n-c-ko": data.ko[next],
      "n-r-ko": "에 도착합니다",
      "n-l-en": "Soon",
      "n-c-en": data.en[next],
    });
  } else {
    setTexts({
      "h-next-l-kanji": "つぎは",
      "h-next-l-kana": "つぎは",
      "h-next-l-en": "Next",
      "n-c-kana": data.kana[current],
      "n-l-kanji": "",
      "n-c-kanji": current,
      "n-r-kanji": "",
      "n-l-zh-cn": "",
      "n-c-zh-cn": data.zhCn[current],
      "n-l-ko": "",
      "n-c-ko": data.ko[current],
      "n-r-ko": "",
      "n-l-en": "",
      "n-c-en": data.en[current],
    });
  }

  // 路線図
  const lineEl = qs("#m-line");
  lineEl.innerHTML = "";

  const posIndex = data.stations.indexOf(settings.position);

  for (let i_tmp = 0; i_tmp < data.stations.length; i_tmp++) {
    const i = settings.isInboundLeft ? i_tmp : data.stations.length - i_tmp - 1;

    const name = data.stations[i];

    let cls = "";
    if (name === next) {
      cls += " next";
    }
    if (!settings.stopStations.includes(name)) {
      cls += " notstop";
    } else if (
      (!settings.isInbound && i <= posIndex) ||
      (settings.isInbound && i >= posIndex)
    ) {
      cls += " passed";
    }

    const s = document.createElement("div");
    s.className = `m-station${cls}`;
    s.dataset.name = name;

    const dot = document.createElement("div");
    dot.className = `m-dot ${cls}`;
    s.appendChild(dot);

    const mk = (cls, inner) => {
      const d = document.createElement("div");
      d.className = `m-name-box ${cls}`;
      d.innerHTML = `<span class="m-name ${cls}">${inner ?? ""}</span>`;
      return d;
    };
    s.appendChild(mk(`kanji${cls}`, name));
    s.appendChild(mk(`kana${cls}`, data.kana[name]));
    s.appendChild(mk(`en${cls}`, data.en[name]));
    lineEl.appendChild(s);

    const sIL = settings.isInboundLeft;
    const sI = settings.isInbound;
    const last = data.stations.length - 1;

    if (!((sIL && i === last) || (!sIL && i === 0))) {
      // 端では何もしない
      const posArrow = document.createElement("div");
      let cls = "m-pos-arrow";

      // 右向き：表示の左＝上り かどうかと、進行が食い違うとき
      if (sI !== sIL && i === posIndex) {
        cls += " right";
      }
      // 左向き：表示の左＝上り と進行が一致するとき
      else if (sI === sIL && i === posIndex + (sIL ? -1 : 1)) {
        cls += " left";
      }

      posArrow.className = cls;
      lineEl.appendChild(posArrow);
    }
  }
}
const rafUpdate = () => requestAnimationFrame(updateDOMs);

/* ===================== スケーリング ===================== */

/* ===================== 言語切替 ===================== */
// 表示対象と、言語の順序
const views = ["name", "map"];
const langs = ["kanji", "kana", "en"];

let idx = 0;
function tick() {
  const view = views[Math.floor(idx / langs.length) % views.length];
  const lang = langs[idx % langs.length];

  // 2つの属性を更新
  document.documentElement.setAttribute("data-view", view);
  document.documentElement.setAttribute("data-lang", lang);

  if (view == "name" && settings.positionStatus !== "stopping") {
    document.getElementById("h-next").style.display = "none";
  } else {
    document.getElementById("h-next").style.display = "flex";
  }

  rafApply?.(); // そのまま呼ぶ（未定義なら無視）
  idx = (idx + 1) % (views.length * langs.length);
}

// 初回反映 & 5秒ごとに更新
tick();
setInterval(tick, 5000);

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
  document.documentElement.setAttribute("data-view", views[0]);
  document.documentElement.setAttribute("data-lang", langs[0]);
  rafApply();
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
