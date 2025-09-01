import lineData from "./line_data.json" assert { type: "json" };
import typeData from "./type_data.json" assert { type: "json" };

const qs = (sel, root = document) => root.querySelector(sel);

// const type_kana = {
//   "普　通": "ふつう",
//   "快　速": "かいそく",
//   "貸　切": "かしきり",
// };

// const type_en = {
//   "普　通": "Local",
//   "快　速": "Rapid",
//   "貸　切": "Chartered",
// };

function setTexts(map) {
  for (const [id, text] of Object.entries(map)) {
    const el = document.getElementById(id);
    if (el) el.textContent = text ?? "";
  }
}

/* ===================== DOM 更新 ===================== */
function computeOrdered(settings) {
  const data = lineData[settings.line];

  const stations = settings.isInbound
    ? [...data.stations].reverse()
    : data.stations;
  const stops = settings.isInbound
    ? [...settings.stopStations].reverse()
    : settings.stopStations;
  return { stations, stops };
}

function computeStationNames(settings) {
  const { stations, stops } = computeOrdered(settings);
  const posIndex = stations.indexOf(settings.position);
  const current = stations[posIndex];
  let next = "";
  let i;
  if (settings.positionStatus === "stopping") {
    i = posIndex + 1;
  } else {
    i = posIndex;
  }
  for (; i < stations.length; i++) {
    if (stops.includes(stations[i])) {
      next = stations[i];
      break;
    }
  }
  const dest = stops[stops.length - 1] || "";
  return { current, next, dest };
}

function updateHeader(settings, lineData, stationNames) {
  const { current, next, dest } = stationNames;

  setTexts({
    // ヘッダー
    "h-type-kanji": typeData[settings.trainType].kanji,
    "h-type-kana": typeData[settings.trainType].kana,
    "h-type-en": typeData[settings.trainType].en,
    "h-dest-kanji": dest,
    "h-dest-kana": lineData.kana[dest],
    "h-dest-en": lineData.en[dest],
    "h-next-c-kanji": next,
    "h-next-c-kana": lineData.kana[next],
    "h-next-c-en": lineData.en[next],
  });

  if (settings.positionStatus == "next") {
    setTexts({
      "h-next-l-kanji": "つぎは",
      "h-next-l-kana": "つぎは",
      "h-next-l-en": "Next",
    });
  } else if (settings.positionStatus == "soon") {
    setTexts({
      "h-next-l-kanji": "まもなく",
      "h-next-l-kana": "まもなく",
      "h-next-l-en": "Soon",
    });
  } else {
    setTexts({
      "h-next-l-kanji": "つぎは",
      "h-next-l-kana": "つぎは",
      "h-next-l-en": "Next",
    });
  }

  document.documentElement.style.setProperty(
    "--type-bg",
    typeData[settings.trainType].bg
  );
  document.documentElement.style.setProperty(
    "--type-text",
    typeData[settings.trainType].text
  );
}

function updateNamePanel(settings, lineData, stationNames) {
  const { current, next, dest } = stationNames;

  // 駅名パネル
  if (settings.positionStatus == "next") {
    setTexts({
      "n-c-kana": lineData.kana[next],
      "n-l-kanji": "つぎは",
      "n-c-kanji": next,
      "n-r-kanji": "です",
      "n-l-zh-cn": "下一站",
      "n-c-zh-cn": lineData.zhCn[next],
      "n-l-ko": "다음역은",
      "n-c-ko": lineData.ko[next],
      "n-r-ko": "입니다",
      "n-l-en": "Next",
      "n-c-en": lineData.en[next],
    });
  } else if (settings.positionStatus == "soon") {
    setTexts({
      "h-next-l-kanji": "まもなく",
      "h-next-l-kana": "まもなく",
      "h-next-l-en": "Soon",
      "n-c-kana": lineData.kana[next],
      "n-l-kanji": "まもなく",
      "n-c-kanji": next,
      "n-r-kanji": "です",
      "n-l-zh-cn": "马上就到",
      "n-c-zh-cn": lineData.zhCn[next],
      "n-l-ko": "이번 역은",
      "n-c-ko": lineData.ko[next],
      "n-r-ko": "에 도착합니다",
      "n-l-en": "Soon",
      "n-c-en": lineData.en[next],
    });
  } else {
    setTexts({
      "h-next-l-kanji": "つぎは",
      "h-next-l-kana": "つぎは",
      "h-next-l-en": "Next",
      "n-c-kana": lineData.kana[current],
      "n-l-kanji": "",
      "n-c-kanji": current,
      "n-r-kanji": "",
      "n-l-zh-cn": "",
      "n-c-zh-cn": lineData.zhCn[current],
      "n-l-ko": "",
      "n-c-ko": lineData.ko[current],
      "n-r-ko": "",
      "n-l-en": "",
      "n-c-en": lineData.en[current],
    });
  }
}

// 方向矢印の表示種類を判定
function getStationClass(settings, stationNames, i, posIndex, iName) {
  const { current, next, dest } = stationNames;

  if (!settings.stopStations.includes(iName)) {
    return " notstop";
  } else if (settings.positionStatus === "stopping" && iName === current) {
    return " stopping";
  } else if (
    (settings.positionStatus === "next" ||
      settings.positionStatus === "soon") &&
    iName === current
  ) {
    return " next";
  } else if (
    (!settings.isInbound && i <= posIndex) ||
    (settings.isInbound && i >= posIndex)
  ) {
    return " passed";
  } else {
    return "";
  }
}

function getArrowClass(data, settings, i, posIndex) {
  // 角にある場合
  if (
    (settings.isInboundLeft && i === data.stations.length - 1) ||
    (!settings.isInboundLeft && i === 0)
  ) {
    return null;
  }

  if (settings.positionStatus === "stopping") {
    return "";
  }

  if (settings.isInboundLeft) {
    if (settings.isInbound) {
      return i === posIndex ? " left" : "";
    } else {
      return i === posIndex - 1 ? " right" : "";
    }
  } else {
    if (settings.isInbound) {
      return i === posIndex + 1 ? " right" : "";
    } else {
      return i === posIndex ? " left" : "";
    }
  }
}

export function updateDOMs(settings) {
  const stationNames = computeStationNames(settings);
  const data = lineData[settings.line];

  updateHeader(settings, data, stationNames);
  updateNamePanel(settings, data, stationNames);

  // 路線図
  const lineEl = qs("#m-line");
  lineEl.innerHTML = "";

  // 現在地駅の起点からの駅数
  const posIndex = data.stations.indexOf(settings.position);

  for (let i_tmp = 0; i_tmp < data.stations.length; i_tmp++) {
    const i = settings.isInboundLeft ? i_tmp : data.stations.length - i_tmp - 1;

    const iName = data.stations[i];

    const cls = getStationClass(settings, stationNames, i, posIndex, iName);

    lineEl.insertAdjacentHTML(
      "beforeend",
      `<div class="m-station${cls}" data-name="${iName}">
        <div class="m-dot${cls}"></div>
        <span class="m-name kanji${cls}">${iName}</span>
        <span class="m-name kana${cls}">${data.kana[iName]}</span>
        <span lang="en" class="m-name en${cls}">${data.en[iName]}</span>
      </div>`
    );

    // 方向矢印を追加
    const arrowClass = getArrowClass(data, settings, i, posIndex);
    if (arrowClass === "") {
      lineEl.insertAdjacentHTML(
        "beforeend",
        `<div class="m-pos-arrow-box"></div>`
      );
    } else if (arrowClass != null) {
      lineEl.insertAdjacentHTML(
        "beforeend",
        `<div class="m-pos-arrow-box">
          <div class="m-pos-arrow${arrowClass}"></div>
        </div>`
      );
    }
  }
}
