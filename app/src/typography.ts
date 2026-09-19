import { Platform } from 'react-native';

// iPhone only: the app ships Inter (assets/fonts, embedded for iOS in app.json) and draws all text
// with it. Android keeps the phone's own font and the original font weights, untouched.
export const USE_INTER = Platform.OS === 'ios';

// Only these four Inter weights exist; any other fontWeight in a style is rounded to the nearest one.
export type FontWeight = 400 | 600 | 700 | 800;

// iOS finds embedded fonts by PostScript name.
const FAMILIES: Record<FontWeight, string> = { 400: 'Inter-Regular', 600: 'Inter-SemiBold', 700: 'Inter-Bold', 800: 'Inter-ExtraBold' };

export function toFontWeight(weight: string | number | undefined): FontWeight | undefined {
  if (weight === undefined) return undefined;
  const value = weight === 'normal' ? 400 : weight === 'bold' ? 700 : Number(weight);
  if (!Number.isFinite(value) || value <= 500) return 400;
  if (value <= 600) return 600;
  if (value <= 700) return 700;
  return 800;
}

export function fontFamily(weight: FontWeight) {
  return FAMILIES[weight];
}

// Props for react-native-svg <Text>. On iOS it picks the face from family + weight (a PostScript
// name alone falls back to Regular). On Android only the original weight is passed through.
export function svgFont(weight: FontWeight) {
  if (USE_INTER) return { fontFamily: 'Inter', fontWeight: String(weight) as `${FontWeight}` };
  return weight === 400 ? {} : { fontWeight: String(weight) as `${FontWeight}` };
}
