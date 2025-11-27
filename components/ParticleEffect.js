import React, { useEffect, useRef } from 'react';
import { Animated, View, StyleSheet } from 'react-native';

const ParticleEffect = ({ position, color, onComplete }) => {
  const particles = useRef(
    Array.from({ length: 8 }, () => ({
      translateX: new Animated.Value(0),
      translateY: new Animated.Value(0),
      opacity: new Animated.Value(1),
      scale: new Animated.Value(1),
    }))
  ).current;

  useEffect(() => {
    const animations = particles.map((particle, index) => {
      const angle = (index / particles.length) * Math.PI * 2;
      const distance = 30 + Math.random() * 20;
      
      return Animated.parallel([
        Animated.timing(particle.translateX, {
          toValue: Math.cos(angle) * distance,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(particle.translateY, {
          toValue: Math.sin(angle) * distance,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(particle.opacity, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(particle.scale, {
          toValue: 0.3,
          duration: 400,
          useNativeDriver: true,
        }),
      ]);
    });

    Animated.parallel(animations).start(() => {
      if (onComplete) onComplete();
    });
  }, []);

  const colorMap = {
    red: '#FF4444',
    yellow: '#FFD700',
    green: '#44FF44',
    blue: '#4444FF',
  };

  const backgroundColor = colorMap[color] || '#999';

  return (
    <View style={[styles.container, { left: position.x, top: position.y }]} pointerEvents="none">
      {particles.map((particle, index) => (
        <Animated.View
          key={index}
          style={[
            styles.particle,
            {
              backgroundColor,
              transform: [
                { translateX: particle.translateX },
                { translateY: particle.translateY },
                { scale: particle.scale },
              ],
              opacity: particle.opacity,
            },
          ]}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    width: 0,
    height: 0,
  },
  particle: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});

export default ParticleEffect;

