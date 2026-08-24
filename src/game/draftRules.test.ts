import { describe, expect, it } from 'vitest';
import {
  allowsRedraw,
  canRespinEmptyPool,
  canUndoLastPick,
  emptyPoolKind,
  isFairnessMode,
} from './draftRules';

describe('draftRules', () => {
  it('treats Daily and Challenge as fairness modes', () => {
    expect(isFairnessMode('daily')).toBe(true);
    expect(isFairnessMode('challenge')).toBe(true);
    expect(allowsRedraw('classic')).toBe(true);
    expect(allowsRedraw('daily')).toBe(false);
    expect(canUndoLastPick('classic')).toBe(true);
    expect(canUndoLastPick('tough')).toBe(true);
    expect(canUndoLastPick('eralock')).toBe(true);
    expect(canUndoLastPick('daily')).toBe(false);
    expect(allowsRedraw('eralock')).toBe(true);
  });

  it('flags empty and over-cap pools', () => {
    expect(
      emptyPoolKind({
        mode: 'classic',
        hasSpin: true,
        spinning: false,
        availableCount: 0,
        affordableCount: 0,
      }),
    ).toBe('no-fits');
    expect(
      emptyPoolKind({
        mode: 'salary',
        hasSpin: true,
        spinning: false,
        availableCount: 3,
        affordableCount: 0,
      }),
    ).toBe('over-cap');
    expect(canRespinEmptyPool('classic', 'no-fits')).toBe(true);
    expect(canRespinEmptyPool('daily', 'no-fits')).toBe(false);
  });
});
