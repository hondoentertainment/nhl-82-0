import { describe, expect, it } from 'vitest';
import { POSITIONS } from '../config/constants';
import { PLAYERS } from '../data/players';
import type { Player, RosterSlot } from '../types/game';
import { playerRating, simulateSeason } from './simulate';

function bestAt(position: (typeof POSITIONS)[number]): Player {
  const pool = PLAYERS.filter((p) => p.positions.includes(position));
  return [...pool].sort(
    (a, b) => playerRating(b, position) - playerRating(a, position),
  )[0]!;
}

describe('simulateSeason', () => {
  it('penalizes incomplete rosters', () => {
    const roster: RosterSlot[] = POSITIONS.map((position, i) => ({
      position,
      player: i < 2 ? bestAt(position) : null,
    }));
    const result = simulateSeason(roster);
    expect(result.wins).toBeLessThan(58);
    expect(result.weaknesses.some((w) => w.includes('Incomplete'))).toBe(true);
  });

  it('gives elite full rosters dynasty-or-better territory', () => {
    const roster: RosterSlot[] = POSITIONS.map((position) => ({
      position,
      player: bestAt(position),
    }));
    const result = simulateSeason(roster);
    expect(result.wins).toBeGreaterThanOrEqual(70);
    expect(result.losses).toBe(82 - result.wins);
  });
});
