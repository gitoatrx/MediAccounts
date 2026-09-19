import { createContext, useContext, type ComponentProps, type Ref } from 'react';
import { StyleSheet, Text as RNText, TextInput as RNTextInput, type TextStyle } from 'react-native';
import { fontFamily, toFontWeight, USE_INTER, type FontWeight } from './typography';

// Drop-in replacements for React Native's Text and TextInput. On iPhone they draw with the bundled
// Inter font: the style's fontWeight picks the Inter file, and fontWeight itself is removed so iOS
// doesn't fake extra boldness on top. Nested Text without its own weight keeps its parent's weight.
// On Android they are React Native's own components, unchanged.
const ParentWeight = createContext<FontWeight>(400);

function resolve(style: ComponentProps<typeof RNText>['style'], inherited: FontWeight) {
  const flat = (StyleSheet.flatten(style) ?? {}) as TextStyle;
  const weight = toFontWeight(flat.fontWeight) ?? inherited;
  const { fontWeight: _ignored, ...rest } = flat;
  return { weight, style: [rest, { fontFamily: fontFamily(weight) }] };
}

function InterText(props: ComponentProps<typeof RNText>) {
  const { weight, style } = resolve(props.style, useContext(ParentWeight));
  return (
    <ParentWeight.Provider value={weight}>
      <RNText {...props} style={style} />
    </ParentWeight.Provider>
  );
}

function InterTextInput(props: ComponentProps<typeof RNTextInput> & { ref?: Ref<RNTextInput> }) {
  const { style } = resolve(props.style, 400);
  return <RNTextInput {...props} style={style} />;
}

export const Text = (USE_INTER ? InterText : RNText) as typeof RNText;
export const TextInput = (USE_INTER ? InterTextInput : RNTextInput) as typeof RNTextInput;

// Keeps `useRef<TextInput>(null)` working where the component is used as a type.
export type TextInput = RNTextInput;
