import type { Decade, GameMode, Position } from '../config/constants';
import { dailyRng, utcDateKey } from './daily';
import { allowsRedraw } from './draftRules';
import { mulberry32 } from './rng';
import { getAvailablePlayers, spinWithEligibility } from './spin';
import type { SpinResult } from '../types/game';

/**
 * Seeded modes must produce the same spins for everyone, so this is the single
 * source of truth for "what does round N draw?" — shared by the client and by
 * server-side verification of submitted daily runs.
 */
export interface SpinRequest {
  mode: GameMode | null;
  round: number;
  randSeed: number;
  dateKey?: string | null;
  openPositions: Position[];
  drafted: Set<string>;
  lockedFranchiseId?: string | null;
  lockedDecade?: Decade | null;
}

export function isSeededMode(mode: GameMode | null): boolean {
  return mode === 'daily' || mode === 'challenge';
}

function rngFor(req: SpinRequest): () => number {
  if (req.mode === 'daily') {
    const rand = dailyRng(req.dateKey ?? utcDateKey());
    for (let i = 0; i < req.round * 17; i++) rand();
    return rand;
  }
  if (req.mode === 'challenge') {
    const rand = mulberry32(req.randSeed);
    for (let i = 0; i < req.round * 17; i++) rand();
    return rand;
  }
  return mulberry32(req.randSeed + req.round * 1009);
}

export function spinForRound(req: SpinRequest): SpinResult {
  const rand = rngFor(req);
  const { openPositions, drafted, lockedFranchiseId, lockedDecade } = req;

  let result = spinWithEligibility(
    rand,
    openPositions,
    drafted,
    40,
    lockedFranchiseId,
    lockedDecade,
  );

  if (
    !allowsRedraw(req.mode) &&
    getAvailablePlayers(result, openPositions, drafted).length === 0
  ) {
    for (let i = 0; i < 60; i++) {
      result = spinWithEligibility(
        rand,
        openPositions,
        drafted,
        20,
        lockedFranchiseId,
        lockedDecade,
      );
      if (getAvailablePlayers(result, openPositions, drafted).length > 0) break;
    }
  }

  return result;
}
