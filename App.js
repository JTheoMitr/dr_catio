import React, { useState } from 'react';
import { StyleSheet, View, Text, SafeAreaView, Dimensions, StyleSheet as RNStyleSheet, ImageBackground } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import MenuScreen from './components/MenuScreen';
import GameGrid, { GRID_HEIGHT_WITH_BORDERS } from './components/GameGrid';
import TouchControls from './components/TouchControls';
import AnimatedSprite from './components/AnimatedSprite';
import ParallaxStrip from './components/ParallaxStrip';
import LevelBlockMeter from './components/LevelBlockMeter';
import RotatingOverlaySprite from './components/RotatingOverlaySprite';
import useGameState from './hooks/useGameState';
import { GAME_STATES } from './constants/GameConstants';
import { Audio } from 'expo-av';

// NEW:
import CampaignSelectScreen from './components/CampaignSelectScreen';
import StageSelectScreen from './components/StageSelectScreen';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const SWIPE_AREA_HEIGHT = 45;
const MARGIN_PERCENT = 0.025;
const MIN_MARGIN = 15;
const MARGIN = Math.max(SCREEN_WIDTH * MARGIN_PERCENT, MIN_MARGIN);

// --- GameScreen stays almost exactly as you have it now ---
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
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
        });

        const { sound } = await Audio.Sound.createAsync(
          require('./assets/music/SMMOG_Lvl1.mp3')
        );

        if (!isMounted) {
          await sound.unloadAsync();
          return;
        }

        bgmRef.current = sound;

        await sound.setIsLoopingAsync(true);
        await sound.playAsync();
      } catch (e) {
        console.warn('Error loading/playing SMMOG_Lvl1.mp3', e);
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
        if (matchTimerRef.current) {
          clearTimeout(matchTimerRef.current);
        }
        matchTimerRef.current = setTimeout(() => {
          setAnimationType('default');
          matchTimerRef.current = null;
        }, 3000);
      } else if (animationTrigger === 'win') {
        setAnimationType('win');
        if (matchTimerRef.current) {
          clearTimeout(matchTimerRef.current);
          matchTimerRef.current = null;
        }
      } else if (animationTrigger === 'lose') {
        setAnimationType('lose');
        if (matchTimerRef.current) {
          clearTimeout(matchTimerRef.current);
          matchTimerRef.current = null;
        }
      }
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
    <ImageBackground
      source={require('./assets/backgrounds/stage_1_bgnd.png')}
      style={styles.gameBackground}
      resizeMode="cover"
    >

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
            {/* Left animation column */}
            <View style={styles.animationContainer}>
              <AnimatedSprite // energy meter
                animationType="mechMeter"
                scale={0.55}
                fps={1}
                resetKey={energyUIResetCounter}
              >
                <RotatingOverlaySprite
                  source={require('./assets/crosshair.png')}
                  sizePercent={0.5}
                  duration={3000}
                />
              </AnimatedSprite>

              <AnimatedSprite // mech animation with parallax foreground
                animationType={animationType}
              >
                <View style={RNStyleSheet.absoluteFillObject}>
                  <View style={styles.meterParallaxCenter}>
                    <ParallaxStrip
                      source={require('./assets/foregrounds/city_layer_5.png')}
                      windowWidth={192}
                      windowHeight={108}
                      duration={20000}
                    />
                  </View>
                </View>  
              </AnimatedSprite>

              {/* Level Block Meter */}
              <LevelBlockMeter level={level} size={120} />

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
        <Text style={styles.swipeAreaText}>
          Swipe to move • Tap to rotate • Swipe down to drop
        </Text>
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
    </ImageBackground>
  );
};

// --- Top-level app navigation ---
export default function App() {
  // 'menu' → 'campaignSelect' → 'stageSelect' → 'game'
  const [currentScreen, setCurrentScreen] = useState('menu');
  const [selectedCampaign, setSelectedCampaign] = useState(1);
  const [selectedStage, setSelectedStage] = useState(1);

  // 🔊 Menu / meta-screen music
  const menuBgmRef = React.useRef(null);

    // 🔊 Handle menu / campaign / stage music
    React.useEffect(() => {
      let isMounted = true;
  
      const updateMenuMusic = async () => {
        try {
          // When we're IN GAME, stop menu music
          if (currentScreen === 'game') {
            if (menuBgmRef.current) {
              const status = await menuBgmRef.current.getStatusAsync();
              if (status.isLoaded && status.isPlaying) {
                await menuBgmRef.current.stopAsync();
              }
            }
            return;
          }
  
          // For all non-game screens (menu, campaignSelect, stageSelect):
          if (!menuBgmRef.current) {
            // Load + play menu track
            await Audio.setAudioModeAsync({
              playsInSilentModeIOS: true,
            });
  
            const { sound } = await Audio.Sound.createAsync(
              require('./assets/music/SMMOG_Menu_1.mp3')
            );
  
            if (!isMounted) {
              await sound.unloadAsync();
              return;
            }
  
            menuBgmRef.current = sound;
            await sound.setIsLoopingAsync(true);
            await sound.playAsync();
          } else {
            // If it's already loaded but not playing, resume it
            const status = await menuBgmRef.current.getStatusAsync();
            if (status.isLoaded && !status.isPlaying) {
              await menuBgmRef.current.playAsync();
            }
          }
        } catch (e) {
          console.warn('Error handling menu music', e);
        }
      };
  
      updateMenuMusic();
  
      return () => {
        isMounted = false;
      };
    }, [currentScreen, menuBgmRef]);

      // Optional: cleanup menu music on app unmount
  React.useEffect(() => {
    return () => {
      if (menuBgmRef.current) {
        menuBgmRef.current.unloadAsync();
        menuBgmRef.current = null;
      }
    };
  }, []);

  

  const handleStartFromMenu = () => {
    setCurrentScreen('campaignSelect');
  };

  const handleSelectCampaign = (campaignId) => {
    setSelectedCampaign(campaignId);
    setCurrentScreen('stageSelect');
  };

  const handleSelectStage = (stageId) => {
    setSelectedStage(stageId);
    // For now, any unlocked stage -> start GameScreen at level 1
    setCurrentScreen('game');
  };

  // Menu
  if (currentScreen === 'menu') {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="auto" />
        <MenuScreen onStartGame={handleStartFromMenu} />
      </SafeAreaView>
    );
  }

  // Campaign select
  if (currentScreen === 'campaignSelect') {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="auto" />
        <CampaignSelectScreen
          onBack={() => setCurrentScreen('menu')}
          onSelectCampaign={handleSelectCampaign}
        />
      </SafeAreaView>
    );
  }

  // Stage select
  if (currentScreen === 'stageSelect') {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="auto" />
        <StageSelectScreen
          campaignId={selectedCampaign}
          onBack={() => setCurrentScreen('campaignSelect')}
          onSelectStage={handleSelectStage}
        />
      </SafeAreaView>
    );
  }

  // Game
  if (currentScreen === 'game') {
    return <GameScreen />;
  }

  // Fallback
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="auto" />
      <MenuScreen onStartGame={handleStartFromMenu} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
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
    width: 125,
    height: GRID_HEIGHT_WITH_BORDERS,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#00ffff',
    backgroundColor: '#151519',
    overflow: 'hidden',
    marginRight: 2,
    marginLeft: 0,
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
  meterParallaxCenter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gameBackground: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
});
