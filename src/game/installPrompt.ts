import { STORAGE_KEYS } from '../config/constants';

export type InstallTipKind = 'none' | 'install' | 'ios';

export function isStandaloneDisplay(): boolean {
  if (typeof window === 'undefined') return false;
  if (window.matchMedia?.('(display-mode: standalone)').matches) return true;
  const nav = window.navigator as Navigator & { standalone?: boolean };
  return nav.standalone === true;
}

export function isIosSafari(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  const ios =
    /iPad|iPhone|iPod/.test(ua) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const webkit = /WebKit/.test(ua);
  return ios && webkit;
}

export function isInstallTipDismissed(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEYS.installTip) === '1';
  } catch {
    return false;
  }
}

export function dismissInstallTip(): void {
  localStorage.setItem(STORAGE_KEYS.installTip, '1');
}

export function installTipKind(input: {
  standalone: boolean;
  dismissed: boolean;
  canPrompt: boolean;
  iosSafari: boolean;
}): InstallTipKind {
  if (input.standalone || input.dismissed) return 'none';
  if (input.canPrompt) return 'install';
  if (input.iosSafari) return 'ios';
  return 'none';
}
