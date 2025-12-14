import React, { useEffect, useRef } from 'react';
import { View, Image, StyleSheet, Dimensions, Animated } from 'react-native';

const BG_1 = require('../assets/backgrounds/menu_bgnd_1.png');
const BG_2 = require('../assets/backgrounds/menu_bgnd_2.png');

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function MenuBackground({ children }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const fadeAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(fadeAnim, { toValue: 1, duration: 3000, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 0, duration: 3000, useNativeDriver: true }),
      ])
    );

    fadeAnimation.start();
    return () => fadeAnimation.stop();
  }, [fadeAnim]);

  return (
    <View style={styles.container}>
      <View style={styles.backgroundContainer}>
        <Image
          source={BG_1}
          style={[styles.backgroundImage, { transform: [{ rotate: '90deg' }] }]}
          resizeMode="cover"
        />
        <Animated.View style={[styles.backgroundOverlay, { opacity: fadeAnim }]}>
          <Image
            source={BG_2}
            style={[styles.backgroundImage, { transform: [{ rotate: '90deg' }] }]}
            resizeMode="cover"
          />
        </Animated.View>
      </View>

      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, width: '100%', height: '100%' },
  backgroundContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    overflow: 'hidden',
  },
  backgroundImage: {
    position: 'absolute',
    width: SCREEN_HEIGHT,
    height: SCREEN_WIDTH,
    top: (SCREEN_HEIGHT - SCREEN_WIDTH) / 2,
    left: (SCREEN_WIDTH - SCREEN_HEIGHT) / 2,
  },
  backgroundOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
  },
});
