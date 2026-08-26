import { beforeEach, describe, expect, it } from 'vitest';
import { STORAGE_KEYS } from '../config/constants';
import {
  displayDailyStreak,
  loadCareer,
  nextDailyStreak,
  previousUtcDateKey,
  recordCareerResult,
} from './career';

const sampleResult = {
  wins: 62,
  losses: 20,
  score: 756,
  gradeId: 'contender' as const,
  gradeLabel: 'CUP CONTENDER',
  strengths: [],
  weaknesses: [],
  bestPickId: null,
  weakestSlot: null,
  toughnessScore: 800,
  tape: [],
};

describe('career', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('previousUtcDateKey rolls back one UTC day', () => {
    expect(previousUtcDateKey('2026-08-10')).toBe('2026-08-09');
    expect(previousUtcDateKey('2026-01-01')).toBe('2025-12-31');
  });

  it('records plays and best wins', () => {
    recordCareerResult({ mode: 'classic', result: sampleResult });
    recordCareerResult({
      mode: 'classic',
      result: { ...sampleResult, wins: 74, gradeId: 'dynasty', gradeLabel: 'DYNASTY' },
    });
    const c = loadCareer();
    expect(c.gamesPlayed).toBe(2);
    expect(c.bestWins).toBe(74);
    expect(c.byMode.classic?.plays).toBe(2);
    expect(c.byMode.classic?.bestWins).toBe(74);
  });

  it('increments daily streak across consecutive days', () => {
    let career = loadCareer();
    career = { ...career, ...nextDailyStreak(career, '2026-08-08') };
    localStorage.setItem(STORAGE_KEYS.career, JSON.stringify(career));
    career = loadCareer();
    const day2 = nextDailyStreak(career, '2026-08-09');
    expect(day2.dailyStreak).toBe(2);
    career = { ...career, ...day2 };
    const day3 = nextDailyStreak(career, '2026-08-10');
    expect(day3.dailyStreak).toBe(3);
  });

  it('resets streak after a missed day', () => {
    const career = {
      ...loadCareer(),
      dailyStreak: 5,
      bestDailyStreak: 5,
      lastDailyDateKey: '2026-08-07',
    };
    const next = nextDailyStreak(career, '2026-08-10');
    expect(next.dailyStreak).toBe(1);
    expect(next.bestDailyStreak).toBe(5);
  });

  it('displayDailyStreak is 0 when streak is stale', () => {
    localStorage.setItem(
      STORAGE_KEYS.career,
      JSON.stringify({
        ...loadCareer(),
        dailyStreak: 4,
        lastDailyDateKey: '2020-01-01',
      }),
    );
    expect(displayDailyStreak()).toBe(0);
  });
});
