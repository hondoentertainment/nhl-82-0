import { useState } from 'react';
import { ACHIEVEMENT_BY_ID } from '../game/achievements';
import { challengeShareUrl } from '../game/challenge';
import { useGame } from '../state/gameStore';
import { RosterBoard } from './RosterBoard';
import { ShareCard } from './ShareCard';

function buildShareText(
  wins: number,
  losses: number,
  grade: string,
  mode: string,
  names: string[],
  challengeCode?: string | null,
): string {
  const lines = [
    `82-0 · ${wins}-${losses} · ${grade}`,
    `Mode: ${mode}`,
    names.join(' · '),
  ];
  if (challengeCode) {
    lines.push(`Challenge code: ${challengeCode}`);
    lines.push(challengeShareUrl(challengeCode));
  }
  lines.push('Can you go 82-0?');
  return lines.join('\n');
}

export function ResultCard() {
  const { state, goHome, startGame, modeLabel, setScreen } = useGame();
  const [copied, setCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const result = state.result;
  if (!result) return null;

  const names = state.roster.map((s) => s.player?.name ?? '—');
  const share = buildShareText(
    result.wins,
    result.losses,
    result.gradeLabel,
    modeLabel,
    names,
    state.challengeCode,
  );

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(share);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const copyChallengeLink = async () => {
    if (!state.challengeCode) return;
    try {
      await navigator.clipboard.writeText(challengeShareUrl(state.challengeCode));
      setLinkCopied(true);
      window.setTimeout(() => setLinkCopied(false), 2000);
    } catch {
      setLinkCopied(false);
    }
  };

  return (
    <section data-testid="result">
      <div className="panel" style={{ textAlign: 'center' }}>
        <p className="section-label">Final record</p>
        <div className="win-counter" data-testid="final-record">
          {result.wins}-{result.losses}
        </div>
        <div className="grade-tag" data-testid="final-grade">
          {result.gradeLabel}
        </div>
        <p className="lede" style={{ margin: '0.5rem auto 0', textAlign: 'center' }}>
          Score {result.score}/1000 · {modeLabel}
          {state.mode === 'tough' ? ` · Toughness ${result.toughnessScore}` : ''}
        </p>
        {state.madeLeaderboard && (
          <p className="toast">You made the local all-time board (70+ Classic wins).</p>
        )}
        {state.dailyRank != null && (
          <p className="toast">Global daily rank: #{state.dailyRank}</p>
        )}
        {state.challengeCode && (
          <p className="toast" data-testid="result-challenge-code">
            Challenge code: {state.challengeCode}
          </p>
        )}
      </div>

      {state.newAchievements.length > 0 && (
        <div className="panel unlock-panel" data-testid="new-achievements">
          <p className="section-label">New badges</p>
          <ul className="unlock-list">
            {state.newAchievements.map((id) => (
              <li key={id}>
                <strong>{ACHIEVEMENT_BY_ID[id].title}</strong>
                <span>{ACHIEVEMENT_BY_ID[id].description}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="result-grid">
        <div className="panel">
          <p className="section-label">Strengths</p>
          <ul>
            {result.strengths.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </div>
        <div className="panel">
          <p className="section-label">Weaknesses</p>
          <ul>
            {result.weaknesses.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </div>
      </div>

      <p className="section-label">Roster</p>
      <RosterBoard roster={state.roster} />

      <div className="panel" style={{ marginTop: '1.5rem' }}>
        <p className="section-label">Share card</p>
        <ShareCard
          wins={result.wins}
          losses={result.losses}
          gradeLabel={result.gradeLabel}
          modeLabel={modeLabel}
          rosterNames={names}
        />
      </div>

      <div className="panel" style={{ marginTop: '1.5rem' }}>
        <p className="section-label">Share text</p>
        <div className="share-box">{share}</div>
        <div className="btn-row" style={{ marginTop: '1rem' }}>
          <button type="button" className="btn btn-primary" onClick={copy}>
            Copy result
          </button>
          {state.challengeCode && (
            <button
              type="button"
              className="btn btn-secondary"
              data-testid="copy-challenge-link"
              onClick={copyChallengeLink}
            >
              Copy challenge link
            </button>
          )}
          {state.mode && state.mode !== 'daily' && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() =>
                state.mode === 'challenge' && state.challengeCode
                  ? startGame('challenge', undefined, state.challengeCode)
                  : startGame(state.mode!)
              }
            >
              Play again
            </button>
          )}
          <button type="button" className="btn btn-ghost" onClick={() => setScreen('career')}>
            Career
          </button>
          <button type="button" className="btn btn-ghost" onClick={goHome}>
            Home
          </button>
        </div>
        {copied && <p className="toast">Copied to clipboard.</p>}
        {linkCopied && <p className="toast">Challenge link copied.</p>}
      </div>
    </section>
  );
}
