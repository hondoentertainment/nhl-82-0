import type { Player } from '../types/game';

/**
 * The player table is the largest module and is only needed once a draft
 * starts, so it loads on demand. Call `ensurePool()` before starting a game.
 */

let players: Player[] | null = null;
let byFranchiseDecade: Map<string, Player[]> | null = null;
let keys: Set<string> | null = null;
let loading: Promise<void> | null = null;

function notLoaded(): never {
  throw new Error('Player pool not loaded — await ensurePool() first');
}

export function setPool(next: Player[]): void {
  players = next;
  const index = new Map<string, Player[]>();
  const populated = new Set<string>();
  for (const player of next) {
    const key = `${player.franchiseId}|${player.decade}`;
    populated.add(key);
    const bucket = index.get(key);
    if (bucket) bucket.push(player);
    else index.set(key, [player]);
  }
  byFranchiseDecade = index;
  keys = populated;
}

export function isPoolLoaded(): boolean {
  return players !== null;
}

export async function ensurePool(): Promise<void> {
  if (players) return;
  loading ??= import('./players')
    .then((mod) => setPool(mod.PLAYERS))
    .catch((err) => {
      loading = null;
      throw err;
    });
  await loading;
}

export function allPlayers(): Player[] {
  return players ?? notLoaded();
}

export function populatedKeys(): Set<string> {
  return keys ?? notLoaded();
}

export function playersForSpin(franchiseId: string, decade: string): Player[] {
  if (!byFranchiseDecade) notLoaded();
  return byFranchiseDecade.get(`${franchiseId}|${decade}`) ?? [];
}
