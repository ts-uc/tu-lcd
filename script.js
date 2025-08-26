/* ===================== データ ===================== */
const data = {
  lineName: "阿武隈急行線",
  stations: [
    // "福島",
    // "卸町",
    // "福島学院前",
    // "瀬上",
    // "向瀬上",
    // "高子",
    // "上保原",
    // "保原",
    // "大泉",
    // "二井田",
    // "新田",
    // "梁川",
    // "やながわ希望の森公園前",
    // "富野",
    // "兜",
    // "あぶくま",
    "丸森",
    "北丸森",
    "南角田",
    "角田",
    "横倉",
    "岡",
    "東船岡",
    "槻木",
  ],
  kana: {
    "普　通": "ふつう",
    "快　速": "かいそく",
    "貸　切": "かしきり",
    福島: "ふくしま",
    卸町: "おろしまち",
    福島学院前: "ふくしまがくいんまえ",
    瀬上: "せのうえ",
    向瀬上: "むかいせのうえ",
    高子: "たかこ",
    上保原: "かみほばら",
    保原: "ほばら",
    大泉: "おおいずみ",
    二井田: "にいだ",
    新田: "にった",
    梁川: "やながわ",
    やながわ希望の森公園前: "やながわきぼうのもりこうえんまえ",
    富野: "とみの",
    兜: "かぶと",
    あぶくま: "あぶくま",
    丸森: "まるもり",
    北丸森: "きたまるもり",
    南角田: "みなみかくだ",
    角田: "かくだ",
    横倉: "よこくら",
    岡: "おか",
    東船岡: "ひがしふなおか",
    槻木: "つきのき",
  },
  en: {
    "普　通": "Local",
    "快　速": "Rapid",
    "貸　切": "Chartered",
    福島: "Fukushima",
    卸町: "Oroshimachi",
    福島学院前: "Fukushima Gakuin-mae",
    瀬上: "Senoue",
    向瀬上: "Mukaisenoue",
    高子: "Takako",
    上保原: "Kamihobara",
    保原: "Hobara",
    大泉: "Ōizumi",
    二井田: "Niida",
    新田: "Nitta",
    梁川: "Yanagawa",
    やながわ希望の森公園前: "Yanagawa Kibōnomori Kōen-mae",
    富野: "Tomino",
    兜: "Kabuto",
    あぶくま: "Abukuma",
    丸森: "Marumori",
    北丸森: "Kita-Marumori",
    南角田: "Minami-Kakuda",
    角田: "Kakuda",
    横倉: "Yokokura",
    岡: "Oka",
    東船岡: "Higashi-Funaoka",
    槻木: "Tsukinoki",
  },
};

/* ===================== 設定変数（単一情報源） ===================== */
const settings = {
  isInboundLeft: true,
  route: null,
  auto: null,
  isInbound: false,
  trainType: "普　通",
  position: data.stations[0],
  stopStations: [...data.stations],
};

/* ===================== ヘルパ ===================== */
const qs = (sel, root = document) => root.querySelector(sel);
const qsa = (sel, root = document) => [...root.querySelectorAll(sel)];
const vw = (v) => window.innerWidth * (v / 100);

/** 任意軸で max を超えた分だけ縮小（transform 前置にも対応） */
function scaleToFit(el, { maxPx, axis = "x", origin = "center", prefix = "" }) {
  if (!el) return;
  const a = axis.toLowerCase();
  const actual = a === "y" ? el.offsetHeight : el.offsetWidth;
  if (actual > maxPx) {
    const scale = maxPx / actual;
    const scaleStr = a === "y" ? `scaleY(${scale})` : `scaleX(${scale})`;
    el.style.transform = `${prefix}${prefix ? " " : ""}${scaleStr}`;
  } else {
    el.style.transform = prefix;
  }
  el.style.transformOrigin = origin;
}

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
  let next = "";
  for (let i = posIndex + 1; i < stations.length; i++) {
    if (stops.includes(stations[i])) {
      next = stations[i];
      break;
    }
  }
  const dest = stops[stops.length - 1] || "";
  return { next, dest, orderedStations: stations };
}

function updateDOMs() {
  const { next, dest, orderedStations } = computeNextDest();

  // ヘッダー
  setTexts({
    "train-type-kanji": settings.trainType,
    "train-type-kana": data.kana[settings.trainType],
    "train-type-en": data.en[settings.trainType],
    "dest-name-kanji": dest,
    "dest-name-kana": data.kana[dest],
    "dest-name-en": data.en[dest],
    "next-name-kanji": next,
    "next-name-kana": data.kana[next],
    "next-name-en": data.en[next],
  });

  // 路線図
  const lineEl = qs("#line");
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
    } else if (i <= posIndex) {
      cls += " passed";
    }

    const s = document.createElement("div");
    s.className = `station${cls}`;
    s.dataset.name = name;

    const dot = document.createElement("div");
    dot.className = `dot ${cls}`;
    s.appendChild(dot);

    const mk = (cls, inner) => {
      const d = document.createElement("div");
      d.className = `name ${cls}`;
      d.innerHTML = `<span class="name-inner ${cls}">${inner ?? ""}</span>`;
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
      let cls = "pos-arrow";

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
function applyScaling() {
  // 駅名
  qsa(".name-inner").forEach((el) => {
    if (el.classList.contains("en")) {
      scaleToFit(el, {
        maxPx: vw(13),
        axis: "x",
        origin: "bottom left",
        prefix: "rotate(-75deg)",
      });
    } else {
      scaleToFit(el, { maxPx: vw(12.5), axis: "y", origin: "bottom center" });
    }
  });
  // 種別
  qsa(".train-type").forEach((el) => {
    scaleToFit(el, { maxPx: vw(18), axis: "x", origin: "center" });
  });
  // 行先
  qsa(".dest").forEach((el) => {
    scaleToFit(el, { maxPx: vw(32.5), axis: "x", origin: "left" });
  });
  // 次駅
  qsa(".next-name").forEach((el) => {
    scaleToFit(el, { maxPx: vw(25), axis: "x", origin: "center" });
  });
}
const rafApply = () => requestAnimationFrame(applyScaling);

/* ===================== 言語切替 ===================== */
const order = ["kanji", "kana", "en"];
let idx = 0;
setInterval(() => {
  idx = (idx + 1) % order.length;
  document.documentElement.setAttribute("data-lang", order[idx]);
  rafApply();
}, 5000);

/* ===================== 設定画面表示切替 ===================== */
// ※ 初期値セット処理は削除（populateSettingsOnce も呼び出しもしない）
const elSettings = document.getElementById("settings-panel");
const elLineView = document.getElementById("line-panel");
document.querySelector(".train-type-box").addEventListener("dblclick", () => {
  const showingSettings = elSettings.style.display === "block";
  elSettings.style.display = showingSettings ? "none" : "block";
  elLineView.style.display = showingSettings ? "flex" : "none";
  rafApply();
});

/* ===================== 設定フォーム要素参照 ===================== */
const layoutDirEls = document.querySelectorAll('input[name="layout-dir"]');
const routeEl = document.getElementById("route-select");
const autoEl = document.getElementById("auto-select");
const directionEls = document.querySelectorAll('input[name="direction"]');
const trainTypeEl = document.getElementById("train-type-select");
const currentStationEl = document.getElementById("current-station");
const stopStationsEl = document.getElementById("stop-stations");

/* ===== settings → フォーム反映 ===== */
function applySettings() {
  // 設置方向
  qs('input[name="layout-dir"][value="inbound-left"]').checked =
    !!settings.isInboundLeft;
  qs('input[name="layout-dir"][value="inbound-right"]').checked =
    !settings.isInboundLeft;

  // 進行方向
  qs('input[name="direction"][value="inbound"]').checked = !!settings.isInbound;
  qs('input[name="direction"][value="outbound"]').checked = !settings.isInbound;

  // その他
  routeEl.value = settings.route || "";
  autoEl.value = settings.auto || "";
  trainTypeEl.value = settings.trainType || "";
  currentStationEl.value = settings.position || "";

  // multiple select
  Array.from(stopStationsEl.options).forEach((opt) => {
    opt.selected = settings.stopStations.includes(opt.value);
  });
}

/* ===== フォーム → settings 反映 ===== */
function updateSettings() {
  const layoutDirChecked = qs('input[name="layout-dir"]:checked');
  settings.isInboundLeft = layoutDirChecked?.value === "inbound-left";

  const directionChecked = qs('input[name="direction"]:checked');
  settings.isInbound = directionChecked?.value === "inbound";

  settings.route = routeEl.value || null;
  settings.auto = autoEl.value || null;
  settings.trainType = trainTypeEl.value || settings.trainType;
  settings.position = currentStationEl.value || settings.position;

  settings.stopStations = Array.from(stopStationsEl.selectedOptions).map(
    (o) => o.value
  );

  rafUpdate();
  rafApply();
}

// 変更監視
[...layoutDirEls, ...directionEls].forEach((el) =>
  el.addEventListener("change", updateSettings)
);
[routeEl, autoEl, trainTypeEl, currentStationEl, stopStationsEl].forEach((el) =>
  el.addEventListener("change", updateSettings)
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
  applySettings(); // ←初期値は settings を反映
  rafUpdate();
  document.documentElement.setAttribute("data-lang", order[idx]);
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
