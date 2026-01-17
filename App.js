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
import PilotSelectionScreen from './components/PilotSelectionScreen';
import { useFonts } from 'expo-font';
import EnemySprite from './components/EnemySprite';


import { Audio } from 'expo-av';

// NEW:
import CampaignSelectScreen from './components/CampaignSelectScreen';
import StageSelectScreen from './components/StageSelectScreen';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const SWIPE_AREA_HEIGHT = 45;
const MARGIN_PERCENT = 0.025;
const MIN_MARGIN = 15;
const MARGIN = Math.max(SCREEN_WIDTH * MARGIN_PERCENT, MIN_MARGIN);
const TOP_BANNER_H = 108;
const TOP_BANNER_W = SCREEN_WIDTH - (MARGIN * 2);


// --- GameScreen stays almost exactly as you have it now ---
const GameScreen = () => {
  const [ammoUsed, setAmmoUsed] = useState(0);     // 0 = full, 8 = empty
  const onCleanMatch = React.useCallback(() => {
    setAmmoUsed((used) => Math.max(0, used - 1));
  }, []);
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
    triggerMeterGameOver,
    gameOverReason,
    effects,
    removeEffect,
  } = useGameState({
    onCleanMatch
  });

  const [animationType, setAnimationType] = useState('default');
  const matchTimerRef = React.useRef(null);

  // 🔊 Hold a ref to the sound instance so we can stop/unload it on unmount
  const bgmRef = React.useRef(null);

  const [bannerLayout, setBannerLayout] = useState({ width: 0, height: 0 });
  const [mechLayout, setMechLayout] = useState(null);
  const [enemySeed, setEnemySeed] = useState(0); // bump to respawn enemy

  // ammo config
  const AMMO_FRAMES = 9;      // 0..8
  const MAX_AMMO_USED = AMMO_FRAMES - 1; // 8 = empty
  const FIRE_RATE = 1;        // bullets per second (easy knob)

  // gameplay state

  const [enemyShotSeed, setEnemyShotSeed] = useState(0); // increments = “a bullet hit enemy”
  const enemyInRangeRef = React.useRef(false);

  // track enemy bounds without rerendering every frame
  const enemyRectRef = React.useRef(null);


  // Health meter (0 = full, MAX_HITS = empty)
  const HEALTH_FRAMES = 18;          // <-- set to your sheet's total frames
  const MAX_HITS = HEALTH_FRAMES - 1;

  const [hitsTaken, setHitsTaken] = useState(0);

  const resetAmmo = () => setAmmoUsed(0);

  const onEnemyHitMech = () => {
    setHitsTaken((h) => {
      const next = Math.min(h + 1, MAX_HITS);

      if (next >= MAX_HITS) {
        setAnimationType('lose'); // play lose anim
        // TODO: trigger your actual "lose level" gameState if you have a function for it
      }

      return next;
    });
  };


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

  React.useEffect(() => {
    // don’t fire if banner isn't measured yet
    if (!bannerLayout.width) return;

    const intervalMs = 1000 / FIRE_RATE;
    const id = setInterval(() => {
      const inRange = enemyInRangeRef.current;

      // no target or no ammo
      if (!inRange) return;

      setAmmoUsed((used) => {
        if (used >= MAX_AMMO_USED) return used; // empty clip

        // ✅ spend 1 bullet
        const nextUsed = used + 1;

        // ✅ apply 1 damage to enemy
        setEnemyShotSeed((s) => s + 1);

        return nextUsed;
      });
    }, intervalMs);

    return () => clearInterval(id);
  }, [bannerLayout.width, FIRE_RATE]);


  React.useEffect(() => {
    if (hitsTaken >= MAX_HITS) {
      setAnimationType('lose');
      triggerMeterGameOver?.();
    }
  }, [hitsTaken, MAX_HITS, triggerMeterGameOver]);


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
            <View
              style={[styles.topBanner, { height: TOP_BANNER_H }]}
              onLayout={(e) => setBannerLayout(e.nativeEvent.layout)}
            >
              {/* FULL-WIDTH PARALLAX (background) */}
              <View style={StyleSheet.absoluteFillObject}>
                <View style={styles.topBannerParallaxOffset}>
                  <ParallaxStrip
                    source={require('./assets/foregrounds/city_layer_4.png')}
                    windowWidth={TOP_BANNER_W}
                    windowHeight={TOP_BANNER_H + 74}
                    duration={20000}
                  />
                </View>
              </View>

              {/* ENEMY LAYER (between background + foreground) */}
              {bannerLayout.width > 0 && mechLayout && (
                <EnemySprite
                  key={`walker-${enemySeed}`}
                  source={require('./assets/enemies/walker_1_walking_left.png')}
                  frames={16}
                  fps={10}
                  scale={1.2}
                  speed={35}
                  hp={2}
                  damageSeed={enemyShotSeed}
                  bannerWidth={bannerLayout.width}
                  bannerHeight={bannerLayout.height}
                  mechBounds={mechLayout}
                  y={TOP_BANNER_H - 80}
                  onBounds={(rect) => {
                    enemyRectRef.current = rect;

                    // “in range” once it reaches the halfway point (x axis)
                    const midX = bannerLayout.width / 2;
                    const inRange = rect.x <= midX; // simple + matches your description
                    enemyInRangeRef.current = inRange;
                  }}
                  onHit={() => {
                    console.log('Enemy hit mech! (-1 life later)');
                    onEnemyHitMech();        // your health logic
                  }}
                  onDespawn={() => {
                    enemyInRangeRef.current = false;
                    enemyRectRef.current = null;
                    setTimeout(() => setEnemySeed((s) => s + 1), 700);
                  }}
                />

              )}

              {/* FOREGROUND CONTENT */}
              <View style={styles.topBannerContent}>
                <View
                  style={styles.topBannerMechWindow}
                  onLayout={(e) => setMechLayout(e.nativeEvent.layout)}
                >
                  <AnimatedSprite animationType={animationType} />
                </View>
              </View>

              {/* Foreground parallax layer */}
              <View style={StyleSheet.absoluteFillObject}>
                <View style={styles.topBannerParallaxOffset}>
                  <ParallaxStrip
                    source={require('./assets/foregrounds/city_layer_5.png')}
                    windowWidth={TOP_BANNER_W}
                    windowHeight={TOP_BANNER_H + 74}
                    duration={20000}
                  />
                </View>
              </View>
            </View>


            <View style={styles.gameContent}>
              {/* Left animation column */}
              <View style={styles.animationContainer}>
                <View style={styles.hudLayer}>
                <View style={[styles.hudItem, { top: 5, left: 0, zIndex: 3 }]}>
                    <AnimatedSprite animationType="selectPilot" scale={1.3} />
                  </View>
                  
                  <View style={[styles.hudItem, { top: 157, left: -12, zIndex: 3 }]}>
                    <AnimatedSprite animationType="ammoBar" scale={0.35} frame={ammoUsed} />
                  </View>

                  <View style={[styles.hudItem, { top: -30, left: 0, zIndex: 1 }]}>
                    <AnimatedSprite animationType="healthBar" scale={0.18} frame={hitsTaken} />
                  </View>
                </View>
                <View style={[styles.hudItem, { top: -100, left: 2, zIndex: 2 }]}>
                  <AnimatedSprite // energy meter
                    animationType="mechMeter"
                    scale={0.25}
                    fps={1}
                    resetKey={energyUIResetCounter}  // gear matches already bump this
                    loop={false}                      // <– important: don’t loop
                    onDeplete={triggerMeterGameOver}  // <– call into game logic
                  >
                    <RotatingOverlaySprite
                      source={require('./assets/crosshair.png')}
                      sizePercent={0.5}
                      duration={3000}
                    />
                  </AnimatedSprite>

                  {/* Level Block Meter */}
                  <View style={styles.levelBlockSlot}>
                    <LevelBlockMeter level={level} size={120} />
                  </View>
                </View>
              </View>

              {/* Grid on the right */}
              <View style={styles.gridContainer}>
                <GameGrid
                  grid={grid}
                  currentGunIcon={currentGunIcon}
                  gunIconPosition={gunIconPosition}
                  particles={particles}
                  onRemoveParticle={removeParticle}
                  effects={effects}
                  onRemoveEffect={removeEffect}
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

              {gameOverReason === 'energy' && (
                <Text style={styles.overlayText}>Energy depleted!</Text>
              )}
              <Text style={styles.overlayButton}
                onPress={() => {
                  setAnimationType('default');  // ✅ immediately go back to idle
                  restartLevel();
                  setHitsTaken(0);
                  resetAmmo();

                }}>
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
              <Text style={styles.overlayButton}
                onPress={() => {
                  setAnimationType('default');  // ✅ immediately go back to idle
                  nextLevel();
                  setHitsTaken(0);
                  resetAmmo();

                }}>
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
  const [selectedPilot, setSelectedPilot] = useState(1);


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

  const [fontsLoaded] = useFonts({
    Sddystopian: require('./assets/fonts/Sddystopiandemo-GO7xa.otf'),
  });

  if (!fontsLoaded) return null; // or splash screen


  const handleStartFromMenu = () => {
    setCurrentScreen('pilotSelect');
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

  // Pilot select
  if (currentScreen === 'pilotSelect') {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="auto" />
        <PilotSelectionScreen
          onBack={() => setCurrentScreen('menu')}
          onSelectPilot={(pilotId) => {
            setSelectedPilot(pilotId);
            setCurrentScreen('campaignSelect');
          }}
        />
      </SafeAreaView>
    );
  }


  // Campaign select
  if (currentScreen === 'campaignSelect') {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="auto" />
        <CampaignSelectScreen
          onBack={() => setCurrentScreen('pilotSelect')}
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
    backgroundColor: '#0d0c0f',
    borderBottomWidth: 1,
    borderBottomColor: '#0d0c0f',
  },
  headerText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#00fff2'
  },
  gameArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    paddingTop: 25,
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
    borderWidth: 2,
    borderColor: '#00ffff',
    backgroundColor: '#151519',
    overflow: 'hidden',
    marginRight: 2,
    position: 'relative',      // ✅ important
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
  topBanner: {
    position: 'absolute',
    top: 2,
    alignSelf: 'center',
    width: TOP_BANNER_W,
    borderWidth: 2,
    borderColor: '#00ffff',
    backgroundColor: '#151519',
    overflow: 'hidden',
  },

  topBannerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 12,        // ⬅️ mech sits on the LEFT
  },

  topBannerMechWindow: {
    width: 125,             // same visual language as left column
    height: 96,
    borderWidth: 2,
    borderColor: 'transparent', // was '#00ffff'
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 30,
  },
  topBannerParallaxOffset: {
    position: 'absolute',
    top: -74,   // ⬅️ raise buildings into view (tweak this)
  },



});
