import { STORAGE_KEYS } from '../config/constants';

export interface RematchEntry {
  id: string;
  wins: number;
  losses: number;
  gradeLabel: string;
  rosterNames: string[];
  createdAt: string;
  label: string;
}

type RematchStore = Record<string, RematchEntry[]>;

function readStore(): RematchStore {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.rematch);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as RematchStore;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function writeStore(store: RematchStore): void {
  try {
    localStorage.setItem(STORAGE_KEYS.rematch, JSON.stringify(store));
  } catch {
    /* storage blocked */
  }
}

export function loadRematch(code: string): RematchEntry[] {
  const list = readStore()[code.toUpperCase()] ?? [];
  return [...list].sort((a, b) => b.wins - a.wins || a.createdAt.localeCompare(b.createdAt));
}

export function recordRematch(code: string, entry: Omit<RematchEntry, 'id' | 'createdAt'>): RematchEntry[] {
  const key = code.toUpperCase();
  const store = readStore();
  const next: RematchEntry = {
    ...entry,
    id: `${key}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    createdAt: new Date().toISOString(),
  };
  store[key] = [...(store[key] ?? []), next];
  writeStore(store);
  return loadRematch(key);
}
