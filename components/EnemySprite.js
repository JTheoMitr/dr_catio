import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Animated, Image, StyleSheet } from 'react-native';

export default function EnemySprite({
  source,
  frames = 16,
  fps = 10,
  scale = 1,
  speed = 40, // px/sec
  y = 0,
  bannerWidth,
  bannerHeight,
  mechBounds = null,
  onHit,
  onDespawn,
}) {
  const [frameIndex, setFrameIndex] = useState(0);
  const [isAlive, setIsAlive] = useState(true);

  // ✅ auto-measure spritesheet dimensions
  const asset = useMemo(() => Image.resolveAssetSource(source), [source]);
  const sheetW = asset?.width ?? 0;
  const sheetH = asset?.height ?? 0;

  const frameW = sheetW > 0 ? sheetW / frames : 0;
  const frameH = sheetH;

  const spriteW = frameW * scale;
  const spriteH = frameH * scale;

  const x = useRef(new Animated.Value(0)).current;
  const rafRef = useRef(null);
  const lastTRef = useRef(null);

  // If we can't size yet or banner isn't measured, bail
  const ready =
    isAlive &&
    bannerWidth > 0 &&
    bannerHeight > 0 &&
    sheetW > 0 &&
    sheetH > 0 &&
    spriteW > 0 &&
    spriteH > 0;

  // Frame loop
  useEffect(() => {
    if (!ready) return;
    const interval = setInterval(() => {
      setFrameIndex((i) => (i + 1) % frames);
    }, Math.floor(1000 / fps));
    return () => clearInterval(interval);
  }, [ready, frames, fps]);

  // Start at right edge once ready
  useEffect(() => {
    if (!ready) return;
    x.setValue(bannerWidth + spriteW);
  }, [ready, bannerWidth, spriteW, x]);

  // Movement + collision
  useEffect(() => {
    if (!ready) return;

    const tick = (t) => {
      if (!lastTRef.current) lastTRef.current = t;
      const dt = (t - lastTRef.current) / 1000;
      lastTRef.current = t;

      // move left
      x.setValue(x.__getValue() - speed * dt);

      const currentX = x.__getValue();
      const enemyRect = { x: currentX, y, width: spriteW, height: spriteH };

    if (mechBounds) {
        const overlapX =
            Math.min(enemyRect.x + enemyRect.width, mechBounds.x + mechBounds.width) -
            Math.max(enemyRect.x, mechBounds.x);

        const overlapY =
            Math.min(enemyRect.y + enemyRect.height, mechBounds.y + mechBounds.height) -
            Math.max(enemyRect.y, mechBounds.y);

        const MIN_OVERLAP_X = 53; // ✅ require 53px horizontal overlap
        const hit = overlapX >= MIN_OVERLAP_X && overlapY > 0;

        if (hit) {
            setIsAlive(false);
            onHit?.();
            onDespawn?.();
            return; // stop ticking
        }
    }


      // offscreen left
      if (currentX + spriteW < 0) {
        setIsAlive(false);
        onDespawn?.();
        return;
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      lastTRef.current = null;
    };
  }, [ready, speed, y, spriteW, spriteH, mechBounds, onHit, onDespawn, x]);

  if (!ready) return null;

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.enemy,
        {
          width: spriteW,
          height: spriteH,
          transform: [{ translateX: x }, { translateY: y }],
        },
      ]}
    >
      <View style={{ width: spriteW, height: spriteH, overflow: 'hidden' }}>
        <Image
          source={source}
          resizeMode="stretch"
          style={{
            width: sheetW * scale,
            height: sheetH * scale,
            transform: [{ translateX: -frameIndex * frameW * scale }],
          }}
        />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  enemy: {
    position: 'absolute',
    left: 0,
    top: 0,
    zIndex: 0,     // ✅ on top
    elevation: 0,  // ✅ android
    borderWidth: 2,
    borderColor: 'red',
  },
});
