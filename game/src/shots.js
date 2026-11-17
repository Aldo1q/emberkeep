// Deterministic screenshot scenes for ?shot=title|play|victory|defeat&seed=N.
// Fixed simulated time + seeded wave composition; main.js renders one frame
// and sets window.__shotReady. Audio is never started here.
import { TOTAL_WAVES } from './config.js';
import { stepGame, startWave, placeTower } from './main.js';

function stageTowers(g) {
  // A believable mid-game board: four towers on spread pads.
  placeTower(g, 'spark', 0);
  placeTower(g, 'prism', 1);
  placeTower(g, 'mortar', 4);
  placeTower(g, 'frost', 2);
  g.embers = 640;
}

export function applyShot(g, scene, seed) {
  void seed; // composition is seeded per-wave inside waves.js; seed kept for future use.
  if (scene === 'title') {
    g.state = 'title';
    g.best = 12480;
    return;
  }
  if (scene === 'play') {
    g.state = 'playing';
    g.embers = 999;
    stageTowers(g);
    // Jump to wave 5 and simulate ~7s of combat at fixed 60 Hz steps.
    g.wave = 4;
    startWave(g);
    for (let i = 0; i < 420; i++) stepGame(g, 1 / 60);
    // If the wave already cleared in sim, restart it so foes are visible.
    if (!g.waveRunning && g.enemies.length === 0) {
      g.wave = 4;
      startWave(g);
      for (let i = 0; i < 240; i++) stepGame(g, 1 / 60);
    }
    g.selectedTower = g.towers[1] || null; // show range ring + menu
    return;
  }
  if (scene === 'victory') {
    g.state = 'victory';
    g.wave = TOTAL_WAVES;
    g.score = 12480;
    g.kills = 214;
    g.embersEarned = 1830;
    g.lanternHp = 14;
    g.best = 12480;
    return;
  }
  if (scene === 'defeat') {
    g.state = 'defeat';
    g.wave = 7;
    g.score = 5320;
    g.kills = 96;
    g.embersEarned = 640;
    g.lanternHp = 0;
    g.best = 12480;
    return;
  }
  g.state = 'title';
}
