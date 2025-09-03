import { useState, useEffect } from 'react';
import { Expense } from '../types/expense';

interface EditFormData {
  amount: string;
  description: string;
  category: string;
  date: string;
}

interface UseExpenseEditProps {
  expense: Expense | null;
}

/**
 * Custom hook for managing expense edit form state
 * @param expense - The expense being edited
 * @returns Object containing form state and handlers
 */
export const useExpenseEdit = ({ expense }: UseExpenseEditProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editForm, setEditForm] = useState<EditFormData>({
    amount: '',
    description: '',
    category: 'Misc',
    date: '',
  });

  // Update editForm when expense data changes
  useEffect(() => {
    if (expense) {
      setEditForm({
        amount: expense.amount.toString(),
        description: expense.description,
        category: expense.category,
        date: expense.date || expense.created_at?.split('T')[0] || new Date().toISOString().split('T')[0] || '',
      });
    }
  }, [expense]);

  const updateForm = (updates: Partial<EditFormData>) => {
    setEditForm(prev => ({ ...prev, ...updates }));
  };

  const resetForm = () => {
    if (expense) {
      setEditForm({
        amount: expense.amount.toString(),
        description: expense.description,
        category: expense.category,
        date: expense.date || expense.created_at?.split('T')[0] || new Date().toISOString().split('T')[0] || '',
      });
    }
  };

  const startEditing = () => {
    setIsEditing(true);
  };

  const stopEditing = () => {
    setIsEditing(false);
    resetForm();
  };

  const showDeleteConfirmation = () => {
    setShowDeleteConfirm(true);
  };

  const hideDeleteConfirmation = () => {
    setShowDeleteConfirm(false);
  };

  return {
    isEditing,
    showDeleteConfirm,
    editForm,
    setEditForm,
    updateForm,
    resetForm,
    startEditing,
    stopEditing,
    showDeleteConfirmation,
    hideDeleteConfirmation,
  };
};
