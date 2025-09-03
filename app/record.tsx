import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import VoiceRecorder from '../src/components/VoiceRecorder';
import ReceiptScanner from '../src/components/ReceiptScanner';
import { useExpenses } from '../src/hooks/useExpenses';
import { useLanguage } from '../src/contexts/LanguageContext';
import { useUserPreferences } from '../src/contexts/UserPreferencesContext';
import { useNavigation } from '../src/contexts/NavigationContext';

import { TranscriptionResult } from '../src/components/VoiceRecorder';
import { extractExpenseData } from '../src/utils/openai';
import AppHeader from '../src/components/AppHeader';

import { ModeSelector } from '../src/components/ModeSelector';
import { ExpenseFormFields } from '../src/components/ExpenseFormFields';
import { useExpenseForm } from '../src/hooks/useExpenseForm';
import { SafeBoundary } from '../src/components/SafeBoundary';
import { colors, typography, space, shadows, layout } from '../src/theme/tokens';

export default function RecordScreen() {
  const { addExpense } = useExpenses();
  const { t } = useLanguage();
  const { preferences } = useUserPreferences();
  const [transcription, setTranscription] = useState<TranscriptionResult | null>(null);
  const [extractedData, setExtractedData] = useState<any>(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showReceiptReview, setShowReceiptReview] = useState(false);
  const [showVoiceReview, setShowVoiceReview] = useState(false);
  const [isManualMode, setIsManualMode] = useState(false);
  const [isReceiptMode, setIsReceiptMode] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [receiptData, setReceiptData] = useState<any>(null);

  const {
    expenseData,
    setExpenseData,
    resetForm,
    setFormFromExtractedData,
    setFormFromVoiceData,
  } = useExpenseForm(preferences?.currency || 'USD');

  const handleVoiceRecordingComplete = async (transcription: TranscriptionResult) => {
    setTranscription(transcription);
    setIsExtracting(true);
    
    try {
      // Extract expense data from voice transcription
      const extractedData = await extractExpenseData(transcription.text);
      setExtractedData(extractedData);
      setFormFromVoiceData(extractedData);
      setShowEditForm(false); // Don't show manual entry form
      setShowVoiceReview(true); // Show voice review instead
    } catch (error) {
      console.error('Failed to extract expense data:', error);
      setError('Failed to extract expense data from voice. Please try again.');
    } finally {
      setIsExtracting(false);
    }
  };

  const handleReceiptParsed = (data: any) => {
    console.log('🔍 Receipt parsed:', data);
    setReceiptData(data);
    setFormFromExtractedData(data);
    setShowReceiptReview(true);
    setShowEditForm(false); // Hide manual entry form when showing receipt review
  };

  const handleSaveExpense = async () => {
    if (!expenseData.amount || !expenseData.description) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      await addExpense({
        amount: parseFloat(expenseData.amount),
        description: expenseData.description,
        category: expenseData.category,
        date: expenseData.date,
        currency: expenseData.currency,
      });

      Alert.alert('Success', 'Expense saved successfully!');
      handleRetry();
    } catch (error) {
      setError('Failed to save expense. Please try again.');
    }
  };

  const handleRetry = () => {
    resetForm();
    setTranscription(null);
    setExtractedData(null);
    setShowEditForm(false);
    setShowVoiceReview(false);
    setShowReceiptReview(false);
    setIsManualMode(false);
    setError(null);
  };

  const handleManualEntry = () => {
    setIsManualMode(true);
    setShowEditForm(true);
  };

  const handleModeChange = (mode: 'voice' | 'receipt') => {
    setIsReceiptMode(mode === 'receipt');
    setError(null);
  };



  return (
    <SafeBoundary>
      <View style={styles.container}>
        {/* Screen Header */}
        <AppHeader title="Record" />

        {/* Main Content */}
        <View style={styles.mainContent}>
        {/* Mode Selector */}
        <ModeSelector
          isReceiptMode={isReceiptMode}
          onModeChange={handleModeChange}
        />

        {/* Voice Mode */}
        {!isReceiptMode && (
          <View style={styles.voiceSection}>
            <VoiceRecorder
              onTranscription={handleVoiceRecordingComplete}
              onError={setError}
            />
          </View>
        )}

        {/* Receipt Mode */}
        {isReceiptMode && (
          <View style={styles.receiptSection}>
            <ReceiptScanner
              onReceiptParsed={handleReceiptParsed}
              onError={setError}
            />
          </View>
        )}

        {/* Error Display */}
        {error && (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={20} color="#DC2626" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity 
              onPress={() => setError(null)}
              accessibilityLabel="Dismiss error message"
              accessibilityRole="button"
            >
              <Text style={styles.dismissButton}>Dismiss</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Manual Entry Button */}
        <TouchableOpacity 
          style={styles.manualEntryButton} 
          onPress={handleManualEntry}
          accessibilityLabel="Enter expense manually"
          accessibilityRole="button"
        >
          <Ionicons name="create" size={24} color="#6B7280" />
          <Text style={styles.manualEntryText}>Enter expense manually</Text>
        </TouchableOpacity>
      </View>

      {/* All Modals */}
      <>
        {/* Voice Review Modal */}
        <Modal
          visible={showVoiceReview}
          transparent={true}
          animationType="slide"
          onRequestClose={handleRetry}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Ionicons name="mic" size={20} color="#10B981" />
                <Text style={styles.modalTitle}>Voice Review</Text>
                <TouchableOpacity onPress={handleRetry}>
                  <Ionicons name="close" size={24} color="#6B7280" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                {/* Voice Transcription Display */}
                {transcription && (
                  <View style={styles.receiptDataContainer}>
                    <Text style={styles.receiptDataTitle}>Voice Transcription:</Text>
                    <View style={styles.receiptDataRow}>
                      <Text style={styles.receiptDataLabel}>Text:</Text>
                      <Text style={styles.receiptDataValue}>{transcription.text}</Text>
                    </View>
                    <View style={styles.receiptDataRow}>
                      <Text style={styles.receiptDataLabel}>Confidence:</Text>
                      <Text style={styles.receiptDataValue}>{(transcription.confidence || 0.95) * 100}%</Text>
                    </View>
                  </View>
                )}

                {/* Extracted Data Display */}
                {extractedData && (
                  <View style={styles.receiptDataContainer}>
                    <Text style={styles.receiptDataTitle}>Extracted Data:</Text>
                    <View style={styles.receiptDataRow}>
                      <Text style={styles.receiptDataLabel}>Amount:</Text>
                      <Text style={styles.receiptDataValue}>{`€${extractedData.amount}`}</Text>
                    </View>
                    <View style={styles.receiptDataRow}>
                      <Text style={styles.receiptDataLabel}>Description:</Text>
                      <Text style={styles.receiptDataValue}>{extractedData.description}</Text>
                    </View>
                    <View style={styles.receiptDataRow}>
                      <Text style={styles.receiptDataLabel}>Category:</Text>
                      <Text style={styles.receiptDataValue}>{extractedData.category}</Text>
                    </View>
                    <View style={styles.receiptDataRow}>
                      <Text style={styles.receiptDataLabel}>Confidence:</Text>
                      <Text style={styles.receiptDataValue}>{(extractedData.confidence * 100).toFixed(0)}%</Text>
                    </View>
                  </View>
                )}

                <ExpenseFormFields
                  expenseData={expenseData}
                  onDataChange={setExpenseData}
                  t={t}
                />
              </ScrollView>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={handleRetry}
                  accessibilityLabel="Record voice again"
                  accessibilityRole="button"
                >
                  <Text style={styles.secondaryButtonText}>Record Again</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={handleSaveExpense}
                  accessibilityLabel="Save expense"
                  accessibilityRole="button"
                >
                  <Ionicons name="checkmark" size={20} color="white" />
                  <Text style={styles.primaryButtonText}>{t('saveExpense')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Receipt Review Modal */}
        <Modal
          visible={showReceiptReview}
          transparent={true}
          animationType="slide"
          onRequestClose={() => {
            setShowReceiptReview(false);
            setShowEditForm(false);
          }}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Ionicons name="receipt" size={20} color="#10B981" />
                <Text style={styles.modalTitle}>Receipt Review</Text>
                <TouchableOpacity onPress={() => {
                  setShowReceiptReview(false);
                  setShowEditForm(false);
                }}>
                  <Ionicons name="close" size={24} color="#6B7280" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                {/* Receipt Data Display */}
                {receiptData && (
                  <View style={styles.receiptDataContainer}>
                    <Text style={styles.receiptDataTitle}>Scanned Receipt Data:</Text>
                    <View style={styles.receiptDataRow}>
                      <Text style={styles.receiptDataLabel}>Vendor:</Text>
                      <Text style={styles.receiptDataValue}>{receiptData.vendor || 'N/A'}</Text>
                    </View>
                    <View style={styles.receiptDataRow}>
                      <Text style={styles.receiptDataLabel}>Amount:</Text>
                      <Text style={styles.receiptDataValue}>{`€${receiptData.amount}`}</Text>
                    </View>
                    <View style={styles.receiptDataRow}>
                      <Text style={styles.receiptDataLabel}>Currency:</Text>
                      <Text style={styles.receiptDataValue}>{receiptData.currency}</Text>
                    </View>
                    <View style={styles.receiptDataRow}>
                      <Text style={styles.receiptDataLabel}>Confidence:</Text>
                      <Text style={styles.receiptDataValue}>{(receiptData.confidence * 100).toFixed(0)}%</Text>
                    </View>
                  </View>
                )}

                <ExpenseFormFields
                  expenseData={expenseData}
                  onDataChange={setExpenseData}
                  t={t}
                />
              </ScrollView>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={() => {
                    setShowReceiptReview(false);
                    setShowEditForm(false);
                  }}
                >
                  <Ionicons name="close" size={20} color="#6B7280" />
                  <Text style={styles.secondaryButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={handleSaveExpense}
                >
                  <Ionicons name="checkmark" size={20} color="#FFFFFF" />
                  <Text style={styles.primaryButtonText}>Save Expense</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Manual Entry Modal */}
        <Modal
          visible={showEditForm && !showReceiptReview && !showVoiceReview}
          transparent={true}
          animationType="slide"
          onRequestClose={handleRetry}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Ionicons name="create" size={20} color="#10B981" />
                <Text style={styles.modalTitle}>Manual Expense Entry</Text>
                <TouchableOpacity onPress={handleRetry}>
                  <Ionicons name="close" size={24} color="#6B7280" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                <ExpenseFormFields
                  expenseData={expenseData}
                  onDataChange={setExpenseData}
                  t={t}
                />
              </ScrollView>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={handleRetry}
                >
                  <Text style={styles.secondaryButtonText}>{t('recordAgain')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={handleSaveExpense}
                >
                  <Ionicons name="checkmark" size={20} color="white" />
                  <Text style={styles.primaryButtonText}>{t('saveExpense')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </>
        </View>
      </SafeBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  content: {
    flex: 1,
    paddingTop: 16, // Add top padding since header is now fixed
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 8,
  },
  headerSpacer: {
    flex: 1,
  },
  mainContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 24, // Add more spacing between header and content
  },

  voiceSection: {
    marginBottom: 24,
  },
  receiptSection: {
    marginBottom: 24,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  errorText: {
    flex: 1,
    color: '#DC2626',
    fontSize: 16,
    marginLeft: 12,
  },
  dismissButton: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
  manualEntryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
    paddingVertical: 20,
    paddingHorizontal: 24,
    borderRadius: 20,
    marginTop: 'auto',
    marginBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  manualEntryText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginLeft: 12,
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
    margin: 20,
    width: '90%',
    maxWidth: 500,
    maxHeight: '80%',
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
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    flex: 1,
    textAlign: 'center',
  },
  modalBody: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    maxHeight: 400,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: 24,
    paddingBottom: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  receiptDataContainer: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  receiptDataTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  receiptDataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  receiptDataLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  receiptDataValue: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '600',
  },

  secondaryButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 16,
    alignItems: 'center',
    marginRight: 8,
    minWidth: 100,
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
  },
  primaryButton: {
    flex: 1,
    backgroundColor: '#10B981',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
    minWidth: 100,
  },
  primaryButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: 'white',
    marginLeft: 6,
    textAlign: 'center',
  },
});
