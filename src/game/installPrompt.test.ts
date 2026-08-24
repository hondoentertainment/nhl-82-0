import { beforeEach, describe, expect, it } from 'vitest';
import { STORAGE_KEYS } from '../config/constants';
import { dismissInstallTip, installTipKind, isInstallTipDismissed } from './installPrompt';

describe('installTipKind', () => {
  it('hides when already installed or dismissed', () => {
    expect(
      installTipKind({ standalone: true, dismissed: false, canPrompt: true, iosSafari: true }),
    ).toBe('none');
    expect(
      installTipKind({ standalone: false, dismissed: true, canPrompt: true, iosSafari: true }),
    ).toBe('none');
  });

  it('prefers the native install prompt over iOS copy', () => {
    expect(
      installTipKind({ standalone: false, dismissed: false, canPrompt: true, iosSafari: true }),
    ).toBe('install');
  });

  it('shows iOS Home Screen copy when that is the only path', () => {
    expect(
      installTipKind({ standalone: false, dismissed: false, canPrompt: false, iosSafari: true }),
    ).toBe('ios');
    expect(
      installTipKind({ standalone: false, dismissed: false, canPrompt: false, iosSafari: false }),
    ).toBe('none');
  });
});

describe('install tip dismissal', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('persists a dismissal', () => {
    expect(isInstallTipDismissed()).toBe(false);
    dismissInstallTip();
    expect(isInstallTipDismissed()).toBe(true);
    expect(localStorage.getItem(STORAGE_KEYS.installTip)).toBe('1');
  });
});
