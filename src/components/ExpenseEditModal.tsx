import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Alert, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useExpenses } from '../hooks/useExpenses';
import { Expense, EXPENSE_CATEGORIES } from '../types/expense';
import { CategorySelector } from './CategorySelector';
import { useExpenseEdit } from '../hooks/useExpenseEdit';
import { colors, typography, space, radius, layout, shadows } from '../theme/tokens';

interface ExpenseEditModalProps {
  visible: boolean;
  expense: Expense | null;
  onClose: () => void;
  onSave: () => void;
}

export const ExpenseEditModal: React.FC<ExpenseEditModalProps> = ({
  visible,
  expense,
  onClose,
  onSave,
}) => {
  const { updateExpense, deleteExpense } = useExpenses();
  const {
    isEditing,
    showDeleteConfirm,
    editForm,
    updateForm,
    startEditing,
    stopEditing,
    showDeleteConfirmation,
    hideDeleteConfirmation,
  } = useExpenseEdit({ expense });

  const getCategoryIcon = (category: string) => {
    const cat = EXPENSE_CATEGORIES.find((c: any) => c.name === category);
    return cat ? cat.icon : 'cube-outline';
  };

  const getCategoryColor = (category: string) => {
    const cat = EXPENSE_CATEGORIES.find((c: any) => c.name === category);
    return cat ? cat.color : '#6B7280';
  };

  const handleSave = async () => {
    if (!expense) return;
    
    try {
      await updateExpense(expense.id, {
        amount: parseFloat(editForm.amount),
        description: editForm.description,
        category: editForm.category,
        date: editForm.date,
      });
      stopEditing();
      Alert.alert('Success', 'Expense updated successfully!');
      onSave();
    } catch (error) {
      Alert.alert('Error', 'Failed to update expense');
    }
  };

  const handleDelete = async () => {
    if (!expense) return;
    
    try {
      await deleteExpense(expense.id);
      Alert.alert('Success', 'Expense deleted successfully!');
      onClose();
      onSave();
    } catch (error) {
      Alert.alert('Error', 'Failed to delete expense');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (!expense) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Header with close button */}
          <View style={styles.modalHeader}>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={24} color={colors.gray[500]} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Expense Details</Text>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.actionButton, styles.editButton]}
                onPress={isEditing ? stopEditing : startEditing}
              >
                <Ionicons name="create-outline" size={20} color="white" />
                <Text style={styles.actionButtonText}>
                  {isEditing ? 'Cancel' : 'Edit'}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.actionButton, styles.deleteButton]}
                onPress={showDeleteConfirmation}
              >
                <Ionicons name="trash-outline" size={20} color="white" />
                <Text style={styles.actionButtonText}>Delete</Text>
              </TouchableOpacity>
            </View>

            {isEditing ? (
              /* Edit Form */
              <View style={styles.editContainer}>
                <Text style={styles.sectionTitle}>Edit Expense</Text>
                
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Amount</Text>
                  <TextInput
                    style={styles.textInput}
                    value={editForm.amount}
                    onChangeText={(text) => updateForm({ amount: text })}
                    keyboardType="numeric"
                    placeholder="0.00"
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Description</Text>
                  <TextInput
                    style={styles.textInput}
                    value={editForm.description}
                    onChangeText={(text) => updateForm({ description: text })}
                    placeholder="Description"
                    multiline
                  />
                </View>

                <CategorySelector
                  selectedCategory={editForm.category}
                  onCategorySelect={(category) => updateForm({ category })}
                />

                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Date</Text>
                  <TextInput
                    style={styles.textInput}
                    value={editForm.date}
                    onChangeText={(text) => updateForm({ date: text })}
                    placeholder="YYYY-MM-DD"
                  />
                </View>

                {/* Save/Cancel Buttons */}
                <View style={styles.buttonRow}>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.cancelButton]}
                    onPress={stopEditing}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[styles.actionButton, styles.saveButton]}
                    onPress={handleSave}
                  >
                    <Ionicons name="checkmark" size={20} color="white" />
                    <Text style={styles.saveButtonText}>Save</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              /* View Mode */
              <View style={styles.viewContainer}>
                {/* Expense Header */}
                <View style={styles.expenseHeader}>
                  <View style={styles.amountContainer}>
                    <Text style={styles.amountLabel}>Amount</Text>
                    <Text style={styles.amount}>{`€${expense.amount.toFixed(2)}`}</Text>
                  </View>
                  
                  <View style={styles.categoryContainer}>
                    <View style={[styles.categoryIcon, { backgroundColor: getCategoryColor(expense.category) + '20' }]}>
                      <Text style={styles.categoryEmoji}>{getCategoryIcon(expense.category)}</Text>
                    </View>
                    <Text style={styles.categoryName}>{expense.category}</Text>
                  </View>
                </View>

                {/* Description */}
                <View style={styles.detailSection}>
                  <Text style={styles.sectionTitle}>Description</Text>
                  <Text style={styles.description}>{expense.description}</Text>
                </View>

                {/* Date */}
                <View style={styles.detailSection}>
                  <Text style={styles.sectionTitle}>Date</Text>
                  <Text style={styles.date}>{formatDate(expense.date || expense.created_at)}</Text>
                </View>

                {/* Currency */}
                <View style={styles.detailSection}>
                  <Text style={styles.sectionTitle}>Currency</Text>
                  <Text style={styles.currency}>{expense.currency || 'EUR'}</Text>
                </View>
              </View>
            )}
          </ScrollView>
        </View>
      </View>

      {/* Delete Confirmation Modal */}
      <Modal
        visible={showDeleteConfirm}
        transparent={true}
        animationType="fade"
        onRequestClose={hideDeleteConfirmation}
      >
        <View style={styles.confirmOverlay}>
          <View style={styles.confirmContainer}>
            <View style={styles.confirmHeader}>
              <View style={styles.confirmIconContainer}>
                <Ionicons name="warning" size={32} color="#EF4444" />
              </View>
              <Text style={styles.confirmTitle}>Delete Expense</Text>
              <Text style={styles.confirmMessage}>
                Are you sure you want to delete this expense? This action cannot be undone.
              </Text>
            </View>
            
            <View style={styles.confirmButtons}>
              <TouchableOpacity
                style={[styles.actionButton, styles.confirmCancelButton]}
                onPress={hideDeleteConfirmation}
              >
                <Text style={styles.confirmCancelText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.actionButton, styles.confirmDeleteButton]}
                onPress={handleDelete}
              >
                <Text style={styles.confirmDeleteText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: colors.surface.primary,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingBottom: space[4],
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space[3],
    paddingTop: space[3],
    paddingBottom: space[2],
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  closeButton: {
    padding: space[1],
    borderRadius: radius.sm,
    backgroundColor: colors.gray[100],
  },
  modalTitle: {
    ...typography.sectionTitle,
    color: colors.text.primary,
    flex: 1,
    textAlign: 'center',
    marginRight: 40, // Compensate for close button width
  },
  content: {
    paddingHorizontal: space[3],
  },
  actionButtons: {
    flexDirection: 'row',
    gap: space[2],
    marginVertical: space[3],
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: space[2],
    paddingHorizontal: space[3],
    borderRadius: radius.md,
    gap: space[1],
    flex: 1,
    ...shadows.default,
  },
  editButton: {
    backgroundColor: colors.brand[600],
  },
  deleteButton: {
    backgroundColor: colors.error,
  },
  actionButtonText: {
    ...typography.body,
    fontWeight: '600',
    color: 'white',
  },
  editContainer: {
    backgroundColor: colors.surface.secondary,
    borderRadius: radius.lg,
    padding: space[3],
    marginBottom: space[3],
    ...shadows.default,
  },
  inputContainer: {
    marginBottom: space[3],
  },
  inputLabel: {
    ...typography.body,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: space[1],
  },
  textInput: {
    backgroundColor: colors.surface.primary,
    borderWidth: 1,
    borderColor: colors.gray[200],
    borderRadius: radius.md,
    paddingHorizontal: space[2],
    paddingVertical: space[2],
    fontSize: 16,
    color: colors.text.primary,
  },
  categoryScroll: {
    flexDirection: 'row',
  },
  categoryButton: {
    alignItems: 'center',
    paddingHorizontal: space[2],
    paddingVertical: space[2],
    borderRadius: radius.md,
    backgroundColor: colors.surface.primary,
    borderWidth: 1,
    borderColor: colors.gray[200],
    marginRight: space[2],
    minWidth: 80,
  },
  selectedCategory: {
    backgroundColor: colors.brand[50],
    borderColor: colors.brand[500],
  },
  categoryEmoji: {
    fontSize: 20,
    marginBottom: space[1],
  },
  categoryName: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.text.secondary,
  },
  selectedCategoryName: {
    color: colors.brand[600],
  },
  buttonRow: {
    flexDirection: 'row',
    gap: space[2],
    marginTop: space[3],
  },
  cancelButton: {
    backgroundColor: colors.gray[100],
  },
  cancelButtonText: {
    ...typography.body,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  saveButton: {
    backgroundColor: colors.brand[600],
  },
  saveButtonText: {
    ...typography.body,
    fontWeight: '600',
    color: 'white',
  },
  viewContainer: {
    backgroundColor: colors.surface.secondary,
    borderRadius: radius.lg,
    padding: space[3],
    marginBottom: space[3],
    ...shadows.default,
  },
  expenseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: space[3],
  },
  amountContainer: {
    alignItems: 'flex-start',
  },
  amountLabel: {
    ...typography.meta,
    color: colors.text.secondary,
    marginBottom: space[1],
  },
  amount: {
    fontSize: 36,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  categoryContainer: {
    alignItems: 'center',
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space[1],
  },
  description: {
    ...typography.body,
    color: colors.text.secondary,
    marginBottom: space[2],
  },
  date: {
    ...typography.body,
    color: colors.text.secondary,
    marginBottom: space[2],
  },
  currency: {
    ...typography.body,
    color: colors.text.secondary,
  },
  detailSection: {
    marginBottom: space[3],
  },
  sectionTitle: {
    ...typography.sectionTitle,
    color: colors.text.primary,
    marginBottom: space[1],
  },
  confirmOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space[3],
  },
  confirmContainer: {
    backgroundColor: colors.surface.primary,
    borderRadius: radius.lg,
    padding: space[3],
    width: '100%',
    maxWidth: 320,
    ...shadows.default,
  },
  confirmHeader: {
    alignItems: 'center',
    marginBottom: space[3],
  },
  confirmIconContainer: {
    width: 64,
    height: 64,
    backgroundColor: colors.error + '20',
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space[2],
  },
  confirmTitle: {
    ...typography.sectionTitle,
    color: colors.text.primary,
    marginBottom: space[1],
  },
  confirmMessage: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  confirmButtons: {
    flexDirection: 'row',
    gap: space[2],
  },
  confirmCancelButton: {
    backgroundColor: colors.gray[100],
  },
  confirmCancelText: {
    ...typography.body,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  confirmDeleteButton: {
    backgroundColor: colors.error,
  },
  confirmDeleteText: {
    ...typography.body,
    fontWeight: '600',
    color: 'white',
  },
});
