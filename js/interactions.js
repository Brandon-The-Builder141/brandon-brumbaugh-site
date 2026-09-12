import { PROJECTS } from './data/projects.js';
import { PROFILE } from './data/profile.js';

export function renderWorkshopCards() {
  const grid = document.getElementById('workshop-grid');
  if (!grid) return;
  grid.innerHTML = PROJECTS.map(p => `
    <div class="lab-card" data-cat="${p.tags.join(' ')}">
      <span class="lab-status ${statusClass(p.status)}">${p.statusLabel}</span>
      <h4>${p.name}</h4>
      <p>${p.longDesc}</p>
    </div>
  `).join('') + `
    <div class="lab-card" data-cat="digital">
      <span class="lab-status shipped">Shipped</span>
      <h4>This Website</h4>
      <p>The living record you're standing in right now — built to be updated as everything else changes.</p>
    </div>
  `;
}

function statusClass(status) {
  if (status === 'active' || status === 'building') return 'active';
  if (status === 'prototype' || status === 'experiment') return 'experiment';
  return status; // concept / shipped / archived map 1:1
}

// Project cards double as the keyboard/touch-accessible equivalent to the
// canvas constellation: real <button> elements, always in the DOM, styled as
// a compact pill row on desktop and a swipeable carousel on mobile (see
// responsive.css). `onSelect` opens the same project overlay a canvas click
// would.
export function renderProjectGrid(onSelect) {
  const grid = document.querySelector('.project-grid');
  if (!grid) return;
  grid.innerHTML = PROJECTS.map(p => `
    <button type="button" class="pcard" data-project="${p.id}" aria-label="Open ${p.name} — ${p.category}, ${p.statusLabel}">
      <span class="status-pill ${p.status}" style="margin-bottom:.5rem;display:inline-block;">${p.statusLabel}</span>
      <h4>${p.name}</h4>
      <div class="cat">${p.category}</div>
      <p>${p.shortDesc}</p>
    </button>
  `).join('');
  if (onSelect) {
    grid.querySelectorAll('.pcard').forEach(btn => {
      btn.addEventListener('click', () => onSelect(btn.dataset.project));
    });
  }
}

export function renderProfile() {
  const fieldsEl = document.getElementById('profile-fields');
  if (fieldsEl) {
    fieldsEl.innerHTML = PROFILE.fields.map(f => `
      <div class="field${f.accent ? ' accent' : ''}"><label>${f.label}</label><div${f.mono ? ' style="font-family:var(--font-mono);font-size:.85rem;"' : ''}>${f.value}</div></div>
    `).join('');
  }
  const bioEl = document.getElementById('profile-bio');
  if (bioEl) bioEl.textContent = PROFILE.bio;
  const tagsEl = document.getElementById('profile-tags');
  if (tagsEl) tagsEl.innerHTML = PROFILE.tags.map(t => `<span class="tag">${t}</span>`).join('');
}

export function renderRightNow(onSelect) {
  const grid = document.getElementById('now-grid');
  if (!grid) return;
  grid.innerHTML = PROFILE.rightNow.map(c => `
    <button type="button" class="now-card ${c.cls}" data-project="${c.projectId || ''}">
      <div class="glow"></div>
      <div class="now-kicker">${c.kicker}</div>
      <h3>${c.title}</h3>
      <p>${c.body}</p>
    </button>
  `).join('');
  if (onSelect) {
    grid.querySelectorAll('.now-card[data-project]').forEach(btn => {
      const id = btn.dataset.project;
      if (!id) return;
      btn.addEventListener('click', () => onSelect(id));
    });
  }
}

export function renderJourney() {
  const path = document.getElementById('journey-milestones');
  if (!path) return;
  path.innerHTML = PROFILE.journey.map(m => `
    <div class="milestone reveal">
      <div class="year">${m.year}</div>
      <h3>${m.title}</h3>
      <p>${m.body}</p>
      <div class="lesson">${m.lesson}</div>
    </div>
  `).join('');
}

export function renderBeliefs() {
  const list = document.getElementById('belief-list');
  if (list) {
    list.innerHTML = PROFILE.beliefs.map((b, i) => `
      <div class="belief"><span class="num">${String(i + 1).padStart(2, '0')}</span><p>${b}</p></div>
    `).join('');
  }
  const emerging = document.getElementById('emerging-direction');
  if (emerging) emerging.textContent = PROFILE.emergingDirection;
}

// A cheap, real safety net for Priority 3: after everything renders, scan the
// live DOM for known-wrong variants of protected facts (the company name has
// been mis-typed before) instead of just commenting that copies should agree.
export function validateCanonicalFacts() {
  const text = document.body.innerText;
  const forbidden = [
    { bad: /Iron Nation Contracting/i, correct: 'Iron Legion Contracting LLC' },
    { bad: /Iron National Contracting/i, correct: 'Iron Legion Contracting LLC' }
  ];
  forbidden.forEach(({ bad, correct }) => {
    if (bad.test(text)) {
      console.error('[content-sync] Found a wrong company name variant on the page. Expected only "' + correct + '" to appear. Check for hardcoded copies that have drifted from data/projects.js.');
    }
  });
  const companyOccurrences = (text.match(/Iron Legion Contracting LLC/g) || []).length;
  if (companyOccurrences === 0) {
    console.error('[content-sync] "Iron Legion Contracting LLC" does not appear anywhere on the page — check that data/profile.js and data/projects.js rendered correctly.');
  }
}

export function initWorkshopFilters() {
  document.querySelectorAll('.wfilter').forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll('.wfilter').forEach(b => b.classList.remove('sel'));
      btn.classList.add('sel');
      const f = btn.dataset.filter;
      document.querySelectorAll('.lab-card').forEach(card => {
        const cats = (card.dataset.cat || '').split(' ');
        card.hidden = f !== 'all' && !cats.includes(f);
      });
    };
  });
}

export function initReasonChips() {
  document.querySelectorAll('.reason').forEach(r => {
    r.onclick = () => {
      document.querySelectorAll('.reason').forEach(x => x.classList.remove('sel'));
      r.classList.add('sel');
      const hidden = document.getElementById('contact-reason');
      if (hidden) hidden.value = r.textContent.trim();
    };
  });
}

function buildMailto(name, email, reason, message) {
  const to = PROFILE.contactEmail;
  const subject = encodeURIComponent('[Site inquiry — ' + reason + '] ' + name);
  const body = encodeURIComponent(
    'Name: ' + name + '\n' +
    'Email: ' + email + '\n' +
    'Reason: ' + reason + '\n\n' +
    message
  );
  return 'mailto:' + to + '?subject=' + subject + '&body=' + body;
}

// There is no backend and no budget for a hosted form API for v1, so this is
// an honest mailto fallback, not a fake "message sent" state: submitting
// opens the visitor's own email client with everything pre-filled, and only
// claims success once that actually happens. A honeypot field catches simple
// bots without adding a CAPTCHA.
export function initContactForm() {
  const form = document.querySelector('#connect form');
  if (!form) return;
  const status = document.getElementById('contact-status');
  const btn = form.querySelector('.btn-primary');
  const btnLabel = btn.textContent;

  function setStatus(text, kind) {
    if (!status) return;
    status.textContent = text;
    status.className = 'contact-status' + (kind ? ' ' + kind : '');
  }

  form.addEventListener('submit', e => {
    e.preventDefault();

    const honeypot = form.querySelector('input[name="company"]');
    if (honeypot && honeypot.value) return; // silently drop likely-bot submissions

    const name = form.querySelector('input[type="text"]:not([name="company"])').value.trim();
    const email = form.querySelector('input[type="email"]').value.trim();
    const message = form.querySelector('textarea').value.trim();
    const reasonEl = document.querySelector('.reason.sel');
    const reason = reasonEl ? reasonEl.textContent.trim() : 'General';

    if (!name || !email || !message) {
      setStatus('Fill in your name, email, and message first.', 'error');
      return;
    }

    btn.disabled = true;
    btn.textContent = 'Opening your email client…';
    setStatus('Opening your email client — nothing has been sent yet.', 'pending');

    const mailto = buildMailto(name, email, reason, message);
    try {
      window.location.href = mailto;
      setTimeout(() => {
        btn.disabled = false;
        btn.textContent = btnLabel;
        setStatus('Your email client should now have a pre-filled message — hit send there to actually reach Brandon.', 'success');
      }, 600);
    } catch (err) {
      btn.disabled = false;
      btn.textContent = btnLabel;
      setStatus('Couldn’t open an email client automatically. Email Brandon directly at ' + PROFILE.contactEmail + '.', 'error');
    }
  });
}

// The Long Way Around logo animation: autoplays muted/looped as a purely
// decorative visual (never with sound on its own), pauses when scrolled
// offscreen, and offers a real unmute control. Under prefers-reduced-motion
// it never self-starts — it sits on its poster frame until the visitor
// deliberately presses play, at which point it's their choice to have it
// loop and to have sound.
export function initMediaVideo(reduced) {
  const video = document.getElementById('media-logo-video');
  const toggle = document.getElementById('media-sound-toggle');
  if (!video || !toggle) return;

  // Relying on the HTML `muted` attribute alone isn't reliable enough —
  // some browsers only honor the `muted` *property* set via script,
  // especially for a video that gets (re)played programmatically. Force it
  // explicitly rather than trusting the markup.
  video.muted = true;
  video.defaultMuted = true;

  function setToggleLabel() {
    if (reduced && video.paused) {
      toggle.textContent = '▶';
      toggle.setAttribute('aria-label', 'Play animation');
    } else {
      toggle.textContent = video.muted ? '🔇' : '🔊';
      toggle.setAttribute('aria-label', video.muted ? 'Turn sound on' : 'Turn sound off');
    }
    toggle.setAttribute('aria-pressed', String(!video.muted));
  }

  if (!reduced) {
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) video.play().catch(() => {});
        else video.pause();
      });
    }, { threshold: 0.2 });
    io.observe(video);
  }

  toggle.addEventListener('click', () => {
    if (reduced && video.paused) {
      video.muted = false;
      video.play().catch(() => {});
    } else {
      video.muted = !video.muted;
    }
    setToggleLabel();
  });

  setToggleLabel();
}

export function initHeroCycle(words, reduced) {
  const el = document.getElementById('hero-cycle');
  if (!el) return;
  let i = 0;
  el.textContent = words[0];
  el.style.transition = 'opacity .35s ease';
  if (reduced) return;
  setInterval(() => {
    i = (i + 1) % words.length;
    el.style.opacity = 0;
    setTimeout(() => { el.textContent = words[i]; el.style.opacity = 1; }, 350);
  }, 2200);
}
