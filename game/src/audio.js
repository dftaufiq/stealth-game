// audio.js — every sound is synthesized with WebAudio, so the game ships
// no audio files and plays with no network request. Footsteps tick as the
// player walks, the alert sting rises when a guard spots the thief, and a
// soft wind loop keeps the night alive. Nothing starts until the first
// key press or click (browsers require a user gesture).
export function createAudio() {
  const audio = {
    ctx: null,
    master: null,
    muted: false,
    wind: null,
    lastStep: 0,
  };

  audio.ensure = () => {
    if (audio.ctx) {
      if (audio.ctx.state === 'suspended') audio.ctx.resume();
      return;
    }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    audio.ctx = new AC();
    audio.master = audio.ctx.createGain();
    audio.master.gain.value = 0.5;
    audio.master.connect(audio.ctx.destination);
    audio.startWind();
  };

  audio.toggleMute = () => {
    audio.muted = !audio.muted;
    if (audio.master) audio.master.gain.value = audio.muted ? 0 : 0.5;
    return audio.muted;
  };

  // A low looped wind: filtered noise, barely there.
  audio.startWind = () => {
    const ctx = audio.ctx;
    const len = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) {
      const white = Math.random() * 2 - 1;
      last = (last + 0.02 * white) / 1.02; // brown-ish noise
      data[i] = last * 3;
    }
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.loop = true;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 320;
    const gain = ctx.createGain();
    gain.gain.value = 0.05;
    src.connect(filter).connect(gain).connect(audio.master);
    src.start();
    audio.wind = src;
  };

  function tone(freq, dur, type, vol, when = 0, slideTo = null) {
    if (!audio.ctx || audio.muted) return;
    const ctx = audio.ctx;
    const t0 = ctx.currentTime + when;
    const osc = ctx.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, t0);
    gain.gain.linearRampToValueAtTime(vol, t0 + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain).connect(audio.master);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  }

  function noiseBurst(dur, vol, freq) {
    if (!audio.ctx || audio.muted) return;
    const ctx = audio.ctx;
    const len = Math.max(1, Math.floor(ctx.sampleRate * dur));
    const buffer = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = freq;
    const gain = ctx.createGain();
    gain.gain.value = vol;
    src.connect(filter).connect(gain).connect(audio.master);
    src.start();
  }

  audio.step = (running) => {
    if (!audio.ctx || audio.muted) return;
    const now = audio.ctx.currentTime;
    if (now - audio.lastStep < (running ? 0.26 : 0.38)) return;
    audio.lastStep = now;
    noiseBurst(0.05, running ? 0.22 : 0.1, running ? 900 : 500);
  };

  audio.pebble = () => noiseBurst(0.09, 0.3, 2400);
  audio.pickup = () => {
    tone(880, 0.12, 'sine', 0.22);
    tone(1318, 0.18, 'sine', 0.2, 0.08);
  };
  audio.alert = () => {
    tone(196, 0.16, 'sawtooth', 0.16, 0, 311);
    tone(311, 0.2, 'sawtooth', 0.14, 0.12, 196);
  };
  audio.caught = () => {
    tone(220, 0.3, 'sawtooth', 0.22, 0, 110);
    tone(110, 0.5, 'sawtooth', 0.2, 0.18, 55);
  };
  audio.win = () => {
    [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.22, 'triangle', 0.2, i * 0.11));
  };
  audio.exitOpen = () => {
    tone(392, 0.15, 'triangle', 0.18);
    tone(587, 0.25, 'triangle', 0.18, 0.1);
  };

  return audio;
}
