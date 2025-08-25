/* ===================== データ ===================== */
const data = {
  lineName: "阿武隈急行線",
  stations: [
    "福島",
    "卸町",
    "福島学院前",
    "瀬上",
    "向瀬上",
    "高子",
    "上保原",
    "保原",
    "大泉",
    "二井田",
    "新田",
    "梁川",
    "やながわ希望の森公園前",
    "富野",
    "兜",
    "あぶくま",
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

const trainStatus = {
  trainType: "貸　切",
  origin: "福島",
  dest: "丸森",
  next: "梁川",
};

/* ===================== ヘルパ ===================== */
const qs = (sel, root = document) => root.querySelector(sel);
const qsa = (sel, root = document) => [...root.querySelectorAll(sel)];
const vw = (v) => window.innerWidth * (v / 100);

/** 任意軸で max を超えた分だけ縮小（transform 前置にも対応） */
function scaleToFit(el, { maxPx, axis = "x", origin = "center", prefix = "" }) {
  if (!el) return;
  // レイアウト確定後のサイズ取得
  const actual = axis.toLowerCase() === "y" ? el.offsetHeight : el.offsetWidth;

  if (actual > maxPx) {
    const scale = maxPx / actual;
    const scaleStr =
      axis.toLowerCase() === "y" ? `scaleY(${scale})` : `scaleX(${scale})`;
    el.style.transform = `${prefix}${prefix ? " " : ""}${scaleStr}`;
    el.style.transformOrigin = origin;
  } else {
    el.style.transform = prefix; // 既定の transform のみに戻す
    el.style.transformOrigin = origin;
  }
}

function setTexts(map) {
  for (const [id, text] of Object.entries(map)) {
    const el = document.getElementById(id);
    if (el) el.textContent = text ?? "";
  }
}

/* ===================== 初期テキスト反映 ===================== */
setTexts({
  "train-type-kanji": trainStatus.trainType,
  "train-type-kana": data.kana[trainStatus.trainType],
  "train-type-en": data.en[trainStatus.trainType],
  "dest-name-kanji": trainStatus.dest,
  "dest-name-kana": data.kana[trainStatus.dest],
  "dest-name-en": data.en[trainStatus.dest],
  "next-name-kanji": trainStatus.next,
  "next-name-kana": data.kana[trainStatus.next],
  "next-name-en": data.en[trainStatus.next],
});

/* ===================== 駅DOM生成 ===================== */
const lineEl = qs("#line");
for (const name of data.stations) {
  const s = document.createElement("div");
  s.className = "station" + (name === trainStatus.next ? " next" : "");
  s.dataset.name = name;

  const mk = (cls, inner) => {
    const d = document.createElement("div");
    d.className = `name ${cls}`;
    d.innerHTML = `<span class="name-inner ${cls}">${inner}</span>`;
    return d;
  };
  s.appendChild(mk("kanji", name));
  s.appendChild(mk("kana", data.kana[name]));
  s.appendChild(mk("en", data.en[name]));
  lineEl.appendChild(s);
}

/* ===================== スケーリング ===================== */
function applyScaling() {
  // 駅名（縦書きは高さを制限、英語は回転＋横幅を制限）
  qsa(".name-inner").forEach((el) => {
    if (el.classList.contains("en")) {
      // 既定回転を prefix に保持
      scaleToFit(el, {
        maxPx: vw(13),
        axis: "x",
        origin: "bottom left",
        prefix: "rotate(-75deg)",
      });
    } else {
      scaleToFit(el, {
        maxPx: vw(12.5),
        axis: "y",
        origin: "bottom center",
      });
    }
  });

  // 種別
  qsa(".train-type").forEach((el) => {
    scaleToFit(el, { maxPx: vw(18), axis: "x", origin: "center" });
  });

  // 行先（全体ブロックを縮める）
  qsa(".dest").forEach((el) => {
    scaleToFit(el, { maxPx: vw(32.5), axis: "x", origin: "left" });
  });

  // 次駅
  qsa(".next-name").forEach((el) => {
    scaleToFit(el, { maxPx: vw(25), axis: "x", origin: "center" });
  });
}

// レイアウトが変わる操作の直後に 1フレーム待って実行
const rafApply = () => requestAnimationFrame(applyScaling);

/* ===================== 言語切替 ===================== */
const order = ["kanji", "kana", "en"];
let idx = 0;
document.documentElement.setAttribute("data-lang", order[idx]);
rafApply();

setInterval(() => {
  idx = (idx + 1) % order.length;
  document.documentElement.setAttribute("data-lang", order[idx]);
  rafApply();
}, 5000);

/* ===================== 設定画面表示切替 ===================== */
const settings = document.getElementById("settings-panel");
const lineView = document.getElementById("line-panel");
document.querySelector(".train-type-box").addEventListener("dblclick", () => {
  const showingSettings = settings.style.display === "block";
  settings.style.display = showingSettings ? "none" : "block";
  lineView.style.display = showingSettings ? "flex" : "none";
  if (!showingSettings) populateSettingsOnce(); // 初回表示時に選択肢を構築
  rafApply();
});

// --- 設定画面の選択肢を埋める ---
let settingsPopulated = false;
function populateSettingsOnce() {
  if (settingsPopulated) return;
  settingsPopulated = true;

  // 現在地/直前駅
  const curSel = document.getElementById("current-station");
  curSel.innerHTML = data.stations
    .map((s) => `<option value="${s}">${s}</option>`)
    .join("");
  // デフォルトを data.next か origin に寄せる
  curSel.value = data.next ?? data.origin ?? data.stations[0];

  // 停車駅（multiple）
  const stopsSel = document.getElementById("stop-stations");
  stopsSel.innerHTML = data.stations
    .map((s) => `<option value="${s}">${s}</option>`)
    .join("");

  [...stopsSel.options].forEach((o) => (o.selected = true));

  // 種別 初期値
  const ttSel = document.getElementById("train-type-select");
  ttSel.value = data.trainType;
}

/* ===================== リサイズ対応（軽量化） ===================== */
let resizeTid = 0;
window.addEventListener("resize", () => {
  clearTimeout(resizeTid);
  resizeTid = setTimeout(rafApply, 100); // 連打抑制
});

// DOM完成後の最終調整（フォントロード後の差異吸収）
window.addEventListener("load", () => {
  rafApply();
  setTimeout(rafApply, 0); // もう1フレーム余裕を見る
});
