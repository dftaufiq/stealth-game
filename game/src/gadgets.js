// gadgets.js — the thief's smoke vials. Press E (or aim with the mouse) to
// lob a vial: it flies, bursts, and hangs as a thick grey cloud for a few
// seconds. No eye sees through smoke — not a guard's cone, not the beam,
// not a camera — so a cloud is a moving piece of cover, and a way out of
// a chase when the cones have you boxed in.
import { SMOKE } from './config.js';
import { circleHitsWall } from './levels.js';

export function createSmokeClouds() {
  return [];
}

// Lob a vial from the player toward a point in world pixels. It flies
// straight and bursts where it lands: at the first wall, or at its target.
export function throwSmokeVial(player, clouds, tx, ty) {
  if (player.smoke <= 0) return false;
  player.smoke -= 1;
  const dx = tx - player.x;
  const dy = ty - player.y;
  const d = Math.hypot(dx, dy) || 1;
  clouds.push({
    kind: 'vial',
    x: player.x,
    y: player.y,
    vx: (dx / d) * SMOKE.flySpeed,
    vy: (dy / d) * SMOKE.flySpeed,
    tx,
    ty,
    age: 0,
  });
  return true;
}

// Does the segment from (ax, ay) to (bx, by) pass through a live cloud?
// A guard, a beam or a camera whose line crosses smoke cannot see past it.
export function smokeBlocksSight(clouds, ax, ay, bx, by) {
  for (const c of clouds) {
    if (c.kind !== 'cloud') continue;
    if (c.age > SMOKE.duration) continue;
    if (segmentHitsCircle(ax, ay, bx, by, c.x, c.y, c.radius)) return true;
  }
  return false;
}

function segmentHitsCircle(ax, ay, bx, by, cx, cy, r) {
  const dx = bx - ax;
  const dy = by - ay;
  const len2 = dx * dx + dy * dy;
  let t = 0;
  if (len2 > 0) {
    t = ((cx - ax) * dx + (cy - ay) * dy) / len2;
    t = Math.max(0, Math.min(1, t));
  }
  const px = ax + dx * t;
  const py = ay + dy * t;
  return (px - cx) * (px - cx) + (py - cy) * (py - cy) < r * r;
}

// A cloud placed by hand, for the screenshots: same puffs as a burst vial,
// already hanging at the given age.
export function stageCloud(x, y, age) {
  return {
    kind: 'cloud',
    x,
    y,
    age,
    radius: SMOKE.radius,
    puffs: [
      { dx: 0, dy: 0, r: 0.62 },
      { dx: -26, dy: 10, r: 0.48 },
      { dx: 26, dy: -8, r: 0.52 },
      { dx: 8, dy: 22, r: 0.44 },
      { dx: -12, dy: -22, r: 0.4 },
    ],
  };
}

// Vials fly and burst; clouds swell, hang, then thin out and vanish.
export function updateSmokeClouds(clouds, level, dt) {
  for (const c of clouds) {
    c.age += dt;
    if (c.kind === 'vial') {
      c.x += c.vx * dt;
      c.y += c.vy * dt;
      const reached =
        Math.hypot(c.tx - c.x, c.ty - c.y) < 14 || circleHitsWall(level, c.x, c.y, 4);
      if (reached) {
        c.kind = 'cloud';
        c.age = 0;
        c.radius = SMOKE.radius;
        // A few fixed puffs so the cloud keeps its shape while it hangs.
        c.puffs = [
          { dx: 0, dy: 0, r: 0.62 },
          { dx: -26, dy: 10, r: 0.48 },
          { dx: 26, dy: -8, r: 0.52 },
          { dx: 8, dy: 22, r: 0.44 },
          { dx: -12, dy: -22, r: 0.4 },
        ];
      }
    }
  }
  // Drop spent clouds and vials that flew too long without landing.
  for (let i = clouds.length - 1; i >= 0; i--) {
    const c = clouds[i];
    if ((c.kind === 'cloud' && c.age > SMOKE.duration) || c.age > 3) {
      clouds.splice(i, 1);
    }
  }
}
