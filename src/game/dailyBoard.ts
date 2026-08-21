import { utcDateKey } from './daily';

export interface GlobalDailyEntry {
  id: string;
  wins: number;
  losses: number;
  gradeLabel: string;
  rosterNames: string[];
  createdAt: string;
}

function attemptIdKey(dateKey: string): string {
  return `nhl820_daily_attempt_${dateKey}`;
}

export function getOrCreateDailyAttemptId(dateKey = utcDateKey()): string {
  try {
    const key = attemptIdKey(dateKey);
    const existing = localStorage.getItem(key);
    if (existing) return existing;
    const id = `d_${dateKey}_${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem(key, id);
    return id;
  } catch {
    return `d_${dateKey}_anon`;
  }
}

export async function fetchDailyBoard(dateKey = utcDateKey()): Promise<{
  entries: GlobalDailyEntry[];
  error?: string;
}> {
  try {
    const res = await fetch(`/api/daily?date=${encodeURIComponent(dateKey)}`);
    const data = (await res.json()) as {
      entries?: GlobalDailyEntry[];
      error?: string;
    };
    if (!res.ok) {
      return { entries: [], error: data.error ?? 'Board unavailable' };
    }
    return { entries: data.entries ?? [] };
  } catch {
    return { entries: [], error: 'Board unavailable' };
  }
}

export async function submitDailyBoard(input: {
  dateKey: string;
  wins: number;
  losses: number;
  gradeLabel: string;
  rosterNames: string[];
}): Promise<{ rank?: number; error?: string }> {
  try {
    const res = await fetch('/api/daily', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...input,
        id: getOrCreateDailyAttemptId(input.dateKey),
      }),
    });
    const data = (await res.json()) as { rank?: number; error?: string };
    if (!res.ok) return { error: data.error ?? 'Submit failed' };
    return { rank: data.rank };
  } catch {
    return { error: 'Submit failed' };
  }
}
