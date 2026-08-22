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

  it('gives every franchise-era enough depth and all six positions', () => {
    const byKey = new Map<string, typeof PLAYERS>();
    for (const p of PLAYERS) {
      const key = `${p.franchiseId}|${p.decade}`;
      const list = byKey.get(key) ?? [];
      list.push(p);
      byKey.set(key, list);
    }

    for (const [key, pool] of byKey) {
      expect(pool.length, `${key} depth`).toBeGreaterThanOrEqual(8);
      const covered = new Set(pool.flatMap((p) => p.positions));
      for (const pos of POSITIONS) {
        expect(covered.has(pos), `${key} missing ${pos}`).toBe(true);
      }
    }
  });

  it('does not put goalies in the skater helper', () => {
    for (const p of PLAYERS) {
      if (p.positions.includes('G')) {
        expect(p.goalie, p.id).toBeTruthy();
        expect(p.skater, p.id).toBeUndefined();
      } else {
        expect(p.skater, p.id).toBeTruthy();
      }
    }
  });
});
