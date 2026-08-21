import { useMemo } from 'react';
import type { Position } from '../config/constants';
import { formatSalary, playerSalary } from '../game/salary';
import type { Player, RosterSlot } from '../types/game';

function formatSkater(p: Player): string {
  const s = p.skater;
  if (!s) return '';
  return `${s.g82} G · ${s.a82} A · ${s.g82 + s.a82} P /82 · ${s.pim82} PIM`;
}

function formatGoalie(p: Player): string {
  const g = p.goalie;
  if (!g) return '';
  return `${g.gaa.toFixed(2)} GAA · ${(g.svPct * 100).toFixed(1)} SV%`;
}

function formatTough(p: Player): string {
  if (p.goalie) return formatGoalie(p);
  const s = p.skater;
  if (!s) return '';
  return `${s.pim82} PIM /82 · ${s.g82 + s.a82} P`;
}

function tierDots(tier: number): string {
  return '●'.repeat(tier) + '○'.repeat(5 - tier);
}

export function PlayerPicker({
  players,
  roster,
  showStats,
  salaryMode,
  toughMode,
  salaryRemaining,
  onPick,
}: {
  players: Player[];
  roster: RosterSlot[];
  showStats: boolean;
  salaryMode: boolean;
  toughMode: boolean;
  salaryRemaining: number | null;
  onPick: (player: Player, position: Position) => void;
}) {
  const open = useMemo(
    () => new Set(roster.filter((s) => !s.player).map((s) => s.position)),
    [roster],
  );

  if (!players.length) {
    return (
      <div className="empty-pool">
        No eligible players for your open positions. Use a skip if you have one, or redraw when
        available.
      </div>
    );
  }

  return (
    <div className="player-list" data-testid="player-list">
      {players.map((player) => {
        const eligible = player.positions.filter((p) => open.has(p));
        const salary = playerSalary(player);
        const unaffordable =
          salaryMode && salaryRemaining != null && salary > salaryRemaining;
        return (
          <div
            key={player.id}
            className={`player-card ${unaffordable ? 'unaffordable' : ''}`}
            data-testid={`player-${player.id}`}
          >
            <div className="player-top">
              <div>
                <div className="player-name">{player.name}</div>
                <div className="badges">
                  <span className="tier-dots" aria-label={`Tier ${player.tier}`}>
                    {tierDots(player.tier)}
                  </span>
                  {player.hof && <span className="badge hof">HOF</span>}
                  {salaryMode && (
                    <span className="badge salary">{formatSalary(salary)}</span>
                  )}
                  {eligible.map((p) => (
                    <span key={p} className="badge">
                      {p}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {showStats && (
              <div className="stats">
                <span>
                  {toughMode
                    ? formatTough(player)
                    : player.goalie
                      ? formatGoalie(player)
                      : formatSkater(player)}
                </span>
              </div>
            )}

            {unaffordable ? (
              <div className="stats" style={{ opacity: 0.7 }}>
                Over remaining cap
              </div>
            ) : (
              <div className="pos-picks">
                {eligible.map((pos) => (
                  <button
                    key={pos}
                    type="button"
                    data-testid={`draft-${player.id}-${pos}`}
                    onClick={() => onPick(player, pos)}
                  >
                    Draft to {pos}
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
