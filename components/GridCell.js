import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Image, Animated } from 'react-native';
import { COLORS } from '../constants/GameConstants';



// Gun icon assets (falling pieces)
const gunIconAssets = {
  [COLORS.RED]: require('../assets/gun-icon-red.png'),
  [COLORS.YELLOW]: require('../assets/gun-icon-yellow.png'),
  [COLORS.GREEN]: require('../assets/gun-icon-green.png'),
  [COLORS.BLUE]: require('../assets/gun-icon-purple.png'),
  [COLORS.GEAR]: require('../assets/energy-refill-battery.png'),
  [COLORS.BOMB]: require('../assets/bomb-icon-orange.png'), // ⬅️ bomb color piece
};

// Enemy assets
const enemyAssets = {
  [COLORS.RED]: require('../assets/mech-enemy-red.png'),
  [COLORS.YELLOW]: require('../assets/mech-enemy-yellow.png'),
  [COLORS.GREEN]: require('../assets/mech-enemy-green.png'),
  [COLORS.BLUE]: require('../assets/mech-enemy-purple.png'),
};

// Bomb visuals for created bombs
const BOMB_ORANGE = require('../assets/bomb-icon-orange.png');
const BOMB_WHITE = require('../assets/bomb-icon-white.png');

/**
 * A flashing bomb that cross-fades between orange and white
 * while the bomb is "arming" (during your 2.5s delay).
 */
const FlashingBomb = ({ size }) => {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, {
          toValue: 1,
          duration: 250, // speed of flashing
          useNativeDriver: true,
        }),
        Animated.timing(anim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ])
    );

    loop.start();

    return () => {
      loop.stop();
    };
  }, [anim]);

  const orangeOpacity = anim; // 0 → 1
  const whiteOpacity = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0], // opposite of orange
  });

  const iconSize = size * 0.9;

  return (
    <View
      style={{
        width: size,
        height: size,
        justifyContent: 'center',
        alignItems: 'center',
      }}
      pointerEvents="none"
    >
      {/* Orange layer */}
      <Animated.Image
        source={BOMB_ORANGE}
        style={{
          position: 'absolute',
          width: iconSize,
          height: iconSize,
          opacity: orangeOpacity,
        }}
        resizeMode="contain"
      />
      {/* White layer */}
      <Animated.Image
        source={BOMB_WHITE}
        style={{
          position: 'absolute',
          width: iconSize,
          height: iconSize,
          opacity: whiteOpacity,
        }}
        resizeMode="contain"
      />
    </View>
  );
};

const GridCell = ({ cell, size, glowOpacity }) => {
  const cellStyle = { width: size, height: size };

  if (!cell) {
    return <View style={[styles.cell, cellStyle]} pointerEvents="none" />;
  }

  // 1) Created bomb: special flashing render
  if (cell.type === 'bomb') {
    return (
      <View
        style={[
          styles.cell,
          cellStyle,
          { justifyContent: 'center', alignItems: 'center' },
        ]}
        pointerEvents="none"
      >
        <FlashingBomb size={size} />
      </View>
    );
  }

  // 2) Enemy mech
  if (cell.type === 'enemy') {
    const enemyImage = enemyAssets[cell.color];
    return (
      <View
        style={[
          styles.cell,
          cellStyle,
          { justifyContent: 'center', alignItems: 'center' },
        ]}
        pointerEvents="none"
      >
        {enemyImage ? (
          <Image
            source={enemyImage}
            style={{ width: size * 0.85, height: size * 0.85 }}
            resizeMode="contain"
          />
        ) : (
          <View
            style={[
              styles.enemy,
              {
                width: size * 0.7,
                height: size * 0.7,
                borderRadius: size * 0.35,
                backgroundColor: '#999',
              },
            ]}
          />
        )}
      </View>
    );
  }

  // 3) Default gun icon (including bomb-color falling tiles)
  const gunIconImage = gunIconAssets[cell.color];
  const iconSize = 32; // native icon size

  return (
    <View
      style={[
        styles.cell,
        cellStyle,
        { justifyContent: 'center', alignItems: 'center' },
      ]}
      pointerEvents="none"
    >
      {gunIconImage ? (
        <Animated.Image
        source={gunIconImage}
        style={{
          width: iconSize * 0.85,
          height: iconSize * 0.85,
          opacity: glowOpacity ?? 1,
        }}
        resizeMode="contain"
      />
      ) : (
        <View
          style={[
            styles.gunIcon,
            { width: iconSize, height: iconSize, backgroundColor: '#999' },
          ]}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  cell: {
    borderWidth: 0.5,
    borderColor: '#003838', // dark neon grid lines
  },
  gunIcon: {
    // fallback block
  },
  enemy: {
    // fallback enemy
  },
});

export default GridCell;
