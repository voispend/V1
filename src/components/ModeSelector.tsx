import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ModeSelectorProps {
  isReceiptMode: boolean;
  onModeChange: (mode: 'voice' | 'receipt') => void;
}

/**
 * Mode selector component for switching between voice and receipt modes
 * @param isReceiptMode - Whether receipt mode is currently active
 * @param onModeChange - Callback when mode changes
 */
export const ModeSelector: React.FC<ModeSelectorProps> = ({
  isReceiptMode,
  onModeChange,
}) => {
  return (
    <View style={styles.modeSelector}>
      <TouchableOpacity
        style={[
          styles.modeButton,
          !isReceiptMode && styles.activeModeButton
        ]}
        onPress={() => onModeChange('voice')}
      >
        <Ionicons 
          name="mic" 
          size={20} 
          color={!isReceiptMode ? '#10B981' : '#6B7280'} 
        />
        <Text style={[
          styles.modeButtonText,
          !isReceiptMode && styles.activeModeButtonText
        ]}>
          Voice
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[
          styles.modeButton,
          isReceiptMode && styles.activeModeButton
        ]}
        onPress={() => onModeChange('receipt')}
      >
        <Ionicons 
          name="receipt" 
          size={20} 
          color={isReceiptMode ? '#10B981' : '#6B7280'} 
        />
        <Text style={[
          styles.modeButtonText,
          isReceiptMode && styles.activeModeButtonText
        ]}>
          Receipt
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  modeSelector: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
    padding: 4,
    marginBottom: 24,
  },
  modeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  activeModeButton: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  modeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginLeft: 8,
  },
  activeModeButtonText: {
    color: '#10B981',
  },
});
