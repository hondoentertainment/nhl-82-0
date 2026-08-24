import { beforeAll, describe, expect, it } from 'vitest';
import { PLAYERS } from '../data/players';
import { setPool } from '../data/pool';
import { getAvailablePlayers, spinDraw, spinWithEligibility } from './spin';
import { mulberry32 } from './rng';

describe('era lock spins', () => {
  beforeAll(() => {
    setPool(PLAYERS);
  });

  it('keeps every draw inside the locked decade', () => {
    const rand = mulberry32(82);
    for (let i = 0; i < 20; i++) {
      const spin = spinDraw(rand, { decade: '1990s' });
      expect(spin.decade).toBe('1990s');
    }
  });

  it('finds an eligible 1990s roster spin', () => {
    const spin = spinWithEligibility(mulberry32(1990), ['C'], new Set(), 40, null, '1990s');
    expect(spin.decade).toBe('1990s');
    expect(getAvailablePlayers(spin, ['C'], new Set()).length).toBeGreaterThan(0);
  });
});
