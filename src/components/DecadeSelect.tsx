import { DECADES } from '../config/constants';
import { decadesWithPlayers } from '../game/spin';
import { useGame } from '../state/gameStore';

export function DecadeSelect() {
  const { startEraLock, goHome } = useGame();
  const options = DECADES.filter((d) => decadesWithPlayers().includes(d));

  return (
    <section data-testid="decade-select">
      <button
        type="button"
        className="btn btn-ghost back-link"
        data-testid="back-home"
        onClick={goHome}
      >
        ← Back
      </button>
      <h2 className="headline" style={{ marginTop: 0 }}>
        Lock an era
      </h2>
      <p className="lede">
        Every spin stays inside one decade. Two team skips, no decade skips — build the best six
        that era ever produced.
      </p>
      <div className="franchise-grid" data-testid="decade-grid">
        {options.map((decade) => (
          <button
            key={decade}
            type="button"
            className="mode-card"
            data-testid={`decade-${decade}`}
            onClick={() => startEraLock(decade)}
          >
            <h3>{decade}</h3>
            <p>Franchises from this decade only</p>
          </button>
        ))}
      </div>
    </section>
  );
}
