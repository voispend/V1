import React from 'react';
import { View, TouchableOpacity, Text, ViewStyle, TextStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, radius, layout, space } from '../../theme/tokens';

interface ChipProps {
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
  active?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
  textStyle?: TextStyle;
  disabled?: boolean;
}

export const Chip: React.FC<ChipProps> = ({
  label,
  icon,
  active = false,
  onPress,
  style,
  textStyle,
  disabled = false,
}) => {
  const getVariantStyles = (): ViewStyle => {
    if (disabled) {
      return {
        backgroundColor: colors.gray[200],
        borderColor: colors.gray[300],
      };
    }

    if (active) {
      return {
        backgroundColor: colors.brand[500],
        borderColor: colors.brand[500],
      };
    }

    return {
      backgroundColor: colors.surface.secondary,
      borderColor: colors.gray[200],
      borderWidth: 1,
    };
  };

  const getTextColor = (): string => {
    if (disabled) return colors.gray[500];
    
    if (active) {
      return colors.text.inverse;
    }
    
    return colors.text.secondary;
  };

  const getIconColor = (): string => {
    if (disabled) return colors.gray[500];
    
    if (active) {
      return colors.text.inverse;
    }
    
    return colors.text.tertiary;
  };

  const ChipContent = (
    <>
      {icon && (
        <Ionicons
          name={icon}
          size={16}
          color={getIconColor()}
          style={{ marginRight: space[1] }}
        />
      )}
      <Text
        style={[
          typography.meta,
          {
            color: getTextColor(),
            textAlign: 'center',
          },
          textStyle,
        ]}
      >
        {label}
      </Text>
    </>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        style={[
          {
            height: layout.chipHeight,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: space[2],
            borderRadius: radius.pill,
            ...getVariantStyles(),
          },
          style,
        ]}
        onPress={onPress}
        disabled={disabled}
        activeOpacity={0.7}
      >
        {ChipContent}
      </TouchableOpacity>
    );
  }

  return (
    <View
      style={[
        {
          height: layout.chipHeight,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: space[2],
          borderRadius: radius.pill,
          ...getVariantStyles(),
        },
        style,
      ]}
    >
      {ChipContent}
    </View>
  );
};
