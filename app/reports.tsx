import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useExpenses } from '../src/hooks/useExpenses';
import { useNavigation } from '../src/contexts/NavigationContext';
import AppHeader from '../src/components/AppHeader';
import { ProgressBar } from '../src/components/ui/ProgressBar';
import { colors, typography, space } from '../src/theme/tokens';

export default function ReportsScreen() {
  const { expenses } = useExpenses();
  const [selectedTimeframe, setSelectedTimeframe] = useState('current-month');

  const timeframes = [
    { key: 'current-month', label: 'This Month', icon: 'calendar' },
    { key: 'last-month', label: 'Last Month', icon: 'calendar-outline' },
    { key: 'last-3-months', label: 'Last 3 Months', icon: 'calendar-clear' },
    { key: 'last-6-months', label: 'Last 6 Months', icon: 'calendar-number' },
    { key: 'this-year', label: 'This Year', icon: 'calendar-sharp' },
  ];

  const getDateRange = (timeframe: string) => {
    const now = new Date();
    const startDate = new Date();
    
    switch (timeframe) {
      case 'current-month':
        startDate.setDate(1);
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'last-month':
        // Go to first day of previous month
        if (now.getMonth() === 0) {
          startDate.setFullYear(now.getFullYear() - 1, 11, 1);
        } else {
          startDate.setMonth(now.getMonth() - 1, 1);
        }
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'last-3-months':
        // Go back 3 months from current month
        let targetMonth = now.getMonth() - 3;
        let targetYear = now.getFullYear();
        while (targetMonth < 0) {
          targetMonth += 12;
          targetYear -= 1;
        }
        startDate.setFullYear(targetYear, targetMonth, 1);
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'last-6-months':
        // Go back 6 months from current month
        let targetMonth6 = now.getMonth() - 6;
        let targetYear6 = now.getFullYear();
        while (targetMonth6 < 0) {
          targetMonth6 += 12;
          targetYear6 -= 1;
        }
        startDate.setFullYear(targetYear6, targetMonth6, 1);
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'this-year':
        startDate.setMonth(0, 1);
        startDate.setHours(0, 0, 0, 0);
        break;
      default:
        startDate.setDate(1);
        startDate.setHours(0, 0, 0, 0);
    }
    
    // Set end date to end of current day
    const endDate = new Date(now);
    endDate.setHours(23, 59, 59, 999);
    
    return { startDate, endDate };
  };

  const { startDate, endDate } = getDateRange(selectedTimeframe);

  const filteredExpenses = useMemo(() => {
    console.log('🔍 Reports Debug - Date Range:', {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      totalExpenses: expenses.length,
      selectedTimeframe
    });
    
    const filtered = expenses.filter(expense => {
      const expenseDate = new Date(expense.date || expense.created_at);
      const isInRange = expenseDate >= startDate && expenseDate <= endDate;
      
      if (isInRange) {
        console.log('✅ Expense included:', {
          description: expense.description,
          amount: expense.amount,
          date: expense.date || expense.created_at,
          expenseDate: expenseDate.toISOString()
        });
      }
      
      return isInRange;
    });
    
    console.log('🔍 Reports Debug - Filtered Results:', {
      filteredCount: filtered.length,
      totalAmount: filtered.reduce((sum, exp) => sum + (exp.amount || 0), 0)
    });
    
    return filtered;
  }, [expenses, startDate, endDate, selectedTimeframe]);

  const totalSpent = useMemo(() => {
    const total = filteredExpenses.reduce((sum, expense) => sum + (expense.amount || 0), 0);
    console.log('💰 Reports Debug - Total Spent:', {
      total,
      filteredExpensesCount: filteredExpenses.length,
      allExpensesCount: expenses.length
    });
    return total;
  }, [filteredExpenses, expenses.length]);

  const categoryBreakdown = useMemo(() => {
    const breakdown: { [key: string]: number } = {};
    filteredExpenses.forEach(expense => {
      const category = expense.category || 'Misc';
      breakdown[category] = (breakdown[category] || 0) + (expense.amount || 0);
    });
    return Object.entries(breakdown)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5);
  }, [filteredExpenses]);

  const averageDaily = useMemo(() => {
    const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    return daysDiff > 0 ? totalSpent / daysDiff : 0;
  }, [totalSpent, startDate, endDate]);

  const insights = useMemo(() => {
    const insightsList = [];
    
    if (categoryBreakdown.length > 0) {
      const topCategory = categoryBreakdown[0];
      if (topCategory && topCategory[0] && topCategory[1] !== undefined) {
        insightsList.push(`Your biggest expense category is ${topCategory[0]} (€${topCategory[1].toFixed(2)})`);
      }
    }
    
    if (averageDaily > 0) {
      insightsList.push(`You spend an average of €${averageDaily.toFixed(2)} per day`);
    }
    
    if (filteredExpenses.length > 0) {
      const recentExpenses = filteredExpenses.slice(-3);
      insightsList.push(`Recent expenses: ${recentExpenses.map(exp => exp.description).join(', ')}`);
    }
    
    return insightsList;
  }, [categoryBreakdown, averageDaily, filteredExpenses]);

  const getTimeframeAmount = (timeframe: string) => {
    const { startDate: frameStart, endDate: frameEnd } = getDateRange(timeframe);
    const frameExpenses = expenses.filter(expense => {
      const expenseDate = new Date(expense.date || expense.created_at);
      return expenseDate >= frameStart && expenseDate <= frameEnd;
    });
    const total = frameExpenses.reduce((sum, expense) => sum + (expense.amount || 0), 0);
    return `€${total.toFixed(2)}`;
  };

  return (
    <View style={styles.container}>
      {/* Screen Header */}
      <AppHeader title="Reports" subtitle="Track your spending patterns" />

      {/* Timeframe Selector */}
      <View style={styles.timeframeContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.timeframeScroll}
        >
          {timeframes.map((timeframe) => (
            <TouchableOpacity
              key={timeframe.key}
              style={[
                styles.timeframeButton,
                selectedTimeframe === timeframe.key && styles.selectedTimeframe
              ]}
              onPress={() => setSelectedTimeframe(timeframe.key)}
            >
              <View style={styles.timeframeContent}>
                <Text style={[
                  styles.timeframeLabel,
                  selectedTimeframe === timeframe.key && styles.selectedTimeframeLabel
                ]}>
                  {timeframe.label}
                </Text>
                <Text style={[
                  styles.timeframeSubtitle,
                  selectedTimeframe === timeframe.key && styles.selectedTimeframeSubtitle
                ]}>
                  {getTimeframeAmount(timeframe.key)}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Main Content */}
      <ScrollView style={styles.mainContent} showsVerticalScrollIndicator={false}>
        {/* Summary Card */}
        <View style={styles.summaryCard}>
          <Text style={[typography.sectionTitle, { color: colors.gray[700], marginBottom: space[2] }]}>Total Spent</Text>
                          <Text style={[styles.summaryAmount, { color: colors.brand[600] }]}>{`€${totalSpent.toFixed(2)}`}</Text>
          <Text style={[typography.meta, { color: colors.gray[500] }]}>
            {startDate.toLocaleDateString()} - {endDate.toLocaleDateString()}
          </Text>
        </View>

        {/* Category Breakdown */}
        <View style={styles.sectionCard}>
          <Text style={[typography.sectionTitle, { color: colors.gray[700], marginBottom: space[3] }]}>Top Categories</Text>
          {categoryBreakdown.map(([category, amount], index) => (
            <View key={category} style={styles.categoryRow}>
              <View style={styles.categoryInfo}>
                <Text style={[typography.body, { color: colors.gray[700] }]}>{category}</Text>
                                  <Text style={[typography.body, { color: colors.gray[900], fontWeight: '600' }]}>{`€${amount.toFixed(2)}`}</Text>
              </View>
              <View style={styles.categoryBarContainer}>
                <ProgressBar 
                  value={amount} 
                  maxValue={totalSpent}
                  height={8}
                  fillColor={index === 0 ? colors.brand[600] : index === 1 ? colors.warning : colors.error}
                />
              </View>
            </View>
          ))}
        </View>

        {/* Insights */}
        <View style={styles.sectionCard}>
          <Text style={[typography.sectionTitle, { color: colors.gray[700], marginBottom: space[3] }]}>Insights</Text>
          {insights.map((insight, index) => (
            <View key={index} style={styles.insightItem}>
              <Ionicons name="bulb-outline" size={16} color={colors.brand[600]} />
              <Text style={[typography.body, { color: colors.gray[700], marginLeft: space[2] }]}>{insight}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
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
  timeframeContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F9FAFB',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  timeframeScroll: {
    alignItems: 'center',
  },
  timeframeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  selectedTimeframe: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  timeframeContent: {
    alignItems: 'center',
  },
  timeframeLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    textAlign: 'center',
  },
  selectedTimeframeLabel: {
    color: '#FFFFFF',
  },
  timeframeSubtitle: {
    fontSize: 12,
    marginTop: 4,
    color: '#6B7280',
    textAlign: 'center',
  },
  selectedTimeframeSubtitle: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  mainContent: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  summaryCard: {
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  summaryAmount: {
    fontSize: 36,
    fontWeight: '700',
    marginBottom: 8,
  },
  sectionCard: {
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryBarContainer: {
    flex: 1,
    marginLeft: 12,
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 8,
  },
});