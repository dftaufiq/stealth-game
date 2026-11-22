// levels.js — the five levels of Lanternkeep, drawn as text maps.
//
// Legend:  # wall      . floor     B bush (hide here)   C crate (blocks sight)
//          P player    L lens     X exit               T lighthouse tower
//          G guard     K camera   (G and K marks are spawn points; the
//          patrols and sweeps live in the level data below the map)
//
// Guards walk waypoints in tile coordinates. Every waypoint must be a
// walkable tile ('.', 'B', 'P', 'L', 'X', 'G' or 'K').

import { TILE } from './config.js';

const L1 = [
  '########################################',
  '#....B.........C.........TT..........X.#',
  '#......................................#',
  '#..C......B......C......B......C.......#',
  '#......................................#',
  '#...####....C.........####.....B.......#',
  '#...#..#..............#..#.............#',
  '#...#..#....B....C...#..#....C.........#',
  '#...####....C.........####.............#',
  '#......B.........C........B......C.....#',
  '#......................................#',
  '#..P...C......B......C.......B.........#',
  '#......................................#',
  '#....C.....####.......C....B.....C.....#',
  '#...........#..#............C..........#',
  '#..B...C....#..#....B......C....B......#',
  '#..........####.......C................#',
  '#....B......C.....B......C.....B.......#',
  '#......................................#',
  '#..C....B.....C......B.....C......L....#',
  '#......................................#',
  '#.....C.....B.......C.....B.......C....#',
  '#..L...................................#',
  '########################################',
];

const L2 = [
  '########################################',
  '#..P.....B....C..........C.....B.......#',
  '#......................................#',
  '#....######......C.....######....C.....#',
  '#....#....#..........#......#..........#',
  '#.L..#....#..C.......#..L...#....B.....#',
  '#....#....#..........#......#..........#',
  '#....######....B.....######....C.......#',
  '#......................................#',
  '#..C......B......C........B......C.....#',
  '#......................................#',
  '#....######......C.....######..........#',
  '#....#....#..........#......#....C.....#',
  '#....#..L......B....#......#...........#',
  '#....#....#..........#..C...#....B.....#',
  '#....######......C.....######..........#',
  '#......................................#',
  '#..B.....C......B......C......B........#',
  '#......................................#',
  '#....C.......B......C.......B.....C....#',
  '#......................................#',
  '#..C.....B........C......B......C......#',
  '#...................................X..#',
  '########################################',
];

const L3 = [
  '########################################',
  '#..P....C.....B...TT...C......B....X...#',
  '#......................................#',
  '#..C....B....####....C.....####........#',
  '#...........#....#........#....#.......#',
  '#..B....C...#.L..#...B....#....#..C....#',
  '#...........#....#........#....#.......#',
  '#....C......####....C.....####....B....#',
  '#......................................#',
  '#..B.....C......B......C.......B.......#',
  '#......................................#',
  '#....####.....C......####.....C........#',
  '#....#..#...........#....#.............#',
  '#.L..#..#....B.........L.#....C........#',
  '#....#..#...........#....#.............#',
  '#....####.....C......####.....C........#',
  '#......................................#',
  '#..C.....B......C......B......C........#',
  '#......................................#',
  '#....B......C......B......C......B.....#',
  '#......................................#',
  '#..C......B......C......B......C.......#',
  '#......................................#',
  '########################################',
];

const L4 = [
  '########################################',
  '#..P.....B....C..........C.....B......X#',
  '#......................................#',
  '#..####......C.....####......C....####.#',
  '#..#..#............#..#...........#..#.#',
  '#..#.L...C....B....#..#...C....B....L#.#',
  '#..#..#............#..#...........#..#.#',
  '#..####......C.....####......C....####.#',
  '#......................................#',
  '#....C......B......TT......B......C....#',
  '#......................................#',
  '#..####......C.....####......C....####.#',
  '#..#..#............#..#...........#..#.#',
  '#..#..#..B....C......L#...B....C..#..#.#',
  '#..#..#............#..#...........#..#.#',
  '#..####......C.....####......C....####.#',
  '#......................................#',
  '#....B.....C......B......C......B......#',
  '#......................................#',
  '#..C......B......C......B......C.......#',
  '#......................................#',
  '#....B......C.......B......C......B....#',
  '#......................................#',
  '########################################',
];

const L5 = [
  '########################################',
  '#..P....C.....B..........C.....B....X..#',
  '#......................................#',
  '#....C......B......C......B......C.....#',
  '#......................................#',
  '#..B....####....C.....####....B........#',
  '#.......#....#........#....#...........#',
  '#..C....#.L..#...B....#..L.#....C......#',
  '#.......#....#........#....#...........#',
  '#..B....####....C.....####....B........#',
  '#......................................#',
  '#......C......B.....TT......B......C...#',
  '#......................................#',
  '#..C....####....C.....####....B........#',
  '#.......#....#........#....#...........#',
  '#..B....#.L..#...B....#..L.#....C......#',
  '#.......#....#........#....#...........#',
  '#..C....####....C.....####....B........#',
  '#......................................#',
  '#..B......C......B......C......B.......#',
  '#......................................#',
  '#....C......B......C......B......C.....#',
  '#......................................#',
  '########################################',
];

export const LEVELS = [
  {
    name: 'Level 1 — The Dockyard',
    story: 'Slip past the night watch, steal two signal lenses, and leave through the north gate.',
    seed: 101,
    map: L1,
    beam: true,
    guards: [
      { spawn: [8, 3], waypoints: [[8, 3], [20, 3], [20, 8], [8, 8]] },
      { spawn: [28, 5], waypoints: [[28, 5], [36, 5], [36, 9], [28, 9]] },
      { spawn: [5, 17], waypoints: [[5, 17], [16, 17], [16, 20], [5, 20]] },
    ],
    cameras: [],
    par: 150,
  },
  {
    name: 'Level 2 — The Keeper’s House',
    story: 'Inside now. Cameras sweep the halls — cross their gaze and every guard comes running.',
    seed: 202,
    map: L2,
    beam: false,
    guards: [
      { spawn: [2, 4], waypoints: [[2, 4], [4, 4], [4, 6], [2, 6]] },
      { spawn: [14, 3], waypoints: [[14, 3], [21, 3], [21, 9], [14, 9]] },
      { spawn: [30, 12], waypoints: [[30, 12], [36, 12], [36, 14], [30, 14]] },
      { spawn: [8, 18], waypoints: [[8, 18], [30, 18], [30, 20], [8, 20]] },
    ],
    cameras: [
      { tile: [13, 4], baseAngle: Math.PI / 2, sweep: 0.7 },
      { tile: [24, 12], baseAngle: Math.PI, sweep: 0.7 },
    ],
    par: 180,
  },
  {
    name: 'Level 3 — The Lamp Room',
    story: 'The top of the tower. Take the last lens, reach the lamp, and vanish into the night.',
    seed: 303,
    map: L3,
    beam: true,
    guards: [
      { spawn: [6, 3], waypoints: [[4, 3], [10, 3], [10, 8], [4, 8]] },
      { spawn: [24, 3], waypoints: [[24, 3], [34, 3], [34, 6], [24, 6]] },
      { spawn: [4, 11], waypoints: [[4, 11], [10, 11], [10, 16], [4, 16]] },
      { spawn: [29, 11], waypoints: [[29, 11], [36, 11], [36, 16], [29, 16]] },
    ],
    cameras: [],
    par: 180,
  },
  {
    name: 'Level 4 — The Cellar',
    story: 'Below the tower: the beam and the cameras together, five guards, three lenses. Smoke is your friend down here.',
    seed: 404,
    map: L4,
    beam: true,
    guards: [
      { spawn: [6, 2], waypoints: [[6, 2], [18, 2], [18, 8], [6, 8]] },
      { spawn: [30, 2], waypoints: [[30, 2], [36, 2], [36, 8], [30, 8]] },
      { spawn: [10, 10], waypoints: [[10, 10], [18, 10], [18, 16], [10, 16]] },
      { spawn: [28, 10], waypoints: [[28, 10], [36, 10], [36, 16], [28, 16]] },
      { spawn: [16, 19], waypoints: [[16, 19], [24, 19], [24, 22], [16, 22]] },
    ],
    cameras: [
      { tile: [13, 9], baseAngle: 0, sweep: 0.8 },
      { tile: [25, 13], baseAngle: Math.PI, sweep: 0.8 },
    ],
    par: 210,
  },
  {
    name: 'Level 5 — The Beacon',
    story: 'The final night. Six guards, two cameras and the beam between you and four lenses — then the lamp is yours.',
    seed: 505,
    map: L5,
    beam: true,
    guards: [
      { spawn: [6, 3], waypoints: [[6, 3], [16, 3], [16, 4], [6, 4]] },
      { spawn: [30, 3], waypoints: [[30, 3], [36, 3], [36, 4], [30, 4]] },
      { spawn: [6, 10], waypoints: [[6, 10], [18, 10], [18, 12], [6, 12]] },
      { spawn: [28, 10], waypoints: [[28, 10], [36, 10], [36, 12], [28, 12]] },
      { spawn: [6, 19], waypoints: [[6, 19], [18, 19], [18, 21], [6, 21]] },
      { spawn: [28, 19], waypoints: [[28, 19], [36, 19], [36, 21], [28, 21]] },
    ],
    cameras: [
      { tile: [13, 11], baseAngle: Math.PI / 2, sweep: 0.7 },
      { tile: [26, 11], baseAngle: -Math.PI / 2, sweep: 0.7 },
    ],
    par: 240,
  },
];

// Parse one ASCII map into the grid the game plays on: a 2D array of tile
// codes, plus the player start, lenses, exit, tower centre and guard spawns.
// Spawn markers become plain floor once read.
export function parseLevel(def) {
  const rows = def.map.length;
  const cols = def.map[0].length;
  const grid = [];
  const level = {
    def,
    rows,
    cols,
    grid,
    playerStart: null,
    lenses: [],
    exit: null,
    tower: null,
    guards: def.guards,
    cameras: def.cameras,
    beam: def.beam,
    seed: def.seed,
  };
  const towerTiles = [];
  for (let y = 0; y < rows; y++) {
    const row = [];
    for (let x = 0; x < cols; x++) {
      const ch = def.map[y][x];
      if (ch === 'P') level.playerStart = { x: x + 0.5, y: y + 0.5 };
      if (ch === 'L') level.lenses.push({ tx: x, ty: y, taken: false });
      if (ch === 'X') level.exit = { tx: x, ty: y };
      if (ch === 'T') towerTiles.push({ x, y });
      row.push(ch === 'P' || ch === 'L' || ch === 'X' || ch === 'G' || ch === 'K' ? '.' : ch);
    }
    grid.push(row);
  }
  if (towerTiles.length) {
    const cx = towerTiles.reduce((s, t) => s + t.x, 0) / towerTiles.length + 0.5;
    const cy = towerTiles.reduce((s, t) => s + t.y, 0) / towerTiles.length + 0.5;
    level.tower = { x: cx, y: cy };
  }
  return level;
}

export function isBlockedTile(level, tx, ty) {
  if (tx < 0 || ty < 0 || tx >= level.cols || ty >= level.rows) return true;
  const ch = level.grid[ty][tx];
  return ch === '#' || ch === 'C' || ch === 'T';
}

// A circle (in pixels) overlaps any blocked tile?
export function circleHitsWall(level, px, py, r) {
  const x0 = Math.floor((px - r) / TILE);
  const x1 = Math.floor((px + r) / TILE);
  const y0 = Math.floor((py - r) / TILE);
  const y1 = Math.floor((py + r) / TILE);
  for (let ty = y0; ty <= y1; ty++) {
    for (let tx = x0; tx <= x1; tx++) {
      if (!isBlockedTile(level, tx, ty)) continue;
      const cx = Math.max(tx * TILE, Math.min(px, (tx + 1) * TILE));
      const cy = Math.max(ty * TILE, Math.min(py, (ty + 1) * TILE));
      if ((px - cx) * (px - cx) + (py - cy) * (py - cy) < r * r) return true;
    }
  }
  return false;
}

// Line of sight on the tile grid (DDA): true when no wall or crate stands
// between two points given in pixels. Bushes never block sight — they hide
// the player another way.
export function hasLineOfSight(level, ax, ay, bx, by) {
  const dx = bx - ax;
  const dy = by - ay;
  const distance = Math.hypot(dx, dy);
  const steps = Math.max(1, Math.ceil(distance / (TILE / 3)));
  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    const tx = Math.floor((ax + dx * t) / TILE);
    const ty = Math.floor((ay + dy * t) / TILE);
    if (isBlockedTile(level, tx, ty)) return false;
  }
  return true;
}
