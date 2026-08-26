import { del, head, put } from '@vercel/blob';
import type { VercelRequest, VercelResponse } from '@vercel/node';

/** Keep in sync with src/game/daily.ts — do not import ../src (Vercel ESM). */
function utcDateKey(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

/** Keep in sync with src/game/displayName.ts */
function sanitizeDisplayName(raw: string): string | null {
  const name = raw.trim().replace(/\s+/g, ' ');
  if (name.length < 2 || name.length > 20) return null;
  if (!/^[A-Za-z0-9][A-Za-z0-9 .'-]{0,18}[A-Za-z0-9]?$/.test(name)) return null;
  return name;
}

interface DailyEntry {
  id: string;
  wins: number;
  losses: number;
  gradeLabel: string;
  rosterNames: string[];
  createdAt: string;
  displayName?: string;
}

interface DailyBoard {
  dateKey: string;
  entries: DailyEntry[];
}

const MAX_ENTRIES = 100;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
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

function blobPath(dateKey: string): string {
  return `daily-boards/${dateKey}.json`;
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

async function readBoard(dateKey: string): Promise<DailyBoard> {
  const pathname = blobPath(dateKey);
  try {
    const meta = await head(pathname);
    const res = await fetch(meta.url, { cache: 'no-store' });
    if (!res.ok) return { dateKey, entries: [] };
    const data = (await res.json()) as DailyBoard;
    return {
      dateKey,
      entries: Array.isArray(data.entries) ? data.entries : [],
    };
  } catch {
    return { dateKey, entries: [] };
  }
}

async function writeBoard(board: DailyBoard): Promise<void> {
  const pathname = blobPath(board.dateKey);
  const payload = JSON.stringify(board);
  try {
    await put(pathname, payload, {
      access: 'public',
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: 'application/json',
    });
  } catch {
    try {
      await del(pathname);
    } catch {
      /* first write */
    }
    await put(pathname, payload, {
      access: 'public',
      addRandomSuffix: false,
      contentType: 'application/json',
    });
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return res.status(503).json({
      error: 'Global daily board not configured',
      entries: [],
    });
  }

  try {
    if (req.method === 'GET') {
      const dateKey = String(req.query.date ?? '');
      if (!DATE_RE.test(dateKey)) {
        return res.status(400).json({ error: 'Invalid date' });
      }
      const board = await readBoard(dateKey);
      const entries = [...board.entries].sort(
        (a, b) => b.wins - a.wins || a.createdAt.localeCompare(b.createdAt),
      );
      return res.status(200).json({ dateKey, entries: entries.slice(0, MAX_ENTRIES) });
    }

    if (req.method === 'POST') {
      if (rateLimited(clientKey(req))) {
        return res.status(429).json({ error: 'Too many submissions' });
      }

      const body = parseBody(req);
      const dateKey = typeof body.dateKey === 'string' ? body.dateKey : '';
      if (!DATE_RE.test(dateKey)) {
        return res.status(400).json({ error: 'Invalid dateKey' });
      }

      const today = utcDateKey();
      const yesterday = utcDateKey(new Date(Date.now() - 86_400_000));
      if (dateKey !== today && dateKey !== yesterday) {
        return res.status(400).json({ error: 'Board is closed for that date' });
      }

      const id = typeof body.id === 'string' ? body.id : '';
      if (!ID_RE.test(id)) {
        return res.status(400).json({ error: 'Invalid id' });
      }

      const { parsePicks, verifyDailyRun } = await import('./verify.bundle.js');
      const picks = parsePicks(body.picks);
      if (!picks) {
        return res.status(400).json({ error: 'Missing or malformed picks' });
      }

      const verified = verifyDailyRun(dateKey, picks);
      if (!verified.ok) {
        return res.status(400).json({ error: `Run rejected: ${verified.error}` });
      }

      const displayName =
        typeof body.displayName === 'string' ? sanitizeDisplayName(body.displayName) : null;

      const entry: DailyEntry = {
        id,
        wins: verified.result.wins,
        losses: verified.result.losses,
        gradeLabel: verified.result.gradeLabel,
        rosterNames: verified.roster.map((s) => s.player?.name ?? '—'),
        createdAt: new Date().toISOString(),
        ...(displayName ? { displayName } : {}),
      };

      const board = await readBoard(dateKey);
      const existingIdx = board.entries.findIndex((e) => e.id === entry.id);
      if (existingIdx >= 0) {
        board.entries[existingIdx] = entry;
      } else {
        board.entries.push(entry);
      }
      board.entries.sort((a, b) => b.wins - a.wins || a.createdAt.localeCompare(b.createdAt));
      board.entries = board.entries.slice(0, MAX_ENTRIES);
      await writeBoard(board);

      const rank = board.entries.findIndex((e) => e.id === entry.id) + 1;
      return res.status(200).json({
        ok: true,
        rank,
        wins: entry.wins,
        losses: entry.losses,
        gradeLabel: entry.gradeLabel,
      });
    }

    return res.status(405).json({ error: 'Method Not Allowed' });
  } catch (err) {
    console.error('[api/daily]', err);
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return res.status(500).json({ error: message });
  }
}
