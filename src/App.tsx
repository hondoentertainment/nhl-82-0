import { Analytics } from '@vercel/analytics/react';
import { Career } from './components/Career';
import { DecadeSelect } from './components/DecadeSelect';
import { Draft } from './components/Draft';
import { FranchiseSelect } from './components/FranchiseSelect';
import { Home } from './components/Home';
import { HowToPlay } from './components/HowToPlay';
import { Leaderboard } from './components/Leaderboard';
import { ResultCard } from './components/ResultCard';
import { SeasonReveal } from './components/SeasonReveal';
import { GameProvider, useGame } from './state/gameStore';

function ScreenRouter() {
  const { state } = useGame();

  switch (state.screen) {
    case 'franchise-select':
      return <FranchiseSelect />;
    case 'decade-select':
      return <DecadeSelect />;
    case 'draft':
      return <Draft />;
    case 'reveal':
      return <SeasonReveal />;
    case 'result':
      return <ResultCard />;
    case 'how':
      return <HowToPlay />;
    case 'leaderboard':
      return <Leaderboard />;
    case 'career':
      return <Career />;
    default:
      return <Home />;
  }
}

export default function App() {
  return (
    <GameProvider>
      <div className="app-shell">
        <div className="rink-bg" aria-hidden="true" />
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        <main className="app-content" id="main">
          <ScreenRouter />
        </main>
        <Analytics />
      </div>
    </GameProvider>
  );
}
