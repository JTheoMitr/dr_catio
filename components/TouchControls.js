import React, { useRef, useMemo } from 'react';
import { PanResponder, View } from 'react-native';

const TouchControls = ({ children, onMoveLeft, onMoveRight, onRotate, onDrop }) => {
  const touchData = useRef({
    startX: 0,
    startY: 0,
    startTime: 0,
  });

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onStartShouldSetPanResponderCapture: () => false,
        onMoveShouldSetPanResponder: (evt, gestureState) => {
          // Only become responder if there's significant movement
          return Math.abs(gestureState.dx) > 5 || Math.abs(gestureState.dy) > 5;
        },
        onMoveShouldSetPanResponderCapture: () => false,
        onPanResponderGrant: (evt) => {
          console.log('Touch started');
          const { pageX, pageY } = evt.nativeEvent;
          touchData.current.startX = pageX;
          touchData.current.startY = pageY;
          touchData.current.startTime = Date.now();
        },
        onPanResponderMove: (evt, gestureState) => {
          // Movement is tracked in gestureState
        },
        onPanResponderRelease: (evt, gestureState) => {
          console.log('Touch released', gestureState);
          const { dx, dy } = gestureState;
          const { startTime } = touchData.current;
          const endTime = Date.now();
          const duration = endTime - startTime;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          // If it's a quick tap (small movement, short duration), rotate
          if (distance < 10 && duration < 200) {
            console.log('Tap detected - rotating');
            if (onRotate) onRotate();
            return;
          }
          
          // Swipe detection
          const absDx = Math.abs(dx);
          const absDy = Math.abs(dy);
          
          if (absDx > absDy) {
            // Horizontal swipe
            if (dx > 30) {
              console.log('Swipe right');
              if (onMoveRight) onMoveRight();
            } else if (dx < -30) {
              console.log('Swipe left');
              if (onMoveLeft) onMoveLeft();
            }
          } else {
            // Vertical swipe
            if (dy > 30) {
              console.log('Swipe down');
              if (onDrop) onDrop();
            }
          }
        },
        onPanResponderTerminate: () => {
          console.log('Touch terminated');
        },
      }),
    [onMoveLeft, onMoveRight, onRotate, onDrop]
  );

  return (
    <View style={{ flex: 1 }} {...panResponder.panHandlers}>
      {children}
    </View>
  );
};

export default TouchControls;

