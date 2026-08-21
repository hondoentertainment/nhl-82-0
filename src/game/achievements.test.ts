import { beforeEach, describe, expect, it } from 'vitest';
import { evaluateAchievements } from './achievements';
import { loadCareer } from './career';

describe('achievements', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('unlocks opening faceoff and playoff grades', () => {
    const newly = evaluateAchievements({
      mode: 'classic',
      result: {
        wins: 60,
        losses: 22,
        score: 732,
        gradeId: 'contender',
        gradeLabel: 'CUP CONTENDER',
        strengths: [],
        weaknesses: [],
        bestPickId: null,
        weakestSlot: null,
        toughnessScore: 700,
      },
      rosterPlayers: [],
      career: loadCareer(),
    });
    expect(newly).toContain('first_season');
    expect(newly).toContain('playoffs');
    expect(newly).toContain('contender');
  });
});
