// components/GlowImage.js
import React, { useEffect, useRef } from 'react';
import { Animated, Image } from 'react-native';

const GlowImage = ({ source, style }) => {
  const opacity = useRef(new Animated.Value(0.85)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.65,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    );

    loop.start();

    return () => loop.stop();
  }, [opacity]);

  return (
    <Animated.View style={{ opacity }}>
      <Image source={source} style={style} resizeMode="contain" />
    </Animated.View>
  );
};

export default GlowImage;
