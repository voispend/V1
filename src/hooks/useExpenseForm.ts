import { useState, useEffect } from 'react';
import { ExpenseFormData } from '../types/expense';

/**
 * Custom hook for managing expense form state
 * @param initialCurrency - Initial currency value
 * @returns Object containing form state and handlers
 */
export const useExpenseForm = (initialCurrency: string = 'USD') => {
  const [expenseData, setExpenseData] = useState<ExpenseFormData>({
    amount: '',
    description: '',
    category: 'Misc',
    date: new Date().toISOString().split('T')[0] || '',
    currency: initialCurrency,
  });

  const resetForm = () => {
    setExpenseData({
      amount: '',
      description: '',
      category: 'Misc',
      date: new Date().toISOString().split('T')[0] || '',
      currency: initialCurrency,
    });
  };

  const updateForm = (updates: Partial<ExpenseFormData>) => {
    setExpenseData(prev => ({ ...prev, ...updates }));
  };

  const setFormFromExtractedData = (data: any) => {
    setExpenseData({
      ...expenseData,
      amount: data.amount?.toString() || '',
      description: data.vendor || data.description || '',
      currency: data.currency || initialCurrency,
    });
  };

  const setFormFromVoiceData = (data: any) => {
    setExpenseData({
      ...expenseData,
      amount: data.amount.toString(),
      description: data.description,
      category: data.category,
    });
  };

  return {
    expenseData,
    setExpenseData,
    resetForm,
    updateForm,
    setFormFromExtractedData,
    setFormFromVoiceData,
  };
};
