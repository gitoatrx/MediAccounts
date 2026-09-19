import { useRef, type ReactNode } from 'react';
import { PanResponder, Platform, View } from 'react-native';
import { goBack } from './backStack';
import { haptic } from './haptics';

// Starting a swipe this close to the left edge (in points) counts as "back".
const EDGE = 24;
// How far right the finger must travel, or how fast, to go back.
const DISTANCE = 70;
const VELOCITY = 0.5;

/**
 * iPhone "swipe from the left edge to go back". Only a rightward drag that starts at the edge is
 * captured, so taps and normal scrolling are untouched. Android uses its own back gesture.
 */
export function EdgeSwipeBack({ children }: { children: ReactNode }) {
  const responder = useRef(PanResponder.create({
    onMoveShouldSetPanResponderCapture: (_, gesture) =>
      gesture.x0 <= EDGE && gesture.dx > 12 && Math.abs(gesture.dy) < gesture.dx,
    onPanResponderRelease: (_, gesture) => {
      if (gesture.dx > DISTANCE || gesture.vx > VELOCITY) {
        if (goBack()) haptic.light();
      }
    },
  })).current;
  if (Platform.OS !== 'ios') return <>{children}</>;
  return <View style={{ flex: 1 }} {...responder.panHandlers}>{children}</View>;
}
