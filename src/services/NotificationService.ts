import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export interface NotificationData {
  id: string;
  title: string;
  body: string;
  data?: any;
}

export interface NotificationPreferences {
  enabled: boolean;
  expenseReminders: boolean;
  weeklyReports: boolean;
  monthlyReports: boolean;
  lowBalanceAlerts: boolean;
  receiptScanReminders: boolean;
}

export class NotificationService {
  private static instance: NotificationService;
  private expoPushToken: string | null = null;
  private isInitialized = false;

  private constructor() {}

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  // Initialize the notification service
  public async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Request permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.warn('Notification permissions not granted');
        // Still mark as initialized to avoid repeated attempts
        this.isInitialized = true;
        return;
      }

      // Get push token for push notifications
      if (Device.isDevice) {
        try {
          const token = await Notifications.getExpoPushTokenAsync({
            projectId: process.env.EXPO_PROJECT_ID || undefined,
          });
          this.expoPushToken = token.data;
          console.log('Expo push token:', this.expoPushToken);
        } catch (error) {
          console.warn('Failed to get Expo push token (projectId not configured):', error);
          this.expoPushToken = null;
        }
      }

      // Set up notification categories for iOS
      if (Platform.OS === 'ios') {
        try {
          await Notifications.setNotificationCategoryAsync('expense-reminder', [
            {
              identifier: 'snooze',
              buttonTitle: 'Snooze 1 Hour',
              options: {
                isDestructive: false,
                isAuthenticationRequired: false,
              },
            },
            {
              identifier: 'mark-done',
              buttonTitle: 'Mark Done',
              options: {
                isDestructive: false,
                isAuthenticationRequired: false,
              },
            },
          ]);
        } catch (error) {
          console.warn('Failed to set up iOS notification categories:', error);
        }
      }

      this.isInitialized = true;
      console.log('Notification service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize notification service:', error);
      // Mark as initialized to prevent repeated failures
      this.isInitialized = true;
    }
  }

  // Get user notification preferences
  public async getUserPreferences(userId: string): Promise<NotificationPreferences> {
    try {
      const key = `preferences:${userId}`;
      const stored = await AsyncStorage.getItem(key);
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed.notifications || {
          enabled: true,
          expenseReminders: true,
          weeklyReports: true,
          monthlyReports: true,
          lowBalanceAlerts: true,
          receiptScanReminders: true,
        };
      }
    } catch (error) {
      console.error('Error loading notification preferences:', error);
    }

    // Return defaults if no preferences found
    return {
      enabled: true,
      expenseReminders: true,
      weeklyReports: true,
      monthlyReports: true,
      lowBalanceAlerts: true,
      receiptScanReminders: true,
    };
  }

  // Send immediate notification
  public async sendNotification(notification: NotificationData): Promise<void> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      await Notifications.scheduleNotificationAsync({
        content: {
          title: notification.title,
          body: notification.body,
          data: notification.data || {},
          sound: 'default',
        },
        trigger: null, // Send immediately
      });

      console.log('Notification sent:', notification.title);
    } catch (error) {
      console.error('Failed to send notification:', error);
    }
  }

  // Send expense reminder notification
  public async sendExpenseReminder(userId: string, expenseId: string, amount: number, category: string): Promise<void> {
    try {
      const preferences = await this.getUserPreferences(userId);
      if (!preferences.enabled || !preferences.expenseReminders) {
        return;
      }

      await this.sendNotification({
        id: `expense-reminder-${expenseId}`,
        title: '💰 Expense Reminder',
        body: `Don't forget to record your ${category} expense of $${amount.toFixed(2)}`,
        data: { type: 'expense-reminder', expenseId, amount, category },
      });
    } catch (error) {
      console.error('Failed to send expense reminder:', error);
    }
  }

  // Send weekly report notification
  public async sendWeeklyReportNotification(userId: string): Promise<void> {
    try {
      const preferences = await this.getUserPreferences(userId);
      if (!preferences.enabled || !preferences.weeklyReports) {
        return;
      }

      await this.sendNotification({
        id: `weekly-report-${userId}`,
        title: '📊 Weekly Expense Report',
        body: 'Your weekly expense summary is ready! Tap to view your spending insights.',
        data: { type: 'weekly-report', userId },
      });
    } catch (error) {
      console.error('Failed to send weekly report notification:', error);
    }
  }

  // Send monthly report notification
  public async sendMonthlyReportNotification(userId: string): Promise<void> {
    try {
      const preferences = await this.getUserPreferences(userId);
      if (!preferences.enabled || !preferences.monthlyReports) {
        return;
      }

      await this.sendNotification({
        id: `monthly-report-${userId}`,
        title: '📈 Monthly Expense Report',
        body: 'Your monthly expense summary is ready! Review your spending patterns.',
        data: { type: 'monthly-report', userId },
      });
    } catch (error) {
      console.error('Failed to send monthly report notification:', error);
    }
  }

  // Send low balance alert
  public async sendLowBalanceAlert(userId: string, currentBalance: number, threshold: number = 100): Promise<void> {
    try {
      const preferences = await this.getUserPreferences(userId);
      if (!preferences.enabled || !preferences.lowBalanceAlerts) {
        return;
      }

      if (currentBalance < threshold) {
        await this.sendNotification({
          id: `low-balance-${userId}`,
          title: '⚠️ Low Balance Alert',
          body: `Your balance is $${currentBalance.toFixed(2)}. Consider reviewing your expenses.`,
          data: { type: 'low-balance', userId, currentBalance, threshold },
        });
      }
    } catch (error) {
      console.error('Failed to send low balance alert:', error);
    }
  }

  // Send receipt scan reminder
  public async sendReceiptScanReminder(userId: string): Promise<void> {
    try {
      const preferences = await this.getUserPreferences(userId);
      if (!preferences.enabled || !preferences.receiptScanReminders) {
        return;
      }

      await this.sendNotification({
        id: `receipt-scan-${userId}`,
        title: '📷 Receipt Scan Reminder',
        body: 'Don\'t forget to scan your receipts to keep track of your expenses!',
        data: { type: 'receipt-scan-reminder', userId },
      });
    } catch (error) {
      console.error('Failed to send receipt scan reminder:', error);
    }
  }

  // Cancel specific notification
  public async cancelNotification(identifier: string): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(identifier);
      console.log('Notification cancelled:', identifier);
    } catch (error) {
      console.error('Failed to cancel notification:', error);
    }
  }

  // Cancel all scheduled notifications
  public async cancelAllNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      console.log('All notifications cancelled');
    } catch (error) {
      console.error('Failed to cancel all notifications:', error);
    }
  }

  // Get all scheduled notifications
  public async getScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
    try {
      return await Notifications.getAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Failed to get scheduled notifications:', error);
      return [];
    }
  }

  // Get push token
  public getPushToken(): string | null {
    return this.expoPushToken;
  }

  // Test notification (for development)
  public async sendTestNotification(): Promise<void> {
    await this.sendNotification({
      id: 'test-notification',
      title: '🧪 Test Notification',
      body: 'This is a test notification to verify the system is working!',
      data: { type: 'test' },
    });
  }
}

// Export singleton instance
export const notificationService = NotificationService.getInstance();
