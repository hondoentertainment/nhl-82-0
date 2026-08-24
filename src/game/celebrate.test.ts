import { describe, expect, it } from 'vitest';
import { shouldCelebrate } from './celebrate';

describe('shouldCelebrate', () => {
  it('fires for Dynasty and Perfection only', () => {
    expect(shouldCelebrate('dynasty')).toBe(true);
    expect(shouldCelebrate('perfection')).toBe(true);
    expect(shouldCelebrate('contender')).toBe(false);
    expect(shouldCelebrate('playoffs')).toBe(false);
  });
});
