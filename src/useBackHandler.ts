import { useEffect, useRef } from 'react';
import { BackHandler } from 'react-native';

/**
 * Handles the Android back button / back swipe while `active` is true.
 * Android asks the most recently registered handler first, so a sheet or form
 * opened inside a page closes before the app-level navigation runs.
 */
export function useBackHandler(active: boolean, onBack: () => void) {
  const handler = useRef(onBack);
  handler.current = onBack;
  useEffect(() => {
    if (!active) return;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      handler.current();
      return true;
    });
    return () => subscription.remove();
  }, [active]);
}
