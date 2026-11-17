// Tower kinds, targeting, projectiles, upgrade/sell.
import { TOWERS, UPGRADE_COST, MAX_LEVEL } from './config.js';

let nextId = 1;

export function makeTower(kind, padIndex, x, y) {
  const def = TOWERS[kind];
  return {
    id: nextId++, kind, def, padIndex, x, y,
    level: 1, cooldown: 0, angle: -Math.PI / 2, invested: def.cost,
  };
}

export function towerStats(t) {
  const d = t.def;
  const lv = t.level - 1;
  return {
    dmg: Math.round(d.dmg * Math.pow(1.7, lv)),
    range: d.range + 12 * lv,
    rate: d.rate * Math.pow(1.15, lv),
  };
}

export function upgradeCost(t) {
  if (t.level >= MAX_LEVEL) return null;
  return UPGRADE_COST(t.def.cost, t.level + 1);
}

export function sellValue(t) {
  return Math.floor(t.invested * 0.7);
}

function inRange(t, e, range) {
  return Math.hypot(e.x - t.x, e.y - t.y) <= range + e.def.radius;
}

// Pick the enemy furthest along the path within range.
export function acquireTarget(t, enemies) {
  const { range } = towerStats(t);
  let best = null;
  for (const e of enemies) {
    if (e.dead || e.reached) continue;
    if (inRange(t, e, range) && (!best || e.dist > best.dist)) best = e;
  }
  return best;
}

// A projectile flies to a point; mortar explodes on arrival (splash).
export function makeProjectile(t, target) {
  const s = towerStats(t);
  return {
    x: t.x, y: t.y, tx: target.x, ty: target.y, target,
    kind: t.kind, dmg: s.dmg, speed: t.def.projSpeed,
    splash: t.def.splash || 0, slow: t.def.slow || 0,
    slowTime: t.def.slowTime || 0, color: t.def.color, dead: false,
  };
}

export function updateProjectile(p, dt) {
  if (p.dead) return;
  // Track a living target; otherwise fly to the last known point.
  if (p.target && !p.target.dead && !p.target.reached) { p.tx = p.target.x; p.ty = p.target.y; }
  const dx = p.tx - p.x, dy = p.ty - p.y;
  const d = Math.hypot(dx, dy);
  const step = p.speed * dt;
  if (d <= Math.max(step, 10)) { p.x = p.tx; p.y = p.ty; p.dead = true; return; }
  p.x += (dx / d) * step; p.y += (dy / d) * step;
}
