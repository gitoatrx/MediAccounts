import { useEffect } from "react";
import * as Haptics from "expo-haptics";

// Small vibrations for important moments only (never on ordinary taps).
// A device without a vibration motor simply ignores them.
const run = (feedback: () => Promise<void>) => {
  try { void feedback().catch(() => undefined); } catch { /* not supported */ }
};

export const haptic = {
  /** Long press opened, pull-to-refresh started. */
  light: () => run(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)),
  /** A swipe gesture completed (e.g. sheet swiped closed). */
  medium: () => run(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)),
  /** Something was saved, uploaded, imported or matched. */
  success: () => run(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)),
  /** A red error message appeared. */
  error: () => run(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)),
};

/** Buzzes once each time a new message appears: error or success. */
export function useMessageHaptic(message: string | null | undefined, isError: boolean) {
  useEffect(() => {
    if (!message || message.endsWith("…")) return;
    if (isError) haptic.error(); else haptic.success();
  }, [message]);
}
