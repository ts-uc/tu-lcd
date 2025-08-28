import { applyScaling } from "./scaling";

const rafApplyScaling = () => requestAnimationFrame(applyScaling);

// 表示対象と、言語の順序
const views = ["name", "map"];
const langs = ["kanji", "kana", "en"];

// tick用インデックス
let idx = 0;

// 表示更新
function update(settings, view, lang) {
  // 2つの属性を更新
  document.documentElement.setAttribute("data-view", view);
  document.documentElement.setAttribute("data-lang", lang);

  // 「つぎは」または「まもなく」のときは、ヘッダーの次駅表示を消す
  if (view == "name" && settings.positionStatus !== "stopping") {
    document.getElementById("h-next").style.display = "none";
  } else {
    document.getElementById("h-next").style.display = "flex";
  }
}

// tick初期化
export function resetTick(settings) {
  idx = 0;
  update(settings, views[0], langs[0]);
  rafApplyScaling?.();
}

// tick更新
export function tick(settings) {
  const view = views[Math.floor(idx / langs.length) % views.length];
  const lang = langs[idx % langs.length];

  update(settings, view, lang);
  rafApplyScaling?.();
  idx = (idx + 1) % (views.length * langs.length);
}
