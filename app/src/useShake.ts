import { Accelerometer } from 'expo-sensors';
import { useEffect, useRef } from 'react';
import { AppState, Platform } from 'react-native';

// Readings are in g. At rest the magnitude is ~1g (gravity), so a spike well
// above that is a deliberate jolt rather than normal handling.
const SHAKE_THRESHOLD_G = 1.8;
// A shake is several jolts close together; one bump (e.g. setting the phone down) is ignored.
const JOLTS_REQUIRED = 2;
const JOLT_WINDOW_MS = 700;
// Readings closer than this belong to the same jolt.
const MIN_JOLT_GAP_MS = 120;
// After a shake is recognised, ignore motion for this long.
const COOLDOWN_MS = 1500;
// ~16 readings per second reliably catches shake peaks while keeping JS work tiny.
const UPDATE_INTERVAL_MS = 60;
// When detection resumes (e.g. the menu was just closed), ignore motion briefly so a
// shake that is still in progress does not reopen it straight away.
const RESUME_GRACE_MS = 800;

/**
 * Calls onShake once per physical shake while `enabled` is true.
 * The sensor is only subscribed while enabled and the app is in the foreground.
 */
export function useShake(enabled: boolean, onShake: () => void) {
  const onShakeRef = useRef(onShake);
  onShakeRef.current = onShake;
  // Survives re-subscribing, so the cooldown still applies after the menu closes.
  const cooldownUntilRef = useRef(0);

  useEffect(() => {
    if (!enabled || Platform.OS === 'web') return;

    let subscription: { remove: () => void } | null = null;
    let cancelled = false;
    let jolts: number[] = [];
    let lastJoltAt = 0;

    const start = async () => {
      if (subscription || cancelled) return;
      const available = await Accelerometer.isAvailableAsync().catch(() => false);
      if (!available || cancelled || subscription) return;
      cooldownUntilRef.current = Math.max(cooldownUntilRef.current, Date.now() + RESUME_GRACE_MS);
      Accelerometer.setUpdateInterval(UPDATE_INTERVAL_MS);
      subscription = Accelerometer.addListener(({ x, y, z }) => {
        const now = Date.now();
        if (now < cooldownUntilRef.current) return;
        if (Math.sqrt(x * x + y * y + z * z) < SHAKE_THRESHOLD_G) return;
        if (now - lastJoltAt < MIN_JOLT_GAP_MS) return;
        lastJoltAt = now;
        jolts = [...jolts.filter((time) => now - time <= JOLT_WINDOW_MS), now];
        if (jolts.length >= JOLTS_REQUIRED) {
          jolts = [];
          cooldownUntilRef.current = now + COOLDOWN_MS;
          onShakeRef.current();
        }
      });
    };

    const stop = () => {
      subscription?.remove();
      subscription = null;
      jolts = [];
    };

    if (AppState.currentState === 'active') void start();
    // Release the sensor in the background so it costs no battery there.
    const appState = AppState.addEventListener('change', (state) => {
      if (state === 'active') void start();
      else stop();
    });

    return () => {
      cancelled = true;
      appState.remove();
      stop();
    };
  }, [enabled]);
}
