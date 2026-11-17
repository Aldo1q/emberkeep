// Particles (sparks, frost motes, explosion puffs) + floating score text.
export function makeParticles() {
  return { list: [], texts: [] };
}

export function burst(p, x, y, color, n = 10, speed = 140, life = 0.5, size = 3) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2;
    const v = speed * (0.4 + Math.random() * 0.8);
    p.list.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 30, life, max: life, size: size * (0.6 + Math.random() * 0.8), color });
  }
}

export function ring(p, x, y, color, n = 14, speed = 220) {
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    p.list.push({ x, y, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed, life: 0.4, max: 0.4, size: 3, color });
  }
}

export function floatText(p, x, y, text, color = '#ffe9a8') {
  p.texts.push({ x, y, text, color, life: 1.0, max: 1.0 });
}

export function updateParticles(p, dt) {
  for (const q of p.list) {
    q.x += q.vx * dt; q.y += q.vy * dt;
    q.vy += 160 * dt; q.vx *= (1 - 1.6 * dt);
    q.life -= dt;
  }
  p.list = p.list.filter((q) => q.life > 0);
  for (const t of p.texts) { t.y -= 34 * dt; t.life -= dt; }
  p.texts = p.texts.filter((t) => t.life > 0);
}

export function drawParticles(ctx, p) {
  for (const q of p.list) {
    const a = Math.max(0, q.life / q.max);
    ctx.globalAlpha = a;
    ctx.fillStyle = q.color;
    ctx.beginPath(); ctx.arc(q.x, q.y, q.size * a + 0.5, 0, Math.PI * 2); ctx.fill();
  }
  ctx.globalAlpha = 1;
  for (const t of p.texts) {
    ctx.globalAlpha = Math.max(0, t.life / t.max);
    ctx.fillStyle = t.color;
    ctx.font = 'bold 15px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText(t.text, t.x, t.y);
  }
  ctx.globalAlpha = 1;
}
