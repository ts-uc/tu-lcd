import { applyScaling } from "./scaling";

const rafApplyScaling = () => requestAnimationFrame(applyScaling);

// 表示対象と、言語の順序
const views = ["name", "map"];
const langs = ["kanji", "kana", "en"];

// 表示更新
export function updateTick(state) {
  // viewの値を計算
  const view = views[Math.floor(state.idx / langs.length) % views.length];
  const lang = langs[state.idx % langs.length];

  // 2つの属性を更新
  document.documentElement.setAttribute("data-view", view);
  document.documentElement.setAttribute("data-lang", lang);

  // 「つぎは」または「まもなく」のときは、ヘッダーの次駅表示を消す
  if (
    state.info.next === "" ||
    (view == "name" && state.settings.positionStatus !== "stopping")
  ) {
    document.getElementById("h-next").style.display = "none";
  } else {
    document.getElementById("h-next").style.display = "grid";
  }
}

// tick初期化
export function resetTick(state) {
  state.idx = 0;
  updateTick(state);
  rafApplyScaling?.();
}

// tick更新
export function tick(state) {
  updateTick(state);
  rafApplyScaling?.();
  state.idx++;
}
