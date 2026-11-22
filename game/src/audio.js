// Ember Pact — audio.js
// One job: small synthesized sounds, no audio files at all. A short
// oscillator blip for playing a card, a lower thud for an attack, a
// rising arpeggio for a win and a falling one for a loss. The audio
// context is created on the first user gesture, and M or the mute
// button silences everything. Silence is the default until you play.

export function createAudio() {
  const audio = { context: null, muted: false };

  function ensure() {
    if (!audio.context) {
      const Ctor = window.AudioContext || window.webkitAudioContext;
      if (!Ctor) return null;
      audio.context = new Ctor();
    }
    if (audio.context.state === 'suspended') audio.context.resume();
    return audio.context;
  }

  function tone(freq, at, dur, type = 'sine', gain = 0.08) {
    const ctx = ensure();
    if (!ctx || audio.muted) return;
    const osc = ctx.createOscillator();
    const amp = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    amp.gain.setValueAtTime(gain, ctx.currentTime + at);
    amp.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + at + dur);
    osc.connect(amp);
    amp.connect(ctx.destination);
    osc.start(ctx.currentTime + at);
    osc.stop(ctx.currentTime + at + dur);
  }

  return {
    get muted() { return audio.muted; },
    setMuted(value) { audio.muted = value; },
    unlock() { ensure(); },
    playCard() { tone(520, 0, 0.12, 'triangle'); tone(780, 0.05, 0.1, 'triangle', 0.05); },
    attack() { tone(180, 0, 0.15, 'sawtooth', 0.07); tone(120, 0.06, 0.12, 'square', 0.04); },
    heal() { tone(440, 0, 0.15, 'sine'); tone(660, 0.08, 0.18, 'sine', 0.05); },
    denied() { tone(140, 0, 0.12, 'square', 0.05); },
    win() { [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.12, 0.25, 'triangle', 0.09)); },
    lose() { [392, 330, 262, 196].forEach((f, i) => tone(f, i * 0.14, 0.3, 'sine', 0.08)); },
  };
}
