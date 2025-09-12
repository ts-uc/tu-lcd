import diagramData from "./data/diagram_data.json" assert { type: "json" };
import { applySettings } from "./settings";

let timers = []; // setTimeout ハンドル格納

// HH:MM(:SS) → 今日の日付の Date
function timeToTodayDate(hms) {
  const [h, m, s = 0] = hms.split(":").map(Number);
  const d = new Date();
  d.setHours(h, m, s, 0);
  return d;
}

// diagram を今日の Date で昇順配列に
function buildEvents(data) {
  return Object.entries(data.diagram)
    .map(([hms, payload]) => ({
      atHMS: hms,
      at: timeToTodayDate(hms),
      ...payload,
    }))
    .sort((a, b) => a.at - b.at);
}

// 表示更新
function applyAutoSettings(ev, state) {
  const settings = state.settings;
  const train = diagramData[settings.auto].trains[ev.train];
  settings.line = train.line;
  settings.isInbound = train.is_inbound;
  settings.trainType = train.type || "普通";
  settings.position = ev.name;
  settings.positionStatus = ev.status;
  settings.stopStations = train.stop_stations;
  applySettings(state);
}

// いま時刻に対して直近（過去）のイベントを適用
function applyLatestPast(events, state) {
  const now = new Date();
  let last = null;
  for (const ev of events) {
    if (ev.at <= now) last = ev;
    else break;
  }
  if (last) applyAutoSettings(last, state);
}

// リアルタイムスケジュール開始
function startRealtime(events, state) {
  stopRealtime(); // 念のためクリア
  const now = new Date();
  for (const ev of events) {
    const delay = ev.at - now;
    if (delay >= 0) {
      const h = setTimeout(() => applyAutoSettings(ev, state), delay);
      timers.push(h);
    }
  }
}

// すべての予約を解除
function stopRealtime() {
  for (const t of timers) clearTimeout(t);
  timers = [];
}

// UI イベント
export function onChangeAutoSettings(state) {
  if (state.settings.auto === "manual") {
    stopRealtime();
  } else {
    const events = buildEvents(diagramData[state.settings.auto]);
    applyLatestPast(events, state); // まず直近状態に
    startRealtime(events, state);
  }
}

// ページ離脱時のクリーンアップ
addEventListener("beforeunload", stopRealtime);
