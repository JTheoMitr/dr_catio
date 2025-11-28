import React from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { COLORS } from '../constants/GameConstants';

// Import your pixel art assets
// Update these paths to match your actual asset filenames
const fishTreatAssets = {
  [COLORS.RED]: require('../assets/fish-treat-red.png'),
  [COLORS.YELLOW]: require('../assets/fish-treat-yellow.png'),
  [COLORS.GREEN]: require('../assets/fish-treat-green.png'),
  [COLORS.BLUE]: require('../assets/fish-treat-blue.png'),
};

const catHeadAssets = {
  [COLORS.RED]: require('../assets/cat-head-red.png'),
  [COLORS.YELLOW]: require('../assets/cat-head-yellow.png'),
  [COLORS.GREEN]: require('../assets/cat-head-green.png'),
  [COLORS.BLUE]: require('../assets/cat-head-blue.png'),
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
    // Fish treat: use pixel art image
    const treatImage = fishTreatAssets[cell.color];
    return (
      <View style={[styles.cell, cellStyle]} pointerEvents="none">
        {treatImage ? (
          <Image 
            source={treatImage} 
            style={cellStyle} 
            resizeMode="contain"
          />
        ) : (
          // Fallback to colored block if image not found
          <View style={[styles.treat, cellStyle, { backgroundColor: '#999' }]} />
        )}
      </View>
    );
  }
};

const styles = StyleSheet.create({
  cell: {
    borderWidth: 0.5,
    borderColor: '#ddd',
  },
  treat: {
    // Fish treat block
  },
  catHead: {
    // Cat head circle
  },
});

export default GridCell;

