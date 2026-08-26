import { list, put } from '@vercel/blob';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

/** Keep in sync with src/game/challenge.ts — do not import ../src (Vercel ESM). */
function decodeChallengeSeed(code: string): number | null {
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

/** Keep in sync with src/game/displayName.ts */
function sanitizeDisplayName(raw: string): string | null {
  const name = raw.trim().replace(/\s+/g, ' ');
  if (name.length < 2 || name.length > 20) return null;
  if (!/^[A-Za-z0-9][A-Za-z0-9 .'-]{0,18}[A-Za-z0-9]?$/.test(name)) return null;
  return name;
}

interface ChallengeEntry {
  id: string;
  wins: number;
  losses: number;
  gradeLabel: string;
  rosterNames: string[];
  createdAt: string;
  displayName?: string;
}

const MAX_ENTRIES = 50;
const ID_RE = /^[A-Za-z0-9_-]{1,80}$/;
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 10;
const hits = new Map<string, number[]>();

function rateLimited(key: string): boolean {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  recent.push(now);
  hits.set(key, recent);
  if (hits.size > 5000) hits.clear();
  return recent.length > RATE_LIMIT_MAX;
}

function clientKey(req: VercelRequest): string {
  const fwd = req.headers['x-forwarded-for'];
  const raw = Array.isArray(fwd) ? fwd[0] : fwd;
  return (raw ?? 'unknown').split(',')[0]!.trim();
}

function cors(res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function prefixFor(code: string): string {
  return `challenge-boards/${code}/`;
}

function entryPath(code: string, id: string): string {
  return `${prefixFor(code)}id/${id}.json`;
}

function parseBody(req: VercelRequest): Record<string, unknown> {
  if (req.body == null) return {};
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body) as Record<string, unknown>;
    } catch {
      return {};
    }
  }
  if (Buffer.isBuffer(req.body)) {
    try {
      return JSON.parse(req.body.toString('utf8')) as Record<string, unknown>;
    } catch {
      return {};
    }
  }
  return req.body as Record<string, unknown>;
}

async function listEntryBlobs(code: string) {
  const { blobs } = await list({ prefix: prefixFor(code), limit: 1000 });
  return blobs.sort((a, b) => a.pathname.localeCompare(b.pathname));
}

async function readTopEntries(code: string, limit: number): Promise<ChallengeEntry[]> {
  const blobs = await listEntryBlobs(code);
  const entries = await Promise.all(
    blobs.map(async (blob) => {
      try {
        const res = await fetch(blob.url, { cache: 'no-store' });
        if (!res.ok) return null;
        return (await res.json()) as ChallengeEntry;
      } catch {
        return null;
      }
    }),
  );
  const valid = entries.filter((e): e is ChallengeEntry => !!e);
  valid.sort((a, b) => b.wins - a.wins || a.createdAt.localeCompare(b.createdAt));
  return valid.slice(0, limit);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return res.status(503).json({
      error: 'Challenge board not configured',
      entries: [],
    });
  }

  try {
    if (req.method === 'GET') {
      const code = String(req.query.code ?? '').toUpperCase();
      if (decodeChallengeSeed(code) == null) {
        return res.status(400).json({ error: 'Invalid code' });
      }
      const entries = await readTopEntries(code, MAX_ENTRIES);
      return res.status(200).json({ code, entries });
    }

    if (req.method === 'POST') {
      if (rateLimited(clientKey(req))) {
        return res.status(429).json({ error: 'Too many submissions' });
      }

      const body = parseBody(req);
      const code = typeof body.code === 'string' ? body.code.toUpperCase() : '';
      const seed = decodeChallengeSeed(code);
      if (seed == null) {
        return res.status(400).json({ error: 'Invalid code' });
      }

      const id = typeof body.id === 'string' ? body.id : '';
      if (!ID_RE.test(id)) {
        return res.status(400).json({ error: 'Invalid id' });
      }

      const { parsePicks, verifyChallengeRun } = await import('./verify.bundle.js');
      const picks = parsePicks(body.picks);
      if (!picks) {
        return res.status(400).json({ error: 'Missing or malformed picks' });
      }

      const verified = verifyChallengeRun(seed, picks);
      if (!verified.ok) {
        return res.status(400).json({ error: `Run rejected: ${verified.error}` });
      }

      const displayName =
        typeof body.displayName === 'string' ? sanitizeDisplayName(body.displayName) : null;

      const entry: ChallengeEntry = {
        id,
        wins: verified.result.wins,
        losses: verified.result.losses,
        gradeLabel: verified.result.gradeLabel,
        rosterNames: verified.roster.map((s) => s.player?.name ?? '—'),
        createdAt: new Date().toISOString(),
        ...(displayName ? { displayName } : {}),
      };

      await put(entryPath(code, id), JSON.stringify(entry), {
        access: 'public',
        addRandomSuffix: false,
        allowOverwrite: true,
        contentType: 'application/json',
      });

      const after = await readTopEntries(code, MAX_ENTRIES);
      const rank = after.findIndex((e) => e.id === id) + 1;

      return res.status(200).json({
        ok: true,
        rank: rank || null,
        wins: entry.wins,
        losses: entry.losses,
        gradeLabel: entry.gradeLabel,
      });
    }

    return res.status(405).json({ error: 'Method Not Allowed' });
  } catch (err) {
    console.error('[api/challenge-board]', err);
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return res.status(500).json({ error: message });
  }
}
