import { useEffect } from 'react';
import { AppState } from 'react-native';
import { useSessionStore } from '../state/sessionStore';

/**
 * Hydrates once on cold launch and re-checks expiry whenever the app returns to the
 * foreground. Living in a hook keeps the decision out of the storage layer.
 */
export const useSessionLifecycle = () => {
  const hydrate = useSessionStore((s) => s.hydrate);
  const revalidate = useSessionStore((s) => s.revalidate);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') void revalidate();
    });
    return () => sub.remove();
  }, [revalidate]);
};
