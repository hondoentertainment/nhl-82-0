import { useEffect, useMemo, useState } from 'react';
import { DECADES, type Decade } from '../config/constants';
import { FRANCHISES } from '../data/franchises';
import { allPlayers, ensurePool, isPoolLoaded } from '../data/pool';
import { useGame } from '../state/gameStore';
import type { Player } from '../types/game';

function formatSkater(p: Player): string {
  const s = p.skater;
  if (!s) return '';
  return `${s.g82} G · ${s.a82} A · ${s.pim82} PIM / 82`;
}

function formatGoalie(p: Player): string {
  const g = p.goalie;
  if (!g) return '';
  return `${g.gaa.toFixed(2)} GAA · ${(g.svPct * 100).toFixed(1)} SV%`;
}

const FRANCHISE_NAME = Object.fromEntries(FRANCHISES.map((f) => [f.id, f.shortName]));

export function Encyclopedia() {
  const { setScreen } = useGame();
  const [ready, setReady] = useState(isPoolLoaded());
  const [query, setQuery] = useState('');
  const [decade, setDecade] = useState<Decade | 'all'>('all');
  const [hideStats, setHideStats] = useState(false);

  useEffect(() => {
    void ensurePool().then(() => setReady(true));
  }, []);

  const rows = useMemo(() => {
    if (!ready) return [];
    const q = query.trim().toLowerCase();
    return allPlayers()
      .filter((p) => {
        if (decade !== 'all' && p.decade !== decade) return false;
        if (!q) return true;
        return (
          p.name.toLowerCase().includes(q) ||
          (FRANCHISE_NAME[p.franchiseId] ?? '').toLowerCase().includes(q) ||
          p.franchiseId.includes(q)
        );
      })
      .sort((a, b) => a.name.localeCompare(b.name) || a.decade.localeCompare(b.decade))
      .slice(0, 60);
  }, [decade, query, ready]);

  return (
    <section data-testid="encyclopedia">
      <h2 className="headline" style={{ marginTop: 0 }}>
        Encyclopedia
      </h2>
      <p className="lede">
        Search the draft pool. Hide numbers to practice Ice IQ, or leave them on to study
        franchise-decade lines.
      </p>

      <div className="challenge-row" style={{ marginBottom: '1rem' }}>
        <label className="sr-only" htmlFor="pedia-search">
          Search players
        </label>
        <input
          id="pedia-search"
          className="challenge-input"
          type="search"
          placeholder="Search name or club"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          data-testid="pedia-search"
        />
        <label className="sr-only" htmlFor="pedia-decade">
          Decade
        </label>
        <select
          id="pedia-decade"
          className="challenge-input"
          value={decade}
          onChange={(e) => setDecade(e.target.value as Decade | 'all')}
          data-testid="pedia-decade"
        >
          <option value="all">All decades</option>
          {DECADES.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
        <button
          type="button"
          className={`btn ${hideStats ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setHideStats((v) => !v)}
          aria-pressed={hideStats}
          data-testid="pedia-blind"
        >
          {hideStats ? 'Stats hidden' : 'Hide stats'}
        </button>
        <button type="button" className="btn btn-ghost" onClick={() => setScreen('home')}>
          Back
        </button>
      </div>

      {!ready ? (
        <div className="empty-pool">Loading pool…</div>
      ) : rows.length === 0 ? (
        <div className="empty-pool">No players match that search.</div>
      ) : (
        <ul className="pedia-list" data-testid="pedia-list">
          {rows.map((p) => (
            <li key={p.id} className="player-card" data-testid={`pedia-${p.id}`}>
              <div className="player-name">{p.name}</div>
              <div className="badges">
                {p.hof && <span className="badge hof">HOF</span>}
                <span className="badge">{FRANCHISE_NAME[p.franchiseId] ?? p.franchiseId}</span>
                <span className="badge">{p.decade}</span>
                {p.positions.map((pos) => (
                  <span key={pos} className="badge">
                    {pos}
                  </span>
                ))}
              </div>
              {!hideStats && (
                <div className="stats">{p.goalie ? formatGoalie(p) : formatSkater(p)}</div>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
