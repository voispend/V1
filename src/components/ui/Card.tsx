import React from 'react';
import { View, ViewStyle } from 'react-native';
import { colors, radius, shadows, layout, space } from '../../theme/tokens';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'default' | 'elevated' | 'outlined';
  padding?: 'sm' | 'md' | 'lg';
}

export const Card: React.FC<CardProps> = ({ 
  children, 
  style, 
  variant = 'default',
  padding = 'md'
}) => {
  const getVariantStyles = (): ViewStyle => {
    switch (variant) {
      case 'elevated':
        return {
          ...shadows.default,
          backgroundColor: colors.surface.primary,
        };
      case 'outlined':
        return {
          borderWidth: 1,
          borderColor: colors.gray[200],
          backgroundColor: colors.surface.primary,
        };
      default:
        return {
          backgroundColor: colors.surface.primary,
        };
    }
  };

  const getPaddingStyles = (): ViewStyle => {
    switch (padding) {
      case 'sm':
        return { padding: layout.cardPadding };
      case 'md':
        return { padding: layout.cardPadding };
      case 'lg':
        return { padding: layout.cardPadding };
      default:
        return { padding: layout.cardPadding };
    }
  };

  return (
    <View
      style={[
        {
          borderRadius: radius.lg,
          ...getVariantStyles(),
          ...getPaddingStyles(),
        },
        style,
      ]}
    >
      {children}
    </View>
  );
};
