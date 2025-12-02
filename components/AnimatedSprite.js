import React, { useEffect, useRef, useState } from 'react';
import { View, Animated, StyleSheet, Dimensions } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const ANIMATION_CONFIG = {
  default: { 
    frames: 16, 
    file: require('../assets/animations/default-spritesheet.png'),
    grid: { rows: 4, cols: 4 }, // 4 rows × 4 columns
    sheetWidth: 800, // Actual image file width in pixels
    sheetHeight: 800 // Actual image file height in pixels
  },
  match: { 
    frames: 16, 
    file: require('../assets/animations/match-spritesheet.png'),
    grid: { rows: 4, cols: 4 }, // 4 rows × 4 columns
    sheetWidth: 800, // Actual image file width in pixels
    sheetHeight: 800 // Actual image file height in pixels
  },
  win: { 
    frames: 7, 
    file: require('../assets/animations/win-spritesheet.png'),
    grid: { rowsPerRow: [3, 3, 1] }, // Row 0: 3 cols, Row 1: 3 cols, Row 2: 1 col
    sheetWidth: 600, // Actual image file width in pixels
    sheetHeight: 600 // Actual image file height in pixels
  },
  lose: { 
    frames: 14, 
    file: require('../assets/animations/lose-spritesheet.png'),
    grid: { rowsPerRow: [4, 4, 4, 2] }, // Row 0-2: 4 cols each, Row 3: 2 cols
    sheetWidth: 800, // Actual image file width in pixels
    sheetHeight: 800 // Actual image file height in pixels
  },
};

const FRAME_SIZE = 200;
const ANIMATION_SCALE = 1.0; // 100% of original size
const SCALED_FRAME_SIZE = FRAME_SIZE * ANIMATION_SCALE;
const FPS = 5;
const FRAME_DURATION = 1000 / FPS; // milliseconds per frame

// Helper function to get row and column from frame index
const getFramePosition = (frameIndex, config) => {
  if (config.grid.rows && config.grid.cols) {
    // Uniform grid (default, match)
    const row = Math.floor(frameIndex / config.grid.cols);
    const col = frameIndex % config.grid.cols;
    return { row, col, maxCols: config.grid.cols };
  } else if (config.grid.rowsPerRow) {
    // Variable columns per row (win, lose)
    let remainingFrames = frameIndex;
    for (let row = 0; row < config.grid.rowsPerRow.length; row++) {
      const colsInRow = config.grid.rowsPerRow[row];
      if (remainingFrames < colsInRow) {
        return { row, col: remainingFrames, maxCols: Math.max(...config.grid.rowsPerRow) };
      }
      remainingFrames -= colsInRow;
    }
    return { row: 0, col: 0, maxCols: Math.max(...config.grid.rowsPerRow) };
  }
  return { row: 0, col: 0, maxCols: 4 };
};

const AnimatedSprite = ({ animationType = 'default' }) => {
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const [currentAnimation, setCurrentAnimation] = useState(animationType);
  const [currentFrame, setCurrentFrame] = useState(0);
  const frameIntervalRef = useRef(null);

  useEffect(() => {
    // When animation type changes, reset to that animation
    setCurrentAnimation(animationType);
    setCurrentFrame(0);
  }, [animationType]);

  const config = ANIMATION_CONFIG[currentAnimation];
  if (!config) return null;

  // Use ref to store current totalFrames to avoid stale closures in interval
  const totalFramesRef = useRef(config.frames);
  useEffect(() => {
    totalFramesRef.current = config.frames;
  }, [config.frames]);

  useEffect(() => {
    // Clear any existing interval
    if (frameIntervalRef.current) {
      clearInterval(frameIntervalRef.current);
      frameIntervalRef.current = null;
    }

    // Reset frame when animation changes
    setCurrentFrame(0);
    translateX.setValue(0);
    translateY.setValue(0);

    // Update frame position - all animations loop
    // Use ref to get current totalFrames to avoid stale closure
    const updateFrame = () => {
      setCurrentFrame(prevFrame => {
        const totalFrames = totalFramesRef.current;
        const nextFrame = prevFrame + 1;
        const newFrame = nextFrame % totalFrames;
        console.log(`[AnimatedSprite] Frame update: ${prevFrame} -> ${newFrame} (total: ${totalFrames})`);
        // Loop all animations using modulo
        return newFrame;
      });
    };

    // Set up interval for frame updates
    frameIntervalRef.current = setInterval(updateFrame, FRAME_DURATION);

    return () => {
      if (frameIntervalRef.current) {
        clearInterval(frameIntervalRef.current);
        frameIntervalRef.current = null;
      }
    };
  }, [currentAnimation]); // Only depend on currentAnimation - translateX/translateY are stable refs

  // Update translateX and translateY when currentFrame changes
  useEffect(() => {
    // Get current config (may change if animation type changed)
    const currentConfig = ANIMATION_CONFIG[currentAnimation];
    if (!currentConfig) return;

    // Calculate frame dimensions
    const numRows = currentConfig.grid.rows || (currentConfig.grid.rowsPerRow ? currentConfig.grid.rowsPerRow.length : 1);
    const numCols = currentConfig.grid.cols || Math.max(...currentConfig.grid.rowsPerRow);
    const frameWidth = currentConfig.sheetWidth / numCols;
    const frameHeight = currentConfig.sheetHeight / numRows;

    // Get row and column for current frame
    const { row, col } = getFramePosition(currentFrame, currentConfig);
    
    // Calculate transform values - move sprite sheet to show the correct frame
    // Negative values move the image left/up to position the frame in view
    const frameOffsetX = -col * frameWidth;
    const frameOffsetY = -row * frameHeight;
    
    console.log(`[AnimatedSprite] Transform update - Frame: ${currentFrame}, Row: ${row}, Col: ${col}, X: ${frameOffsetX}, Y: ${frameOffsetY}, Animation: ${currentAnimation}`);
    
    // Use Animated.parallel with zero-duration to ensure both transforms are applied atomically
    // This prevents visual glitches when both X and Y change simultaneously (e.g., row transitions)
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
  }, [currentFrame, currentAnimation]);
  
  // Use actual image file dimensions for the sprite sheet
  const spriteSheetWidth = config.sheetWidth;
  const spriteSheetHeight = config.sheetHeight;

  return (
    <View style={styles.container}>
      <View style={[styles.spriteContainer, { width: SCALED_FRAME_SIZE, height: SCALED_FRAME_SIZE }]}>
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
  },
  spriteSheet: {
    // Sprite sheet image - rendered at native pixel dimensions
    // Transforms will position it to show the correct frame
  },
});

export default AnimatedSprite;

