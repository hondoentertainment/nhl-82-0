import { beforeEach, describe, expect, it } from 'vitest';
import { GAME_LOG_MAX, STORAGE_KEYS } from '../config/constants';
import { recordCareerResult } from './career';
import { appendGameRecord, formatGameLogDate, loadGameLog, type GameRecord } from './gameLog';

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
};

function makeRecord(partial: Partial<GameRecord> = {}): GameRecord {
  return {
    id: partial.id ?? `g-${Math.random().toString(36).slice(2)}`,
    mode: 'classic',
    wins: 60,
    losses: 22,
    gradeLabel: 'CUP CONTENDER',
    score: 700,
    rosterNames: ['A', 'B'],
    createdAt: '2026-08-15T12:00:00.000Z',
    ...partial,
  };
}

describe('game log', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('appends newest first and keeps every season', () => {
    appendGameRecord(makeRecord({ id: 'one', wins: 50 }));
    appendGameRecord(makeRecord({ id: 'two', wins: 74, gradeLabel: 'DYNASTY' }));
    const log = loadGameLog();
    expect(log).toHaveLength(2);
    expect(log[0]?.id).toBe('two');
    expect(log[1]?.id).toBe('one');
  });

  it('caps the log and drops the oldest', () => {
    for (let i = 0; i < GAME_LOG_MAX + 5; i++) {
      appendGameRecord(makeRecord({ id: `g-${i}`, wins: i % 83 }));
    }
    const log = loadGameLog();
    expect(log).toHaveLength(GAME_LOG_MAX);
    expect(log[0]?.id).toBe(`g-${GAME_LOG_MAX + 4}`);
    expect(log.some((row) => row.id === 'g-0')).toBe(false);
  });

  it('records a season when career stats update', () => {
    recordCareerResult({
      mode: 'challenge',
      result: sampleResult,
      rosterNames: ['Gretzky', 'Messier'],
      challengeCode: 'ABCDEF',
    });
    const log = loadGameLog();
    expect(log).toHaveLength(1);
    expect(log[0]?.mode).toBe('challenge');
    expect(log[0]?.wins).toBe(62);
    expect(log[0]?.rosterNames).toEqual(['Gretzky', 'Messier']);
    expect(log[0]?.challengeCode).toBe('ABCDEF');
  });

  it('formats stored timestamps as UTC dates', () => {
    expect(formatGameLogDate('2026-08-15T23:30:00.000Z')).toBe('2026-08-15');
  });

  it('returns an empty log when storage is missing or corrupt', () => {
    expect(loadGameLog()).toEqual([]);
    localStorage.setItem(STORAGE_KEYS.gameLog, '{not-json');
    expect(loadGameLog()).toEqual([]);
  });
});
