// Enemy kinds, spawning and movement along the path.
import { ENEMIES, PATH, LANTERN } from './config.js';

// Precompute path segment lengths for movement.
const SEGMENTS = [];
for (let i = 0; i < PATH.length - 1; i++) {
  const [x1, y1] = PATH[i];
  const [x2, y2] = PATH[i + 1];
  SEGMENTS.push({ x1, y1, x2, y2, len: Math.hypot(x2 - x1, y2 - y1) });
}
export const PATH_LENGTH = SEGMENTS.reduce((s, g) => s + g.len, 0);

export function pathPointAt(dist) {
  let d = Math.max(0, dist);
  for (const g of SEGMENTS) {
    if (d <= g.len) {
      const t = g.len === 0 ? 0 : d / g.len;
      return { x: g.x1 + (g.x2 - g.x1) * t, y: g.y1 + (g.y2 - g.y1) * t };
    }
    d -= g.len;
  }
  return { x: LANTERN.x, y: LANTERN.y };
}

let nextId = 1;

export function spawnEnemy(kind, hpScale) {
  const def = ENEMIES[kind];
  const hp = Math.round(def.hp * hpScale);
  return {
    id: nextId++, kind, def,
    x: PATH[0][0], y: PATH[0][1], dist: 0,
    hp, maxHp: hp, speed: def.speed,
    slowUntil: 0, slowFactor: 1, regen: def.regen || 0,
    wobble: Math.random() * Math.PI * 2, reached: false, dead: false,
  };
}

// dt in seconds, now = game clock seconds. Returns true when it reached the lantern.
export function updateEnemy(e, dt, now) {
  if (e.dead || e.reached) return false;
  if (e.regen) e.hp = Math.min(e.maxHp, e.hp + e.regen * dt);
  let sp = e.speed;
  if (now < e.slowUntil) sp *= e.slowFactor;
  if (e.kind === 'flicker') sp *= 0.65 + 0.7 * Math.abs(Math.sin(now * 3 + e.wobble));
  e.dist += sp * dt;
  const p = pathPointAt(e.dist);
  e.x = p.x; e.y = p.y;
  if (e.dist >= PATH_LENGTH) { e.reached = true; return true; }
  return false;
}

export function damageEnemy(e, dmg) {
  e.hp -= dmg;
  if (e.hp <= 0) { e.dead = true; return true; }
  return false;
}

export function applySlow(e, factor, duration, now) {
  e.slowFactor = Math.min(e.slowFactor === 1 ? 1 : e.slowFactor, factor);
  e.slowFactor = factor;
  e.slowUntil = Math.max(e.slowUntil, now + duration);
}
