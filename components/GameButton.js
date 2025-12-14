// components/GameButton.js
import React from 'react';
import { TouchableOpacity, View, StyleSheet } from 'react-native';
import GameText from './GameText';

export default function GameButton({
  title,
  onPress,
  disabled = false,
  variant = 'neon', // 'neon' | 'primary' | 'ghost'
  fullWidth = false,
  small = false,
  style,
  textStyle,
  leftSlot, // optional ReactNode (icon / sprite)
  rightSlot, // optional ReactNode
  activeOpacity = 0.85,
}) {
  const containerStyles = [
    styles.base,
    fullWidth && styles.fullWidth,
    small ? styles.small : styles.normal,
    variant === 'primary' && styles.primary,
    variant === 'ghost' && styles.ghost,
    variant === 'neon' && styles.neon,
    disabled && styles.disabled,
    style,
  ];

  const labelStyles = [
    styles.label,
    small ? styles.labelSmall : styles.labelNormal,
    variant === 'primary' && styles.labelPrimary,
    variant === 'ghost' && styles.labelGhost,
    disabled && styles.labelDisabled,
    textStyle,
  ];

  return (
    <TouchableOpacity
      activeOpacity={activeOpacity}
      onPress={onPress}
      disabled={disabled}
      style={containerStyles}
    >
      {leftSlot ? <View style={styles.slotLeft}>{leftSlot}</View> : null}

      <GameText numberOfLines={1} style={labelStyles}>
        {title}
      </GameText>

      {rightSlot ? <View style={styles.slotRight}>{rightSlot}</View> : null}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',

    borderRadius: 10,
    paddingHorizontal: 18,

    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
    elevation: 8,
  },

  normal: { paddingVertical: 14, minWidth: 200 },
  small: { paddingVertical: 10, minWidth: 160 },

  fullWidth: { alignSelf: 'stretch' },

  // Variants
  neon: {
    borderWidth: 2,
    borderColor: '#00ffff',
    backgroundColor: 'rgba(10, 12, 18, 0.78)',
    shadowColor: '#00ffff',
  },
  primary: {
    backgroundColor: '#4A90E2',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    borderWidth: 0,
  },
  ghost: {
    backgroundColor: 'rgba(10,12,18,0.35)',
    borderWidth: 1,
    borderColor: 'rgba(0,255,255,0.6)',
    shadowColor: 'rgba(0,255,255,0.4)',
  },

  disabled: {
    opacity: 0.5,
  },

  // Text
  label: {
    letterSpacing: 1,
  },
  labelNormal: {
    fontSize: 18,
  },
  labelSmall: {
    fontSize: 16,
  },
  labelPrimary: {
    color: '#fff',
  },
  labelGhost: {
    color: '#E7FEFF',
  },
  labelDisabled: {
    color: '#ccc',
  },

  // Slots
  slotLeft: { marginRight: 10 },
  slotRight: { marginLeft: 10 },
});
