import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Dimensions, Animated } from 'react-native';
import * as Font from 'expo-font';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const MenuScreen = ({ onStartGame }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [fontsLoaded, setFontsLoaded] = useState(false);

  // Load custom font
  useEffect(() => {
    Font.loadAsync({
      'Sddystopian': require('../assets/fonts/Sddystopiandemo-GO7xa.otf'),
    }).then(() => {
      setFontsLoaded(true);
    });
  }, []);

  // Animate background fade between images
  useEffect(() => {
    const fadeAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 3000, // 3 seconds to fade to second image
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 3000, // 3 seconds to fade back to first image
          useNativeDriver: true,
        }),
      ])
    );
    fadeAnimation.start();

    return () => fadeAnimation.stop();
  }, [fadeAnim]);

  if (!fontsLoaded) {
    return null; // Or a loading screen
  }

  return (
    <View style={styles.container}>
      {/* Background Images with fade animation */}
      <View style={styles.backgroundContainer}>
        <Image
          source={require('../assets/backgrounds/menu_bgnd_1.png')}
          style={[styles.backgroundImage, { transform: [{ rotate: '90deg' }] }]}
          resizeMode="cover"
        />
        <Animated.View
          style={[
            styles.backgroundOverlay,
            {
              opacity: fadeAnim,
            },
          ]}
        >
          <Image
            source={require('../assets/backgrounds/menu_bgnd_2.png')}
            style={[styles.backgroundImage, { transform: [{ rotate: '90deg' }] }]}
            resizeMode="cover"
          />
        </Animated.View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.title}>Mech Management Puzzler Mayhem</Text>
        
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.button} onPress={onStartGame}>
            <Text style={styles.buttonText}>START</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.button, styles.buttonInactive]} disabled>
            <Text style={[styles.buttonText, styles.buttonTextInactive]}>OPTIONS</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
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
    width: SCREEN_HEIGHT, // Landscape width becomes portrait height
    height: SCREEN_WIDTH, // Landscape height becomes portrait width
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
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    zIndex: 1,
  },
  title: {
    fontFamily: 'Sddystopian',
    fontSize: 32,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 60,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
    letterSpacing: 2,
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
    gap: 20,
  },
  button: {
    backgroundColor: '#4A90E2',
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 8,
    minWidth: 200,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  buttonInactive: {
    backgroundColor: '#666',
    opacity: 0.5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  buttonTextInactive: {
    color: '#ccc',
  },
});

export default MenuScreen;

