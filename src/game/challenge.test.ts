import { describe, expect, it } from 'vitest';
import {
  challengeShareUrl,
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
    expect(parseChallengeFromLocation({ hash: '#c=ABCDEF', search: '', pathname: '/' })).toBe(
      'ABCDEF',
    );
    expect(
      parseChallengeFromLocation({ hash: '', search: '?challenge=XYZ234', pathname: '/' }),
    ).toBe('XYZ234');
    expect(parseChallengeFromLocation({ hash: '#c=!!', search: '', pathname: '/' })).toBeNull();
    expect(
      parseChallengeFromLocation({ hash: '', search: '', pathname: '/c/ABCDEF' }),
    ).toBe('ABCDEF');
  });

  it('builds a path-based share URL', () => {
    expect(challengeShareUrl('ABCDEF', 'https://example.test')).toBe(
      'https://example.test/c/ABCDEF',
    );
  });
});
