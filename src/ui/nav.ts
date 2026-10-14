import { createContext, useContext } from 'react';

export type Tab = 'temple' | 'rituals' | 'map' | 'pantheon' | 'myth' | 'wisdom' | 'charity';

export const TABS: { id: Tab; label: string; glyph: string }[] = [
  { id: 'temple', label: 'Temple', glyph: '⌂' },
  { id: 'rituals', label: 'Rituals', glyph: '◎' },
  { id: 'map', label: 'Map', glyph: '⬡' },
  { id: 'pantheon', label: 'Pantheon', glyph: '⁂' },
  { id: 'myth', label: 'Myth', glyph: '☾' },
  { id: 'wisdom', label: 'Wisdom', glyph: '✧' },
  { id: 'charity', label: 'Charity', glyph: '♡' },
];

export interface Ui {
  go: (t: Tab) => void;
  openRitual: (id: string) => void;
  openDuel: () => void;
  wide: boolean;
}

export const UiContext = createContext<Ui>({ go: () => {}, openRitual: () => {}, openDuel: () => {}, wide: true });
export const useUi = () => useContext(UiContext);
