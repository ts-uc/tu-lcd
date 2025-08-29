const btn = document.getElementById("fs-btn");
const root = document.documentElement;

export function isFullscreen() {
  return !!(document.fullscreenElement || document.webkitFullscreenElement);
}
export function updateLabel() {
  btn.textContent = isFullscreen() ? "全画面表示を解除" : "全画面表示に切替";
  btn.setAttribute("aria-pressed", String(isFullscreen()));
}

export async function onClickFsButton() {
  try {
    if (!isFullscreen()) {
      if (root.requestFullscreen) await root.requestFullscreen();
      else if (root.webkitRequestFullscreen)
        await root.webkitRequestFullscreen(); // iOS Safari
    } else {
      if (document.exitFullscreen) await document.exitFullscreen();
      else if (document.webkitExitFullscreen)
        await document.webkitExitFullscreen(); // iOS Safari
    }
  } catch (e) {
    console.error("Fullscreen error:", e);
  } finally {
    // 一部ブラウザで即時反映しないことがあるので保険
    updateLabel();
  }
}
