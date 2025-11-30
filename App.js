import React, { useState } from 'react';
import { StyleSheet, View, Text, SafeAreaView, Dimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import GameGrid from './components/GameGrid';
import TouchControls from './components/TouchControls';
import AnimatedSprite from './components/AnimatedSprite';
import useGameState from './hooks/useGameState';
import { GAME_STATES } from './constants/GameConstants';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const SWIPE_AREA_HEIGHT = 45; // Space at bottom for swiping (90% of 50px to show full bottom row)
const MARGIN_PERCENT = 0.025; // 2.5% margin
const MIN_MARGIN = 15; // Minimum 15px margin
const MARGIN = Math.max(SCREEN_WIDTH * MARGIN_PERCENT, MIN_MARGIN);

export default function App() {
  const {
    grid,
    currentTreat,
    treatPosition,
    score,
    level,
    gameState,
    particles,
    moveLeft,
    moveRight,
    rotate,
    drop,
    nextLevel,
    restartLevel,
    removeParticle,
    animationTrigger,
  } = useGameState();

  const [animationType, setAnimationType] = useState('default');

  // Handle animation triggers from game state
  React.useEffect(() => {
    if (animationTrigger) {
      if (animationTrigger === 'match') {
        setAnimationType('match');
      } else if (animationTrigger === 'win') {
        setAnimationType('win');
      } else if (animationTrigger === 'lose') {
        setAnimationType('lose');
      }
    }
  }, [animationTrigger]);

  const handleAnimationComplete = () => {
    // Return to default animation when one-time animations finish
    setAnimationType('default');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="auto" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerText}>Level: {level}</Text>
        <Text style={styles.headerText}>Score: {score}</Text>
      </View>

      {/* Game Area with Animation and Grid */}
      <TouchControls
        onMoveLeft={moveLeft}
        onMoveRight={moveRight}
        onRotate={rotate}
        onDrop={drop}
      >
        <View style={styles.gameArea}>
          <View style={styles.gameContent}>
            {/* Animation on the left */}
            <View style={styles.animationContainer}>
              <AnimatedSprite 
                animationType={animationType}
                onAnimationComplete={handleAnimationComplete}
              />
            </View>
            
            {/* Grid on the right */}
            <View style={styles.gridContainer}>
              <GameGrid
                grid={grid}
                currentTreat={currentTreat}
                treatPosition={treatPosition}
                particles={particles}
                onRemoveParticle={removeParticle}
              />
            </View>
          </View>
        </View>
      </TouchControls>

      {/* Swipe Area (bottom padding) */}
      <View style={[styles.swipeArea, { height: SWIPE_AREA_HEIGHT }]}>
        <Text style={styles.swipeAreaText}>Swipe to move • Tap to rotate • Swipe down to drop</Text>
      </View>

      {/* Game Over / Level Complete Overlay */}
      {gameState === GAME_STATES.GAME_OVER && (
        <View style={styles.overlay}>
          <View style={styles.overlayContent}>
            <Text style={styles.overlayTitle}>Game Over!</Text>
            <Text style={styles.overlayText}>Final Score: {score}</Text>
            <Text style={styles.overlayText}>Level Reached: {level}</Text>
            <Text style={styles.overlayButton} onPress={restartLevel}>
              Try Again
            </Text>
          </View>
        </View>
      )}

      {gameState === GAME_STATES.LEVEL_COMPLETE && (
        <View style={styles.overlay}>
          <View style={styles.overlayContent}>
            <Text style={styles.overlayTitle}>Level Complete!</Text>
            <Text style={styles.overlayText}>Score: {score}</Text>
            <Text style={styles.overlayButton} onPress={nextLevel}>
              Next Level
            </Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#f0f0f0',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  headerText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  gameArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  gameContent: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: MARGIN,
  },
  animationContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: MARGIN,
  },
  gridContainer: {
    flex: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  swipeArea: {
    backgroundColor: '#f9f9f9',
    justifyContent: 'center',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  swipeAreaText: {
    fontSize: 10,
    color: '#666',
    textAlign: 'center',
    paddingHorizontal: 10,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayContent: {
    backgroundColor: '#fff',
    padding: 30,
    borderRadius: 10,
    alignItems: 'center',
  },
  overlayTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  overlayText: {
    fontSize: 18,
    marginBottom: 10,
  },
  overlayButton: {
    fontSize: 18,
    color: '#007AFF',
    fontWeight: 'bold',
    marginTop: 10,
  },
});
