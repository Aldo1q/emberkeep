// WebAudio synth SFX + quiet ambient pad. No audio files, no network.
// AudioContext is created lazily on the first user gesture; every call is
// guarded so the game runs fine headless or muted.
let ctx = null;
let master = null;
let padNodes = null;
export let muted = false;

export function setMuted(m) {
  muted = !!m;
  if (master) master.gain.value = muted ? 0 : 0.9;
}
export function isMuted() { return muted; }

function ensure() {
  if (ctx) return ctx;
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = muted ? 0 : 0.9;
    master.connect(ctx.destination);
  } catch (e) { ctx = null; }
  return ctx;
}

export function unlockAudio() {
  const c = ensure();
  if (c && c.state === 'suspended') c.resume().catch(() => {});
  startPad();
}

function tone(freq, dur, type, vol, slideTo, delay = 0) {
  const c = ensure();
  if (!c || muted) return;
  try {
    const t0 = c.currentTime + delay;
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t0);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(Math.max(1, slideTo), t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0 + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(master);
    o.start(t0); o.stop(t0 + dur + 0.05);
  } catch (e) { /* audio is cosmetic */ }
}

function noise(dur, vol, freq, delay = 0) {
  const c = ensure();
  if (!c || muted) return;
  try {
    const t0 = c.currentTime + delay;
    const len = Math.max(1, Math.floor(c.sampleRate * dur));
    const buf = c.createBuffer(1, len, c.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = c.createBufferSource(); src.buffer = buf;
    const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = freq;
    const g = c.createGain(); g.gain.value = vol;
    src.connect(f); f.connect(g); g.connect(master);
    src.start(t0);
  } catch (e) { /* cosmetic */ }
}

export const sfx = {
  shoot()   { tone(880, 0.07, 'square', 0.05, 520); },
  frost()   { tone(1320, 0.12, 'sine', 0.05, 1760); },
  mortar()  { noise(0.18, 0.16, 500); tone(140, 0.2, 'sine', 0.14, 55); },
  prism()   { tone(1568, 0.1, 'triangle', 0.07, 780); },
  hit()     { tone(220, 0.05, 'square', 0.03, 160); },
  die()     { tone(520, 0.16, 'sawtooth', 0.06, 90); noise(0.1, 0.06, 1200); },
  place()   { tone(392, 0.1, 'triangle', 0.1); tone(523, 0.12, 'triangle', 0.1, 0, 0.07); },
  upgrade() { tone(523, 0.09, 'triangle', 0.09); tone(659, 0.09, 'triangle', 0.09, 0, 0.07); tone(784, 0.14, 'triangle', 0.09, 0, 0.14); },
  sell()    { tone(660, 0.08, 'sine', 0.07, 330); },
  horn()    { tone(196, 0.5, 'sawtooth', 0.09, 196); tone(294, 0.5, 'sawtooth', 0.07, 294, 0.05); },
  lanternHit() { tone(110, 0.25, 'sawtooth', 0.14, 55); noise(0.2, 0.1, 300); },
  win()     { [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.22, 'triangle', 0.1, 0, i * 0.13)); },
  lose()    { [392, 330, 262, 196].forEach((f, i) => tone(f, 0.3, 'sine', 0.1, 0, i * 0.16)); },
  click()   { tone(700, 0.04, 'sine', 0.04); },
  denied()  { tone(180, 0.12, 'square', 0.06, 140); },
};

function startPad() {
  const c = ensure();
  if (!c || padNodes) return;
  try {
    const g = c.createGain(); g.gain.value = 0.035; g.connect(master);
    const oscs = [110, 164.8, 220].map((f, i) => {
      const o = c.createOscillator();
      o.type = i === 2 ? 'sine' : 'triangle';
      o.frequency.value = f; o.detune.value = i * 4 - 4;
      o.connect(g); o.start();
      return o;
    });
    const lfo = c.createOscillator(); lfo.frequency.value = 0.07;
    const lg = c.createGain(); lg.gain.value = 0.015;
    lfo.connect(lg); lg.connect(g.gain); lfo.start();
    padNodes = { g, oscs, lfo };
  } catch (e) { padNodes = null; }
}
