import { Platform } from 'react-native';

// The app ships its own font (Inter, in assets/fonts) so Android and iOS draw the same letters.
// Only these four weights exist; any other fontWeight in a style is rounded to the nearest one.
export type FontWeight = 400 | 600 | 700 | 800;

// iOS finds embedded fonts by PostScript name, Android by file name (see the expo-font plugin in app.json).
const FAMILIES: Record<FontWeight, string> = Platform.select({
  ios: { 400: 'Inter-Regular', 600: 'Inter-SemiBold', 700: 'Inter-Bold', 800: 'Inter-ExtraBold' },
  default: { 400: 'Inter_400Regular', 600: 'Inter_600SemiBold', 700: 'Inter_700Bold', 800: 'Inter_800ExtraBold' },
});

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

// Props for react-native-svg <Text>. On iOS it picks the face from family + weight (a PostScript name
// alone falls back to Regular); on Android the per-weight file name is the family.
export function svgFont(weight: FontWeight) {
  return Platform.OS === 'ios'
    ? { fontFamily: 'Inter', fontWeight: String(weight) as `${FontWeight}` }
    : { fontFamily: fontFamily(weight) };
}
