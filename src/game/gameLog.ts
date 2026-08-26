import { GAME_LOG_MAX, STORAGE_KEYS, type GameMode } from '../config/constants';
import type { SeasonTapeGame } from '../types/game';

export interface GameRecord {
  id: string;
  mode: GameMode;
  wins: number;
  losses: number;
  gradeLabel: string;
  score: number;
  rosterNames: string[];
  createdAt: string;
  dateKey?: string | null;
  challengeCode?: string | null;
  lockedFranchiseId?: string | null;
  lockedDecade?: string | null;
  tape?: SeasonTapeGame[];
}

export function loadGameLog(): GameRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.gameLog);
    if (!raw) return [];
    const list = JSON.parse(raw) as GameRecord[];
    if (!Array.isArray(list)) return [];
    return list.filter((row) => row && typeof row.id === 'string' && typeof row.mode === 'string');
  } catch {
    return [];
  }
}

function persist(list: GameRecord[]): void {
  const trimmed = list.slice(0, GAME_LOG_MAX);
  try {
    localStorage.setItem(STORAGE_KEYS.gameLog, JSON.stringify(trimmed));
  } catch {
    try {
      localStorage.setItem(
        STORAGE_KEYS.gameLog,
        JSON.stringify(trimmed.slice(0, Math.max(50, Math.floor(GAME_LOG_MAX / 2)))),
      );
    } catch {
      /* quota still exceeded — keep memory-only */
    }
  }
}

export function appendGameRecord(entry: GameRecord): GameRecord[] {
  const next = [entry, ...loadGameLog().filter((row) => row.id !== entry.id)];
  persist(next);
  return loadGameLog();
}

export function formatGameLogDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso.slice(0, 10);
  return d.toISOString().slice(0, 10);
}
