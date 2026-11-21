// The Quiet Gallery — entry point: input, the game loop, and the screenshot
// hook (?shot=cover|patrol|alarm|win stages one frozen frame for the camera).
import { VIEW } from './config.js';
import { createGame, resetGame, stepWorld } from './world.js';
import { render } from './render.js';
import { readInput } from './player.js';
import { anyChase } from './guards.js';
import { stageShot } from './shots.js';
import { sfx } from './audio.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const game = createGame();
const keys = new Set();
let elapsed = 0;
let last = performance.now();

function playEvents(events) {
  if (events.stepped) sfx.step(events.stepped === 'sneak');
  if (events.picked) sfx.pickup();
  if (events.spotted) { sfx.spotted(); sfx.alarmStart(); }
  if (events.caught) { sfx.alarmStop(); sfx.caught(); }
  if (events.won) { sfx.alarmStop(); sfx.win(); }
  if (!anyChase(game.guards) && game.state === 'play') sfx.alarmStop();
}

function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  if (game.state === 'play') {
    elapsed += dt;
    playEvents(stepWorld(game, dt, readInput(keys)));
  }
  render(ctx, game, elapsed);
  requestAnimationFrame(frame);
}

window.addEventListener('keydown', (e) => {
  const k = e.key.toLowerCase();
  if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(k)) e.preventDefault();
  keys.add(k);
  sfx.unlock();
  if (k === 'enter' && game.state === 'title') {
    resetGame(game);
    elapsed = 0;
  }
  if (k === 'r' && (game.state === 'caught' || game.state === 'win')) {
    resetGame(game);
    elapsed = 0;
  }
});
window.addEventListener('keyup', (e) => keys.delete(e.key.toLowerCase()));
window.addEventListener('blur', () => keys.clear());
canvas.addEventListener('pointerdown', () => sfx.unlock());

// Screenshot mode: stage one frozen frame and draw it once. The loop never
// advances, so the captured frame is exactly the staged one.
const shot = new URLSearchParams(window.location.search).get('shot');
if (shot) {
  stageShot(shot, game);
  render(ctx, game, 0);
  document.title = `The Quiet Gallery — ${shot}`;
} else {
  render(ctx, game, 0);
  requestAnimationFrame(frame);
}
