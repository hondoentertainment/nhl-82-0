import { DECADES, GRADE_BANDS } from '../config/constants';
import { FRANCHISES } from '../data/franchises';
import type { CupResult, CupSeries, RosterSlot } from '../types/game';
import { mulberry32 } from './rng';
import { rosterStrength } from './simulate';

export const CUP_QUALIFY_WINS = GRADE_BANDS.find((b) => b.id === 'playoffs')?.minWins ?? 44;

const ROUNDS = [
  { name: 'First Round', opp: 0.56 },
  { name: 'Second Round', opp: 0.64 },
  { name: 'Conference Final', opp: 0.72 },
  { name: 'Stanley Cup Final', opp: 0.8 },
] as const;

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function opponentName(rand: () => number): string {
  const franchise = FRANCHISES[Math.floor(rand() * FRANCHISES.length)]!;
  const decade = DECADES[Math.floor(rand() * DECADES.length)]!;
  return `${franchise.name} (${decade})`;
}

function playSeries(
  myStr: number,
  oppStr: number,
  rand: () => number,
): { wins: number; losses: number } {
  let wins = 0;
  let losses = 0;
  const pWin = clamp(0.22 + 0.56 * (myStr / (myStr + oppStr)), 0.18, 0.84);
  while (wins < 4 && losses < 4) {
    if (rand() < pWin) wins += 1;
    else losses += 1;
  }
  return { wins, losses };
}

export function simulateCup(
  roster: RosterSlot[],
  input: { regularWins: number; seed: number; tough?: boolean },
): CupResult {
  if (input.regularWins < CUP_QUALIFY_WINS) {
    return { qualified: false, champion: false, roundsWon: 0, series: [] };
  }

  const myStr = rosterStrength(roster, { tough: input.tough });
  const rand = mulberry32((input.seed ^ 0x82c0) >>> 0);
  const series: CupSeries[] = [];
  let roundsWon = 0;

  for (const round of ROUNDS) {
    const result = playSeries(myStr, round.opp, rand);
    series.push({
      round: round.name,
      opponent: opponentName(rand),
      wins: result.wins,
      losses: result.losses,
    });
    if (result.wins < 4) {
      return { qualified: true, champion: false, roundsWon, series };
    }
    roundsWon += 1;
  }

  return { qualified: true, champion: true, roundsWon, series };
}
