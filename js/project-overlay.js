import { getProject } from './data/projects.js';
import { REDUCED_MOTION } from './scenes/scene-utils.js';

// The project detail system. One reusable overlay template drives all six
// projects (Priority 4 / "create the system for other projects"); Solen gets
// the full signature treatment on top of it, Iron Legion and The Long Way
// Around get a lighter bespoke moment, and the rest use the shared template
// with their existing constellation visual identity as the only flourish.
//
// `constellationApi`, when the WebGL scene is running, exposes:
//   focusProject(id) / clearFocus() — dim/dolly toward a node
// Absent on mobile (no 3D canvas there) or if WebGL failed — the overlay
// still works perfectly without it.

export function initProjectOverlay({ ambience } = {}) {
  let constellationApi = null;
  let currentId = null;
  let lastFocused = null;

  const root = document.createElement('div');
  root.id = 'project-overlay';
  root.setAttribute('aria-hidden', 'true');
  root.innerHTML = `
    <div class="po-backdrop" data-close></div>
    <div class="po-panel" role="dialog" aria-modal="true" aria-labelledby="po-title">
      <button class="po-close" data-close aria-label="Return to the Workshop">← Return to the Workshop</button>
      <div class="po-content">
        <div class="po-eyebrow"><span class="po-status" id="po-status"></span><span id="po-cat"></span></div>
        <h2 id="po-title"></h2>
        <p class="po-tagline" id="po-tagline"></p>

        <div class="po-section">
          <h3>Why</h3>
          <p id="po-why"></p>
        </div>
        <div class="po-section">
          <h3>The Idea</h3>
          <p id="po-idea"></p>
        </div>
        <div class="po-section">
          <h3>Core Areas</h3>
          <div class="po-tags" id="po-areas"></div>
        </div>
        <div class="po-section">
          <h3>Current Status</h3>
          <p id="po-status-detail"></p>
        </div>
        <div class="po-section">
          <h3>What I'm Learning</h3>
          <p id="po-learning"></p>
        </div>
        <div class="po-section" id="po-gallery-section" hidden>
          <h3>Job Site Photos</h3>
          <div class="po-gallery" id="po-gallery"></div>
        </div>

        <button class="btn btn-ghost po-back-btn" data-close>← Back to the Constellation</button>
      </div>
    </div>
  `;
  document.body.appendChild(root);

  const lightbox = document.createElement('div');
  lightbox.id = 'po-lightbox';
  lightbox.setAttribute('aria-hidden', 'true');
  lightbox.innerHTML = `
    <div class="po-lb-backdrop" data-lb-close></div>
    <button class="po-lb-close" data-lb-close aria-label="Close photo">✕</button>
    <button class="po-lb-nav po-lb-prev" data-lb-prev aria-label="Previous photo">←</button>
    <img class="po-lb-img" alt="">
    <button class="po-lb-nav po-lb-next" data-lb-next aria-label="Next photo">→</button>
    <div class="po-lb-count"></div>
  `;
  document.body.appendChild(lightbox);
  let galleryImages = [];
  let lbIndex = 0;

  function openLightbox(images, index) {
    galleryImages = images;
    lbIndex = index;
    renderLightbox();
    lightbox.classList.add('open');
    lightbox.setAttribute('aria-hidden', 'false');
  }
  function renderLightbox() {
    const img = lightbox.querySelector('.po-lb-img');
    img.src = galleryImages[lbIndex];
    img.alt = 'Iron Legion Contracting LLC — job site photo ' + (lbIndex + 1) + ' of ' + galleryImages.length;
    lightbox.querySelector('.po-lb-count').textContent = (lbIndex + 1) + ' / ' + galleryImages.length;
  }
  function closeLightbox() {
    lightbox.classList.remove('open');
    lightbox.setAttribute('aria-hidden', 'true');
  }
  function lbStep(dir) {
    lbIndex = (lbIndex + dir + galleryImages.length) % galleryImages.length;
    renderLightbox();
  }
  lightbox.addEventListener('click', e => {
    if (e.target.closest('[data-lb-close]')) closeLightbox();
    if (e.target.closest('[data-lb-prev]')) lbStep(-1);
    if (e.target.closest('[data-lb-next]')) lbStep(1);
  });

  const backBtn = () => root.querySelectorAll('[data-close]');

  function setConstellationApi(api) { constellationApi = api; }

  function populate(p) {
    root.className = 'po-tier-' + p.tier + ' po-' + p.id;
    root.querySelector('#po-status').textContent = p.statusLabel;
    root.querySelector('#po-status').className = 'po-status status-pill ' + p.status;
    root.querySelector('#po-cat').textContent = p.category;
    root.querySelector('#po-title').textContent = p.name;
    root.querySelector('#po-tagline').textContent = p.tagline;
    root.querySelector('#po-why').textContent = p.why;
    root.querySelector('#po-idea').textContent = p.idea;
    root.querySelector('#po-areas').innerHTML = p.coreAreas.map(a => `<span class="tag">${a}</span>`).join('');
    root.querySelector('#po-status-detail').textContent = p.currentStatusDetail;
    root.querySelector('#po-learning').textContent = p.learning;

    const gallerySection = root.querySelector('#po-gallery-section');
    const galleryEl = root.querySelector('#po-gallery');
    if (p.gallery && p.gallery.length) {
      gallerySection.hidden = false;
      galleryEl.innerHTML = p.gallery.map((src, i) => `
        <button type="button" class="po-gallery-thumb" data-idx="${i}" aria-label="View job site photo ${i + 1} of ${p.gallery.length}">
          <img src="${src}" alt="" loading="lazy" decoding="async">
        </button>
      `).join('');
      galleryEl.querySelectorAll('.po-gallery-thumb').forEach(btn => {
        btn.addEventListener('click', () => openLightbox(p.gallery, Number(btn.dataset.idx)));
      });
    } else {
      gallerySection.hidden = true;
      galleryEl.innerHTML = '';
    }
  }

  function open(id) {
    const p = getProject(id);
    if (!p) return;
    currentId = id;
    lastFocused = document.activeElement;
    populate(p);
    root.classList.add('open');
    root.setAttribute('aria-hidden', 'false');
    document.body.classList.add('overlay-open');

    if (constellationApi && constellationApi.focusProject) {
      constellationApi.focusProject(id, { reducedMotion: REDUCED_MOTION });
    }
    if (ambience && ambience.isRunning()) {
      const theme = p.id === 'solen' ? 'solen' : (p.tags.includes('physical') ? 'physical' : 'digital');
      ambience.setSectionTheme(theme);
    }

    requestAnimationFrame(() => {
      const closeBtn = root.querySelector('.po-close');
      if (closeBtn) closeBtn.focus();
    });

    if (location.hash !== '#project=' + id) {
      history.replaceState(null, '', '#project=' + id);
    }
  }

  function close() {
    if (!currentId) return;
    closeLightbox();
    root.classList.remove('open');
    root.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('overlay-open');
    if (constellationApi && constellationApi.clearFocus) {
      constellationApi.clearFocus({ reducedMotion: REDUCED_MOTION });
    }
    if (ambience && ambience.isRunning()) ambience.setSectionTheme('constellation');
    currentId = null;
    if (location.hash.startsWith('#project=')) {
      history.replaceState(null, '', location.pathname + location.search + '#constellation');
    }
    if (lastFocused && document.contains(lastFocused)) lastFocused.focus();
  }

  root.addEventListener('click', e => {
    if (e.target.closest('[data-close]')) close();
  });

  // Solen's backdrop leans toward the visitor's touch/pointer — a cheap,
  // WebGL-free way for the mobile Solen experience to still feel alive and
  // intentionally designed rather than "desktop effects turned off."
  function updateSolenTilt(x, y) {
    if (!root.classList.contains('po-solen')) return;
    const px = (x / window.innerWidth) * 100;
    const py = (y / window.innerHeight) * 100;
    root.style.setProperty('--gx', px + '%');
    root.style.setProperty('--gy', py + '%');
  }
  root.addEventListener('pointermove', e => updateSolenTilt(e.clientX, e.clientY));
  root.addEventListener('touchmove', e => {
    if (e.touches[0]) updateSolenTilt(e.touches[0].clientX, e.touches[0].clientY);
  }, { passive: true });
  document.addEventListener('keydown', e => {
    if (lightbox.classList.contains('open')) {
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') lbStep(-1);
      if (e.key === 'ArrowRight') lbStep(1);
      return;
    }
    if (e.key === 'Escape' && root.classList.contains('open')) close();
    if (e.key === 'Tab' && root.classList.contains('open')) trapFocus(e);
  });

  function trapFocus(e) {
    const focusables = root.querySelectorAll('button, a[href], input, [tabindex]:not([tabindex="-1"])');
    if (!focusables.length) return;
    const first = focusables[0], last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  // deep-link support: #project=solen opens directly on load
  function checkHash() {
    const m = location.hash.match(/^#project=([a-z-]+)/);
    if (m && getProject(m[1])) open(m[1]);
  }
  window.addEventListener('hashchange', checkHash);

  return { open, close, setConstellationApi, checkHash, isOpen: () => !!currentId };
}
