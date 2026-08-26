import { useState } from 'react';
import { loadDisplayName, saveDisplayName } from '../game/displayName';

export function DisplayNameField({ compact = false }: { compact?: boolean }) {
  const [value, setValue] = useState(() => loadDisplayName());
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const persist = () => {
    const name = saveDisplayName(value);
    if (!name) {
      setError('Use 2–20 letters, numbers, or spaces.');
      setSaved(false);
      return;
    }
    setValue(name);
    setError(null);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1600);
  };

  return (
    <div className={compact ? 'name-field compact' : 'name-field'} data-testid="display-name">
      {!compact && <p className="section-label">Board name</p>}
      <div className="challenge-row">
        <input
          type="text"
          className="challenge-input"
          placeholder="Name for the boards"
          aria-label="Display name"
          data-testid="display-name-input"
          value={value}
          maxLength={20}
          onChange={(e) => setValue(e.target.value)}
        />
        <button type="button" className="btn btn-secondary" onClick={persist}>
          Save
        </button>
      </div>
      {error && <p className="field-error">{error}</p>}
      {saved && <p className="toast">Name saved on this device.</p>}
    </div>
  );
}
