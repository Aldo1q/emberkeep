// All drawing: forest board, path, lantern, pads, towers, enemies, HUD, screens.
import { W, H, TOPBAR, PATH, LANTERN, PATH_HALF, PADS, PAD_R, TOWERS, TOWER_ORDER, BTN, MENU, OVERLAY_BTN, TOTAL_WAVES, fmt } from './config.js';
import { towerStats, upgradeCost, sellValue } from './towers.js';
import { drawParticles } from './particles.js';

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawForest(ctx, t) {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#1d2f24'); g.addColorStop(0.55, '#16241c'); g.addColorStop(1, '#101a13');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  // Distant tree silhouettes.
  ctx.fillStyle = 'rgba(8, 18, 12, 0.55)';
  for (let i = 0; i < 26; i++) {
    const x = (i * 97 + 31) % W;
    const y = TOPBAR + 8 + ((i * 53) % 60);
    ctx.beginPath();
    ctx.moveTo(x, y + 120); ctx.lineTo(x + 34, y); ctx.lineTo(x + 68, y + 120);
    ctx.closePath(); ctx.fill();
  }
  // Fireflies drifting.
  for (let i = 0; i < 14; i++) {
    const x = (i * 173 + t * 12 * (1 + (i % 3))) % W;
    const y = TOPBAR + 40 + ((i * 67) % 560) + Math.sin(t * 0.7 + i) * 8;
    ctx.globalAlpha = 0.25 + 0.2 * Math.sin(t * 2 + i * 2);
    ctx.fillStyle = '#ffe9a8';
    ctx.beginPath(); ctx.arc(x, y, 2, 0, Math.PI * 2); ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawPath(ctx) {
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(PATH[0][0], PATH[0][1]);
  for (let i = 1; i < PATH.length; i++) ctx.lineTo(PATH[i][0], PATH[i][1]);
  ctx.strokeStyle = '#3a2f22'; ctx.lineWidth = PATH_HALF * 2 + 8; ctx.stroke();
  ctx.strokeStyle = '#6b5636'; ctx.lineWidth = PATH_HALF * 2; ctx.stroke();
  ctx.strokeStyle = 'rgba(255, 220, 150, 0.25)'; ctx.lineWidth = 2;
  ctx.setLineDash([14, 18]);
  ctx.beginPath();
  ctx.moveTo(PATH[0][0], PATH[0][1]);
  for (let i = 1; i < PATH.length; i++) ctx.lineTo(PATH[i][0], PATH[i][1]);
  ctx.stroke(); ctx.setLineDash([]);
}

function drawLantern(ctx, hp, maxHp, t, shake) {
  const { x, y } = LANTERN;
  const flick = 0.75 + 0.25 * Math.sin(t * 5) * Math.sin(t * 2.3);
  const glowR = 70 + 14 * flick;
  const g = ctx.createRadialGradient(x, y, 4, x, y, glowR);
  g.addColorStop(0, 'rgba(255, 214, 110, 0.85)');
  g.addColorStop(1, 'rgba(255, 180, 60, 0)');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(x, y, glowR, 0, Math.PI * 2); ctx.fill();
  // Stone base + lantern body.
  ctx.fillStyle = '#4a4038';
  ctx.fillRect(x - 20, y + 14, 40, 12);
  ctx.fillStyle = '#2c241c';
  ctx.fillRect(x - 12, y - 26, 24, 40);
  ctx.fillStyle = `rgba(255, ${190 + Math.floor(40 * flick)}, 90, 0.95)`;
  ctx.fillRect(x - 9, y - 22, 18, 30);
  ctx.fillStyle = '#2c241c';
  ctx.beginPath(); ctx.moveTo(x - 14, y - 26); ctx.lineTo(x, y - 38); ctx.lineTo(x + 14, y - 26); ctx.closePath(); ctx.fill();
  // HP bar above the lantern.
  ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(x - 30, y - 56, 60, 9);
  ctx.fillStyle = hp > maxHp * 0.35 ? '#ffb84d' : '#ff5a4d';
  ctx.fillRect(x - 29, y - 55, 58 * Math.max(0, hp / maxHp), 7);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 11px Georgia, serif'; ctx.textAlign = 'center';
  ctx.fillText(`Lantern ${hp}/${maxHp}`, x, y - 62);
  if (shake > 0) { /* shake applied by caller via translate */ }
}

function drawPads(ctx, pads, selectedPad, hover) {
  for (let i = 0; i < PADS.length; i++) {
    const p = PADS[i];
    const occupied = pads[i];
    const isSel = selectedPad === i;
    ctx.beginPath(); ctx.arc(p.x, p.y, PAD_R, 0, Math.PI * 2);
    ctx.fillStyle = occupied ? 'rgba(40, 32, 24, 0.9)' : 'rgba(120, 100, 60, 0.35)';
    ctx.fill();
    ctx.lineWidth = isSel ? 3 : 2;
    ctx.strokeStyle = isSel ? '#ffd34d' : 'rgba(255, 220, 150, 0.5)';
    ctx.stroke();
    if (!occupied) {
      ctx.fillStyle = 'rgba(255, 230, 170, 0.8)';
      ctx.font = 'bold 20px Georgia, serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('+', p.x, p.y + 1);
      ctx.textBaseline = 'alphabetic';
    }
  }
}

function drawTowerShape(ctx, t, time) {
  const s = towerStats(t);
  const c = t.def.color;
  ctx.save();
  ctx.translate(t.x, t.y);
  // Range ring when selected/hovered is drawn by caller.
  ctx.fillStyle = '#2c241c';
  ctx.beginPath(); ctx.arc(0, 0, 20, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = c;
  if (t.kind === 'spark') {
    ctx.beginPath();
    for (let i = 0; i < 4; i++) {
      const a = -Math.PI / 2 + (i * Math.PI) / 2 + time * 0.4;
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, 16, a - 0.35, a + 0.35);
    }
    ctx.fill();
    ctx.fillStyle = '#fff8d0';
    ctx.beginPath(); ctx.arc(0, 0, 6, 0, Math.PI * 2); ctx.fill();
  } else if (t.kind === 'frost') {
    ctx.beginPath(); ctx.arc(0, 0, 14, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#eaf7ff'; ctx.lineWidth = 2;
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI) / 3;
      ctx.beginPath(); ctx.moveTo(Math.cos(a) * 6, Math.sin(a) * 6);
      ctx.lineTo(Math.cos(a) * 17, Math.sin(a) * 17); ctx.stroke();
    }
  } else if (t.kind === 'mortar') {
    ctx.beginPath(); ctx.arc(0, 0, 15, 0, Math.PI * 2); ctx.fill();
    ctx.save(); ctx.rotate(t.angle);
    ctx.fillStyle = '#3a2f22'; ctx.fillRect(0, -5, 22, 10);
    ctx.restore();
    ctx.fillStyle = '#1d1610'; ctx.beginPath(); ctx.arc(0, 0, 6, 0, Math.PI * 2); ctx.fill();
  } else { // prism
    ctx.save(); ctx.rotate(t.angle);
    ctx.beginPath();
    ctx.moveTo(18, 0); ctx.lineTo(-10, 10); ctx.lineTo(-10, -10); ctx.closePath();
    ctx.fill(); ctx.restore();
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(0, 0, 5, 0, Math.PI * 2); ctx.fill();
  }
  // Level pips.
  ctx.fillStyle = '#ffe9a8';
  for (let i = 0; i < t.level; i++) {
    ctx.beginPath(); ctx.arc(-10 + i * 10, 24, 3, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

function drawEnemyShape(ctx, e, time) {
  const d = e.def;
  ctx.save();
  ctx.translate(e.x, e.y);
  const bob = Math.sin(time * 4 + e.wobble) * 2;
  ctx.translate(0, bob);
  ctx.shadowColor = d.glow; ctx.shadowBlur = 12;
  ctx.fillStyle = d.color;
  if (e.kind === 'wisp') {
    ctx.beginPath(); ctx.arc(0, 0, d.radius, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.beginPath(); ctx.arc(-3, -3, 4, 0, Math.PI * 2); ctx.fill();
  } else if (e.kind === 'shade') {
    ctx.beginPath();
    ctx.moveTo(0, -d.radius); ctx.quadraticCurveTo(d.radius, 0, d.radius * 0.7, d.radius);
    ctx.lineTo(-d.radius * 0.7, d.radius); ctx.quadraticCurveTo(-d.radius, 0, 0, -d.radius);
    ctx.fill();
    ctx.fillStyle = '#1a1030';
    ctx.beginPath(); ctx.arc(-4, -3, 2.5, 0, Math.PI * 2); ctx.arc(4, -3, 2.5, 0, Math.PI * 2); ctx.fill();
  } else if (e.kind === 'brute') {
    ctx.beginPath(); ctx.arc(0, 0, d.radius, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#5a3222';
    ctx.beginPath(); ctx.arc(-6, -6, 3, 0, Math.PI * 2); ctx.arc(6, -6, 3, 0, Math.PI * 2); ctx.fill();
    ctx.fillRect(-8, 4, 16, 3);
  } else if (e.kind === 'flicker') {
    const s = 1 + 0.15 * Math.sin(time * 9 + e.wobble);
    ctx.scale(s, 1 / s);
    ctx.beginPath();
    for (let i = 0; i < 4; i++) {
      const a = (i * Math.PI) / 2 + time * 2;
      ctx.moveTo(0, 0); ctx.arc(0, 0, d.radius, a - 0.3, a + 0.3);
    }
    ctx.fill();
  } else { // wraith
    ctx.globalAlpha = 0.85;
    ctx.beginPath();
    ctx.moveTo(0, -d.radius - 4);
    ctx.quadraticCurveTo(d.radius + 4, -4, d.radius * 0.6, d.radius);
    ctx.lineTo(-d.radius * 0.6, d.radius);
    ctx.quadraticCurveTo(-d.radius - 4, -4, 0, -d.radius - 4);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#5a6fd0';
    ctx.beginPath(); ctx.arc(-4, -4, 2.5, 0, Math.PI * 2); ctx.arc(4, -4, 2.5, 0, Math.PI * 2); ctx.fill();
  }
  ctx.shadowBlur = 0;
  // HP bar.
  if (e.hp < e.maxHp) {
    ctx.fillStyle = 'rgba(0,0,0,0.65)';
    ctx.fillRect(-14, -d.radius - 12, 28, 5);
    ctx.fillStyle = '#ff6a5e';
    ctx.fillRect(-13, -d.radius - 11, 26 * Math.max(0, e.hp / e.maxHp), 3);
  }
  ctx.restore();
}

function drawProjectiles(ctx, projectiles) {
  for (const p of projectiles) {
    ctx.fillStyle = p.color;
    ctx.shadowColor = p.color; ctx.shadowBlur = 8;
    ctx.beginPath(); ctx.arc(p.x, p.y, p.kind === 'mortar' ? 7 : 5, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
  }
}

function drawButton(ctx, r, label, enabled = true) {
  ctx.fillStyle = enabled ? 'rgba(60, 44, 22, 0.92)' : 'rgba(40, 40, 40, 0.8)';
  roundRect(ctx, r.x, r.y, r.w, r.h, 8); ctx.fill();
  ctx.lineWidth = 2; ctx.strokeStyle = enabled ? '#ffd34d' : '#666';
  roundRect(ctx, r.x, r.y, r.w, r.h, 8); ctx.stroke();
  ctx.fillStyle = enabled ? '#ffe9a8' : '#999';
  ctx.font = 'bold 15px Georgia, serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(label, r.x + r.w / 2, r.y + r.h / 2 + 1);
  ctx.textBaseline = 'alphabetic';
}

function drawHUD(ctx, g) {
  ctx.fillStyle = 'rgba(10, 16, 12, 0.92)';
  ctx.fillRect(0, 0, W, TOPBAR);
  ctx.fillStyle = '#ffd34d';
  ctx.font = 'bold 20px Georgia, serif'; ctx.textAlign = 'left';
  ctx.fillText('🔥 Emberkeep', 14, 34);
  ctx.fillStyle = '#fff'; ctx.font = 'bold 15px Georgia, serif';
  ctx.fillText(`Wave ${Math.min(g.wave, TOTAL_WAVES)}/${TOTAL_WAVES}`, 190, 33);
  ctx.fillText(`Embers ${fmt(g.embers)}`, 300, 33);
  ctx.fillText(`Score ${fmt(g.score)}`, 440, 33);
  ctx.fillStyle = '#c9b8ff'; ctx.font = '13px Georgia, serif';
  ctx.fillText(`Best ${fmt(g.best)}`, 560, 33);
  ctx.fillText(`Lantern ${g.lanternHp}/${g.lanternMaxHp}`, 650, 33);
  if (g.state === 'playing' && g.waveRunning) {
    ctx.fillStyle = 'rgba(10, 16, 12, 0.85)';
    roundRect(ctx, 10, 62, 150, 26, 8); ctx.fill();
    ctx.fillStyle = '#ffb84d'; ctx.font = 'bold 14px Georgia, serif';
    ctx.fillText(`Foes left ${g.enemies.length + g.spawnQueue.length}`, 18, 80);
  }
  const waveBtn = g.waveRunning ? 'Fighting…' : (g.wave > TOTAL_WAVES ? '—' : g.state === 'title' ? 'Play' : 'Start Wave');
  drawButton(ctx, BTN.start, waveBtn, !g.waveRunning && g.state === 'playing');
  drawButton(ctx, BTN.speed, g.speed === 2 ? '2×' : '1×');
  drawButton(ctx, BTN.pause, g.state === 'paused' ? '▶' : '❚❚');
  drawButton(ctx, BTN.mute, g.muted ? '🔇' : '🔊');
  drawButton(ctx, BTN.restart, '↺');
  if (g.banner && g.bannerT > 0) {
    ctx.globalAlpha = Math.min(1, g.bannerT * 2);
    ctx.fillStyle = '#ffe9a8';
    ctx.font = 'bold 44px Georgia, serif'; ctx.textAlign = 'center';
    ctx.fillText(g.banner, W / 2, 150);
    ctx.globalAlpha = 1;
  }
}

function drawMenu(ctx, g) {
  const m = MENU;
  ctx.fillStyle = 'rgba(10, 16, 12, 0.94)';
  roundRect(ctx, m.x, m.y, m.w, m.h, 10); ctx.fill();
  ctx.strokeStyle = '#ffd34d'; ctx.lineWidth = 2;
  roundRect(ctx, m.x, m.y, m.w, m.h, 10); ctx.stroke();
  if (g.selectedPad != null && !g.pads[g.selectedPad]) {
    ctx.fillStyle = '#ffe9a8'; ctx.font = 'bold 14px Georgia, serif'; ctx.textAlign = 'left';
    ctx.fillText('Build here — click a tower (or press 1–4):', m.x + 16, m.y + 22);
    TOWER_ORDER.forEach((kind, i) => {
      const d = TOWERS[kind];
      const r = { x: m.x + 16 + i * 168, y: m.y + 30, w: 156, h: 36 };
      drawButton(ctx, r, `${d.name} · ${d.cost}🔥`, g.embers >= d.cost);
    });
  } else if (g.selectedTower) {
    const t = g.selectedTower;
    const up = upgradeCost(t);
    ctx.fillStyle = '#ffe9a8'; ctx.font = 'bold 14px Georgia, serif'; ctx.textAlign = 'left';
    ctx.fillText(`${t.def.name}  Lv${t.level}  ·  DMG ${towerStats(t).dmg}  ·  RNG ${towerStats(t).range}`, m.x + 16, m.y + 22);
    const r1 = { x: m.x + 16, y: m.y + 30, w: 220, h: 36 };
    drawButton(ctx, r1, up ? `Upgrade · ${up}🔥` : 'Max level', !!up && g.embers >= up);
    const r2 = { x: m.x + 248, y: m.y + 30, w: 160, h: 36 };
    drawButton(ctx, r2, `Sell · +${sellValue(t)}🔥`);
    const r3 = { x: m.x + 420, y: m.y + 30, w: 260, h: 36 };
    drawButton(ctx, r3, 'Click elsewhere to close');
  }
}

// Menu button rects for input routing (mirrors drawMenu layout).
export function menuRects(g) {
  const m = MENU;
  if (g.selectedPad != null && !g.pads[g.selectedPad]) {
    return TOWER_ORDER.map((kind, i) => ({ kind, rect: { x: m.x + 16 + i * 168, y: m.y + 30, w: 156, h: 36 } }));
  }
  if (g.selectedTower) {
    const up = upgradeCost(g.selectedTower);
    return [
      { action: 'upgrade', rect: { x: m.x + 16, y: m.y + 30, w: 220, h: 36 }, enabled: !!up },
      { action: 'sell', rect: { x: m.x + 248, y: m.y + 30, w: 160, h: 36 }, enabled: true },
    ];
  }
  return [];
}

function drawOverlay(ctx, title, lines, btnLabel, btnRect) {
  ctx.fillStyle = 'rgba(6, 10, 8, 0.78)';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#ffe9a8';
  ctx.font = 'bold 52px Georgia, serif'; ctx.textAlign = 'center';
  ctx.fillText(title, W / 2, 200);
  ctx.fillStyle = '#fff'; ctx.font = '20px Georgia, serif';
  lines.forEach((ln, i) => ctx.fillText(ln, W / 2, 260 + i * 34));
  drawButton(ctx, btnRect, btnLabel);
}

export function overlayButtonRect(y = 470) {
  return { x: W / 2 - OVERLAY_BTN.w / 2, y, w: OVERLAY_BTN.w, h: OVERLAY_BTN.h };
}

export function render(ctx, g) {
  ctx.save();
  if (g.shake > 0.2) ctx.translate((Math.random() - 0.5) * g.shake, (Math.random() - 0.5) * g.shake);
  drawForest(ctx, g.time);
  drawPath(ctx);
  drawLantern(ctx, g.lanternHp, g.lanternMaxHp, g.time, g.shake);
  drawPads(ctx, g.pads, g.selectedPad, g.mouse);
  // Range ring for selected / hovered tower.
  const hoverTower = g.hoverTower;
  if (hoverTower) {
    const s = towerStats(hoverTower);
    ctx.strokeStyle = 'rgba(255, 211, 77, 0.5)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(hoverTower.x, hoverTower.y, s.range, 0, Math.PI * 2); ctx.stroke();
  }
  for (const t of g.towers) drawTowerShape(ctx, t, g.time);
  for (const e of g.enemies) drawEnemyShape(ctx, e, g.time);
  drawProjectiles(ctx, g.projectiles);
  drawParticles(ctx, g.particles);
  ctx.restore();

  drawHUD(ctx, g);
  if (g.state === 'playing' && (g.selectedPad != null || g.selectedTower)) drawMenu(ctx, g);

  if (g.state === 'title') {
    drawOverlay(ctx, '🔥 EMBERKEEP', [
      'Defend the Last Lantern from the Glooms.',
      'Click a glowing pad to build a tower.  Space starts a wave.',
      'P pause · R restart · 1–4 build · F speed · M mute',
      `Best score: ${fmt(g.best)}`,
    ], '▶  Play', overlayButtonRect(470));
  } else if (g.state === 'paused') {
    drawOverlay(ctx, 'Paused', ['Take a breath. The Glooms wait.', 'P / Esc to resume · R to restart'], 'Resume', overlayButtonRect(420));
  } else if (g.state === 'victory') {
    drawOverlay(ctx, '🏆 THE LANTERN ENDURES!', [
      `Score ${fmt(g.score)}   ·   Waves cleared ${TOTAL_WAVES}/${TOTAL_WAVES}`,
      `Glooms vanquished ${g.kills}   ·   Embers earned ${fmt(g.embersEarned)}`,
      `Lantern HP left ${g.lanternHp}/${g.lanternMaxHp}   ·   Best ${fmt(g.best)}`,
    ], '↻  Play again', overlayButtonRect(470));
  } else if (g.state === 'defeat') {
    drawOverlay(ctx, '🌑 THE LANTERN FADES…', [
      `The Glooms overran the forest on wave ${Math.min(g.wave, TOTAL_WAVES)}.`,
      `Score ${fmt(g.score)}   ·   Glooms vanquished ${g.kills}   ·   Best ${fmt(g.best)}`,
    ], '↻  Try again', overlayButtonRect(470));
  }
}
