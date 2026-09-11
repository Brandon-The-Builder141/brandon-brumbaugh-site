const SECTIONS = ['hero', 'profile', 'now', 'constellation', 'journey', 'workshop', 'media', 'clock', 'beliefs', 'connect'];

export function initReveal() {
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { threshold: 0.12 });
  document.querySelectorAll('.reveal').forEach(el => io.observe(el));
}

export function initScrollSpy(onSectionChange) {
  const links = document.querySelectorAll('.nav-links a, .mobile-nav a');
  const map = new Map();
  links.forEach(a => {
    const id = a.getAttribute('href').replace('#', '');
    if (!map.has(id)) map.set(id, []);
    map.get(id).push(a);
  });
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        links.forEach(a => a.classList.remove('active'));
        (map.get(e.target.id) || []).forEach(a => a.classList.add('active'));
        if (onSectionChange) onSectionChange(e.target.id);
      }
    });
  }, { threshold: 0.5 });
  SECTIONS.forEach(id => {
    const el = document.getElementById(id);
    if (el) io.observe(el);
  });
}

export function initMobileNav() {
  if (document.querySelector('.mobile-nav')) return;
  const nav = document.createElement('nav');
  nav.className = 'mobile-nav';
  nav.innerHTML = `
    <a href="#hero" aria-label="Home">🏠</a>
    <a href="#constellation" aria-label="Projects">✦</a>
    <a href="#workshop" aria-label="Workshop">🛠</a>
    <a href="#media" aria-label="Media">🎙</a>
    <a href="#connect" aria-label="Connect">✉</a>
  `;
  document.body.appendChild(nav);
}
