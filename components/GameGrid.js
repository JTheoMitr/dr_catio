import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { GRID_WIDTH, GRID_HEIGHT } from '../constants/GameConstants';
import GridCell from './GridCell';
import ParticleEffect from './ParticleEffect';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BASE_CELL_SIZE = Math.floor((SCREEN_WIDTH - 40) / GRID_WIDTH); // 20px padding on each side
export const CELL_SIZE = Math.floor(BASE_CELL_SIZE * 0.7); // Scale down to 70%
const GRID_HEIGHT_PX = CELL_SIZE * GRID_HEIGHT;

const GameGrid = ({ grid, currentTreat, treatPosition, particles, onRemoveParticle }) => {
  return (
    <View style={styles.container} pointerEvents="box-none">
      <View style={styles.gridContainer} pointerEvents="box-none">
        <View style={[styles.grid, { width: CELL_SIZE * GRID_WIDTH, height: GRID_HEIGHT_PX }]} pointerEvents="none">
          {grid.map((row, rowIndex) => (
            <View key={rowIndex} style={styles.gridRow} pointerEvents="none">
              {row.map((cell, colIndex) => {
                // Check if this cell is part of the current falling treat
                let treatCell = null;
                if (currentTreat && treatPosition) {
                  const treatPositions = getTreatPositions(currentTreat, treatPosition.row, treatPosition.col);
                  const treatPos = treatPositions.find(
                    p => p.row === rowIndex && p.col === colIndex
                  );
                  if (treatPos) {
                    treatCell = {
                      color: treatPos.isTop ? currentTreat.top : currentTreat.bottom,
                      type: 'treat',
                    };
                  }
                }
                
                return (
                  <GridCell
                    key={`${rowIndex}-${colIndex}`}
                    cell={cell || treatCell}
                    size={CELL_SIZE}
                  />
                );
              })}
            </View>
          ))}
        </View>
        
        {/* Particle Effects - positioned relative to grid */}
        {particles && particles.map(particle => (
          <ParticleEffect
            key={particle.id}
            position={{ 
              x: particle.position.col * CELL_SIZE + CELL_SIZE / 2, 
              y: particle.position.row * CELL_SIZE + CELL_SIZE / 2 
            }}
            color={particle.color}
            onComplete={() => onRemoveParticle && onRemoveParticle(particle.id)}
          />
        ))}
      </View>
    </View>
  );
};

// Helper to get treat positions (same logic as gameLogic)
const getTreatPositions = (treat, row, col) => {
  const positions = [];
  
  // 0°: horizontal, left-right (top color on left, bottom color on right)
  // 90°: vertical, top-bottom (top color on top, bottom color on bottom)
  // 180°: horizontal, right-left (top color on right, bottom color on left) - flipped
  // 270°: vertical, bottom-top (top color on bottom, bottom color on top) - flipped
  
  if (treat.rotation === 0) {
    // Horizontal: left and right
    positions.push({ row, col, isTop: true });
    positions.push({ row, col: col + 1, isTop: false });
  } else if (treat.rotation === 1) {
    // Vertical: top and bottom
    positions.push({ row, col, isTop: true });
    positions.push({ row: row + 1, col, isTop: false });
  } else if (treat.rotation === 2) {
    // Horizontal: right and left (flipped)
    positions.push({ row, col: col + 1, isTop: true });
    positions.push({ row, col, isTop: false });
  } else if (treat.rotation === 3) {
    // Vertical: bottom and top (flipped)
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
    width: CELL_SIZE * GRID_WIDTH,
  },
  grid: {
    borderWidth: 2,
    borderColor: '#333',
    backgroundColor: '#f0f0f0',
    width: CELL_SIZE * GRID_WIDTH,
  },
  gridRow: {
    flexDirection: 'row',
    width: CELL_SIZE * GRID_WIDTH,
  },
});

export default GameGrid;

