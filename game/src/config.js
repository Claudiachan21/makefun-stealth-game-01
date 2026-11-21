// The Quiet Gallery — every tuning number lives here, so the game can be
// rebalanced without touching the rules, the guards or the drawing code.
export const VIEW = { width: 1280, height: 720 };

export const PLAYER = {
  radius: 14,
  walkSpeed: 168,
  sneakSpeed: 80,
  noiseRadius: 82,
  pickupRadius: 28,
};

export const GUARD = {
  radius: 15,
  patrolSpeed: 58,
  chaseSpeed: 134,
  viewRange: 208,
  viewHalfAngle: 0.62,
  turnSpeed: 5.4,
  sweepSpeed: 0.85,
  catchDistance: 28,
};

export const SUSPICION = {
  gain: 82,
  decay: 30,
  noiseGain: 26,
  chaseSeconds: 5,
  loseSightSeconds: 2.5,
  returnBelow: 25,
};

export const COLORS = {
  floor: '#1a1f2e',
  floorLine: '#222840',
  wall: '#3a4157',
  wallTop: '#565f7d',
  caseGlass: '#2e6f73',
  caseFrame: '#8a6d3b',
  crate: '#6b4f2a',
  statue: '#7d8296',
  plant: '#2f5d3a',
  plantLeaf: '#4c8a56',
  relic: '#ffd34d',
  exitLocked: '#7a2e2e',
  exitOpen: '#2fae5f',
  player: '#37e0d8',
  guard: '#ff5a4e',
  guardCalm: '#ff8a5c',
  coneCalm: 'rgba(255, 190, 80, 0.20)',
  coneHot: 'rgba(255, 90, 60, 0.30)',
  coneEdge: 'rgba(255, 210, 120, 0.55)',
  hud: '#e8ecf3',
  hudDim: '#8b94a7',
};
