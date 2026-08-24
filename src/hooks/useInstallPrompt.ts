import { useCallback, useEffect, useState } from 'react';
import {
  dismissInstallTip,
  installTipKind,
  isInstallTipDismissed,
  isIosSafari,
  isStandaloneDisplay,
  type InstallTipKind,
} from '../game/installPrompt';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export function useInstallPrompt(): {
  kind: InstallTipKind;
  install: () => Promise<void>;
  dismiss: () => void;
} {
  const [canPrompt, setCanPrompt] = useState(false);
  const [dismissed, setDismissed] = useState(isInstallTipDismissed);
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const onPrompt = (event: Event) => {
      event.preventDefault();
      const promptEvent = event as BeforeInstallPromptEvent;
      setDeferred(promptEvent);
      setCanPrompt(true);
    };
    window.addEventListener('beforeinstallprompt', onPrompt);
    return () => window.removeEventListener('beforeinstallprompt', onPrompt);
  }, []);

  const install = useCallback(async () => {
    if (!deferred) return;
    await deferred.prompt();
    const choice = await deferred.userChoice;
    setDeferred(null);
    setCanPrompt(false);
    if (choice.outcome === 'accepted') {
      dismissInstallTip();
      setDismissed(true);
    }
  }, [deferred]);

  const dismiss = useCallback(() => {
    dismissInstallTip();
    setDismissed(true);
  }, []);

  const kind = installTipKind({
    standalone: isStandaloneDisplay(),
    dismissed,
    canPrompt,
    iosSafari: isIosSafari(),
  });

  return { kind, install, dismiss };
}
