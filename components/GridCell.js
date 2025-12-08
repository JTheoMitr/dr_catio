import React from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { COLORS } from '../constants/GameConstants';

// Import your pixel art assets
// Update these paths to match your actual asset filenames
const gunIconAssets = {
  [COLORS.RED]: require('../assets/gun-icon-red.png'),
  [COLORS.YELLOW]: require('../assets/gun-icon-yellow.png'),
  [COLORS.GREEN]: require('../assets/gun-icon-green.png'),
  [COLORS.BLUE]: require('../assets/gun-icon-purple.png'),
  [COLORS.GEAR]: require('../assets/energy-refill-battery.png'),
};

const enemyAssets = {
  [COLORS.RED]: require('../assets/mech-enemy-red.png'),
  [COLORS.YELLOW]: require('../assets/mech-enemy-yellow.png'),
  [COLORS.GREEN]: require('../assets/mech-enemy-green.png'),
  [COLORS.BLUE]: require('../assets/mech-enemy-purple.png'),
};

const GridCell = ({ cell, size }) => {
  const cellStyle = { width: size, height: size };
  
  if (!cell) {
    return <View style={[styles.cell, cellStyle]} pointerEvents="none" />;
  }

  if (cell.type === 'enemy') {
    // Enemy mech: use pixel art image
    const enemyImage = enemyAssets[cell.color];
    return (
      <View style={[styles.cell, cellStyle, { justifyContent: 'center', alignItems: 'center' }]} pointerEvents="none">
        {enemyImage ? (
          <Image 
            source={enemyImage} 
            style={{ width: size * 0.85, height: size * 0.85 }} 
            resizeMode="contain"
          />
        ) : (
          // Fallback to colored circle if image not found
          <View style={[styles.enemy, { width: size * 0.7, height: size * 0.7, borderRadius: size * 0.35, backgroundColor: '#999' }]} />
        )}
      </View>
    );
  } else {
    // Gun icon: use pixel art image at native size (32x32) to avoid blur
    const gunIconImage = gunIconAssets[cell.color];
    const iconSize = 32; // Native size of the icons
    return (
      <View style={[styles.cell, cellStyle, { justifyContent: 'center', alignItems: 'center' }]} pointerEvents="none">
        {gunIconImage ? (
          <Image 
            source={gunIconImage} 
            style={{ width: iconSize * 0.85, height: iconSize * 0.85 }} 
            resizeMode="contain"
          />
        ) : (
          // Fallback to colored block if image not found
          <View style={[styles.gunIcon, { width: iconSize, height: iconSize, backgroundColor: '#999' }]} />
        )}
      </View>
    );
  }
};

const styles = StyleSheet.create({
  cell: {
    borderWidth: 0.5,
    borderColor: '#003838', // dark neon grid lines for better visibility
  },
  gunIcon: {
    // Gun icon block
  },
  enemy: {
    // Enemy mech circle
  },
});

export default GridCell;

