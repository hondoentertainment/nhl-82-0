import { DECADES, type Decade } from '../config/constants';
import { FRANCHISES, franchisesForDecade } from '../data/franchises';
import { PLAYERS, playersForSpin } from '../data/players';
import type { Player, SpinResult } from '../types/game';
import { pickRandom } from './rng';

const POPULATED_KEYS = new Set(PLAYERS.map((p) => `${p.franchiseId}|${p.decade}`));

function populatedFranchises(decade: Decade) {
  return franchisesForDecade(decade).filter((f) => POPULATED_KEYS.has(`${f.id}|${decade}`));
}

export function spinDraw(rand: () => number, opts?: { decade?: Decade }): SpinResult {
  const decadeCandidates = DECADES.filter((d) => populatedFranchises(d).length > 0);
  const decade = opts?.decade ?? pickRandom(decadeCandidates.length ? decadeCandidates : DECADES, rand);
  const pool = populatedFranchises(decade);
  const franchise = pickRandom(pool.length ? pool : FRANCHISES, rand);
  return { decade, franchiseId: franchise.id };
}

export function spinNewFranchise(
  rand: () => number,
  decade: Decade,
  excludeFranchiseId: string,
): SpinResult {
  const pool = populatedFranchises(decade).filter((f) => f.id !== excludeFranchiseId);
  if (!pool.length) {
    return spinDraw(rand);
  }
  const franchise = pickRandom(pool, rand);
  return { decade, franchiseId: franchise.id };
}

export function getAvailablePlayers(
  spin: SpinResult,
  openPositions: string[],
  takenIds: Set<string>,
): Player[] {
  return playersForSpin(spin.franchiseId, spin.decade)
    .filter((p) => !takenIds.has(p.id))
    .filter((p) => p.positions.some((pos) => openPositions.includes(pos)))
    .sort((a, b) => b.tier - a.tier || a.name.localeCompare(b.name));
}

export function decadesForFranchise(franchiseId: string): Decade[] {
  return DECADES.filter((d) => POPULATED_KEYS.has(`${franchiseId}|${d}`));
}

export function spinDecadeForFranchise(
  rand: () => number,
  franchiseId: string,
  excludeDecade?: Decade,
): SpinResult {
  let decades = decadesForFranchise(franchiseId);
  if (excludeDecade) {
    const filtered = decades.filter((d) => d !== excludeDecade);
    if (filtered.length) decades = filtered;
  }
  const decade = pickRandom(decades.length ? decades : DECADES, rand);
  return { decade, franchiseId };
}

/** Prefer spins that have at least one eligible player for open slots */
export function spinWithEligibility(
  rand: () => number,
  openPositions: string[],
  takenIds: Set<string>,
  attempts = 40,
  lockedFranchiseId?: string | null,
): SpinResult {
  let best: SpinResult | null = null;
  let bestCount = -1;
  for (let i = 0; i < attempts; i++) {
    const spin = lockedFranchiseId
      ? spinDecadeForFranchise(rand, lockedFranchiseId)
      : spinDraw(rand);
    const count = getAvailablePlayers(spin, openPositions, takenIds).length;
    if (count > bestCount) {
      best = spin;
      bestCount = count;
    }
    if (count > 0 && rand() < 0.65) return spin;
  }
  if (best) return best;
  return lockedFranchiseId
    ? spinDecadeForFranchise(rand, lockedFranchiseId)
    : spinDraw(rand);
}
