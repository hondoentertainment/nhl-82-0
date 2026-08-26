import { track } from '@vercel/analytics';

export function trackEvent(
  name: 'daily_finish' | 'share_copy' | 'challenge_open' | 'challenge_finish',
  data?: Record<string, string | number | boolean | null>,
): void {
  try {
    track(name, data);
  } catch {
    /* analytics must never break play */
  }
}
