// main.js — Lanternkeep's heart: the state machine (title, intro, playing,
// caught, level done, victory, paused), the frame loop, scoring, and the
// shared detection meter that guards, the beam and the cameras all feed.
import { TILE, VIEW_W, VIEW_H } from './config.js';
import { LEVELS, parseLevel } from './levels.js';
import { createInput } from './input.js';
import { createPlayer, updatePlayer, throwPebble, updatePebbles } from './player.js';
import { createGuard, updateGuard, guardHears, GUARD_STATE } from './guard.js';
import { createBeam, updateBeam, createCameras, updateCameras, lightsDetection } from './beam.js';
import { createSmokeClouds, throwSmokeVial, updateSmokeClouds } from './gadgets.js';
import { createAudio } from './audio.js';
import { drawGame } from './render.js';
import { applyShot } from './shots.js';

const canvas = document.getElementById('game');
canvas.width = VIEW_W;
canvas.height = VIEW_H;
const ctx = canvas.getContext('2d');

const input = createInput(canvas);
const audio = createAudio();

const game = {
  screen: 'title',
  levelIndex: 0,
  level: null,
  player: null,
  guards: [],
  beam: null,
  cameras: [],
  pebbles: [],
  ripples: [],
  smokeClouds: [],
  detection: 0,
  time: 0,
  levelTime: 0,
  score: 0,
  alarms: 0,
  levelAlarms: 0,
  lensesGot: 0,
  lensesTotal: 0,
  lensesLeft: 0,
  frozen: false, // screenshot mode: render the scene, never advance it
  lastStepPhase: 0,
};

function loadLevel(index) {
  const def = LEVELS[index];
  const level = parseLevel(def);
  game.levelIndex = index;
  game.level = level;
  game.player = createPlayer(level);
  game.guards = def.guards.map((g, i) => createGuard(g, i));
  game.beam = createBeam(level);
  game.cameras = createCameras(level);
  game.pebbles = [];
  game.ripples = [];
  game.smokeClouds = createSmokeClouds();
  game.detection = 0;
  game.levelTime = 0;
  game.levelAlarms = 0;
  game.lensesGot = 0;
  game.lensesTotal = level.lenses.length;
  game.lensesLeft = level.lenses.length;
  game.screen = 'intro';
}

function startGame() {
  game.score = 0;
  game.time = 0;
  game.alarms = 0;
  loadLevel(0);
}

function raiseAlarm() {
  game.alarms += 1;
  game.levelAlarms += 1;
  game.detection = 0.55;
  audio.alert();
  for (const g of game.guards) {
    g.suspicion = Math.max(g.suspicion, 0.6);
    g.lastSeen = { x: game.player.x, y: game.player.y };
    g.investigateTarget = { x: game.player.x, y: game.player.y };
    if (g.state !== GUARD_STATE.CHASE) g.state = GUARD_STATE.INVESTIGATE;
  }
}

function updatePlaying(dt) {
  const { level, player } = game;
  game.time += dt;
  game.levelTime += dt;

  // Throw a pebble toward the mouse (click) or ahead (Q).
  if (input.clicked || input.pressed.has('throw')) {
    audio.ensure();
    let tx;
    let ty;
    if (input.clicked) {
      tx = input.clicked.x; // canvas pixels == world pixels here
      ty = input.clicked.y;
    } else {
      tx = player.x + player.fx * 220;
      ty = player.y + player.fy * 220;
    }
    if (throwPebble(player, game.pebbles, tx, ty)) audio.pebble();
  }

  // Lob a smoke vial with E, toward the mouse: no eye sees through smoke.
  if (input.pressed.has('interact')) {
    audio.ensure();
    const tx = input.mouseX || player.x + player.fx * 200;
    const ty = input.mouseY || player.y + player.fy * 200;
    if (throwSmokeVial(player, game.smokeClouds, tx, ty)) audio.smoke();
  }
  updateSmokeClouds(game.smokeClouds, level, dt);

  const noise = updatePlayer(player, level, input, dt);
  if (noise) {
    for (const g of game.guards) guardHears(g, noise);
  }
  // Footsteps.
  if (player.moving && !player.sneaking && Math.floor(player.stepPhase) !== Math.floor(game.lastStepPhase)) {
    audio.step(player.running);
  }
  game.lastStepPhase = player.stepPhase;

  // Pebbles in flight; a landing clatter pulls guards in.
  for (const n of updatePebbles(game.pebbles, level, dt)) {
    game.ripples.push({ x: n.x, y: n.y, age: 0 });
    for (const g of game.guards) guardHears(g, n);
  }
  for (const r of game.ripples) r.age += dt;
  game.ripples = game.ripples.filter((r) => r.age < 0.9);

  // The beam turns; the cameras sweep.
  updateBeam(game.beam, dt);
  updateCameras(game.cameras, game.time);

  // Guards watch, think, and sometimes catch the thief. Smoke blinds them.
  let anySeen = false;
  for (const g of game.guards) {
    const before = g.state;
    const res = updateGuard(g, level, player, dt, game.time, game.smokeClouds);
    if (res.seen) anySeen = true;
    if (before !== GUARD_STATE.CHASE && g.state === GUARD_STATE.CHASE) audio.alert();
    if (res.caught) {
      audio.caught();
      game.screen = 'caught';
      return;
    }
  }

  // The lights feed the same detection meter as the guards' eyes.
  // Smoke blinds the beam and the cameras too.
  const lightAdded = lightsDetection(game.beam, game.cameras, level, player, dt, game.smokeClouds);
  game.detection = Math.min(1, game.detection + lightAdded);
  const topSuspicion = game.guards.reduce((m, g) => Math.max(m, g.suspicion), 0);
  const shown = Math.max(game.detection, topSuspicion);
  if (!anySeen && lightAdded === 0) {
    game.detection = Math.max(0, game.detection - 0.3 * dt);
  }
  game.detection = shown > game.detection ? shown : game.detection;
  if (game.detection >= 1) raiseAlarm();

  // Pick up a lens by walking over it.
  for (const lens of level.lenses) {
    if (lens.taken) continue;
    const lx = (lens.tx + 0.5) * TILE;
    const ly = (lens.ty + 0.5) * TILE;
    if (Math.hypot(player.x - lx, player.y - ly) < 24) {
      lens.taken = true;
      game.lensesGot += 1;
      game.lensesLeft -= 1;
      game.score += 500;
      audio.pickup();
      if (game.lensesLeft === 0) audio.exitOpen();
    }
  }

  // Reach the exit once it is open.
  if (game.lensesLeft === 0) {
    const ex = level.exit;
    const exX = (ex.tx + 0.5) * TILE;
    const exY = (ex.ty + 0.5) * TILE;
    if (Math.hypot(player.x - exX, player.y - exY) < 26) {
      const timeBonus = Math.max(0, Math.round((level.def.par - game.levelTime) * 10));
      const ghostBonus = game.levelAlarms === 0 ? 300 : 0;
      game.score += 1000 + timeBonus + ghostBonus;
      audio.win();
      if (game.levelIndex + 1 >= LEVELS.length) {
        game.screen = 'victory';
      } else {
        game.screen = 'levelDone';
      }
      return;
    }
  }

  if (input.pressed.has('restart')) loadLevel(game.levelIndex);
  if (input.pressed.has('pause')) game.screen = 'paused';
  if (input.pressed.has('mute')) audio.toggleMute();
}

function update(dt) {
  if (game.frozen) return;
  // Audio needs a user gesture: only try to start it on one.
  if (input.anyKey) audio.ensure();
  if (input.pressed.has('mute')) audio.toggleMute();

  switch (game.screen) {
    case 'title':
      if (input.pressed.has('confirm') || input.clicked) startGame();
      break;
    case 'intro':
      if (input.pressed.has('confirm') || input.clicked) game.screen = 'playing';
      break;
    case 'playing':
      updatePlaying(dt);
      break;
    case 'caught':
      if (input.pressed.has('restart')) loadLevel(game.levelIndex);
      break;
    case 'levelDone':
      if (input.pressed.has('confirm') || input.clicked) loadLevel(game.levelIndex + 1);
      break;
    case 'victory':
      if (input.pressed.has('confirm') || input.clicked) {
        game.screen = 'title';
      }
      break;
    case 'paused':
      if (input.pressed.has('pause')) game.screen = 'playing';
      break;
    default:
      break;
  }
  input.endFrame();
}

// Load the first level as the backdrop behind the title screen; starting
// the game re-loads it fresh.
loadLevel(0);
game.screen = 'title';
// scene so the screenshots are real renders of the game, every time.
const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
if (shot) {
  startGame();
  applyShot(game, shot, loadLevel);
  game.frozen = true;
}

let last = performance.now();
let frozenTime = 1.7;
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  if (!game.frozen) {
    update(dt);
  } else {
    frozenTime += 0.016;
    input.endFrame();
  }
  drawGame(ctx, game, game.frozen ? frozenTime : game.time);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// For play-testing from the console and the screenshot script.
window.Lanternkeep = { game, LEVELS, loadLevel, startGame };
