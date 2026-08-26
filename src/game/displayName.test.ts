import { beforeEach, describe, expect, it } from 'vitest';
import { loadDisplayName, sanitizeDisplayName, saveDisplayName } from './displayName';

describe('display name', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('accepts a short handle', () => {
    expect(sanitizeDisplayName('  Hondo  ')).toBe('Hondo');
    expect(sanitizeDisplayName('A')).toBeNull();
    expect(sanitizeDisplayName('!!!')).toBeNull();
  });

  it('persists a valid name', () => {
    expect(saveDisplayName('Skipper')).toBe('Skipper');
    expect(loadDisplayName()).toBe('Skipper');
  });
});
