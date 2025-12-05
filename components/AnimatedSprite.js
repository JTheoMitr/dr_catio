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
  background: {
    frames: 37, // (6 rows × 6 cols) + 1 frame in row 7 = 36 + 1 = 37
    file: require('../assets/backgrounds/spacelab_hall_background_1.png'),
    grid: { rowsPerRow: [6, 6, 6, 6, 6, 6, 1] }, // Rows 0-5: 6 cols each, Row 6: 1 col
    sheetWidth: 1920, // 6 columns × 320px per frame
    sheetHeight: 1183 // 7 rows × 169px per frame
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

const AnimatedSprite = ({ animationType = 'default', scale = 1.0 }) => {
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
       // console.log(`[AnimatedSprite] Frame update: ${prevFrame} -> ${newFrame} (total: ${totalFrames})`);
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
    // Scale the offsets by the scale factor so they match the scaled sprite sheet
    const frameOffsetX = -col * frameWidth * scale;
    const frameOffsetY = -row * frameHeight * scale;
    
   // console.log(`[AnimatedSprite] Transform update - Frame: ${currentFrame}, Row: ${row}, Col: ${col}, X: ${frameOffsetX}, Y: ${frameOffsetY}, Animation: ${currentAnimation}`);
    
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
  }, [currentFrame, currentAnimation, scale]);
  
  // Calculate actual frame dimensions for this animation
  const numRows = config.grid.rows || (config.grid.rowsPerRow ? config.grid.rowsPerRow.length : 1);
  const numCols = config.grid.cols || Math.max(...(config.grid.rowsPerRow || [4]));
  const frameWidth = config.sheetWidth / numCols;
  const frameHeight = config.sheetHeight / numRows;

  // Use actual image file dimensions for the sprite sheet, scaled by the scale prop
  const spriteSheetWidth = config.sheetWidth * scale;
  const spriteSheetHeight = config.sheetHeight * scale;
  // Use actual frame dimensions scaled by the scale prop for container size
  const scaledContainerWidth = frameWidth * scale;
  const scaledContainerHeight = frameHeight * scale;

  return (
    <View style={styles.container}>
      <View style={[styles.spriteContainer, { width: scaledContainerWidth, height: scaledContainerHeight }]}>
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

