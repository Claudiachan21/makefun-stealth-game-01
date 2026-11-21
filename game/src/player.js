// The Quiet Gallery — the thief: WASD/arrows to move, Shift to sneak.
// Sneaking is slow and silent; walking is faster but loud enough that a guard
// nearby turns toward the noise.
import { PLAYER } from './config.js';
import { solidRects, insidePlant } from './level.js';

export class Player {
  constructor(start) {
    this.x = start.x;
    this.y = start.y;
    this.angle = -Math.PI / 2;
    this.sneaking = false;
    this.moving = false;
    this.hidden = false;
    this.stepTimer = 0;
    this.stepped = false;
  }

  reset(start) {
    this.x = start.x;
    this.y = start.y;
    this.angle = -Math.PI / 2;
    this.sneaking = false;
    this.moving = false;
    this.hidden = false;
    this.stepTimer = 0;
  }

  /** Move from held keys. `input` is {x, y, sneak} with x/y in -1..1. */
  update(dt, input, level) {
    const len = Math.hypot(input.x, input.y);
    this.moving = len > 0.05;
    this.sneaking = Boolean(input.sneak) && this.moving;
    const speed = this.sneaking ? PLAYER.sneakSpeed : PLAYER.walkSpeed;
    this.stepped = false;
    if (this.moving) {
      const nx = input.x / (len || 1);
      const ny = input.y / (len || 1);
      this.angle = Math.atan2(ny, nx);
      const step = speed * dt;
      this.moveAxis(level, nx * step, 0);
      this.moveAxis(level, 0, ny * step);
      this.stepTimer += dt;
      const interval = this.sneaking ? 0.5 : 0.34;
      if (this.stepTimer >= interval) {
        this.stepTimer = 0;
        this.stepped = true;
      }
    }
    this.hidden = insidePlant(level, this.x, this.y);
  }

  moveAxis(level, dx, dy) {
    const r = PLAYER.radius;
    const solids = solidRects(level);
    const nx = this.x + dx;
    let blocked = false;
    for (const s of solids) {
      if (nx + r > s.x && nx - r < s.x + s.w && this.y + r > s.y && this.y - r < s.y + s.h) {
        blocked = true;
        break;
      }
    }
    if (!blocked) this.x = nx;
    const ny = this.y + dy;
    blocked = false;
    for (const s of solids) {
      if (this.x + r > s.x && this.x - r < s.x + s.w && ny + r > s.y && ny - r < s.y + s.h) {
        blocked = true;
        break;
      }
    }
    if (!blocked) this.y = ny;
  }
}

/** Read the held keys into a movement vector. */
export function readInput(keys) {
  let x = 0;
  let y = 0;
  if (keys.has('arrowleft') || keys.has('a')) x -= 1;
  if (keys.has('arrowright') || keys.has('d')) x += 1;
  if (keys.has('arrowup') || keys.has('w')) y -= 1;
  if (keys.has('arrowdown') || keys.has('s')) y += 1;
  return { x, y, sneak: keys.has('shift') };
}
