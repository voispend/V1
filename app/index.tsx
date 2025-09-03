import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '../src/contexts/NavigationContext';
import { useAuth } from '../src/contexts/AuthContext';
import { useExpenses } from '../src/hooks/useExpenses';
import { useUserPreferences } from '../src/contexts/UserPreferencesContext';
import { Expense } from '../src/types/expense';
import { useTheme } from '../src/contexts/ThemeContext';
import { handleDeleteExpense } from '../src/utils/expenseUtils';
import AppHeader from '../src/components/AppHeader';
import { Card } from '../src/components/ui/Card';
import { Button } from '../src/components/ui/Button';
import { ExpenseEditModal } from '../src/components/ExpenseEditModal';
import { colors, typography, space, radius, layout } from '../src/theme/tokens';

export default function HomeScreen() {
  const { navigateTo } = useNavigation();
  const { user, loading: authLoading } = useAuth();
  const { expenses, loading, deleteExpense } = useExpenses();
  const { preferences } = useUserPreferences();
  const { isDark } = useTheme();
  const [recentExpenses, setRecentExpenses] = useState<Expense[]>([]);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const monthKey = useMemo(() => new Date().toISOString().slice(0, 7), []);
  const monthly = useMemo(() => expenses.filter(e => (e.date || e.created_at).startsWith(monthKey)), [expenses, monthKey]);
  const totalMonthly = useMemo(() => monthly.reduce((s, e) => s + (e.amount || 0), 0), [monthly]);
  const currencySymbol = preferences.currencySymbol;

  useEffect(() => {
    console.log('Auth state changed:', { user: user?.id, authLoading });
    if (!authLoading && !user) {
      navigateTo('/onboarding');
    }
  }, [user, authLoading]);

  useEffect(() => {
    if (expenses) {
      setRecentExpenses(expenses.slice(0, 5));
    }
  }, [expenses]);

  const renderExpenseItem = ({ item }: { item: Expense }) => {
    // Convert amount to user's selected currency if different
    const displayAmount = item.currency === preferences.currency 
      ? item.amount 
      : item.amount; // For now, just display as-is since we don't have conversion rates
    
    return (
      <TouchableOpacity
        style={[styles.expenseItem, { backgroundColor: isDark ? colors.surface.secondary : colors.surface.primary }]}
        onPress={() => {
          setSelectedExpense(item);
          setShowEditModal(true);
        }}
        onLongPress={() => handleDeleteExpense(item.id, deleteExpense)}
      >
        <View style={styles.expenseHeader}>
          <Text style={[styles.expenseAmount, { color: isDark ? colors.brand[600] : colors.brand[700] }]}>
            {`${currencySymbol}${Number(displayAmount).toFixed(2)}`}
          </Text>
          <Text style={[styles.expenseCategory, { 
            color: isDark ? colors.brand[600] : colors.brand[700],
            backgroundColor: isDark ? colors.gray[800] : colors.brand[50]
          }]}>{item.category}</Text>
        </View>
        <Text style={[styles.expenseDescription, { color: isDark ? colors.gray[200] : colors.gray[700] }]} numberOfLines={1}>
          {item.description}
        </Text>
        <Text style={[styles.expenseDate, { color: isDark ? colors.gray[400] : colors.gray[500] }]}>
          {new Date(item.date || item.created_at).toLocaleDateString()}
        </Text>
      </TouchableOpacity>
    );
  };

  if (authLoading || loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading...</Text>
      </View>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <View style={[styles.container, { backgroundColor: isDark ? colors.background.dark : colors.background.primary }]}>
      {/* Fixed Header */}
      <AppHeader 
        title="VOISPEND" 
        subtitle="SPEND-SPEAK-TRACK"
      />

      {/* Content */}
      <View style={styles.content}>
        {/* KPI Hero Card */}
        <Card style={styles.heroCard} variant="elevated" padding="lg">
                    {/* Title row with help icon */}
          <View style={styles.heroTitleRow}>
            <Text style={[typography.meta, { color: colors.gray[500] }]}>
              {new Date().toLocaleString(undefined, { month: 'long', year: 'numeric' })}
            </Text>
            <TouchableOpacity onPress={() => navigateTo('/reports')}>
              <Ionicons name="help-circle-outline" size={layout.icon.small} color={colors.gray[400]} />
            </TouchableOpacity>
          </View>
          
          {/* Big amount */}
          <Text style={[typography.kpi, { color: colors.brand[600], marginTop: space[1] }]}>
            {`${currencySymbol}${totalMonthly.toFixed(2)}`}
          </Text>
          
          {/* Transaction count */}
          <Text style={[typography.meta, { color: colors.gray[500], marginTop: space[1] }]}>
            {monthly.length} transaction{monthly.length !== 1 ? 's' : ''}
          </Text>

          {/* Two side-by-side buttons */}
          <View style={styles.heroButtons}>
            <Button 
              label="Record Expense" 
              icon="mic" 
              variant="primary" 
              onPress={() => navigateTo('record')} 
              style={{ flex: 1 }} 
            />
            <Button 
              label="Scan Receipts" 
              icon="document-text-outline" 
              variant="secondary" 
              onPress={() => navigateTo('record')} 
              style={{ flex: 1 }} 
            />
          </View>
        </Card>

      {/* Recent Expenses Section */}
      <View style={styles.recentSection}>
        <View style={styles.sectionHeader}>
          <Text style={[typography.body, { color: isDark ? colors.gray[100] : colors.gray[900] }]}>Recent Expenses</Text>
          <TouchableOpacity 
            style={styles.seeAllButton}
            onPress={() => navigateTo('expenses')}
          >
            <Text style={[typography.body, { color: colors.brand[600], marginRight: space[1] }]}>See all</Text>
            <Ionicons name="chevron-forward-outline" size={16} color={colors.brand[600]} />
          </TouchableOpacity>
        </View>
        
        {recentExpenses.length > 0 ? (
          <FlatList
            data={recentExpenses}
            renderItem={renderExpenseItem}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.expenseList}
            scrollEnabled={true} // Enable scrolling for recent expenses
          />
        ) : (
          <Text style={[styles.emptyText, { color: isDark ? colors.gray[400] : colors.gray[500] }]}>
            No expenses yet. Tap Record to add one.
          </Text>
        )}
      </View>
      </View>

      {/* Expense Edit Modal */}
      <ExpenseEditModal
        visible={showEditModal}
        expense={selectedExpense}
        onClose={() => {
          setShowEditModal(false);
          setSelectedExpense(null);
        }}
        onSave={() => {
          setShowEditModal(false);
          setSelectedExpense(null);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    width: '100%',
  },
  content: {
    flex: 1,
    paddingTop: 16, // Add top padding since header is now fixed
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroCard: {
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 12,
  },
  heroTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: space[2],
  },
  heroButtons: {
    flexDirection: 'row',
    gap: space[3],
    marginTop: space[2],
  },
  recentSection: {
    flex: 1,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  expenseItem: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  expenseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: space[1],
  },
  expenseAmount: {
    ...typography.body,
    fontWeight: '600',
  },
  expenseCategory: {
    ...typography.meta,
    paddingHorizontal: space[2],
    paddingVertical: space[1],
    borderRadius: radius.md,
  },
  expenseDescription: {
    ...typography.body,
    marginBottom: space[1],
  },
  expenseDate: {
    ...typography.meta,
  },
  emptyText: {
    textAlign: 'center',
    ...typography.body,
    marginTop: space[10],
  },
  expenseList: {
    paddingBottom: space[4],
  },
});