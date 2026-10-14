export type Attr = 'wisdom' | 'power' | 'charisma' | 'evidence';
export type Attrs = Record<Attr, number>;

export type Sign =
  | 'Aries' | 'Taurus' | 'Gemini' | 'Cancer' | 'Leo' | 'Virgo'
  | 'Libra' | 'Scorpio' | 'Sagittarius' | 'Capricorn' | 'Aquarius' | 'Pisces';

export interface God {
  id: string;
  name: string;
  epithet: string;
  glyph: string;
  color: string;
  prototypeId: string;
  attrs: Attrs;
  benevolence: number; // -100 wrathful .. 100 benevolent
  tithe: number; // percent of followers' devotion collected daily
  handle?: string; // the (mock) player who created this god
  parentId?: string; // set for offspring born of a schism
  profile: string;
}

export type Terrain = 'plain' | 'forest' | 'hill' | 'desert' | 'water';

export interface Tile {
  id: number;
  x: number;
  y: number;
  terrain: Terrain;
  pop: number;
  owner: string | null;
  wall: boolean;
  building: 0 | 1 | 2 | 3; // none, church, temple, cathedral
}

export type RitualKind = 'sacrifice' | 'meditation' | 'jnana' | 'dharma' | 'honor';

export type GameSpec =
  | { type: 'walk'; laps: number }
  | { type: 'boulder' }
  | { type: 'still'; seconds: number; place: string }
  | { type: 'riddle'; riddleId: number }
  | { type: 'placard'; placardId: number; place: string }
  | { type: 'presence'; place: string; minutes: number }
  | { type: 'story'; prompt: string }
  | { type: 'checklist'; items: string[] }
  | { type: 'chant'; hymn: string };

export interface RitualOption {
  label: string;
  game: GameSpec;
}

export interface Ritual {
  id: string;
  kind: RitualKind;
  title: string;
  description: string;
  relics: number;
  issuedAt: number;
  deadline: number;
  status: 'offered' | 'queued' | 'done' | 'failed' | 'faded';
  options: RitualOption[];
  source: 'god' | 'custom' | 'rival';
  forGodId?: string; // rival rituals are performed in another god's honor
  assignedBy?: string;
  earned?: number;
  doneAt?: number;
}

export interface Omen {
  id: string;
  text: string;
  options: { label: string; correct: boolean }[];
  hint: string;
  expires: number;
}

export interface GraceRequest {
  id: string;
  ritualTitle: string;
  pilgrim: string; // anonymised
  hiddenScore: number; // 0..100, revealed only after a decision
  hour: number;
}

export interface Challenge {
  id: string;
  godId: string;
  tileId: number;
  expires: number;
}

export type AlertTone = 'info' | 'good' | 'bad' | 'sacred';
export interface Alert {
  id: string;
  hour: number;
  text: string;
  tone: AlertTone;
  seen: boolean;
}

export interface MythEvent {
  id: string;
  hour: number;
  title: string;
  text: string;
  major: boolean;
}

export type Kinship = 'Brother' | 'Sister' | 'Father' | 'Mother' | 'Son' | 'Daughter' | 'Consort';

export interface Relation {
  favor: number; // -100..100
  kin: Kinship | null;
  terms: { titheShare: number; nonAggression: boolean; mutualDefense: boolean } | null;
}

export interface Horoscope {
  day: number;
  aspect: string;
  reading: string;
  favored: RitualKind;
  luckyAttr: Attr;
  luck: number; // 0..100
  riteUsed: boolean;
}

export interface CharityState {
  plan: 'free' | 'devotee';
  allocations: { id: string; pct: number }[];
  pool: number;
  released: { hour: number; amount: number; charityId: string; ritual: string }[];
}

export interface Tier {
  name: string;
  minTiles: number;
  blurb: string;
}

export interface GameState {
  hour: number;
  paused: boolean;
  speed: 1 | 4;
  planet: { index: number; name: string };
  player: God;
  sign: Sign;
  relics: number;
  lifetimeRelics: number;
  wisdomPoints: number;
  army: number;
  gods: God[];
  relations: Record<string, Relation>;
  pantheonName: string | null;
  map: { w: number; h: number; tiles: Tile[] };
  rituals: Ritual[];
  omen: Omen | null;
  graceRequests: GraceRequest[];
  challenge: Challenge | null;
  alerts: Alert[];
  chronicle: MythEvent[];
  scrolls: number[];
  nextScrollAt: number;
  charity: CharityState;
  solverAttached: boolean;
  tierIndex: number;
  truthReached: boolean;
  horoscope: Horoscope;
  stats: { done: number; failed: number; won: number; lost: number };
  seq: number;
}
