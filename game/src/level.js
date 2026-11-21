// The Quiet Gallery — the museum floor: walls, tall cover that blocks sight,
// soft cover (plants) that hides a player standing inside them, the relics,
// the exit and every guard's patrol. All coordinates are in canvas pixels.
export function createLevel() {
  const T = 18; // interior wall thickness
  const B = 16; // border thickness
  const walls = [
    { x: 0, y: 0, w: 1280, h: B },
    { x: 0, y: 720 - B, w: 1280, h: B },
    { x: 0, y: 0, w: B, h: 720 },
    { x: 1280 - B, y: 0, w: B, h: 720 },
    // Interior walls: a broken spine across the hall, so every route has a blind side.
    { x: 380, y: 90, w: T, h: 240 }, // W1 vertical, west hall
    { x: 560, y: 330, w: 380, h: T }, // W2 horizontal, middle
    { x: 940, y: 420, w: T, h: 220 }, // W3 vertical, east hall
    { x: 760, y: 180, w: 360, h: T }, // W4 horizontal, north-east
    { x: 180, y: 430, w: T, h: 190 }, // W5 vertical, south-west
  ];
  // Tall cover: display cases, crates and a statue plinth. Blocks line of sight
  // and blocks movement, for the player and for the guards.
  const cover = [
    { x: 500, y: 190, w: 96, h: 54, kind: 'case' },
    { x: 730, y: 240, w: 96, h: 54, kind: 'case' },
    { x: 240, y: 300, w: 72, h: 72, kind: 'crate' },
    { x: 1060, y: 300, w: 96, h: 54, kind: 'case' },
    { x: 480, y: 520, w: 96, h: 54, kind: 'case' },
    { x: 820, y: 450, w: 72, h: 72, kind: 'crate' },
    { x: 1150, y: 620, w: 48, h: 48, kind: 'statue' },
  ];
  // Soft cover: potted palms. A player standing inside one cannot be seen,
  // even inside a vision cone. Guards walk through them.
  const plants = [
    { x: 300, y: 180, r: 30 },
    { x: 660, y: 460, r: 30 },
    { x: 1020, y: 180, r: 30 },
    { x: 420, y: 620, r: 30 },
    { x: 880, y: 640, r: 30 },
    { x: 120, y: 300, r: 30 },
  ];
  const relics = [
    { x: 250, y: 120, taken: false, label: 'Sun Disk' },
    { x: 1140, y: 110, taken: false, label: 'Moon Idol' },
    { x: 640, y: 600, taken: false, label: 'Star Vase' },
  ];
  const exit = { x: 1196, y: 64, w: 52, h: 68 };
  const playerStart = { x: 90, y: 620 };
  // Guards: three patrollers and one lookout who sweeps the exit approach.
  const guards = [
    {
      name: 'Mara', x: 460, y: 140, kind: 'patrol', speed: 58,
      waypoints: [[460, 140], [700, 140], [700, 280], [460, 280]],
    },
    {
      name: 'Dario', x: 1020, y: 260, kind: 'patrol', speed: 52,
      waypoints: [[1020, 260], [1020, 560], [1180, 560], [1180, 260]],
    },
    {
      name: 'Ilsa', x: 240, y: 420, kind: 'patrol', speed: 64,
      waypoints: [[240, 420], [560, 420]],
    },
    {
      name: 'Viktor', x: 1150, y: 240, kind: 'lookout', speed: 0,
      waypoints: [], sweepCentre: -Math.PI / 2, sweepWidth: 0.7,
    },
  ];
  return { walls, cover, plants, relics, exit, playerStart, guards };
}

/** Every solid rectangle: walls plus tall cover. */
export function solidRects(level) {
  return level.walls.concat(level.cover);
}

/** Every rectangle that blocks a guard's line of sight. */
export function sightBlockers(level) {
  return level.walls.concat(level.cover);
}

/** True when point (x, y) lies inside any plant's hiding circle. */
export function insidePlant(level, x, y) {
  for (const p of level.plants) {
    const dx = x - p.x;
    const dy = y - p.y;
    if (dx * dx + dy * dy < (p.r + 6) * (p.r + 6)) return true;
  }
  return false;
}
