import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  Modal,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { parseReceipt, ReceiptParseResponse } from '../utils/openai';
import { useUserPreferences } from '../contexts/UserPreferencesContext';
import { useLanguage } from '../contexts/LanguageContext';

interface ReceiptScannerProps {
  onReceiptParsed: (data: {
    amount: number;
    description: string;
    category: string;
    date: string;
    currency: string;
    confidence: number;
  }) => void;
  onError: (error: string) => void;
}

export default function ReceiptScanner({ onReceiptParsed, onError }: ReceiptScannerProps) {
  const { preferences } = useUserPreferences();
  const { t } = useLanguage();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [parseResult, setParseResult] = useState<ReceiptParseResponse | null>(null);
  const [showResultModal, setShowResultModal] = useState(false);

  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Please grant permission to access your photo library to scan receipts.',
        [{ text: 'OK' }]
      );
      return false;
    }
    return true;
  };

  const requestCameraPermissions = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Please grant permission to access your camera to take receipt photos.',
        [{ text: 'OK' }]
      );
      return false;
    }
    return true;
  };

  const pickImage = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        if (asset.base64) {
          const imageData = `data:${asset.mimeType || 'image/jpeg'};base64,${asset.base64}`;
          setSelectedImage(imageData);
          await parseReceiptImage(imageData);
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
      onError('Failed to pick image. Please try again.');
    }
  };

  const takePhoto = async () => {
    const hasPermission = await requestCameraPermissions();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        if (asset.base64) {
          const imageData = `data:${asset.mimeType || 'image/jpeg'};base64,${asset.base64}`;
          setSelectedImage(imageData);
          await parseReceiptImage(imageData);
        }
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      onError('Failed to take photo. Please try again.');
    }
  };

  const parseReceiptImage = async (imageData: string) => {
    setIsParsing(true);
    try {
      const result = await parseReceipt({
        image_b64: imageData,
        locale_hint: 'en-US', // You can make this dynamic based on user preferences
        currency_hint: preferences.currency,
      });

      setParseResult(result);
      setShowResultModal(true);
    } catch (error) {
      console.error('Receipt parsing error:', error);
      onError('Failed to parse receipt. Please try again or ensure the image is clear.');
    } finally {
      setIsParsing(false);
    }
  };

  const handleConfirmParse = () => {
    if (parseResult) {
      // Map the parse result to expense data
      const expenseData = {
        amount: parseResult.amount || 0,
        description: parseResult.vendor || 'Receipt scan',
        category: 'Misc', // Default category, user can change
        date: parseResult.date_iso || new Date().toISOString().split('T')[0] || '',
        currency: parseResult.currency || preferences.currency,
        confidence: parseResult.confidence,
      };

      onReceiptParsed(expenseData);
      setShowResultModal(false);
      setSelectedImage(null);
      setParseResult(null);
    }
  };

  const handleRetry = () => {
    setShowResultModal(false);
    setSelectedImage(null);
    setParseResult(null);
  };

  return (
    <View style={styles.container}>
      {/* Image Selection Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={pickImage}>
          <Ionicons name="images" size={24} color="#10B981" />
          <Text style={styles.buttonText}>Choose Photo</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={takePhoto}>
          <Ionicons name="camera" size={24} color="#10B981" />
          <Text style={styles.buttonText}>Take Photo</Text>
        </TouchableOpacity>
      </View>

      {/* Selected Image Preview */}
      {selectedImage && (
        <View style={styles.imageContainer}>
          <Image source={{ uri: selectedImage }} style={styles.image} />
          {isParsing && (
            <View style={styles.parsingOverlay}>
              <ActivityIndicator size="large" color="#10B981" />
              <Text style={styles.parsingText}>Parsing receipt...</Text>
            </View>
          )}
        </View>
      )}

      {/* Parse Result Modal */}
      <Modal
        visible={showResultModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowResultModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Receipt Parsed!</Text>
              <TouchableOpacity onPress={() => setShowResultModal(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {parseResult && (
              <View style={styles.resultContainer}>
                <View style={styles.resultRow}>
                  <Text style={styles.resultLabel}>Vendor:</Text>
                  <Text style={styles.resultValue}>
                    {parseResult.vendor || 'Not detected'}
                  </Text>
                </View>

                <View style={styles.resultRow}>
                  <Text style={styles.resultLabel}>Amount:</Text>
                  <Text style={styles.resultValue}>
                    {parseResult.currency} {parseResult.amount?.toFixed(2)}
                  </Text>
                </View>

                <View style={styles.resultRow}>
                  <Text style={styles.resultLabel}>Date:</Text>
                  <Text style={styles.resultValue}>
                    {parseResult.date_iso || 'Not detected'}
                  </Text>
                </View>

                <View style={styles.resultRow}>
                  <Text style={styles.resultLabel}>Confidence:</Text>
                  <Text style={styles.resultValue}>
                    {(parseResult.confidence * 100).toFixed(0)}%
                  </Text>
                </View>

                <View style={styles.confidenceIndicator}>
                  <View
                    style={[
                      styles.confidenceBar,
                      { width: `${parseResult.confidence * 100}%` },
                    ]}
                  />
                </View>

                {parseResult.confidence < 0.7 && (
                  <View style={styles.lowConfidenceWarning}>
                    <Ionicons name="warning" size={16} color="#F59E0B" />
                    <Text style={styles.warningText}>
                      Low confidence - please review the details
                    </Text>
                  </View>
                )}
              </View>
            )}

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
                <Text style={styles.retryButtonText}>Try Again</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmButton} onPress={handleConfirmParse}>
                <Text style={styles.confirmButtonText}>Use This Data</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  button: {
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    minWidth: 120,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  buttonText: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  imageContainer: {
    position: 'relative',
    alignItems: 'center',
    marginBottom: 20,
  },
  image: {
    width: 300,
    height: 225,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  parsingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  parsingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 24,
    margin: 20,
    width: '90%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  resultContainer: {
    marginBottom: 24,
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  resultLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6B7280',
  },
  resultValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  confidenceIndicator: {
    height: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
    marginTop: 16,
    overflow: 'hidden',
  },
  confidenceBar: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 4,
  },
  lowConfidenceWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  warningText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#92400E',
    fontWeight: '500',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  retryButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 16,
    alignItems: 'center',
    marginRight: 8,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  confirmButton: {
    flex: 1,
    backgroundColor: '#10B981',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 16,
    alignItems: 'center',
    marginLeft: 8,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});
