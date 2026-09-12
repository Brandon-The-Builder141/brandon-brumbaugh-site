import { PROFILE } from './data/profile.js';
import { detectWebGL, getQualityTier, onQualityChange, watchFrameHealth, REDUCED_MOTION } from './scenes/scene-utils.js';
import { initReveal, initScrollSpy, initMobileNav } from './navigation.js';
import {
  renderWorkshopCards, renderProjectGrid, renderProfile, renderRightNow,
  renderJourney, renderBeliefs, validateCanonicalFacts,
  initWorkshopFilters, initReasonChips, initContactForm, initHeroCycle, initMediaVideo
} from './interactions.js';
import { createAmbience } from './audio.js';
import { initSystemMode } from './system-mode.js';
import { initAskBrandon } from './ask-brandon.js';
import { initProjectOverlay } from './project-overlay.js';

async function boot() {
  const ambience = createAmbience();
  window.__ambience = ambience;

  const overlay = initProjectOverlay({ ambience });

  renderWorkshopCards();
  renderProjectGrid(id => overlay.open(id));
  renderProfile();
  renderRightNow(id => overlay.open(id));
  renderJourney();
  renderBeliefs();
  initHeroCycle(PROFILE.heroCycleWords, REDUCED_MOTION);
  initMediaVideo(REDUCED_MOTION);

  initReveal();
  initScrollSpy(sectionId => { if (ambience.isRunning() && !overlay.isOpen()) ambience.setSectionTheme(sectionId); });
  initWorkshopFilters();
  initReasonChips();
  initContactForm();
  if (window.matchMedia('(max-width:760px)').matches) initMobileNav();

  const askBrandon = initAskBrandon();

  const scenes = {};
  if (detectWebGL()) {
    document.body.classList.add('webgl-ok');
    try {
      const { initHero } = await import('./scenes/hero-scene.js');
      scenes.hero = initHero();
    } catch (e) { console.warn('Hero scene failed to init:', e); }

    // No 3D canvas on mobile — .constellation-wrap is display:none there by
    // design (see responsive.css), so starting a full WebGL context behind
    // it would just burn battery/GPU on a scene nobody can see. The project
    // card row is the whole mobile experience instead.
    const isMobileViewport = window.matchMedia('(max-width:760px)').matches;
    if (!isMobileViewport) {
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
          },
          onSelect(id) { overlay.open(id); }
        });
        overlay.setConstellationApi(scenes.constellation);
      } catch (e) { console.warn('Constellation scene failed to init:', e); }
    }

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
    askBrandonOpen: () => askBrandon.open(),
    projectOverlayOpen: id => overlay.open(id)
  });

  const askTrigger = document.getElementById('ask-brandon-trigger');
  if (askTrigger) askTrigger.onclick = () => askBrandon.open();

  const fab = document.getElementById('rabbit-hole-fab');
  if (fab) fab.onclick = () => system.goRabbitHole();

  overlay.checkHash();
  validateCanonicalFacts();
}

boot();
