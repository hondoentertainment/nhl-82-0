import { formatSalary, SALARY_CAP_M } from '../game/salary';
import { useGame } from '../state/gameStore';

export function HowToPlay() {
  const { setScreen } = useGame();

  return (
    <section className="howto panel">
      <button type="button" className="btn btn-ghost back-link" onClick={() => setScreen('home')}>
        ← Back
      </button>
      <h2 className="headline" style={{ marginTop: 0 }}>
        How to play 82-0
      </h2>
      <p>
        Assemble a six-player all-time roster across every era of NHL history, then simulate an
        82-game season. Can your dream team go 82-0?
      </p>

      <h3>The six positions</h3>
      <p>LW · C · RW · LD · RD · G</p>
      <p>
        Every player is locked to positions they actually played. Two-way stars can fill any open
        eligible slot — Paul Coffey can play either defence side, but Sidney Crosby stays at centre.
      </p>

      <h3>The spin</h3>
      <p>
        Each round, a decade and franchise are drawn at random. Pick one available legend from that
        team-era and assign them to an open slot. Six rounds, six legends.
      </p>

      <h3>Skips, undo, and redraws</h3>
      <p>
        Classic, Ice IQ, Salary Cap, and Toughest Team start with one team skip and one decade skip.
        One Franchise locks a club and gets two decade skips. Era Lock locks a decade and gets two
        team skips. Those modes can undo the last pick, and an empty pool auto-redraws (that is not a
        skip). Daily and Challenge have no skips, no undo, and no redraw — everyone faces the same
        draws.
      </p>

      <h3>Modes</h3>
      <ul>
        <li>
          <strong>Classic</strong> — stats visible (G/A/P per 82 or GAA/SV%), tiers, HOF badges.
        </li>
        <li>
          <strong>Ice IQ</strong> — stats hidden. Draft from memory.
        </li>
        <li>
          <strong>Salary Cap</strong> — {formatSalary(SALARY_CAP_M)} budget. Tier and HOF drive
          salary; you cannot draft above the remaining cap.
        </li>
        <li>
          <strong>One Franchise</strong> — lock a club, spin decades only, two decade skips.
        </li>
        <li>
          <strong>Era Lock</strong> — lock a decade, spin franchises only, two team skips.
        </li>
        <li>
          <strong>Toughest Team</strong> — the sim weights penalty minutes and sandpaper over
          highlight-reel scoring.
        </li>
        <li>
          <strong>Daily</strong> — seeded by UTC date. One attempt per day. Results post to the
          global daily board when available.
        </li>
        <li>
          <strong>Challenge</strong> — share a code so friends face the same spins. No skips.
        </li>
      </ul>

      <h3>Career & achievements</h3>
      <p>
        Every finished season updates local career stats (best wins, mode breakdown, daily streak)
        and can unlock badges. Progress stays on this device.
      </p>

      <h3>Grades</h3>
      <ul>
        <li>PERFECTION — 82-0</li>
        <li>DYNASTY — 70+</li>
        <li>CUP CONTENDER — 58–69</li>
        <li>PLAYOFF TEAM — 44–57</li>
        <li>REBUILDING — under 44</li>
      </ul>
      <p>Balance beats one superstar and empty slots. Incomplete rosters are capped hard.</p>
      <p>
        A PLAYOFF TEAM grade (44+ wins) also runs a four-round Stanley Cup. Daily and Challenge still
        score the 82-game record only.
      </p>
    </section>
  );
}
