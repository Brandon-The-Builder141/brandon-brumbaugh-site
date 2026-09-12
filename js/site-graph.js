// A network graph connecting each job-site photo to the property it belongs
// to: a central "Iron Legion Contracting LLC" hub, one node per site, and
// each site's photos fanned out around it. Plain SVG (for the connecting
// lines) + absolutely-positioned HTML nodes on top — no WebGL context, so it
// works identically on desktop and mobile and costs nothing when offscreen.

export function initSiteGraph(container, sites, openLightbox) {
  container.classList.add('site-graph');
  container.innerHTML = `
    <svg class="sg-lines" aria-hidden="true"></svg>
    <div class="sg-nodes"></div>
  `;
  const svg = container.querySelector('.sg-lines');
  const nodesEl = container.querySelector('.sg-nodes');

  const HUB = { id: 'hub' };
  let activeSite = null;

  function layout() {
    const w = Math.max(container.clientWidth, 600);
    const h = Math.max(container.clientHeight, 600);
    const cx = w / 2, cy = h / 2;
    const R1 = Math.min(w, h) * 0.26;

    const nodes = [{ ...HUB, x: cx, y: cy, type: 'hub', label: 'Iron Legion Contracting LLC' }];
    const lines = [];

    sites.forEach((site, i) => {
      const angle = (i / sites.length) * Math.PI * 2 - Math.PI / 2;
      const sx = cx + Math.cos(angle) * R1;
      const sy = cy + Math.sin(angle) * R1;
      nodes.push({ id: site.id, x: sx, y: sy, type: 'site', label: site.name, count: site.photos.length, angle, site });
      lines.push({ from: [cx, cy], to: [sx, sy], kind: 'hub' });

      const isOpen = activeSite === site.id;
      if (isOpen) {
        const R2 = 64 + Math.min(site.photos.length, 12) * 6;
        const spread = Math.min(Math.PI * 1.7, 0.6 + site.photos.length * 0.14);
        site.photos.forEach((src, j) => {
          const t = site.photos.length <= 1 ? 0 : (j / (site.photos.length - 1) - 0.5);
          const pAngle = angle + t * spread;
          const px = sx + Math.cos(pAngle) * R2;
          const py = sy + Math.sin(pAngle) * R2;
          nodes.push({ id: site.id + '-p' + j, x: px, y: py, type: 'photo', src, site: site.id, idx: j });
          lines.push({ from: [sx, sy], to: [px, py], kind: 'photo' });
        });
      }
    });

    return { nodes, lines, w, h };
  }

  function render() {
    const { nodes, lines, w, h } = layout();
    svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
    svg.style.width = w + 'px';
    svg.style.height = h + 'px';
    nodesEl.style.width = w + 'px';
    nodesEl.style.height = h + 'px';

    svg.innerHTML = lines.map(l => `
      <line x1="${l.from[0]}" y1="${l.from[1]}" x2="${l.to[0]}" y2="${l.to[1]}" class="sg-line sg-line-${l.kind}"></line>
    `).join('');

    nodesEl.innerHTML = nodes.map(n => {
      if (n.type === 'hub') {
        return `<div class="sg-node sg-hub" style="left:${n.x}px;top:${n.y}px;">
          <span>BB</span>
        </div>`;
      }
      if (n.type === 'site') {
        const open = activeSite === n.id;
        return `<button type="button" class="sg-node sg-site${open ? ' open' : ''}" style="left:${n.x}px;top:${n.y}px;" data-site="${n.id}" aria-expanded="${open}">
          <span class="sg-site-label">${n.label}</span>
          <span class="sg-site-count">${n.count} photo${n.count === 1 ? '' : 's'}</span>
        </button>`;
      }
      return `<button type="button" class="sg-node sg-photo" style="left:${n.x}px;top:${n.y}px;" data-site="${n.site}" data-idx="${n.idx}" aria-label="Open photo ${n.idx + 1}">
        <img src="${n.src}" alt="" loading="lazy" decoding="async">
      </button>`;
    }).join('');

    nodesEl.querySelectorAll('.sg-site').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.site;
        activeSite = activeSite === id ? null : id;
        render();
      });
    });
    nodesEl.querySelectorAll('.sg-photo').forEach(btn => {
      btn.addEventListener('click', () => {
        const site = sites.find(s => s.id === btn.dataset.site);
        if (site) openLightbox(site.photos, Number(btn.dataset.idx));
      });
    });
  }

  render();
  const ro = new ResizeObserver(() => render());
  ro.observe(container);

  return {
    dispose() { ro.disconnect(); }
  };
}
