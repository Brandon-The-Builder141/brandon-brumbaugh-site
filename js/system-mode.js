// Brandon_OS: a terminal-flavored re-skin of the command palette, plus Build
// Mode — a toggle that swaps live materials to wireframe and prints real
// facts about the running scenes (not fabricated stats) next to each major
// section.

import { PROJECTS } from './data/projects.js';
import { getQualityTier } from './scenes/scene-utils.js';

const SECTION_TARGETS = ['#hero', '#profile', '#now', '#constellation', '#journey', '#workshop', '#media', '#clock', '#beliefs', '#connect'];

// A real, live FPS sampler — only runs while Build Mode is on. This is the
// one number in Build Mode that changes every frame, and it's measured, not
// asserted.
function startFpsMeter(onSample) {
  let frames = 0, last = performance.now(), raf;
  function tick(now) {
    frames++;
    if (now - last >= 500) {
      onSample(Math.round((frames * 1000) / (now - last)));
      frames = 0; last = now;
    }
    raf = requestAnimationFrame(tick);
  }
  raf = requestAnimationFrame(tick);
  return () => cancelAnimationFrame(raf);
}

export function initSystemMode({ scenes, ambience, askBrandonOpen, projectOverlayOpen }) {
  const overlay = document.getElementById('cmdk-overlay');
  const input = document.getElementById('cmdk-input');
  const list = document.getElementById('cmdk-list');
  const trigger = document.getElementById('cmdk-trigger');
  const buildToggle = document.getElementById('build-mode-toggle');
  const immersiveToggle = document.getElementById('immersive-toggle');

  let buildModeOn = false;
  const annotations = [];
  let stopFpsMeter = null;
  let fpsBadge = null;

  function commands() {
    const base = [
      { t: 'Who is Brandon?', go: '#profile' },
      { t: "What's he building?", go: '#now' },
      { t: 'Show me his work', go: '#workshop' },
      { t: 'Listen to the podcast', go: '#media' },
      { t: 'What is he doing right now?', go: '#now' },
      { t: 'Work with Brandon', go: '#connect' },
      { t: 'Take me down a rabbit hole', go: 'random' },
      { t: 'Ask About Brandon', go: 'ask' },
      { t: buildModeOn ? 'Turn off Build Mode' : 'Turn on Build Mode', go: 'build' },
      { t: ambience && ambience.isRunning() ? 'Turn off Immersive Mode' : 'Turn on Immersive Mode', go: 'immersive' },
      { t: 'How This Site Was Built', go: '#how-built' }
    ];
    PROJECTS.forEach(p => base.push({ t: 'Open ' + p.name, go: 'project:' + p.id }));
    return base;
  }

  function renderList(filter) {
    list.innerHTML = '';
    const f = (filter || '').toLowerCase();
    commands().filter(c => c.t.toLowerCase().includes(f)).forEach(c => {
      const d = document.createElement('div');
      d.className = 'cmdk-item';
      d.textContent = c.t;
      const s = document.createElement('span');
      s.textContent = c.go === 'random' ? '?' : (c.go === 'build' || c.go === 'immersive' || c.go === 'ask') ? '⌁' : c.go.startsWith('project:') ? '#project' : c.go;
      d.appendChild(s);
      d.onclick = () => {
        closeCmdk();
        if (c.go === 'random') return goRabbitHole();
        if (c.go === 'build') return toggleBuildMode();
        if (c.go === 'immersive') return toggleImmersive();
        if (c.go === 'ask') return askBrandonOpen && askBrandonOpen();
        if (c.go.startsWith('project:')) return projectOverlayOpen && projectOverlayOpen(c.go.slice(8));
        const el = document.querySelector(c.go);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      };
      list.appendChild(d);
    });
  }

  function openCmdk() { overlay.classList.add('open'); input.value = ''; renderList(''); input.focus(); }
  function closeCmdk() { overlay.classList.remove('open'); }

  trigger.onclick = openCmdk;
  overlay.onclick = e => { if (e.target === overlay) closeCmdk(); };
  input.addEventListener('input', () => renderList(input.value));
  document.addEventListener('keydown', e => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); openCmdk(); }
    if (e.key === 'Escape') closeCmdk();
  });

  function goRabbitHole() {
    const pool = [...PROJECTS.map(p => ({ label: p.name, project: p.id })), ...SECTION_TARGETS.map(s => ({ label: s.replace('#', ''), go: s }))];
    const pick = pool[Math.floor(Math.random() * pool.length)];
    if (pick.project && projectOverlayOpen) {
      projectOverlayOpen(pick.project);
    } else {
      const el = document.querySelector(pick.go);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
    showToast('Down the rabbit hole: ' + pick.label);
  }

  function showToast(text) {
    let toast = document.getElementById('rabbit-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'rabbit-toast';
      document.body.appendChild(toast);
    }
    toast.textContent = text;
    toast.classList.add('show');
    clearTimeout(toast._t);
    toast._t = setTimeout(() => toast.classList.remove('show'), 2600);
  }

  function toggleBuildMode() {
    buildModeOn = !buildModeOn;
    document.body.classList.toggle('build-mode', buildModeOn);
    if (buildToggle) buildToggle.setAttribute('aria-pressed', String(buildModeOn));
    Object.values(scenes).forEach(s => { if (s && s.setWireframe) s.setWireframe(buildModeOn); });
    renderAnnotations();

    if (buildModeOn) {
      fpsBadge = document.createElement('div');
      fpsBadge.id = 'fps-badge';
      fpsBadge.className = 'build-annotation build-fps';
      document.body.appendChild(fpsBadge);
      const tier = getQualityTier();
      const renderScenes = Object.values(scenes).filter(Boolean).length;
      stopFpsMeter = startFpsMeter(fps => {
        fpsBadge.innerHTML = '<strong>Build Mode</strong><div>fps (measured): ' + fps + '</div><div>quality tier: ' + tier.name + '</div><div>active WebGL scenes: ' + renderScenes + '</div><div>device cores: ' + (navigator.hardwareConcurrency || 'unknown') + '</div>';
      });
    } else if (stopFpsMeter) {
      stopFpsMeter();
      stopFpsMeter = null;
      if (fpsBadge) { fpsBadge.remove(); fpsBadge = null; }
    }
  }

  function renderAnnotations() {
    annotations.forEach(a => a.remove());
    annotations.length = 0;
    if (!buildModeOn) return;
    Object.values(scenes).forEach(s => {
      if (!s || !s.report) return;
      const r = s.report();
      const anchorId = { 'Hero World': 'hero', 'Project Constellation': 'constellation', 'Journey Scene': 'journey' }[r.name];
      const el = anchorId && document.getElementById(anchorId);
      if (!el) return;
      const badge = document.createElement('div');
      badge.className = 'build-annotation';
      const lines = Object.entries(r).filter(([k]) => k !== 'name').map(([k, v]) => k + ': ' + v);
      badge.innerHTML = '<strong>' + r.name + '</strong>' + lines.map(l => '<div>' + l + '</div>').join('');
      el.appendChild(badge);
      annotations.push(badge);
    });
  }

  function toggleImmersive() {
    if (!ambience) return;
    if (ambience.isRunning()) { ambience.stop(); immersiveToggle && immersiveToggle.setAttribute('aria-pressed', 'false'); }
    else { ambience.start(); immersiveToggle && immersiveToggle.setAttribute('aria-pressed', 'true'); }
    if (immersiveToggle) immersiveToggle.classList.toggle('on', ambience.isRunning());
  }

  if (buildToggle) buildToggle.onclick = toggleBuildMode;
  if (immersiveToggle) immersiveToggle.onclick = toggleImmersive;

  return { toggleBuildMode, toggleImmersive, goRabbitHole, isBuildModeOn: () => buildModeOn, renderAnnotations };
}
