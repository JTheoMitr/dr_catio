// components/LevelBlockMeter.js
import React, { useEffect, useRef } from 'react';
import { View, Image, Animated, StyleSheet } from 'react-native';

const meterImages = [
  require('../assets/block_meter/block_meter_1.png'),
  require('../assets/block_meter/block_meter_2.png'),
  require('../assets/block_meter/block_meter_3.png'),
  require('../assets/block_meter/block_meter_4.png'),
  require('../assets/block_meter/block_meter_5.png'),
];

const glowImage = require('../assets/block_meter/block_glow.png');

const LevelBlockMeter = ({ level, size = 80 }) => {
  // Determine which meter image to use.
  // Levels 1–5 -> 1, 6–10 -> 2, 11–15 -> 3, 16–20 -> 4, 21–25 -> 5, 26–30 -> 1, etc.
  const meterIndex = (level - 1) % 5;
  const meterSource = meterImages[meterIndex] || meterImages[0];

  // Glow opacity animation
  const glowOpacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(glowOpacity, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(glowOpacity, {
          toValue: 0.2,
          duration: 900,
          useNativeDriver: true,
        }),
      ])
    );

    loop.start();
    return () => loop.stop();
  }, [glowOpacity]);

  return (
    <View
      style={[
        styles.container,
        { width: size, height: size },
      ]}
      pointerEvents="none"
    >
      {/* Base meter sprite */}
      <Image
        source={meterSource}
        style={styles.image}
        resizeMode="contain"
      />

      {/* Glow overlay */}
      <Animated.Image
        source={glowImage}
        style={[
          styles.glow,
          {
            opacity: glowOpacity,
          },
        ]}
        resizeMode="contain"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  image: {
    width: '100%',
    height: '100%',
    marginLeft: 2,
  },
  glow: {
    position: 'absolute',
    marginLeft: 2,
    width: '100%',   // a tiny bit larger to feel like a glow
    height: '100%',
  },
});

export default LevelBlockMeter;
