import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { UI_SCALE } from './ScaledRoot';

/**
 * iPhone status bar / Dynamic Island (top) and home bar (bottom) heights, in the app's scaled
 * layout units. Android keeps its existing fixed spacing, so this returns 0 there.
 */
export function useIosInsets() {
  const insets = useSafeAreaInsets();
  if (Platform.OS !== 'ios') return { top: 0, bottom: 0 };
  return { top: insets.top / UI_SCALE, bottom: insets.bottom / UI_SCALE };
}
