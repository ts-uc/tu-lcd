const qs = (sel, root = document) => root.querySelector(sel);

/* ===================== 設定フォーム要素参照 ===================== */
const layoutDirEls = document.querySelectorAll('input[name="layout-dir"]');
const routeEl = document.getElementById("route-select");
const autoEl = document.getElementById("auto-select");
const directionEls = document.querySelectorAll('input[name="direction"]');
const trainTypeEl = document.getElementById("train-type-select");
const currentStationEl = document.getElementById("current-station");
const positionStatusEls = document.querySelectorAll(
  'input[name="position-status"]'
);
const stopStationsEl = document.getElementById("stop-stations");

export const settingSelectors = [
  ...layoutDirEls,
  ...directionEls,
  ...positionStatusEls,
  routeEl,
  autoEl,
  trainTypeEl,
  currentStationEl,
  stopStationsEl,
];

/* ===== settings → フォーム反映 ===== */
export function applySettings(settings) {
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

  // 状態
  if (settings.positionStatus != null) {
    positionStatusEls.forEach((el) => {
      el.checked = el.value === settings.positionStatus;
    });
  } else {
    // 何も未選択なら先頭を既定に（任意）
    const checked = qs('input[name="position-status"]:checked');
    if (!checked && positionStatusEls[0]) positionStatusEls[0].checked = true;
  }

  // multiple select
  Array.from(stopStationsEl.options).forEach((opt) => {
    opt.selected = settings.stopStations.includes(opt.value);
  });
}

/* ===== フォーム → settings 反映 ===== */
export function getSettings() {
  return {
    isInboundLeft:
      qs('input[name="layout-dir"]:checked')?.value === "inbound-left",
    isInbound: qs('input[name="direction"]:checked')?.value === "inbound",
    route: routeEl.value || null,
    auto: autoEl.value || null,
    trainType: trainTypeEl.value || "",
    position: currentStationEl.value || "",
    positionStatus: qs('input[name="position-status"]:checked')?.value ?? "",
    stopStations: Array.from(stopStationsEl.selectedOptions).map(
      (o) => o.value
    ),
  };
}
