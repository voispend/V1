import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useUserPreferences } from '../contexts/UserPreferencesContext';
import { Expense, ExpenseInput } from '../types/expense';
import { supabase } from '../config/supabase';

export function useExpenses() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { preferences } = useUserPreferences();

  useEffect(() => {
    console.log('Expenses hook - user changed:', user?.id);
    if (user) {
      fetchExpenses();
    } else {
      // Clear expenses when user logs out
      setExpenses([]);
      setLoading(false);
    }
  }, [user]);

  const fetchExpenses = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching expenses:', error);
        return;
      }

      console.log('Fetched expenses:', data?.length || 0);
      setExpenses(data || []);
    } catch (error) {
      console.error('Error fetching expenses:', error);
    } finally {
      setLoading(false);
    }
  };

  const addExpense = async (expense: ExpenseInput): Promise<Expense | null> => {
    if (!user?.id) return null;
    
    try {
      const newExpense = {
        user_id: user.id,
        amount: expense.amount,
        description: expense.description,
        category: expense.category,
        date: expense.date ?? new Date().toISOString().split('T')[0],
        currency: expense.currency || preferences.currency, // Use expense currency, fallback to preferences
      };

      const { data, error } = await supabase
        .from('expenses')
        .insert(newExpense)
        .select()
        .single();

      if (error) {
        console.error('Error adding expense:', error);
        return null;
      }

      // Refresh the expenses list
      await fetchExpenses();
      return data;
    } catch (error) {
      console.error('Error adding expense:', error);
      return null;
    }
  };

  const updateExpense = async (id: string, updates: Partial<ExpenseInput>): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('expenses')
        .update({
          amount: updates.amount,
          description: updates.description,
          category: updates.category,
          date: updates.date,
        })
        .eq('id', id)
        .eq('user_id', user?.id);

      if (error) {
        console.error('Error updating expense:', error);
        return false;
      }

      // Refresh the expenses list
      await fetchExpenses();
      return true;
    } catch (error) {
      console.error('Error updating expense:', error);
      return false;
    }
  };

  const updateExpenseCurrency = async (newCurrency: string) => {
    if (!user?.id) return;
    
    try {
      const { error } = await supabase
        .from('expenses')
        .update({ currency: newCurrency })
        .eq('user_id', user.id);

      if (error) {
        console.error('Error updating expense currencies:', error);
        return;
      }

      // Refresh the expenses list
      await fetchExpenses();
    } catch (error) {
      console.error('Error updating expense currencies:', error);
    }
  };

  const deleteExpense = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', id)
        .eq('user_id', user?.id);

      if (error) {
        console.error('Error deleting expense:', error);
        return false;
      }

      // Refresh the expenses list
      await fetchExpenses();
      return true;
    } catch (error) {
      console.error('Error deleting expense:', error);
      return false;
    }
  };

  return {
    expenses,
    loading,
    fetchExpenses,
    addExpense,
    updateExpense,
    deleteExpense,
    updateExpenseCurrency,
  };
}