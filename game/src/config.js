// Emberkeep balance + layout constants. One source of truth for tuning.
export const W = 1280;
export const H = 720;
export const TOPBAR = 56;

// Winding path: left edge -> Last Lantern on the right.
export const PATH = [
  [-20, 140], [260, 140], [260, 380], [560, 380],
  [560, 600], [900, 600], [900, 300], [1140, 300],
];
export const LANTERN = { x: 1140, y: 300 };
export const PATH_HALF = 22;

// Fixed build pads (kept clear of the path).
export const PADS = [
  { x: 140, y: 260 }, { x: 380, y: 260 }, { x: 460, y: 500 },
  { x: 700, y: 480 }, { x: 720, y: 200 }, { x: 1020, y: 440 },
  { x: 1030, y: 180 }, { x: 180, y: 520 },
];
export const PAD_R = 26;

export const START_EMBERS = 180;
export const LANTERN_MAX_HP = 20;
export const TOTAL_WAVES = 12;

// Tower kinds: cost in embers. dmg/rate scale per level in towers.js.
export const TOWERS = {
  spark:  { name: 'Spark Spire',   cost: 50,  range: 115, dmg: 10, rate: 2.8, projSpeed: 560, color: '#ffd34d', desc: 'Fast, low damage' },
  frost:  { name: 'Frost Brazier', cost: 70,  range: 105, dmg: 5,  rate: 1.3, projSpeed: 420, color: '#7fd4ff', slow: 0.5, slowTime: 1.6, desc: 'Slows enemies' },
  mortar: { name: 'Cannon Mortar',cost: 110, range: 170, dmg: 34, rate: 0.55, projSpeed: 380, color: '#ff9a5c', splash: 58, desc: 'Splash damage' },
  prism:  { name: 'Prism Lens',   cost: 160, range: 230, dmg: 55, rate: 0.5, projSpeed: 760, color: '#c98bff', desc: 'Long range, heavy hit' },
};
export const TOWER_ORDER = ['spark', 'frost', 'mortar', 'prism'];
export const MAX_LEVEL = 3;
export const UPGRADE_COST = (base, level) => Math.round(base * (level === 2 ? 0.8 : 1.2));

// Enemy kinds: base HP at wave 1, speed px/s, ember reward.
export const ENEMIES = {
  wisp:    { name: 'Wisp',    hp: 22,  speed: 96, reward: 6,  radius: 11, color: '#bfefff', glow: '#7fd4ff' },
  shade:   { name: 'Shade',   hp: 48,  speed: 62, reward: 9,  radius: 13, color: '#8a7fd6', glow: '#5a4fd0' },
  brute:   { name: 'Brute',   hp: 150, speed: 38, reward: 16, radius: 17, color: '#b0704f', glow: '#ff7a4d' },
  flicker: { name: 'Flicker', hp: 34,  speed: 118, reward: 10, radius: 11, color: '#ffe066', glow: '#ffb52e' },
  wraith:  { name: 'Wraith',  hp: 330, speed: 30, reward: 25, radius: 15, color: '#e8ecff', glow: '#aab8ff', regen: 3 },
};

// HUD button rects (top bar) — shared by render + input.
export const BTN = {
  start:  { x: 1064, y: 10, w: 200, h: 36 },
  speed:  { x: 880,  y: 10, w: 56,  h: 36 },
  pause:  { x: 944,  y: 10, w: 56,  h: 36 },
  mute:   { x: 1008, y: 10, w: 48,  h: 36 },
  restart:{ x: 812,  y: 10, w: 60,  h: 36 },
};
export const MENU = { x: 290, y: 636, w: 700, h: 76 }; // build/upgrade panel
export const OVERLAY_BTN = { w: 220, h: 48 }; // victory/defeat/title buttons, centered

export const fmt = (n) => String(Math.round(n));
