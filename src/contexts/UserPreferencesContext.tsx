import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './AuthContext';
import { useTheme } from './ThemeContext';

export interface UserPreferences {
  currency: string;
  currencySymbol: string;
  language: string;
  theme: 'light' | 'dark' | 'auto';
  notifications: {
    enabled: boolean;
    expenseReminders: boolean;
    weeklyReports: boolean;
    monthlyReports: boolean;
    lowBalanceAlerts: boolean;
    receiptScanReminders: boolean;
  };
}

interface UserPreferencesContextType {
  preferences: UserPreferences;
  updateCurrency: (currency: string) => Promise<void>;
  updateLanguage: (language: string) => Promise<void>;
  updateTheme: (theme: 'light' | 'dark' | 'auto') => Promise<void>;
  updateNotificationSettings: (settings: Partial<UserPreferences['notifications']>) => Promise<void>;
  toggleNotification: (type: keyof UserPreferences['notifications']) => Promise<void>;
  resetNotificationSettings: () => Promise<void>;
  loading: boolean;
}

const UserPreferencesContext = createContext<UserPreferencesContextType | undefined>(undefined);

const CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
];

const LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'it', name: 'Italiano', flag: '🇮🇹' },
  { code: 'pt', name: 'Português', flag: '🇵🇹' },
  { code: 'ru', name: 'Русский', flag: '🇷🇺' },
  { code: 'zh', name: '中文', flag: '🇨🇳' },
  { code: 'ja', name: '日本語', flag: '🇯🇵' },
  { code: 'ko', name: '한국어', flag: '🇰🇷' },
];

const defaultPreferences: UserPreferences = {
  currency: 'EUR',
  currencySymbol: '€',
  language: 'en',
  theme: 'light',
  notifications: {
    enabled: true,
    expenseReminders: true,
    weeklyReports: true,
    monthlyReports: true,
    lowBalanceAlerts: true,
    receiptScanReminders: true,
  },
};

export function UserPreferencesProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { setThemeMode } = useTheme();
  const [preferences, setPreferences] = useState<UserPreferences>(defaultPreferences);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadPreferences();
    } else {
      setPreferences(defaultPreferences);
      setLoading(false);
    }
  }, [user]);

  const loadPreferences = async () => {
    try {
      const key = `preferences:${user?.id}`;
      const stored = await AsyncStorage.getItem(key);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Merge with default preferences to ensure all new fields exist
        const mergedPreferences = {
          ...defaultPreferences,
          ...parsed,
          notifications: {
            ...defaultPreferences.notifications,
            ...parsed.notifications, // This will be undefined for existing users
          },
        };
        setPreferences(mergedPreferences);
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async (newPreferences: UserPreferences) => {
    try {
      const key = `preferences:${user?.id}`;
      await AsyncStorage.setItem(key, JSON.stringify(newPreferences));
      setPreferences(newPreferences);
    } catch (error) {
      console.error('Error saving preferences:', error);
    }
  };

  const updateCurrency = async (currency: string) => {
    const currencyData = CURRENCIES.find(c => c.code === currency);
    if (currencyData) {
      const newPreferences = {
        ...preferences,
        currency: currencyData.code,
        currencySymbol: currencyData.symbol,
      };
      await savePreferences(newPreferences);
      
      // Update all existing expenses to use the new currency
      // This will be handled by the useExpenses hook when it's used
    }
  };

  const updateLanguage = async (language: string) => {
    const newPreferences = { ...preferences, language };
    await savePreferences(newPreferences);
  };

  const updateTheme = async (theme: 'light' | 'dark' | 'auto') => {
    const newPreferences = { ...preferences, theme };
    await savePreferences(newPreferences);
    // Also update the theme context
    await setThemeMode(theme);
  };

  const updateNotificationSettings = async (settings: Partial<UserPreferences['notifications']>) => {
    try {
      // Ensure notifications object exists with defaults
      const currentNotifications = preferences.notifications || defaultPreferences.notifications;
      
      console.log('Updating notification settings:', { current: currentNotifications, new: settings });
      
      const newPreferences = {
        ...preferences,
        notifications: {
          ...currentNotifications,
          ...settings,
        },
      };
      
      await savePreferences(newPreferences);
      console.log('Successfully updated notification settings:', newPreferences.notifications);
    } catch (error) {
      console.error('Error updating notification settings:', error);
    }
  };

  const toggleNotification = async (type: keyof UserPreferences['notifications']) => {
    try {
      // Ensure notifications object exists with defaults
      const currentNotifications = preferences.notifications || defaultPreferences.notifications;
      const currentValue = currentNotifications[type];
      
      console.log(`Toggling ${type}:`, { currentValue, newValue: !currentValue });
      
      const newPreferences = {
        ...preferences,
        notifications: {
          ...currentNotifications,
          [type]: !currentValue,
        },
      };
      
      await savePreferences(newPreferences);
      console.log(`Successfully toggled ${type} to:`, newPreferences.notifications[type]);
    } catch (error) {
      console.error(`Error toggling notification ${type}:`, error);
    }
  };

  const resetNotificationSettings = async () => {
    try {
      console.log('Resetting notification settings to defaults');
      
      const newPreferences = {
        ...preferences,
        notifications: { ...defaultPreferences.notifications },
      };
      
      await savePreferences(newPreferences);
      console.log('Successfully reset notification settings:', newPreferences.notifications);
    } catch (error) {
      console.error('Error resetting notification settings:', error);
    }
  };

  return (
    <UserPreferencesContext.Provider
      value={{
        preferences,
        updateCurrency,
        updateLanguage,
        updateTheme,
        updateNotificationSettings,
        toggleNotification,
        resetNotificationSettings,
        loading,
      }}
    >
      {children}
    </UserPreferencesContext.Provider>
  );
}

export function useUserPreferences() {
  const context = useContext(UserPreferencesContext);
  if (context === undefined) {
    throw new Error('useUserPreferences must be used within a UserPreferencesProvider');
  }
  return context;
}

export { CURRENCIES, LANGUAGES };
