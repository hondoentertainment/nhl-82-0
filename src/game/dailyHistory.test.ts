import { beforeEach, describe, expect, it } from 'vitest';
import { STORAGE_KEYS } from '../config/constants';
import { loadDailyHistory, recordDailyHistory, utcDateKeysBack } from './dailyHistory';

describe('dailyHistory', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('lists the last 14 UTC days oldest-first', () => {
    const keys = utcDateKeysBack(14, '2026-08-15');
    expect(keys).toHaveLength(14);
    expect(keys[0]).toBe('2026-08-02');
    expect(keys[13]).toBe('2026-08-15');
  });

  it('upserts one entry per date and drops days outside the window', () => {
    recordDailyHistory(
      { dateKey: '2026-08-15', wins: 58, losses: 24, gradeLabel: 'CUP CONTENDER' },
      '2026-08-15',
    );
    recordDailyHistory(
      { dateKey: '2026-08-15', wins: 70, losses: 12, gradeLabel: 'DYNASTY' },
      '2026-08-15',
    );
    recordDailyHistory(
      { dateKey: '2026-07-01', wins: 40, losses: 42, gradeLabel: 'REBUILDING' },
      '2026-08-15',
    );

    const history = loadDailyHistory('2026-08-15');
    expect(history).toHaveLength(1);
    expect(history[0]).toMatchObject({ dateKey: '2026-08-15', wins: 70 });
  });

  it('migrates the current daily record into the log', () => {
    localStorage.setItem(
      STORAGE_KEYS.daily,
      JSON.stringify({
        dateKey: '2026-08-14',
        completed: true,
        wins: 55,
        losses: 27,
        gradeLabel: 'PLAYOFF TEAM',
        rosterNames: ['A'],
      }),
    );
    const history = loadDailyHistory('2026-08-15');
    expect(history).toEqual([
      {
        dateKey: '2026-08-14',
        wins: 55,
        losses: 27,
        gradeLabel: 'PLAYOFF TEAM',
        rosterNames: ['A'],
      },
    ]);
  });
});
