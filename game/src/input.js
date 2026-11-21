// input.js — keyboard and mouse, kept in one place so the game logic never
// touches a DOM event directly. WASD or arrows move, Shift sneaks,
// Space runs, Q or a mouse click throws a pebble toward the cursor,
// E picks up, R restarts the level, P or Esc pauses, M mutes.
export function createInput(canvas) {
  const keys = new Set();
  const input = {
    keys,
    mouseX: 0,
    mouseY: 0,
    mouseDown: false,
    clicked: null, // {x, y} in canvas pixels, consumed by the game each frame
    pressed: new Set(), // keys pressed since last frame, consumed by the game
    anyKey: false,
  };

  const KEYMAP = {
    KeyW: 'up', ArrowUp: 'up',
    KeyS: 'down', ArrowDown: 'down',
    KeyA: 'left', ArrowLeft: 'left',
    KeyD: 'right', ArrowRight: 'right',
    ShiftLeft: 'sneak', ShiftRight: 'sneak',
    Space: 'run',
    KeyQ: 'throw',
    KeyE: 'interact',
    KeyR: 'restart',
    KeyP: 'pause', Escape: 'pause',
    KeyM: 'mute',
    Enter: 'confirm',
  };

  window.addEventListener('keydown', (e) => {
    const name = KEYMAP[e.code];
    if (!name) return;
    if (e.code === 'Space' || e.code.startsWith('Arrow')) e.preventDefault();
    if (!keys.has(name)) input.pressed.add(name);
    keys.add(name);
    input.anyKey = true;
  });
  window.addEventListener('keyup', (e) => {
    const name = KEYMAP[e.code];
    if (name) keys.delete(name);
  });
  window.addEventListener('blur', () => keys.clear());

  canvas.addEventListener('mousemove', (e) => {
    const r = canvas.getBoundingClientRect();
    input.mouseX = ((e.clientX - r.left) / r.width) * canvas.width;
    input.mouseY = ((e.clientY - r.top) / r.height) * canvas.height;
  });
  canvas.addEventListener('mousedown', (e) => {
    if (e.button !== 0) return;
    const r = canvas.getBoundingClientRect();
    input.mouseX = ((e.clientX - r.left) / r.width) * canvas.width;
    input.mouseY = ((e.clientY - r.top) / r.height) * canvas.height;
    input.mouseDown = true;
    input.clicked = { x: input.mouseX, y: input.mouseY };
    input.anyKey = true;
  });
  window.addEventListener('mouseup', () => {
    input.mouseDown = false;
  });
  canvas.addEventListener('contextmenu', (e) => e.preventDefault());

  // Called by the game at the end of each frame: one-frame presses clear.
  input.endFrame = () => {
    input.pressed.clear();
    input.clicked = null;
    input.anyKey = false;
  };

  return input;
}
