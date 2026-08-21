import { POSITION_LABELS } from '../config/constants';
import type { RosterSlot } from '../types/game';

export function RosterBoard({ roster }: { roster: RosterSlot[] }) {
  return (
    <div className="roster-board" aria-label="Your roster" data-testid="roster-board">
      {roster.map((slot) => (
        <div
          key={slot.position}
          className={`slot ${slot.player ? 'filled' : ''}`}
          title={POSITION_LABELS[slot.position]}
          data-testid={`slot-${slot.position}`}
          data-filled={slot.player ? 'true' : 'false'}
        >
          <div className="slot-pos">{slot.position}</div>
          {slot.player ? (
            <div className="slot-name">{slot.player.name}</div>
          ) : (
            <div className="slot-empty">Open</div>
          )}
        </div>
      ))}
    </div>
  );
}
