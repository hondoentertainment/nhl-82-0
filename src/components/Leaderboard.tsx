import { useEffect, useState } from 'react';
import { LEADERBOARD_MIN_WINS } from '../config/constants';
import { utcDateKey } from '../game/daily';
import { fetchDailyBoard, type GlobalDailyEntry } from '../game/dailyBoard';
import { loadLeaderboard } from '../game/leaderboard';
import { useGame } from '../state/gameStore';

type Tab = 'classic' | 'daily';

export function Leaderboard() {
  const { setScreen } = useGame();
  const [tab, setTab] = useState<Tab>('daily');
  const local = loadLeaderboard();
  const [dailyEntries, setDailyEntries] = useState<GlobalDailyEntry[]>([]);
  const [dailyError, setDailyError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const today = utcDateKey();

  useEffect(() => {
    if (tab !== 'daily') return;
    let cancelled = false;
    setLoading(true);
    void fetchDailyBoard(today).then((res) => {
      if (cancelled) return;
      setDailyEntries(res.entries);
      setDailyError(res.error ?? null);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [tab, today]);

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
          className={`btn ${tab === 'classic' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setTab('classic')}
        >
          Local Classic
        </button>
      </div>

      {tab === 'daily' ? (
        <>
          <p className="lede">UTC {today} · same spins for everyone</p>
          {loading && <div className="panel empty-pool">Loading global board…</div>}
          {!loading && dailyError && (
            <div className="panel empty-pool">{dailyError}. Local daily still saves on your device.</div>
          )}
          {!loading && !dailyError && !dailyEntries.length && (
            <div className="panel empty-pool">No global entries yet today. Be the first.</div>
          )}
          {!loading && !!dailyEntries.length && (
            <ol className="leaderboard-list">
              {dailyEntries.map((e, i) => (
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
