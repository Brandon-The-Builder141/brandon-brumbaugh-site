// Canonical source of truth for every project shown in the Constellation, the
// Workshop, project HUDs, the project detail overlay, Ask About Brandon, and
// the Rabbit Hole button. Nothing about Brandon's real work should be typed
// twice — it should be read from here.
//
// `tier` controls how much bespoke treatment a project gets in the
// constellation/overlay system: 'signature' (Solen — full immersive
// treatment), 'strong' (Iron Legion, The Long Way Around — a meaningful but
// lighter transition), or 'detail' (AlphaQuote, Syntrax, RealmRisers — the
// shared project-detail template using their existing visual identity).

export const PROJECTS = [
  {
    id: 'solen',
    name: 'Solen',
    category: 'AI Companion',
    tags: ['digital'],
    status: 'active',
    statusLabel: 'Active / Building',
    tier: 'signature',
    shortDesc: 'Conversation, personality, persistent memory, and planning — built to reduce mental load, not add to it.',
    longDesc: 'An AI companion, not another chatbot — built around conversation, personality, persistent memory, planning, and reducing mental load.',
    tagline: 'An intelligent companion designed to reduce mental load.',
    why: 'Brandon kept hitting the same wall in his own head: too many open loops between job sites, ideas, and everyday life, and no single place holding context on any of it. Solen started as an attempt to fix that for himself first.',
    idea: 'Not another chatbot. A companion that can understand context, remember what matters, help plan, converse naturally, and reduce the amount of information a person has to hold in their head.',
    coreAreas: ['Conversation', 'Persistent memory', 'Personality', 'Planning', 'Tools', 'Voice', 'Personal context', 'Privacy / local-first exploration'],
    currentStatusDetail: 'Active development. The core conversation and memory loop is working; planning, tools, and voice are still being built out. This is a real, evolving project — not a finished product.',
    learning: 'That memory is the hard part. Making an AI companion feel like it actually knows you is less about a bigger model and more about deciding what’s worth remembering and how to bring it back at the right moment.',
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
    tier: 'strong',
    shortDesc: 'Residential and commercial construction, remodeling, and estimating.',
    longDesc: 'Residential and commercial construction, remodeling, estimating, and the hands-on problem-solving that comes with all of it.',
    tagline: 'The original craft — where the instinct to build actually started.',
    why: 'Before there was any software, there was a job site, a set of tools, and a willingness to figure things out by doing them wrong first.',
    idea: 'A real construction business: coordinating jobs, estimating accurately, solving problems in the field, and building a reputation one finished project at a time.',
    coreAreas: ['Residential construction', 'Commercial construction', 'Remodeling', 'Estimating', 'Project coordination', 'Client relationships'],
    currentStatusDetail: 'Active and operating. This is the day job and the original craft everything else is built on top of.',
    learning: 'That reputation is built one finished job at a time, not one pitch — and that the same discipline (measure twice, ship once) carries straight over into software.',
    color: 0xe7a552,
    shape: 'structural',
    anchor: '#constellation',
    keywords: ['iron legion', 'contracting', 'construction', 'llc', 'company', 'business', 'remodel', 'general contractor'],
    gallery: [
      'assets/images/iron-legion/job-01.png',
      'assets/images/iron-legion/job-02.jpeg',
      'assets/images/iron-legion/job-03.jpeg',
      'assets/images/iron-legion/job-04.jpeg',
      'assets/images/iron-legion/job-05.jpeg',
      'assets/images/iron-legion/job-06.jpeg',
      'assets/images/iron-legion/job-07.jpeg',
      'assets/images/iron-legion/job-08.jpeg',
      'assets/images/iron-legion/job-09.jpeg',
      'assets/images/iron-legion/job-10.jpeg',
      'assets/images/iron-legion/job-11.jpeg',
      'assets/images/iron-legion/job-12.jpeg',
      'assets/images/iron-legion/job-13.jpeg',
      'assets/images/iron-legion/job-14.jpeg',
      'assets/images/iron-legion/job-15.jpeg',
      'assets/images/iron-legion/job-16.jpeg',
      'assets/images/iron-legion/job-17.jpeg',
      'assets/images/iron-legion/job-18.jpeg',
      'assets/images/iron-legion/job-19.jpeg',
      'assets/images/iron-legion/job-20.jpeg',
      'assets/images/iron-legion/job-21.jpg',
      'assets/images/iron-legion/job-22.jpg',
      'assets/images/iron-legion/job-23.jpg',
      'assets/images/iron-legion/job-24.jpeg',
      'assets/images/iron-legion/job-25.jpeg',
      'assets/images/iron-legion/job-26.jpeg',
      'assets/images/iron-legion/job-27.jpeg',
      'assets/images/iron-legion/job-28.jpg',
      'assets/images/iron-legion/job-29.jpg',
      'assets/images/iron-legion/job-30.jpeg',
      'assets/images/iron-legion/job-31.jpeg',
      'assets/images/iron-legion/job-32.jpeg',
      'assets/images/iron-legion/job-33.jpeg',
      'assets/images/iron-legion/job-34.jpeg',
      'assets/images/iron-legion/job-35.jpeg',
      'assets/images/iron-legion/job-36.jpeg',
      'assets/images/iron-legion/job-37.jpeg',
      'assets/images/iron-legion/job-38.jpeg',
      'assets/images/iron-legion/job-39.jpeg',
      'assets/images/iron-legion/job-40.jpeg',
      'assets/images/iron-legion/job-41.jpeg',
      'assets/images/iron-legion/job-42.jpeg',
      'assets/images/iron-legion/job-43.jpeg',
      'assets/images/iron-legion/job-44.jpeg',
      'assets/images/iron-legion/job-45.jpeg',
      'assets/images/iron-legion/job-46.jpg',
      'assets/images/iron-legion/job-47.jpeg',
      'assets/images/iron-legion/job-48.jpg'
    ]
  },
  {
    id: 'long-way-around',
    name: 'The Long Way Around',
    category: 'Podcast / Media',
    tags: ['media'],
    status: 'building',
    statusLabel: 'Building',
    tier: 'strong',
    shortDesc: 'Conversation that wanders through life, humor, and ideas before it finds the point.',
    longDesc: 'A podcast and media project that wanders through life, mistakes, ideas, and technology — and usually finds its way back to the point.',
    tagline: 'You don’t always arrive by moving in a straight line.',
    why: 'Brandon’s own path hasn’t been linear — contractor, then builder of software, then both at once — and most conversations worth having aren’t linear either.',
    idea: 'A conversation that moves through life, humor, mistakes, ideas, technology, and culture, letting subjects that seem disconnected eventually connect back to a larger point.',
    coreAreas: ['Conversation', 'Storytelling', 'Humor', 'Technology', 'Personal growth'],
    currentStatusDetail: 'In production. Not yet publicly launched — the format and early conversations are still being shaped before anything goes out.',
    learning: 'That the name is the whole idea: sometimes you reach the point by taking the long way around.',
    color: 0xe7a552,
    shape: 'orbit',
    anchor: '#constellation',
    keywords: ['long way around', 'podcast', 'media', 'show', 'episodes', 'name meaning'],
    media: {
      video: 'assets/video/the-long-way-around-logo.mp4',
      poster: 'assets/images/media/the-long-way-around-poster.png'
    }
  },
  {
    id: 'alphaquote',
    name: 'AlphaQuote',
    category: 'Software / Estimating',
    tags: ['digital', 'experiments'],
    status: 'prototype',
    statusLabel: 'Prototype',
    tier: 'detail',
    shortDesc: 'An estimating concept born from years of bidding real construction jobs.',
    longDesc: 'An estimating concept for construction, connecting the job site to the code.',
    tagline: 'Where construction and code actually meet.',
    why: 'Years of estimating real jobs by hand for Iron Legion Contracting LLC exposed exactly where the process is slow and error-prone.',
    idea: 'Estimating software built by someone who has actually bid the jobs it’s meant to help with — the clearest crossover between Brandon’s two worlds.',
    coreAreas: ['Estimating', 'Construction workflows', 'Software prototyping'],
    currentStatusDetail: 'Early prototype. Concept and first builds exist; not yet a finished product.',
    learning: 'That the best software ideas come from problems you’ve actually lived with, not ones you’re guessing at.',
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
    tier: 'detail',
    shortDesc: 'Exploring AI-assisted threat detection, honeypots, and defensive automation.',
    longDesc: 'Exploring AI-assisted threat detection, honeypots, and defensive security automation.',
    tagline: 'An experiment in defensive, AI-assisted security.',
    why: 'Part of Brandon’s broader curiosity about AI and automation — asking whether the same instincts that catch a problem on a job site early can catch one in a network early too.',
    idea: 'Exploring AI-assisted threat detection, honeypots, and automation for defensive security use cases.',
    coreAreas: ['Threat detection', 'Honeypots', 'Security automation'],
    currentStatusDetail: 'Experimental. This is a technology exploration, not a shipped security product.',
    learning: 'That defensive security and construction problem-solving share the same core habit: notice the small thing before it becomes the big thing.',
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
    tier: 'detail',
    shortDesc: "An early creative/game project — proof the experimentation doesn't stop at utility software.",
    longDesc: 'An early game project — proof the experimentation extends into interactive worlds.',
    tagline: 'Proof the experimentation isn’t limited to utility software.',
    why: 'Not everything Brandon builds needs to solve a business problem — some of it is just proof that building extends into games and interactive experiences too.',
    idea: 'An early-stage game / interactive project, still at the concept stage.',
    coreAreas: ['Game design', 'Interactive experience'],
    currentStatusDetail: 'Concept stage. Idea-level, not yet in active development.',
    learning: 'That ideas deserve to be tested, not worshiped — even the ones without an obvious business case.',
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
