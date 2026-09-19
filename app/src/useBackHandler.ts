import { useEffect, useRef } from 'react';
import { addBackListener } from './backStack';

/**
 * Handles the Android back button / back swipe (and the iPhone edge swipe) while `active` is true.
 * The most recently registered handler runs first, so a sheet or form
 * opened inside a page closes before the app-level navigation runs.
 */
export function useBackHandler(active: boolean, onBack: () => void) {
  const handler = useRef(onBack);
  handler.current = onBack;
  useEffect(() => {
    if (!active) return;
    const subscription = addBackListener(() => {
      handler.current();
      return true;
    });
    return () => subscription.remove();
  }, [active]);
}
