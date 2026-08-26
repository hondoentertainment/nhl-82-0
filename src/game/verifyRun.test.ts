import { describe, expect, it } from 'vitest';
import { POSITIONS } from '../config/constants';
import { PLAYERS } from '../data/players';
import { setPool } from '../data/pool';
import { spinForRound } from './draftSequence';
import { getAvailablePlayers } from './spin';
import { parsePicks, verifyChallengeRun, verifyDailyRun, type SubmittedPick } from './verifyRun';
import type { RosterSlot } from '../types/game';

setPool(PLAYERS);

function playDaily(dateKey: string): SubmittedPick[] {
  const roster: RosterSlot[] = POSITIONS.map((position) => ({ position, player: null }));
  const picks: SubmittedPick[] = [];

  for (let round = 1; round <= POSITIONS.length; round++) {
    const open = roster.filter((s) => !s.player).map((s) => s.position);
    const drafted = new Set(roster.filter((s) => s.player).map((s) => s.player!.id));
    const spin = spinForRound({
      mode: 'daily',
      round,
      randSeed: 0,
      dateKey,
      openPositions: open,
      drafted,
    });
    const available = getAvailablePlayers(spin, open, drafted);
    if (!available.length) throw new Error(`No pick available in round ${round}`);

    const player = available[0]!;
    const position = player.positions.find((p) => open.includes(p))!;
    roster.find((s) => s.position === position)!.player = player;
    picks.push({ position, playerId: player.id });
  }

  return picks;
}

const DATES = ['2026-01-15', '2026-04-02', '2026-08-15', '2026-11-30'];

describe('daily draft invariants', () => {
  it('never offers the same player twice in one run', () => {
    for (const dateKey of DATES) {
      const picks = playDaily(dateKey);
      expect(new Set(picks.map((p) => p.playerId)).size).toBe(picks.length);
    }
  });

  it('fills all six positions', () => {
    for (const dateKey of DATES) {
      const picks = playDaily(dateKey);
      expect(new Set(picks.map((p) => p.position)).size).toBe(POSITIONS.length);
    }
  });

  it('draws the same spins for the same date', () => {
    expect(playDaily('2026-08-15')).toEqual(playDaily('2026-08-15'));
  });
});

describe('verifyDailyRun', () => {
  it('accepts a genuinely drafted run and recomputes its record', () => {
    const dateKey = '2026-08-15';
    const out = verifyDailyRun(dateKey, playDaily(dateKey));
    expect(out.ok).toBe(true);
    if (!out.ok) return;
    expect(out.result.wins + out.result.losses).toBe(82);
    expect(out.roster.every((s) => s.player)).toBe(true);
  });

  it('rejects a roster that was never drawn on that date', () => {
    const dateKey = '2026-08-15';
    const forged: SubmittedPick[] = [
      { position: 'LW', playerId: 'wayne-gretzky-edm-1980s' },
      { position: 'C', playerId: 'mario-lemieux-pit-1980s' },
      { position: 'RW', playerId: 'guy-lafleur-mtl-1970s' },
      { position: 'LD', playerId: 'bobby-orr-bos-1970s' },
      { position: 'RD', playerId: 'nicklas-lidstrom-det-2000s' },
      { position: 'G', playerId: 'patrick-roy-mtl-1980s' },
    ];
    const out = verifyDailyRun(dateKey, forged);
    expect(out.ok).toBe(false);
  });

  it('rejects a run that swaps in a different player mid-draft', () => {
    const dateKey = '2026-04-02';
    const picks = playDaily(dateKey);
    const tampered = [...picks];
    tampered[4] = { position: picks[4]!.position, playerId: 'wayne-gretzky-edm-1980s' };
    const out = verifyDailyRun(dateKey, tampered);
    expect(out.ok).toBe(false);
  });

  it('rejects a run replayed against the wrong date', () => {
    const picks = playDaily('2026-01-15');
    expect(verifyDailyRun('2026-08-15', picks).ok).toBe(false);
  });

  it('rejects an incomplete roster', () => {
    const picks = playDaily('2026-08-15').slice(0, 5);
    const out = verifyDailyRun('2026-08-15', picks);
    expect(out.ok).toBe(false);
    if (out.ok) return;
    expect(out.error).toMatch(/6 picks/);
  });
});

function playChallenge(randSeed: number): SubmittedPick[] {
  const roster: RosterSlot[] = POSITIONS.map((position) => ({ position, player: null }));
  const picks: SubmittedPick[] = [];
  for (let round = 1; round <= POSITIONS.length; round++) {
    const open = roster.filter((s) => !s.player).map((s) => s.position);
    const drafted = new Set(roster.filter((s) => s.player).map((s) => s.player!.id));
    const spin = spinForRound({
      mode: 'challenge',
      round,
      randSeed,
      openPositions: open,
      drafted,
    });
    const available = getAvailablePlayers(spin, open, drafted);
    if (!available.length) throw new Error(`No pick available in round ${round}`);
    const player = available[0]!;
    const position = player.positions.find((p) => open.includes(p))!;
    roster.find((s) => s.position === position)!.player = player;
    picks.push({ position, playerId: player.id });
  }
  return picks;
}

describe('verifyChallengeRun', () => {
  it('accepts a genuine challenge draft', () => {
    const picks = playChallenge(424242);
    const out = verifyChallengeRun(424242, picks);
    expect(out.ok).toBe(true);
    if (!out.ok) return;
    expect(out.roster.every((s) => s.player)).toBe(true);
  });

  it('rejects the same picks against a different seed', () => {
    const picks = playChallenge(424242);
    expect(verifyChallengeRun(999999, picks).ok).toBe(false);
  });
});

describe('parsePicks', () => {
  it('accepts a well-formed payload', () => {
    const picks = playDaily('2026-08-15');
    expect(parsePicks(picks)).toEqual(picks);
  });

  it('rejects malformed payloads', () => {
    expect(parsePicks(null)).toBeNull();
    expect(parsePicks([])).toBeNull();
    expect(parsePicks([{ position: 'DH', playerId: 'x' }])).toBeNull();
    expect(parsePicks(POSITIONS.map((position) => ({ position, playerId: 42 })))).toBeNull();
  });
});
