// 12 waves: composition unlocks new kinds, count + HP scale up.
// count = 6 + 2n, hpScale = 1 + 0.35(n-1); spawn interval tightens each wave.
import { TOTAL_WAVES } from './config.js';
import { makeRng, shuffle } from './random.js';

const UNLOCKS = [
  ['wisp', 'shade'],
  ['wisp', 'shade'],
  ['wisp', 'shade', 'brute'],
  ['wisp', 'shade', 'brute', 'flicker'],
  ['wisp', 'shade', 'brute', 'flicker'],
  ['wisp', 'shade', 'brute', 'flicker', 'wraith'],
  ['shade', 'brute', 'flicker', 'wraith'],
  ['wisp', 'shade', 'brute', 'flicker', 'wraith'],
  ['shade', 'brute', 'flicker', 'wraith'],
  ['brute', 'flicker', 'wraith'],
  ['shade', 'brute', 'flicker', 'wraith'],
  ['brute', 'flicker', 'wraith'],
];

export function waveDef(n) {
  const kinds = UNLOCKS[Math.min(n - 1, UNLOCKS.length - 1)];
  const count = 6 + n * 2;
  const hpScale = 1 + (n - 1) * 0.20;
  const interval = Math.max(0.38, 0.95 - n * 0.05);
  // Seeded queue: deterministic per wave, shuffled mix of the unlocked kinds.
  const rng = makeRng(1000 + n * 77);
  const queue = [];
  for (let i = 0; i < count; i++) {
    let kind = kinds[i % kinds.length];
    // Late waves lean heavier: every 4th spawn is a brute/wraith when available.
    if (n >= 7 && i % 4 === 3) kind = kinds[kinds.length - 1];
    queue.push(kind);
  }
  return { n, count, hpScale, interval, queue: shuffle(rng, queue), bonus: 40 + n * 10 };
}

export function waveCount() { return TOTAL_WAVES; }
