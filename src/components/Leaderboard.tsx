import { useEffect, useState } from 'react';
import { LEADERBOARD_MIN_WINS } from '../config/constants';
import { previousUtcDateKey } from '../game/career';
import { utcDateKey } from '../game/daily';
import { fetchDailyBoard, type GlobalDailyEntry } from '../game/dailyBoard';
import { loadLeaderboard } from '../game/leaderboard';
import { useGame } from '../state/gameStore';
import { RematchBoard } from './RematchBoard';

type Tab = 'classic' | 'daily' | 'yesterday' | 'rematch';

export function Leaderboard() {
  const { setScreen } = useGame();
  const [tab, setTab] = useState<Tab>('daily');
  const local = loadLeaderboard();
  const [dailyEntries, setDailyEntries] = useState<GlobalDailyEntry[]>([]);
  const [dailyError, setDailyError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [rematchCode, setRematchCode] = useState('');
  const today = utcDateKey();
  const yesterday = previousUtcDateKey(today);
  const dailyKey = tab === 'yesterday' ? yesterday : today;

  useEffect(() => {
    if (tab !== 'daily' && tab !== 'yesterday') return;
    let cancelled = false;
    setLoading(true);
    void fetchDailyBoard(dailyKey).then((res) => {
      if (cancelled) return;
      setDailyEntries(res.entries);
      setDailyError(res.error ?? null);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [dailyKey, tab]);

  return (
    <section>
      <button type="button" className="btn btn-ghost back-link" onClick={() => setScreen('home')}>
        ← Back
      </button>
      <h2 className="headline" style={{ marginTop: 0 }}>
        Leaderboards
      </h2>

      <div className="btn-row" style={{ marginBottom: '1.25rem' }}>
        <button
          type="button"
          className={`btn ${tab === 'daily' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setTab('daily')}
        >
          Daily global
        </button>
        <button
          type="button"
          className={`btn ${tab === 'yesterday' ? 'btn-primary' : 'btn-secondary'}`}
          data-testid="yesterday-board"
          onClick={() => setTab('yesterday')}
        >
          Yesterday
        </button>
        <button
          type="button"
          className={`btn ${tab === 'classic' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setTab('classic')}
        >
          Local Classic
        </button>
        <button
          type="button"
          className={`btn ${tab === 'rematch' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setTab('rematch')}
        >
          Challenge rematch
        </button>
      </div>

      {tab === 'rematch' ? (
        <>
          <p className="lede">Look up a challenge code stored on this device.</p>
          <div className="challenge-row" style={{ marginBottom: '1rem' }}>
            <input
              type="text"
              className="challenge-input"
              placeholder="Enter code"
              aria-label="Rematch challenge code"
              data-testid="rematch-lookup"
              value={rematchCode}
              onChange={(e) => setRematchCode(e.target.value.toUpperCase())}
              maxLength={10}
            />
          </div>
          {rematchCode.trim().length >= 4 ? (
            <RematchBoard code={rematchCode.trim()} />
          ) : (
            <div className="panel empty-pool">Enter a 4–10 character challenge code.</div>
          )}
        </>
      ) : tab === 'daily' || tab === 'yesterday' ? (
        <>
          <p className="lede">
            UTC {dailyKey} · same spins for everyone
            {tab === 'yesterday' ? ' · yesterday’s top 10' : ''}
          </p>
          {loading && <div className="panel empty-pool">Loading global board…</div>}
          {!loading && dailyError && (
            <div className="panel empty-pool">{dailyError}. Local daily still saves on your device.</div>
          )}
          {!loading && !dailyError && !dailyEntries.length && (
            <div className="panel empty-pool">
              {tab === 'yesterday'
                ? 'No global entries from yesterday.'
                : 'No global entries yet today. Be the first.'}
            </div>
          )}
          {!loading && !!dailyEntries.length && (
            <ol className="leaderboard-list">
              {(tab === 'yesterday' ? dailyEntries.slice(0, 10) : dailyEntries).map((e, i) => (
                <li key={e.id}>
                  <span>{i + 1}</span>
                  <div>
                    <strong>
                      {e.wins}-{e.losses}
                    </strong>{' '}
                    · {e.gradeLabel}
                    {e.displayName && (
                      <div style={{ fontSize: '0.85rem', marginTop: 2 }}>{e.displayName}</div>
                    )}
                    <div style={{ fontSize: '0.8rem', opacity: 0.75, marginTop: 2 }}>
                      {e.rosterNames.slice(0, 3).join(', ')}
                      {e.rosterNames.length > 3 ? '…' : ''}
                    </div>
                  </div>
                  <span style={{ opacity: 0.6, fontSize: '0.8rem' }}>
                    {new Date(e.createdAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </>
      ) : (
        <>
          <p className="lede">
            Classic only · {LEADERBOARD_MIN_WINS}+ wins · stored on this device
          </p>
          {!local.length ? (
            <div className="panel empty-pool">
              No qualifying runs yet. Hit {LEADERBOARD_MIN_WINS} wins in Classic.
            </div>
          ) : (
            <ol className="leaderboard-list">
              {local.map((e, i) => (
                <li key={e.id}>
                  <span>{i + 1}</span>
                  <div>
                    <strong>
                      {e.wins}-{e.losses}
                    </strong>{' '}
                    · {e.gradeLabel}
                    <div style={{ fontSize: '0.8rem', opacity: 0.75, marginTop: 2 }}>
                      {e.rosterNames.slice(0, 3).join(', ')}
                      {e.rosterNames.length > 3 ? '…' : ''}
                    </div>
                  </div>
                  <span style={{ opacity: 0.6, fontSize: '0.8rem' }}>
                    {new Date(e.createdAt).toLocaleDateString()}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </>
      )}
    </section>
  );
}
