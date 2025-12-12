// components/ExplosionEffect.js
import React, { useEffect, useRef, useState } from 'react';
import { View, Animated, StyleSheet, Image } from 'react-native';

const DEFAULT_FPS = 24;

// ✅ Update these two numbers to match your spritesheet:
const FRAMES = 80; // total frames in sheet
const COLS = 10;    // columns in sheet (rows are derived)

export default function ExplosionEffect({
  x,
  y,
  sizePx,
  source,
  fps = DEFAULT_FPS,
  onComplete,
}) {
  const [frame, setFrame] = useState(0);
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const timerRef = useRef(null);

  // Resolve the actual image size so we can compute frame sizes correctly
  const resolved = Image.resolveAssetSource(source);
  const sheetW = resolved?.width ?? (COLS * 256);
  const rows = Math.ceil(FRAMES / COLS);
  const sheetH = resolved?.height ?? (rows * 256);

  const frameW = sheetW / COLS;
  const frameH = sheetH / rows;

  // Scale the whole sheet so a single frame renders at sizePx
  const scale = sizePx / frameW;

  useEffect(() => {
    const frameDuration = 1000 / fps;

    timerRef.current = setInterval(() => {
      setFrame(prev => {
        const next = prev + 1;
        if (next >= FRAMES) {
          // Done
          clearInterval(timerRef.current);
          timerRef.current = null;
          onComplete?.();
          return prev; // keep last frame briefly (doesn't matter; we unmount)
        }
        return next;
      });
    }, frameDuration);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [fps, onComplete]);

  useEffect(() => {
    const row = Math.floor(frame / COLS);
    const col = frame % COLS;

    Animated.parallel([
      Animated.timing(translateX, { toValue: -col * frameW * scale, duration: 0, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: -row * frameH * scale, duration: 0, useNativeDriver: true }),
    ]).start();
  }, [frame, frameW, frameH, scale, translateX, translateY]);

  return (
    <View
      pointerEvents="none"
      style={[
        styles.wrapper,
        {
          left: x - sizePx / 2,
          top: y - sizePx / 2,
          width: sizePx,
          height: sizePx,
        },
      ]}
    >
      <View style={styles.clip}>
        <Animated.Image
          source={source}
          style={{
            width: sheetW * scale,
            height: sheetH * scale,
            transform: [{ translateX }, { translateY }],
          }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
  },
  clip: {
    overflow: 'hidden',
    width: '100%',
    height: '100%',
  },
});
