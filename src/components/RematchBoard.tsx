import { useEffect, useMemo, useState } from 'react';
import { fetchChallengeBoard, type ChallengeBoardEntry } from '../game/challengeBoard';
import { loadRematch, recordRematch } from '../game/rematch';

export function RematchBoard({
  code,
  emptyHint = 'No finishes for this code yet. Be the first, or add a friend’s score.',
}: {
  code: string;
  emptyHint?: string;
}) {
  const [remote, setRemote] = useState<ChallengeBoardEntry[]>([]);
  const [remoteError, setRemoteError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);
  const local = useMemo(() => loadRematch(code), [code, tick]);
  const [label, setLabel] = useState('');
  const [wins, setWins] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void fetchChallengeBoard(code).then((res) => {
      if (cancelled) return;
      setRemote(res.entries);
      setRemoteError(res.error ?? null);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [code]);

  const entries = remote.length
    ? remote.map((e) => ({
        id: e.id,
        wins: e.wins,
        losses: e.losses,
        gradeLabel: e.gradeLabel,
        rosterNames: e.rosterNames,
        label: e.displayName ?? '',
      }))
    : local;

  const addFriend = () => {
    const n = Number.parseInt(wins, 10);
    if (!label.trim()) {
      setError('Enter a name.');
      return;
    }
    if (!Number.isFinite(n) || n < 0 || n > 82) {
      setError('Wins must be 0–82.');
      return;
    }
    recordRematch(code, {
      wins: n,
      losses: 82 - n,
      gradeLabel: n >= 70 ? 'DYNASTY' : n >= 58 ? 'CUP CONTENDER' : n >= 44 ? 'PLAYOFF TEAM' : 'REBUILDING',
      rosterNames: [],
      label: label.trim(),
    });
    setLabel('');
    setWins('');
    setError(null);
    setTick((t) => t + 1);
  };

  return (
    <div className="panel rematch-board" data-testid="rematch-board">
      <p className="section-label">Rematch board · {code}</p>
      {loading && <p className="empty-pool">Loading friends’ records…</p>}
      {!loading && remoteError && !local.length && (
        <p className="empty-pool">{remoteError}. Scores on this device still save locally.</p>
      )}
      {!loading && !entries.length && <p className="empty-pool">{emptyHint}</p>}
      {!loading && !!entries.length && (
        <ol className="leaderboard-list" data-testid="rematch-list">
          {entries.map((e, i) => (
            <li key={e.id}>
              <span>{i + 1}</span>
              <div>
                <strong>
                  {e.wins}-{e.losses}
                </strong>{' '}
                · {e.gradeLabel}
                {e.label && (
                  <div style={{ fontSize: '0.85rem', marginTop: 2 }}>{e.label}</div>
                )}
                {e.rosterNames.length > 0 && (
                  <div style={{ fontSize: '0.8rem', opacity: 0.75, marginTop: 2 }}>
                    {e.rosterNames.slice(0, 3).join(', ')}
                    {e.rosterNames.length > 3 ? '…' : ''}
                  </div>
                )}
              </div>
            </li>
          ))}
        </ol>
      )}
      <div className="challenge-row" style={{ marginTop: '0.85rem' }}>
        <input
          type="text"
          className="challenge-input"
          placeholder="Friend name"
          aria-label="Friend name"
          data-testid="rematch-name"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          maxLength={24}
        />
        <input
          type="number"
          className="challenge-input"
          placeholder="Wins"
          aria-label="Friend wins"
          data-testid="rematch-wins"
          value={wins}
          onChange={(e) => setWins(e.target.value)}
          min={0}
          max={82}
        />
        <button type="button" className="btn btn-secondary" data-testid="rematch-add" onClick={addFriend}>
          Add score
        </button>
      </div>
      {error && <p className="field-error">{error}</p>}
    </div>
  );
}
