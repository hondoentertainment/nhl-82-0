import type { DailyRecord } from '../types/game';
import { STORAGE_KEYS } from '../config/constants';
import { hashString, mulberry32 } from './rng';

export function utcDateKey(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

export function dailyRng(dateKey = utcDateKey()): () => number {
  return mulberry32(hashString(`nhl820-daily-${dateKey}`));
}

export function loadDailyRecord(): DailyRecord | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.daily);
    if (!raw) return null;
    return JSON.parse(raw) as DailyRecord;
  } catch {
    return null;
  }
}

export function saveDailyRecord(record: DailyRecord): void {
  localStorage.setItem(STORAGE_KEYS.daily, JSON.stringify(record));
}

export function isDailyCompletedToday(): boolean {
  const rec = loadDailyRecord();
  return Boolean(rec && rec.dateKey === utcDateKey() && rec.completed);
}
