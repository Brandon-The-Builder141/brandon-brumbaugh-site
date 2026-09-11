// Shared engineering utilities for every three.js scene on the site:
// WebGL capability detection, a real HIGH/MEDIUM/LOW/FALLBACK quality tier
// system (not scattered ad-hoc conditionals), DPR clamping, and an
// IntersectionObserver-based render-pause helper.

export function detectWebGL() {
  try {
    const canvas = document.createElement('canvas');
    return !!(window.WebGLRenderingContext &&
      (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
  } catch (e) {
    return false;
  }
}

export const REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const TIERS = {
  HIGH:     { dpr: 1.8, bloom: true,  subdivisions: 3, particles: 1.0, journeyScene: true,  label: 'HIGH' },
  MEDIUM:   { dpr: 1.4, bloom: true,  subdivisions: 2, particles: 0.6, journeyScene: true,  label: 'MEDIUM' },
  LOW:      { dpr: 1.1, bloom: false, subdivisions: 1, particles: 0.3, journeyScene: false, label: 'LOW' },
  FALLBACK: { dpr: 1,   bloom: false, subdivisions: 0, particles: 0,   journeyScene: false, label: 'FALLBACK (no WebGL)' }
};

function classifyDevice() {
  if (!detectWebGL()) return 'FALLBACK';
  const isMobile = window.matchMedia('(max-width:760px)').matches;
  const cores = navigator.hardwareConcurrency || 4;
  const mem = navigator.deviceMemory || 4;
  // Conservative on purpose: this site runs multiple concurrent WebGL
  // contexts (hero + constellation + journey), so we start one notch below
  // what raw hardware signals would suggest and let the frame-health watcher
  // (below) downgrade further if actual rendering is slow (e.g. software
  // rendering, integrated GPUs, virtualized/sandboxed environments that
  // report high core counts but render slowly).
  if (isMobile) return (cores >= 6 && mem >= 4) ? 'MEDIUM' : 'LOW';
  if (cores >= 12 && mem >= 8) return 'HIGH';
  if (cores >= 4) return 'MEDIUM';
  return 'LOW';
}

let currentTierName = classifyDevice();
const listeners = new Set();

export function getQualityTier() {
  return { name: currentTierName, ...TIERS[currentTierName] };
}

export function onQualityChange(cb) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function downgrade() {
  const order = ['HIGH', 'MEDIUM', 'LOW', 'FALLBACK'];
  const idx = order.indexOf(currentTierName);
  if (idx < order.length - 1) {
    currentTierName = order[idx + 1];
    listeners.forEach(cb => cb(getQualityTier()));
  }
}

// Adaptive downgrade: watch real frame time for the first few seconds after
// each scene comes online and drop a tier if it's consistently slow, rather
// than trusting the static device heuristic alone.
export function watchFrameHealth() {
  if (REDUCED_MOTION || currentTierName === 'FALLBACK') return;
  let frames = 0, slowFrames = 0, last = performance.now();
  let raf;
  function tick(now) {
    const dt = now - last;
    last = now;
    frames++;
    if (dt > 42) slowFrames++; // slower than ~24fps
    if (dt > 250) { downgrade(); downgrade(); } // one real stall: drop hard, immediately
    if (frames >= 30) {
      if (slowFrames / frames > 0.3) downgrade();
      frames = 0; slowFrames = 0;
    }
    raf = requestAnimationFrame(tick);
  }
  raf = requestAnimationFrame(tick);
  return () => cancelAnimationFrame(raf);
}

export function clampDPR(tier) {
  return Math.min(window.devicePixelRatio || 1, tier.dpr);
}

// Never let a renderer/composer be sized to 0x0 — a hidden/mid-layout
// container (display:none ancestor, a reflow mid-transition, a resize event
// firing before the box has settled) can report clientWidth/clientHeight as
// 0, and a 0-size framebuffer throws GL_INVALID_FRAMEBUFFER_OPERATION on
// every subsequent draw call for the life of that context.
export function safeSize(el, fallback) {
  const w = el.clientWidth || (fallback && fallback.w) || 1;
  const h = el.clientHeight || (fallback && fallback.h) || 1;
  return { w, h };
}

export function pauseWhenOffscreen(el, onVisibleChange) {
  const io = new IntersectionObserver(entries => {
    onVisibleChange(entries[0].isIntersecting);
  }, { threshold: 0 });
  io.observe(el);
  return () => io.disconnect();
}

// Real, non-fabricated stats a scene can report to Build Mode.
export function makeSceneReport(name, details) {
  return { name, ...details, tier: getQualityTier().name };
}
