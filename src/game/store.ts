import { useSyncExternalStore } from 'react';
import type { GameState } from './types';

// A tiny mutable store. The game is a single in-memory object (no backend yet);
// actions mutate it through `act`, which bumps a version so React re-renders.

let game: GameState | null = null;
let version = 0;
const listeners = new Set<() => void>();

function emit() {
  version++;
  listeners.forEach((l) => l());
}
function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function setGame(g: GameState | null) {
  game = g;
  emit();
}

export function act<T>(fn: (g: GameState) => T): T {
  const out = fn(game!);
  emit();
  return out;
}

export function useGame(): GameState | null {
  useSyncExternalStore(subscribe, () => version, () => version);
  return game;
}

/** For screens that only render once a game exists. */
export function useG(): GameState {
  return useGame()!;
}

// While a ritual or duel is open, the world clock holds still so deadlines
// don't expire mid-rite.
let holds = 0;
export function holdClock(on: boolean) {
  holds = Math.max(0, holds + (on ? 1 : -1));
}
export function clockHeld() {
  return holds > 0;
}
