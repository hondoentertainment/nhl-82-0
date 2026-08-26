import { describe, expect, it } from 'vitest';
import { POSITIONS } from '../config/constants';
import { PLAYERS } from '../data/players';
import type { Player, RosterSlot } from '../types/game';
import { playerRating } from './simulate';
import { TAPE_MAX, TAPE_MIN, buildSeasonTape, formatTapeLine } from './seasonTape';

function bestAt(position: (typeof POSITIONS)[number]): Player {
  const pool = PLAYERS.filter((p) => p.positions.includes(position));
  return [...pool].sort(
    (a, b) => playerRating(b, position) - playerRating(a, position),
  )[0]!;
}

function eliteRoster(): RosterSlot[] {
  return POSITIONS.map((position) => ({ position, player: bestAt(position) }));
}

describe('season tape', () => {
  it('builds 5–8 unique games for a full roster', () => {
    const tape = buildSeasonTape(eliteRoster(), 74);
    expect(tape.length).toBeGreaterThanOrEqual(TAPE_MIN);
    expect(tape.length).toBeLessThanOrEqual(TAPE_MAX);
    const games = tape.map((g) => g.game);
    expect(new Set(games).size).toBe(tape.length);
    expect(Math.min(...games)).toBeGreaterThanOrEqual(1);
    expect(Math.max(...games)).toBeLessThanOrEqual(82);
  });

  it('is deterministic for the same roster and win total', () => {
    const roster = eliteRoster();
    expect(buildSeasonTape(roster, 70)).toEqual(buildSeasonTape(roster, 70));
  });

  it('changes when the win total changes', () => {
    const roster = eliteRoster();
    expect(buildSeasonTape(roster, 40)).not.toEqual(buildSeasonTape(roster, 74));
  });

  it('returns no tape for an empty roster', () => {
    const roster: RosterSlot[] = POSITIONS.map((position) => ({ position, player: null }));
    expect(buildSeasonTape(roster, 0)).toEqual([]);
  });

  it('formats a headline line', () => {
    expect(
      formatTapeLine({
        game: 14,
        kind: 'shutout',
        gf: 3,
        ga: 0,
        opponent: 'Bruins',
        won: true,
      }),
    ).toBe('Game 14 · 3-0 shutout vs Bruins');
    expect(
      formatTapeLine({
        game: 22,
        kind: 'shutout',
        gf: 0,
        ga: 4,
        opponent: 'Leafs',
        won: false,
      }),
    ).toBe('Game 22 · 0-4 shut out vs Leafs');
  });
});
