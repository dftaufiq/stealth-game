// guard.js — the night watch. Each guard patrols waypoints, sees through a
// vision cone blocked by walls and crates, hears running feet and pebbles,
// and moves through states the player can learn: patrol, suspicious,
// investigate, chase, search, return. Suspicion is the detection meter:
// it fills while the player is seen and drains while hidden, so a near
// miss is a scare, not an instant fail.
import { TILE, GUARD } from './config.js';
import { circleHitsWall, hasLineOfSight } from './levels.js';
import { angleDiff, clamp, dist } from './random.js';

export const GUARD_STATE = {
  PATROL: 'patrol',
  SUSPICIOUS: 'suspicious',
  INVESTIGATE: 'investigate',
  CHASE: 'chase',
  SEARCH: 'search',
  RETURN: 'return',
};

export function createGuard(def, index) {
  const wps = def.waypoints.map(([x, y]) => ({ x: (x + 0.5) * TILE, y: (y + 0.5) * TILE }));
  return {
    index,
    x: (def.spawn[0] + 0.5) * TILE,
    y: (def.spawn[1] + 0.5) * TILE,
    angle: 0,
    waypoints: wps,
    wpIndex: 1 % wps.length,
    state: GUARD_STATE.PATROL,
    suspicion: 0,
    waitTimer: 0,
    searchTimer: 0,
    lastSeen: null, // {x, y} where the player was last spotted
    investigateTarget: null,
    speed: GUARD.patrolSpeed,
    // A guard pauses briefly at each waypoint, looking around.
    pauseAtWaypoint: 0,
  };
}

function moveToward(guard, tx, ty, speed, dt, level) {
  const dx = tx - guard.x;
  const dy = ty - guard.y;
  const d = Math.hypot(dx, dy);
  if (d < 2) return true;
  const step = Math.min(d, speed * dt);
  const nx = guard.x + (dx / d) * step;
  const ny = guard.y + (dy / d) * step;
  if (!circleHitsWall(level, nx, guard.y, 11)) guard.x = nx;
  if (!circleHitsWall(level, guard.x, ny, 11)) guard.y = ny;
  guard.angle = Math.atan2(dy, dx);
  return d <= step + 2;
}

// Can this guard see the player right now? Range, cone, line of sight,
// and bushes hide the player unless the guard is nearly on top of them.
export function guardSeesPlayer(guard, level, player) {
  const d = dist(guard.x, guard.y, player.x, player.y);
  if (d > GUARD.viewRange) return false;
  if (player.hidden && d > GUARD.bushRevealRange) return false;
  const toPlayer = Math.atan2(player.y - guard.y, player.x - guard.x);
  if (Math.abs(angleDiff(guard.angle, toPlayer)) > GUARD.viewHalfAngle) return false;
  return hasLineOfSight(level, guard.x, guard.y, player.x, player.y);
}

export function updateGuard(guard, level, player, dt, now) {
  const seen = guardSeesPlayer(guard, level, player);
  const d = dist(guard.x, guard.y, player.x, player.y);

  // Suspicion fills faster up close, drains when the player is unseen.
  if (seen) {
    const rate = d < GUARD.viewRange / 2 ? GUARD.seeRateClose : GUARD.seeRate;
    guard.suspicion = clamp(guard.suspicion + rate * dt, 0, 1);
    guard.lastSeen = { x: player.x, y: player.y };
  } else {
    guard.suspicion = clamp(guard.suspicion - GUARD.drainRate * dt, 0, 1);
  }

  // Full suspicion means the chase is on.
  if (guard.suspicion >= 1 && guard.state !== GUARD_STATE.CHASE) {
    guard.state = GUARD_STATE.CHASE;
    guard.searchTimer = 0;
  }

  switch (guard.state) {
    case GUARD_STATE.PATROL: {
      if (guard.suspicion > 0.35) {
        guard.state = GUARD_STATE.SUSPICIOUS;
        guard.waitTimer = 0.9;
        break;
      }
      if (guard.pauseAtWaypoint > 0) {
        guard.pauseAtWaypoint -= dt;
        guard.angle += dt * 0.9; // glance around while waiting
        break;
      }
      const wp = guard.waypoints[guard.wpIndex];
      if (moveToward(guard, wp.x, wp.y, GUARD.patrolSpeed, dt, level)) {
        guard.wpIndex = (guard.wpIndex + 1) % guard.waypoints.length;
        guard.pauseAtWaypoint = 0.7;
      }
      break;
    }
    case GUARD_STATE.SUSPICIOUS: {
      // Freeze and stare at where the player was glimpsed.
      guard.waitTimer -= dt;
      if (guard.lastSeen) {
        guard.angle = Math.atan2(guard.lastSeen.y - guard.y, guard.lastSeen.x - guard.x);
      }
      if (guard.waitTimer <= 0) {
        if (guard.suspicion > 0.05) {
          guard.state = GUARD_STATE.INVESTIGATE;
          guard.investigateTarget = guard.lastSeen
            ? { ...guard.lastSeen }
            : { x: guard.x, y: guard.y };
        } else {
          guard.state = GUARD_STATE.PATROL;
        }
      }
      break;
    }
    case GUARD_STATE.INVESTIGATE: {
      const t = guard.investigateTarget;
      if (!t) {
        guard.state = GUARD_STATE.PATROL;
        break;
      }
      if (moveToward(guard, t.x, t.y, GUARD.investigateSpeed, dt, level)) {
        guard.state = GUARD_STATE.SEARCH;
        guard.searchTimer = GUARD.searchTime;
      }
      break;
    }
    case GUARD_STATE.CHASE: {
      if (seen) {
        guard.searchTimer = 0;
        moveToward(guard, player.x, player.y, GUARD.chaseSpeed, dt, level);
      } else {
        // Lost sight: run to the last seen spot, then search it.
        guard.searchTimer += dt;
        if (guard.lastSeen) {
          const arrived = moveToward(guard, guard.lastSeen.x, guard.lastSeen.y, GUARD.chaseSpeed, dt, level);
          if (arrived || guard.searchTimer > 2.5) {
            guard.state = GUARD_STATE.SEARCH;
            guard.searchTimer = GUARD.searchTime;
          }
        } else {
          guard.state = GUARD_STATE.SEARCH;
          guard.searchTimer = GUARD.searchTime;
        }
      }
      // Give up the chase once suspicion has fully drained.
      if (guard.suspicion <= 0 && !seen) {
        guard.state = GUARD_STATE.RETURN;
      }
      break;
    }
    case GUARD_STATE.SEARCH: {
      guard.searchTimer -= dt;
      guard.angle += dt * 1.6; // sweep the area, looking for the thief
      if (guard.searchTimer <= 0) guard.state = GUARD_STATE.RETURN;
      break;
    }
    case GUARD_STATE.RETURN: {
      // Walk back to the nearest waypoint and resume the patrol.
      let best = 0;
      let bestD = Infinity;
      guard.waypoints.forEach((wp, i) => {
        const dd = dist(guard.x, guard.y, wp.x, wp.y);
        if (dd < bestD) {
          bestD = dd;
          best = i;
        }
      });
      const wp = guard.waypoints[best];
      if (moveToward(guard, wp.x, wp.y, GUARD.patrolSpeed, dt, level)) {
        guard.wpIndex = (best + 1) % guard.waypoints.length;
        guard.state = GUARD_STATE.PATROL;
        guard.suspicion = 0;
      }
      break;
    }
    default:
      break;
  }

  // Caught: a chasing guard closes in.
  const caught = guard.state === GUARD_STATE.CHASE && dist(guard.x, guard.y, player.x, player.y) < GUARD.catchRadius;
  return { seen, caught };
}

// A noise event (running feet, a pebble) pulls a guard to investigate,
// unless it is already chasing.
export function guardHears(guard, noise) {
  if (guard.state === GUARD_STATE.CHASE) return;
  const d = dist(guard.x, guard.y, noise.x, noise.y);
  if (d > noise.radius) return;
  if (guard.state === GUARD_STATE.INVESTIGATE || guard.state === GUARD_STATE.SEARCH) {
    // A fresher noise re-targets the search.
    guard.investigateTarget = { x: noise.x, y: noise.y };
    if (guard.state === GUARD_STATE.SEARCH) guard.state = GUARD_STATE.INVESTIGATE;
    return;
  }
  guard.state = GUARD_STATE.INVESTIGATE;
  guard.investigateTarget = { x: noise.x, y: noise.y };
  guard.suspicion = Math.max(guard.suspicion, 0.45);
}
