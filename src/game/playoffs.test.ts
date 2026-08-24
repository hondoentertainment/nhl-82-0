import { describe, expect, it } from 'vitest';
import { POSITIONS } from '../config/constants';
import { PLAYERS } from '../data/players';
import type { Player, RosterSlot } from '../types/game';
import { CUP_QUALIFY_WINS, simulateCup } from './playoffs';
import { playerRating, simulateSeason } from './simulate';

function bestAt(position: (typeof POSITIONS)[number]): Player {
  const pool = PLAYERS.filter((p) => p.positions.includes(position));
  return [...pool].sort((a, b) => playerRating(b, position) - playerRating(a, position))[0]!;
}

function eliteRoster(): RosterSlot[] {
  return POSITIONS.map((position) => ({ position, player: bestAt(position) }));
}

describe('simulateCup', () => {
  it('does not qualify rebuilding seasons', () => {
    const cup = simulateCup(eliteRoster(), { regularWins: CUP_QUALIFY_WINS - 1, seed: 1 });
    expect(cup.qualified).toBe(false);
    expect(cup.champion).toBe(false);
    expect(cup.series).toHaveLength(0);
  });

  it('is deterministic for a seed and finishes 1–4 series', () => {
    const roster = eliteRoster();
    const a = simulateCup(roster, { regularWins: 70, seed: 8200 });
    const b = simulateCup(roster, { regularWins: 70, seed: 8200 });
    expect(a).toEqual(b);
    expect(a.qualified).toBe(true);
    expect(a.series.length).toBeGreaterThanOrEqual(1);
    expect(a.series.length).toBeLessThanOrEqual(4);
    if (a.champion) {
      expect(a.roundsWon).toBe(4);
      expect(a.series.every((s) => s.wins === 4)).toBe(true);
    } else {
      const last = a.series[a.series.length - 1]!;
      expect(last.losses).toBe(4);
    }
  });

  it('keeps Daily scoring on the 82-game record', () => {
    const result = simulateSeason(eliteRoster());
    expect(result.wins + result.losses).toBe(82);
    const cup = simulateCup(eliteRoster(), { regularWins: result.wins, seed: 9 });
    expect(result.wins).toBeGreaterThanOrEqual(CUP_QUALIFY_WINS);
    expect(cup.qualified).toBe(true);
  });
});
