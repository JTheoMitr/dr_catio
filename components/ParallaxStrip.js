// components/ParallaxStrip.js
import React, { useRef, useEffect, useState } from 'react';
import { View, Animated, StyleSheet, Image, Easing } from 'react-native';

const ParallaxStrip = ({
  source,
  windowWidth: initialWidth = 192,
  windowHeight: initialHeight = 108,
  duration = 15000, // ms for one full scroll
}) => {
  const offset = useRef(new Animated.Value(0)).current;
  const [windowSize, setWindowSize] = useState({
    width: initialWidth,
    height: initialHeight,
  });

  const onLayout = (e) => {
    const { width, height } = e.nativeEvent.layout;
    if (width > 0 && height > 0 &&
        (width !== windowSize.width || height !== windowSize.height)) {
      setWindowSize({ width, height });
    }
  };

  useEffect(() => {
    if (!windowSize.width) return;

    offset.setValue(0);

    const anim = Animated.loop(
      Animated.timing(offset, {
        toValue: 1,
        duration,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    anim.start();

    return () => {
      anim.stop();
    };
  }, [offset, windowSize.width, duration]);

  const { width, height } = windowSize;

  // Scroll from 0 → -width; with 3 tiles, the pattern is seamless
  const translateX = offset.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -width],
  });

  return (
    <View
      style={[
        styles.window,
        { width, height },
      ]}
      onLayout={onLayout}
      pointerEvents="none"
    >
      {width > 0 && (
        <Animated.View
          style={{
            flexDirection: 'row',
            width: width * 3,              // three copies of the image
            transform: [{ translateX }],
          }}
        >
          <Image
            source={source}
            style={{ width, height }}
            resizeMode="cover"
          />
          <Image
            source={source}
            style={{ width, height }}
            resizeMode="cover"
          />
          <Image
            source={source}
            style={{ width, height }}
            resizeMode="cover"
          />
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  window: {
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute', // or relative; depends on how you embed it
  },
});

export default ParallaxStrip;
