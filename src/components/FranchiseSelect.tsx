import { FRANCHISES } from '../data/franchises';
import { decadesForFranchise } from '../game/spin';
import { useGame } from '../state/gameStore';

export function FranchiseSelect() {
  const { startGame, goHome } = useGame();
  const options = FRANCHISES.filter((f) => decadesForFranchise(f.id).length > 0);

  return (
    <section>
      <button
        type="button"
        className="btn btn-ghost back-link"
        data-testid="back-home"
        onClick={goHome}
      >
        ← Back
      </button>
      <h2 className="headline" style={{ marginTop: 0 }}>
        Pick your franchise
      </h2>
      <p className="lede">
        Lock one club for all six rounds. Each spin draws a decade from that franchise&apos;s
        history.
      </p>
      <div className="franchise-grid" data-testid="franchise-grid">
        {options.map((f) => (
          <button
            key={f.id}
            type="button"
            className="mode-card"
            data-testid={`franchise-${f.id}`}
            onClick={() => startGame('franchise', f.id)}
          >
            <h3>{f.shortName}</h3>
            <p>
              {f.abbreviation} · {decadesForFranchise(f.id).length} eras
            </p>
          </button>
        ))}
      </div>
    </section>
  );
}
