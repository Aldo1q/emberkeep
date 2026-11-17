// Emberkeep: game loop, state machine, scoring, persistence.
// States: title -> playing <-> paused -> victory | defeat.
import { START_EMBERS, LANTERN_MAX_HP, TOTAL_WAVES, PADS, PAD_R, TOWERS, TOWER_ORDER, BTN } from './config.js';
import { sfx, unlockAudio, setMuted, isMuted } from './audio.js';
import { makeInput, drainClicks, drainKeys, inRect } from './input.js';
import { spawnEnemy, updateEnemy, damageEnemy, applySlow } from './enemies.js';
import { makeTower, towerStats, acquireTarget, makeProjectile, updateProjectile, upgradeCost, sellValue } from './towers.js';
import { waveDef } from './waves.js';
import { makeParticles, burst, ring, floatText, updateParticles } from './particles.js';
import { render, menuRects, overlayButtonRect } from './render.js';
import { applyShot } from './shots.js';

const BEST_KEY = 'emberkeep.best';

function loadBest() {
  try { return Number(localStorage.getItem(BEST_KEY)) || 0; } catch (e) { return 0; }
}
function saveBest(v) {
  try { localStorage.setItem(BEST_KEY, String(v)); } catch (e) { /* private mode */ }
}

export function createState() {
  return {
    state: 'title', time: 0,
    wave: 0, waveRunning: false, spawnQueue: [], spawnTimer: 0, spawnInterval: 0.9, hpScale: 1,
    embers: START_EMBERS, lanternHp: LANTERN_MAX_HP, lanternMaxHp: LANTERN_MAX_HP,
    score: 0, best: loadBest(), kills: 0, embersEarned: 0,
    towers: [], pads: PADS.map(() => null), enemies: [], projectiles: [],
    particles: makeParticles(),
    selectedPad: null, selectedTower: null, hoverTower: null,
    mouse: { x: -1, y: -1, inside: false },
    speed: 1, muted: isMuted(), banner: null, bannerT: 0, shake: 0,
  };
}

export function resetGame(g) {
  const best = g.best;
  const fresh = createState();
  fresh.best = best;
  Object.keys(fresh).forEach((k) => { g[k] = fresh[k]; });
  g.state = 'playing';
}

export function startWave(g) {
  if (g.state !== 'playing' || g.waveRunning || g.wave >= TOTAL_WAVES) return false;
  g.wave++;
  const def = waveDef(g.wave);
  g.spawnQueue = def.queue.slice();
  g.hpScale = def.hpScale;
  g.spawnInterval = def.interval;
  g.spawnTimer = 0.4;
  g.waveRunning = true;
  g.banner = `Wave ${g.wave}`;
  g.bannerT = 1.6;
  sfx.horn();
  return true;
}

function waveClear(g) {
  const def = waveDef(g.wave);
  g.embers += def.bonus;
  g.embersEarned += def.bonus;
  g.score += def.bonus;
  floatText(g.particles, 640, 200, `Wave ${g.wave} clear! +${def.bonus} embers`, '#ffd34d');
  if (g.wave >= TOTAL_WAVES) {
    g.score += g.lanternHp * 25;
    g.state = 'victory';
    if (g.score > g.best) { g.best = g.score; saveBest(g.best); }
    sfx.win();
  } else {
    sfx.upgrade();
  }
}

function defeat(g) {
  g.state = 'defeat';
  if (g.score > g.best) { g.best = g.score; saveBest(g.best); }
  sfx.lose();
}

function killEnemy(g, e) {
  g.kills++;
  g.embers += e.def.reward;
  g.embersEarned += e.def.reward;
  g.score += 10;
  burst(g.particles, e.x, e.y, e.def.color, 12, 150, 0.5, 3);
  floatText(g.particles, e.x, e.y - 18, `+${e.def.reward}🔥`, '#ffe9a8');
  sfx.die();
}

function hitEnemy(g, p, e) {
  const killed = damageEnemy(e, p.dmg);
  if (p.slow) applySlow(e, p.slow, p.slowTime, g.time);
  if (killed) killEnemy(g, e);
  else sfx.hit();
}

function explode(g, p) {
  ring(g.particles, p.x, p.y, '#ff9a5c', 12, 200);
  burst(g.particles, p.x, p.y, '#ffb52e', 10, 180, 0.45, 4);
  for (const e of g.enemies) {
    if (e.dead || e.reached) continue;
    if (Math.hypot(e.x - p.x, e.y - p.y) <= p.splash + e.def.radius) hitEnemy(g, p, e);
  }
}

// One fixed simulation step (dt seconds, unscaled). Pure enough for ?shot= scenes.
export function stepGame(g, dt) {
  g.time += dt;
  if (g.bannerT > 0) g.bannerT -= dt;
  if (g.shake > 0) g.shake = Math.max(0, g.shake - dt * 26);

  if (g.waveRunning) {
    if (g.spawnQueue.length > 0) {
      g.spawnTimer -= dt;
      if (g.spawnTimer <= 0) {
        g.spawnTimer = g.spawnInterval;
        g.enemies.push(spawnEnemy(g.spawnQueue.shift(), g.hpScale));
      }
    }
  }

  // Towers fire.
  for (const t of g.towers) {
    t.cooldown -= dt;
    const target = acquireTarget(t, g.enemies);
    if (target) {
      t.angle = Math.atan2(target.y - t.y, target.x - t.x);
      if (t.cooldown <= 0) {
        const s = towerStats(t);
        t.cooldown = 1 / s.rate;
        g.projectiles.push(makeProjectile(t, target));
        if (t.kind === 'mortar') sfx.mortar();
        else if (t.kind === 'frost') sfx.frost();
        else if (t.kind === 'prism') sfx.prism();
        else sfx.shoot();
      }
    }
  }

  // Projectiles.
  for (const p of g.projectiles) {
    updateProjectile(p, dt);
    if (p.dead) {
      if (p.splash) explode(g, p);
      else if (p.target && !p.target.dead && !p.target.reached) {
        hitEnemy(g, p, p.target);
        burst(g.particles, p.x, p.y, p.color, 4, 90, 0.3, 2);
      }
    }
  }
  g.projectiles = g.projectiles.filter((p) => !p.dead);

  // Enemies walk; lantern hits.
  for (const e of g.enemies) {
    if (updateEnemy(e, dt, g.time)) {
      g.lanternHp--;
      g.shake = 12;
      burst(g.particles, e.x, e.y, '#ff5a4d', 14, 160, 0.5, 3);
      floatText(g.particles, e.x - 40, e.y - 30, 'Lantern hit! −1', '#ff8a7a');
      sfx.lanternHit();
      if (g.lanternHp <= 0) { g.lanternHp = 0; defeat(g); }
    }
  }
  g.enemies = g.enemies.filter((e) => !e.dead && !e.reached);

  updateParticles(g.particles, dt);

  if (g.waveRunning && g.spawnQueue.length === 0 && g.enemies.length === 0 && g.state === 'playing') {
    g.waveRunning = false;
    waveClear(g);
  }
}

export function placeTower(g, kind, padIndex) {
  const def = TOWERS[kind];
  if (!def || g.pads[padIndex] || g.embers < def.cost) return false;
  g.embers -= def.cost;
  const pad = PADS[padIndex];
  const t = makeTower(kind, padIndex, pad.x, pad.y);
  g.towers.push(t);
  g.pads[padIndex] = t;
  g.selectedPad = null;
  g.selectedTower = t;
  burst(g.particles, pad.x, pad.y, def.color, 16, 160, 0.6, 3);
  sfx.place();
  return true;
}

export function upgradeTower(g, t) {
  const cost = upgradeCost(t);
  if (!cost || g.embers < cost) return false;
  g.embers -= cost;
  t.invested += cost;
  t.level++;
  burst(g.particles, t.x, t.y, '#ffd34d', 14, 140, 0.5, 3);
  floatText(g.particles, t.x, t.y - 28, `Lv${t.level}!`, '#ffd34d');
  sfx.upgrade();
  return true;
}

export function sellTower(g, t) {
  const v = sellValue(t);
  g.embers += v;
  g.towers = g.towers.filter((x) => x !== t);
  g.pads[t.padIndex] = null;
  g.selectedTower = null;
  floatText(g.particles, t.x, t.y - 24, `+${v}🔥`, '#ffe9a8');
  sfx.sell();
  return true;
}

function towerAt(g, x, y) {
  return g.towers.find((t) => Math.hypot(t.x - x, t.y - y) <= 26) || null;
}
function padAt(g, x, y) {
  for (let i = 0; i < PADS.length; i++) {
    if (Math.hypot(PADS[i].x - x, PADS[i].y - y) <= PAD_R + 6) return i;
  }
  return null;
}

function handleClick(g, x, y) {
  unlockAudio();
  if (g.state === 'title') {
    if (inRect(x, y, overlayButtonRect(470))) { g.state = 'playing'; sfx.click(); }
    return;
  }
  if (g.state === 'victory' || g.state === 'defeat') {
    if (inRect(x, y, overlayButtonRect(470))) { resetGame(g); sfx.click(); }
    return;
  }
  if (g.state === 'paused') {
    if (inRect(x, y, overlayButtonRect(420))) { g.state = 'playing'; sfx.click(); }
    return;
  }
  // Playing: top-bar buttons.
  if (inRect(x, y, BTN.start)) { startWave(g); return; }
  if (inRect(x, y, BTN.speed)) { g.speed = g.speed === 1 ? 2 : 1; sfx.click(); return; }
  if (inRect(x, y, BTN.pause)) { g.state = 'paused'; sfx.click(); return; }
  if (inRect(x, y, BTN.mute)) { setMuted(!isMuted()); g.muted = isMuted(); sfx.click(); return; }
  if (inRect(x, y, BTN.restart)) { resetGame(g); sfx.click(); return; }
  // Build / upgrade menu.
  for (const item of menuRects(g)) {
    if (inRect(x, y, item.rect)) {
      if (item.kind) { if (!placeTower(g, item.kind, g.selectedPad)) sfx.denied(); }
      else if (item.action === 'upgrade') { if (!upgradeTower(g, g.selectedTower)) sfx.denied(); }
      else if (item.action === 'sell') { sellTower(g, g.selectedTower); }
      return;
    }
  }
  const t = towerAt(g, x, y);
  if (t) { g.selectedTower = t; g.selectedPad = null; sfx.click(); return; }
  const p = padAt(g, x, y);
  if (p != null) {
    if (g.pads[p]) { g.selectedTower = g.pads[p]; g.selectedPad = null; }
    else { g.selectedPad = p; g.selectedTower = null; }
    sfx.click(); return;
  }
  g.selectedPad = null; g.selectedTower = null;
}

function handleKey(g, key) {
  unlockAudio();
  const k = key.toLowerCase();
  if (k === ' ') {
    if (g.state === 'title') { g.state = 'playing'; return; }
    if (g.state === 'playing') startWave(g);
    return;
  }
  if (k === 'p' || k === 'escape') {
    if (g.state === 'playing') g.state = 'paused';
    else if (g.state === 'paused') g.state = 'playing';
    return;
  }
  if (k === 'r') { if (g.state !== 'title') resetGame(g); return; }
  if (k === 'm') { setMuted(!isMuted()); g.muted = isMuted(); return; }
  if (k === 'f') { g.speed = g.speed === 1 ? 2 : 1; return; }
  const idx = ['1', '2', '3', '4'].indexOf(k);
  if (idx >= 0 && g.state === 'playing' && g.selectedPad != null) {
    if (!placeTower(g, TOWER_ORDER[idx], g.selectedPad)) sfx.denied();
  }
}

function boot() {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const g = createState();
  const input = makeInput(canvas);

  // Deterministic screenshot scenes (?shot=title|play|victory|defeat&seed=N).
  const params = new URLSearchParams(location.search);
  const shot = params.get('shot');
  if (shot) {
    applyShot(g, shot, Number(params.get('seed')) || 7);
    render(ctx, g);
    window.__shotReady = true;
  }

  // Minimal state handle for play-testing only.
  window.__game = {
    get state() { return g.state; },
    get wave() { return g.wave; },
    get score() { return g.score; },
    get embers() { return g.embers; },
    get lanternHp() { return g.lanternHp; },
    get kills() { return g.kills; },
    get enemies() { return g.enemies.length; },
    get towers() { return g.towers.length; },
    get waveRunning() { return g.waveRunning; },
    get best() { return g.best; },
    startWave: () => startWave(g),
    placeTower: (kind, pad) => placeTower(g, kind, pad),
    reset: () => resetGame(g),
    step: (dt) => stepGame(g, dt), // play-testing only: advance the sim by dt seconds
    _state: g,
  };

  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    g.mouse = input.mouse;
    try {
      for (const c of drainClicks(input)) handleClick(g, c.x, c.y);
      for (const k of drainKeys(input)) handleKey(g, k);
    } catch (err) { console.error('input error', err); }
    g.hoverTower = (g.mouse.inside && g.state === 'playing')
      ? towerAt(g, g.mouse.x, g.mouse.y) : null;
    if (g.state === 'playing' && !shot) stepGame(g, dt * g.speed);
    render(ctx, g);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

boot();
