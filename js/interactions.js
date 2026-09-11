import { PROJECTS, projectsByTag } from './data/projects.js';

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

export function renderProjectGrid() {
  const grid = document.querySelector('.project-grid');
  if (!grid) return;
  grid.innerHTML = PROJECTS.map(p => `
    <div class="pcard">
      <span class="status-pill ${p.status}" style="margin-bottom:.5rem;display:inline-block;">${p.statusLabel}</span>
      <h4>${p.name}</h4>
      <div class="cat">${p.category}</div>
      <p>${p.shortDesc}</p>
    </div>
  `).join('');
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
    };
  });
}

export function initContactForm() {
  const form = document.querySelector('#connect form');
  if (!form) return;
  form.addEventListener('submit', e => {
    e.preventDefault();
    const btn = form.querySelector('.btn-primary');
    btn.textContent = 'Sent — talk soon';
  });
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
