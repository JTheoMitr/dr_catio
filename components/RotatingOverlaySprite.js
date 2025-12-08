import React, { useRef, useEffect } from 'react';
import { View, Animated, StyleSheet, ImageSourcePropType, Easing } from 'react-native';

const RotatingOverlaySprite = ({ source, sizePercent = 0.8, duration = 4000 }) => {
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    loop.start();
    return () => loop.stop();
  }, [rotateAnim, duration]);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={StyleSheet.absoluteFillObject}>
      <View style={styles.center}>
        <Animated.Image
          source={source}
          pointerEvents="none"
          style={{
            width: `${sizePercent * 100}%`,
            height: `${sizePercent * 100}%`,
            transform: [{ rotate: spin }],
          }}
          resizeMode="contain"
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default RotatingOverlaySprite;
