import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { GRID_WIDTH, GRID_HEIGHT } from '../constants/GameConstants';
import GridCell from './GridCell';
import ParticleEffect from './ParticleEffect';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
export const CELL_SIZE = Math.floor((SCREEN_WIDTH - 40) / GRID_WIDTH); // 20px padding on each side
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
  
  if (treat.rotation === 0) {
    // Horizontal: left and right
    positions.push({ row, col, isTop: true });
    positions.push({ row, col: col + 1, isTop: false });
  } else {
    // Vertical: top and bottom
    positions.push({ row, col, isTop: true });
    positions.push({ row: row + 1, col, isTop: false });
  }
  
  return positions;
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
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

