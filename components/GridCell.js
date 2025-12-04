import React from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { COLORS } from '../constants/GameConstants';

// Import your pixel art assets
// Update these paths to match your actual asset filenames
const fishTreatAssets = {
  [COLORS.RED]: require('../assets/gas-icon-red.png'),
  [COLORS.YELLOW]: require('../assets/ammo-icon-yellow.png'),
  [COLORS.GREEN]: require('../assets/energy-icon-green.png'),
  [COLORS.BLUE]: require('../assets/armor-icon-blue.png'),
};

const catHeadAssets = {
  [COLORS.RED]: require('../assets/mech-enemy-red.png'),
  [COLORS.YELLOW]: require('../assets/mech-enemy-yellow.png'),
  [COLORS.GREEN]: require('../assets/mech-enemy-green.png'),
  [COLORS.BLUE]: require('../assets/mech-enemy-blue.png'),
};

const GridCell = ({ cell, size }) => {
  const cellStyle = { width: size, height: size };
  
  if (!cell) {
    return <View style={[styles.cell, cellStyle]} pointerEvents="none" />;
  }

  if (cell.type === 'cat') {
    // Cat head: use pixel art image
    const catImage = catHeadAssets[cell.color];
    return (
      <View style={[styles.cell, cellStyle, { justifyContent: 'center', alignItems: 'center' }]} pointerEvents="none">
        {catImage ? (
          <Image 
            source={catImage} 
            style={{ width: size * 0.7, height: size * 0.7 }} 
            resizeMode="contain"
          />
        ) : (
          // Fallback to colored circle if image not found
          <View style={[styles.catHead, { width: size * 0.7, height: size * 0.7, borderRadius: size * 0.35, backgroundColor: '#999' }]} />
        )}
      </View>
    );
  } else {
    // Treat icon: use pixel art image at native size (32x32) to avoid blur
    const treatImage = fishTreatAssets[cell.color];
    const iconSize = 32; // Native size of the icons
    return (
      <View style={[styles.cell, cellStyle, { justifyContent: 'center', alignItems: 'center' }]} pointerEvents="none">
        {treatImage ? (
          <Image 
            source={treatImage} 
            style={{ width: iconSize, height: iconSize }} 
            resizeMode="contain"
          />
        ) : (
          // Fallback to colored block if image not found
          <View style={[styles.treat, { width: iconSize, height: iconSize, backgroundColor: '#999' }]} />
        )}
      </View>
    );
  }
};

const styles = StyleSheet.create({
  cell: {
    borderWidth: 0.5,
    borderColor: '#000000', // Black grid lines for better visibility
  },
  treat: {
    // Fish treat block
  },
  catHead: {
    // Cat head circle
  },
});

export default GridCell;

