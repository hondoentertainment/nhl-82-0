const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function encodeChallengeSeed(seed: number): string {
  let n = seed >>> 0;
  if (n === 0) return 'AAAAAAAA';
  let out = '';
  while (n > 0 || out.length < 6) {
    out = CODE_ALPHABET[n % CODE_ALPHABET.length]! + out;
    n = Math.floor(n / CODE_ALPHABET.length);
    if (out.length >= 8) break;
  }
  return out.padStart(6, 'A').slice(-8);
}

export function decodeChallengeSeed(code: string): number | null {
  const cleaned = code.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (cleaned.length < 4 || cleaned.length > 10) return null;
  let n = 0;
  for (const ch of cleaned) {
    const idx = CODE_ALPHABET.indexOf(ch);
    if (idx < 0) return null;
    n = n * CODE_ALPHABET.length + idx;
  }
  return n >>> 0;
}

export function newChallengeSeed(): number {
  const entropy =
    (Date.now() ^ Math.floor(Math.random() * 0xffffffff) ^ (performance.now() * 1000)) >>>
    0;
  return entropy || 1;
}

export function challengeHashParam(code: string): string {
  return `#c=${encodeURIComponent(code)}`;
}

export function parseChallengeFromLocation(
  loc: Pick<Location, 'hash' | 'search' | 'pathname'> = window.location,
): string | null {
  const hash = loc.hash.replace(/^#/, '');
  if (hash.startsWith('c=')) {
    const code = decodeURIComponent(hash.slice(2));
    return decodeChallengeSeed(code) != null ? code.toUpperCase() : null;
  }
  const params = new URLSearchParams(loc.search);
  const q = params.get('c') ?? params.get('challenge');
  if (q && decodeChallengeSeed(q) != null) return q.toUpperCase();

  const fromPath = /^\/c\/([^/?#]+)/.exec(loc.pathname ?? '');
  if (fromPath) {
    const code = decodeURIComponent(fromPath[1]!);
    if (decodeChallengeSeed(code) != null) return code.toUpperCase();
  }
  return null;
}

/**
 * Uses a real path rather than a hash so link unfurlers can request a
 * per-code preview image — fragments never reach the server.
 */
export function challengeShareUrl(code: string, origin = window.location.origin): string {
  return `${origin}/c/${encodeURIComponent(code)}`;
}
