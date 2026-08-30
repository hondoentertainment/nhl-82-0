import { DECADES, type Decade } from '../config/constants';
import { FRANCHISES, franchisesForDecade } from '../data/franchises';
import { playersForSpin, populatedKeys } from '../data/pool';
import type { Player, SpinResult } from '../types/game';
import { pickRandom } from './rng';

export type PlayerFilter = (player: Player) => boolean;

function populatedFranchises(decade: Decade, filter?: PlayerFilter) {
  const keys = populatedKeys();
  return franchisesForDecade(decade).filter((f) => {
    if (!filter) return keys.has(`${f.id}|${decade}`);
    return playersForSpin(f.id, decade).some(filter);
  });
}

export function decadesWithPlayers(): Decade[] {
  return DECADES.filter((d) => populatedFranchises(d).length > 0);
}

export function spinDraw(
  rand: () => number,
  opts?: { decade?: Decade; filter?: PlayerFilter },
): SpinResult {
  const decadeCandidates = DECADES.filter((d) => populatedFranchises(d, opts?.filter).length > 0);
  const decade = opts?.decade ?? pickRandom(decadeCandidates.length ? decadeCandidates : DECADES, rand);
  const pool = populatedFranchises(decade, opts?.filter);
  const franchise = pickRandom(pool.length ? pool : FRANCHISES, rand);
  return { decade, franchiseId: franchise.id };
}

export function spinNewFranchise(
  rand: () => number,
  decade: Decade,
  excludeFranchiseId: string,
  filter?: PlayerFilter,
): SpinResult {
  const pool = populatedFranchises(decade, filter).filter((f) => f.id !== excludeFranchiseId);
  if (!pool.length) {
    return spinDraw(rand, { filter });
  }
  const franchise = pickRandom(pool, rand);
  return { decade, franchiseId: franchise.id };
}

export function getAvailablePlayers(
  spin: SpinResult,
  openPositions: string[],
  takenIds: Set<string>,
  filter?: PlayerFilter,
): Player[] {
  return playersForSpin(spin.franchiseId, spin.decade)
    .filter((p) => !takenIds.has(p.id))
    .filter((p) => p.positions.some((pos) => openPositions.includes(pos)))
    .filter((p) => (filter ? filter(p) : true))
    .sort((a, b) => b.tier - a.tier || a.name.localeCompare(b.name));
}

export function decadesForFranchise(franchiseId: string, filter?: PlayerFilter): Decade[] {
  const keys = populatedKeys();
  return DECADES.filter((d) => {
    if (!filter) return keys.has(`${franchiseId}|${d}`);
    return playersForSpin(franchiseId, d).some(filter);
  });
}

export function spinDecadeForFranchise(
  rand: () => number,
  franchiseId: string,
  excludeDecade?: Decade,
  filter?: PlayerFilter,
): SpinResult {
  let decades = decadesForFranchise(franchiseId, filter);
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
  lockedDecade?: Decade | null,
  filter?: PlayerFilter,
): SpinResult {
  let best: SpinResult | null = null;
  let bestCount = -1;
  for (let i = 0; i < attempts; i++) {
    const spin = lockedFranchiseId
      ? spinDecadeForFranchise(rand, lockedFranchiseId, undefined, filter)
      : spinDraw(rand, { decade: lockedDecade ?? undefined, filter });
    const count = getAvailablePlayers(spin, openPositions, takenIds, filter).length;
    if (count > bestCount) {
      best = spin;
      bestCount = count;
    }
    if (count > 0 && rand() < 0.65) return spin;
  }
  if (best) return best;
  return lockedFranchiseId
    ? spinDecadeForFranchise(rand, lockedFranchiseId, undefined, filter)
    : spinDraw(rand, { decade: lockedDecade ?? undefined, filter });
}
