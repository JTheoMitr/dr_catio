import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, ImageBackground, TouchableOpacity, Image, ScrollView, Dimensions, Animated } from 'react-native';

const BG_1 = require('../assets/backgrounds/menu_bgnd_1.png');
const BG_2 = require('../assets/backgrounds/menu_bgnd_2.png');

const PILOT_1 = require('../assets/dialogue-headshots/Pilot_1.png');
const PILOT_2 = require('../assets/dialogue-headshots/Pilot_2.png');
const PILOT_3 = require('../assets/dialogue-headshots/Pilot_3.png');

const BG_SWAP_MS = 3500;

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');




const HeadshotSprite = ({
    source,
    frames,
    size = 74,
    frameWidth = 32,
    frameHeight = 32,
    fps = 2,
  }) => {
    const frameIndexRef = useRef(0);
    const [frameIndex, setFrameIndex] = useState(0);
  
    useEffect(() => {
      const interval = setInterval(() => {
        frameIndexRef.current = (frameIndexRef.current + 1) % frames;
        setFrameIndex(frameIndexRef.current);
      }, Math.floor(1000 / fps));
  
      return () => clearInterval(interval);
    }, [frames, fps]);
  
    const scale = size / frameWidth;
  
    return (
      <View style={[styles.spriteWindow, { width: size, height: size }]}>
        <Image
          source={source}
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
  
            // ✅ scale the sheet size itself (not via transform)
            width: frameWidth * frames * scale,
            height: frameHeight * scale,
  
            // ✅ translate in *scaled* pixels so it snaps perfectly
            transform: [{ translateX: -frameIndex * frameWidth * scale }],
          }}
          resizeMode="stretch"
        />
      </View>
    );
  };
  
  

export default function PilotSelectionScreen({ onBack, onSelectPilot }) {
  const [bgIndex, setBgIndex] = useState(0);
  const backgrounds = useMemo(() => [BG_1, BG_2], []);

  useEffect(() => {
    const id = setInterval(() => {
      setBgIndex(prev => (prev + 1) % backgrounds.length);
    }, BG_SWAP_MS);
    return () => clearInterval(id);
  }, [backgrounds.length]);

  const pilots = useMemo(
    () => [
      {
        id: 1,
        title: 'Pilot 1',
        name: 'Gerdy',
        age: '65',
        background: 'Drafted at 17 in the Great War of 2039, Gerdy rose to General of the UCMA through grit and strategy. Now retired, he fights as a mercenary, a master of explosives and battlefield tactics.',
        power: 'Increased chance of bomb tiles',
        headshot: PILOT_1,
        frames: 4,
      },
      {
        id: 2,
        title: 'Pilot 2',
        name: 'Hop',
        age: '38',
        background: 'A soldier from the water-world Frahglek, Hop came to Earth seeking salvation for his dying planet. His tech purified Earth’s oceans, earning humanity’s trust.',
        power: '“Second Chance” on grid overflow',
        headshot: PILOT_2,
        frames: 6,
      },
      {
        id: 3,
        title: 'Pilot 3',
        name: 'Reggie',
        age: '24',
        background: 'Once a UCMA prodigy hacker, Reggie turned rebel after infecting their systems with her own virus. Now she outfits the resistance’s mechs with bleeding-edge tech.',
        power: 'Increased chance of energy tiles',
        headshot: PILOT_3,
        frames: 5,
      },
    ],
    []
  );

const fadeAnim = useRef(new Animated.Value(0)).current;

useEffect(() => {
  const fadeAnimation = Animated.loop(
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 3000,
        useNativeDriver: true,
      }),
    ])
  );

  fadeAnimation.start();
  return () => fadeAnimation.stop();
}, [fadeAnim]);

return (
  <View style={styles.container}>
    {/* Background Images with fade animation (matches MenuScreen) */}
    <View style={styles.backgroundContainer}>
      <Image
        source={BG_1}
        style={[styles.backgroundImage, { transform: [{ rotate: '90deg' }] }]}
        resizeMode="cover"
      />
      <Animated.View style={[styles.backgroundOverlay, { opacity: fadeAnim }]}>
        <Image
          source={BG_2}
          style={[styles.backgroundImage, { transform: [{ rotate: '90deg' }] }]}
          resizeMode="cover"
        />
      </Animated.View>
    </View>

    {/* Everything else stays the same */}
    <View style={styles.overlay}>
      <Text style={styles.title}>Select Your Pilot</Text>

      <View style={styles.list}>
        {pilots.map(p => (
          <TouchableOpacity
            key={p.id}
            activeOpacity={0.85}
            style={styles.cardButton}
            onPress={() => onSelectPilot?.(p.id)}
          >
            <View style={styles.leftFrame}>
              <HeadshotSprite source={p.headshot} frames={p.frames} size={76} />
            </View>

            <View style={styles.info}>
              <Text style={styles.pilotTitle}>{p.title}</Text>
              <Text style={styles.line}>
                <Text style={styles.label}>Name: </Text>
                <Text style={styles.value}>{p.name}</Text>
              </Text>
              <Text style={styles.line}>
                <Text style={styles.label}>Age: </Text>
                <Text style={styles.value}>{p.age}</Text>
              </Text>

              <Text style={[styles.label, { marginTop: 6 }]}>Background:</Text>
              <Text style={styles.paragraph}>{p.background}</Text>

              <Text style={[styles.label, { marginTop: 6 }]}>Power:</Text>
              <Text style={styles.power}>{p.power}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.backBtn} onPress={onBack}>
        <Text style={styles.backText}>Back</Text>
      </TouchableOpacity>
    </View>
  </View>
);

}

const styles = StyleSheet.create({
  bg: { flex: 1, width: '100%', height: '100%' },
  overlay: {
    flex: 1,
    paddingHorizontal: 14,
    paddingTop: 18,
    paddingBottom: 18,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  title: {
    textAlign: 'center',
    fontSize: 26,
    fontWeight: '900',
    color: '#E7FEFF',
    marginBottom: 14,
    textShadowColor: 'rgba(0,255,255,0.35)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  list: {
    alignSelf: 'center',
    width: '100%',
    maxWidth: 680,
    gap: 12,
  },

  cardButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderWidth: 2,
    borderColor: '#00ffff',
    backgroundColor: 'rgba(10, 12, 18, 0.78)',
    borderRadius: 12,
    shadowColor: '#00ffff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.65,
    shadowRadius: 10,
    elevation: 8,
  },

  leftFrame: {
    width: 92,
    height: 92,
    borderWidth: 2,
    borderColor: '#00ffff',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    backgroundColor: 'rgba(0,0,0,0.25)',
    shadowColor: '#00ffff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 10,
    elevation: 10,
  },

  spriteWindow: {
    overflow: 'hidden',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },

  info: { flex: 1 },
  pilotTitle: { color: '#E7FEFF', fontWeight: '900', fontSize: 18, marginBottom: 4 },
  line: { color: '#CFEFEF', fontSize: 13, marginBottom: 1 },
  label: { color: '#9FFBFF', fontWeight: '800' },
  value: { color: '#E7FEFF', fontWeight: '700' },
  paragraph: { color: '#CFEFEF', fontSize: 10, lineHeight: 14, marginTop: 2, maxHeight: 56 },
  power: { color: '#E7FEFF', fontSize: 12, fontWeight: '800', marginTop: 2 },

  backBtn: {
    alignSelf: 'center',
    marginTop: 14,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(0,255,255,0.8)',
    borderRadius: 10,
    backgroundColor: 'rgba(10,12,18,0.55)',
  },
  backText: { color: '#E7FEFF', fontWeight: '800' },
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  backgroundContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    overflow: 'hidden',
  },
  backgroundImage: {
    position: 'absolute',
    width: SCREEN_HEIGHT,
    height: SCREEN_WIDTH,
    top: (SCREEN_HEIGHT - SCREEN_WIDTH) / 2,
    left: (SCREEN_WIDTH - SCREEN_HEIGHT) / 2,
  },
  backgroundOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  
});
