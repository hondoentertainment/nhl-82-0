import { STORAGE_KEYS, type GameMode } from '../config/constants';
import type { SeasonResult } from '../types/game';
import { utcDateKey } from './daily';

export interface ModeCareer {
  plays: number;
  bestWins: number;
}

export interface CareerStats {
  gamesPlayed: number;
  bestWins: number;
  bestGradeLabel: string;
  totalWins: number;
  byMode: Partial<Record<GameMode, ModeCareer>>;
  dailyStreak: number;
  bestDailyStreak: number;
  lastDailyDateKey: string | null;
  updatedAt: string;
}

function emptyCareer(): CareerStats {
  return {
    gamesPlayed: 0,
    bestWins: 0,
    bestGradeLabel: '—',
    totalWins: 0,
    byMode: {},
    dailyStreak: 0,
    bestDailyStreak: 0,
    lastDailyDateKey: null,
    updatedAt: new Date(0).toISOString(),
  };
}

export function loadCareer(): CareerStats {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.career);
    if (!raw) return emptyCareer();
    const parsed = JSON.parse(raw) as CareerStats;
    return {
      ...emptyCareer(),
      ...parsed,
      byMode: parsed.byMode ?? {},
    };
  } catch {
    return emptyCareer();
  }
}

export function saveCareer(career: CareerStats): void {
  localStorage.setItem(STORAGE_KEYS.career, JSON.stringify(career));
}

export function previousUtcDateKey(dateKey: string): string {
  const d = new Date(`${dateKey}T12:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

export function nextDailyStreak(
  career: CareerStats,
  dateKey: string,
): { dailyStreak: number; bestDailyStreak: number; lastDailyDateKey: string } {
  if (career.lastDailyDateKey === dateKey) {
    return {
      dailyStreak: career.dailyStreak,
      bestDailyStreak: career.bestDailyStreak,
      lastDailyDateKey: dateKey,
    };
  }

  const streak =
    career.lastDailyDateKey === previousUtcDateKey(dateKey)
      ? career.dailyStreak + 1
      : 1;

  return {
    dailyStreak: streak,
    bestDailyStreak: Math.max(career.bestDailyStreak, streak),
    lastDailyDateKey: dateKey,
  };
}

export interface RecordCareerInput {
  mode: GameMode;
  result: SeasonResult;
  dateKey?: string | null;
}

export function recordCareerResult(input: RecordCareerInput): CareerStats {
  const career = loadCareer();
  const modeStats = career.byMode[input.mode] ?? { plays: 0, bestWins: 0 };
  const nextMode: ModeCareer = {
    plays: modeStats.plays + 1,
    bestWins: Math.max(modeStats.bestWins, input.result.wins),
  };

  let dailyPatch: Pick<
    CareerStats,
    'dailyStreak' | 'bestDailyStreak' | 'lastDailyDateKey'
  > = {
    dailyStreak: career.dailyStreak,
    bestDailyStreak: career.bestDailyStreak,
    lastDailyDateKey: career.lastDailyDateKey,
  };

  if (input.mode === 'daily' && input.dateKey) {
    dailyPatch = nextDailyStreak(career, input.dateKey);
  }

  const bestWins = Math.max(career.bestWins, input.result.wins);
  const next: CareerStats = {
    gamesPlayed: career.gamesPlayed + 1,
    bestWins,
    bestGradeLabel:
      input.result.wins >= career.bestWins
        ? input.result.gradeLabel
        : career.bestGradeLabel,
    totalWins: career.totalWins + input.result.wins,
    byMode: { ...career.byMode, [input.mode]: nextMode },
    ...dailyPatch,
    updatedAt: new Date().toISOString(),
  };

  saveCareer(next);
  return next;
}

export function displayDailyStreak(career = loadCareer()): number {
  const today = utcDateKey();
  if (career.lastDailyDateKey === today) return career.dailyStreak;
  if (career.lastDailyDateKey === previousUtcDateKey(today)) return career.dailyStreak;
  return 0;
}
