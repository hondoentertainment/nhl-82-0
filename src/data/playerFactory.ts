import type { Decade, Position } from '../config/constants';
import type { Player } from '../types/game';

export type Tier = 1 | 2 | 3 | 4 | 5;

export function slug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export function skater(
  name: string,
  franchiseId: string,
  decade: Decade,
  positions: Position[],
  tier: Tier,
  hof: boolean,
  g82: number,
  a82: number,
  pim82: number,
): Player {
  return {
    id: `${slug(name)}-${franchiseId}-${decade}`,
    name,
    franchiseId,
    decade,
    positions,
    tier,
    hof,
    skater: { g82, a82, pim82 },
  };
}

export function goalie(
  name: string,
  franchiseId: string,
  decade: Decade,
  tier: Tier,
  hof: boolean,
  gaa: number,
  svPct: number,
): Player {
  return {
    id: `${slug(name)}-${franchiseId}-${decade}`,
    name,
    franchiseId,
    decade,
    positions: ['G'],
    tier,
    hof,
    goalie: { gaa, svPct },
  };
}
