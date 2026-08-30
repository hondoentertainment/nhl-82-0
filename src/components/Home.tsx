import { useEffect, useState } from 'react';
import { displayDailyStreak, loadCareer } from '../game/career';
import {
  decodeChallengeSeed,
  parseChallengeFromLocation,
} from '../game/challenge';
import { isDailyCompletedToday, loadDailyRecord, utcDateKey } from '../game/daily';
import { formatSalary, SALARY_CAP_M } from '../game/salary';
import { useGame } from '../state/gameStore';
import { DailyHistoryStrip } from './DailyHistory';
import { DisplayNameField } from './DisplayNameField';
import { InstallTip } from './InstallTip';

export function Home() {
  const { startGame, beginFranchiseSelect, beginDecadeSelect, setScreen } = useGame();
  const dailyDone = isDailyCompletedToday();
  const daily = loadDailyRecord();
  const today = utcDateKey();
  const career = loadCareer();
  const streak = displayDailyStreak(career);
  const [challengeCode, setChallengeCode] = useState('');
  const [challengeError, setChallengeError] = useState<string | null>(null);

  useEffect(() => {
    const fromUrl = parseChallengeFromLocation();
    if (!fromUrl) return;
    setChallengeCode(fromUrl);
    startGame('challenge', undefined, fromUrl);
    history.replaceState(null, '', window.location.pathname);
  }, [startGame]);

  const joinChallenge = () => {
    const code = challengeCode.trim().toUpperCase();
    if (decodeChallengeSeed(code) == null) {
      setChallengeError('Enter a valid challenge code (4–10 characters).');
      return;
    }
    setChallengeError(null);
    startGame('challenge', undefined, code);
  };

  return (
    <section className="hero" data-testid="home">
      <p className="section-label">National Hockey League</p>
      <h1 className="brand" data-testid="brand">
        82<span>-</span>0
      </h1>
      <h2 className="headline">Draft legends. Chase a perfect season.</h2>
      <p className="lede">
        Spin a franchise and decade, fill six positions, and see if your roster can go undefeated.
      </p>
      <InstallTip />
      <DailyHistoryStrip compact />
      <DisplayNameField compact />

      {(streak > 0 || career.gamesPlayed > 0) && (
        <p className="career-chip" data-testid="home-career-chip">
          {career.gamesPlayed > 0 && (
            <span>
              {career.gamesPlayed} season{career.gamesPlayed === 1 ? '' : 's'}
              {career.bestWins > 0 ? ` · best ${career.bestWins}` : ''}
            </span>
          )}
          {streak > 0 && (
            <span data-testid="home-streak">
              {career.gamesPlayed > 0 ? ' · ' : ''}
              Daily streak {streak}
            </span>
          )}
        </p>
      )}

      <div className="mode-grid">
        <button
          type="button"
          className="mode-card"
          data-testid="mode-classic"
          onClick={() => startGame('classic')}
        >
          <h3>Classic</h3>
          <p>Full stats visible. One team skip, one decade skip. Chase the all-time board.</p>
        </button>
        <button
          type="button"
          className="mode-card"
          data-testid="mode-iceiq"
          onClick={() => startGame('iceiq')}
        >
          <h3>Ice IQ</h3>
          <p>Blind draft — no numbers. Prove you know hockey history.</p>
        </button>
        <button
          type="button"
          className="mode-card"
          data-testid="mode-salary"
          onClick={() => startGame('salary')}
        >
          <h3>Salary Cap</h3>
          <p>
            Build under a {formatSalary(SALARY_CAP_M)} soft cap. Stars cost more — manage the
            payroll.
          </p>
        </button>
        <button
          type="button"
          className="mode-card"
          data-testid="mode-franchise"
          onClick={beginFranchiseSelect}
        >
          <h3>One Franchise</h3>
          <p>Lock a club, spin decades only, and build an all-time single-franchise six.</p>
        </button>
        <button
          type="button"
          className="mode-card"
          data-testid="mode-eralock"
          onClick={beginDecadeSelect}
        >
          <h3>Era Lock</h3>
          <p>Lock a decade, spin franchises only, and build the best six that era produced.</p>
        </button>
        <button
          type="button"
          className="mode-card"
          data-testid="mode-tough"
          onClick={() => startGame('tough')}
        >
          <h3>Toughest Team</h3>
          <p>Draft enforcers and heavyweights. Penalty minutes and sandpaper win the night.</p>
        </button>
        <button
          type="button"
          className="mode-card"
          data-testid="mode-ironman"
          onClick={() => startGame('ironman')}
        >
          <h3>Ironman</h3>
          <p>Classic rules with nothing to fall back on: no skips, no redraws, no undo.</p>
        </button>
        <button
          type="button"
          className="mode-card"
          data-testid="mode-fournations"
          onClick={() => startGame('fournations')}
        >
          <h3>Four Nations</h3>
          <p>Canada, USA, Sweden, Finland only. Build a Face-Off six from those four countries.</p>
        </button>
        <button
          type="button"
          className="mode-card"
          data-testid="mode-daily"
          onClick={() => startGame('daily')}
          disabled={dailyDone}
        >
          <h3>Daily Challenge</h3>
          <p>
            {dailyDone && daily?.dateKey === today
              ? `Done today — ${daily.wins}-${daily.losses} · ${daily.gradeLabel}`
              : 'Same spins worldwide. No skips. Compete on the global board.'}
          </p>
        </button>
        <div className="mode-card challenge-card" data-testid="mode-challenge">
          <h3>Challenge a friend</h3>
          <p>Same spins for everyone with the code. No skips — pure comparison.</p>
          <div className="challenge-row">
            <button
              type="button"
              className="btn btn-secondary"
              data-testid="challenge-new"
              onClick={() => startGame('challenge')}
            >
              New challenge
            </button>
            <input
              type="text"
              className="challenge-input"
              placeholder="Enter code"
              aria-label="Challenge code"
              data-testid="challenge-input"
              value={challengeCode}
              onChange={(e) => setChallengeCode(e.target.value.toUpperCase())}
              maxLength={10}
            />
            <button
              type="button"
              className="btn btn-primary"
              data-testid="challenge-join"
              onClick={joinChallenge}
            >
              Join
            </button>
          </div>
          {challengeError && <p className="field-error">{challengeError}</p>}
        </div>
      </div>

      <div className="nav-links">
        <button type="button" data-testid="nav-how" onClick={() => setScreen('how')}>
          How to play
        </button>
        <button
          type="button"
          data-testid="nav-leaderboard"
          onClick={() => setScreen('leaderboard')}
        >
          Leaderboards
        </button>
        <button type="button" data-testid="nav-career" onClick={() => setScreen('career')}>
          Career
        </button>
        <button
          type="button"
          data-testid="nav-encyclopedia"
          onClick={() => setScreen('encyclopedia')}
        >
          Encyclopedia
        </button>
      </div>

      <p className="disclaimer">
        Fan-made browser game. Not affiliated with, endorsed by, or sponsored by the National
        Hockey League or any NHL clubs.
      </p>
    </section>
  );
}
