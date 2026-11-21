// The Quiet Gallery — sound, synthesized live with WebAudio: no audio files.
// Footsteps tell you where a guard is; a sting tells you you were seen.
let ctx = null;
let alarmTimer = null;

function audio() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function tone(freq, dur, type, vol, when = 0) {
  const ac = audio();
  if (!ac) return;
  const t0 = ac.currentTime + when;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0, t0);
  gain.gain.linearRampToValueAtTime(vol, t0 + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(gain).connect(ac.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

export const sfx = {
  unlock() { audio(); },
  step(sneak) { tone(sneak ? 130 : 95, 0.07, 'sine', sneak ? 0.03 : 0.06); },
  pickup() { tone(660, 0.12, 'triangle', 0.12); tone(990, 0.18, 'triangle', 0.1, 0.09); },
  spotted() {
    tone(220, 0.3, 'sawtooth', 0.14);
    tone(233, 0.3, 'sawtooth', 0.14, 0.02);
  },
  caught() { tone(110, 0.5, 'sawtooth', 0.18); tone(55, 0.7, 'sine', 0.2, 0.05); },
  win() {
    [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.22, 'triangle', 0.12, i * 0.11));
  },
  alarmStart() {
    if (alarmTimer) return;
    alarmTimer = setInterval(() => tone(880, 0.09, 'square', 0.045), 420);
  },
  alarmStop() {
    if (alarmTimer) { clearInterval(alarmTimer); alarmTimer = null; }
  },
};
