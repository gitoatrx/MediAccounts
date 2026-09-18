import { useState, type ReactNode } from 'react';
import { useWindowDimensions, View } from 'react-native';

// The screens were designed with large fixed sizes. Rendering them on a larger
// logical canvas and scaling it down keeps every screen's proportions while
// matching the size of standard Android apps. Change this one value to resize the UI.
export const UI_SCALE = 0.85;

export function ScaledRoot({ children }: { children: ReactNode }) {
  const window = useWindowDimensions();
  const [size, setSize] = useState({ width: window.width, height: window.height });
  const width = size.width / UI_SCALE;
  const height = size.height / UI_SCALE;
  return (
    <View
      // Fill the screen explicitly so the measured size never depends on the content.
      style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, overflow: 'hidden', backgroundColor: '#F3F5FB' }}
      onLayout={(event) => {
        const { width: w, height: h } = event.nativeEvent.layout;
        if (w !== size.width || h !== size.height) setSize({ width: w, height: h });
      }}
    >
      <View
        style={{
          width,
          height,
          transform: [
            { translateX: (size.width - width) / 2 },
            { translateY: (size.height - height) / 2 },
            { scale: UI_SCALE },
          ],
        }}
      >
        {children}
      </View>
    </View>
  );
}
