import { getAnswer, SUGGESTED_QUESTIONS } from './data/faq.js';

// Ask About Brandon UI. Explicitly labeled as a local matcher, not an LLM.
// Talks to the rest of the app only through getAnswer() — a future
// LLM-backed implementation can replace data/faq.js's internals without any
// change here.

export function initAskBrandon() {
  const panel = document.createElement('div');
  panel.id = 'ask-brandon';
  panel.setAttribute('aria-hidden', 'true');
  panel.innerHTML = `
    <div class="ask-brandon-card" role="dialog" aria-label="Ask About Brandon">
      <div class="ask-brandon-head">
        <div>
          <div class="ask-brandon-title">Ask About Brandon</div>
          <div class="ask-brandon-sub">Powered by this site — a local matcher over Brandon's own content, not an LLM.</div>
        </div>
        <button class="ask-brandon-close" aria-label="Close">✕</button>
      </div>
      <div class="ask-brandon-log" id="ask-brandon-log"></div>
      <div class="ask-brandon-suggestions" id="ask-brandon-suggestions"></div>
      <form class="ask-brandon-form" id="ask-brandon-form">
        <input type="text" id="ask-brandon-input" placeholder="Ask something, e.g. “What is Solen?”" autocomplete="off">
        <button type="submit" class="btn btn-primary" style="padding:.6rem 1rem;">Ask</button>
      </form>
    </div>
  `;
  document.body.appendChild(panel);

  const log = panel.querySelector('#ask-brandon-log');
  const suggestionsEl = panel.querySelector('#ask-brandon-suggestions');
  const form = panel.querySelector('#ask-brandon-form');
  const input = panel.querySelector('#ask-brandon-input');
  const closeBtn = panel.querySelector('.ask-brandon-close');

  function open() {
    panel.classList.add('open');
    panel.setAttribute('aria-hidden', 'false');
    if (!log.children.length) {
      addMessage('assistant', 'Ask me anything about Brandon’s projects, story, or beliefs — answered from what’s actually on this site.');
      renderSuggestions(SUGGESTED_QUESTIONS);
    }
    input.focus();
  }
  function close() {
    panel.classList.remove('open');
    panel.setAttribute('aria-hidden', 'true');
  }
  closeBtn.onclick = close;
  panel.addEventListener('click', e => { if (e.target === panel) close(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && panel.classList.contains('open')) close(); });

  function addMessage(role, text, linkTo) {
    const row = document.createElement('div');
    row.className = 'ask-msg ' + role;
    row.textContent = text;
    if (linkTo) {
      const a = document.createElement('a');
      a.href = linkTo;
      a.className = 'ask-msg-link';
      a.textContent = 'Go there →';
      a.onclick = () => setTimeout(close, 150);
      row.appendChild(a);
    }
    log.appendChild(row);
    log.scrollTop = log.scrollHeight;
  }

  function renderSuggestions(list) {
    suggestionsEl.innerHTML = '';
    list.forEach(q => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'ask-chip';
      b.textContent = q;
      b.onclick = () => ask(q);
      suggestionsEl.appendChild(b);
    });
  }

  function ask(query) {
    addMessage('user', query);
    const res = getAnswer(query);
    addMessage('assistant', res.text, res.linkTo);
    renderSuggestions(res.suggestions || SUGGESTED_QUESTIONS.filter(s => s.toLowerCase() !== query.toLowerCase()));
  }

  form.addEventListener('submit', e => {
    e.preventDefault();
    const q = input.value.trim();
    if (!q) return;
    ask(q);
    input.value = '';
  });

  return { open, close };
}
