// beam.js — the two sweeping lights that are not guards: the lighthouse
// beam (levels 1 and 3) and the security cameras (level 2). Both raise the
// same detection meter, so the player reads them the same way.
import { TILE, BEAM, CAMERA } from './config.js';
import { hasLineOfSight } from './levels.js';
import { angleDiff, clamp, dist } from './random.js';

export function createBeam(level) {
  if (!level.beam || !level.tower) return null;
  return {
    x: level.tower.x * TILE,
    y: level.tower.y * TILE,
    angle: -Math.PI / 2,
    turnSpeed: BEAM.turnSpeed,
  };
}

export function updateBeam(beam, dt) {
  if (!beam) return;
  beam.angle += beam.turnSpeed * dt;
}

export function createCameras(level) {
  return (level.cameras || []).map((c) => ({
    x: (c.tile[0] + 0.5) * TILE,
    y: (c.tile[1] + 0.5) * TILE,
    baseAngle: c.baseAngle,
    sweep: c.sweep,
    angle: c.baseAngle, // deterministic: always starts centred
    alarm: 0, // seconds since this camera last raised the alarm
  }));
}

export function updateCameras(cameras, time) {
  for (const cam of cameras) {
    cam.angle = cam.baseAngle + Math.sin(time * CAMERA.sweepSpeed) * cam.sweep;
    cam.alarm = Math.max(0, cam.alarm - 0.016);
  }
}

// Is the player standing in the beam? Range, wedge, and line of sight
// from the tower (crates and walls block the light).
export function playerInBeam(beam, level, player) {
  if (!beam) return false;
  const d = dist(beam.x, beam.y, player.x, player.y);
  if (d > BEAM.range) return false;
  const toPlayer = Math.atan2(player.y - beam.y, player.x - beam.x);
  if (Math.abs(angleDiff(beam.angle, toPlayer)) > BEAM.halfAngle) return false;
  if (player.hidden && d > 90) return false; // bushes still help
  return hasLineOfSight(level, beam.x, beam.y, player.x, player.y);
}

export function cameraSeesPlayer(cam, level, player) {
  const d = dist(cam.x, cam.y, player.x, player.y);
  if (d > CAMERA.range) return false;
  const toPlayer = Math.atan2(player.y - cam.y, player.x - cam.x);
  if (Math.abs(angleDiff(cam.angle, toPlayer)) > CAMERA.halfAngle) return false;
  return hasLineOfSight(level, cam.x, cam.y, player.x, player.y);
}

// Feed beam and camera sightings into the shared detection meter. Returns
// how much detection the lights added this frame (0 when nothing sees).
export function lightsDetection(beam, cameras, level, player, dt) {
  let added = 0;
  if (beam && playerInBeam(beam, level, player)) {
    added += BEAM.seeRate * dt;
  }
  for (const cam of cameras) {
    if (cameraSeesPlayer(cam, level, player)) {
      added += CAMERA.seeRate * dt;
    }
  }
  return clamp(added, 0, 1);
}
