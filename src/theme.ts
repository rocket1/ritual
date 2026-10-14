import { Platform } from 'react-native';

// Ritual's visual system. Every color in the app reads from `C`, which is a
// live object: picking a theme copies that theme's palette into it and
// re-renders the app. Never copy a color out of `C` into a module-level
// constant, or it will miss theme changes.

export interface Palette {
  bg: string; surface: string; raised: string; sunken: string; line: string; lineSoft: string;
  text: string; muted: string; faint: string;
  gold: string; goldDim: string; onAccent: string; // accent, its pressed state, text drawn on it
  ember: string; jade: string; lapis: string; violet: string; // bad, good, calm, mystic
  land: string; water: string; // map base colors; terrain tints derive from these
  paper: string; paperText: string; paperMuted: string; // placards and scrolls
}

export interface Theme { id: string; name: string; dark: boolean; c: Palette }

export const THEMES: Theme[] = [
  { id: 'lamplight', name: 'Lamplight', dark: true, c: { bg: '#16120F', surface: '#1F1A16', raised: '#29221D', sunken: '#110E0C', line: '#3A3029', lineSoft: '#2C2520', text: '#EFE6D6', muted: '#AA9A84', faint: '#7A6B59', gold: '#D8A94F', goldDim: '#8C6D33', onAccent: '#1A130A', ember: '#D9634A', jade: '#6BB39B', lapis: '#7C97D4', violet: '#B08AC6', land: '#2D2620', water: '#141C26', paper: '#E9DFC9', paperText: '#2A211A', paperMuted: '#6B5A42' } },
  { id: 'obsidian', name: 'Obsidian', dark: true, c: { bg: '#0F1114', surface: '#171A1F', raised: '#20242B', sunken: '#0A0C0E', line: '#2F353E', lineSoft: '#232830', text: '#E6E9EE', muted: '#9AA3B0', faint: '#6C7480', gold: '#C9D2DE', goldDim: '#7D8794', onAccent: '#0F1114', ember: '#E0675A', jade: '#5FC0A0', lapis: '#7FA7E8', violet: '#B79BE6', land: '#23272D', water: '#0D1622', paper: '#E3E6EA', paperText: '#1A1D22', paperMuted: '#59606B' } },
  { id: 'verdigris', name: 'Verdigris', dark: true, c: { bg: '#0E1716', surface: '#14201F', raised: '#1C2B29', sunken: '#091110', line: '#2A3D3A', lineSoft: '#1F302E', text: '#E3EFEA', muted: '#93ABA4', faint: '#647C76', gold: '#D88A55', goldDim: '#8A5634', onAccent: '#140C06', ember: '#E06A55', jade: '#6CC7A8', lapis: '#79A9D6', violet: '#B596CF', land: '#1F2C27', water: '#0A1A22', paper: '#E4E9DD', paperText: '#1C2622', paperMuted: '#56675F' } },
  { id: 'bloodmoon', name: 'Blood Moon', dark: true, c: { bg: '#140C0D', surface: '#1E1213', raised: '#2A191B', sunken: '#0D0708', line: '#3E2629', lineSoft: '#2D1C1E', text: '#F2E3DF', muted: '#B39A95', faint: '#806864', gold: '#E0B060', goldDim: '#8E6B33', onAccent: '#1A0E06', ember: '#F0604D', jade: '#7DB894', lapis: '#8A9BD8', violet: '#C58AB8', land: '#2B1D1C', water: '#130F1C', paper: '#EEDFD6', paperText: '#2C1A18', paperMuted: '#755A53' } },
  { id: 'nightshade', name: 'Nightshade', dark: true, c: { bg: '#110F1A', surface: '#191626', raised: '#221E33', sunken: '#0B0A12', line: '#353050', lineSoft: '#28243C', text: '#ECE8F7', muted: '#A59EC2', faint: '#756F92', gold: '#C9A8F2', goldDim: '#7A63A0', onAccent: '#140F20', ember: '#EE6C7E', jade: '#6CC4AE', lapis: '#7FA2EE', violet: '#D59AE6', land: '#221F31', water: '#0C0F22', paper: '#E7E3F2', paperText: '#1E1A2C', paperMuted: '#5E5878' } },
  { id: 'ashember', name: 'Ash & Ember', dark: true, c: { bg: '#151515', surface: '#1D1D1D', raised: '#272727', sunken: '#0E0E0E', line: '#383838', lineSoft: '#2A2A2A', text: '#EDEDED', muted: '#A3A3A3', faint: '#747474', gold: '#F08A3C', goldDim: '#995420', onAccent: '#1A0D04', ember: '#F2584A', jade: '#69BD8F', lapis: '#7AA3E0', violet: '#B994D6', land: '#272524', water: '#121820', paper: '#ECE8E3', paperText: '#222222', paperMuted: '#5F5F5F' } },
  { id: 'deepsea', name: 'Deep Sea', dark: true, c: { bg: '#0B1320', surface: '#111C2D', raised: '#18263B', sunken: '#070D16', line: '#253852', lineSoft: '#1B2B40', text: '#E2ECF7', muted: '#8FA6C2', faint: '#5E7591', gold: '#4FD1C5', goldDim: '#2B7C75', onAccent: '#04141A', ember: '#F07067', jade: '#66D19A', lapis: '#86A9F0', violet: '#B39BEE', land: '#1A2A2F', water: '#071226', paper: '#DFEAF2', paperText: '#13202E', paperMuted: '#4E647C' } },
  { id: 'jadetemple', name: 'Jade Temple', dark: true, c: { bg: '#0F1510', surface: '#161F17', raised: '#1F2B20', sunken: '#0A0F0A', line: '#2E3F2F', lineSoft: '#223023', text: '#E8EFE2', muted: '#9DAE97', faint: '#6C7D67', gold: '#D9BE5C', goldDim: '#8A7735', onAccent: '#151004', ember: '#E06650', jade: '#72C98C', lapis: '#80A6D9', violet: '#B998CC', land: '#202B1F', water: '#0D1A1F', paper: '#E7EAD8', paperText: '#1E2619', paperMuted: '#5A664F' } },
  { id: 'midnightsun', name: 'Midnight Sun', dark: true, c: { bg: '#12100A', surface: '#1B1810', raised: '#252116', sunken: '#0C0A06', line: '#3A3423', lineSoft: '#2B271A', text: '#F5EFD8', muted: '#B5AA88', faint: '#83795A', gold: '#F2D047', goldDim: '#9A8326', onAccent: '#171303', ember: '#F06A48', jade: '#7CC48E', lapis: '#86A2E2', violet: '#C29AD2', land: '#29251A', water: '#121827', paper: '#F2EBCF', paperText: '#28220F', paperMuted: '#6E6440' } },
  { id: 'hcdark', name: 'High Contrast Dark', dark: true, c: { bg: '#000000', surface: '#0B0B0B', raised: '#1A1A1A', sunken: '#000000', line: '#8A8A8A', lineSoft: '#4D4D4D', text: '#FFFFFF', muted: '#E0E0E0', faint: '#BDBDBD', gold: '#FFD400', goldDim: '#B39500', onAccent: '#000000', ember: '#FF6B5B', jade: '#4DE39B', lapis: '#7DB4FF', violet: '#E0A8FF', land: '#262626', water: '#001433', paper: '#FFFFFF', paperText: '#000000', paperMuted: '#333333' } },
  { id: 'parchment', name: 'Parchment', dark: false, c: { bg: '#F3ECDD', surface: '#FBF6EC', raised: '#EFE6D3', sunken: '#E8DEC9', line: '#CDBEA1', lineSoft: '#DED2BA', text: '#2B2117', muted: '#6E5E4A', faint: '#8F7F69', gold: '#9A4A1E', goldDim: '#6E3313', onAccent: '#FFF7EC', ember: '#B23A26', jade: '#2E7A5E', lapis: '#34589C', violet: '#74468F', land: '#E6D9BC', water: '#B9CFD6', paper: '#FFFDF7', paperText: '#2B2117', paperMuted: '#6E5E4A' } },
  { id: 'marble', name: 'Marble', dark: false, c: { bg: '#F2F3F5', surface: '#FFFFFF', raised: '#ECEEF1', sunken: '#E4E7EB', line: '#C7CCD4', lineSoft: '#DDE1E6', text: '#1C2230', muted: '#566070', faint: '#7A8494', gold: '#2C4F9E', goldDim: '#1D3670', onAccent: '#FFFFFF', ember: '#B83A3A', jade: '#23795C', lapis: '#2C5FB0', violet: '#6A43A8', land: '#E3E1DA', water: '#BFD3E6', paper: '#FFFFFF', paperText: '#1C2230', paperMuted: '#566070' } },
  { id: 'sakura', name: 'Sakura', dark: false, c: { bg: '#FAF0F1', surface: '#FFFAFA', raised: '#F5E6E8', sunken: '#F0DDE0', line: '#DDBFC4', lineSoft: '#ECD6D9', text: '#2E1D24', muted: '#76596A', faint: '#977C8A', gold: '#A3325E', goldDim: '#721F40', onAccent: '#FFF5F8', ember: '#B53C2E', jade: '#2F7A62', lapis: '#3E5DA8', violet: '#7B3F95', land: '#EFE2DA', water: '#C9D9E8', paper: '#FFFFFF', paperText: '#2E1D24', paperMuted: '#76596A' } },
  { id: 'desertnoon', name: 'Desert Noon', dark: false, c: { bg: '#F6EADA', surface: '#FFF7EC', raised: '#F0E0C9', sunken: '#EAD7BC', line: '#D3B994', lineSoft: '#E4CFAF', text: '#2F1F12', muted: '#73583D', faint: '#957A5D', gold: '#B4502A', goldDim: '#7D351B', onAccent: '#FFF6EC', ember: '#A8321F', jade: '#3A7556', lapis: '#36609A', violet: '#7A4A86', land: '#EBD5AF', water: '#A9C7CF', paper: '#FFFBF3', paperText: '#2F1F12', paperMuted: '#73583D' } },
  { id: 'sage', name: 'Sage Garden', dark: false, c: { bg: '#EEF2EA', surface: '#FAFCF8', raised: '#E5ECDF', sunken: '#DDE5D6', line: '#BCC9B2', lineSoft: '#D2DCCA', text: '#1D2619', muted: '#55654D', faint: '#788870', gold: '#3F6B2E', goldDim: '#2A4A1E', onAccent: '#F6FBF2', ember: '#A8402E', jade: '#2F7A5A', lapis: '#36629E', violet: '#6E4A8C', land: '#DCE3CC', water: '#B7D0D8', paper: '#FFFFFF', paperText: '#1D2619', paperMuted: '#55654D' } },
  { id: 'hclight', name: 'High Contrast Light', dark: false, c: { bg: '#FFFFFF', surface: '#FFFFFF', raised: '#F0F0F0', sunken: '#E8E8E8', line: '#4D4D4D', lineSoft: '#8A8A8A', text: '#000000', muted: '#1F1F1F', faint: '#3D3D3D', gold: '#0040C0', goldDim: '#002B80', onAccent: '#FFFFFF', ember: '#B00000', jade: '#006B3C', lapis: '#003FA3', violet: '#5A1A99', land: '#E6E6E6', water: '#B3D1FF', paper: '#FFFFFF', paperText: '#000000', paperMuted: '#1F1F1F' } },
];

/** The live palette. Read colors from here at render time. */
export const C: Palette = { ...THEMES[0].c };

export const F = {
  display: 'Marcellus_400Regular',
  wordmark: 'Cinzel_700Bold',
  body: 'Spectral_400Regular',
  bodyItalic: 'Spectral_400Regular_Italic',
  bodyBold: 'Spectral_600SemiBold',
  mono: 'IBMPlexMono_400Regular',
  monoBold: 'IBMPlexMono_500Medium',
};

export const S = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 36 };

// ---------- text size ----------
export const TEXT_SIZES = [
  { id: 'default', label: 'Default', scale: 1 },
  { id: 'large', label: 'Large', scale: 1.15 },
  { id: 'larger', label: 'Larger', scale: 1.3 },
  { id: 'largest', label: 'Largest', scale: 1.45 },
];
// Desktop screens sit further from the eye, so the web starts one step up.
const DEFAULT_TEXT = Platform.OS === 'web' ? 'large' : 'default';

let scale = TEXT_SIZES.find((t) => t.id === DEFAULT_TEXT)!.scale;
/** Scale a font size (or a width that holds text) by the reader's text size. */
export const fs = (n: number) => Math.round(n * scale);

// ---------- switching ----------
let themeId = THEMES[0].id;
let textId = DEFAULT_TEXT;
let version = 0;
const listeners = new Set<() => void>();

function load(key: string) {
  try {
    return Platform.OS === 'web' ? window.localStorage.getItem(key) : null;
  } catch {
    return null;
  }
}
function save(key: string, value: string) {
  try {
    if (Platform.OS === 'web') window.localStorage.setItem(key, value);
  } catch {
    // storage blocked (private window): the choice just won't persist
  }
}

function apply(id: string) {
  const t = THEMES.find((x) => x.id === id) ?? THEMES[0];
  themeId = t.id;
  Object.assign(C, t.c);
}
function applyText(id: string) {
  const t = TEXT_SIZES.find((x) => x.id === id) ?? TEXT_SIZES[0];
  textId = t.id;
  scale = t.scale;
}
apply(load('ritual.theme') ?? themeId);
applyText(load('ritual.text') ?? textId);

function emit() {
  version++;
  listeners.forEach((l) => l());
}
export function setTheme(id: string) {
  apply(id);
  save('ritual.theme', themeId);
  emit();
}
export function setTextSize(id: string) {
  applyText(id);
  save('ritual.text', textId);
  emit();
}
export const currentTheme = () => THEMES.find((t) => t.id === themeId)!;
export const currentTextSize = () => textId;
export function subscribeTheme(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}
export const themeVersion = () => version;

// ---------- color helpers ----------
export function alpha(hex: string, a: number) {
  const n = parseInt(hex.slice(1, 7), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}
/** Blend two #rrggbb colors; t=0 gives a, t=1 gives b. */
export function mix(a: string, b: string, t: number) {
  const x = parseInt(a.slice(1, 7), 16);
  const y = parseInt(b.slice(1, 7), 16);
  const ch = (sh: number) => Math.round(((x >> sh) & 255) * (1 - t) + ((y >> sh) & 255) * t);
  return `#${((ch(16) << 16) | (ch(8) << 8) | ch(0)).toString(16).padStart(6, '0')}`;
}

// Colors for the five ritual orders, derived from the live palette.
export const KIND_COLOR: Record<string, string> = Object.defineProperties({} as Record<string, string>, {
  sacrifice: { get: () => mix(C.ember, C.gold, 0.45), enumerable: true },
  meditation: { get: () => C.lapis, enumerable: true },
  jnana: { get: () => C.violet, enumerable: true },
  dharma: { get: () => C.jade, enumerable: true },
  honor: { get: () => mix(C.gold, C.text, 0.15), enumerable: true },
  custom: { get: () => C.muted, enumerable: true },
  rival: { get: () => C.ember, enumerable: true },
});

export const TONE_COLOR = {
  get info() { return C.muted; },
  get good() { return C.jade; },
  get bad() { return C.ember; },
  get sacred() { return C.gold; },
};
