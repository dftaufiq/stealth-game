// render.js — everything the player sees: the night yard, the guards and
// their vision cones, the lighthouse beam, the dark with holes of light
// around the thief, and the HUD with its detection meter and minimap.
import { TILE, VIEW_W, VIEW_H, COLORS, GUARD } from './config.js';
import { tileHash } from './random.js';

const darkCanvas = document.createElement('canvas');
darkCanvas.width = VIEW_W;
darkCanvas.height = VIEW_H;
const darkCtx = darkCanvas.getContext('2d');

export function cameraFor(game) {
  const worldW = game.level.cols * TILE;
  const worldH = game.level.rows * TILE;
  const cx = Math.max(0, Math.min(worldW - VIEW_W, game.player.x - VIEW_W / 2));
  const cy = Math.max(0, Math.min(worldH - VIEW_H, game.player.y - VIEW_H / 2));
  return { x: cx, y: cy };
}

function conePath(ctx, x, y, angle, halfAngle, range) {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.arc(x, y, range, angle - halfAngle, angle + halfAngle);
  ctx.closePath();
}

function drawFloor(ctx, game, cam) {
  const { level } = game;
  const x0 = Math.max(0, Math.floor(cam.x / TILE));
  const y0 = Math.max(0, Math.floor(cam.y / TILE));
  const x1 = Math.min(level.cols - 1, Math.ceil((cam.x + VIEW_W) / TILE));
  const y1 = Math.min(level.rows - 1, Math.ceil((cam.y + VIEW_H) / TILE));
  for (let ty = y0; ty <= y1; ty++) {
    for (let tx = x0; tx <= x1; tx++) {
      const ch = level.grid[ty][tx];
      const px = tx * TILE;
      const py = ty * TILE;
      const h = tileHash(tx, ty, level.seed);
      if (ch === '#') {
        ctx.fillStyle = COLORS.wall;
        ctx.fillRect(px, py, TILE, TILE);
        ctx.fillStyle = COLORS.wallTop;
        ctx.fillRect(px, py, TILE, 3);
        if (h > 0.6) {
          ctx.fillStyle = 'rgba(255,255,255,0.04)';
          ctx.fillRect(px + 4, py + 8, TILE - 8, 2);
        }
      } else if (ch === 'T') {
        ctx.fillStyle = '#1a2233';
        ctx.fillRect(px, py, TILE, TILE);
        ctx.strokeStyle = '#3d4a68';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(px + TILE / 2, py + TILE / 2, 10, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = '#ffe28c';
        ctx.beginPath();
        ctx.arc(px + TILE / 2, py + TILE / 2, 5, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillStyle = h > 0.5 ? COLORS.floorA : COLORS.floorB;
        ctx.fillRect(px, py, TILE, TILE);
        ctx.fillStyle = 'rgba(255,255,255,0.025)';
        ctx.fillRect(px, py, TILE, 1);
        if (ch === 'B') {
          // A bush: a dark thicket the thief can vanish into.
          ctx.fillStyle = COLORS.bush;
          ctx.beginPath();
          ctx.arc(px + 10, py + 12, 11, 0, Math.PI * 2);
          ctx.arc(px + 22, py + 10, 12, 0, Math.PI * 2);
          ctx.arc(px + 16, py + 22, 11, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = COLORS.bushLeaf;
          ctx.beginPath();
          ctx.arc(px + 12, py + 11, 5, 0, Math.PI * 2);
          ctx.arc(px + 21, py + 20, 5, 0, Math.PI * 2);
          ctx.arc(px + 24, py + 12, 4, 0, Math.PI * 2);
          ctx.fill();
        } else if (ch === 'C') {
          ctx.fillStyle = COLORS.crate;
          ctx.fillRect(px + 3, py + 3, TILE - 6, TILE - 6);
          ctx.strokeStyle = COLORS.crateEdge;
          ctx.lineWidth = 2;
          ctx.strokeRect(px + 3, py + 3, TILE - 6, TILE - 6);
          ctx.beginPath();
          ctx.moveTo(px + 3, py + 3);
          ctx.lineTo(px + TILE - 3, py + TILE - 3);
          ctx.moveTo(px + TILE - 3, py + 3);
          ctx.lineTo(px + 3, py + TILE - 3);
          ctx.stroke();
        }
      }
    }
  }
}

function drawLensesAndExit(ctx, game, time) {
  const { level } = game;
  const pulse = 0.65 + 0.35 * Math.sin(time * 3);
  for (const lens of level.lenses) {
    if (lens.taken) continue;
    const x = (lens.tx + 0.5) * TILE;
    const y = (lens.ty + 0.5) * TILE;
    ctx.save();
    ctx.globalAlpha = pulse;
    ctx.fillStyle = COLORS.lens;
    ctx.shadowColor = COLORS.lens;
    ctx.shadowBlur = 18;
    ctx.beginPath();
    ctx.moveTo(x, y - 10);
    ctx.lineTo(x + 7, y);
    ctx.lineTo(x, y + 10);
    ctx.lineTo(x - 7, y);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
  const exit = level.exit;
  const ex = (exit.tx + 0.5) * TILE;
  const ey = (exit.ty + 0.5) * TILE;
  const open = game.lensesLeft === 0;
  ctx.save();
  ctx.globalAlpha = open ? 0.9 : 0.45;
  ctx.fillStyle = open ? COLORS.exit : '#5a6b52';
  ctx.shadowColor = COLORS.exit;
  ctx.shadowBlur = open ? 22 : 0;
  ctx.fillRect(ex - 13, ey - 14, 26, 28);
  ctx.fillStyle = '#0c1a10';
  ctx.fillRect(ex - 8, ey - 9, 16, 18);
  ctx.restore();
  if (open) {
    ctx.save();
    ctx.font = 'bold 13px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = COLORS.exit;
    ctx.fillText('EXIT OPEN', ex, ey - 22);
    ctx.restore();
  }
}

function drawPebbles(ctx, game) {
  for (const p of game.pebbles) {
    if (!p.alive && !p.landed) continue;
    ctx.fillStyle = '#cfd6e4';
    ctx.beginPath();
    ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
    ctx.fill();
  }
  // Ripples where a pebble just landed.
  for (const r of game.ripples) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, 1 - r.age / 0.9);
    ctx.strokeStyle = '#ffe9a8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(r.x, r.y, 6 + r.age * 90, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
}

function drawGuards(ctx, game) {
  for (const g of game.guards) {
    // Body: a watchman with a helmet and a lamp on his chest.
    ctx.fillStyle = COLORS.guardUniform;
    ctx.beginPath();
    ctx.arc(g.x, g.y, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = COLORS.guard;
    ctx.beginPath();
    ctx.arc(g.x, g.y, 8, 0, Math.PI * 2);
    ctx.fill();
    // Facing tick.
    ctx.strokeStyle = '#ffd65a';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(g.x, g.y);
    ctx.lineTo(g.x + Math.cos(g.angle) * 15, g.y + Math.sin(g.angle) * 15);
    ctx.stroke();
  }
}

function drawPlayer(ctx, game, time) {
  const p = game.player;
  const bob = p.moving ? Math.sin(p.stepPhase * 6) * 1.5 : 0;
  ctx.save();
  ctx.translate(p.x, p.y + bob * 0.3);
  // Cloak.
  ctx.fillStyle = COLORS.playerCloak;
  ctx.beginPath();
  ctx.arc(0, 0, 12, 0, Math.PI * 2);
  ctx.fill();
  // Hood and face.
  ctx.fillStyle = COLORS.player;
  ctx.beginPath();
  ctx.arc(Math.cos(Math.atan2(p.fy, p.fx)) * 3, Math.sin(Math.atan2(p.fy, p.fx)) * 3, 6.5, 0, Math.PI * 2);
  ctx.fill();
  // The thief's little lantern.
  ctx.fillStyle = '#ffe28c';
  ctx.shadowColor = '#ffe28c';
  ctx.shadowBlur = 12;
  ctx.beginPath();
  ctx.arc(8, 6, 2.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  if (p.hidden) {
    ctx.save();
    ctx.font = 'bold 11px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#9fe8a9';
    ctx.fillText('HIDDEN', p.x, p.y - 20);
    ctx.restore();
  }
}

function drawCones(ctx, game) {
  // The lighthouse beam sweeps the yard.
  if (game.beam) {
    ctx.save();
    conePath(ctx, game.beam.x, game.beam.y, game.beam.angle, 0.17, 430);
    ctx.fillStyle = COLORS.beam;
    ctx.fill();
    ctx.restore();
  }
  // Cameras sweep their arcs.
  for (const cam of game.cameras) {
    ctx.save();
    conePath(ctx, cam.x, cam.y, cam.angle, 0.5, 250);
    ctx.fillStyle = 'rgba(255, 90, 90, 0.16)';
    ctx.fill();
    ctx.fillStyle = '#c94f43';
    ctx.beginPath();
    ctx.arc(cam.x, cam.y, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  // Guard vision cones, coloured by state.
  for (const g of game.guards) {
    const color =
      g.state === 'chase'
        ? COLORS.coneAlert
        : g.state === 'suspicious' || g.state === 'investigate'
          ? COLORS.coneSuspicious
          : COLORS.coneCalm;
    const edge =
      g.state === 'chase'
        ? 'rgba(255, 70, 60, 0.6)'
        : g.state === 'suspicious' || g.state === 'investigate'
          ? 'rgba(255, 150, 60, 0.5)'
          : COLORS.coneCalmEdge;
    ctx.save();
    conePath(ctx, g.x, g.y, g.angle, GUARD.viewHalfAngle, GUARD.viewRange);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = edge;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();
    // "?" while suspicious, "!" while hunting.
    if (g.state === 'suspicious' || g.state === 'investigate' || g.state === 'search') {
      ctx.save();
      ctx.font = 'bold 20px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ffb03a';
      ctx.fillText('?', g.x, g.y - 22);
      ctx.restore();
    } else if (g.state === 'chase') {
      ctx.save();
      ctx.font = 'bold 22px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ff5040';
      ctx.fillText('!', g.x, g.y - 22);
      ctx.restore();
    }
  }
}

function drawDarkness(ctx, game, cam) {
  const d = darkCtx;
  d.setTransform(1, 0, 0, 1, 0, 0);
  d.clearRect(0, 0, VIEW_W, VIEW_H);
  d.fillStyle = COLORS.darkness;
  d.fillRect(0, 0, VIEW_W, VIEW_H);
  d.globalCompositeOperation = 'destination-out';
  const hole = (wx, wy, r, strength) => {
    const x = wx - cam.x;
    const y = wy - cam.y;
    const grad = d.createRadialGradient(x, y, 0, x, y, r);
    grad.addColorStop(0, `rgba(0,0,0,${strength})`);
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    d.fillStyle = grad;
    d.beginPath();
    d.arc(x, y, r, 0, Math.PI * 2);
    d.fill();
  };
  // The thief's lantern is the brightest light in the yard.
  hole(game.player.x, game.player.y, 230, 0.95);
  // Every guard carries a lamp, so the watch itself lights the floor
  // around it — guards stay visible against the dark.
  for (const g of game.guards) hole(g.x, g.y, 85, 0.5);
  for (const cam of game.cameras) hole(cam.x, cam.y, 55, 0.4);
  for (const lens of game.level.lenses) {
    if (!lens.taken) hole((lens.tx + 0.5) * TILE, (lens.ty + 0.5) * TILE, 70, 0.8);
  }
  const ex = game.level.exit;
  hole((ex.tx + 0.5) * TILE, (ex.ty + 0.5) * TILE, 90, 0.8);
  if (game.level.tower) {
    hole(game.level.tower.x * TILE, game.level.tower.y * TILE, 130, 0.9);
  }
  d.globalCompositeOperation = 'source-over';
  ctx.drawImage(darkCanvas, 0, 0);
}

function drawHud(ctx, game) {
  const { level } = game;
  ctx.save();
  // Top bar.
  ctx.fillStyle = 'rgba(5, 8, 18, 0.72)';
  ctx.fillRect(0, 0, VIEW_W, 52);
  ctx.fillStyle = '#e8ecf5';
  ctx.font = 'bold 16px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(level.def.name, 16, 22);
  ctx.font = '13px system-ui, sans-serif';
  ctx.fillStyle = '#9fb0d0';
  const lensText =
    game.lensesLeft > 0
      ? `Lenses ${game.lensesGot}/${game.lensesTotal} — then reach the exit`
      : 'All lenses stolen — reach the exit!';
  ctx.fillText(lensText, 16, 41);

  // Detection meter, centre.
  const det = game.detection;
  const label = det > 0.85 ? 'HUNTED' : det > 0.35 ? 'SUSPICIOUS' : 'UNSEEN';
  const color = det > 0.85 ? '#ff5040' : det > 0.35 ? '#ffb03a' : '#8dff9e';
  ctx.textAlign = 'center';
  ctx.font = 'bold 13px system-ui, sans-serif';
  ctx.fillStyle = color;
  ctx.fillText(label, VIEW_W / 2, 20);
  ctx.fillStyle = 'rgba(255,255,255,0.16)';
  ctx.fillRect(VIEW_W / 2 - 110, 28, 220, 10);
  ctx.fillStyle = color;
  ctx.fillRect(VIEW_W / 2 - 110, 28, 220 * det, 10);

  // Right: time, score, pebbles.
  ctx.textAlign = 'right';
  ctx.fillStyle = '#e8ecf5';
  ctx.font = 'bold 15px system-ui, sans-serif';
  ctx.fillText(`⏱ ${fmtTime(game.time)}   ★ ${game.score}`, VIEW_W - 16, 22);
  ctx.font = '13px system-ui, sans-serif';
  ctx.fillStyle = '#9fb0d0';
  ctx.fillText(`Pebbles ${game.player.pebbles}  (click / Q to throw)`, VIEW_W - 16, 41);

  // Bottom hint.
  ctx.textAlign = 'left';
  ctx.font = '12px system-ui, sans-serif';
  ctx.fillStyle = 'rgba(232,236,245,0.55)';
  ctx.fillText('WASD / arrows move · Shift sneak · Space run · E pick up · R retry level · P pause · M mute', 16, VIEW_H - 12);
  ctx.restore();
}

function fmtTime(t) {
  const m = Math.floor(t / 60);
  const s = Math.floor(t % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

function drawMinimap(ctx, game) {
  const { level } = game;
  const scale = 0.11;
  const w = level.cols * TILE * scale;
  const h = level.rows * TILE * scale;
  const x0 = VIEW_W - w - 16;
  const y0 = VIEW_H - h - 36;
  ctx.save();
  ctx.fillStyle = 'rgba(5, 8, 18, 0.75)';
  ctx.fillRect(x0 - 6, y0 - 6, w + 12, h + 22);
  ctx.strokeStyle = 'rgba(255,255,255,0.25)';
  ctx.strokeRect(x0 - 6, y0 - 6, w + 12, h + 22);
  for (let ty = 0; ty < level.rows; ty++) {
    for (let tx = 0; tx < level.cols; tx++) {
      const ch = level.grid[ty][tx];
      if (ch === '#') ctx.fillStyle = '#4a5468';
      else if (ch === 'C') ctx.fillStyle = '#6b4e2e';
      else if (ch === 'B') ctx.fillStyle = '#1e4a2c';
      else if (ch === 'T') ctx.fillStyle = '#ffe28c';
      else continue;
      ctx.fillRect(x0 + tx * TILE * scale, y0 + ty * TILE * scale, TILE * scale + 0.5, TILE * scale + 0.5);
    }
  }
  for (const lens of level.lenses) {
    if (lens.taken) continue;
    ctx.fillStyle = '#7fe7ff';
    ctx.fillRect(x0 + lens.tx * TILE * scale, y0 + lens.ty * TILE * scale, 4, 4);
  }
  const ex = level.exit;
  ctx.fillStyle = game.lensesLeft === 0 ? '#8dff9e' : '#5a6b52';
  ctx.fillRect(x0 + ex.tx * TILE * scale, y0 + ex.ty * TILE * scale, 5, 5);
  for (const g of game.guards) {
    ctx.fillStyle = g.state === 'chase' ? '#ff5040' : '#ff9a7a';
    ctx.beginPath();
    ctx.arc(x0 + g.x * scale, y0 + g.y * scale, 3, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(x0 + game.player.x * scale, y0 + game.player.y * scale, 3.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.font = '10px system-ui, sans-serif';
  ctx.fillStyle = 'rgba(232,236,245,0.7)';
  ctx.textAlign = 'left';
  ctx.fillText('MAP', x0, y0 + h + 10);
  ctx.restore();
}

function overlay(ctx, title, lines, accent) {
  ctx.save();
  ctx.fillStyle = 'rgba(3, 5, 14, 0.82)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.textAlign = 'center';
  ctx.fillStyle = accent;
  ctx.font = 'bold 52px Georgia, serif';
  ctx.fillText(title, VIEW_W / 2, VIEW_H / 2 - 110);
  ctx.fillStyle = '#e8ecf5';
  ctx.font = '17px system-ui, sans-serif';
  lines.forEach((line, i) => {
    ctx.fillText(line, VIEW_W / 2, VIEW_H / 2 - 58 + i * 28);
  });
  ctx.restore();
}

export function drawGame(ctx, game, time) {
  const cam = cameraFor(game);
  ctx.save();
  ctx.clearRect(0, 0, VIEW_W, VIEW_H);
  ctx.fillStyle = '#0a0e18';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.translate(-cam.x, -cam.y);
  drawFloor(ctx, game, cam);
  drawLensesAndExit(ctx, game, time);
  drawPebbles(ctx, game);
  drawGuards(ctx, game);
  drawPlayer(ctx, game, time);
  drawDarkness(ctx, game, cam);
  drawCones(ctx, game);
  ctx.restore();

  drawHud(ctx, game);
  drawMinimap(ctx, game);

  // State overlays.
  if (game.screen === 'title') {
    overlay(ctx, 'LANTERNKEEP', [
      'A stealth game at the lighthouse — three nights, three break-ins.',
      'Steal every signal lens. Stay out of the cones. Reach the exit unseen.',
      '',
      'WASD / arrows — move      Shift — sneak      Space — run',
      'Click or Q — throw a pebble      E — pick up      R — retry level',
      '',
      'Click or press Enter to begin.',
    ], '#ffe28c');
  } else if (game.screen === 'intro') {
    overlay(ctx, game.level.def.name, [
      game.level.def.story,
      '',
      `Guards on patrol: ${game.guards.length}   ·   Lenses to steal: ${game.lensesTotal}`,
      game.beam ? 'The lighthouse beam sweeps the yard — do not stand in its light.' : 'Cameras sweep the halls — their gaze raises the alarm.',
      '',
      'Press Enter to slip in.',
    ], '#ffe28c');
  } else if (game.screen === 'caught') {
    overlay(ctx, 'SPOTTED!', [
      'The watch caught you in the light.',
      `Alarms raised so far: ${game.alarms}`,
      '',
      'Press R to try the level again.',
    ], '#ff5040');
  } else if (game.screen === 'levelDone') {
    overlay(ctx, 'LEVEL CLEAR', [
      `${game.level.def.name} — done in ${fmtTime(game.levelTime)}.`,
      `Alarms: ${game.levelAlarms}   ·   Score: ${game.score}`,
      game.levelAlarms === 0 ? 'Ghost — nobody ever knew you were there.' : 'Seen, but gone before they could catch you.',
      '',
      'Press Enter for the next level.',
    ], '#8dff9e');
  } else if (game.screen === 'victory') {
    overlay(ctx, 'THE LAMP IS YOURS', [
      'Three lenses, three nights, one clean getaway.',
      `Total time ${fmtTime(game.time)}   ·   Alarms ${game.alarms}   ·   Score ${game.score}`,
      game.alarms === 0 ? 'Rating: GHOST — the perfect thief.' : game.alarms <= 2 ? 'Rating: SHADOW — barely a whisper.' : 'Rating: THIEF — loud, but gone.',
      '',
      'Thank you for playing Lanternkeep.',
    ], '#ffe28c');
  } else if (game.screen === 'paused') {
    overlay(ctx, 'PAUSED', ['Press P to keep sneaking.'], '#e8ecf5');
  }
}
