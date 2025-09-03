import React from 'react';
import { TouchableOpacity, Text, ViewStyle, TextStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, radius, layout, space } from '../../theme/tokens';

interface ButtonProps {
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
  variant?: 'primary' | 'secondary' | 'outline';
  onPress: () => void;
  style?: ViewStyle;
  textStyle?: TextStyle;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const Button: React.FC<ButtonProps> = ({
  label,
  icon,
  variant = 'primary',
  onPress,
  style,
  textStyle,
  disabled = false,
  size = 'md',
}) => {
  const getVariantStyles = (): ViewStyle => {
    if (disabled) {
      return {
        backgroundColor: colors.gray[300],
        borderColor: colors.gray[300],
      };
    }

    switch (variant) {
      case 'primary':
        return {
          backgroundColor: colors.brand[500],
          borderColor: colors.brand[500],
        };
      case 'secondary':
        return {
          backgroundColor: colors.brand[50],
          borderColor: colors.brand[100],
          borderWidth: 1,
        };
      case 'outline':
        return {
          backgroundColor: 'transparent',
          borderColor: colors.brand[500],
          borderWidth: 1,
        };
      default:
        return {
          backgroundColor: colors.brand[500],
          borderColor: colors.brand[500],
        };
    }
  };

  const getTextColor = (): string => {
    if (disabled) return colors.gray[500];
    
    switch (variant) {
      case 'primary':
        return colors.text.inverse;
      case 'secondary':
        return colors.text.primary;
      case 'outline':
        return colors.brand[500];
      default:
        return colors.text.inverse;
    }
  };

  const getSizeStyles = (): ViewStyle => {
    switch (size) {
      case 'sm':
        return {
          height: layout.buttonHeight - 8,
          paddingHorizontal: space[2],
          borderRadius: radius.sm,
        };
      case 'md':
        return {
          height: layout.buttonHeight,
          paddingHorizontal: space[3],
          borderRadius: radius.md,
        };
      case 'lg':
        return {
          height: layout.buttonHeight + 8,
          paddingHorizontal: space[4],
          borderRadius: radius.md,
        };
      default:
        return {
          height: layout.buttonHeight,
          paddingHorizontal: space[3],
          borderRadius: radius.md,
        };
    }
  };

  const getTextSize = (): TextStyle => {
    switch (size) {
      case 'sm':
        return { fontSize: 14, fontWeight: '600' as const };
      case 'md':
        return { fontSize: 16, fontWeight: '600' as const };
      case 'lg':
        return { fontSize: 18, fontWeight: '700' as const };
      default:
        return { fontSize: 16, fontWeight: '600' as const };
    }
  };

  return (
    <TouchableOpacity
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          ...getVariantStyles(),
          ...getSizeStyles(),
        },
        style,
      ]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
    >
      {icon && (
        <Ionicons
          name={icon}
          size={size === 'lg' ? 20 : size === 'sm' ? 16 : 18}
          color={getTextColor()}
          style={{ marginRight: space[1] }}
        />
      )}
      <Text
        style={[
          getTextSize(),
          {
            color: getTextColor(),
            textAlign: 'center',
          },
          textStyle,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
};
