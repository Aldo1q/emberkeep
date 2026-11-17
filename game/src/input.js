// Mouse + keyboard input: normalises canvas coords, queues clicks/keys.
// main.js consumes the queues each frame; nothing here touches game state.
export function makeInput(canvas) {
  const input = {
    mouse: { x: -1, y: -1, inside: false },
    clicks: [], // {x, y}
    keys: [],   // e.key strings
  };

  function pos(ev) {
    const r = canvas.getBoundingClientRect();
    return {
      x: (ev.clientX - r.left) * (canvas.width / r.width),
      y: (ev.clientY - r.top) * (canvas.height / r.height),
    };
  }

  canvas.addEventListener('mousemove', (ev) => {
    const p = pos(ev);
    input.mouse.x = p.x; input.mouse.y = p.y; input.mouse.inside = true;
  });
  canvas.addEventListener('mouseleave', () => { input.mouse.inside = false; });
  canvas.addEventListener('click', (ev) => {
    input.clicks.push(pos(ev));
  });
  window.addEventListener('keydown', (ev) => {
    if (['Space', 'ArrowUp', 'ArrowDown'].includes(ev.code)) ev.preventDefault();
    input.keys.push(ev.key);
  });
  return input;
}

export function drainClicks(input) {
  const out = input.clicks.splice(0, input.clicks.length);
  return out;
}

export function drainKeys(input) {
  const out = input.keys.splice(0, input.keys.length);
  return out;
}

export function inRect(x, y, r) {
  return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
}
