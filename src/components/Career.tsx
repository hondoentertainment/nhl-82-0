import { MODE_LABELS, type GameMode } from '../config/constants';
import { FRANCHISE_BY_ID } from '../data/franchises';
import {
  ACHIEVEMENTS,
  loadAchievements,
  unlockedCount,
} from '../game/achievements';
import { displayDailyStreak, loadCareer } from '../game/career';
import { formatGameLogDate, loadGameLog } from '../game/gameLog';
import { formatTapeLine } from '../game/seasonTape';
import { useGame } from '../state/gameStore';
import { DailyHistoryStrip } from './DailyHistory';
import { DisplayNameField } from './DisplayNameField';

const MODE_ORDER: GameMode[] = [
  'classic',
  'iceiq',
  'salary',
  'franchise',
  'eralock',
  'tough',
  'ironman',
  'fournations',
  'daily',
  'challenge',
];

export function Career() {
  const { setScreen } = useGame();
  const career = loadCareer();
  const gameLog = loadGameLog();
  const unlocked = loadAchievements();
  const streak = displayDailyStreak(career);
  const avg =
    career.gamesPlayed > 0 ? Math.round(career.totalWins / career.gamesPlayed) : 0;

  return (
    <section data-testid="career">
      <button type="button" className="btn btn-ghost back-link" onClick={() => setScreen('home')}>
        ← Back
      </button>
      <h2 className="headline" style={{ marginTop: 0 }}>
        Career
      </h2>
      <p className="lede">Local stats and badges on this device.</p>

      <div className="stat-grid" data-testid="career-stats">
        <div className="stat-tile">
          <span className="stat-value">{career.gamesPlayed}</span>
          <span className="stat-label">Seasons</span>
        </div>
        <div className="stat-tile">
          <span className="stat-value">{career.bestWins || '—'}</span>
          <span className="stat-label">Best wins</span>
        </div>
        <div className="stat-tile">
          <span className="stat-value">{avg || '—'}</span>
          <span className="stat-label">Avg wins</span>
        </div>
        <div className="stat-tile">
          <span className="stat-value" data-testid="career-streak">
            {streak}
          </span>
          <span className="stat-label">Daily streak</span>
        </div>
        <div className="stat-tile">
          <span className="stat-value">{career.bestDailyStreak}</span>
          <span className="stat-label">Best streak</span>
        </div>
        <div className="stat-tile">
          <span className="stat-value">
            {unlockedCount(unlocked)}/{ACHIEVEMENTS.length}
          </span>
          <span className="stat-label">Badges</span>
        </div>
      </div>

      {career.bestGradeLabel !== '—' && (
        <p className="lede" style={{ marginTop: '1rem' }}>
          Peak grade: <strong>{career.bestGradeLabel}</strong>
        </p>
      )}

      <DailyHistoryStrip />
      <DisplayNameField />

      <h3 className="subhead">Season log</h3>
      <ul className="game-log" data-testid="game-log">
        {gameLog.map((row) => {
          const franchise = row.lockedFranchiseId
            ? FRANCHISE_BY_ID[row.lockedFranchiseId]?.name
            : null;
          return (
            <li key={row.id} data-testid={`game-log-${row.id}`}>
              <div>
                <strong data-testid="game-log-record">
                  {row.wins}-{row.losses}
                </strong>{' '}
                · {row.gradeLabel}
                <p>
                  {MODE_LABELS[row.mode]}
                  {franchise ? ` · ${franchise}` : ''}
                  {row.lockedDecade ? ` · ${row.lockedDecade}` : ''}
                  {row.challengeCode ? ` · ${row.challengeCode}` : ''}
                  {row.dateKey ? ` · ${row.dateKey}` : ''}
                  {' · '}
                  {formatGameLogDate(row.createdAt)}
                </p>
                {row.rosterNames.length > 0 && (
                  <p className="game-log-roster">{row.rosterNames.join(' · ')}</p>
                )}
                {row.tape && row.tape.length > 0 && (
                  <ul className="game-log-tape" data-testid="game-log-tape">
                    {row.tape.map((game) => (
                      <li key={`${row.id}-${game.game}-${game.kind}`}>{formatTapeLine(game)}</li>
                    ))}
                  </ul>
                )}
              </div>
            </li>
          );
        })}
        {!gameLog.length && <li className="empty-pool">No seasons logged yet.</li>}
      </ul>

      <h3 className="subhead">By mode</h3>
      <ul className="mode-stats">
        {MODE_ORDER.map((mode) => {
          const row = career.byMode[mode];
          if (!row) return null;
          return (
            <li key={mode}>
              <strong>{MODE_LABELS[mode]}</strong>
              <span>
                {row.plays} play{row.plays === 1 ? '' : 's'} · best {row.bestWins}
              </span>
            </li>
          );
        })}
        {!Object.keys(career.byMode).length && (
          <li className="empty-pool">No seasons logged yet.</li>
        )}
      </ul>

      <h3 className="subhead">Achievements</h3>
      <ul className="achievement-list" data-testid="achievement-list">
        {ACHIEVEMENTS.map((a) => {
          const when = unlocked[a.id];
          return (
            <li key={a.id} className={when ? 'unlocked' : 'locked'} data-testid={`ach-${a.id}`}>
              <div>
                <strong>{a.title}</strong>
                <p>{a.description}</p>
              </div>
              <span className="ach-status">{when ? 'Unlocked' : 'Locked'}</span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
