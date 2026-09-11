// Ask About Brandon — knowledge base + matcher.
//
// This is intentionally NOT an LLM. It's a small local keyword/alias/category
// matcher with typo-tolerant fuzzy scoring, built entirely from the same
// projects.js / profile.js facts the rest of the site uses, so it can never
// say anything about Brandon that isn't already on the page.
//
// getAnswer(query) -> { text, linkTo, confidence, suggestions } is the whole
// public interface. A future LLM-backed implementation could replace the body
// of getAnswer() without any UI code changing.

import { PROJECTS } from './projects.js';
import { PROFILE } from './profile.js';

function buildEntries() {
  const entries = [];

  entries.push({
    id: 'who-is-brandon',
    category: 'profile',
    aliases: ['who is brandon', 'who is brandon brumbaugh', 'about brandon', 'tell me about brandon'],
    keywords: ['who', 'brandon', 'about', 'bio', 'profile'],
    answer: PROFILE.bio + ' Day job: ' + PROFILE.fields.find(f => f.label === 'Day job / craft').value + '. Company: ' + PROFILE.fields.find(f => f.label === 'Company').value + '.',
    linkTo: '#profile'
  });

  entries.push({
    id: 'what-building-now',
    category: 'now',
    aliases: ['what is brandon building', 'what is he working on now', 'what is brandon working on', 'current projects'],
    keywords: ['building', 'now', 'working', 'current', 'right now'],
    answer: PROFILE.rightNow.map(r => r.title + ' — ' + r.body).join(' '),
    linkTo: '#now'
  });

  entries.push({
    id: 'what-does-brandon-build',
    category: 'identity',
    aliases: ['what does brandon build', 'what does he do', 'what does brandon do'],
    keywords: ['build', 'builds', 'does', 'do', 'construction', 'software'],
    answer: 'Brandon builds things in both the physical and digital worlds — construction and project management through Iron Legion Contracting LLC, and software/AI experiments like Solen, AlphaQuote, Syntrax, and RealmRisers. Same instinct, different materials.',
    linkTo: '#workshop'
  });

  entries.push({
    id: 'construction-tech-crossover',
    category: 'identity',
    aliases: ['which projects combine construction and technology', 'construction and software', 'projects that combine both worlds'],
    keywords: ['combine', 'crossover', 'both', 'construction', 'technology', 'together'],
    answer: 'AlphaQuote is the clearest crossover — an estimating software concept born directly from years of bidding real construction jobs for Iron Legion Contracting LLC.',
    linkTo: '#constellation'
  });

  entries.push({
    id: 'why-long-way-around',
    category: 'media',
    aliases: ['why is it called the long way around', 'what does the long way around mean', 'meaning of the long way around'],
    keywords: ['why', 'name', 'meaning', 'long way around', 'title'],
    answer: 'The idea is in the name: sometimes you reach the point by taking the long way around. It works for the podcast format — conversation that wanders through life, humor, and ideas before finding the point — and for Brandon’s own path.',
    linkTo: '#media'
  });

  entries.push({
    id: 'beliefs',
    category: 'philosophy',
    aliases: ['what does brandon believe', 'brandon\'s principles', 'what does he believe'],
    keywords: ['believe', 'beliefs', 'principles', 'philosophy', 'values'],
    answer: PROFILE.beliefs.join(' '),
    linkTo: '#beliefs'
  });

  entries.push({
    id: 'speaking',
    category: 'philosophy',
    aliases: ['does brandon do speaking', 'is brandon a speaker', 'speaking and purpose'],
    keywords: ['speaking', 'speaker', 'purpose', 'motivational'],
    answer: PROFILE.emergingDirection,
    linkTo: '#beliefs'
  });

  entries.push({
    id: 'journey',
    category: 'story',
    aliases: ['what is brandon\'s story', 'brandon\'s journey', 'how did brandon get here'],
    keywords: ['story', 'journey', 'history', 'background', 'path'],
    answer: PROFILE.journey.map(j => j.title).join(' → ') + '. It’s not a straight line, and it’s still being written.',
    linkTo: '#journey'
  });

  entries.push({
    id: 'workshop',
    category: 'work',
    aliases: ['show me his work', 'what is the workshop', 'show me everything he\'s built'],
    keywords: ['work', 'workshop', 'portfolio', 'projects list'],
    answer: 'The Workshop is every project in one place, filterable by Physical, Digital, Media, and Experiments — with an honest status on each (Active, Building, Prototype, Experiment, Concept, Shipped). Not everything in there is finished.',
    linkTo: '#workshop'
  });

  // one entry per project, generated from projects.js so it can't drift
  PROJECTS.forEach(p => {
    entries.push({
      id: 'project-' + p.id,
      category: 'project',
      aliases: ['what is ' + p.name.toLowerCase(), p.name.toLowerCase()],
      keywords: [p.name.toLowerCase(), ...p.keywords],
      answer: p.name + ' (' + p.category + ', ' + p.statusLabel + '): ' + p.longDesc,
      linkTo: '#project=' + p.id,
      projectId: p.id
    });
  });

  return entries;
}

export const FAQ_ENTRIES = buildEntries();

export const SUGGESTED_QUESTIONS = [
  'What is Solen?',
  'What does Brandon build?',
  'What is Iron Legion Contracting LLC?',
  'Why is it called The Long Way Around?',
  'Which projects combine construction and technology?',
  'What is Brandon working on right now?'
];

const CATEGORIES = ['profile', 'now', 'identity', 'media', 'philosophy', 'story', 'work', 'project'];

const STOPWORDS = new Set(['what', 'is', 'are', 'the', 'a', 'an', 'of', 'to', 'in', 'on', 'it', 'does', 'do', 'why', 'how',
  'who', 'which', 'that', 'this', 'for', 'with', 'and', 'or', 'his', 'he', 'brandon', 'about', 'tell', 'me', 'today']);

function normalize(str) {
  return str.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

function significantTokens(str) {
  return normalize(str).split(' ').filter(t => t && !STOPWORDS.has(t));
}

// Optimal-string-alignment distance: Levenshtein plus adjacent-transposition
// as a single edit (so "iorn" -> "iron" costs 1, not 2) — this is what makes
// common typing typos actually match without over-loosening everything else.
function levenshtein(a, b) {
  const m = a.length, n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const d = [];
  for (let i = 0; i <= m; i++) { d[i] = [i]; }
  for (let j = 0; j <= n; j++) { d[0][j] = j; }
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(
        d[i - 1][j] + 1,
        d[i][j - 1] + 1,
        d[i - 1][j - 1] + cost
      );
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + cost);
      }
    }
  }
  return d[m][n];
}

function fuzzyTokenScore(qToken, entryTokens) {
  let best = 0;
  entryTokens.forEach(t => {
    if (t === qToken) { best = Math.max(best, 1); return; }
    if (qToken.length > 3 && (t.includes(qToken) || qToken.includes(t))) { best = Math.max(best, 0.75); return; }
    const dist = levenshtein(qToken, t);
    const maxLen = Math.max(qToken.length, t.length);
    if (maxLen > 3) {
      const sim = 1 - dist / maxLen;
      if (sim > 0.55) best = Math.max(best, sim * 0.8);
    }
  });
  return best;
}

export function getAnswer(query) {
  const q = normalize(query || '');
  if (!q) {
    return { text: 'Ask me something about Brandon, his projects, or his story.', linkTo: null, confidence: 0, suggestions: SUGGESTED_QUESTIONS };
  }
  const qTokens = significantTokens(query);
  if (qTokens.length === 0) {
    return { text: 'I don’t have a confident answer for that one. Here’s what I can tell you about instead:', linkTo: null, confidence: 0, suggestions: SUGGESTED_QUESTIONS };
  }

  let bestEntry = null, bestScore = 0;
  FAQ_ENTRIES.forEach(entry => {
    const haystack = [...entry.aliases.map(normalize), ...entry.keywords.map(normalize)];
    const entryTokens = Array.from(new Set(significantTokens(haystack.join(' '))));
    if (entryTokens.length === 0) return;

    // exact/substring alias match is the strongest signal (compared on the
    // full normalized phrase, so stopwords still count toward phrase shape)
    let score = 0;
    entry.aliases.forEach(alias => {
      const a = normalize(alias);
      if (q === a) score = Math.max(score, 1);
      else if (a.length > 6 && (q.includes(a) || a.includes(q))) score = Math.max(score, 0.9);
    });

    // keyword/fuzzy overlap, scored only on meaningful (non-stopword) tokens
    // so generic words like "what"/"is"/"the" can't drag in an unrelated
    // entry — this is what "if unsure, say so" actually depends on.
    let tokenScore = 0, matchedTokens = 0;
    qTokens.forEach(qt => {
      const s = fuzzyTokenScore(qt, entryTokens);
      if (s > 0.5) matchedTokens++;
      tokenScore += s;
    });
    tokenScore = tokenScore / qTokens.length;
    // require actual overlap, not just an average nudged up by one weak hit
    if (matchedTokens === 0) tokenScore *= 0.3;
    score = Math.max(score, tokenScore);

    if (score > bestScore) { bestScore = score; bestEntry = entry; }
  });

  if (bestEntry && bestScore >= 0.45) {
    return { text: bestEntry.answer, linkTo: bestEntry.linkTo, confidence: bestScore, suggestions: null };
  }

  return {
    text: 'I don’t have a confident answer for that one. Here’s what I can tell you about instead:',
    linkTo: null,
    confidence: bestScore,
    suggestions: SUGGESTED_QUESTIONS
  };
}
