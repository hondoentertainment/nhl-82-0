import { POSITIONS, SEASON_GAMES, type Position } from '../config/constants';
import type { Player, RosterSlot, SeasonResult } from '../types/game';
import { gradeForWins, scoreFromWins } from './grades';
import { buildSeasonTape } from './seasonTape';

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function skaterScore(player: Player): number {
  const s = player.skater;
  if (!s) return 0.2;
  const points = s.g82 + s.a82;
  const ptsPart = clamp((points - 25) / (140 - 25), 0, 1);
  const goalPart = clamp((s.g82 - 8) / (55 - 8), 0, 1);
  const tierPart = (player.tier - 1) / 4;
  const hofBonus = player.hof ? 0.06 : 0;
  return clamp(ptsPart * 0.48 + goalPart * 0.16 + tierPart * 0.3 + hofBonus, 0, 1);
}

function goalieScore(player: Player): number {
  const g = player.goalie;
  if (!g) return 0.2;
  const gaaPart = clamp((3.6 - g.gaa) / (3.6 - 1.95), 0, 1);
  const svPart = clamp((g.svPct - 0.875) / (0.93 - 0.875), 0, 1);
  const tierPart = (player.tier - 1) / 4;
  const hofBonus = player.hof ? 0.06 : 0;
  return clamp(gaaPart * 0.36 + svPart * 0.28 + tierPart * 0.24 + hofBonus, 0, 1);
}

function toughnessScoreForPlayer(player: Player): number {
  const tierPart = (player.tier - 1) / 4;
  if (player.goalie) {
    return clamp(tierPart * 0.35 + (player.hof ? 0.08 : 0), 0, 1);
  }
  const pim = player.skater?.pim82 ?? 40;
  const pimPart = clamp(pim / 280, 0, 1);
  return clamp(pimPart * 0.7 + tierPart * 0.22 + (player.hof ? 0.04 : 0), 0, 1);
}

export function playerRating(
  player: Player,
  position: Position,
  opts?: { tough?: boolean },
): number {
  const fit = player.positions.includes(position) ? 1 : 0.75;
  const base = opts?.tough
    ? toughnessScoreForPlayer(player)
    : position === 'G'
      ? goalieScore(player)
      : skaterScore(player);
  return clamp(base * fit, 0, 1);
}

export function rosterToughness(roster: RosterSlot[]): number {
  return roster.reduce((sum, slot) => {
    if (!slot.player) return sum;
    const pim = slot.player.skater?.pim82 ?? (slot.player.goalie ? 20 : 40);
    const fighter = slot.player.tier >= 4 && pim >= 140 ? 80 : 0;
    return sum + Math.round(pim * 1.8) + fighter + (slot.player.hof ? 40 : 0);
  }, 0);
}

function strengthFromRatings(
  ratings: { position: Position; player: Player | null; rating: number }[],
): { strength: number; mean: number; min: number; max: number; balance: number } {
  const filled = ratings.filter((r) => r.player).length;
  const mean =
    filled === 0 ? 0 : ratings.reduce((sum, r) => sum + r.rating, 0) / POSITIONS.length;
  const filledRatings = ratings.filter((r) => r.player).map((r) => r.rating);
  const min = filledRatings.length ? Math.min(...filledRatings) : 0;
  const max = filledRatings.length ? Math.max(...filledRatings) : 0;
  const balance = filledRatings.length ? 1 - (max - min) * 0.35 : 0;
  const legendCount = ratings.filter(
    (r) => r.player && (r.player.tier >= 5 || r.player.hof),
  ).length;
  const legendBonus = legendCount * 0.016;
  let strength = clamp(mean * 0.8 + min * 0.08 + balance * 0.04 + legendBonus, 0, 1);
  if (filled === POSITIONS.length && mean >= 0.78 && min >= 0.68 && legendCount >= 5) {
    strength = clamp(strength + 0.05, 0, 1);
  }
  return { strength, mean, min, max, balance };
}

export function rosterStrength(roster: RosterSlot[], opts?: { tough?: boolean }): number {
  const ratings = roster.map((slot) => ({
    position: slot.position,
    player: slot.player,
    rating: slot.player ? playerRating(slot.player, slot.position, opts) : 0,
  }));
  return strengthFromRatings(ratings).strength;
}

function winsFromStrength(strength: number, filled: number): number {
  if (filled < POSITIONS.length) {
    const penalty = (POSITIONS.length - filled) * 12;
    const raw = 22 + strength * 40;
    return clamp(Math.round(raw - penalty), 0, 58);
  }

  const t = clamp(strength, 0, 1);
  let wins: number;
  if (t < 0.45) {
    wins = 22 + (t / 0.45) * 20;
  } else if (t < 0.65) {
    wins = 42 + ((t - 0.45) / 0.2) * 16;
  } else if (t < 0.8) {
    wins = 58 + ((t - 0.65) / 0.15) * 12;
  } else if (t < 0.88) {
    wins = 70 + ((t - 0.8) / 0.08) * 6;
  } else if (t < 0.93) {
    wins = 76 + ((t - 0.88) / 0.05) * 4;
  } else {
    wins = 80 + ((t - 0.93) / 0.07) * 2;
  }

  return clamp(Math.round(wins), 0, SEASON_GAMES);
}

export function simulateSeason(
  roster: RosterSlot[],
  opts?: { tough?: boolean },
): SeasonResult {
  const ratings: { position: Position; player: Player | null; rating: number }[] =
    roster.map((slot) => ({
      position: slot.position,
      player: slot.player,
      rating: slot.player ? playerRating(slot.player, slot.position, opts) : 0,
    }));

  const filled = ratings.filter((r) => r.player).length;
  const { strength, mean, min, max, balance } = strengthFromRatings(ratings);
  const wins = winsFromStrength(strength, filled);
  const losses = SEASON_GAMES - wins;
  const grade = gradeForWins(wins);
  const toughness = rosterToughness(roster);

  const sorted = [...ratings].filter((r) => r.player).sort((a, b) => b.rating - a.rating);
  const best = sorted[0] ?? null;
  const worst = [...ratings].sort((a, b) => a.rating - b.rating)[0] ?? null;

  const strengths: string[] = [];
  const weaknesses: string[] = [];

  if (best?.player) {
    strengths.push(`Best pick: ${best.player.name} at ${best.position}`);
  }
  if (mean >= 0.78) strengths.push('Elite six-man production');
  if (balance >= 0.9) strengths.push('Balanced across the ice');
  if (ratings.some((r) => r.position === 'G' && r.rating >= 0.85)) {
    strengths.push('Elite goaltending');
  }
  if (opts?.tough && toughness >= 1100) {
    strengths.push('Heavyweight intimidation');
  }

  if (filled < POSITIONS.length) {
    weaknesses.push(`Incomplete roster (${filled}/${POSITIONS.length})`);
  }
  if (worst && worst.rating < 0.45) {
    weaknesses.push(
      worst.player
        ? `Weak link: ${worst.position} (${worst.player.name})`
        : `Empty ${worst.position}`,
    );
  }
  if (max - min > 0.35 && filled === POSITIONS.length) {
    weaknesses.push('Lopsided talent distribution');
  }
  if (!strengths.length) strengths.push('A few bright spots to build on');
  if (!weaknesses.length) weaknesses.push('No glaring holes — chase perfection');

  return {
    wins,
    losses,
    score: scoreFromWins(wins),
    gradeId: grade.id,
    gradeLabel: grade.label,
    strengths: strengths.slice(0, 3),
    weaknesses: weaknesses.slice(0, 3),
    bestPickId: best?.player?.id ?? null,
    weakestSlot: worst?.position ?? null,
    toughnessScore: toughness,
    tape: buildSeasonTape(roster, wins),
  };
}
