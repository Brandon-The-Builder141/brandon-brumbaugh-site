// A network graph connecting each job-site photo to the property it belongs
// to: a central "Iron Legion Contracting LLC" hub, one node per site, and
// each site's photos fanned out around it. Plain SVG (for the connecting
// lines) + absolutely-positioned HTML nodes on top — no WebGL context, so it
// works identically on desktop and mobile and costs nothing when offscreen.
//
// Edit Mode: drag a site bubble anywhere to arrange the graph, or drag a
// photo onto a different site to correct which property it belongs to.
// Changes save to this browser's localStorage as you go (survives reloads),
// and "Export Arrangement" produces the JSON to hand back so the real
// grouping in data/job-sites.js can be updated permanently.

const STORAGE_KEY = 'iron-legion-graph-edits-v1';

function loadEdits() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : { sitePositions: {}, photoOverrides: {} };
  } catch (e) {
    return { sitePositions: {}, photoOverrides: {} };
  }
}
function saveEdits(edits) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(edits)); } catch (e) { /* storage unavailable — edits still work this session */ }
}

export function initSiteGraph(container, baseSites, openLightbox) {
  container.classList.add('site-graph-wrap');
  container.innerHTML = `
    <div class="sg-toolbar">
      <button type="button" class="sg-tool-btn" id="sg-edit-toggle" aria-pressed="false">✎ Edit Layout</button>
      <button type="button" class="sg-tool-btn" id="sg-export-btn" hidden>⇩ Export Arrangement</button>
      <button type="button" class="sg-tool-btn" id="sg-reset-btn" hidden>↺ Reset</button>
      <span class="sg-edit-hint" id="sg-edit-hint" hidden>Drag a site bubble to rearrange. Drag a photo onto a different site to move it there.</span>
    </div>
    <div class="site-graph">
      <svg class="sg-lines" aria-hidden="true"></svg>
      <div class="sg-nodes"></div>
    </div>
    <div class="sg-export-panel" id="sg-export-panel" hidden>
      <p>Copy this and send it back when you're done — it's the exact arrangement to lock in.</p>
      <textarea id="sg-export-text" readonly rows="10"></textarea>
      <div class="sg-export-actions">
        <button type="button" class="btn btn-ghost" id="sg-copy-btn">Copy to clipboard</button>
        <span id="sg-copy-status"></span>
      </div>
    </div>
  `;
  const graphEl = container.querySelector('.site-graph');
  const svg = container.querySelector('.sg-lines');
  const nodesEl = container.querySelector('.sg-nodes');
  const editToggle = container.querySelector('#sg-edit-toggle');
  const exportBtn = container.querySelector('#sg-export-btn');
  const resetBtn = container.querySelector('#sg-reset-btn');
  const editHint = container.querySelector('#sg-edit-hint');
  const exportPanel = container.querySelector('#sg-export-panel');
  const exportText = container.querySelector('#sg-export-text');
  const copyBtn = container.querySelector('#sg-copy-btn');
  const copyStatus = container.querySelector('#sg-copy-status');

  let editMode = false;
  let activeSite = null;
  let edits = loadEdits();

  function effectiveSites() {
    // Deep-clone base sites' photo lists, then apply saved photo
    // reassignments on top — never mutates the imported data module.
    const map = new Map(baseSites.map(s => [s.id, { ...s, photos: [...s.photos] }]));
    Object.entries(edits.photoOverrides).forEach(([src, targetSiteId]) => {
      if (!map.has(targetSiteId)) return;
      map.forEach(s => { s.photos = s.photos.filter(p => p !== src); });
      if (!map.get(targetSiteId).photos.includes(src)) map.get(targetSiteId).photos.push(src);
    });
    return baseSites.map(s => map.get(s.id));
  }

  function layout() {
    const sites = effectiveSites();
    const w = Math.max(container.clientWidth, 600);
    const h = Math.max(graphEl.clientHeight, 600);
    const cx = w / 2, cy = h / 2;
    const R1 = Math.min(w, h) * 0.26;

    const nodes = [{ id: 'hub', x: cx, y: cy, type: 'hub', label: 'Iron Legion Contracting LLC' }];
    const lines = [];

    sites.forEach((site, i) => {
      const angle = (i / sites.length) * Math.PI * 2 - Math.PI / 2;
      const saved = edits.sitePositions[site.id];
      const sx = saved ? saved.xPct * w : cx + Math.cos(angle) * R1;
      const sy = saved ? saved.yPct * h : cy + Math.sin(angle) * R1;
      nodes.push({ id: site.id, x: sx, y: sy, type: 'site', label: site.name, count: site.photos.length, angle, site });
      lines.push({ from: [cx, cy], to: [sx, sy], kind: 'hub', id: 'line-hub-' + site.id });

      if (activeSite === site.id) {
        const R2 = 64 + Math.min(site.photos.length, 12) * 6;
        const spread = Math.min(Math.PI * 1.7, 0.6 + site.photos.length * 0.14);
        site.photos.forEach((src, j) => {
          const t = site.photos.length <= 1 ? 0 : (j / (site.photos.length - 1) - 0.5);
          const pAngle = angle + t * spread;
          const px = sx + Math.cos(pAngle) * R2;
          const py = sy + Math.sin(pAngle) * R2;
          nodes.push({ id: site.id + '-p' + j, x: px, y: py, type: 'photo', src, site: site.id, idx: j });
          lines.push({ from: [sx, sy], to: [px, py], kind: 'photo', id: 'line-photo-' + site.id + '-' + j });
        });
      }
    });

    return { sites, nodes, lines, w, h };
  }

  function render() {
    const { sites, nodes, lines, w, h } = layout();
    svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
    svg.style.width = w + 'px';
    svg.style.height = h + 'px';
    nodesEl.style.width = w + 'px';
    nodesEl.style.height = h + 'px';

    svg.innerHTML = lines.map(l => `
      <line id="${l.id}" x1="${l.from[0]}" y1="${l.from[1]}" x2="${l.to[0]}" y2="${l.to[1]}" class="sg-line sg-line-${l.kind}"></line>
    `).join('');

    nodesEl.innerHTML = nodes.map(n => {
      if (n.type === 'hub') {
        return `<div class="sg-node sg-hub" style="left:${n.x}px;top:${n.y}px;"><span>BB</span></div>`;
      }
      if (n.type === 'site') {
        const open = activeSite === n.id;
        return `<button type="button" class="sg-node sg-site${open ? ' open' : ''}${editMode ? ' editable' : ''}" style="left:${n.x}px;top:${n.y}px;" data-site="${n.id}" aria-expanded="${open}">
          <span class="sg-site-label">${n.label}</span>
          <span class="sg-site-count">${n.count} photo${n.count === 1 ? '' : 's'}</span>
        </button>`;
      }
      return `<button type="button" class="sg-node sg-photo${editMode ? ' editable' : ''}" style="left:${n.x}px;top:${n.y}px;" data-site="${n.site}" data-idx="${n.idx}" aria-label="Photo ${n.idx + 1} — ${editMode ? 'drag to move to another site' : 'open full size'}">
        <img src="${n.src}" alt="" loading="lazy" decoding="async">
      </button>`;
    }).join('');

    nodesEl.querySelectorAll('.sg-site').forEach(btn => {
      btn.addEventListener('click', e => {
        if (btn.dataset.dragged) { delete btn.dataset.dragged; return; }
        const id = btn.dataset.site;
        activeSite = activeSite === id ? null : id;
        render();
      });
      if (editMode) makeSiteDraggable(btn);
    });
    nodesEl.querySelectorAll('.sg-photo').forEach(btn => {
      btn.addEventListener('click', () => {
        if (btn.dataset.dragged) { delete btn.dataset.dragged; return; }
        const site = sites.find(s => s.id === btn.dataset.site);
        if (site) openLightbox(site.photos, Number(btn.dataset.idx));
      });
      if (editMode) makePhotoDraggable(btn);
    });
  }

  function clientToLocal(clientX, clientY) {
    const rect = nodesEl.getBoundingClientRect();
    return { x: clientX - rect.left, y: clientY - rect.top };
  }

  function makeSiteDraggable(btn) {
    btn.addEventListener('pointerdown', e => {
      e.preventDefault();
      btn.setPointerCapture(e.pointerId);
      let moved = false;
      const onMove = ev => {
        moved = true;
        btn.dataset.dragged = '1';
        const { x, y } = clientToLocal(ev.clientX, ev.clientY);
        btn.style.left = x + 'px';
        btn.style.top = y + 'px';
        // live-update the hub line and any open photo fan lines for this site
        const hubLine = svg.querySelector('#line-hub-' + btn.dataset.site);
        if (hubLine) { hubLine.setAttribute('x2', x); hubLine.setAttribute('y2', y); }
        nodesEl.querySelectorAll('.sg-photo[data-site="' + btn.dataset.site + '"]').forEach(p => {
          const line = svg.querySelector('#line-photo-' + btn.dataset.site + '-' + p.dataset.idx);
          if (line) { line.setAttribute('x1', x); line.setAttribute('y1', y); }
        });
      };
      const onUp = ev => {
        btn.removeEventListener('pointermove', onMove);
        btn.removeEventListener('pointerup', onUp);
        if (moved) {
          const w = nodesEl.clientWidth, h = nodesEl.clientHeight;
          const { x, y } = clientToLocal(ev.clientX, ev.clientY);
          edits.sitePositions[btn.dataset.site] = { xPct: x / w, yPct: y / h };
          saveEdits(edits);
          render();
        }
      };
      btn.addEventListener('pointermove', onMove);
      btn.addEventListener('pointerup', onUp);
    });
  }

  function makePhotoDraggable(btn) {
    btn.addEventListener('pointerdown', e => {
      e.preventDefault();
      btn.setPointerCapture(e.pointerId);
      let moved = false;
      btn.classList.add('dragging');
      const onMove = ev => {
        moved = true;
        btn.dataset.dragged = '1';
        const { x, y } = clientToLocal(ev.clientX, ev.clientY);
        btn.style.left = x + 'px';
        btn.style.top = y + 'px';
        btn.style.zIndex = '5';
        nodesEl.querySelectorAll('.sg-site').forEach(s => {
          s.classList.toggle('drop-target', isOver(s, ev.clientX, ev.clientY));
        });
      };
      const onUp = ev => {
        btn.removeEventListener('pointermove', onMove);
        btn.removeEventListener('pointerup', onUp);
        btn.classList.remove('dragging');
        btn.style.zIndex = '';
        let dropped = false;
        if (moved) {
          nodesEl.querySelectorAll('.sg-site').forEach(s => {
            s.classList.remove('drop-target');
            if (!dropped && isOver(s, ev.clientX, ev.clientY)) {
              const targetId = s.dataset.site;
              if (targetId !== btn.dataset.site) {
                edits.photoOverrides[decodeURIComponent(btn.dataset.src)] = targetId;
                saveEdits(edits);
                activeSite = targetId;
                dropped = true;
              }
            }
          });
        }
        render();
      };
      btn.addEventListener('pointermove', onMove);
      btn.addEventListener('pointerup', onUp);
    });
  }
  function isOver(el, clientX, clientY) {
    const r = el.getBoundingClientRect();
    return clientX >= r.left && clientX <= r.right && clientY >= r.top && clientY <= r.bottom;
  }

  function buildExportJson() {
    const sites = effectiveSites();
    const positions = {};
    Object.entries(edits.sitePositions).forEach(([id, p]) => { positions[id] = p; });
    return JSON.stringify({
      sites: sites.map(s => ({ id: s.id, name: s.name, photos: s.photos.map(p => p.split('/').pop()) })),
      sitePositions: positions
    }, null, 2);
  }

  editToggle.addEventListener('click', () => {
    editMode = !editMode;
    editToggle.classList.toggle('on', editMode);
    editToggle.setAttribute('aria-pressed', String(editMode));
    exportBtn.hidden = !editMode;
    resetBtn.hidden = !editMode;
    editHint.hidden = !editMode;
    render();
  });

  exportBtn.addEventListener('click', () => {
    exportPanel.hidden = !exportPanel.hidden;
    if (!exportPanel.hidden) exportText.value = buildExportJson();
  });

  copyBtn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(exportText.value);
      copyStatus.textContent = 'Copied!';
    } catch (e) {
      exportText.select();
      copyStatus.textContent = 'Select-all did work — copy with Ctrl/Cmd+C.';
    }
    setTimeout(() => { copyStatus.textContent = ''; }, 3000);
  });

  resetBtn.addEventListener('click', () => {
    if (!confirm('Reset all your drag edits back to the original arrangement?')) return;
    edits = { sitePositions: {}, photoOverrides: {} };
    saveEdits(edits);
    render();
  });

  // give each photo button its src via a data attribute at render time too
  const _render = render;
  render = function patchedRender() {
    _render();
    nodesEl.querySelectorAll('.sg-photo').forEach(btn => {
      const img = btn.querySelector('img');
      if (img) btn.dataset.src = encodeURIComponent(img.getAttribute('src'));
    });
  };

  render();
  const ro = new ResizeObserver(() => render());
  ro.observe(graphEl);

  return {
    dispose() { ro.disconnect(); }
  };
}
