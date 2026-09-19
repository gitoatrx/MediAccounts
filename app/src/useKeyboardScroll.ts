import { useEffect, useRef, useState, type RefObject } from 'react';
import { Keyboard, TextInput, type NativeScrollEvent, type NativeSyntheticEvent, type ScrollView } from 'react-native';
import { UI_SCALE } from './ScaledRoot';

const GAP = 28;

/**
 * Keeps the field being typed in visible above the keyboard.
 * The app draws edge-to-edge, so Android does not shrink the screen when the keyboard
 * opens, and ScaledRoot's scale transform confuses its own "scroll to focused field".
 * Spread `scrollProps` onto the form's ScrollView and render `keyboardSpace` as the
 * height of a spacer at the end of its content so there is room to scroll.
 */
export function useKeyboardScroll(scrollRef: RefObject<ScrollView | null>) {
  const offset = useRef(0);
  const keyboardTop = useRef<number | null>(null);
  const lastInput = useRef<unknown>(null);
  const [keyboardSpace, setKeyboardSpace] = useState(0);

  useEffect(() => {
    const reveal = () => {
      const input = TextInput.State.currentlyFocusedInput();
      const top = keyboardTop.current;
      if (!input || top === null || !scrollRef.current) return;
      input.measureInWindow((_x, y, _width, height) => {
        const hiddenBy = y + height + GAP - top;
        if (hiddenBy > 0) scrollRef.current?.scrollTo({ y: offset.current + hiddenBy / UI_SCALE, animated: true });
      });
    };
    // Focus can move to another field while the keyboard stays open, so check while it is visible.
    let timer: ReturnType<typeof setInterval> | null = null;
    const show = Keyboard.addListener('keyboardDidShow', (event) => {
      keyboardTop.current = event.endCoordinates.screenY;
      setKeyboardSpace(event.endCoordinates.height / UI_SCALE);
      lastInput.current = null;
      if (timer) clearInterval(timer);
      timer = setInterval(() => {
        const input = TextInput.State.currentlyFocusedInput();
        if (input && input !== lastInput.current) { lastInput.current = input; reveal(); }
      }, 250);
      // Wait a frame for the spacer to render before scrolling.
      setTimeout(reveal, 80);
    });
    const hide = Keyboard.addListener('keyboardDidHide', () => {
      keyboardTop.current = null;
      setKeyboardSpace(0);
      if (timer) { clearInterval(timer); timer = null; }
    });
    return () => { show.remove(); hide.remove(); if (timer) clearInterval(timer); };
  }, [scrollRef]);

  return {
    keyboardSpace,
    scrollProps: {
      ref: scrollRef,
      scrollEventThrottle: 16,
      onScroll: (event: NativeSyntheticEvent<NativeScrollEvent>) => { offset.current = event.nativeEvent.contentOffset.y; },
    },
  };
}
