import { TILE, COLS, ROWS, T_FLOOR, T_WALL, T_EXIT, T_CHAIR } from '../config.ts';

function mulberry32(a: number): () => number {
  return function (): number {
    a |= 0;
    a = (a + 0x6D2B79F5) | 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface FloorData {
  map: number[][];
  rng: () => number;
  spawn: { x: number; y: number };
}

interface BspNode {
  x: number; y: number; w: number; h: number;
  left?: BspNode;
  right?: BspNode;
  room?: { x: number; y: number; w: number; h: number };
}

const MIN_LEAF = 5;
const ROOM_PAD = 1;
const ROOM_SHRINK = 1;

type SplitOrientation = 'horizontal' | 'vertical';

function pickSplitOrientation(node: BspNode, rng: () => number): SplitOrientation | null {
  const canH = node.h >= MIN_LEAF * 2;
  const canV = node.w >= MIN_LEAF * 2;
  if (!canH && !canV) return null;
  if (node.w > node.h * 1.25 && canV) return 'vertical';
  if (node.h > node.w * 1.25 && canH) return 'horizontal';
  return canH && (!canV || rng() < 0.5) ? 'horizontal' : 'vertical';
}

function splitBsp(node: BspNode, rng: () => number, depth: number): void {
  if (depth <= 0) return;
  const orient = pickSplitOrientation(node, rng);
  if (orient === null) return;

  if (orient === 'horizontal') {
    const split = MIN_LEAF + Math.floor(rng() * (node.h - MIN_LEAF * 2 + 1));
    node.left  = { x: node.x, y: node.y,           w: node.w, h: split           };
    node.right = { x: node.x, y: node.y + split,   w: node.w, h: node.h - split  };
  } else {
    const split = MIN_LEAF + Math.floor(rng() * (node.w - MIN_LEAF * 2 + 1));
    node.left  = { x: node.x,         y: node.y, w: split,          h: node.h };
    node.right = { x: node.x + split, y: node.y, w: node.w - split, h: node.h };
  }
  splitBsp(node.left, rng, depth - 1);
  splitBsp(node.right, rng, depth - 1);
}

function placeRooms(node: BspNode, m: number[][], rng: () => number): void {
  if (node.left || node.right) {
    if (node.left)  placeRooms(node.left,  m, rng);
    if (node.right) placeRooms(node.right, m, rng);
    return;
  }
  const padL = ROOM_PAD + Math.floor(rng() * (ROOM_SHRINK + 1));
  const padR = ROOM_PAD + Math.floor(rng() * (ROOM_SHRINK + 1));
  const padT = ROOM_PAD + Math.floor(rng() * (ROOM_SHRINK + 1));
  const padB = ROOM_PAD + Math.floor(rng() * (ROOM_SHRINK + 1));
  const rx = node.x + padL;
  const ry = node.y + padT;
  const rw = Math.max(3, node.w - padL - padR);
  const rh = Math.max(3, node.h - padT - padB);
  node.room = { x: rx, y: ry, w: rw, h: rh };
  for (let y = ry; y < ry + rh; y++) {
    for (let x = rx; x < rx + rw; x++) {
      m[y][x] = T_FLOOR;
    }
  }
}

function pickAnchor(node: BspNode, rng: () => number): { x: number; y: number } {
  if (node.room) {
    const r = node.room;
    return {
      x: r.x + 1 + Math.floor(rng() * Math.max(1, r.w - 2)),
      y: r.y + 1 + Math.floor(rng() * Math.max(1, r.h - 2)),
    };
  }
  const side = rng() < 0.5 ? node.left! : node.right!;
  return pickAnchor(side, rng);
}

function carveCorridor(m: number[][], ax: number, ay: number, bx: number, by: number, rng: () => number): void {
  const horizontalFirst = rng() < 0.5;
  if (horizontalFirst) {
    const xLo = Math.min(ax, bx), xHi = Math.max(ax, bx);
    for (let x = xLo; x <= xHi; x++) m[ay][x] = T_FLOOR;
    const yLo = Math.min(ay, by), yHi = Math.max(ay, by);
    for (let y = yLo; y <= yHi; y++) m[y][bx] = T_FLOOR;
  } else {
    const yLo = Math.min(ay, by), yHi = Math.max(ay, by);
    for (let y = yLo; y <= yHi; y++) m[y][ax] = T_FLOOR;
    const xLo = Math.min(ax, bx), xHi = Math.max(ax, bx);
    for (let x = xLo; x <= xHi; x++) m[by][x] = T_FLOOR;
  }
}

function connectSiblings(node: BspNode, m: number[][], rng: () => number): void {
  if (!node.left || !node.right) return;
  connectSiblings(node.left,  m, rng);
  connectSiblings(node.right, m, rng);
  const a = pickAnchor(node.left,  rng);
  const b = pickAnchor(node.right, rng);
  carveCorridor(m, a.x, a.y, b.x, b.y, rng);
}

function collectRooms(node: BspNode, out: Array<{ x: number; y: number; w: number; h: number }>): void {
  if (node.room) { out.push(node.room); return; }
  if (node.left)  collectRooms(node.left,  out);
  if (node.right) collectRooms(node.right, out);
}

function bfsCanReach(m: number[][], sx: number, sy: number, tx: number, ty: number): boolean {
  const seen = new Set<string>();
  const q: Array<[number, number]> = [[sx, sy]];
  seen.add(sx + ',' + sy);
  while (q.length) {
    const cell = q.shift()!;
    const x = cell[0], y = cell[1];
    if (x === tx && y === ty) return true;
    for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
      const nx = x + dx, ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= COLS || ny >= ROWS) continue;
      const k = nx + ',' + ny;
      if (seen.has(k)) continue;
      const t = m[ny][nx];
      if (t === T_WALL) continue;
      seen.add(k);
      q.push([nx, ny]);
    }
  }
  return false;
}

export function generateFloor(level: number): FloorData {
  const m: number[][] = [];
  for (let y = 0; y < ROWS; y++) {
    const row: number[] = [];
    for (let x = 0; x < COLS; x++) row.push(T_WALL);
    m.push(row);
  }
  const rng = mulberry32(0x5eed + level * 97);

  const root: BspNode = { x: 1, y: 1, w: COLS - 2, h: ROWS - 2 };
  const depth = 3 + Math.min(2, Math.floor((level - 1) / 2));
  splitBsp(root, rng, depth);
  placeRooms(root, m, rng);
  connectSiblings(root, m, rng);

  const rooms: Array<{ x: number; y: number; w: number; h: number }> = [];
  collectRooms(root, rooms);
  let spawnRoom = rooms[0];
  let bestSpawnD = Infinity;
  for (const r of rooms) {
    const d = Math.abs(r.x - 1) + Math.abs(r.y - 1);
    if (d < bestSpawnD) { bestSpawnD = d; spawnRoom = r; }
  }
  const spawnTx = spawnRoom.x + Math.floor(spawnRoom.w / 2);
  const spawnTy = spawnRoom.y + Math.floor(spawnRoom.h / 2);
  const spawn = { x: spawnTx * TILE + TILE / 2, y: spawnTy * TILE + TILE / 2 };

  let exitRoom = rooms[0];
  let bestRight = -Infinity;
  for (const r of rooms) {
    const rightEdge = r.x + r.w;
    if (rightEdge > bestRight) { bestRight = rightEdge; exitRoom = r; }
  }
  const exitY = exitRoom.y + Math.floor(exitRoom.h / 2);
  for (let x = exitRoom.x + exitRoom.w; x < COLS - 1; x++) m[exitY][x] = T_FLOOR;
  m[exitY][COLS - 1] = T_EXIT;

  const chairCount = 2 + level;
  for (let i = 0; i < chairCount; i++) {
    const r = rooms[Math.floor(rng() * rooms.length)];
    if (r.w < 4 || r.h < 4) continue;
    const cx = r.x + 1 + Math.floor(rng() * (r.w - 2));
    const cy = r.y + 1 + Math.floor(rng() * (r.h - 2));
    if (m[cy][cx] === T_FLOOR) m[cy][cx] = T_CHAIR;
  }

  return { map: m, rng, spawn };
}

export function isFloorConnected(data: FloorData): boolean {
  const { map, spawn } = data;
  const sx = Math.floor(spawn.x / TILE);
  const sy = Math.floor(spawn.y / TILE);
  let exitX = -1, exitY = -1;
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      if (map[y][x] === T_EXIT) { exitX = x; exitY = y; }
    }
  }
  if (exitX < 0) return false;
  return bfsCanReach(map, sx, sy, exitX - 1, exitY);
}
