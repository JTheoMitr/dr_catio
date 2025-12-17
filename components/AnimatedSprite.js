import React, { useEffect, useRef, useState } from 'react';
import { View, Animated, StyleSheet, Dimensions } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const ANIMATION_CONFIG = {
  default: { 
    frames: 16, 
    file: require('../assets/animations/default-spritesheet.png'),
    grid: { rows: 4, cols: 4 },
    sheetWidth: 800,
    sheetHeight: 800,
    loop: true,
  },
  match: { 
    frames: 16, 
    file: require('../assets/animations/match-spritesheet.png'),
    grid: { rows: 4, cols: 4 },
    sheetWidth: 800,
    sheetHeight: 800,
    loop: true,
  },
  win: { 
    frames: 7, 
    file: require('../assets/animations/win-spritesheet.png'),
    grid: { rowsPerRow: [3, 3, 1] },
    sheetWidth: 600,
    sheetHeight: 600,
    loop: true,
  },
  lose: { 
    frames: 14, 
    file: require('../assets/animations/lose-spritesheet.png'),
    grid: { rowsPerRow: [4, 4, 4, 2] },
    sheetWidth: 800,
    sheetHeight: 800,
    loop: false,
  },
  background: {
    frames: 37,
    file: require('../assets/backgrounds/spacelab_hall_background_1.png'),
    grid: { rowsPerRow: [6, 6, 6, 6, 6, 6, 1] },
    sheetWidth: 1920,
    sheetHeight: 1183,
    loop: true,
  },
  mechMeter: {
    frames: 54,
    file: require('../assets/animations/mech_energy_ui_gauge_200x200.png'),
    grid: { rowsPerRow: [9, 9, 9, 9, 9, 9] },
    sheetWidth: 1800,
    sheetHeight: 1200,
    loop: false,
  },
};

const DEFAULT_FPS = 5;

// Helper function to get row and column from frame index
const getFramePosition = (frameIndex, config) => {
  if (config.grid.rows && config.grid.cols) {
    // Uniform grid (default, match)
    const row = Math.floor(frameIndex / config.grid.cols);
    const col = frameIndex % config.grid.cols;
    return { row, col, maxCols: config.grid.cols };
  } else if (config.grid.rowsPerRow) {
    // Variable columns per row (win, lose, background, mechMeter)
    let remainingFrames = frameIndex;
    for (let row = 0; row < config.grid.rowsPerRow.length; row++) {
      const colsInRow = config.grid.rowsPerRow[row];
      if (remainingFrames < colsInRow) {
        return {
          row,
          col: remainingFrames,
          maxCols: Math.max(...config.grid.rowsPerRow),
        };
      }
      remainingFrames -= colsInRow;
    }
    return {
      row: 0,
      col: 0,
      maxCols: Math.max(...config.grid.rowsPerRow),
    };
  }
  return { row: 0, col: 0, maxCols: 4 };
};

const AnimatedSprite = ({
  animationType = 'default',
  scale = 0.90,
  fps,
  resetKey,
  children,
  loop,
  onDeplete,
}) => {
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const [currentAnimation, setCurrentAnimation] = useState(animationType);
  const [currentFrame, setCurrentFrame] = useState(0);
  const frameIntervalRef = useRef(null);
  const depletedRef = useRef(false); // ensure onDeplete fires once

  useEffect(() => {
    // When animation type changes, reset to that animation
    setCurrentAnimation(animationType);
    setCurrentFrame(0);
  }, [animationType]);

  const config = ANIMATION_CONFIG[currentAnimation];
  if (!config) return null;

  // Use config.loop unless loop prop was explicitly provided
  const effectiveLoop = loop ?? config.loop ?? true;

  // Use ref to store current totalFrames to avoid stale closures in interval
  const totalFramesRef = useRef(config.frames);
  useEffect(() => {
    totalFramesRef.current = config.frames;
  }, [config.frames]);

  useEffect(() => {
    if (!config) return;

    // Clear any existing interval
    if (frameIntervalRef.current) {
      clearInterval(frameIntervalRef.current);
      frameIntervalRef.current = null;
    }

    // Reset frame & transforms when animation / fps / resetKey changes
    setCurrentFrame(0);
    translateX.setValue(0);
    translateY.setValue(0);
    depletedRef.current = false;

    const effectiveFps = fps ?? config.fps ?? DEFAULT_FPS;
    const frameDuration = 1000 / effectiveFps;

    const updateFrame = () => {
      setCurrentFrame(prevFrame => {
        const totalFrames = totalFramesRef.current;
        const nextFrame = prevFrame + 1;

        if (effectiveLoop) {
          // Normal looping behavior
          return nextFrame % totalFrames;
        }

        // Non-looping behavior: advance until last frame, then call onDeplete once and freeze
        if (nextFrame >= totalFrames) {
          if (!depletedRef.current) {
            depletedRef.current = true;
            onDeplete && onDeplete();
          }
          // Stop the interval so we don't keep scheduling updates
          if (frameIntervalRef.current) {
            clearInterval(frameIntervalRef.current);
            frameIntervalRef.current = null;
          }
          return totalFrames - 1; // stay on last frame
        }

        return nextFrame;
      });
    };

    frameIntervalRef.current = setInterval(updateFrame, frameDuration);

    return () => {
      if (frameIntervalRef.current) {
        clearInterval(frameIntervalRef.current);
        frameIntervalRef.current = null;
      }
    };
  }, [currentAnimation, fps, resetKey, effectiveLoop, onDeplete, translateX, translateY, config]);

  // Update translateX and translateY when currentFrame changes
  useEffect(() => {
    const currentConfig = ANIMATION_CONFIG[currentAnimation];
    if (!currentConfig) return;

    const numRows =
      currentConfig.grid.rows ||
      (currentConfig.grid.rowsPerRow ? currentConfig.grid.rowsPerRow.length : 1);
    const numCols =
      currentConfig.grid.cols ||
      Math.max(...(currentConfig.grid.rowsPerRow || [4]));
    const frameWidth = currentConfig.sheetWidth / numCols;
    const frameHeight = currentConfig.sheetHeight / numRows;

    const { row, col } = getFramePosition(currentFrame, currentConfig);

    const frameOffsetX = -col * frameWidth * scale;
    const frameOffsetY = -row * frameHeight * scale;

    Animated.parallel([
      Animated.timing(translateX, {
        toValue: frameOffsetX,
        duration: 0,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: frameOffsetY,
        duration: 0,
        useNativeDriver: true,
      }),
    ]).start();
  }, [currentFrame, currentAnimation, scale]);

  // Calculate actual frame dimensions for this animation
  const numRows =
    config.grid.rows || (config.grid.rowsPerRow ? config.grid.rowsPerRow.length : 1);
  const numCols =
    config.grid.cols || Math.max(...(config.grid.rowsPerRow || [4]));
  const frameWidth = config.sheetWidth / numCols;
  const frameHeight = config.sheetHeight / numRows;

  const spriteSheetWidth = config.sheetWidth * scale;
  const spriteSheetHeight = config.sheetHeight * scale;
  const scaledContainerWidth = frameWidth * scale;
  const scaledContainerHeight = frameHeight * scale;

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.spriteContainer,
          { width: scaledContainerWidth, height: scaledContainerHeight },
        ]}
      >
        <Animated.Image
          source={config.file}
          style={[
            styles.spriteSheet,
            {
              width: spriteSheetWidth,
              height: spriteSheetHeight,
              transform: [{ translateX }, { translateY }],
            },
          ]}
        />
        {children}
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
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    position: 'relative',
  },
  spriteSheet: {
    // intentionally empty
  },
});

export default AnimatedSprite;
