// The Quiet Gallery — guards: patrol routes, sweeping lookouts, suspicion,
// the chase, and giving up when the trail goes cold.
import { GUARD, SUSPICION } from './config.js';
import { canSee, hasLineOfSight } from './vision.js';
import { solidRects } from './level.js';

function angleDiff(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

function turnToward(guard, want, dt) {
  const d = angleDiff(want, guard.angle);
  const step = GUARD.turnSpeed * dt;
  guard.angle += Math.abs(d) <= step ? d : Math.sign(d) * step;
}

function moveWithCollision(guard, dx, dy, solids) {
  const r = GUARD.radius;
  const overlaps = (x, y, s) => x + r > s.x && x - r < s.x + s.w && y + r > s.y && y - r < s.y + s.h;
  let nx = guard.x + dx;
  for (const s of solids) {
    // A guard already touching a solid is never shoved out of it sideways.
    if (overlaps(guard.x, guard.y, s)) continue;
    if (overlaps(nx, guard.y, s)) nx = dx > 0 ? s.x - r : s.x + s.w + r;
  }
  guard.x = nx;
  let ny = guard.y + dy;
  for (const s of solids) {
    if (overlaps(guard.x, guard.y, s)) continue;
    if (overlaps(guard.x, ny, s)) ny = dy > 0 ? s.y - r : s.y + s.h + r;
  }
  guard.y = ny;
}

export class Guard {
  constructor(def) {
    this.name = def.name;
    this.x = def.x;
    this.y = def.y;
    this.kind = def.kind;
    this.speed = def.speed;
    this.waypoints = def.waypoints;
    this.wpIndex = 0;
    this.sweepCentre = def.sweepCentre ?? 0;
    this.sweepWidth = def.sweepWidth ?? 0;
    this.sweepPhase = 0;
    this.angle = def.kind === 'lookout' ? this.sweepCentre : 0;
    this.mode = 'patrol'; // patrol | chase | return
    this.suspicion = 0;
    this.chaseTimer = 0;
    this.loseTimer = 0;
    this.alerted = false; // latched once: the run is no longer a ghost run
    this.seesPlayer = false;
  }

  update(dt, player, level) {
    const blockers = level.blockers;
    const hidden = player.hidden;
    const seen = !hidden && canSee(this, player.x, player.y, blockers);
    this.seesPlayer = seen;
    const dist = Math.hypot(player.x - this.x, player.y - this.y);

    if (seen) {
      // Closer is scarier: suspicion climbs fastest at point-blank range.
      const closeness = Math.max(0.5, 1.35 - dist / GUARD.viewRange);
      this.suspicion += SUSPICION.gain * closeness * dt;
      this.loseTimer = 0;
      if (this.suspicion >= 100) {
        this.suspicion = 100;
        if (this.mode !== 'chase') this.chaseTimer = SUSPICION.chaseSeconds;
        this.mode = 'chase';
        this.alerted = true;
      }
    } else {
      this.suspicion = Math.max(0, this.suspicion - SUSPICION.decay * dt);
      if (this.mode === 'chase') {
        this.loseTimer += dt;
        if (this.loseTimer >= SUSPICION.loseSightSeconds) {
          this.mode = 'return';
          this.chaseTimer = 0;
        }
      }
    }

    // Loud footsteps nearby make a guard turn and grow suspicious.
    if (!player.sneaking && player.moving && dist < 110) {
      this.suspicion = Math.min(100, this.suspicion + SUSPICION.noiseGain * dt);
      if (this.mode === 'patrol') turnToward(this, Math.atan2(player.y - this.y, player.x - this.x), dt);
    }

    if (this.mode === 'chase') {
      this.chaseTimer -= dt;
      turnToward(this, Math.atan2(player.y - this.y, player.x - this.x), dt * 1.6);
      const step = GUARD.chaseSpeed * dt;
      moveWithCollision(this, Math.cos(this.angle) * step, Math.sin(this.angle) * step, solidRects(level));
      if (this.chaseTimer <= 0 && !seen) this.mode = 'return';
      return dist;
    }

    if (this.mode === 'return') {
      const target = this.waypoints[this.wpIndex] ?? [this.x, this.y];
      const d = Math.hypot(target[0] - this.x, target[1] - this.y);
      if (d < 6) {
        this.mode = 'patrol';
      } else {
        const want = Math.atan2(target[1] - this.y, target[0] - this.x);
        turnToward(this, want, dt);
        const step = GUARD.patrolSpeed * 1.4 * dt;
        moveWithCollision(this, Math.cos(this.angle) * step, Math.sin(this.angle) * step, solidRects(level));
      }
      if (this.suspicion <= SUSPICION.returnBelow) this.mode = 'patrol';
      return dist;
    }

    // Patrol: walk the loop, or sweep back and forth for a lookout.
    if (this.kind === 'lookout') {
      this.sweepPhase += GUARD.sweepSpeed * dt;
      this.angle = this.sweepCentre + Math.sin(this.sweepPhase) * this.sweepWidth;
      return dist;
    }
    const target = this.waypoints[this.wpIndex];
    const d = Math.hypot(target[0] - this.x, target[1] - this.y);
    if (d < 8) {
      this.wpIndex = (this.wpIndex + 1) % this.waypoints.length;
    } else {
      const want = Math.atan2(target[1] - this.y, target[0] - this.x);
      turnToward(this, want, dt);
      const step = this.speed * dt;
      moveWithCollision(this, Math.cos(this.angle) * step, Math.sin(this.angle) * step, solidRects(level));
    }
    return dist;
  }

  get caughtPlayer() {
    return this.mode === 'chase';
  }
}

/** Build the guard objects for a fresh run. */
export function createGuards(level) {
  return level.guards.map((def) => new Guard(def));
}

/** The highest suspicion of any guard — the HUD's alarm meter. */
export function maxSuspicion(guards) {
  let top = 0;
  for (const g of guards) top = Math.max(top, g.suspicion);
  return top;
}

/** True when any guard is actively chasing. */
export function anyChase(guards) {
  return guards.some((g) => g.mode === 'chase');
}

/** True when a chasing guard has caught the player. */
export function caughtBy(guards, player) {
  for (const g of guards) {
    if (g.mode === 'chase' && Math.hypot(g.x - player.x, g.y - player.y) < GUARD.catchDistance) {
      return g;
    }
  }
  return null;
}

export { hasLineOfSight };
