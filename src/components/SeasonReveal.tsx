import { useEffect, useRef, useState } from 'react';
import { SEASON_GAMES } from '../config/constants';
import { simulateSeason } from '../game/simulate';
import { useGame } from '../state/gameStore';

export function SeasonReveal() {
  const { state, finishReveal } = useGame();
  const preview = simulateSeason(state.roster, { tough: state.mode === 'tough' });
  const [wins, setWins] = useState(0);
  const finished = useRef(false);

  useEffect(() => {
    const target = preview.wins;
    const duration = window.__E2E__ ? 80 : 1600;
    const start = performance.now();
    let frame = 0;
    let timeout = 0;

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - (1 - t) ** 3;
      setWins(Math.round(eased * target));
      if (t < 1) {
        frame = requestAnimationFrame(tick);
      } else if (!finished.current) {
        finished.current = true;
        timeout = window.setTimeout(finishReveal, window.__E2E__ ? 40 : 450);
      }
    };

    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(timeout);
    };
  }, [finishReveal, preview.wins]);

  return (
    <section className="reveal-stage panel" data-testid="reveal">
      <p className="section-label">Simulating {SEASON_GAMES} games</p>
      <div className="win-counter">
        {wins}
        <span style={{ opacity: 0.45 }}>-{SEASON_GAMES - wins}</span>
      </div>
      <p className="lede" style={{ margin: '0 auto', textAlign: 'center' }}>
        Counting wins across the ice…
      </p>
    </section>
  );
}
