// build-diagram.mjs
// 使い方: node build-diagram.mjs input.json 2,23
//   第2引数: 入力JSONファイルパス
//   第3引数: diagramに載せる列車ID（カンマ区切り、省略時は全列車）

import { readFile } from "node:fs/promises";

// ======== 設定 ========
const LINE_ORDER = null; // 上り順を固定したい場合は ["石越","荒町","若柳"] のように指定
const ARR_LEAD_SEC = 15; // arr が無い停車駅の到着 = dep - 15秒
const SOON_LEAD_SEC = 45; // soon は到着の 45秒 前
// =======================

const inputPath = process.argv[2] || "input.json";
const selectedArg = process.argv[3] || null;

const toSec = (t) => {
  const p = t.split(":").map(Number);
  if (p.length === 2) return p[0] * 3600 + p[1] * 60;
  if (p.length === 3) return p[0] * 3600 + p[1] * 60 + p[2];
  throw new Error(`不正な時刻: ${t}`);
};
const fmt = (sec) => {
  const pad = (n) => String(n).padStart(2, "0");
  const s = ((sec % 60) + 60) % 60;
  const m = ((Math.floor(sec / 60) % 60) + 60) % 60;
  const h = ((Math.floor(sec / 3600) % 24) + 24) % 24;
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
};

function normalizeTrainMap(obj) {
  const looksTrainMap = Object.values(obj).every(
    (v) => v && typeof v === "object" && Array.isArray(v.timetable)
  );
  if (looksTrainMap) return obj;
  const ks = Object.keys(obj);
  if (ks.length === 1 && obj[ks[0]] && typeof obj[ks[0]] === "object") {
    const inner = obj[ks[0]];
    const looks = Object.values(inner).every(
      (v) => v && typeof v === "object" && Array.isArray(v.timetable)
    );
    if (looks) return inner;
  }
  throw new Error("入力JSONの構造が想定外です。");
}

function inferLineOrder(trainMap) {
  const adj = new Map();
  const add = (a, b) => {
    if (!adj.has(a)) adj.set(a, new Set());
    if (!adj.has(b)) adj.set(b, new Set());
    adj.get(a).add(b);
    adj.get(b).add(a);
  };
  for (const obj of Object.values(trainMap)) {
    const seq = obj.timetable.map((t) => t.name).filter(Boolean);
    for (let i = 0; i + 1 < seq.length; i++) add(seq[i], seq[i + 1]);
  }
  if (adj.size === 0) return [];
  const ends = [...adj.entries()]
    .filter(([, s]) => s.size === 1)
    .map(([k]) => k);
  let cur = ends.length ? ends.sort()[0] : [...adj.keys()].sort()[0];
  const order = [];
  const seen = new Set();
  let prev = null;
  while (cur && !seen.has(cur)) {
    order.push(cur);
    seen.add(cur);
    const nxt = [...(adj.get(cur) || [])].filter(
      (x) => x !== prev && !seen.has(x)
    )[0];
    prev = cur;
    cur = nxt;
  }
  return order;
}

// 末尾（最終停車駅）を取得（pass は除外）
function lastStoppedStation(tt) {
  for (let i = tt.length - 1; i >= 0; i--) {
    const it = tt[i];
    if (it && it.name && it.pass !== true) return it.name;
  }
  return null;
}

// 路線順序の向きを「上り端 → 下り端」に統一する
// 上り端＝偶数（上り）列車の終着として最頻出する駅
function orientLineOrder(order, trainMap, selectedTrains) {
  if (!order || order.length < 2) return order;

  // 上り（偶数）列車の終着候補を集計
  const freq = new Map();
  const ids = selectedTrains?.length ? selectedTrains : Object.keys(trainMap);
  for (const id of ids) {
    if (!trainMap[id]) continue;
    const numericId = parseInt(String(id).replace(/\D/g, ""), 10);
    if (Number.isNaN(numericId) || numericId % 2 !== 0) continue; // 偶数のみ
    const term = lastStoppedStation(trainMap[id].timetable || []);
    if (!term) continue;
    freq.set(term, (freq.get(term) || 0) + 1);
  }

  if (freq.size === 0) return order; // 判定材料がなければそのまま

  // 最頻出の終着駅を上り端とみなす
  const inboundTerminal = [...freq.entries()].sort((a, b) => b[1] - a[1])[0][0];

  // その駅が order のどちらの端にあるかで向きを決める
  if (order[0] === inboundTerminal) return order; // 既に「上り端 → 下り端」
  if (order[order.length - 1] === inboundTerminal) return [...order].reverse();

  // 端に見つからない（データ断片的など）場合はそのまま
  return order;
}

function buildStopStations(obj, lineOrder) {
  const stops = obj.timetable
    .filter((t) => t && t.name && t.pass !== true)
    .map((t) => t.name);
  const uniq = [...new Set(stops)];
  if (!lineOrder || !lineOrder.length) return uniq;
  const pos = Object.fromEntries(lineOrder.map((n, i) => [n, i]));
  return uniq.sort((a, b) => (pos[a] ?? 1e9) - (pos[b] ?? 1e9));
}

const raw = await readFile(inputPath, "utf8");
const inputObj = JSON.parse(raw);
const trainMap = normalizeTrainMap(inputObj.diagram);

// diagram 対象にする列車
const selectedTrains = selectedArg
  ? selectedArg
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
  : Object.keys(trainMap).sort((a, b) => Number(a) - Number(b));

// 路線順序の推定 → 上り向きに正規化
let lineOrder =
  Array.isArray(LINE_ORDER) && LINE_ORDER.length
    ? LINE_ORDER
    : inferLineOrder(trainMap);
lineOrder = orientLineOrder(lineOrder, trainMap, selectedTrains);

// trains（←選択された列車だけ）
const trainsOut = {};
for (const id of selectedTrains) {
  if (!trainMap[id]) continue;

  // 数字だけ抽出（例: "M23" → "23"）
  const numericId = parseInt(String(id).replace(/\D/g, ""), 10);

  trainsOut[id] = {
    line: inputObj.line_name,
    // ★ 常に「上り → 下り」の lineOrder に基づいて整列
    stop_stations: buildStopStations(trainMap[id], lineOrder),
    // 数字が取れた場合は偶数判定、取れない場合は false などデフォルトに
    is_inbound: !isNaN(numericId) ? numericId % 2 === 0 : false,
  };
}

// diagram
const diagramMap = new Map();
const setEvent = (sec, payload) => diagramMap.set(sec, payload);

// 00:00:00 に最初列車の始発駅 stopping
if (selectedTrains.length) {
  const firstId = selectedTrains[0];
  const origin = trainMap[firstId]?.timetable?.[0]?.name;
  if (origin) setEvent(0, { train: firstId, status: "stopping", name: origin });
}

for (let ti = 0; ti < selectedTrains.length; ti++) {
  const id = selectedTrains[ti];
  const tt = trainMap[id]?.timetable || [];
  if (tt.length < 1) continue;

  let terminalArrSec = null;

  for (let i = 0; i < tt.length; i++) {
    const cur = tt[i];
    const nxt = i + 1 < tt.length ? tt[i + 1] : null;

    if (cur.dep && nxt?.name) {
      const depSec = toSec(cur.dep);
      setEvent(depSec, { train: id, status: "next", name: nxt.name });
    }

    if (nxt && nxt.pass !== true) {
      let arrSec = null;
      if (nxt.arr) arrSec = toSec(nxt.arr);
      else if (nxt.dep) arrSec = toSec(nxt.dep) - ARR_LEAD_SEC;

      if (arrSec != null) {
        const soonSec = arrSec - SOON_LEAD_SEC;
        setEvent(soonSec, { train: id, status: "soon", name: nxt.name });
        setEvent(arrSec, { train: id, status: "stopping", name: nxt.name });
        terminalArrSec = arrSec;
      }
    }
  }

  const nextId = selectedTrains[ti + 1];
  if (nextId && terminalArrSec != null) {
    const nextOrigin = trainMap[nextId]?.timetable?.[0]?.name;
    if (nextOrigin) {
      setEvent(terminalArrSec + 60, {
        train: nextId,
        status: "stopping",
        name: nextOrigin,
      });
    }
  }
}

// 整形
const outDiagram = {};
[...diagramMap.entries()]
  .sort((a, b) => a[0] - b[0])
  .forEach(([sec, p]) => {
    outDiagram[fmt(sec)] = p;
  });

const out = { trains: trainsOut, diagram: outDiagram };
console.log(JSON.stringify(out, null, 2));
