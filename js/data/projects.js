// Canonical source of truth for every project shown in the Constellation, the
// Workshop, project HUDs, Ask About Brandon, and the Rabbit Hole button.
// Nothing about Brandon's real work should be typed twice — it should be read
// from here.

export const PROJECTS = [
  {
    id: 'solen',
    name: 'Solen',
    category: 'AI Companion',
    tags: ['digital'],
    status: 'active',
    statusLabel: 'Active / Building',
    shortDesc: 'Conversation, personality, persistent memory, and planning — built to reduce mental load, not add to it.',
    longDesc: 'An AI companion, not another chatbot — built around conversation, personality, persistent memory, planning, and reducing mental load.',
    color: 0x6db8ff,
    shape: 'organic',
    anchor: '#constellation',
    keywords: ['solen', 'ai', 'companion', 'assistant', 'memory', 'chatbot', 'artificial intelligence']
  },
  {
    id: 'iron-legion',
    name: 'Iron Legion Contracting LLC',
    category: 'Construction / Business',
    tags: ['physical'],
    status: 'active',
    statusLabel: 'Active',
    shortDesc: 'Residential and commercial construction, remodeling, and estimating.',
    longDesc: 'Residential and commercial construction, remodeling, estimating, and the hands-on problem-solving that comes with all of it.',
    color: 0xe7a552,
    shape: 'structural',
    anchor: '#constellation',
    keywords: ['iron legion', 'contracting', 'construction', 'llc', 'company', 'business', 'remodel', 'general contractor']
  },
  {
    id: 'long-way-around',
    name: 'The Long Way Around',
    category: 'Podcast / Media',
    tags: ['media'],
    status: 'building',
    statusLabel: 'Building',
    shortDesc: 'Conversation that wanders through life, humor, and ideas before it finds the point.',
    longDesc: 'A podcast and media project that wanders through life, mistakes, ideas, and technology — and usually finds its way back to the point.',
    color: 0xe7a552,
    shape: 'orbit',
    anchor: '#constellation',
    keywords: ['long way around', 'podcast', 'media', 'show', 'episodes', 'name meaning']
  },
  {
    id: 'alphaquote',
    name: 'AlphaQuote',
    category: 'Software / Estimating',
    tags: ['digital', 'experiments'],
    status: 'prototype',
    statusLabel: 'Prototype',
    shortDesc: 'An estimating concept born from years of bidding real construction jobs.',
    longDesc: 'An estimating concept for construction, connecting the job site to the code.',
    color: 0xa08cff,
    shape: 'blueprint',
    anchor: '#constellation',
    keywords: ['alphaquote', 'estimating', 'estimate', 'quoting', 'software', 'construction tech']
  },
  {
    id: 'syntrax',
    name: 'Syntrax',
    category: 'Security / AI',
    tags: ['digital', 'experiments'],
    status: 'experiment',
    statusLabel: 'Experiment',
    shortDesc: 'Exploring AI-assisted threat detection, honeypots, and defensive automation.',
    longDesc: 'Exploring AI-assisted threat detection, honeypots, and defensive security automation.',
    color: 0x78c8aa,
    shape: 'grid',
    anchor: '#constellation',
    keywords: ['syntrax', 'security', 'cybersecurity', 'honeypot', 'threat detection', 'defense']
  },
  {
    id: 'realmrisers',
    name: 'RealmRisers',
    category: 'Game',
    tags: ['digital', 'experiments'],
    status: 'concept',
    statusLabel: 'Concept',
    shortDesc: "An early creative/game project — proof the experimentation doesn't stop at utility software.",
    longDesc: 'An early game project — proof the experimentation extends into interactive worlds.',
    color: 0xa08cff,
    shape: 'gem',
    anchor: '#constellation',
    keywords: ['realmrisers', 'game', 'realm risers']
  }
];

export const STATUS_ORDER = ['active', 'building', 'prototype', 'experiment', 'concept', 'shipped', 'archived'];

export function getProject(id) {
  return PROJECTS.find(p => p.id === id) || null;
}

export function projectsByTag(tag) {
  if (!tag || tag === 'all') return PROJECTS;
  return PROJECTS.filter(p => p.tags.includes(tag));
}
