import type { GameMode } from '../config/constants';

/** Daily and Challenge: same spins for everyone, so no skips or extra chances. */
export function isFairnessMode(mode: GameMode | null): boolean {
  return mode === 'daily' || mode === 'challenge';
}

export function allowsRedraw(mode: GameMode | null): boolean {
  return !isFairnessMode(mode);
}

export function canUndoLastPick(mode: GameMode | null): boolean {
  return (
    mode === 'classic' ||
    mode === 'iceiq' ||
    mode === 'salary' ||
    mode === 'franchise' ||
    mode === 'tough' ||
    mode === 'eralock'
  );
}

export type EmptyPoolKind = 'none' | 'no-fits' | 'over-cap';

export function emptyPoolKind(input: {
  mode: GameMode | null;
  hasSpin: boolean;
  spinning: boolean;
  availableCount: number;
  affordableCount: number;
}): EmptyPoolKind {
  if (!input.hasSpin || input.spinning) return 'none';
  if (input.availableCount === 0) return 'no-fits';
  if (input.mode === 'salary' && input.affordableCount === 0) return 'over-cap';
  return 'none';
}

export function canRespinEmptyPool(mode: GameMode | null, kind: EmptyPoolKind): boolean {
  return kind !== 'none' && allowsRedraw(mode);
}

export function emptyPoolCopy(kind: EmptyPoolKind, noRedraw: boolean): string {
  if (kind === 'over-cap') {
    return 'Nobody on this spin fits the remaining salary cap.';
  }
  if (noRedraw) {
    return 'This franchise and decade have no legal picks for your open positions. This mode does not allow a redraw.';
  }
  return 'This franchise and decade have no legal picks for your open positions.';
}
