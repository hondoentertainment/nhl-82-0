import { POSITIONS, SEASON_GAMES } from '../config/constants';
import { FRANCHISES } from '../data/franchises';
import type { RosterSlot, SeasonTapeGame, TapeKind } from '../types/game';
import { hashString, mulberry32, pickRandom } from './rng';

export const TAPE_MIN = 5;
export const TAPE_MAX = 8;

const KIND_LABEL: Record<TapeKind, string> = {
  shutout: 'shutout',
  blowout: 'blowout',
  'one-goal': 'one-goal',
  overtime: 'OT',
};

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function intIn(rand: () => number, min: number, max: number): number {
  return min + Math.floor(rand() * (max - min + 1));
}

function opponentPool(roster: RosterSlot[]) {
  const own = new Set(
    roster.map((s) => s.player?.franchiseId).filter((id): id is string => Boolean(id)),
  );
  const away = FRANCHISES.filter((f) => !own.has(f.id));
  return away.length ? away : FRANCHISES;
}

function pickKinds(count: number, winPct: number): TapeKind[] {
  const kinds: TapeKind[] = ['one-goal', 'shutout'];
  if (count >= 3) kinds.push(winPct >= 0.5 ? 'blowout' : 'one-goal');
  if (count >= 4) kinds.push('overtime');
  const fill: TapeKind[] =
    winPct >= 0.62 ? ['shutout', 'blowout', 'overtime', 'one-goal'] : ['one-goal', 'overtime', 'blowout', 'shutout'];
  let i = 0;
  while (kinds.length < count) {
    kinds.push(fill[i % fill.length]!);
    i += 1;
  }
  return kinds.slice(0, count);
}

function scoreFor(kind: TapeKind, won: boolean, rand: () => number): { gf: number; ga: number } {
  if (kind === 'shutout') {
    const goals = intIn(rand, 1, 5);
    return won ? { gf: goals, ga: 0 } : { gf: 0, ga: goals };
  }
  if (kind === 'blowout') {
    const margin = intIn(rand, 4, 6);
    const low = intIn(rand, 0, 2);
    return won ? { gf: low + margin, ga: low } : { gf: low, ga: low + margin };
  }
  const ga = intIn(rand, 1, 4);
  const gf = won ? ga + 1 : Math.max(0, ga - 1);
  return { gf, ga };
}

function pickGameNumbers(count: number, rand: () => number): number[] {
  const nums: number[] = [];
  const used = new Set<number>();
  const bucket = SEASON_GAMES / count;
  for (let i = 0; i < count; i++) {
    const lo = Math.floor(i * bucket) + 1;
    const hi = Math.min(SEASON_GAMES, Math.floor((i + 1) * bucket));
    let n = lo + Math.floor(rand() * Math.max(1, hi - lo + 1));
    let guard = 0;
    while (used.has(n) && guard < SEASON_GAMES) {
      n = (n % SEASON_GAMES) + 1;
      guard += 1;
    }
    used.add(n);
    nums.push(n);
  }
  return nums.sort((a, b) => a - b);
}

export function formatTapeLine(game: SeasonTapeGame): string {
  const label = game.kind === 'shutout' && !game.won ? 'shut out' : KIND_LABEL[game.kind];
  return `Game ${game.game} · ${game.gf}-${game.ga} ${label} vs ${game.opponent}`;
}

export function buildSeasonTape(roster: RosterSlot[], wins: number): SeasonTapeGame[] {
  const filled = roster.filter((s) => s.player).length;
  if (filled === 0) return [];

  const ids = roster.map((s) => s.player?.id ?? '-').join('|');
  const rand = mulberry32(hashString(`nhl820-tape-${ids}-${wins}`));
  const winPct = clamp(wins / SEASON_GAMES, 0, 1);

  const count =
    filled < POSITIONS.length
      ? clamp(filled + 1, 2, TAPE_MIN)
      : TAPE_MIN + Math.floor(rand() * (TAPE_MAX - TAPE_MIN + 1));

  const games = pickGameNumbers(count, rand);
  const kinds = pickKinds(count, winPct);
  const opponents = opponentPool(roster);

  return games.map((game, i) => {
    const kind = kinds[i]!;
    const won =
      kind === 'blowout'
        ? winPct >= 0.48 || rand() < winPct
        : kind === 'shutout'
          ? winPct >= 0.4 || rand() < winPct
          : rand() < Math.max(0.18, winPct);
    const { gf, ga } = scoreFor(kind, won, rand);
    return {
      game,
      kind,
      gf,
      ga,
      opponent: pickRandom(opponents, rand).shortName,
      won,
    };
  });
}
