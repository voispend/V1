import React from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { EXPENSE_CATEGORIES } from '../types/expense';
import { ExpenseFormData } from '../types/expense';

interface ExpenseFormFieldsProps {
  expenseData: ExpenseFormData;
  onDataChange: (data: ExpenseFormData) => void;
  t: (key: string) => string;
}

/**
 * Expense form fields component for input and category selection
 * @param expenseData - Current form data
 * @param onDataChange - Callback when form data changes
 * @param t - Translation function
 */
export const ExpenseFormFields: React.FC<ExpenseFormFieldsProps> = ({
  expenseData,
  onDataChange,
  t,
}) => {
  const handleFieldChange = (field: keyof ExpenseFormData, value: string) => {
    onDataChange({ ...expenseData, [field]: value });
  };

  const handleCategorySelect = (category: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onDataChange({ ...expenseData, category });
  };

  return (
    <ScrollView style={styles.formContainer}>
      {/* Amount */}
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>{t('amount')}</Text>
        <TextInput
          style={styles.textInput}
          value={expenseData.amount}
          onChangeText={(text) => handleFieldChange('amount', text)}
          placeholder="0.00"
          keyboardType="numeric"
        />
      </View>

      {/* Description */}
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>{t('description')}</Text>
        <TextInput
          style={styles.textInput}
          value={expenseData.description}
          onChangeText={(text) => handleFieldChange('description', text)}
          placeholder="What did you spend on?"
          multiline
        />
      </View>

      {/* Category */}
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>{t('category')}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
          {EXPENSE_CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat.name}
              style={[
                styles.categoryButton,
                expenseData.category === cat.name && styles.selectedCategory
              ]}
              onPress={() => handleCategorySelect(cat.name)}
            >
              <View style={[styles.categoryIcon, { backgroundColor: cat.color }]}>
                <Ionicons name={cat.icon as any} size={20} color="#FFFFFF" />
              </View>
              <Text style={[
                styles.categoryName,
                expenseData.category === cat.name && styles.selectedCategoryName
              ]}>
                {cat.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Date */}
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>{t('date')}</Text>
        <TextInput
          style={styles.textInput}
          value={expenseData.date}
          onChangeText={(text) => handleFieldChange('date', text)}
          placeholder="YYYY-MM-DD"
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  formContainer: {
    flex: 1,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
  },
  categoryScroll: {
    marginBottom: 8,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    marginRight: 12,
    minWidth: 100,
  },
  selectedCategory: {
    backgroundColor: '#10B981',
  },
  categoryIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  categoryName: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
  },
  selectedCategoryName: {
    color: '#FFFFFF',
  },
});
