import { createContext, useContext, type ComponentProps, type Ref } from 'react';
import { StyleSheet, Text as RNText, TextInput as RNTextInput, type TextStyle } from 'react-native';
import { fontFamily, toFontWeight, type FontWeight } from './typography';

// Drop-in replacements for React Native's Text and TextInput that draw with the bundled Inter font.
// The style's fontWeight picks the Inter file; fontWeight itself is removed so neither platform
// fakes extra boldness on top. Nested Text without its own weight keeps its parent's weight.
const ParentWeight = createContext<FontWeight>(400);

function resolve(style: ComponentProps<typeof RNText>['style'], inherited: FontWeight) {
  const flat = (StyleSheet.flatten(style) ?? {}) as TextStyle;
  const weight = toFontWeight(flat.fontWeight) ?? inherited;
  const { fontWeight: _ignored, ...rest } = flat;
  return { weight, style: [rest, { fontFamily: fontFamily(weight) }] };
}

export function Text(props: ComponentProps<typeof RNText>) {
  const { weight, style } = resolve(props.style, useContext(ParentWeight));
  return (
    <ParentWeight.Provider value={weight}>
      <RNText {...props} style={style} />
    </ParentWeight.Provider>
  );
}

export function TextInput(props: ComponentProps<typeof RNTextInput> & { ref?: Ref<RNTextInput> }) {
  const { style } = resolve(props.style, 400);
  return <RNTextInput {...props} style={style} />;
}

// Keeps `useRef<TextInput>(null)` working where the component is used as a type.
export type TextInput = RNTextInput;
