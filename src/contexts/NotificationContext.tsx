import React, { createContext, useContext, useEffect, useState } from 'react';
import { notificationService, NotificationData } from '../services/NotificationService';
import { useAuth } from './AuthContext';
import { useUserPreferences } from './UserPreferencesContext';

interface NotificationContextType {
  // Notification functions
  sendTestNotification: () => Promise<void>;
  sendExpenseReminder: (expenseId: string, amount: number, category: string) => Promise<void>;
  sendWeeklyReportNotification: () => Promise<void>;
  sendMonthlyReportNotification: () => Promise<void>;
  sendLowBalanceAlert: (currentBalance: number, threshold?: number) => Promise<void>;
  sendReceiptScanReminder: () => Promise<void>;
  
  // Notification management
  cancelAllNotifications: () => Promise<void>;
  getScheduledNotifications: () => Promise<any[]>;
  
  // Status
  isInitialized: boolean;
  hasPermission: boolean;
  pushToken: string | null;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { preferences } = useUserPreferences();
  const [isInitialized, setIsInitialized] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [pushToken, setPushToken] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      initializeNotifications();
    }
  }, [user]);

  const initializeNotifications = async () => {
    try {
      await notificationService.initialize();
      setIsInitialized(true);
      setHasPermission(true);
      setPushToken(notificationService.getPushToken());
      console.log('Notification context initialized');
    } catch (error) {
      console.error('Failed to initialize notification context:', error);
      setHasPermission(false);
    }
  };

  const sendTestNotification = async () => {
    if (!user) return;
    await notificationService.sendTestNotification();
  };

  const sendExpenseReminder = async (expenseId: string, amount: number, category: string) => {
    if (!user) return;
    await notificationService.sendExpenseReminder(user.id, expenseId, amount, category);
  };

  const sendWeeklyReportNotification = async () => {
    if (!user) return;
    await notificationService.sendWeeklyReportNotification(user.id);
  };

  const sendMonthlyReportNotification = async () => {
    if (!user) return;
    await notificationService.sendMonthlyReportNotification(user.id);
  };

  const sendLowBalanceAlert = async (currentBalance: number, threshold: number = 100) => {
    if (!user) return;
    await notificationService.sendLowBalanceAlert(user.id, currentBalance, threshold);
  };

  const sendReceiptScanReminder = async () => {
    if (!user) return;
    await notificationService.sendReceiptScanReminder(user.id);
  };

  const cancelAllNotifications = async () => {
    await notificationService.cancelAllNotifications();
  };

  const getScheduledNotifications = async () => {
    return await notificationService.getScheduledNotifications();
  };

  const value: NotificationContextType = {
    sendTestNotification,
    sendExpenseReminder,
    sendWeeklyReportNotification,
    sendMonthlyReportNotification,
    sendLowBalanceAlert,
    sendReceiptScanReminder,
    cancelAllNotifications,
    getScheduledNotifications,
    isInitialized,
    hasPermission,
    pushToken,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
