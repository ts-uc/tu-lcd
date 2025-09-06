import { applyScaling } from "./scaling";

const rafApplyScaling = () => requestAnimationFrame(applyScaling);

// 表示対象と、言語の順序
const views = ["name", "map"];
const langs = ["kanji", "kana", "en"];

// 表示更新
export function updateTick(state) {
  // viewの値を計算
  const tickDataList = [
    { view: "name", lang: "kanji", nLang: "zh-cn" },
    { view: "name", lang: "kana", nLang: "ko" },
    { view: "name", lang: "en", nLang: "en" },
    { view: "map", lang: "kanji", nLang: "zh-cn" },
    { view: "map", lang: "kana", nLang: "ko" },
    { view: "map", lang: "en", nLang: "en" },
  ];

  const tickData = tickDataList[state.tick.idx % tickDataList.length];

  // 2つの属性を更新
  document.documentElement.setAttribute("data-view", tickData.view);
  document.documentElement.setAttribute("data-lang", tickData.lang);
  document.documentElement.setAttribute("data-n-lang", tickData.nLang);

  // 「つぎは」または「まもなく」のときは、ヘッダーの次駅表示を消す
  if (
    state.info.next === "" ||
    (tickData.view == "name" && state.settings.positionStatus !== "stopping")
  ) {
    document.getElementById("h-next").style.display = "none";
  } else {
    document.getElementById("h-next").style.display = "grid";
  }
}

// tick初期化
export function resetTick(state) {
  state.tick.idx = 0;
  updateTick(state);
  rafApplyScaling?.();
}

// tick更新
export function tick(state) {
  updateTick(state);
  rafApplyScaling?.();
  state.tick.idx++;
}
