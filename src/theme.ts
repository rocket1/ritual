// Ritual visual system: lamp-lit stone. Bone text on smoke-umber ground,
// gilded ochre for the sacred (relics, your god), ember for disasters,
// verdigris for blessings. Marcellus carries the inscriptions; Spectral reads
// like a liturgy; Plex Mono keeps the ledger (relics, hours, odds).

export const C = {
  bg: '#16120F',
  surface: '#1F1A16',
  raised: '#29221D',
  sunken: '#110E0C',
  line: '#3A3029',
  lineSoft: '#2C2520',
  text: '#EFE6D6',
  muted: '#AA9A84',
  faint: '#716352',
  gold: '#D8A94F',
  goldDim: '#8C6D33',
  ember: '#CF5B3E',
  jade: '#63A58F',
  lapis: '#6E8BCB',
  violet: '#A67FBC',
  water: '#1B2430',
};

export const F = {
  display: 'Marcellus_400Regular',
  body: 'Spectral_400Regular',
  bodyItalic: 'Spectral_400Regular_Italic',
  bodyBold: 'Spectral_600SemiBold',
  mono: 'IBMPlexMono_400Regular',
  monoBold: 'IBMPlexMono_500Medium',
};

export const S = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 36 };

// Kind colors for the five ritual orders and other semantic marks.
export const KIND_COLOR: Record<string, string> = {
  sacrifice: '#C98A5A',
  meditation: '#6E8BCB',
  jnana: '#A67FBC',
  dharma: '#63A58F',
  honor: '#D8A94F',
  custom: '#B9A88F',
  rival: '#CF5B3E',
};

export function alpha(hex: string, a: number) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}
