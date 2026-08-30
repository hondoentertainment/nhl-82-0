import { describe, expect, it } from 'vitest';
import { PLAYERS } from './players';
import { isFourNationsPlayer } from './nations';

describe('Four Nations pool', () => {
  it('tags enough players to field a six at several franchise-decades', () => {
    const tagged = PLAYERS.filter(isFourNationsPlayer);
    expect(tagged.length).toBeGreaterThanOrEqual(80);
    const positions = new Set(tagged.flatMap((p) => p.positions));
    expect(positions.has('C')).toBe(true);
    expect(positions.has('G')).toBe(true);
    expect(positions.has('LD') || positions.has('RD')).toBe(true);
  });
});
