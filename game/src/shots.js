// shots.js — staged scenes for the screenshots. Each one loads a level,
// moves the actors into a dramatic moment, and leaves the game frozen
// there, so the picture is a real render of the game, not a mock-up.
// The game logic itself never reads these; they only pose the scene.
import { TILE } from './config.js';

function placePlayer(game, tx, ty, fx, fy) {
  game.player.x = (tx + 0.5) * TILE;
  game.player.y = (ty + 0.5) * TILE;
  game.player.fx = fx;
  game.player.fy = fy;
  game.player.moving = false;
}

function placeGuard(game, i, tx, ty, angle, state, suspicion) {
  const g = game.guards[i];
  g.x = (tx + 0.5) * TILE;
  g.y = (ty + 0.5) * TILE;
  g.angle = angle;
  g.state = state;
  g.suspicion = suspicion;
}

export function applyShot(game, name, loadLevel) {
  if (name === 'cover') {
    // Level 1, mid-sneak: the thief crouched by a bush as a guard's cone
    // sweeps past and the lighthouse beam cuts across the yard.
    loadLevel(0);
    game.screen = 'playing';
    placePlayer(game, 17, 10, 1, 0);
    game.player.sneaking = true;
    game.player.hidden = false;
    placeGuard(game, 0, 20, 9, 2.8, 'suspicious', 0.7);
    placeGuard(game, 1, 30, 6, Math.PI, 'patrol', 0.1);
    placeGuard(game, 2, 8, 18, 0, 'patrol', 0);
    game.beam.angle = 2.35;
    game.level.lenses[0].taken = true;
    game.lensesGot = 1;
    game.lensesLeft = 1;
    game.detection = 0.55;
    game.time = 42.5;
    game.levelTime = 42.5;
    game.score = 1250;
    game.player.pebbles = 4;
  } else if (name === 'alert') {
    // The chase: a guard has the thief dead to rights, cone burning red.
    loadLevel(0);
    game.screen = 'playing';
    placePlayer(game, 15, 18, 1, 0);
    game.player.running = true;
    game.player.moving = true;
    placeGuard(game, 0, 12, 18, 0.15, 'chase', 1);
    placeGuard(game, 1, 28, 5, Math.PI * 0.8, 'suspicious', 0.6);
    placeGuard(game, 2, 7, 19, -Math.PI / 2, 'investigate', 0.5);
    game.guards[2].investigateTarget = { x: game.player.x, y: game.player.y };
    game.beam.angle = 0.6;
    game.detection = 0.95;
    game.time = 96;
    game.levelTime = 96;
    game.score = 2100;
    game.player.pebbles = 2;
  } else if (name === 'house') {
    // Level 2, the Keeper's House: tight halls, a camera sweeping overhead.
    loadLevel(1);
    game.screen = 'playing';
    placePlayer(game, 19, 9, 0, 1);
    game.player.sneaking = true;
    placeGuard(game, 1, 16, 5, Math.PI / 2, 'patrol', 0.15);
    placeGuard(game, 3, 12, 19, 0, 'patrol', 0);
    game.cameras[0].angle = Math.PI / 2 + 0.5;
    game.cameras[1].angle = Math.PI - 0.4;
    game.level.lenses[0].taken = true;
    game.lensesGot = 1;
    game.lensesLeft = 2;
    game.detection = 0.3;
    game.time = 218;
    game.levelTime = 58;
    game.score = 3300;
    game.player.pebbles = 3;
  } else if (name === 'victory') {
    // The end screen after a clean run.
    loadLevel(2);
    game.screen = 'victory';
    for (const lens of game.level.lenses) lens.taken = true;
    game.lensesGot = 3;
    game.lensesLeft = 0;
    game.time = 512;
    game.score = 8450;
    game.alarms = 1;
  }
}
