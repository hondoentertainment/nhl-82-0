import type { Player } from '../types/game';

/** Soft cap in millions — NHL-style budget across 6 slots */
export const SALARY_CAP_M = 88;

const TIER_SALARY: Record<1 | 2 | 3 | 4 | 5, number> = {
  1: 8,
  2: 11,
  3: 14,
  4: 18,
  5: 22,
};

export function playerSalary(player: Player): number {
  return TIER_SALARY[player.tier] + (player.hof ? 4 : 0);
}

export function rosterSpend(players: (Player | null | undefined)[]): number {
  return players.reduce((sum, p) => sum + (p ? playerSalary(p) : 0), 0);
}

export function formatSalary(millions: number): string {
  return `$${millions}M`;
}
