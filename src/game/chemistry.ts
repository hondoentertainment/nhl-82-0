import { FRANCHISE_BY_ID } from '../data/franchises';
import type { Player, RosterSlot } from '../types/game';

export interface ChemistryResult {
  bonus: number;
  notes: string[];
}

function clubName(player: Player): string {
  return FRANCHISE_BY_ID[player.franchiseId]?.shortName ?? player.franchiseId;
}

function slot(roster: RosterSlot[], position: RosterSlot['position']): Player | null {
  return roster.find((s) => s.position === position)?.player ?? null;
}

/**
 * Same-sweater / same-era bonuses for the forward line and D-pair.
 * Capped so chemistry flavors the 82 without replacing talent.
 */
export function lineChemistry(roster: RosterSlot[]): ChemistryResult {
  const lw = slot(roster, 'LW');
  const c = slot(roster, 'C');
  const rw = slot(roster, 'RW');
  const ld = slot(roster, 'LD');
  const rd = slot(roster, 'RD');

  let bonus = 0;
  const notes: string[] = [];

  const forwards = [lw, c, rw].filter((p): p is Player => !!p);
  if (forwards.length === 3) {
    const clubs = new Set(forwards.map((p) => p.franchiseId));
    const decades = new Set(forwards.map((p) => p.decade));
    if (clubs.size === 1) {
      bonus += 0.035;
      notes.push(`First line: all ${clubName(forwards[0]!)}`);
    } else if (clubs.size === 2) {
      bonus += 0.016;
      notes.push('First line: two share a sweater');
    }
    if (decades.size === 1 && clubs.size > 1) {
      bonus += 0.018;
      notes.push(`First line: all ${forwards[0]!.decade}`);
    } else if (decades.size === 2 && clubs.size > 1) {
      bonus += 0.008;
    }
  }

  if (ld && rd) {
    if (ld.franchiseId === rd.franchiseId) {
      bonus += 0.024;
      notes.push(`D-pair: ${clubName(ld)} tandem`);
    } else if (ld.decade === rd.decade) {
      bonus += 0.012;
      notes.push(`D-pair: ${ld.decade} pairing`);
    }
  }

  return { bonus: Math.min(bonus, 0.06), notes: notes.slice(0, 3) };
}
