import type { SubmittedPick } from './verifyRun';

export interface ChallengeBoardEntry {
  id: string;
  wins: number;
  losses: number;
  gradeLabel: string;
  rosterNames: string[];
  createdAt: string;
  displayName?: string;
}

export async function fetchChallengeBoard(code: string): Promise<{
  entries: ChallengeBoardEntry[];
  error?: string;
}> {
  try {
    const res = await fetch(`/api/challenge-board?code=${encodeURIComponent(code)}`);
    const data = (await res.json()) as {
      entries?: ChallengeBoardEntry[];
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

function attemptIdKey(code: string): string {
  return `nhl820_challenge_attempt_${code}`;
}

export function getOrCreateChallengeAttemptId(code: string): string {
  try {
    const key = attemptIdKey(code);
    const existing = localStorage.getItem(key);
    if (existing) return existing;
    const id = `c_${code}_${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem(key, id);
    return id;
  } catch {
    return `c_${code}_anon`;
  }
}

export async function submitChallengeBoard(input: {
  code: string;
  picks: SubmittedPick[];
  displayName?: string;
}): Promise<{ rank?: number; error?: string }> {
  try {
    const res = await fetch('/api/challenge-board', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: input.code,
        picks: input.picks,
        id: getOrCreateChallengeAttemptId(input.code),
        displayName: input.displayName,
      }),
    });
    const data = (await res.json()) as { rank?: number | null; error?: string };
    if (!res.ok) return { error: data.error ?? 'Submit failed' };
    return { rank: data.rank ?? undefined };
  } catch {
    return { error: 'Submit failed' };
  }
}
