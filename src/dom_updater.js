import lineData from "./line_data.json" assert { type: "json" };
const data = lineData.abukyu;

const qs = (sel, root = document) => root.querySelector(sel);

function setTexts(map) {
  for (const [id, text] of Object.entries(map)) {
    const el = document.getElementById(id);
    if (el) el.textContent = text ?? "";
  }
}

/* ===================== DOM 更新 ===================== */
function computeOrdered(settings) {
  const stations = settings.isInbound
    ? [...data.stations].reverse()
    : data.stations;
  const stops = settings.isInbound
    ? [...settings.stopStations].reverse()
    : settings.stopStations;
  return { stations, stops };
}

function computeNextDest(settings) {
  const { stations, stops } = computeOrdered(settings);
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

export function updateDOMs(settings) {
  const { current, next, dest } = computeNextDest(settings);

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
