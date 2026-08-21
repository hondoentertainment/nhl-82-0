import { describe, expect, it } from 'vitest';
import { DECADES, POSITIONS } from '../config/constants';
import { FRANCHISES } from './franchises';
import { PLAYERS } from './players';

describe('player coverage', () => {
  it('covers every current NHL franchise', () => {
    const ids = new Set(PLAYERS.map((p) => p.franchiseId));
    for (const franchise of FRANCHISES) {
      expect(ids.has(franchise.id), franchise.id).toBe(true);
    }
  });

  it('has unique player ids', () => {
    const ids = PLAYERS.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('has every position represented in every decade', () => {
    for (const decade of DECADES) {
      const pool = PLAYERS.filter((p) => p.decade === decade);
      for (const pos of POSITIONS) {
        expect(
          pool.some((p) => p.positions.includes(pos)),
          `${decade} ${pos}`,
        ).toBe(true);
      }
    }
  });
});
