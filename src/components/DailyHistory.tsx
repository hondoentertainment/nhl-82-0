import {
  dailyHistoryGrid,
  formatHistoryDay,
  type DailyHistoryDay,
} from '../game/dailyHistory';

function dayLabel(day: DailyHistoryDay): string {
  const name = formatHistoryDay(day.dateKey);
  if (day.entry) return `${name}: ${day.entry.wins}-${day.entry.losses} ${day.entry.gradeLabel}`;
  if (day.isToday) return `${name}: today, not played`;
  return `${name}: not played`;
}

export function DailyHistoryStrip({ compact = false }: { compact?: boolean }) {
  const grid = dailyHistoryGrid();
  const played = grid.filter((d) => d.entry).length;
  if (compact && played === 0) return null;

  return (
    <section
      className={compact ? 'daily-history daily-history-compact' : 'daily-history'}
      data-testid={compact ? 'daily-history-home' : 'daily-history'}
    >
      {!compact && (
        <>
          <h3 className="subhead">Last 14 days</h3>
          <p className="lede" style={{ marginBottom: '0.75rem' }}>
            Your Daily results on this device. Play consecutive UTC days to keep the streak.
          </p>
        </>
      )}
      <ol className="daily-history-strip" aria-label="Daily results for the last 14 days">
        {grid.map((day) => (
          <li key={day.dateKey}>
            <span
              className={[
                'daily-history-cell',
                day.entry ? 'played' : 'missed',
                day.isToday ? 'today' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              title={dayLabel(day)}
              data-testid={`daily-day-${day.dateKey}`}
              data-played={day.entry ? '1' : '0'}
            >
              <span className="sr-only">{dayLabel(day)}</span>
            </span>
          </li>
        ))}
      </ol>
      {!compact && (
        <ul className="daily-history-list" data-testid="daily-history-list">
          {grid
            .filter((d) => d.entry)
            .reverse()
            .map((day) => (
              <li key={day.dateKey}>
                <strong>{formatHistoryDay(day.dateKey)}</strong>
                <span>
                  {day.entry!.wins}-{day.entry!.losses} · {day.entry!.gradeLabel}
                </span>
              </li>
            ))}
          {played === 0 && <li className="empty-pool">No Daily results in the last 14 days.</li>}
        </ul>
      )}
    </section>
  );
}
