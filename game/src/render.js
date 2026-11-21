// The Quiet Gallery — drawing: the floor, the walls, the cover, the guards
// and their vision cones, the thief, the relics, the exit and the HUD.
import { VIEW, COLORS, GUARD } from './config.js';
import { coneReach } from './vision.js';
import { maxSuspicion, anyChase } from './guards.js';

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawFloor(ctx, level) {
  ctx.fillStyle = COLORS.floor;
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  ctx.strokeStyle = COLORS.floorLine;
  ctx.lineWidth = 1;
  for (let x = 40; x < VIEW.width; x += 80) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, VIEW.height); ctx.stroke();
  }
  for (let y = 40; y < VIEW.height; y += 80) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(VIEW.width, y); ctx.stroke();
  }
}

function drawWalls(ctx, level) {
  for (const w of level.walls) {
    ctx.fillStyle = COLORS.wall;
    ctx.fillRect(w.x, w.y, w.w, w.h);
    ctx.fillStyle = COLORS.wallTop;
    if (w.h <= 18) ctx.fillRect(w.x, w.y, w.w, 4);
    else ctx.fillRect(w.x, w.y, 4, w.h);
  }
}

function drawCover(ctx, level) {
  for (const c of level.cover) {
    if (c.kind === 'case') {
      ctx.fillStyle = COLORS.caseFrame;
      rr(ctx, c.x, c.y, c.w, c.h, 6); ctx.fill();
      ctx.fillStyle = COLORS.caseGlass;
      rr(ctx, c.x + 5, c.y + 5, c.w - 10, c.h - 10, 4); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.16)';
      ctx.fillRect(c.x + 10, c.y + 8, c.w - 20, 6);
      ctx.fillStyle = '#d8c690';
      ctx.beginPath(); ctx.arc(c.x + c.w / 2, c.y + c.h / 2, 6, 0, Math.PI * 2); ctx.fill();
    } else if (c.kind === 'crate') {
      ctx.fillStyle = COLORS.crate;
      rr(ctx, c.x, c.y, c.w, c.h, 4); ctx.fill();
      ctx.strokeStyle = '#4a3517';
      ctx.lineWidth = 3;
      ctx.strokeRect(c.x + 6, c.y + 6, c.w - 12, c.h - 12);
      ctx.beginPath();
      ctx.moveTo(c.x + 6, c.y + 6); ctx.lineTo(c.x + c.w - 6, c.y + c.h - 6);
      ctx.moveTo(c.x + c.w - 6, c.y + 6); ctx.lineTo(c.x + 6, c.y + c.h - 6);
      ctx.stroke();
    } else {
      ctx.fillStyle = COLORS.statue;
      rr(ctx, c.x, c.y, c.w, c.h, 6); ctx.fill();
      ctx.fillStyle = '#a9aec2';
      ctx.beginPath(); ctx.arc(c.x + c.w / 2, c.y + c.h / 2 - 4, 11, 0, Math.PI * 2); ctx.fill();
    }
  }
  for (const p of level.plants) {
    ctx.fillStyle = COLORS.plant;
    ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = COLORS.plantLeaf;
    for (let i = 0; i < 5; i += 1) {
      const a = (i / 5) * Math.PI * 2 + 0.4;
      ctx.beginPath();
      ctx.ellipse(p.x + Math.cos(a) * 13, p.y + Math.sin(a) * 13, 12, 6, a, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawRelics(ctx, level, t) {
  for (const r of level.relics) {
    if (r.taken) continue;
    const pulse = 1 + Math.sin(t * 3 + r.x) * 0.12;
    ctx.save();
    ctx.translate(r.x, r.y);
    ctx.rotate(Math.PI / 4);
    ctx.fillStyle = 'rgba(255, 211, 77, 0.25)';
    ctx.fillRect(-15 * pulse, -15 * pulse, 30 * pulse, 30 * pulse);
    ctx.fillStyle = COLORS.relic;
    ctx.fillRect(-9, -9, 18, 18);
    ctx.fillStyle = '#fff3c4';
    ctx.fillRect(-4, -4, 8, 8);
    ctx.restore();
  }
}

function drawExit(ctx, level, relicsTaken, t) {
  const e = level.exit;
  const open = relicsTaken >= level.relics.length;
  const glow = open ? 0.5 + Math.sin(t * 4) * 0.25 : 0.12;
  ctx.fillStyle = open ? COLORS.exitOpen : COLORS.exitLocked;
  ctx.globalAlpha = glow;
  ctx.fillRect(e.x - 8, e.y - 8, e.w + 16, e.h + 16);
  ctx.globalAlpha = 1;
  ctx.fillStyle = open ? '#12351f' : '#3d1515';
  rr(ctx, e.x, e.y, e.w, e.h, 4); ctx.fill();
  ctx.strokeStyle = open ? '#7be495' : '#c46a6a';
  ctx.lineWidth = 3;
  rr(ctx, e.x, e.y, e.w, e.h, 4); ctx.stroke();
  ctx.fillStyle = open ? '#b8f5c9' : '#e8a0a0';
  ctx.font = 'bold 13px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(open ? 'EXIT' : 'LOCKED', e.x + e.w / 2, e.y + e.h / 2 - 8);
  ctx.font = '11px system-ui, sans-serif';
  ctx.fillText(open ? 'GO!' : `${relicsTaken}/${level.relics.length}`, e.x + e.w / 2, e.y + e.h / 2 + 10);
}

function drawCone(ctx, guard, level) {
  const hot = guard.mode === 'chase' || guard.suspicion > 55;
  const reach = coneReach(guard, guard.angle, level.blockers);
  ctx.save();
  ctx.translate(guard.x, guard.y);
  ctx.rotate(guard.angle);
  const grad = ctx.createRadialGradient(0, 0, 10, 0, 0, reach);
  grad.addColorStop(0, hot ? 'rgba(255, 90, 60, 0.42)' : 'rgba(255, 200, 90, 0.30)');
  grad.addColorStop(1, hot ? 'rgba(255, 90, 60, 0.05)' : 'rgba(255, 200, 90, 0.03)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.arc(0, 0, reach, -GUARD.viewHalfAngle, GUARD.viewHalfAngle);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = hot ? 'rgba(255, 120, 90, 0.7)' : COLORS.coneEdge;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(Math.cos(-GUARD.viewHalfAngle) * reach, Math.sin(-GUARD.viewHalfAngle) * reach);
  ctx.moveTo(0, 0);
  ctx.lineTo(Math.cos(GUARD.viewHalfAngle) * reach, Math.sin(GUARD.viewHalfAngle) * reach);
  ctx.stroke();
  ctx.restore();
}

function drawGuards(ctx, guards, t) {
  for (const g of guards) {
    ctx.save();
    ctx.translate(g.x, g.y);
    ctx.fillStyle = g.mode === 'chase' ? COLORS.guard : COLORS.guardCalm;
    ctx.beginPath(); ctx.arc(0, 0, GUARD.radius, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#2b0f0c';
    ctx.lineWidth = 2;
    ctx.stroke();
    // Facing tick + torch dot.
    ctx.rotate(g.angle);
    ctx.fillStyle = '#ffe9c9';
    ctx.beginPath(); ctx.arc(8, 0, 4, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    ctx.fillStyle = '#ffd9d4';
    ctx.font = 'bold 11px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(g.name, g.x, g.y - GUARD.radius - 6);
    if (g.suspicion > 12 || g.mode === 'chase') {
      const mark = g.mode === 'chase' ? '!' : '?';
      const bob = Math.sin(t * 8) * 2;
      ctx.fillStyle = g.mode === 'chase' ? '#ff5140' : '#ffc44d';
      ctx.font = 'bold 22px system-ui, sans-serif';
      ctx.fillText(mark, g.x, g.y - GUARD.radius - 20 + bob);
    }
  }
}

function drawPlayer(ctx, player, t) {
  ctx.save();
  ctx.translate(player.x, player.y);
  if (player.hidden) {
    ctx.fillStyle = 'rgba(55, 224, 216, 0.18)';
    ctx.beginPath(); ctx.arc(0, 0, 24, 0, Math.PI * 2); ctx.fill();
  }
  ctx.fillStyle = COLORS.player;
  ctx.beginPath(); ctx.arc(0, 0, 14, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#0b3b38';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.rotate(player.angle);
  ctx.fillStyle = '#0b3b38';
  ctx.beginPath();
  ctx.moveTo(14, 0); ctx.lineTo(4, -6); ctx.lineTo(4, 6);
  ctx.closePath(); ctx.fill();
  ctx.restore();
  if (player.hidden) {
    ctx.fillStyle = '#9be8a9';
    ctx.font = 'bold 11px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('HIDDEN', player.x, player.y - 24);
  }
}

function drawHud(ctx, game, t) {
  const { level, guards, relicsTaken, time } = game;
  ctx.save();
  ctx.fillStyle = 'rgba(8, 10, 16, 0.72)';
  rr(ctx, 12, 12, 1240, 44, 8); ctx.fill();
  ctx.fillStyle = COLORS.hud;
  ctx.font = 'bold 15px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(`◆ Relics ${relicsTaken}/${level.relics.length}`, 28, 35);
  const mm = String(Math.floor(time / 60)).padStart(2, '0');
  const ss = String(Math.floor(time % 60)).padStart(2, '0');
  ctx.fillText(`⏱ ${mm}:${ss}`, 220, 35);
  // Alarm meter.
  const suspicion = maxSuspicion(guards);
  const chase = anyChase(guards);
  const bx = 560;
  ctx.fillStyle = COLORS.hudDim;
  ctx.font = 'bold 13px system-ui, sans-serif';
  ctx.fillText(chase ? 'SPOTTED — RUN!' : 'ALARM', bx, 35);
  ctx.fillStyle = '#262c3d';
  rr(ctx, bx + 130, 24, 260, 16, 8); ctx.fill();
  ctx.fillStyle = suspicion > 55 ? '#ff5140' : suspicion > 12 ? '#ffc44d' : '#3fae6a';
  if (suspicion > 0.5) { rr(ctx, bx + 130, 24, 260 * (suspicion / 100), 16, 8); ctx.fill(); }
  ctx.fillStyle = COLORS.hudDim;
  ctx.textAlign = 'right';
  ctx.fillText('THE QUIET GALLERY', 1252, 35);
  ctx.restore();
}

function overlay(ctx, title, lines, accent) {
  ctx.save();
  ctx.fillStyle = 'rgba(6, 8, 13, 0.66)';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  ctx.fillStyle = accent;
  ctx.font = 'bold 52px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(title, VIEW.width / 2, 300);
  ctx.fillStyle = COLORS.hud;
  ctx.font = '20px system-ui, sans-serif';
  lines.forEach((line, i) => ctx.fillText(line, VIEW.width / 2, 360 + i * 34));
  ctx.restore();
}

export function render(ctx, game, t) {
  const { level, player, guards } = game;
  ctx.clearRect(0, 0, VIEW.width, VIEW.height);
  drawFloor(ctx, level);
  drawRelics(ctx, level, t);
  drawExit(ctx, level, game.relicsTaken, t);
  drawCover(ctx, level);
  drawWalls(ctx, level);
  for (const g of guards) drawCone(ctx, g, level);
  drawGuards(ctx, guards, t);
  drawPlayer(ctx, player, t);
  drawHud(ctx, game, t);
  if (game.state === 'title') {
    overlay(ctx, 'THE QUIET GALLERY', [
      'A museum after midnight. Three relics. Four guards.',
      'Slip past their vision cones, hide behind the cases,',
      'and reach the EXIT unseen.  Press ENTER to begin.',
    ], '#ffd34d');
  } else if (game.state === 'caught') {
    overlay(ctx, 'CAUGHT!', [
      `The guard ${game.caughtByName} caught you at ${game.timeText}.`,
      'Press R to try again — slower, quieter, behind cover.',
    ], '#ff5140');
  } else if (game.state === 'win') {
    overlay(ctx, 'ESCAPED UNSEEN', [
      `All three relics, out in ${game.timeText} — ${game.ghost ? 'GHOST: never once spotted.' : 'spotted once, but free.'}`,
      'Press R to run it again, cleaner this time.',
    ], '#7be495');
  }
}
