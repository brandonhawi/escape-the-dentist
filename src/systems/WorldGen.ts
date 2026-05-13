import { COLS, ROWS, T_FLOOR, T_WALL, T_EXIT, T_CHAIR } from '../config.ts';

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
      if (t === T_WALL || t === T_CHAIR) continue;
      seen.add(k);
      q.push([nx, ny]);
    }
  }
  return false;
}

function ensureConnected(m: number[][]): void {
  const exitY = Math.floor(ROWS / 2);
  const exitX = COLS - 2; // floor cell adjacent to the exit tile
  if (bfsCanReach(m, 1, 1, exitX, exitY)) return;
  // Fallback: carve a guaranteed L-shaped corridor.
  // Down column 1 to exitY, then across row exitY to exitX.
  for (let y = 1; y <= exitY; y++) {
    if (m[y][1] !== T_FLOOR) m[y][1] = T_FLOOR;
  }
  for (let x = 1; x <= exitX; x++) {
    if (m[exitY][x] !== T_FLOOR) m[exitY][x] = T_FLOOR;
  }
}

export function generateFloor(level: number): FloorData {
  const m: number[][] = [];
  for (let y = 0; y < ROWS; y++) {
    const row: number[] = [];
    for (let x = 0; x < COLS; x++) {
      if (x === 0 || y === 0 || x === COLS - 1 || y === ROWS - 1) row.push(T_WALL);
      else row.push(T_FLOOR);
    }
    m.push(row);
  }
  const rng = mulberry32(0x5eed + level * 97);
  const partitions = 3 + level;
  for (let i = 0; i < partitions; i++) {
    const vertical = rng() < 0.5;
    if (vertical) {
      const x = 3 + Math.floor(rng() * (COLS - 6));
      const yEnd = ROWS - 2;
      const gap = 1 + Math.floor(rng() * (yEnd - 1));
      for (let y = 1; y <= yEnd; y++) {
        if (Math.abs(y - gap) < 2) continue;
        m[y][x] = T_WALL;
      }
    } else {
      const y = 3 + Math.floor(rng() * (ROWS - 6));
      const xEnd = COLS - 2;
      const gap = 1 + Math.floor(rng() * (xEnd - 1));
      for (let x = 1; x <= xEnd; x++) {
        if (Math.abs(x - gap) < 2) continue;
        m[y][x] = T_WALL;
      }
    }
  }
  for (let i = 0; i < 2 + level; i++) {
    const cx = 2 + Math.floor(rng() * (COLS - 4));
    const cy = 2 + Math.floor(rng() * (ROWS - 4));
    if (m[cy][cx] === T_FLOOR) m[cy][cx] = T_CHAIR;
  }
  const dy = Math.floor(ROWS / 2);
  m[dy][COLS - 1] = T_EXIT;
  m[dy][COLS - 2] = T_FLOOR;
  m[1][1] = T_FLOOR;
  m[1][2] = T_FLOOR;
  m[2][1] = T_FLOOR;
  ensureConnected(m);
  return { map: m, rng };
}
