import { PROFILE } from './data/profile.js';
import { detectWebGL, getQualityTier, onQualityChange, watchFrameHealth, REDUCED_MOTION } from './scenes/scene-utils.js';
import { initReveal, initScrollSpy, initMobileNav } from './navigation.js';
import {
  renderWorkshopCards, renderProjectGrid, initWorkshopFilters,
  initReasonChips, initContactForm, initHeroCycle
} from './interactions.js';
import { createAmbience } from './audio.js';
import { initSystemMode } from './system-mode.js';
import { initAskBrandon } from './ask-brandon.js';

function renderProfileAndStory() {
  // Profile fields, Right Now cards, journey chapters, and beliefs already
  // exist as authored DOM in index.html; this just double-checks the numbers
  // agree with data/profile.js so nothing can silently drift. Full dynamic
  // re-render of hand-tuned layout markup is intentionally avoided here to
  // keep the authored HTML structure/CSS pairing simple to review.
  const heroWords = PROFILE.heroCycleWords;
  initHeroCycle(heroWords, REDUCED_MOTION);
}

async function boot() {
  renderWorkshopCards();
  renderProjectGrid();
  renderProfileAndStory();

  initReveal();
  initScrollSpy(sectionId => { if (window.__ambience) window.__ambience.setSectionTheme(sectionId); });
  initWorkshopFilters();
  initReasonChips();
  initContactForm();
  if (window.matchMedia('(max-width:760px)').matches) initMobileNav();

  const ambience = createAmbience();
  window.__ambience = ambience;

  const askBrandon = initAskBrandon();

  const scenes = {};
  if (detectWebGL()) {
    document.body.classList.add('webgl-ok');
    try {
      const { initHero } = await import('./scenes/hero-scene.js');
      scenes.hero = initHero();
    } catch (e) { console.warn('Hero scene failed to init:', e); }

    try {
      const { initConstellation } = await import('./scenes/project-constellation.js');
      const hud = document.getElementById('node-hud');
      const hudStatus = document.getElementById('hud-status');
      const hudCat = document.getElementById('hud-cat');
      const hudTitle = document.getElementById('hud-title');
      const hudDesc = document.getElementById('hud-desc');
      scenes.constellation = initConstellation({
        onHover(p) {
          hud.classList.add('show');
          hudStatus.className = 'status-pill ' + p.status;
          hudStatus.textContent = p.statusLabel;
          hudCat.textContent = p.category;
          hudTitle.textContent = p.name;
          hudDesc.textContent = p.shortDesc;
          if (ambience.isRunning() && p.id === 'solen') ambience.setSectionTheme('solen');
        }
      });
    } catch (e) { console.warn('Constellation scene failed to init:', e); }

    try {
      if (window.gsap && window.ScrollTrigger) {
        const { initJourney } = await import('./scenes/journey-scene.js');
        scenes.journey = initJourney(window.gsap, window.ScrollTrigger);
      }
    } catch (e) { console.warn('Journey scene failed to init:', e); }

    onQualityChange(tier => {
      Object.values(scenes).forEach(s => { if (s && s.setQuality) s.setQuality(tier); });
    });
    watchFrameHealth();
  } else {
    document.body.classList.add('webgl-fallback');
  }

  const system = initSystemMode({
    scenes,
    ambience,
    askBrandonOpen: () => askBrandon.open()
  });

  const askTrigger = document.getElementById('ask-brandon-trigger');
  if (askTrigger) askTrigger.onclick = () => askBrandon.open();

  const fab = document.getElementById('rabbit-hole-fab');
  if (fab) fab.onclick = () => system.goRabbitHole();
}

boot();
