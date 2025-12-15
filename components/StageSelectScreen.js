// components/StageSelectScreen.js
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ImageBackground,
  Animated,
} from 'react-native';
import { Audio } from 'expo-av';
import MenuBackground from './MenuBackground';
import GameButton from './GameButton';
import GameText from './GameText';

const StageSelectScreen = ({ campaignId, onBack, onSelectStage }) => {
  // SFX for button click
  const clickSfxRef = React.useRef(null);
  const clickDurationRef = React.useRef(800); // default fallback ms

  // Fade animation for screen
  const fadeAnim = React.useRef(new Animated.Value(1)).current;
  const isTransitioningRef = React.useRef(false);

  React.useEffect(() => {
    let isMounted = true;

    const loadSfx = async () => {
      try {
        const { sound } = await Audio.Sound.createAsync(
          require('../assets/sfx/AANN2_Synthwave_Future_Synthwave_Arp_Dmaj.mp3')
        );
        if (!isMounted) {
          await sound.unloadAsync();
          return;
        }
        clickSfxRef.current = sound;

        const status = await sound.getStatusAsync();
        if (status.isLoaded && status.durationMillis != null) {
          clickDurationRef.current = status.durationMillis;
        }
      } catch (e) {
        console.warn('Error loading stage select SFX', e);
      }
    };

    loadSfx();

    return () => {
      isMounted = false;
      if (clickSfxRef.current) {
        clickSfxRef.current.unloadAsync();
        clickSfxRef.current = null;
      }
    };
  }, []);

  const playClickSfx = async () => {
    try {
      if (!clickSfxRef.current) return;
      const status = await clickSfxRef.current.getStatusAsync();
      if (!status.isLoaded) return;

      await clickSfxRef.current.setPositionAsync(0);
      await clickSfxRef.current.playAsync();
    } catch (e) {
      console.warn('Error playing stage select SFX', e);
    }
  };

  const playClickSfxAndFadeAndWait = async () => {
    if (isTransitioningRef.current) return;
    isTransitioningRef.current = true;

    try {
      if (!clickSfxRef.current) return;

      const status = await clickSfxRef.current.getStatusAsync();
      const duration = status.isLoaded && status.durationMillis != null
        ? status.durationMillis
        : clickDurationRef.current;

      // Start fade-out while sound plays
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration,
        useNativeDriver: true,
      }).start();

      await clickSfxRef.current.setPositionAsync(0);
      await clickSfxRef.current.playAsync();

      // Wait for the sound duration before navigating
      await new Promise(resolve => setTimeout(resolve, duration));
    } catch (e) {
      console.warn('Error in playClickSfxAndFadeAndWait', e);
    }
  };

  return (
    <MenuBackground
    >
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        {/* Header */}
        <View style={styles.headerRow}>
          <GameText style={styles.title}>Campaign {campaignId}</GameText>
          <View style={{ width: 110 }} />
        </View>

        {/* Stage grid */}
        <View style={styles.centerContent}>
          <GameText style={styles.subtitle}>Select Stage</GameText>

          <View style={styles.stageGrid}>
            {Array.from({ length: 6 }).map((_, index) => {
              const stageNumber = index + 1;
              const isUnlocked = stageNumber === 1; // only stage 1 active for now

              if (isUnlocked) {
                return (
                  <TouchableOpacity
                    key={stageNumber}
                    style={[styles.stageButton, styles.stageActive]}
                    onPress={async () => {
                      await playClickSfxAndFadeAndWait();
                      onSelectStage(stageNumber);
                    }}
                    activeOpacity={0.8}
                  >
                    <GameText style={styles.stageText}>Stage {stageNumber}</GameText>
                    <GameText style={styles.stageSubText}>
                      Levels {(stageNumber - 1) * 5 + 1}–{stageNumber * 5}
                    </GameText>
                  </TouchableOpacity>
                );
              }

              // Locked stages: just play SFX (no fade, no nav)
              return (
                <TouchableOpacity
                  key={stageNumber}
                  style={[styles.stageButton, styles.stageLocked]}
                  onPress={playClickSfx}
                  activeOpacity={0.7}
                >
                  <GameText style={styles.stageText}>Stage {stageNumber}</GameText>
                  <GameText style={styles.stageSubText}>Locked</GameText>
                </TouchableOpacity>
              );
            })}
          </View>
          <GameButton
            title="Back"
            variant="ghost"
            small
            onPress={onBack}
            style={{ alignSelf: 'center', marginTop: 14 }}
        />
        </View>
      </Animated.View>
    </MenuBackground>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(5, 5, 15, 0.4)',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerRow: {
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  backButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  backButtonText: {
    color: '#fff',
    fontSize: 14,
  },
  title: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    alignSelf: 'center',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
  },
  subtitle: {
    color: '#ddd',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 12,
  },
  stageGrid: {
    alignSelf: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    width: '80%',
  },
  stageButton: {
    width: '30%',
    aspectRatio: 1,
    margin: '3.33%',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  stageActive: {
    backgroundColor: 'rgba(0, 200, 255, 0.2)',
    borderColor: '#00f0ff',
  },
  stageLocked: {
    backgroundColor: 'rgba(50, 50, 60, 0.7)',
    borderColor: '#555',
  },
  stageText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  stageSubText: {
    color: '#ccc',
    fontSize: 10,
    marginTop: 4,
  },
});

export default StageSelectScreen;
