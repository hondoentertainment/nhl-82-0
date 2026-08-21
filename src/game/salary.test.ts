import { describe, expect, it } from 'vitest';
import type { Player } from '../types/game';
import { formatSalary, playerSalary, rosterSpend, SALARY_CAP_M } from './salary';

function makePlayer(tier: 1 | 2 | 3 | 4 | 5, hof = false): Player {
  return {
    id: `p-${tier}-${hof}`,
    name: 'Test',
    franchiseId: 'edm',
    decade: '1980s',
    positions: ['C'],
    tier,
    hof,
    skater: { g82: 40, a82: 60, pim82: 40 },
  };
}

describe('salary', () => {
  it('prices tiers and HOF bonus', () => {
    expect(playerSalary(makePlayer(1))).toBe(8);
    expect(playerSalary(makePlayer(5))).toBe(22);
    expect(playerSalary(makePlayer(5, true))).toBe(26);
  });

  it('sums roster spend', () => {
    expect(rosterSpend([makePlayer(5), makePlayer(1), null])).toBe(30);
  });

  it('keeps the soft cap below six max stars', () => {
    const sixStars = Array.from({ length: 6 }, () => makePlayer(5, true));
    expect(rosterSpend(sixStars)).toBeGreaterThan(SALARY_CAP_M);
  });

  it('allows a balanced mid-tier six under the cap', () => {
    const mid = Array.from({ length: 6 }, () => makePlayer(3));
    expect(rosterSpend(mid)).toBeLessThanOrEqual(SALARY_CAP_M);
  });

  it('formats millions', () => {
    expect(formatSalary(88)).toBe('$88M');
  });
});
