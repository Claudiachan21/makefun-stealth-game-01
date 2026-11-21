// The Quiet Gallery — the world: one fresh game, and one fixed step of it.
// The loop in main.js and the screenshot stager in shots.js both step the
// same world, so a screenshot frame is a frame a real playthrough can reach.
import { createLevel, sightBlockers } from './level.js';
import { Player } from './player.js';
import { createGuards, anyChase, caughtBy } from './guards.js';
import { PLAYER } from './config.js';

export function createGame() {
  const level = createLevel();
  level.blockers = sightBlockers(level);
  const game = {
    level,
    player: new Player(level.playerStart),
    guards: createGuards(level),
    state: 'title', // title | play | caught | win
    time: 0,
    relicsTaken: 0,
    ghost: true,
    caughtByName: '',
    timeText: '00:00',
    wasChase: false,
  };
  return game;
}

export function resetGame(game) {
  const fresh = createGame();
  game.level = fresh.level;
  game.player = fresh.player;
  game.guards = fresh.guards;
  game.state = 'play';
  game.time = 0;
  game.relicsTaken = 0;
  game.ghost = true;
  game.caughtByName = '';
  game.timeText = '00:00';
  game.wasChase = false;
}

export function formatTime(t) {
  const mm = String(Math.floor(t / 60)).padStart(2, '0');
  const ss = String(Math.floor(t % 60)).padStart(2, '0');
  return `${mm}:${ss}`;
}

/**
 * Advance the world one step. Returns events for the loop to sonify:
 * { stepped, picked, spotted, caught, won }.
 */
export function stepWorld(game, dt, input) {
  const events = { stepped: false, picked: null, spotted: false, caught: null, won: false };
  if (game.state !== 'play') return events;
  game.time += dt;
  game.timeText = formatTime(game.time);
  game.player.update(dt, input, game.level);
  if (game.player.stepped) events.stepped = game.player.sneaking ? 'sneak' : 'walk';
  for (const g of game.guards) g.update(dt, game.player, game.level);
  const chase = anyChase(game.guards);
  if (chase && !game.wasChase) events.spotted = true;
  if (chase) game.ghost = false;
  game.wasChase = chase;
  // Relic pickup.
  for (const r of game.level.relics) {
    if (!r.taken && Math.hypot(r.x - game.player.x, r.y - game.player.y) < PLAYER.pickupRadius) {
      r.taken = true;
      game.relicsTaken += 1;
      events.picked = r.label;
    }
  }
  // Caught?
  const catcher = caughtBy(game.guards, game.player);
  if (catcher) {
    game.state = 'caught';
    game.caughtByName = catcher.name;
    events.caught = catcher.name;
    return events;
  }
  // Exit: open only once every relic is taken.
  const e = game.level.exit;
  const allTaken = game.relicsTaken >= game.level.relics.length;
  if (allTaken && game.player.x > e.x - 4 && game.player.x < e.x + e.w + 4
      && game.player.y > e.y - 4 && game.player.y < e.y + e.h + 4) {
    game.state = 'win';
    events.won = true;
  }
  return events;
}
