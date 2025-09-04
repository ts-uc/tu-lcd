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

const lineOrder =
  Array.isArray(LINE_ORDER) && LINE_ORDER.length
    ? LINE_ORDER
    : inferLineOrder(trainMap);

// trains（←選択された列車だけ）
const trainsOut = {};
for (const id of selectedTrains) {
  if (!trainMap[id]) continue;
  trainsOut[id] = {
    line: inputObj.line_name,
    stop_stations: buildStopStations(trainMap[id], lineOrder),
    is_inbound: Number(id) % 2 === 0,
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
