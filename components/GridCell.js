import React from 'react';
import { View, StyleSheet } from 'react-native';
import { COLORS } from '../constants/GameConstants';

const GridCell = ({ cell, size }) => {
  const cellStyle = { width: size, height: size };
  
  if (!cell) {
    return <View style={[styles.cell, cellStyle]} pointerEvents="none" />;
  }

  const colorMap = {
    [COLORS.RED]: '#FF4444',
    [COLORS.YELLOW]: '#FFD700',
    [COLORS.GREEN]: '#44FF44',
    [COLORS.BLUE]: '#4444FF',
  };

  const backgroundColor = colorMap[cell.color] || '#999';

  if (cell.type === 'cat') {
    // Cat head: colored circle
    return (
      <View style={[styles.cell, cellStyle, { justifyContent: 'center', alignItems: 'center' }]} pointerEvents="none">
        <View style={[styles.catHead, { width: size * 0.7, height: size * 0.7, borderRadius: size * 0.35, backgroundColor }]} />
      </View>
    );
  } else {
    // Fish treat: colored block
    return (
      <View style={[styles.cell, styles.treat, cellStyle, { backgroundColor }]} pointerEvents="none" />
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

