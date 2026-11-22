// config.js — the numbers Lanternkeep is tuned by. One place, so a tweak
// here retunes the whole game instead of hunting through the other files.
export const TILE = 32;

export const VIEW_W = 1280;
export const VIEW_H = 800;

// Player movement, in pixels per second.
export const PLAYER = {
  walkSpeed: 165,
  sneakSpeed: 95,
  runSpeed: 245,
  radius: 11,
};

// Guards: how far they see, how wide their cone is, how fast they move.
export const GUARD = {
  viewRange: 235,
  viewHalfAngle: 0.62, // ~35 degrees each side
  patrolSpeed: 62,
  investigateSpeed: 105,
  chaseSpeed: 205,
  catchRadius: 27,
  // Suspicion 0..1. Fills while the player is seen, drains while hidden.
  seeRate: 0.62,
  seeRateClose: 1.15, // inside half the view range it fills faster
  drainRate: 0.34,
  // A guard that loses the player searches the last seen spot this long.
  searchTime: 3.2,
  // Standing in a bush hides the player unless a guard is this close.
  bushRevealRange: 58,
};

// Hearing: running feet and landing pebbles pull guards in.
export const NOISE = {
  runRadius: 210,
  walkRadius: 70,
  sneakRadius: 26,
  pebbleRadius: 185,
};

// The lighthouse beam (levels 1 and 3) and the cameras (level 2).
export const BEAM = {
  range: 430,
  halfAngle: 0.17,
  turnSpeed: 0.55, // radians per second
  seeRate: 0.75,
};
export const CAMERA = {
  range: 250,
  halfAngle: 0.5,
  sweepSpeed: 0.45,
  seeRate: 0.55,
};

// Pebbles: the distraction the player throws with a mouse click or Q.
export const PEBBLE = {
  perLevel: 5,
  flySpeed: 420,
  cooldown: 0.8,
};

// Smoke vials: lobbed with E, they burst into a cloud no eye sees
// through — a moving piece of cover, and a way out of a chase.
export const SMOKE = {
  perLevel: 2,
  flySpeed: 380,
  radius: 78,
  duration: 5,
};

// Palette: a cold night, warm lamplight, and cones that read at a glance.
export const COLORS = {
  floorA: '#232a38',
  floorB: '#202634',
  floorDock: '#2a2f3a',
  wall: '#12161f',
  wallTop: '#39415a',
  bush: '#14301f',
  bushLeaf: '#1e4a2c',
  crate: '#4a3520',
  crateEdge: '#6b4e2e',
  water: '#0d2036',
  waterShine: '#17456e',
  lens: '#7fe7ff',
  exit: '#8dff9e',
  exitDoor: '#1d4a2a',
  player: '#e8dcc0',
  playerCloak: '#2c3550',
  guard: '#c94f43',
  guardUniform: '#3a4a6b',
  coneCalm: 'rgba(255, 214, 90, 0.20)',
  coneCalmEdge: 'rgba(255, 214, 90, 0.45)',
  coneSuspicious: 'rgba(255, 150, 60, 0.28)',
  coneAlert: 'rgba(255, 70, 60, 0.32)',
  beam: 'rgba(255, 226, 140, 0.20)',
  darkness: 'rgba(3, 5, 14, 0.50)',
  smoke: 'rgba(168, 178, 198, 0.55)',
  smokeEdge: 'rgba(210, 218, 232, 0.35)',
};
