import React, { useEffect, useRef, useState } from 'react';
import { View, Animated, StyleSheet, Dimensions } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const ANIMATION_CONFIG = {
  default: { frames: 6, file: require('../assets/animations/default-spritesheet.png') },
  match: { frames: 10, file: require('../assets/animations/match-spritesheet.png') },
  win: { frames: 7, file: require('../assets/animations/win-spritesheet.png') },
  lose: { frames: 8, file: require('../assets/animations/lose-spritesheet.png') },
};

const FRAME_SIZE = 128;
const ANIMATION_SCALE = 1.0; // 100% of original size
const SCALED_FRAME_SIZE = FRAME_SIZE * ANIMATION_SCALE;
const FPS = 5;
const FRAME_DURATION = 1000 / FPS; // milliseconds per frame

const AnimatedSprite = ({ animationType = 'default' }) => {
  const translateX = useRef(new Animated.Value(0)).current;
  const [currentAnimation, setCurrentAnimation] = useState(animationType);
  const [currentFrame, setCurrentFrame] = useState(0);
  const frameIntervalRef = useRef(null);

  useEffect(() => {
    // When animation type changes, reset to that animation
    setCurrentAnimation(animationType);
    setCurrentFrame(0);
  }, [animationType]);

  useEffect(() => {
    const config = ANIMATION_CONFIG[currentAnimation];
    if (!config) return;

    const totalFrames = config.frames;

    // Clear any existing interval
    if (frameIntervalRef.current) {
      clearInterval(frameIntervalRef.current);
    }

    // Reset frame when animation changes
    setCurrentFrame(0);
    translateX.setValue(0);

    // Update frame position - all animations loop
    const updateFrame = () => {
      setCurrentFrame(prevFrame => {
        const nextFrame = prevFrame + 1;
        // Loop all animations using modulo
        return nextFrame % totalFrames;
      });
    };

    // Set up interval for frame updates
    frameIntervalRef.current = setInterval(updateFrame, FRAME_DURATION);

    return () => {
      if (frameIntervalRef.current) {
        clearInterval(frameIntervalRef.current);
      }
    };
  }, [currentAnimation, translateX]);

  // Update translateX when currentFrame changes
  useEffect(() => {
    translateX.setValue(-currentFrame * SCALED_FRAME_SIZE);
  }, [currentFrame, translateX]);

  const config = ANIMATION_CONFIG[currentAnimation];
  if (!config) return null;

  const spriteSheetWidth = config.frames * SCALED_FRAME_SIZE;

  return (
    <View style={styles.container}>
      <View style={[styles.spriteContainer, { width: SCALED_FRAME_SIZE, height: SCALED_FRAME_SIZE }]}>
        <Animated.Image
          source={config.file}
          style={[
            styles.spriteSheet,
            {
              width: spriteSheetWidth,
              height: SCALED_FRAME_SIZE,
              transform: [{ translateX }],
            },
          ]}
          resizeMode="contain"
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  spriteContainer: {
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  spriteSheet: {
    // Sprite sheet image
  },
});

export default AnimatedSprite;

