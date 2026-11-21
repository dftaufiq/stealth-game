// random.js — a tiny seeded generator (mulberry32). Levels use it so the
// same seed always deals the same floor shading, pebble scatter and patrol
// jitter; nothing in the game reads Math.random during play.
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// A deterministic 0..1 value for one tile, so the floor pattern never
// changes between runs of the same level.
export function tileHash(tx, ty, seed) {
  let h = (tx * 374761393 + ty * 668265263 + seed * 974634) >>> 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

export function clamp(v, lo, hi) {
  return v < lo ? lo : v > hi ? hi : v;
}

export function lerp(a, b, t) {
  return a + (b - a) * t;
}

// Shortest signed angle from a to b, in (-PI, PI].
export function angleDiff(a, b) {
  let d = (b - a) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d <= -Math.PI) d += Math.PI * 2;
  return d;
}

export function dist(ax, ay, bx, by) {
  return Math.hypot(bx - ax, by - ay);
}
