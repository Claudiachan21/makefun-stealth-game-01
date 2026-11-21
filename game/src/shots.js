// The Quiet Gallery — screenshot scenes. Each one plays the real rules forward
// from a fresh world for a fixed number of steps, steered by a scripted route,
// so the frame is what a short game really looks like and the same seed always
// gives the same frame. The cover shot shows the whole level at once: guards
// with their vision cones, cover to hide behind, and the exit.
import { resetGame, stepWorld } from './world.js';

const STEP = 1 / 60;

/** Steer the player along waypoints for `seconds`, guards patrolling live. */
function drive(game, waypoints, sneak, seconds) {
  let wp = 0;
  const steps = Math.round(seconds / STEP);
  for (let i = 0; i < steps; i += 1) {
    if (game.state !== 'play') break;
    const target = waypoints[Math.min(wp, waypoints.length - 1)];
    const dx = target[0] - game.player.x;
    const dy = target[1] - game.player.y;
    const d = Math.hypot(dx, dy);
    let input = { x: 0, y: 0, sneak };
    if (d > 6) input = { x: dx / d, y: dy / d, sneak };
    else if (wp < waypoints.length - 1) wp += 1;
    stepWorld(game, STEP, input);
  }
}

/**
 * Set `game` to the named scene and return the state to draw.
 * cover: mid-sneak behind a display case, cones sweeping nearby.
 * patrol: crouched behind a crate while a guard walks his beat.
 * alarm: caught in the open — suspicion full, guard charging in.
 * win: at the exit with all three relics, escaped unseen.
 */
export function stageShot(name, game) {
  resetGame(game);
  if (name === 'alarm') {
    game.player.x = 600;
    game.player.y = 200;
    const g = game.guards[0];
    g.x = 600;
    g.y = 290;
    g.angle = -Math.PI / 2;
    g.suspicion = 100;
    g.mode = 'chase';
    g.chaseTimer = 5;
    g.alerted = true;
    // A third of a second of chase: close enough to read, not yet caught.
    for (let i = 0; i < 21; i += 1) stepWorld(game, STEP, { x: 0, y: 0, sneak: false });
    return game.state;
  }
  if (name === 'win') {
    for (const r of game.level.relics) r.taken = true;
    game.relicsTaken = 3;
    game.player.x = 1222;
    game.player.y = 98;
    game.time = 147;
    stepWorld(game, STEP, { x: 0, y: 0, sneak: false });
    return game.state;
  }
  if (name === 'patrol') {
    // Crouch behind the west crate: the crate blocks the beat guard's sight.
    drive(game, [[90, 260], [200, 260], [276, 268]], false, 8);
    drive(game, [[276, 268]], true, 5);
    return game.state;
  }
  // cover (default): sneak to the south side of the middle display case,
  // where the case itself blocks the beat guard's sight line. The route
  // stays below the south-west wall, which ends at y=620.
  drive(game, [[90, 650], [300, 650], [528, 600]], true, 17);
  return game.state;
}
