import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { colors, borderRadius, spacing, shadow } from '../theme';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'default' | 'elevated' | 'outlined';
  padding?: keyof typeof spacing;
}

export const Card: React.FC<CardProps> = ({
  children,
  style,
  variant = 'default',
  padding = 'lg',
}) => {
  return (
    <View style={[
      styles.base,
      styles[variant],
      { padding: spacing[padding] },
      style,
    ]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.cardBackground,
    borderRadius: borderRadius.xl,
  },
  default: {
    ...shadow.sm,
  },
  elevated: {
    ...shadow.lg,
  },
  outlined: {
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
});
