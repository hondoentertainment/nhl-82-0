import { describe, expect, it } from 'vitest';
import { gradeForWins, scoreFromWins } from './grades';

describe('grades', () => {
  it('maps win totals to bands', () => {
    expect(gradeForWins(82).label).toBe('PERFECTION');
    expect(gradeForWins(70).label).toBe('DYNASTY');
    expect(gradeForWins(58).label).toBe('CUP CONTENDER');
    expect(gradeForWins(44).label).toBe('PLAYOFF TEAM');
    expect(gradeForWins(43).label).toBe('REBUILDING');
  });

  it('scores out of 1000', () => {
    expect(scoreFromWins(82)).toBe(1000);
    expect(scoreFromWins(41)).toBe(500);
  });
});
