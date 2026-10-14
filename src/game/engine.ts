import {
  ASPECTS, CHARITIES, DISASTERS, DUTY_PLACES, HANDLES, HONOR_PROMPTS, HYMNS, KIND_INFO, KIND_ORDER,
  KNOWLEDGE_PLACES, OMENS, PLACARDS, PLANET_NAMES, PROTOTYPES, READING_CLOSE, READING_OPEN, RIDDLES,
  SCROLLS, STILL_PLACES, TIERS, TRUTH_SHARE,
} from './data';
import type {
  Alert, AlertTone, Attr, Attrs, GameState, God, Horoscope, Kinship, Relation, Ritual, RitualKind,
  Sign, Tile, Terrain,
} from './types';

export const PLAYER = 'you';
export const ATTRS: Attr[] = ['wisdom', 'power', 'charisma', 'evidence'];
export const ATTR_RANGE: Record<Attr, [string, string]> = {
  wisdom: ['Ignorant', 'Omniscient'],
  power: ['Impotent', 'Omnipotent'],
  charisma: ['Boring', 'Hypnotic'],
  evidence: ['Fiction', 'Fact'],
};

export const COSTS = { wall: 60, buildings: [100, 250, 600], missionary: 80, soldier: 40, offering: 50, hint: 5, contemplate: 10 };
export const BUILDING_NAMES = ['None', 'Church', 'Temple', 'Cathedral'];

// ---------- randomness ----------
export const rand = () => Math.random();
export const randInt = (a: number, b: number) => a + Math.floor(Math.random() * (b - a + 1));
export const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(Math.random() * arr.length)];
export const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

function mulberry(seed: number) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

function uid(g: GameState, prefix: string) {
  g.seq++;
  return `${prefix}${g.seq}`;
}

// ---------- time ----------
export const dayOf = (hour: number) => Math.floor(hour / 24) + 1;
export const clockOf = (hour: number) => `${String(hour % 24).padStart(2, '0')}:00`;
export const hoursLeft = (g: GameState, deadline: number) => deadline - g.hour;

// ---------- gods ----------
export function godById(g: GameState, id: string | null): God | undefined {
  if (!id) return undefined;
  return id === PLAYER ? g.player : g.gods.find((x) => x.id === id);
}

export function might(god: God) {
  const a = god.attrs;
  const wrath = god.benevolence < 0 ? -god.benevolence / 8 : 0;
  return a.power * 0.45 + a.charisma * 0.2 + a.wisdom * 0.2 + a.evidence * 0.15 + wrath;
}

export function totalAttrs(a: Attrs) {
  return a.wisdom + a.power + a.charisma + a.evidence;
}

function isKin(g: GameState, a: string, b: string) {
  if (a !== PLAYER && b !== PLAYER) return false;
  const other = a === PLAYER ? b : a;
  return !!g.relations[other]?.terms?.nonAggression;
}

// ---------- map ----------
const W = 18;
const H = 11;

export function neighbors(map: GameState['map'], t: Tile): Tile[] {
  const odd = t.y % 2 === 1;
  const dirs = odd
    ? [[1, 0], [-1, 0], [1, -1], [0, -1], [1, 1], [0, 1]]
    : [[1, 0], [-1, 0], [0, -1], [-1, -1], [0, 1], [-1, 1]];
  const out: Tile[] = [];
  for (const [dx, dy] of dirs) {
    const x = t.x + dx;
    const y = t.y + dy;
    if (x >= 0 && y >= 0 && x < map.w && y < map.h) out.push(map.tiles[y * map.w + x]);
  }
  return out;
}

function genMap(seed: number): GameState['map'] {
  const r = mulberry(seed);
  const tiles: Tile[] = [];
  let elev: number[] = [];
  for (let i = 0; i < W * H; i++) elev.push(r());
  const map = { w: W, h: H, tiles };
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) tiles.push({ id: y * W + x, x, y, terrain: 'plain', pop: 0, owner: null, wall: false, building: 0 });
  for (let pass = 0; pass < 3; pass++) {
    elev = tiles.map((t) => {
      const ns = neighbors(map, t);
      return (elev[t.id] * 2 + ns.reduce((s, n) => s + elev[n.id], 0)) / (ns.length + 2);
    });
  }
  // Edges lean toward sea so the land reads as a continent.
  elev = elev.map((e, i) => {
    const t = tiles[i];
    const dx = Math.abs(t.x - (W - 1) / 2) / (W / 2);
    const dy = Math.abs(t.y - (H - 1) / 2) / (H / 2);
    return e - Math.max(dx, dy) ** 3 * 0.25;
  });
  const sorted = [...elev].sort((a, b) => a - b);
  const sea = sorted[Math.floor(sorted.length * 0.2)];
  const high = sorted[Math.floor(sorted.length * 0.86)];
  for (const t of tiles) {
    const e = elev[t.id];
    let terrain: Terrain = 'plain';
    if (e < sea) terrain = 'water';
    else if (e > high) terrain = 'hill';
    else {
      const v = r();
      terrain = v < 0.3 ? 'forest' : v < 0.42 ? 'desert' : 'plain';
    }
    t.terrain = terrain;
    t.pop = terrain === 'water' ? 0 : terrain === 'plain' ? 20 + Math.floor(r() * 25) : terrain === 'forest' ? 12 + Math.floor(r() * 14) : terrain === 'hill' ? 8 + Math.floor(r() * 12) : 4 + Math.floor(r() * 9);
  }
  return map;
}

function popCap(t: Tile) {
  const base = t.terrain === 'plain' ? 60 : t.terrain === 'forest' ? 40 : t.terrain === 'hill' ? 30 : 18;
  return base + t.building * 25;
}

function claimCluster(map: GameState['map'], start: Tile, owner: string, size: number) {
  const q = [start];
  let n = 0;
  while (q.length && n < size) {
    const t = q.shift()!;
    if (t.owner || t.terrain === 'water') continue;
    t.owner = owner;
    n++;
    q.push(...neighbors(map, t));
  }
}

function makeRivals(planetIndex: number, playerProto: string): God[] {
  const protos = PROTOTYPES.filter((p) => p.id !== playerProto).sort(() => rand() - 0.5).slice(0, 6);
  const handles = [...HANDLES].sort(() => rand() - 0.5);
  return protos.map((p, i) => {
    const attrs = { ...p.attrs };
    const budget = 70 + planetIndex * 25;
    for (let k = 0; k < budget; k++) {
      const a = pick(ATTRS);
      attrs[a] = Math.min(100, attrs[a] + 1);
    }
    return {
      id: `g${planetIndex}_${p.id}`,
      name: p.name,
      epithet: p.epithet,
      glyph: p.glyph,
      color: p.color,
      prototypeId: p.id,
      attrs,
      benevolence: clamp(p.benevolence + randInt(-25, 25), -100, 100),
      tithe: randInt(5, 15),
      handle: handles[i],
      profile: p.profile,
    };
  });
}

function placeGods(g: GameState) {
  const land = g.map.tiles.filter((t) => t.terrain !== 'water');
  const cx = (W - 1) / 2;
  const cy = (H - 1) / 2;
  const start = [...land].sort((a, b) => Math.hypot(a.x - cx, a.y - cy) - Math.hypot(b.x - cx, b.y - cy))[0];
  start.owner = PLAYER;
  start.pop = 6;
  const seeds: Tile[] = [start];
  for (const god of g.gods) {
    let best = land[0];
    let bestD = -1;
    for (const t of land) {
      if (t.owner) continue;
      const d = Math.min(...seeds.map((s) => Math.hypot(s.x - t.x, (s.y - t.y) * 0.9)));
      const dd = d + rand() * 1.5;
      if (dd > bestD) { bestD = dd; best = t; }
    }
    seeds.push(best);
    claimCluster(g.map, best, god.id, randInt(3, 5));
  }
}

export function landTiles(g: GameState) {
  return g.map.tiles.filter((t) => t.terrain !== 'water');
}
export function tilesOf(g: GameState, owner: string) {
  return g.map.tiles.filter((t) => t.owner === owner);
}
export function followersOf(g: GameState, owner: string) {
  return tilesOf(g, owner).reduce((s, t) => s + t.pop, 0);
}
export function borderTargets(g: GameState, owner: string) {
  const set = new Map<number, Tile>();
  for (const t of tilesOf(g, owner)) for (const n of neighbors(g.map, t)) if (n.terrain !== 'water' && n.owner !== owner) set.set(n.id, n);
  return [...set.values()];
}

// ---------- alerts & chronicle ----------
export function alert(g: GameState, text: string, tone: AlertTone = 'info') {
  const a: Alert = { id: uid(g, 'a'), hour: g.hour, text, tone, seen: false };
  g.alerts.unshift(a);
  if (g.alerts.length > 80) g.alerts.length = 80;
}
function chronicle(g: GameState, title: string, text: string, major: boolean) {
  g.chronicle.unshift({ id: uid(g, 'm'), hour: g.hour, title, text, major });
}

// ---------- horoscope ----------
export function computeHoroscope(day: number, sign: Sign, planet: number): Horoscope {
  const r = mulberry(hash(`${planet}:${day}:${sign}`));
  const p = <T,>(a: readonly T[]) => a[Math.floor(r() * a.length)];
  return {
    day,
    aspect: p(ASPECTS),
    reading: `${p(READING_OPEN)} ${p(READING_CLOSE)}`,
    favored: p(KIND_ORDER),
    luckyAttr: p(ATTRS),
    luck: Math.floor(r() * 100),
    riteUsed: false,
  };
}

export function feelingLucky(g: GameState): { text: string; delta: number } {
  const h = g.horoscope;
  h.riteUsed = true;
  const roll = rand() * 100;
  const luck = clamp(h.luck + g.player.attrs.wisdom / 10, 0, 100);
  let delta = 0;
  let text = '';
  if (roll < luck * 0.4) { delta = 150; text = `${h.aspect} smiles. A windfall of relics.`; }
  else if (roll < luck) { delta = 60; text = 'The stars were kind enough.'; }
  else if (roll < luck + 25) { delta = 5; text = 'The stars were silent. A token for trying.'; }
  else { delta = -Math.min(g.relics, 40); text = 'You pressed your luck. The heavens pressed back.'; }
  g.relics += delta;
  if (delta > 0) g.lifetimeRelics += delta;
  alert(g, `Horoscopic rite: ${text} (${delta >= 0 ? '+' : ''}${delta} relics)`, delta > 0 ? 'good' : delta < 0 ? 'bad' : 'info');
  return { text, delta };
}

// ---------- rituals ----------
function weightedKind(g: GameState): RitualKind {
  const weights = KIND_ORDER.map((k) => KIND_INFO[k].weight * (k === g.horoscope.favored ? 1.6 : 1));
  let r = rand() * weights.reduce((a, b) => a + b, 0);
  for (let i = 0; i < KIND_ORDER.length; i++) {
    r -= weights[i];
    if (r <= 0) return KIND_ORDER[i];
  }
  return 'sacrifice';
}

export function makeRitual(g: GameState, kind: RitualKind = weightedKind(g)): Ritual {
  const [lo, hi] = KIND_INFO[kind].base;
  const relics = Math.round(randInt(lo, hi) * (1 + g.planet.index * 0.25));
  const base = { id: uid(g, 'r'), kind, relics, issuedAt: g.hour, status: 'offered' as const, source: 'god' as const };
  const god = g.player.name;
  switch (kind) {
    case 'sacrifice': {
      const laps = randInt(3, 5);
      return { ...base, deadline: g.hour + randInt(8, 16), title: `Circle the block ${laps} times`, description: `Leave your chair. ${god} asks for your time and your comfort, gathering relics as you walk.`, options: [{ label: 'Walk the block (GPS)', game: { type: 'walk', laps } }, { label: 'Push the stone (on screen)', game: { type: 'boulder' } }] };
    }
    case 'meditation': {
      const place = pick(STILL_PLACES);
      return { ...base, deadline: g.hour + randInt(10, 20), title: `Be still at ${place}`, description: 'Go there. Stand without moving. The app watches your stillness.', options: [{ label: 'Travel and be still', game: { type: 'still', seconds: randInt(8, 12), place } }] };
    }
    case 'jnana': {
      const place = pick(KNOWLEDGE_PLACES);
      return { ...base, deadline: g.hour + randInt(18, 30), title: `Visit ${place}`, description: 'Find what the god wants you to read, then prove you read it.', options: [{ label: `Go to ${place}`, game: { type: 'placard', placardId: randInt(0, PLACARDS.length - 1), place } }, { label: 'Answer a riddle instead', game: { type: 'riddle', riddleId: randInt(0, RIDDLES.length - 1) } }] };
    }
    case 'dharma': {
      const [a, b] = [...DUTY_PLACES].sort(() => rand() - 0.5);
      return { ...base, deadline: g.hour + randInt(24, 40), title: `Serve at ${a}`, description: 'It is your duty. Be present for ten minutes among people who need it. Completing this releases money from the charity pool.', options: [{ label: `Go to ${a}`, game: { type: 'presence', place: a, minutes: 10 } }, { label: `Go to ${b}`, game: { type: 'presence', place: b, minutes: 10 } }] };
    }
    case 'honor': {
      const prompt = pick(HONOR_PROMPTS);
      return { ...base, deadline: g.hour + randInt(14, 28), title: prompt.replace(/\.$/, ''), description: 'Do it, then describe what actually happened. A random pilgrim will judge how believable your story is.', options: [{ label: 'Tell your story', game: { type: 'story', prompt } }] };
    }
  }
}

function rivalRitual(g: GameState, god: God): Ritual {
  return {
    id: uid(g, 'r'), kind: 'sacrifice', source: 'rival', forGodId: god.id, status: 'offered', issuedAt: g.hour, deadline: g.hour + 6,
    relics: randInt(40, 70), title: `Chant the hymn of ${god.name}`,
    description: `You are inside ${god.name}'s domain. Sing their hymn and the god (and ${god.handle}) will remember the courtesy.`,
    options: [{ label: 'Sing the hymn', game: { type: 'chant', hymn: pick(HYMNS) } }],
  };
}

function coachRitual(g: GameState): Ritual {
  return {
    id: uid(g, 'r'), kind: 'sacrifice', source: 'custom', assignedBy: 'Coach Dana (trainer)', status: 'offered', issuedAt: g.hour, deadline: g.hour + 24,
    relics: 45, title: 'Morning circuit', description: 'Assigned by your trainer. Check off each set as you finish it.',
    options: [{ label: 'Do the circuit', game: { type: 'checklist', items: ['20 squats', '15 push-ups', '30 second plank', '20 lunges', '1 minute of stretching'] } }],
  };
}

export function createCustomRitual(g: GameState, title: string, items: string[], relics: number, assignedBy: string) {
  const r: Ritual = {
    id: uid(g, 'r'), kind: 'sacrifice', source: 'custom', assignedBy: assignedBy || 'You', status: 'offered', issuedAt: g.hour, deadline: g.hour + 24,
    relics, title, description: 'A custom ritual. Check off each step when it is done.',
    options: [{ label: 'Begin', game: { type: 'checklist', items } }],
  };
  g.rituals.unshift(r);
  alert(g, `New custom ritual: ${title}`, 'info');
}

export function queueRitual(g: GameState, id: string) {
  const r = g.rituals.find((x) => x.id === id);
  if (!r || r.status !== 'offered') return;
  r.status = 'queued';
  r.deadline += 24;
}

export function ritualValue(g: GameState, r: Ritual) {
  let mult = r.status === 'queued' ? 0.75 : 1;
  if (r.source === 'god' && r.kind === g.horoscope.favored) mult *= 1.5;
  return Math.round(r.relics * mult);
}

export function completeRitual(g: GameState, id: string, quality: number): number {
  const r = g.rituals.find((x) => x.id === id);
  if (!r || (r.status !== 'offered' && r.status !== 'queued')) return 0;
  const earned = Math.round(ritualValue(g, r) * clamp(quality, 0.15, 1));
  r.status = 'done';
  r.earned = earned;
  r.doneAt = g.hour;
  g.relics += earned;
  g.lifetimeRelics += earned;
  g.stats.done++;
  if (r.kind === 'dharma') releaseCharity(g, randInt(8, 25), r.title);
  if (r.kind === 'meditation' && rand() < 0.4) releaseCharity(g, randInt(1, 4), r.title);
  if (r.source === 'rival' && r.forGodId) {
    const rel = g.relations[r.forGodId];
    if (rel) rel.favor = clamp(rel.favor + Math.round(10 + quality * 12), -100, 100);
    const god = godById(g, r.forGodId);
    alert(g, `${god?.name ?? 'The god'} is appeased by your hymn. Favor rises.`, 'good');
  } else {
    alert(g, `Ritual complete: ${r.title}. +${earned} relics`, 'good');
  }
  // occasional small attribute growth tied to the ritual order
  const growth: Record<RitualKind, Attr> = { sacrifice: 'power', meditation: 'wisdom', jnana: 'evidence', dharma: 'charisma', honor: 'charisma' };
  if (r.source === 'god' && rand() < 0.5) {
    const a = growth[r.kind];
    g.player.attrs[a] = Math.min(100, g.player.attrs[a] + 1);
  }
  checkScrolls(g);
  return earned;
}

function disaster(g: GameState, cause: string) {
  const d = pick(DISASTERS);
  const loss = Math.min(g.relics, randInt(30, 80));
  g.relics -= loss;
  g.stats.failed++;
  const mine = tilesOf(g, PLAYER);
  let extra = '';
  if (mine.length > 1 && rand() < 0.5) {
    const border = mine.filter((x) => neighbors(g.map, x).some((n) => n.owner !== PLAYER));
    const t = pick(border.length ? border : mine);
    t.owner = null;
    t.wall = false;
    t.building = 0;
    extra = ' A village lost its faith.';
  } else {
    for (const t of mine) t.pop = Math.max(1, Math.round(t.pop * 0.85));
  }
  alert(g, `Natural disaster: ${d.name}. ${d.text} You broke a promise (${cause}). −${loss} relics.${extra}`, 'bad');
}

function expireRituals(g: GameState) {
  for (const r of g.rituals) {
    if (r.deadline > g.hour) continue;
    if (r.status === 'offered') {
      r.status = 'faded';
    } else if (r.status === 'queued') {
      r.status = 'failed';
      disaster(g, r.title);
    }
  }
  // keep the list bounded
  const active = g.rituals.filter((r) => r.status === 'offered' || r.status === 'queued');
  const past = g.rituals.filter((r) => r.status !== 'offered' && r.status !== 'queued').slice(0, 30);
  g.rituals = [...active, ...past];
}

// ---------- omens, grace, challenges ----------
export function interpretOmen(g: GameState, idx: number) {
  const o = g.omen;
  if (!o) return null;
  const ok = o.options[idx]?.correct;
  g.omen = null;
  if (ok) {
    const a = pick(ATTRS);
    g.player.attrs[a] = Math.min(100, g.player.attrs[a] + 2);
    g.relics += 40;
    g.lifetimeRelics += 40;
    alert(g, `You read the omen truly. +40 relics, ${a} +2.`, 'good');
  } else {
    const loss = Math.min(g.relics, 25);
    g.relics -= loss;
    alert(g, `You misread the omen. Something small goes wrong. −${loss} relics.`, 'bad');
  }
  return ok;
}

export function buyOmenHint(g: GameState) {
  if (g.wisdomPoints < COSTS.hint) return false;
  g.wisdomPoints -= COSTS.hint;
  return true;
}

export function extendGrace(g: GameState, id: string) {
  const req = g.graceRequests.find((x) => x.id === id);
  if (!req) return;
  g.graceRequests = g.graceRequests.filter((x) => x.id !== id);
  g.relics = Math.max(0, g.relics - 10);
  g.player.attrs.charisma = Math.min(100, g.player.attrs.charisma + 1);
  const mine = tilesOf(g, PLAYER);
  if (mine.length) pick(mine).pop += 3;
  alert(g, `You extended grace to ${req.pilgrim}. Word of your god's generosity spreads (charisma +1).`, 'good');
}

export function refuseGrace(g: GameState, id: string): { score: number; delta: number } {
  const req = g.graceRequests.find((x) => x.id === id)!;
  g.graceRequests = g.graceRequests.filter((x) => x.id !== id);
  let delta: number;
  if (req.hiddenScore > 60) {
    delta = -Math.min(g.relics, Math.round(req.hiddenScore * 0.8));
    alert(g, `You refused a devoted pilgrim (score ${req.hiddenScore}). ${g.player.name} punishes your pride. ${delta} relics.`, 'bad');
  } else {
    delta = 10;
    alert(g, `You refused a half-hearted pilgrim (score ${req.hiddenScore}). Your god approves of the discernment. +10 relics.`, 'good');
  }
  g.relics += delta;
  return { score: req.hiddenScore, delta };
}

function makeChallenge(g: GameState) {
  for (const t of tilesOf(g, PLAYER).sort(() => rand() - 0.5)) {
    const enemy = neighbors(g.map, t).find((n) => n.owner && n.owner !== PLAYER && !isKin(g, PLAYER, n.owner));
    if (enemy) {
      g.challenge = { id: uid(g, 'c'), godId: enemy.owner!, tileId: t.id, expires: g.hour + 4 };
      const god = godById(g, enemy.owner)!;
      alert(g, `${god.handle} challenges you for a border village. Duel them now or let the gods decide.`, 'sacred');
      return;
    }
  }
}

/** Resolve a live duel. `won` comes from the tap-duel mini game. */
export function resolveChallenge(g: GameState, won: boolean) {
  const c = g.challenge;
  if (!c) return;
  g.challenge = null;
  const tile = g.map.tiles[c.tileId];
  const god = godById(g, c.godId)!;
  if (won) {
    const theirs = neighbors(g.map, tile).find((n) => n.owner === c.godId);
    if (theirs) {
      theirs.owner = PLAYER;
      theirs.wall = false;
      theirs.building = Math.max(0, theirs.building - 1) as Tile['building'];
    }
    g.stats.won++;
    alert(g, `You won the duel against ${god.handle}. A village of ${god.name} converts to you.`, 'good');
  } else {
    if (tile.owner === PLAYER && tilesOf(g, PLAYER).length > 1) tile.owner = c.godId;
    g.stats.lost++;
    alert(g, `You lost the duel to ${god.handle}. ${god.name} takes a village.`, 'bad');
  }
}

export function declineChallenge(g: GameState) {
  const c = g.challenge;
  if (!c) return;
  g.challenge = null;
  const tile = g.map.tiles[c.tileId];
  const from = neighbors(g.map, tile).find((n) => n.owner === c.godId);
  if (from) contest(g, from, tile, true);
}

// ---------- the world turns ----------
function contest(g: GameState, from: Tile, to: Tile, forceBattle = false) {
  const att = godById(g, from.owner);
  if (!att || to.terrain === 'water' || to.owner === from.owner) return;
  if (!to.owner) {
    let p = 0.04 + att.attrs.charisma / 350 + from.building * 0.03 + Math.max(0, att.benevolence) / 1200;
    if (to.terrain === 'desert') p *= 0.6;
    if (rand() < p) {
      to.owner = att.id;
      if (att.id === PLAYER) alert(g, `Your myth spread to a ${to.terrain} village (${to.pop} souls).`, 'good');
    }
    return;
  }
  if (isKin(g, att.id, to.owner)) return;
  if (!forceBattle && rand() > 0.35) return;
  const def = godById(g, to.owner)!;
  const swing = (god: God) => 0.75 + rand() * 0.5 * (1 - god.attrs.evidence / 200);
  let defScore = might(def) * swing(def) + (to.wall ? 18 : 0) + to.building * 8 + (to.terrain === 'hill' ? 6 : 0);
  if (def.id === PLAYER) {
    for (const [gid, rel] of Object.entries(g.relations)) {
      if (rel.terms?.mutualDefense) {
        const ally = godById(g, gid);
        if (ally) defScore += might(ally) * 0.2;
      }
    }
  }
  const atkScore = might(att) * swing(att);
  if (atkScore > defScore * 1.12) {
    const prev = to.owner;
    to.owner = att.id;
    to.wall = false;
    to.building = Math.max(0, to.building - 1) as Tile['building'];
    to.pop = Math.max(1, Math.round(to.pop * 0.85));
    if (prev === PLAYER) { g.stats.lost++; alert(g, `${att.name} seized one of your villages at the border.`, 'bad'); }
    if (att.id === PLAYER) { g.stats.won++; alert(g, `Your faithful overran a village of ${def.name}.`, 'good'); }
  }
}

export function advanceHour(g: GameState) {
  g.hour++;
  const owned = g.map.tiles.filter((t) => t.owner);
  for (let i = 0; i < 6; i++) {
    const from = pick(owned);
    const ns = neighbors(g.map, from).filter((n) => n.terrain !== 'water' && n.owner !== from.owner);
    if (ns.length) contest(g, from, pick(ns));
  }
  if (g.hour % 4 === 0) for (const t of owned) t.pop = Math.min(popCap(t), t.pop + 1 + t.building);

  expireRituals(g);
  const offered = g.rituals.filter((r) => r.status === 'offered' && r.source === 'god').length;
  if (offered < 4 && rand() < 0.28) {
    const r = makeRitual(g);
    g.rituals.unshift(r);
    alert(g, `${g.player.name} demands a ${KIND_INFO[r.kind].label} ritual: ${r.title}.`, 'sacred');
  }
  if (g.omen && g.omen.expires <= g.hour) {
    g.omen = null;
    alert(g, 'An omen passed uninterpreted.', 'info');
  }
  if (!g.omen && rand() < 0.06) {
    const o = pick(OMENS);
    g.omen = { id: uid(g, 'o'), ...o, options: [...o.options].sort(() => rand() - 0.5), expires: g.hour + 8 };
    alert(g, `Omen: ${o.text}`, 'sacred');
  }
  if (g.graceRequests.length < 3 && rand() < 0.05) {
    g.graceRequests.push(makeGrace(g));
    alert(g, 'A hidden pilgrim performed a ritual in your god\'s honor and asks for grace.', 'info');
  }
  if (rand() < 0.045) {
    const rivals = new Set(borderTargets(g, PLAYER).map((t) => t.owner).filter(Boolean) as string[]);
    const pool = rivals.size ? [...rivals] : g.gods.map((x) => x.id);
    const god = godById(g, pick(pool));
    if (god && !g.rituals.some((r) => r.status === 'offered' && r.forGodId === god.id)) {
      g.rituals.unshift(rivalRitual(g, god));
      alert(g, `You have entered the domain of ${god.name}. Perform their rite to appease them.`, 'info');
    }
  }
  if (g.challenge && g.challenge.expires <= g.hour) declineChallenge(g);
  if (!g.challenge && rand() < 0.03) makeChallenge(g);
  if (g.hour % 24 === 0) newDay(g);
  checkTier(g);
}

function makeGrace(g: GameState) {
  const r = makeRitual(g);
  g.seq++;
  return { id: `gr${g.seq}`, ritualTitle: r.title, pilgrim: `Pilgrim #${randInt(1000, 9999)}`, hiddenScore: randInt(5, 100), hour: g.hour };
}

function newDay(g: GameState) {
  const day = dayOf(g.hour);
  g.horoscope = computeHoroscope(day, g.sign, g.planet.index);
  const gross = Math.round(followersOf(g, PLAYER) * g.player.tithe / 100 * 0.6);
  const shared = Object.values(g.relations).reduce((s, r) => s + (r.terms?.titheShare ?? 0), 0);
  const tithe = Math.round(gross * Math.max(0, 100 - shared) / 100);
  if (tithe > 0) {
    g.relics += tithe;
    g.lifetimeRelics += tithe;
  }
  if (g.player.tithe > 15) g.player.attrs.charisma = Math.max(1, g.player.attrs.charisma - 1);
  g.charity.pool += randInt(40, 160) + (g.charity.plan === 'devotee' ? 5 : 0);
  if (!g.rituals.some((r) => r.assignedBy?.startsWith('Coach') && r.status === 'offered')) g.rituals.unshift(coachRitual(g));
  alert(g, `Day ${day} dawns. ${g.horoscope.aspect}. Tithes: +${tithe} relics.`, 'info');
  mythShift(g);
  checkScrolls(g);
}

// ---------- the myth changes on its own ----------
const ATTR_WORDS: Record<Attr, string> = { wisdom: 'wisdom', power: 'might', charisma: 'allure', evidence: 'proofs' };

export function mythShift(g: GameState, forceMajor = false) {
  const p = g.player;
  const a = pick(ATTRS);
  const d = pick([-3, -2, -1, 1, 2, 3]);
  p.attrs[a] = clamp(p.attrs[a] + d, 1, 100);
  chronicle(g, d > 0 ? 'The myth grows' : 'The myth wanes', `Tales of ${p.name}'s ${ATTR_WORDS[a]} ${d > 0 ? 'spread' : 'fade'} in the markets (${a} ${d > 0 ? '+' : ''}${d}).`, false);
  if (!forceMajor && (dayOf(g.hour) < 2 || rand() > 0.35)) return;

  const offspring = g.gods.find((x) => x.parentId === PLAYER);
  const mine = tilesOf(g, PLAYER);
  const options: (() => void)[] = [
    () => {
      const shift = pick([-30, -20, 20, 30]);
      const before = p.benevolence;
      p.benevolence = clamp(p.benevolence + shift, -100, 100);
      const turned = before >= -30 && p.benevolence < -30;
      const redeemed = before < -30 && p.benevolence >= -30;
      const title = turned ? `${p.name} turns wrathful` : redeemed ? `${p.name} is redeemed` : shift > 0 ? 'A gentler myth' : 'A harder myth';
      const text = turned
        ? 'New stories tell of punishment and fire. Your god fights harder at the borders but wins fewer hearts.'
        : `The stories change in the telling. Benevolence ${shift > 0 ? '+' : ''}${shift}.`;
      chronicle(g, title, text, true);
      alert(g, `Myth change: ${title}.`, 'sacred');
    },
    () => {
      const delta = pick([-6, 6, 8]);
      p.attrs.evidence = clamp(p.attrs.evidence + delta, 1, 100);
      const title = delta > 0 ? 'Relics unearthed' : 'A scholar\'s doubt';
      const text = delta > 0 ? 'Diggers find a shrine that matches your scripture. Evidence rises.' : 'A pamphlet argues your miracles were staged. Evidence falls.';
      chronicle(g, title, text, true);
      alert(g, `Myth change: ${title}.`, 'sacred');
    },
    () => {
      const e = pick(['Who Walks Before Dawn', 'Keeper of Small Promises', 'The Unbowed', 'Mother of Thresholds', 'Breaker of Idle Hours', 'Who Counts the Steps']);
      p.epithet = e;
      chronicle(g, 'A new name', `The faithful have begun calling your god "${e}".`, true);
      alert(g, `Myth change: your god is now called ${e}.`, 'sacred');
    },
  ];
  if (!offspring && mine.length >= 4) options.push(() => schism(g));
  if (offspring) options.push(() => fuse(g, offspring));
  pick(options)();
}

function schism(g: GameState) {
  const p = g.player;
  const mine = tilesOf(g, PLAYER);
  const childTitles = ['The Younger', 'The Bright', 'The Hidden', 'The Second', 'The Restless'];
  const nouns: Record<string, string> = { warrior: 'Arrow', maize: 'Seed', kami: 'Spring', awakened: 'Lamp', dancer: 'Drum', river: 'Brook', wanderer: 'Raven', sundisk: 'Dawn', thunder: 'Spark', green: 'Sapling' };
  const attrs = { ...p.attrs };
  for (const a of ATTRS) attrs[a] = clamp(Math.round(attrs[a] * (0.7 + rand() * 0.4)), 1, 100);
  const child: God = {
    id: uid(g, 'child'),
    name: `${pick(childTitles)} ${nouns[p.prototypeId] ?? 'Flame'}`,
    epithet: `Offspring of ${p.name}`,
    glyph: p.glyph,
    color: '#B07AA1',
    prototypeId: p.prototypeId,
    attrs,
    benevolence: clamp(p.benevolence + randInt(-40, 40), -100, 100),
    tithe: p.tithe,
    handle: 'a breakaway sect',
    parentId: PLAYER,
    profile: `Born when ${p.name}'s myth split in two. Its followers believe they keep the purer rite.`,
  };
  g.gods.push(child);
  g.relations[child.id] = { favor: 0, kin: rand() < 0.5 ? 'Son' : 'Daughter', terms: null };
  // carve off a connected chunk of your territory
  const start = pick(mine.filter((t) => neighbors(g.map, t).some((n) => n.owner !== PLAYER)).concat(mine));
  const take = Math.max(1, Math.floor(mine.length * 0.25));
  const q = [start];
  let n = 0;
  while (q.length && n < take) {
    const t = q.shift()!;
    if (t.owner !== PLAYER) continue;
    t.owner = child.id;
    n++;
    q.push(...neighbors(g.map, t));
  }
  chronicle(g, 'Schism', `${p.name}'s myth divides. ${child.name} is born, and ${n} of your villages follow the new sect. Expect conflict within the family.`, true);
  alert(g, `Myth change: a schism. ${child.name} is born and takes ${n} villages.`, 'bad');
}

function fuse(g: GameState, other: God) {
  const p = g.player;
  for (const a of ATTRS) p.attrs[a] = clamp(Math.round(Math.max(p.attrs[a], other.attrs[a]) + randInt(-3, 4)), 1, 100);
  p.benevolence = clamp(Math.round((p.benevolence + other.benevolence) / 2), -100, 100);
  let n = 0;
  for (const t of g.map.tiles) if (t.owner === other.id) { t.owner = PLAYER; n++; }
  g.gods = g.gods.filter((x) => x.id !== other.id);
  delete g.relations[other.id];
  chronicle(g, 'Fusion', `${other.name} and ${p.name} become one again. The combined myth is stranger and stronger; ${n} villages return.`, true);
  alert(g, `Myth change: ${other.name} fuses back into ${p.name}.`, 'sacred');
}

// ---------- tiers, scrolls, truth ----------
export function tierIndexFor(g: GameState) {
  const n = tilesOf(g, PLAYER).length;
  if (n / landTiles(g).length >= TRUTH_SHARE) return 4;
  let idx = 0;
  for (let i = 0; i < 4; i++) if (n >= TIERS[i].minTiles) idx = i;
  return idx;
}

function checkTier(g: GameState) {
  const idx = tierIndexFor(g);
  if (idx > g.tierIndex) {
    g.tierIndex = idx;
    alert(g, `Your faith is now a ${TIERS[idx].name}. ${TIERS[idx].blurb}`, 'sacred');
    unlockScroll(g);
    if (idx === 4) g.truthReached = true;
  }
}

function unlockScroll(g: GameState) {
  const next = SCROLLS.findIndex((_, i) => !g.scrolls.includes(i));
  if (next < 0) return;
  g.scrolls.push(next);
  g.wisdomPoints += 10;
  alert(g, `Secret knowledge unlocked: "${SCROLLS[next].title}". +10 wisdom points.`, 'sacred');
}

function checkScrolls(g: GameState) {
  while (g.lifetimeRelics >= g.nextScrollAt) {
    g.nextScrollAt += 400;
    unlockScroll(g);
  }
}

export function travelToNewPlanet(g: GameState) {
  g.planet = { index: g.planet.index + 1, name: PLANET_NAMES[(g.planet.index + 1) % PLANET_NAMES.length] };
  g.map = genMap(randInt(1, 1e9));
  g.gods = makeRivals(g.planet.index, g.player.prototypeId);
  g.relations = Object.fromEntries(g.gods.map((x) => [x.id, { favor: randInt(-20, 20), kin: null, terms: null } as Relation]));
  g.pantheonName = null;
  placeGods(g);
  g.tierIndex = 0;
  g.truthReached = false;
  g.challenge = null;
  g.rituals = g.rituals.filter((r) => r.source !== 'rival');
  chronicle(g, `Arrival on ${g.planet.name}`, `${g.player.name} is real now, and real gods travel. A new world, new rivals, and a single believer: you.`, true);
  alert(g, `You arrive on ${g.planet.name}. Begin again as a Prophet.`, 'sacred');
}

// ---------- spending relics ----------
export function attrCost(g: GameState, a: Attr) {
  return 15 + g.player.attrs[a];
}
export function raiseAttr(g: GameState, a: Attr) {
  const cost = attrCost(g, a);
  if (g.relics < cost || g.player.attrs[a] >= 100) return false;
  g.relics -= cost;
  g.player.attrs[a]++;
  return true;
}
export function contemplate(g: GameState) {
  if (g.wisdomPoints < COSTS.contemplate || g.player.attrs.wisdom >= 100) return false;
  g.wisdomPoints -= COSTS.contemplate;
  g.player.attrs.wisdom++;
  return true;
}

export function buildWall(g: GameState, tileId: number) {
  const t = g.map.tiles[tileId];
  if (t.owner !== PLAYER || t.wall || g.relics < COSTS.wall) return false;
  g.relics -= COSTS.wall;
  t.wall = true;
  alert(g, 'Walls rise around a village.', 'info');
  return true;
}
export function buildingCost(t: Tile) {
  return t.building < 3 ? COSTS.buildings[t.building] : Infinity;
}
export function build(g: GameState, tileId: number) {
  const t = g.map.tiles[tileId];
  const cost = buildingCost(t);
  if (t.owner !== PLAYER || g.relics < cost) return false;
  g.relics -= cost;
  t.building = (t.building + 1) as Tile['building'];
  alert(g, `A ${BUILDING_NAMES[t.building].toLowerCase()} is consecrated.`, 'good');
  return true;
}

export function sendMissionaries(g: GameState, tileId: number): boolean | null {
  const t = g.map.tiles[tileId];
  if (t.owner === PLAYER || t.terrain === 'water' || g.relics < COSTS.missionary) return null;
  if (!neighbors(g.map, t).some((n) => n.owner === PLAYER)) return null;
  g.relics -= COSTS.missionary;
  const p = g.player;
  const target = godById(g, t.owner);
  let chance = 0.35 + p.attrs.charisma / 200 + Math.max(0, p.benevolence) / 500;
  chance += target ? -0.1 - target.attrs.charisma / 400 - t.building * 0.08 : 0.15;
  const ok = rand() < clamp(chance, 0.05, 0.95);
  if (ok) {
    t.owner = PLAYER;
    alert(g, `Your missionaries converted a village${target ? ` of ${target.name}` : ''}.`, 'good');
    if (target && g.relations[target.id]) g.relations[target.id].favor = clamp(g.relations[target.id].favor - 8, -100, 100);
  } else {
    alert(g, 'Your missionaries were turned away.', 'bad');
  }
  return ok;
}

export function recruit(g: GameState) {
  if (g.relics < COSTS.soldier) return false;
  g.relics -= COSTS.soldier;
  g.army++;
  return true;
}

export function crusade(g: GameState, tileId: number): { ok: boolean; text: string } | null {
  const t = g.map.tiles[tileId];
  if (!t.owner || t.owner === PLAYER || g.army < 3) return null;
  if (!neighbors(g.map, t).some((n) => n.owner === PLAYER)) return null;
  const def = godById(g, t.owner)!;
  const rel = g.relations[def.id];
  if (rel?.kin) {
    rel.kin = null;
    rel.terms = null;
    rel.favor = clamp(rel.favor - 50, -100, 100);
    alert(g, `You marched on your own kin. ${def.name} renounces your pantheon.`, 'bad');
  }
  const atk = might(g.player) * (0.8 + rand() * 0.4) + g.army * 4;
  const dScore = might(def) * (0.8 + rand() * 0.4) + (t.wall ? 18 : 0) + t.building * 8 + (t.terrain === 'hill' ? 6 : 0);
  if (rel) rel.favor = clamp(rel.favor - 15, -100, 100);
  if (atk > dScore) {
    const lost = randInt(1, 3);
    g.army = Math.max(0, g.army - lost);
    t.owner = PLAYER;
    t.wall = false;
    t.building = Math.max(0, t.building - 1) as Tile['building'];
    g.stats.won++;
    const text = `The crusade took a village from ${def.name}. ${lost} soldiers fell.`;
    alert(g, text, 'good');
    return { ok: true, text };
  }
  const lost = randInt(2, 5);
  g.army = Math.max(0, g.army - lost);
  g.stats.lost++;
  const text = `The crusade broke against ${def.name}'s defenders. ${lost} soldiers fell.`;
  alert(g, text, 'bad');
  return { ok: false, text };
}

// ---------- pantheon diplomacy ----------
export type Terms = NonNullable<Relation['terms']>;
export interface Proposal { result: 'accepted' | 'countered' | 'rejected'; message: string; counter?: Terms }

export function proposeKinship(g: GameState, godId: string, kin: Kinship, terms: Terms): Proposal {
  const god = godById(g, godId)!;
  const rel = g.relations[godId];
  const gap = might(god) - might(g.player);
  const elder = kin === 'Father' || kin === 'Mother';
  let score = rel.favor
    + (200 - Math.abs(g.player.benevolence - god.benevolence)) / 8
    + terms.titheShare * 1.5
    + (terms.mutualDefense ? 8 : 0)
    + (terms.nonAggression ? 5 : 0)
    - Math.max(0, gap) / 2
    - (elder && gap > 0 ? 20 : 0)
    + randInt(-10, 10);
  if (score >= 40) {
    rel.kin = kin;
    rel.terms = terms;
    rel.favor = clamp(rel.favor + 10, -100, 100);
    if (!g.pantheonName) g.pantheonName = `The House of ${g.player.name.replace(/^The /, '')}`;
    alert(g, `${god.name} accepts. You are now their ${kin}.`, 'sacred');
    return { result: 'accepted', message: `${god.handle} agreed to every term.` };
  }
  if (score >= 18) {
    const counter = { ...terms, titheShare: Math.min(30, terms.titheShare + 10), nonAggression: true };
    return { result: 'countered', message: `${god.handle} will agree if you share ${counter.titheShare}% of your tithes and swear non-aggression.`, counter };
  }
  rel.favor = clamp(rel.favor - 5, -100, 100);
  return { result: 'rejected', message: `${god.handle} refuses. ${god.name} does not see you as ${elder ? 'an elder' : 'family'} yet. Raise their favor with offerings or rituals in their honor.` };
}

export function dissolveKinship(g: GameState, godId: string) {
  const rel = g.relations[godId];
  if (!rel) return;
  rel.kin = null;
  rel.terms = null;
  rel.favor = clamp(rel.favor - 20, -100, 100);
  if (!Object.values(g.relations).some((r) => r.kin)) g.pantheonName = null;
}

export function makeOffering(g: GameState, godId: string) {
  if (g.relics < COSTS.offering) return false;
  g.relics -= COSTS.offering;
  const rel = g.relations[godId];
  rel.favor = clamp(rel.favor + 12, -100, 100);
  return true;
}

// ---------- charity ----------
export function releaseCharity(g: GameState, amount: number, ritual: string) {
  const amt = Math.min(amount, g.charity.pool);
  g.charity.pool -= amt;
  const allocs = g.charity.allocations.filter((a) => a.pct > 0);
  const total = allocs.reduce((s, a) => s + a.pct, 0);
  for (const a of allocs) {
    g.charity.released.unshift({ hour: g.hour, amount: Math.round((amt * a.pct * 100) / total) / 100, charityId: a.id, ritual });
  }
  if (g.charity.released.length > 60) g.charity.released.length = 60;
  alert(g, `Your ritual released $${amt.toFixed(2)} from the charity pool.`, 'good');
}

export function charityName(id: string) {
  return CHARITIES.find((c) => c.id === id)?.name ?? id;
}

// ---------- programmable rituals (mock open API) ----------
export function runSolver(riddleId: number): { answer: string; correct: boolean } {
  const r = RIDDLES[riddleId];
  if (rand() < 0.75) return { answer: r.a[0], correct: true };
  return { answer: pick(['shadow', 'time', 'silence', 'a candle']), correct: false };
}

// ---------- a new game ----------
export interface GodSetup {
  prototypeId: string;
  name: string;
  epithet: string;
  profile: string;
  color: string;
  attrs: Attrs;
  benevolence: number;
  tithe: number;
  sign: Sign;
  relicsLeft: number;
}

export function newGame(s: GodSetup): GameState {
  const proto = PROTOTYPES.find((p) => p.id === s.prototypeId)!;
  const player: God = {
    id: PLAYER, name: s.name.trim() || proto.name, epithet: s.epithet.trim() || proto.epithet, glyph: proto.glyph, color: s.color,
    prototypeId: proto.id, attrs: { ...s.attrs }, benevolence: s.benevolence, tithe: s.tithe, handle: 'you', profile: s.profile.trim() || proto.profile,
  };
  const g: GameState = {
    hour: 7, paused: false, speed: 1,
    planet: { index: 0, name: PLANET_NAMES[0] },
    player, sign: s.sign,
    relics: s.relicsLeft + 120, lifetimeRelics: 0, wisdomPoints: 5, army: 0,
    gods: makeRivals(0, proto.id), relations: {}, pantheonName: null,
    map: genMap(randInt(1, 1e9)),
    rituals: [], omen: null, graceRequests: [], challenge: null, alerts: [], chronicle: [],
    scrolls: [], nextScrollAt: 300,
    charity: {
      plan: 'free',
      allocations: [{ id: 'givedirectly', pct: 40 }, { id: 'amf', pct: 30 }, { id: 'msf', pct: 30 }, { id: 'feeding', pct: 0 }, { id: 'water', pct: 0 }, { id: 'local', pct: 0 }],
      pool: 48213.4,
      released: [],
    },
    solverAttached: false, tierIndex: 0, truthReached: false,
    horoscope: computeHoroscope(1, s.sign, 0),
    stats: { done: 0, failed: 0, won: 0, lost: 0 },
    seq: 0,
  };
  g.relations = Object.fromEntries(g.gods.map((x) => [x.id, { favor: randInt(-20, 25), kin: null, terms: null } as Relation]));
  placeGods(g);
  g.rituals = [makeRitual(g, 'sacrifice'), makeRitual(g, 'meditation'), makeRitual(g, 'jnana'), makeRitual(g, 'dharma'), coachRitual(g)];
  g.graceRequests = [makeGrace(g)];
  const o = OMENS[0];
  g.omen = { id: uid(g, 'o'), ...o, options: [...o.options].sort(() => rand() - 0.5), expires: g.hour + 10 };
  g.scrolls = [0];
  chronicle(g, 'The first word', `${player.name}, ${player.epithet}, speaks for the first time on ${g.planet.name}. You are the only one who heard.`, true);
  alert(g, `${player.name} has chosen you. Perform rituals to give your god strength.`, 'sacred');
  return g;
}
