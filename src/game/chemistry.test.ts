import { describe, expect, it } from 'vitest';
import { PLAYERS } from '../data/players';
import { setPool } from '../data/pool';
import type { RosterSlot } from '../types/game';
import { lineChemistry } from './chemistry';

setPool(PLAYERS);

function emptyRoster(): RosterSlot[] {
  return (['LW', 'C', 'RW', 'LD', 'RD', 'G'] as const).map((position) => ({
    position,
    player: null,
  }));
}

describe('lineChemistry', () => {
  it('rewards a same-sweater forward line and D-pair', () => {
    const habs = PLAYERS.filter((p) => p.franchiseId === 'mtl' && p.decade === '1970s');
    const lw = habs.find((p) => p.positions.includes('LW'))!;
    const c = habs.find((p) => p.positions.includes('C'))!;
    const rw = habs.find((p) => p.positions.includes('RW'))!;
    const ld = habs.find((p) => p.positions.includes('LD'))!;
    const rd = habs.find((p) => p.positions.includes('RD'))!;
    const g = habs.find((p) => p.positions.includes('G'))!;
    const result = lineChemistry([
      { position: 'LW', player: lw },
      { position: 'C', player: c },
      { position: 'RW', player: rw },
      { position: 'LD', player: ld },
      { position: 'RD', player: rd },
      { position: 'G', player: g },
    ]);
    expect(result.bonus).toBeGreaterThan(0);
    expect(result.notes.some((n) => n.includes('First line'))).toBe(true);
    expect(result.notes.some((n) => n.includes('D-pair'))).toBe(true);
  });

  it('returns nothing for an empty roster', () => {
    expect(lineChemistry(emptyRoster()).bonus).toBe(0);
  });
});
