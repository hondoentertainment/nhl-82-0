import { STORAGE_KEYS } from '../config/constants';
import type { DailyRecord } from '../types/game';
import { previousUtcDateKey } from './career';
import { loadDailyRecord, utcDateKey } from './daily';

export const DAILY_HISTORY_DAYS = 14;

export interface DailyHistoryEntry {
  dateKey: string;
  wins: number;
  losses: number;
  gradeLabel: string;
  rosterNames?: string[];
}

/** Oldest → newest UTC date keys covering the last `days` calendar days. */
export function utcDateKeysBack(days: number, from = utcDateKey()): string[] {
  const keys: string[] = new Array(days);
  let key = from;
  for (let i = days - 1; i >= 0; i--) {
    keys[i] = key;
    key = previousUtcDateKey(key);
  }
  return keys;
}

function parseHistory(raw: string | null): DailyHistoryEntry[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as DailyHistoryEntry[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (e) =>
        e &&
        typeof e.dateKey === 'string' &&
        typeof e.wins === 'number' &&
        typeof e.losses === 'number' &&
        typeof e.gradeLabel === 'string',
    );
  } catch {
    return [];
  }
}

function fromDailyRecord(record: DailyRecord | null): DailyHistoryEntry | null {
  if (!record?.completed || record.wins == null || record.losses == null || !record.gradeLabel) {
    return null;
  }
  return {
    dateKey: record.dateKey,
    wins: record.wins,
    losses: record.losses,
    gradeLabel: record.gradeLabel,
    rosterNames: record.rosterNames,
  };
}

function pruneToWindow(entries: DailyHistoryEntry[], from = utcDateKey()): DailyHistoryEntry[] {
  const allowed = new Set(utcDateKeysBack(DAILY_HISTORY_DAYS, from));
  return entries
    .filter((e) => allowed.has(e.dateKey))
    .sort((a, b) => a.dateKey.localeCompare(b.dateKey));
}

function readHistoryRaw(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEYS.dailyHistory);
  } catch {
    return null;
  }
}

export function loadDailyHistory(from = utcDateKey()): DailyHistoryEntry[] {
  const stored = pruneToWindow(parseHistory(readHistoryRaw()), from);
  const migrated = fromDailyRecord(loadDailyRecord());
  if (!migrated || stored.some((e) => e.dateKey === migrated.dateKey)) {
    return stored;
  }
  return pruneToWindow([...stored, migrated], from);
}

export function saveDailyHistory(entries: DailyHistoryEntry[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.dailyHistory, JSON.stringify(entries));
  } catch {
    /* storage blocked */
  }
}

export function recordDailyHistory(
  entry: DailyHistoryEntry,
  from = utcDateKey(),
): DailyHistoryEntry[] {
  const next = pruneToWindow(
    [...loadDailyHistory(from).filter((e) => e.dateKey !== entry.dateKey), entry],
    from,
  );
  saveDailyHistory(next);
  return next;
}

export interface DailyHistoryDay {
  dateKey: string;
  entry: DailyHistoryEntry | null;
  isToday: boolean;
}

export function dailyHistoryGrid(from = utcDateKey()): DailyHistoryDay[] {
  const byDate = new Map(loadDailyHistory(from).map((e) => [e.dateKey, e]));
  return utcDateKeysBack(DAILY_HISTORY_DAYS, from).map((dateKey) => ({
    dateKey,
    entry: byDate.get(dateKey) ?? null,
    isToday: dateKey === from,
  }));
}

export function formatHistoryDay(dateKey: string): string {
  const d = new Date(`${dateKey}T12:00:00.000Z`);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
}
