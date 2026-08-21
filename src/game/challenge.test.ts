import { describe, expect, it } from 'vitest';
import {
  decodeChallengeSeed,
  encodeChallengeSeed,
  parseChallengeFromLocation,
} from './challenge';

describe('challenge codes', () => {
  it('round-trips seeds', () => {
    const seeds = [1, 42, 0xdeadbeef, 123456789, 0xffffffff];
    for (const seed of seeds) {
      const code = encodeChallengeSeed(seed);
      expect(code.length).toBeGreaterThanOrEqual(6);
      expect(decodeChallengeSeed(code)).toBe(seed >>> 0);
    }
  });

  it('rejects garbage codes', () => {
    expect(decodeChallengeSeed('')).toBeNull();
    expect(decodeChallengeSeed('!!')).toBeNull();
    expect(decodeChallengeSeed('AB')).toBeNull();
  });

  it('parses hash and query', () => {
    expect(parseChallengeFromLocation({ hash: '#c=ABCDEF', search: '' })).toBe('ABCDEF');
    expect(parseChallengeFromLocation({ hash: '', search: '?challenge=XYZ234' })).toBe(
      'XYZ234',
    );
    expect(parseChallengeFromLocation({ hash: '#c=!!', search: '' })).toBeNull();
  });
});
