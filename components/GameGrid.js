import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Dimensions, Animated, Platform } from 'react-native';
import { GRID_WIDTH, GRID_HEIGHT } from '../constants/GameConstants';
import GridCell from './GridCell';
import ParticleEffect from './ParticleEffect';
import ExplosionEffect from './ExplosionEffect';


const { width: SCREEN_WIDTH } = Dimensions.get('window');
const MARGIN_PERCENT = 0.025;
const MIN_MARGIN = 15;
const MARGIN = Math.max(SCREEN_WIDTH * MARGIN_PERCENT, MIN_MARGIN);
const ANIMATION_SPACE = 200 + MARGIN - 60;
const BUFFER = 15;
const BASE_CELL_SIZE = Math.floor((SCREEN_WIDTH - ANIMATION_SPACE - BUFFER) / GRID_WIDTH);
export const CELL_SIZE = Math.floor(BASE_CELL_SIZE * 1.2);
const CELL_BORDER_WIDTH = 0.5;
const GRID_HEIGHT_PX = CELL_SIZE * GRID_HEIGHT;
const GRID_WIDTH_WITH_BORDERS = (CELL_SIZE * GRID_WIDTH) + (CELL_BORDER_WIDTH * 2) + 3;
export const GRID_HEIGHT_WITH_BORDERS = (CELL_SIZE * GRID_HEIGHT) + (CELL_BORDER_WIDTH * 2) + 3;

const GameGrid = ({ grid, currentGunIcon, gunIconPosition, particles, onRemoveParticle, effects, onRemoveEffect }) => {
  // 🔥 Glow animation value (0–1)
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Loop a gentle in/out pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: false, // color/shadow animations must be JS-driven
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 1200,
          useNativeDriver: false,
        }),
      ])
    ).start();
  }, [glowAnim]);

  // Interpolated border color between 80% and 100% opacity
  const animatedBorderColor = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(0, 255, 255, 0.8)', 'rgba(0, 255, 255, 1)'],
  });

  // Optional extra glow via shadow radius (iOS mainly)
  const animatedShadowRadius =
    Platform.OS === 'ios'
      ? glowAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [4, 10],
        })
      : 0;

  return (
    <View style={styles.container} pointerEvents="box-none">
      <View style={styles.gridContainer} pointerEvents="box-none">
        
        {/* 🔮 Animated neon border */}
        <Animated.View
          style={[
            styles.grid,
            {
              width: GRID_WIDTH_WITH_BORDERS,
              height: GRID_HEIGHT_WITH_BORDERS,
              borderColor: animatedBorderColor,
              // subtle glow-ish shadow
              shadowColor: '#00ffff',
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.8,
              shadowRadius: animatedShadowRadius,
              elevation: 6, // Android "glow-ish" via elevation
            },
          ]}
          pointerEvents="none"
        >
          {grid.map((row, rowIndex) => (
            <View key={rowIndex} style={styles.gridRow} pointerEvents="none">
              {row.map((cell, colIndex) => {
                let gunIconCell = null;
                if (currentGunIcon && gunIconPosition) {
                  const gunIconPositions = getGunIconPositions(
                    currentGunIcon,
                    gunIconPosition.row,
                    gunIconPosition.col
                  );
                  const gunIconPos = gunIconPositions.find(
                    p => p.row === rowIndex && p.col === colIndex
                  );
                  if (gunIconPos) {
                    gunIconCell = {
                      color: gunIconPos.isTop ? currentGunIcon.top : currentGunIcon.bottom,
                      type: 'gunIcon',
                    };
                  }
                }

                return (
                  <GridCell
                    key={`${rowIndex}-${colIndex}`}
                    cell={cell || gunIconCell}
                    size={CELL_SIZE}
                  />
                );
              })}
            </View>
          ))}
        </Animated.View>

         {/*Explosion Effects - positioned relative to grid */}
         {effects && effects.map(effect => (
            <ExplosionEffect
              key={effect.id}
              x={effect.col * CELL_SIZE + CELL_SIZE / 2}
              y={effect.row * CELL_SIZE + CELL_SIZE / 2}
              sizePx={CELL_SIZE * 3}
              source={require('../assets/effects/xplosion_spritesheet.png')}
              fps={24}
              onComplete={() => onRemoveEffect?.(effect.id)}
            />
          ))}


        {/* Particle Effects - positioned relative to grid */}
        {particles && particles.map(particle => (
          <ParticleEffect
            key={particle.id}
            position={{
              x: particle.position.col * CELL_SIZE + CELL_SIZE / 2,
              y: particle.position.row * CELL_SIZE + CELL_SIZE / 2,
            }}
            color={particle.color}
            onComplete={() => onRemoveParticle && onRemoveParticle(particle.id)}
          />
        ))}
      </View>
    </View>
  );
};

// Helper to get gun icon positions (same logic as gameLogic)
const getGunIconPositions = (gunIcon, row, col) => {
  const positions = [];
  if (gunIcon.rotation === 0) {
    positions.push({ row, col, isTop: true });
    positions.push({ row, col: col + 1, isTop: false });
  } else if (gunIcon.rotation === 1) {
    positions.push({ row, col, isTop: true });
    positions.push({ row: row + 1, col, isTop: false });
  } else if (gunIcon.rotation === 2) {
    positions.push({ row, col: col + 1, isTop: true });
    positions.push({ row, col, isTop: false });
  } else if (gunIcon.rotation === 3) {
    positions.push({ row: row + 1, col, isTop: true });
    positions.push({ row, col, isTop: false });
  }
  return positions;
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  gridContainer: {
    position: 'relative',
    width: GRID_WIDTH_WITH_BORDERS,
  },
  grid: {
    borderWidth: 2,
    borderColor: '#00ffff', // base neon color (will be overridden by Animated)
    backgroundColor: '#151519',
    width: GRID_WIDTH_WITH_BORDERS,
    paddingRight: 2,
    paddingBottom: 2,
  },
  gridRow: {
    flexDirection: 'row',
  },
});

export default GameGrid;
