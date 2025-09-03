import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useExpenses } from '../src/hooks/useExpenses';
import { useUserPreferences } from '../src/contexts/UserPreferencesContext';
import { useNavigation } from '../src/contexts/NavigationContext';
import { useTheme } from '../src/contexts/ThemeContext';
import { EXPENSE_CATEGORIES, Expense } from '../src/types/expense';
import { handleDeleteExpense } from '../src/utils/expenseUtils';
import AppHeader from '../src/components/AppHeader';
import { Chip } from '../src/components/ui/Chip';
import { ExpenseEditModal } from '../src/components/ExpenseEditModal';
import { colors, typography, space, layout } from '../src/theme/tokens';

export default function ExpensesScreen() {
  const { expenses, deleteExpense } = useExpenses();
  const { preferences } = useUserPreferences();

  const { isDark } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  const currencySymbol = preferences.currencySymbol;

  // Get available months from expenses
  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    expenses.forEach(expense => {
      const date = new Date(expense.date || expense.created_at);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      months.add(monthKey);
    });
    return Array.from(months).sort().reverse();
  }, [expenses]);

  // Filter expenses by selected month
  const monthExpenses = useMemo(() => {
    return expenses.filter(expense => {
      const date = new Date(expense.date || expense.created_at);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      return monthKey === selectedMonth;
    });
  }, [expenses, selectedMonth]);

  // Filter and sort expenses
  const filteredExpenses = useMemo(() => {
    let filtered = monthExpenses;

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(expense =>
        expense.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        expense.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply category filter
    if (selectedCategories.length > 0) {
      filtered = filtered.filter(expense =>
        selectedCategories.includes(expense.category)
      );
    }

    // Sort expenses
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(b.date || b.created_at).getTime() - new Date(a.date || a.created_at).getTime();
        case 'amount':
          return b.amount - a.amount;
        case 'category':
          return a.category.localeCompare(b.category);
        default:
          return 0;
      }
    });

    return filtered;
  }, [monthExpenses, searchQuery, sortBy, selectedCategories]);

  const getMonthLabel = (monthKey: string) => {
    const [year, month] = monthKey.split('-');
    if (!year || !month) return monthKey;
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const getMonthTotal = (monthKey: string) => {
    const monthExpenses = expenses.filter(expense => {
      const date = new Date(expense.date || expense.created_at);
      const expenseMonthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      return expenseMonthKey === monthKey;
    });
    return monthExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  };

  const renderExpenseItem = (item: Expense) => (
    <TouchableOpacity
      style={[styles.expenseCard, { backgroundColor: isDark ? '#374151' : '#FFFFFF' }]}
      onPress={() => {
        console.log('🔍 Expense item clicked:', {
          itemId: item.id,
          itemDescription: item.description,
          willOpenModal: true
        });
        setSelectedExpense(item);
        setShowEditModal(true);
      }}
      activeOpacity={0.7}
      accessibilityLabel={`Expense: ${item.description}, ${currencySymbol}${item.amount.toFixed(2)}`}
      accessibilityRole="button"
    >
      <View style={styles.expenseHeader}>
        <View style={styles.expenseInfo}>
          <Text style={[styles.expenseDescription, { color: isDark ? '#F9FAFB' : '#111827' }]} numberOfLines={2}>
            {item.description}
          </Text>
          <Text style={[styles.expenseCategory, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
            {item.category}
          </Text>
        </View>
        <View style={styles.expenseAmount}>
          <Text style={[styles.amountText, { color: isDark ? '#EF4444' : '#DC2626' }]}>
            {currencySymbol}{item.amount.toFixed(2)}
          </Text>
          <Text style={[styles.expenseDate, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
            {new Date(item.date || item.created_at).toLocaleDateString()}
          </Text>
        </View>
      </View>
      
      <View style={styles.expenseActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => {
            setSelectedExpense(item);
            setShowEditModal(true);
          }}
          accessibilityLabel={`Edit expense: ${item.description}`}
          accessibilityRole="button"
        >
          <Ionicons name="create-outline" size={16} color="#6B7280" />
          <Text style={styles.actionText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleDeleteExpense(item.id, deleteExpense)}
          accessibilityLabel={`Delete expense: ${item.description}`}
          accessibilityRole="button"
        >
          <Ionicons name="trash-outline" size={16} color="#EF4444" />
          <Text style={[styles.actionText, { color: '#EF4444' }]}>Delete</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#1F2937' : '#F9FAFB' }]}>
      {/* Screen Header */}
      <AppHeader title="Expenses" />

      {/* Month Selector */}
      <View style={styles.monthSelector}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.monthScroll}
        >
          {availableMonths.map((monthKey) => (
            <Chip
              key={monthKey}
              label={`${getMonthLabel(monthKey)}\n${currencySymbol}${getMonthTotal(monthKey).toFixed(2)}`}
              active={selectedMonth === monthKey}
              onPress={() => setSelectedMonth(monthKey)}
              style={{ marginRight: space[2] }}
            />
          ))}
        </ScrollView>
      </View>

      {/* Search and Sort Section */}
      <View style={styles.searchSortSection}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={layout.icon.small} color={colors.gray[500]} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: colors.text.primary }]}
            placeholder="Search expenses..."
            placeholderTextColor={colors.gray[400]}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        
        <TouchableOpacity
          style={styles.sortButton}
          onPress={() => setShowFilters(!showFilters)}
          accessibilityLabel="Toggle filters and sorting options"
          accessibilityRole="button"
        >
          <Ionicons name="filter" size={20} color="#6B7280" />
        </TouchableOpacity>
      </View>

      {/* Filters */}
      {showFilters && (
        <View style={[styles.filtersContainer, { backgroundColor: isDark ? '#374151' : '#FFFFFF' }]}>
          <View style={styles.sortContainer}>
            <Text style={[styles.sortLabel, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
              Sort by:
            </Text>
            <View style={styles.sortButtons}>
              {(['date', 'amount', 'category'] as const).map((sort) => (
                <TouchableOpacity
                  key={sort}
                  style={[
                    styles.sortButton,
                    { backgroundColor: isDark ? '#4B5563' : '#F3F4F6' },
                    sortBy === sort && { backgroundColor: isDark ? '#059669' : '#10B981' }
                  ]}
                  onPress={() => setSortBy(sort)}
                >
                  <Text style={[
                    styles.sortButtonText,
                    { color: sortBy === sort ? '#FFFFFF' : (isDark ? '#9CA3AF' : '#6B7280') }
                  ]}>
                    {sort.charAt(0).toUpperCase() + sort.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          
          <View style={styles.categoryFilters}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {EXPENSE_CATEGORIES.map((category) => (
                <TouchableOpacity
                  key={category.name}
                  style={[
                    styles.categoryChip,
                    selectedCategories.includes(category.name) && {
                      backgroundColor: category.color,
                      borderColor: category.color
                    }
                  ]}
                  onPress={() => {
                    setSelectedCategories(prev =>
                      prev.includes(category.name)
                        ? prev.filter(cat => cat !== category.name)
                        : [...prev, category.name]
                    );
                  }}
                >
                  <Text style={[
                    styles.categoryChipText,
                    { color: selectedCategories.includes(category.name) ? '#FFFFFF' : (isDark ? '#9CA3AF' : '#6B7280') }
                  ]}>
                    {category.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      )}

      {/* Main Content */}
      <ScrollView style={styles.mainContent} showsVerticalScrollIndicator={false}>
        {filteredExpenses.length > 0 ? (
          filteredExpenses.map((expense) => (
            <View key={expense.id} style={styles.expenseItem}>
              {renderExpenseItem(expense)}
            </View>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="wallet-outline" size={48} color="#9CA3AF" />
            <Text style={styles.emptyStateText}>No expenses found</Text>
            <Text style={styles.emptyStateSubtext}>
              {searchQuery || selectedCategories.length > 0 
                ? 'Try adjusting your search or filters' 
                : 'Add your first expense to get started'}
            </Text>
          </View>
        )}
      </ScrollView>

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
  },
  content: {
    flex: 1,
    paddingTop: 16, // Add top padding since header is now fixed
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerSpacer: {
    height: 20,
  },
  monthSelector: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F9FAFB',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  monthScroll: {
    alignItems: 'center',
  },
  monthButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  selectedMonth: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  monthLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    textAlign: 'center',
  },
  selectedMonthLabel: {
    color: '#FFFFFF',
  },
  monthTotal: {
    fontSize: 12,
    marginTop: 4,
    color: '#6B7280',
    textAlign: 'center',
  },
  selectedMonthTotal: {
    color: '#FFFFFF',
  },
  searchSortSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F9FAFB',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchIcon: {
    marginRight: 12,
    color: '#6B7280',
  },
  searchInput: {
    flex: 1,
    fontSize: typography.body.fontSize,
  },
  sortButton: {
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filtersContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  sortContainer: {
    marginBottom: 16,
  },
  sortLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  sortButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  sortButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  categoryFilters: {
    marginTop: 8,
  },
  categoryChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginRight: 8,
    backgroundColor: '#F3F4F6',
  },
  categoryChipText: {
    fontSize: 12,
    fontWeight: '500',
  },
  mainContent: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  expenseItem: {
    marginBottom: 12,
  },
  expenseCard: {
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  expenseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  expenseInfo: {
    flex: 1,
  },
  expenseDescription: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  expenseCategory: {
    fontSize: 14,
  },
  expenseAmount: {
    alignItems: 'flex-end',
  },
  amountText: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  expenseDate: {
    fontSize: 12,
  },
  expenseActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  actionText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
    color: '#9CA3AF',
  },
  emptyStateSubtext: {
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 32,
    color: '#6B7280',
  },
});
