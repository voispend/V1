import React from 'react';
import { View, ViewStyle } from 'react-native';
import { colors, radius, layout } from '../../theme/tokens';

interface ProgressBarProps {
  value: number; // 0 to 1
  maxValue?: number; // Optional max value for percentage calculation
  height?: number;
  backgroundColor?: string;
  fillColor?: string;
  style?: ViewStyle;
  showLabel?: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  maxValue,
  height = 10,
  backgroundColor = colors.gray[200],
  fillColor = colors.brand[500],
  style,
  showLabel = false,
}) => {
  // Calculate percentage (0 to 1)
  const percentage = maxValue ? Math.min(value / maxValue, 1) : Math.min(value, 1);
  
  return (
    <View style={[{ width: '100%' }, style]}>
      <View
        style={{
          height,
          backgroundColor,
          borderRadius: radius.pill,
          overflow: 'hidden',
        }}
      >
        <View
          style={{
            height: '100%',
            width: `${percentage * 100}%`,
            backgroundColor: fillColor,
            borderRadius: radius.pill,
          }}
        />
      </View>
    </View>
  );
};
