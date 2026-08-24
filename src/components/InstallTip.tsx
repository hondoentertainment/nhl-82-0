import { useInstallPrompt } from '../hooks/useInstallPrompt';

export function InstallTip() {
  const { kind, install, dismiss } = useInstallPrompt();
  if (kind === 'none') return null;

  return (
    <aside className="install-tip" data-testid="install-tip">
      <div>
        <p className="install-tip-title">Add 82-0 to your Home Screen</p>
        {kind === 'install' ? (
          <p className="install-tip-copy">Install the app for one-tap Daily and offline play.</p>
        ) : (
          <p className="install-tip-copy">
            Tap Share, then <strong>Add to Home Screen</strong>.
          </p>
        )}
      </div>
      <div className="install-tip-actions">
        {kind === 'install' && (
          <button
            type="button"
            className="btn btn-secondary"
            data-testid="install-accept"
            onClick={() => void install()}
          >
            Install
          </button>
        )}
        <button type="button" className="btn btn-ghost" data-testid="install-dismiss" onClick={dismiss}>
          Not now
        </button>
      </div>
    </aside>
  );
}
