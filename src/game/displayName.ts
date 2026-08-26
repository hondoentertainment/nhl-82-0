import { STORAGE_KEYS } from '../config/constants';

const NAME_RE = /^[A-Za-z0-9][A-Za-z0-9 .'-]{0,18}[A-Za-z0-9]?$/;

export function sanitizeDisplayName(raw: string): string | null {
  const name = raw.trim().replace(/\s+/g, ' ');
  if (name.length < 2 || name.length > 20) return null;
  if (!NAME_RE.test(name)) return null;
  return name;
}

export function loadDisplayName(): string {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.displayName);
    if (!raw) return '';
    return sanitizeDisplayName(raw) ?? '';
  } catch {
    return '';
  }
}

export function saveDisplayName(raw: string): string | null {
  const name = sanitizeDisplayName(raw);
  if (!name) return null;
  localStorage.setItem(STORAGE_KEYS.displayName, name);
  return name;
}
