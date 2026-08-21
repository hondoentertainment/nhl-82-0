import { del, head, put } from '@vercel/blob';
import type { VercelRequest, VercelResponse } from '@vercel/node';

interface DailyEntry {
  id: string;
  wins: number;
  losses: number;
  gradeLabel: string;
  rosterNames: string[];
  createdAt: string;
}

interface DailyBoard {
  dateKey: string;
  entries: DailyEntry[];
}

const MAX_ENTRIES = 100;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

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

function validateEntry(body: Record<string, unknown>): DailyEntry | string {
  const id = typeof body.id === 'string' ? body.id.slice(0, 80) : '';
  const wins = Number(body.wins);
  const losses = Number(body.losses);
  const gradeLabel = typeof body.gradeLabel === 'string' ? body.gradeLabel.slice(0, 40) : '';
  const rosterNames = Array.isArray(body.rosterNames)
    ? body.rosterNames.filter((n): n is string => typeof n === 'string').slice(0, 6)
    : [];

  if (!id) return 'Missing id';
  if (!Number.isFinite(wins) || wins < 0 || wins > 82) return 'Invalid wins';
  if (!Number.isFinite(losses) || losses < 0 || losses > 82) return 'Invalid losses';
  if (wins + losses !== 82) return 'Record must sum to 82';
  if (!gradeLabel) return 'Missing gradeLabel';
  if (rosterNames.length !== 6) return 'Roster must have 6 names';

  return {
    id,
    wins,
    losses,
    gradeLabel,
    rosterNames: rosterNames.map((n) => n.slice(0, 40)),
    createdAt: new Date().toISOString(),
  };
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
      const body = parseBody(req);
      const dateKey = typeof body.dateKey === 'string' ? body.dateKey : '';
      if (!DATE_RE.test(dateKey)) {
        return res.status(400).json({ error: 'Invalid dateKey' });
      }

      const parsed = validateEntry(body);
      if (typeof parsed === 'string') {
        return res.status(400).json({ error: parsed });
      }

      const board = await readBoard(dateKey);
      const existingIdx = board.entries.findIndex((e) => e.id === parsed.id);
      if (existingIdx >= 0) {
        board.entries[existingIdx] = parsed;
      } else {
        board.entries.push(parsed);
      }
      board.entries.sort((a, b) => b.wins - a.wins || a.createdAt.localeCompare(b.createdAt));
      board.entries = board.entries.slice(0, MAX_ENTRIES);
      await writeBoard(board);

      const rank = board.entries.findIndex((e) => e.id === parsed.id) + 1;
      return res.status(200).json({
        ok: true,
        rank,
        entries: board.entries,
      });
    }

    return res.status(405).json({ error: 'Method Not Allowed' });
  } catch (err) {
    console.error('[api/daily]', err);
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return res.status(500).json({ error: message });
  }
}
