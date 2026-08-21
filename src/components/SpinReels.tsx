import { useEffect, useState } from 'react';
import { FRANCHISE_BY_ID } from '../data/franchises';
import type { SpinResult } from '../types/game';

const FAKE_DECADES = ['1950s', '1960s', '1970s', '1980s', '1990s', '2000s', '2010s', '2020s'];
const FAKE_TEAMS = [
  'Canadiens',
  'Maple Leafs',
  'Red Wings',
  'Bruins',
  'Oilers',
  'Penguins',
  'Blackhawks',
  'Rangers',
];

export function SpinReels({
  spin,
  spinning,
}: {
  spin: SpinResult | null;
  spinning: boolean;
}) {
  const [tick, setTick] = useState(0);
  const franchise = spin ? FRANCHISE_BY_ID[spin.franchiseId] : null;

  useEffect(() => {
    if (!spinning) return;
    const id = window.setInterval(() => setTick((t) => t + 1), 70);
    return () => window.clearInterval(id);
  }, [spinning]);

  const decadeDisplay = spinning
    ? FAKE_DECADES[tick % FAKE_DECADES.length]
    : (spin?.decade ?? '—');
  const teamDisplay = spinning
    ? FAKE_TEAMS[tick % FAKE_TEAMS.length]
    : (franchise?.shortName ?? '—');

  return (
    <div className="reels" aria-live="polite">
      <div className={`reel ${spinning ? 'spinning' : ''}`}>
        <div className="reel-label">Decade</div>
        <div className="reel-value">{decadeDisplay}</div>
      </div>
      <div className={`reel ${spinning ? 'spinning' : ''}`}>
        <div className="reel-label">Franchise</div>
        <div className="reel-value">{teamDisplay}</div>
      </div>
    </div>
  );
}
