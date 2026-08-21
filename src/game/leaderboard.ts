import { LEADERBOARD_MAX, LEADERBOARD_MIN_WINS, STORAGE_KEYS } from '../config/constants';
import type { LeaderboardEntry } from '../types/game';

export function loadLeaderboard(): LeaderboardEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.leaderboard);
    if (!raw) return [];
    const list = JSON.parse(raw) as LeaderboardEntry[];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export function saveLeaderboard(entries: LeaderboardEntry[]): void {
  localStorage.setItem(
    STORAGE_KEYS.leaderboard,
    JSON.stringify(entries.slice(0, LEADERBOARD_MAX)),
  );
}

export function tryAddLeaderboardEntry(entry: LeaderboardEntry): boolean {
  if (entry.wins < LEADERBOARD_MIN_WINS || entry.mode !== 'classic') return false;
  const list = loadLeaderboard();
  list.push(entry);
  list.sort((a, b) => b.wins - a.wins || a.createdAt.localeCompare(b.createdAt));
  saveLeaderboard(list);
  return list.slice(0, LEADERBOARD_MAX).some((e) => e.id === entry.id);
}
