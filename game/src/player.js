// player.js — the thief: movement, sneaking, running, noise, pebbles,
// hiding in bushes, and picking up lenses.
import { TILE, PLAYER, NOISE, PEBBLE } from './config.js';
import { circleHitsWall } from './levels.js';
import { clamp } from './random.js';

export function createPlayer(level) {
  return {
    x: level.playerStart.x * TILE,
    y: level.playerStart.y * TILE,
    fx: 1, // facing x (unit-ish)
    fy: 0, // facing y
    moving: false,
    sneaking: false,
    running: false,
    speed: 0,
    stepPhase: 0, // drives the footstep sounds
    pebbles: PEBBLE.perLevel,
    pebbleCooldown: 0,
    hidden: false, // standing in a bush right now
    noiseRadius: 0,
  };
}

// Move the player one frame. Returns a noise event when the player runs
// loud enough for guards to hear, or null.
export function updatePlayer(player, level, input, dt) {
  let mx = (input.keys.has('right') ? 1 : 0) - (input.keys.has('left') ? 1 : 0);
  let my = (input.keys.has('down') ? 1 : 0) - (input.keys.has('up') ? 1 : 0);
  const len = Math.hypot(mx, my);
  player.moving = len > 0;
  if (player.moving) {
    mx /= len;
    my /= len;
    player.fx = mx;
    player.fy = my;
  }
  player.sneaking = input.keys.has('sneak');
  player.running = input.keys.has('run') && !player.sneaking;
  const speed = player.sneaking
    ? PLAYER.sneakSpeed
    : player.running
      ? PLAYER.runSpeed
      : PLAYER.walkSpeed;
  player.speed = player.moving ? speed : 0;

  // Axis-separated movement so the player slides along walls.
  const nx = player.x + mx * speed * dt;
  if (!circleHitsWall(level, nx, player.y, PLAYER.radius)) player.x = nx;
  const ny = player.y + my * speed * dt;
  if (!circleHitsWall(level, player.x, ny, PLAYER.radius)) player.y = ny;

  // Bushes hide the player; the guard module decides how close is too close.
  const tx = Math.floor(player.x / TILE);
  const ty = Math.floor(player.y / TILE);
  player.hidden = level.grid[ty] && level.grid[ty][tx] === 'B';

  player.noiseRadius = !player.moving
    ? 0
    : player.sneaking
      ? NOISE.sneakRadius
      : player.running
        ? NOISE.runRadius
        : NOISE.walkRadius;

  // Footstep timing: faster when running, silent while sneaking.
  if (player.moving && !player.sneaking) {
    player.stepPhase += dt * speed * 0.045;
  }
  player.pebbleCooldown = Math.max(0, player.pebbleCooldown - dt);

  // Running close by is itself a noise event guards can hear.
  if (player.running && player.moving) {
    return { x: player.x, y: player.y, radius: NOISE.runRadius, kind: 'steps' };
  }
  return null;
}

// Throw a pebble toward a point in world pixels. It flies straight, stops
// at the first wall, and lands with a clatter guards investigate.
export function throwPebble(player, pebbles, tx, ty) {
  if (player.pebbles <= 0 || player.pebbleCooldown > 0) return null;
  player.pebbles -= 1;
  player.pebbleCooldown = PEBBLE.cooldown;
  const dx = tx - player.x;
  const dy = ty - player.y;
  const d = Math.hypot(dx, dy) || 1;
  pebbles.push({
    x: player.x,
    y: player.y,
    vx: (dx / d) * PEBBLE.flySpeed,
    vy: (dy / d) * PEBBLE.flySpeed,
    alive: true,
    landed: false,
  });
  return true;
}

export function updatePebbles(pebbles, level, dt) {
  const landed = [];
  for (const p of pebbles) {
    if (!p.alive) continue;
    if (p.landed) {
      p.alive = false;
      continue;
    }
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    if (circleHitsWall(level, p.x, p.y, 3)) {
      p.landed = true;
      landed.push({ x: p.x, y: p.y, radius: NOISE.pebbleRadius, kind: 'pebble' });
      p.alive = false;
    }
  }
  return landed;
}

export function tileOf(player) {
  return { tx: Math.floor(player.x / TILE), ty: Math.floor(player.y / TILE) };
}

export function clampToWorld(player, level) {
  player.x = clamp(player.x, TILE, (level.cols - 1) * TILE);
  player.y = clamp(player.y, TILE, (level.rows - 1) * TILE);
}
