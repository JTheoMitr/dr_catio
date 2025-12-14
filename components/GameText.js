import React from 'react';
import { Text } from 'react-native';

export default function GameText({ style, children, ...props }) {
  return (
    <Text
      {...props}
      style={[
        { fontFamily: 'Sddystopian', color: '#E7FEFF' },
        style,
      ]}
    >
      {children}
    </Text>
  );
}
