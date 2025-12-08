import React, { useState } from 'react';
import { StyleSheet, View, Text, SafeAreaView, Dimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import MenuScreen from './components/MenuScreen';
import GameGrid, { GRID_HEIGHT_WITH_BORDERS } from './components/GameGrid';
import TouchControls from './components/TouchControls';
import AnimatedSprite from './components/AnimatedSprite';
import RotatingOverlaySprite from './components/RotatingOverlaySprite';
import useGameState from './hooks/useGameState';
import { GAME_STATES } from './constants/GameConstants';
import { Audio } from 'expo-av'; 

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const SWIPE_AREA_HEIGHT = 45; // Space at bottom for swiping (90% of 50px to show full bottom row)
const MARGIN_PERCENT = 0.025; // 2.5% margin
const MIN_MARGIN = 15; // Minimum 15px margin
const MARGIN = Math.max(SCREEN_WIDTH * MARGIN_PERCENT, MIN_MARGIN);

// Game Screen Component - wraps the game logic so hook is only called when needed
const GameScreen = () => {
  const {
    grid,
    currentGunIcon,
    gunIconPosition,
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
    clearAnimationTrigger,
    energyUIResetCounter,
  } = useGameState();

  const [animationType, setAnimationType] = useState('default');
  const matchTimerRef = React.useRef(null);

  // 🔊 Hold a ref to the sound instance so we can stop/unload it on unmount
  const bgmRef = React.useRef(null);

  // 🔊 Load + play music when GameScreen mounts
  React.useEffect(() => {
    let isMounted = true;

    const setupAudio = async () => {
      try {
        // Optional: make sure audio plays even in silent mode on iOS
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
        });

        const { sound } = await Audio.Sound.createAsync(
          require('./assets/music/SMMOG_Lvl1.mp3')  // ⬅️ path relative to App.js
        );

        if (!isMounted) {
          await sound.unloadAsync();
          return;
        }

        bgmRef.current = sound;

        // Loop background track
        await sound.setIsLoopingAsync(true);
        await sound.playAsync();
      } catch (e) {
        console.warn('Error loading/playing SMMOG.mp3', e);
      }
    };

    setupAudio();

     // Cleanup when GameScreen unmounts
    return () => {
      isMounted = false;
      if (bgmRef.current) {
        bgmRef.current.unloadAsync();
        bgmRef.current = null;
      }
    };
  }, []);

  // Handle animation triggers from game state
  React.useEffect(() => {
    if (animationTrigger) {
      if (animationTrigger === 'match') {
        setAnimationType('match');
        // Start 3 second timer to return to default
        if (matchTimerRef.current) {
          clearTimeout(matchTimerRef.current);
        }
        matchTimerRef.current = setTimeout(() => {
          setAnimationType('default');
          matchTimerRef.current = null;
        }, 3000);
      } else if (animationTrigger === 'win') {
        setAnimationType('win');
        // Clear any existing match timer
        if (matchTimerRef.current) {
          clearTimeout(matchTimerRef.current);
          matchTimerRef.current = null;
        }
      } else if (animationTrigger === 'lose') {
        setAnimationType('lose');
        // Clear any existing match timer
        if (matchTimerRef.current) {
          clearTimeout(matchTimerRef.current);
          matchTimerRef.current = null;
        }
      }
      // Clear the trigger after processing to prevent retriggering
      clearAnimationTrigger();
    }
  }, [animationTrigger, clearAnimationTrigger]);

  // Cleanup timer on unmount
  React.useEffect(() => {
    return () => {
      if (matchTimerRef.current) {
        clearTimeout(matchTimerRef.current);
      }
    };
  }, []);

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
            {/* Animations on the left - stacked vertically */}
            <View style={styles.animationContainer}>
              <AnimatedSprite 
                animationType="mechMeter"
                scale={0.55}
                fps={1}
                resetKey={energyUIResetCounter}
              >
                <RotatingOverlaySprite
                  source={require('./assets/crosshair.png')}
                  sizePercent={0.5}
                  duration={3000}   // faster / slower spin
                />
              </AnimatedSprite>
              <AnimatedSprite 
                animationType={animationType}
              />
              <AnimatedSprite 
                animationType="background"
                scale={0.55}
              />
            </View>
            
            {/* Grid on the right */}
            <View style={styles.gridContainer}>
              <GameGrid
                grid={grid}
                currentGunIcon={currentGunIcon}
                gunIconPosition={gunIconPosition}
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
};

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('menu'); // 'menu', 'game', 'options', etc.

  const handleStartGame = () => {
    setCurrentScreen('game');
  };

  // Show menu screen
  if (currentScreen === 'menu') {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="auto" />
        <MenuScreen onStartGame={handleStartGame} />
      </SafeAreaView>
    );
  }

  // Show game screen (GameScreen component will only mount when currentScreen === 'game')
  if (currentScreen === 'game') {
    return <GameScreen />;
  }

  // Fallback (shouldn't reach here, but just in case)
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="auto" />
      <MenuScreen onStartGame={handleStartGame} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2a2a2a',
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
    width: 125, // Fixed width to accommodate 200px sprites
    height: GRID_HEIGHT_WITH_BORDERS, // Match GameGrid height
    flexDirection: 'column', // Stack sprites vertically
    justifyContent: 'center', // Center vertically to align with grid
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#00ffff',
    backgroundColor: '#151519',
    overflow: 'hidden', // Clip animations that exceed container bounds
    marginRight: 2, // Reduced margin to bring animation and grid closer
    marginLeft: 0, // Move animation 10 pixels to the left
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
