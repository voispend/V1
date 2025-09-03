import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, space, shadows, layout } from '../theme/tokens';

interface AppHeaderProps {
  title: string;
  subtitle?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onLeftPress?: () => void;
  onRightPress?: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  title,
  subtitle,
  leftIcon,
  rightIcon,
  onLeftPress,
  onRightPress,
}) => {
  return (
    <View style={styles.container}>
      {/* Status bar background - extends header color */}
      <View style={styles.statusBarBackground} />
      
      {/* Main header content */}
      <View style={styles.content}>
        {/* Left icon */}
        {leftIcon && (
          <TouchableOpacity
            style={styles.iconButton}
            onPress={onLeftPress}
            activeOpacity={0.7}
            accessibilityRole="button"
          >
            {leftIcon}
          </TouchableOpacity>
        )}

        {/* Center title section */}
        <View style={styles.titleSection}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          {subtitle && (
            <Text style={styles.subtitle} numberOfLines={1}>
              {subtitle}
            </Text>
          )}
        </View>

        {/* Right icon */}
        {rightIcon && (
          <TouchableOpacity
            style={styles.iconButton}
            onPress={onRightPress}
            activeOpacity={0.7}
            accessibilityRole="button"
          >
            {rightIcon}
          </TouchableOpacity>
        )}


      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#A8D5BA', // Pastel green background
    height: 112, // Increased to 112px as requested
    ...shadows.default, // Subtle shadow
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)', // Subtle bottom border
  },
  statusBarBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: Platform.OS === 'ios' ? 44 : 24, // Status bar height
    backgroundColor: '#A8D5BA', // Same as header background
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: layout.screenPadding,
    paddingTop: Platform.OS === 'ios' ? 32 : 12, // Further increased top padding
  },
  titleSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 28, // Bigger font size for main app name
    fontWeight: '800', // Extra bold for emphasis
    color: '#2D3748', // Dark text for good contrast on pastel green
    textAlign: 'center',
    marginBottom: 0,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4A5568', // Subtle subtitle color
    textAlign: 'center',
    opacity: 0.8,
  },
  iconButton: {
    width: 44, // Consistent touch target size
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.3)', // Semi-transparent white
  },
});

// Export default for easier imports
export default AppHeader;
