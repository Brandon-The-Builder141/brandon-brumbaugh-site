// Immersive Mode: procedural ambience via the Web Audio API. No audio files,
// no autoplay, off by default. Explicit opt-in only, remembered for the
// session. Themed subtly per section: physical (deeper/mechanical texture),
// digital (softer synthetic pad), Solen (warmer/fluid tone), transitions
// (brief restrained shifts). Auto-disables on any error or if the context
// can't start.

const SECTION_THEMES = {
  hero: 'transition',
  now: 'digital',
  constellation: 'digital',
  journey: 'physical',
  workshop: 'physical',
  media: 'digital',
  clock: 'digital',
  beliefs: 'transition',
  connect: 'transition'
};

const THEME_PARAMS = {
  physical: { base: 82, filter: 480, detune: 6, noiseGain: 0.05 },
  digital: { base: 220, filter: 1400, detune: 3, noiseGain: 0.02 },
  transition: { base: 150, filter: 900, detune: 4, noiseGain: 0.03 },
  solen: { base: 260, filter: 1800, detune: 2, noiseGain: 0.015 }
};

export function createAmbience() {
  let ctx = null;
  let master, osc1, osc2, filter, noiseSrc, lfo, lfoGain, panner;
  let running = false;
  let currentTheme = 'transition';

  function makeNoiseBuffer(audioCtx) {
    const len = audioCtx.sampleRate * 2;
    const buf = audioCtx.createBuffer(1, len, audioCtx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * 0.3;
    return buf;
  }

  function build() {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    master = ctx.createGain();
    master.gain.value = 0;
    master.connect(ctx.destination);

    filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 900;
    filter.connect(master);

    panner = ctx.createStereoPanner();
    panner.connect(filter);

    osc1 = ctx.createOscillator();
    osc1.type = 'sine';
    osc2 = ctx.createOscillator();
    osc2.type = 'triangle';
    const oscGain = ctx.createGain();
    oscGain.gain.value = 0.18;
    osc1.connect(oscGain);
    osc2.connect(oscGain);
    oscGain.connect(panner);

    noiseSrc = ctx.createBufferSource();
    noiseSrc.buffer = makeNoiseBuffer(ctx);
    noiseSrc.loop = true;
    const noiseGain = ctx.createGain();
    noiseGain.gain.value = 0.03;
    noiseSrc.connect(noiseGain);
    noiseGain.connect(panner);
    ambience_noiseGainRef = noiseGain;

    lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 0.05;
    lfoGain = ctx.createGain();
    lfoGain.gain.value = 0.6;
    lfo.connect(lfoGain);
    lfoGain.connect(panner.pan);

    osc1.start();
    osc2.start();
    noiseSrc.start();
    lfo.start();
  }

  let ambience_noiseGainRef = null;

  function applyTheme(theme, immediate) {
    if (!ctx) return;
    const p = THEME_PARAMS[theme] || THEME_PARAMS.transition;
    const t = ctx.currentTime;
    const ramp = immediate ? 0.05 : 3.5;
    osc1.frequency.linearRampToValueAtTime(p.base, t + ramp);
    osc2.frequency.linearRampToValueAtTime(p.base * 1.5 + p.detune, t + ramp);
    filter.frequency.linearRampToValueAtTime(p.filter, t + ramp);
    if (ambience_noiseGainRef) ambience_noiseGainRef.gain.linearRampToValueAtTime(p.noiseGain, t + ramp);
    currentTheme = theme;
  }

  async function start() {
    try {
      if (!ctx) build();
      if (ctx.state === 'suspended') await ctx.resume();
      applyTheme('transition', true);
      master.gain.cancelScheduledValues(ctx.currentTime);
      master.gain.linearRampToValueAtTime(0.22, ctx.currentTime + 1.2);
      running = true;
      return true;
    } catch (e) {
      console.warn('Immersive Mode unavailable:', e);
      running = false;
      return false;
    }
  }

  function stop() {
    if (!ctx || !master) return;
    master.gain.cancelScheduledValues(ctx.currentTime);
    master.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.8);
    running = false;
  }

  function setSectionTheme(sectionId) {
    if (!running) return;
    const theme = THEME_PARAMS[sectionId] ? sectionId : (SECTION_THEMES[sectionId] || 'transition');
    if (theme !== currentTheme) applyTheme(theme, false);
  }

  function isRunning() { return running; }

  return { start, stop, setSectionTheme, isRunning };
}
