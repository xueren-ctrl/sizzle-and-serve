// Tiny sounds for Sizzle & Serve: short synthesized blips from the
// Web Audio API. No audio files are loaded. Sound starts only after the
// player's first key or click (browsers block audio before a gesture),
// and M toggles it off. In shot mode main.js never calls play(), so the
// screenshots render silently.

/** The sounds the game can play, each a little list of notes. */
const TUNES = {
  pickup: [[660, 0.06]],
  place: [[330, 0.07]],
  chop: [[520, 0.05], [620, 0.05]],
  ding: [[880, 0.12], [1174, 0.14]],
  dish: [[523, 0.08], [659, 0.08], [784, 0.12]],
  serve: [[523, 0.09], [659, 0.09], [784, 0.09], [1046, 0.16]],
  fail: [[220, 0.18], [174, 0.24]],
  trash: [[180, 0.08]],
};

/** A sound player. `muted` starts false. */
export function makeSound() {
  return { ctx: null, muted: false };
}

/** Creates the audio context on first use (after a user gesture). */
function ensureContext(sound) {
  if (sound.ctx) return sound.ctx;
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return null;
  sound.ctx = new AudioContext();
  return sound.ctx;
}

/** Plays a named tune, unless muted. Safe to call before any gesture. */
export function playSound(sound, name) {
  if (sound.muted) return;
  const ctx = ensureContext(sound);
  if (!ctx) return;
  if (ctx.state === 'suspended') ctx.resume();
  const tune = TUNES[name];
  if (!tune) return;
  let at = ctx.currentTime;
  for (const [freq, dur] of tune) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.12, at);
    gain.gain.exponentialRampToValueAtTime(0.001, at + dur);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(at);
    osc.stop(at + dur + 0.02);
    at += dur;
  }
}
