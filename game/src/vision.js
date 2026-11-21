// The Quiet Gallery — sight: what a guard can actually see. A guard sees the
// player only inside the vision cone AND with an unblocked line of sight.
import { GUARD } from './config.js';

function segmentHitsRect(x1, y1, x2, y2, r) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  let tmin = 0;
  let tmax = 1;
  if (dx === 0) {
    if (x1 < r.x || x1 > r.x + r.w) return false;
  } else {
    let t1 = (r.x - x1) / dx;
    let t2 = (r.x + r.w - x1) / dx;
    if (t1 > t2) { const t = t1; t1 = t2; t2 = t; }
    tmin = Math.max(tmin, t1);
    tmax = Math.min(tmax, t2);
    if (tmin > tmax) return false;
  }
  if (dy === 0) {
    if (y1 < r.y || y1 > r.y + r.h) return false;
  } else {
    let t1 = (r.y - y1) / dy;
    let t2 = (r.y + r.h - y1) / dy;
    if (t1 > t2) { const t = t1; t1 = t2; t2 = t; }
    tmin = Math.max(tmin, t1);
    tmax = Math.min(tmax, t2);
    if (tmin > tmax) return false;
  }
  return true;
}

/** True when no blocker rectangle stands between the two points. */
export function hasLineOfSight(x1, y1, x2, y2, blockers) {
  for (const b of blockers) {
    if (segmentHitsRect(x1, y1, x2, y2, b)) return false;
  }
  return true;
}

function angleDiff(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

/** True when the player stands inside the guard's vision cone (range + angle). */
export function inVisionCone(guard, px, py) {
  const dx = px - guard.x;
  const dy = py - guard.y;
  const dist = Math.hypot(dx, dy);
  if (dist > GUARD.viewRange) return false;
  if (dist < 4) return true;
  const want = Math.atan2(dy, dx);
  return Math.abs(angleDiff(want, guard.angle)) <= GUARD.viewHalfAngle;
}

/** Full sight test: in the cone, in range, and nothing blocks the view. */
export function canSee(guard, px, py, blockers) {
  return inVisionCone(guard, px, py) && hasLineOfSight(guard.x, guard.y, px, py, blockers);
}

/** How far along the cone the sight line travels before a blocker stops it. */
export function coneReach(guard, angle, blockers) {
  let reach = GUARD.viewRange;
  const ex = guard.x + Math.cos(angle) * GUARD.viewRange;
  const ey = guard.y + Math.sin(angle) * GUARD.viewRange;
  for (const b of blockers) {
    const t = rayRectT(guard.x, guard.y, ex - guard.x, ey - guard.y, b);
    if (t !== null && t < reach / GUARD.viewRange) reach = t * GUARD.viewRange;
  }
  return Math.max(26, reach);
}

function rayRectT(x, y, dx, dy, r) {
  let tmin = 0;
  let tmax = 1;
  if (dx === 0) {
    if (x < r.x || x > r.x + r.w) return null;
  } else {
    let t1 = (r.x - x) / dx;
    let t2 = (r.x + r.w - x) / dx;
    if (t1 > t2) { const t = t1; t1 = t2; t2 = t; }
    tmin = Math.max(tmin, t1);
    tmax = Math.min(tmax, t2);
    if (tmin > tmax) return null;
  }
  if (dy === 0) {
    if (y < r.y || y > r.y + r.h) return null;
  } else {
    let t1 = (r.y - y) / dy;
    let t2 = (r.y + r.h - y) / dy;
    if (t1 > t2) { const t = t1; t1 = t2; t2 = t; }
    tmin = Math.max(tmin, t1);
    tmax = Math.min(tmax, t2);
    if (tmin > tmax) return null;
  }
  return tmin;
}
