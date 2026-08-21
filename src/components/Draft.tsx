import { useMemo } from 'react';
import { ROUNDS } from '../config/constants';
import { formatSalary, playerSalary } from '../game/salary';
import { useGame } from '../state/gameStore';
import { PlayerPicker } from './PlayerPicker';
import { RosterBoard } from './RosterBoard';
import { SpinReels } from './SpinReels';

export function Draft() {
  const {
    state,
    spin,
    skipTeam,
    skipDecade,
    respinEmpty,
    pickPlayer,
    availablePlayers,
    franchiseName,
    goHome,
    modeLabel,
    salarySpent,
    salaryRemaining,
  } = useGame();

  const spinLabel = state.lockedFranchiseId
    ? 'Spin decade'
    : 'Spin franchise + decade';

  const affordableCount = useMemo(() => {
    if (state.mode !== 'salary' || salaryRemaining == null) return availablePlayers.length;
    return availablePlayers.filter((p) => playerSalary(p) <= salaryRemaining).length;
  }, [availablePlayers, salaryRemaining, state.mode]);

  const needsRedraw =
    state.mode !== 'daily' &&
    state.mode !== 'challenge' &&
    !!state.spin &&
    !state.spinning &&
    (!availablePlayers.length || (state.mode === 'salary' && affordableCount === 0));

  return (
    <section data-testid="draft">
      <div className="draft-header">
        <div>
          <h2 data-testid="mode-label">{modeLabel}</h2>
          <div className="round-meta" data-testid="round-meta">
            Round {Math.min(state.round, ROUNDS)} of {ROUNDS}
            {state.lockedFranchiseId && <> · {franchiseName}</>}
            {state.challengeCode && (
              <>
                {' '}
                · Code <span data-testid="challenge-code">{state.challengeCode}</span>
              </>
            )}
            {state.salaryCap != null && salaryRemaining != null && (
              <>
                {' '}
                · Cap {formatSalary(salarySpent)} / {formatSalary(state.salaryCap)} (
                {formatSalary(salaryRemaining)} left)
              </>
            )}
          </div>
        </div>
        <button type="button" className="btn btn-ghost" data-testid="quit" onClick={goHome}>
          Quit
        </button>
      </div>

      <div className="panel">
        <p className="section-label">Spin the ice</p>
        <SpinReels spin={state.spin} spinning={state.spinning} />

        {!state.spin && !state.spinning && (
          <button
            type="button"
            className="btn btn-primary"
            data-testid="spin-button"
            onClick={spin}
          >
            {spinLabel}
          </button>
        )}

        {state.spin && !state.spinning && (
          <>
            <p
              className="lede"
              style={{ maxWidth: 'none', marginBottom: '0.75rem' }}
              data-testid="spin-result"
            >
              {state.spin.decade} · {franchiseName}
            </p>
            {(state.teamSkips > 0 || state.decadeSkips > 0) && (
              <div className="skip-row">
                {state.teamSkips > 0 && (
                  <button
                    type="button"
                    className="btn btn-secondary"
                    data-testid="skip-team"
                    disabled={state.teamSkips <= 0}
                    onClick={skipTeam}
                  >
                    Skip team ({state.teamSkips})
                  </button>
                )}
                <button
                  type="button"
                  className="btn btn-secondary"
                  data-testid="skip-decade"
                  disabled={state.decadeSkips <= 0}
                  onClick={skipDecade}
                >
                  Skip decade ({state.decadeSkips})
                </button>
              </div>
            )}
            <p className="section-label">Select your player</p>
            {needsRedraw && (
              <div className="btn-row" style={{ marginBottom: '0.75rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  data-testid="respin"
                  onClick={respinEmpty}
                >
                  No fits — redraw spin
                </button>
              </div>
            )}
            <PlayerPicker
              players={availablePlayers}
              roster={state.roster}
              showStats={state.showStats}
              salaryMode={state.mode === 'salary'}
              toughMode={state.mode === 'tough'}
              salaryRemaining={salaryRemaining}
              onPick={pickPlayer}
            />
          </>
        )}
      </div>

      <p className="section-label" style={{ marginTop: '1.5rem' }}>
        Your roster
      </p>
      <RosterBoard roster={state.roster} />
    </section>
  );
}
