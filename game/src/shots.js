// shots.js — staged scenes for the screenshots. Each one loads a level,
// moves the actors into a dramatic moment, and leaves the game frozen
// there, so the picture is a real render of the game, not a mock-up.
// The game logic itself never reads these; they only pose the scene.
import { TILE } from './config.js';
import { stageCloud } from './gadgets.js';

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
    // Level 1, mid-sneak: the thief hidden in a bush by the exit beacon
    // as a guard's cone sweeps past and the lighthouse beam cuts across
    // the yard. Cover, cones, beam, exit and the HIDDEN label in one frame.
    loadLevel(0);
    game.screen = 'playing';
    placePlayer(game, 24, 3, 1, 0);
    game.player.sneaking = true;
    game.player.hidden = true;
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
    game.player.smoke = 2;
  } else if (name === 'smoke') {
    // Level 4, the escape: a chasing guard's red cone stops dead at the
    // smoke cloud the thief just lobbed, and the thief slips away behind it.
    loadLevel(3);
    game.screen = 'playing';
    placePlayer(game, 18, 10, 1, 0);
    game.player.running = true;
    game.player.moving = true;
    placeGuard(game, 2, 12, 10, 0.1, 'chase', 1);
    placeGuard(game, 3, 30, 12, Math.PI * 0.9, 'suspicious', 0.6);
    placeGuard(game, 0, 8, 4, Math.PI / 2, 'patrol', 0.1);
    game.guards[2].lastSeen = { x: game.player.x, y: game.player.y };
    game.smokeClouds.push(stageCloud(15 * TILE, 10 * TILE + 16, 1.2));
    game.cameras[0].angle = 0.5;
    game.cameras[1].angle = Math.PI - 0.4;
    game.beam.angle = 1.1;
    game.level.lenses[0].taken = true;
    game.lensesGot = 1;
    game.lensesLeft = 2;
    game.detection = 0.85;
    game.time = 402;
    game.levelTime = 74;
    game.score = 6800;
    game.player.pebbles = 3;
    game.player.smoke = 1;
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
    game.player.smoke = 2;
  } else if (name === 'victory') {
    // The end screen after a five-night run.
    loadLevel(4);
    game.screen = 'victory';
    for (const lens of game.level.lenses) lens.taken = true;
    game.lensesGot = 4;
    game.lensesLeft = 0;
    game.time = 890;
    game.score = 12400;
    game.alarms = 2;
  }
}
