import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Platform, Modal, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useUser } from '../src/contexts/UserContext';
import { useAuth } from '../src/contexts/AuthContext';
import { useExpenses } from '../src/hooks/useExpenses';
import { useUserPreferences, CURRENCIES, LANGUAGES } from '../src/contexts/UserPreferencesContext';
import { useNavigation } from '../src/contexts/NavigationContext';
import { useNotifications } from '../src/contexts/NotificationContext';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import AppHeader from '../src/components/AppHeader';

import { ProfileEditModal } from '../src/components/ProfileEditModal';
import { useProfileForm } from '../src/hooks/useProfileForm';
import { SafeBoundary } from '../src/components/SafeBoundary';
import { colors, typography, space, layout } from '../src/theme/tokens';

export default function SettingsScreen() {
  const { user, updateUserProfile } = useUser();
  const { signOut } = useAuth();
  const { expenses } = useExpenses();
  const { preferences, updateCurrency, updateLanguage, updateTheme, toggleNotification, resetNotificationSettings } = useUserPreferences();
  const { navigateTo } = useNavigation();
  const { sendTestNotification, isInitialized, hasPermission } = useNotifications();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);
  const [showLanguagePicker, setShowLanguagePicker] = useState(false);
  const [showThemePicker, setShowThemePicker] = useState(false);
  const [showNotificationSettings, setShowNotificationSettings] = useState(false);
  const [showProfileEdit, setShowProfileEdit] = useState(false);
  const {
    profileForm,
    updateForm,
    resetForm,
    setFormData,
  } = useProfileForm({
    initialName: user?.name || '',
    initialEmail: user?.email || '',
  });

  // Update profile form when user data changes
  useEffect(() => {
    if (user) {
      setFormData(user.name || '', user.email || '');
    }
  }, [user, setFormData]);

  const handleLogout = async () => {
    try {
      setShowLogoutConfirm(false);
      await signOut();
      router.replace('/login');
    } catch (error) {
      console.error('Error signing out:', error);
      Alert.alert('Error', 'Failed to sign out');
    }
  };

  const handleProfileEdit = () => {
    resetForm(user?.name || '', user?.email || '');
    setShowProfileEdit(true);
  };

  const handleProfileSave = async () => {
    try {
      if (!profileForm.name.trim()) {
        Alert.alert('Error', 'Name is required');
        return;
      }
      
      await updateUserProfile({ name: profileForm.name.trim() });
      setShowProfileEdit(false);
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile');
    }
  };

  const exportToPdf = async () => {
    try {
      // Use HTML export for all platforms (mobile-friendly)
      await exportAsHtml();
    } catch (err) {
      console.error('Export error', err);
      Alert.alert('Error', 'Failed to export expenses');
    }
  };

  const exportAsHtml = async () => {
    try {
      const rows = expenses
        .map(
          (e) => `
          <tr>
            <td>${new Date(e.date || e.created_at).toLocaleDateString()}</td>
            <td>${e.description}</td>
            <td>${e.category}</td>
            <td style="text-align:right;">${preferences.currencySymbol}${(e.amount || 0).toFixed(2)}</td>
          </tr>`
        )
        .join('');

      const total = expenses.reduce((s, e) => s + (e.amount || 0), 0);
      const html = `
        <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <style>
            body { font-family: -apple-system, Helvetica, Arial; padding: 16px; }
            h1 { color: #0B6B53; }
            table { width: 100%; border-collapse: collapse; }
            th, td { padding: 8px; border-bottom: 1px solid #eee; font-size: 12px; }
            th { text-align: left; background: #E9FBF5; }
            .total { text-align: right; font-weight: 700; padding-top: 12px; }
          </style>
        </head>
        <body>
          <h1>Voispend — Expense Export</h1>
          <p>Date: ${new Date().toLocaleString()}</p>
          <p>User: ${user?.name || user?.email}</p>
          <p>Currency: ${preferences.currency} (${preferences.currencySymbol})</p>
          <table>
            <thead>
              <tr><th>Date</th><th>Description</th><th>Category</th><th style="text-align:right;">Amount</th></tr>
            </thead>
            <tbody>
              ${rows}
            </tbody>
          </table>
          <div class="total">Total: ${preferences.currencySymbol}${total.toFixed(2)}</div>
        </body>
        </html>`;

      if (Platform.OS === 'web') {
        // Create HTML file for download
        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `voispend-expenses-${user?.name || 'user'}-${new Date().toISOString().split('T')[0]}.html`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        Alert.alert('Success', 'Expenses exported as HTML file!');
      } else {
        // Mobile export using expo-print
        const file = await Print.printToFileAsync({ html });
        const uri = file.uri;
        
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(uri, { dialogTitle: 'Export Expenses.pdf' });
        } else if (Platform.OS === 'android') {
          const cUri = await FileSystem.getContentUriAsync(uri);
          await Sharing.shareAsync(cUri);
        } else {
          Alert.alert('Exported', `File saved to: ${uri}`);
        }
      }
    } catch (error) {
      console.error('HTML export error:', error);
      Alert.alert('Error', 'Failed to export expenses');
    }
  };

  const settingsGroups = [
    {
      title: 'Account',
      items: [
        {
          icon: 'person',
          label: 'Profile',
          value: user?.name,
          onPress: handleProfileEdit,
        },
      ]
    },
    {
      title: 'Preferences',
      items: [
        {
          icon: 'cash',
          label: 'Currency',
          value: `${preferences.currency} (${preferences.currencySymbol})`,
          onPress: () => setShowCurrencyPicker(true),
        },
        {
          icon: 'language',
          label: 'Language',
          value: LANGUAGES.find(l => l.code === preferences.language)?.name || 'English',
          onPress: () => setShowLanguagePicker(true),
        },
        {
          icon: 'color-palette',
          label: 'Theme',
          value: preferences.theme.charAt(0).toUpperCase() + preferences.theme.slice(1),
          onPress: () => setShowThemePicker(true),
        },
        {
          icon: 'notifications',
          label: 'Notifications',
          value: preferences.notifications?.enabled ? 'On' : 'Off',
          onPress: () => setShowNotificationSettings(true),
        },
      ]
    },
    {
      title: 'Data & Privacy',
      items: [
        {
          icon: 'download',
          label: 'Export Transactions (PDF)',
          value: '',
          onPress: exportToPdf,
        },
        {
          icon: 'shield-checkmark',
          label: 'Privacy Policy',
          value: '',
          onPress: () => navigateTo('settings/privacy'),
        },
      ]
    },
    {
      title: 'Support',
      items: [
        {
          icon: 'help-circle',
          label: 'Help & FAQ',
          value: '',
          onPress: () => navigateTo('settings/faq'),
        },
      ]
    }
  ];

  return (
    <SafeBoundary>
      <>
        {/* Fixed Header */}
        <AppHeader title="Settings" />
        
        {/* Scrollable Content */}
        <ScrollView style={styles.content}>
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.profileContent}>
            <View style={styles.avatarContainer}>
              <Text style={styles.avatarEmoji}>✨</Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{user?.name}</Text>
              <Text style={styles.profileEmail}>{user?.email}</Text>
            </View>
          </View>
          
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{expenses.length}</Text>
              <Text style={styles.statLabel}>Expenses</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{new Set(expenses.map(e => e.category)).size}</Text>
              <Text style={styles.statLabel}>Categories</Text>
            </View>
          </View>
        </View>

        {/* Settings Groups */}
        {settingsGroups.map((group, groupIndex) => (
          <View key={group.title} style={styles.settingsGroup}>
            <Text style={styles.groupTitle}>{group.title}</Text>
            
            <View style={styles.groupContainer}>
              {group.items.map((item, index) => (
                <TouchableOpacity
                  key={item.label}
                  style={[
                    styles.settingItem,
                    index !== group.items.length - 1 && styles.settingItemBorder
                  ]}
                  onPress={item.onPress}
                  accessibilityLabel={item.label}
                  accessibilityRole="button"
                >
                  <View style={styles.settingLeft}>
                    <View style={styles.settingIconContainer}>
                      <Ionicons 
                        name={item.icon as any} 
                        size={20} 
                        color="#6B7280" 
                      />
                    </View>
                    <View style={styles.settingTextContainer}>
                      <Text style={styles.settingLabel}>{item.label}</Text>
                      {item.value && (
                        <Text style={styles.settingValue}>{item.value}</Text>
                      )}
                    </View>
                  </View>
                  
                  <View style={styles.settingRight}>
                    <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        {/* Logout Button */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={() => setShowLogoutConfirm(true)}
          accessibilityLabel="Sign out of account"
          accessibilityRole="button"
        >
          <Ionicons name="log-out" size={20} color="#EF4444" />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Profile Edit Modal */}
      <ProfileEditModal
        visible={showProfileEdit}
        profileForm={profileForm}
        onFormChange={(field, value) => updateForm({ [field]: value })}
        onSave={handleProfileSave}
        onClose={() => setShowProfileEdit(false)}
      />

      {/* Logout Confirmation */}
      {showLogoutConfirm && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <View style={styles.modalIconContainer}>
                <Ionicons name="log-out" size={32} color="#EF4444" />
              </View>
              <Text style={styles.modalTitle}>Sign Out?</Text>
              <Text style={styles.modalMessage}>
                You'll need to sign in again to access your expenses.
              </Text>
            </View>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowLogoutConfirm(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalConfirmButton}
                onPress={handleLogout}
              >
                <Text style={styles.modalConfirmText}>Sign Out</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Currency Picker Modal */}
      <Modal visible={showCurrencyPicker} animationType="slide" transparent onRequestClose={() => setShowCurrencyPicker(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Currency</Text>
            </View>
            <ScrollView style={{ maxHeight: 400 }}>
              {CURRENCIES.map(currency => (
                <Pressable 
                  key={currency.code} 
                  style={styles.pickerRow} 
                  onPress={() => {
                    updateCurrency(currency.code);
                    setShowCurrencyPicker(false);
                  }}
                >
                  <Text style={styles.pickerCode}>{currency.code}</Text>
                  <Text style={styles.pickerSymbol}>{currency.symbol}</Text>
                  <Text style={styles.pickerName}>{currency.name}</Text>
                  {preferences.currency === currency.code && (
                    <Ionicons name="checkmark" size={20} color="#10B981" />
                  )}
                </Pressable>
              ))}
            </ScrollView>
            <TouchableOpacity 
              style={styles.modalCancelButton} 
              onPress={() => setShowCurrencyPicker(false)}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Language Picker Modal */}
      <Modal visible={showLanguagePicker} animationType="slide" transparent onRequestClose={() => setShowLanguagePicker(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Language</Text>
            </View>
            <ScrollView style={{ maxHeight: 400 }}>
              {LANGUAGES.map(language => (
                <Pressable 
                  key={language.code} 
                  style={styles.pickerRow} 
                  onPress={() => {
                    updateLanguage(language.code);
                    setShowLanguagePicker(false);
                  }}
                >
                  <Text style={styles.pickerFlag}>{language.flag}</Text>
                  <Text style={styles.pickerName}>{language.name}</Text>
                  {preferences.language === language.code && (
                    <Ionicons name="checkmark" size={20} color="#10B981" />
                  )}
                </Pressable>
              ))}
            </ScrollView>
            <TouchableOpacity 
              style={styles.modalCancelButton} 
              onPress={() => setShowLanguagePicker(false)}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Theme Picker Modal */}
      <Modal visible={showThemePicker} animationType="slide" transparent onRequestClose={() => setShowThemePicker(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Theme</Text>
            </View>
            <View style={{ paddingVertical: 16 }}>
              {[
                { value: 'light', label: 'Light', icon: 'sunny' },
                { value: 'dark', label: 'Dark', icon: 'moon' },
                { value: 'auto', label: 'Auto', icon: 'contrast' },
              ].map(theme => (
                <Pressable 
                  key={theme.value} 
                  style={styles.pickerRow} 
                  onPress={() => {
                    updateTheme(theme.value as 'light' | 'dark' | 'auto');
                    setShowThemePicker(false);
                  }}
                >
                  <Ionicons name={theme.icon as any} size={20} color="#6B7280" />
                  <Text style={styles.pickerName}>{theme.label}</Text>
                  {preferences.theme === theme.value && (
                    <Ionicons name="checkmark" size={20} color="#10B981" />
                  )}
                </Pressable>
              ))}
            </View>
            <TouchableOpacity 
              style={styles.modalCancelButton} 
              onPress={() => setShowThemePicker(false)}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Notification Settings Modal */}
      <Modal visible={showNotificationSettings} animationType="slide" transparent onRequestClose={() => setShowNotificationSettings(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Notification Settings</Text>
            </View>
            
            {/* Master Toggle */}
            <View style={styles.notificationSection}>
              <View style={styles.notificationRow}>
                <View style={styles.notificationInfo}>
                  <Ionicons name="notifications" size={20} color="#6B7280" />
                  <Text style={styles.notificationLabel}>Enable Notifications</Text>
                </View>
                <TouchableOpacity
                  style={[styles.toggleSwitch, preferences.notifications?.enabled && styles.toggleSwitchActive]}
                  onPress={() => toggleNotification('enabled')}
                >
                  <View style={[styles.toggleThumb, preferences.notifications?.enabled && styles.toggleThumbActive]} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Notification Types */}
            {preferences.notifications?.enabled && (
              <View style={styles.notificationSection}>
                <Text style={styles.notificationSectionTitle}>Notification Types</Text>
                
                <View style={styles.notificationRow}>
                  <View style={styles.notificationInfo}>
                    <Ionicons name="calendar" size={20} color="#6B7280" />
                    <Text style={styles.notificationLabel}>Expense Reminders</Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.toggleSwitch, preferences.notifications?.expenseReminders && styles.toggleSwitchActive]}
                    onPress={() => toggleNotification('expenseReminders')}
                  >
                    <View style={[styles.toggleThumb, preferences.notifications?.expenseReminders && styles.toggleThumbActive]} />
                  </TouchableOpacity>
                </View>

                <View style={styles.notificationRow}>
                  <View style={styles.notificationInfo}>
                    <Ionicons name="bar-chart" size={20} color="#6B7280" />
                    <Text style={styles.notificationLabel}>Weekly Reports</Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.toggleSwitch, preferences.notifications?.weeklyReports && styles.toggleSwitchActive]}
                    onPress={() => toggleNotification('weeklyReports')}
                  >
                    <View style={[styles.toggleThumb, preferences.notifications?.weeklyReports && styles.toggleThumbActive]} />
                  </TouchableOpacity>
                </View>

                <View style={styles.notificationRow}>
                  <View style={styles.notificationInfo}>
                    <Ionicons name="trending-up" size={20} color="#6B7280" />
                    <Text style={styles.notificationLabel}>Monthly Reports</Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.toggleSwitch, preferences.notifications?.monthlyReports && styles.toggleSwitchActive]}
                    onPress={() => toggleNotification('monthlyReports')}
                  >
                    <View style={[styles.toggleThumb, preferences.notifications?.monthlyReports && styles.toggleThumbActive]} />
                  </TouchableOpacity>
                </View>

                <View style={styles.notificationRow}>
                  <View style={styles.notificationInfo}>
                    <Ionicons name="warning" size={20} color="#6B7280" />
                    <Text style={styles.notificationLabel}>Low Balance Alerts</Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.toggleSwitch, preferences.notifications?.lowBalanceAlerts && styles.toggleSwitchActive]}
                    onPress={() => toggleNotification('lowBalanceAlerts')}
                  >
                    <View style={[styles.toggleThumb, preferences.notifications?.lowBalanceAlerts && styles.toggleThumbActive]} />
                  </TouchableOpacity>
                </View>

                <View style={styles.notificationRow}>
                  <View style={styles.notificationInfo}>
                    <Ionicons name="camera" size={20} color="#6B7280" />
                    <Text style={styles.notificationLabel}>Receipt Scan Reminders</Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.toggleSwitch, preferences.notifications?.receiptScanReminders && styles.toggleSwitchActive]}
                    onPress={() => toggleNotification('receiptScanReminders')}
                  >
                    <View style={[styles.toggleThumb, preferences.notifications?.receiptScanReminders && styles.toggleThumbActive]} />
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Test Notification Button */}
            <View style={styles.notificationSection}>
              <TouchableOpacity 
                style={styles.testButton} 
                onPress={async () => {
                  try {
                    await sendTestNotification();
                    Alert.alert('Success', 'Test notification sent! Check your device notifications.');
                  } catch (error) {
                    Alert.alert('Error', 'Failed to send test notification');
                  }
                }}
                disabled={!isInitialized || !hasPermission}
              >
                <Ionicons name="notifications" size={20} color="#10B981" />
                <Text style={styles.testButtonText}>Send Test Notification</Text>
              </TouchableOpacity>
            </View>

            {/* Reset Button */}
            <View style={styles.notificationSection}>
              <TouchableOpacity 
                style={styles.resetButton} 
                onPress={() => {
                  resetNotificationSettings();
                  // Close modal after reset
                  setTimeout(() => setShowNotificationSettings(false), 500);
                }}
              >
                <Ionicons name="refresh" size={20} color="#EF4444" />
                <Text style={styles.resetButtonText}>Reset to Defaults</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity 
              style={styles.modalCancelButton} 
              onPress={() => setShowNotificationSettings(false)}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
        </>
      </SafeBoundary>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    paddingTop: 16, // Add top padding since header is now fixed
    paddingBottom: 20,
    width: '100%',
  },
  profileCard: {
    backgroundColor: '#8B5CF6',
    margin: 8,
    padding: 12,
    borderRadius: 12,
  },
  profileContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarContainer: {
    width: 64,
    height: 64,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  avatarEmoji: {
    fontSize: 32,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  statLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  settingsGroup: {
    marginBottom: 24,
  },
  groupTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
    paddingHorizontal: 24,
  },
  groupContainer: {
    backgroundColor: 'white',
    marginHorizontal: 8,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  settingItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIconContainer: {
    width: 40,
    height: 40,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  settingTextContainer: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
  },
  settingValue: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  settingRight: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    marginHorizontal: 8,
    marginBottom: 12,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#EF4444',
    marginLeft: 8,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  modalContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 320,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  modalIconContainer: {
    width: 64,
    height: 64,
    backgroundColor: '#FEF2F2',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  modalMessage: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  modalContent: {
    marginVertical: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1F2937',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
  },
  modalConfirmButton: {
    flex: 1,
    backgroundColor: '#EF4444',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalConfirmText: {
    fontSize: 16,
    fontWeight: '500',
    color: 'white',
  },
  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  pickerCode: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    width: 60,
  },
  pickerSymbol: {
    fontSize: 16,
    fontWeight: '600',
    color: '#10B981',
    width: 40,
    textAlign: 'center',
  },
  pickerName: {
    fontSize: 16,
    color: '#6B7280',
    flex: 1,
    marginLeft: 12,
  },
  pickerFlag: {
    fontSize: 20,
    marginRight: 12,
  },
  // Notification styles
  notificationSection: {
    marginBottom: 24,
  },
  notificationSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  notificationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  notificationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  notificationLabel: {
    fontSize: 16,
    color: '#374151',
    marginLeft: 12,
  },
  toggleSwitch: {
    width: 51,
    height: 31,
    backgroundColor: '#E5E7EB',
    borderRadius: 16,
    padding: 2,
    justifyContent: 'center',
  },
  toggleSwitchActive: {
    backgroundColor: '#10B981',
  },
  toggleThumb: {
    width: 27,
    height: 27,
    backgroundColor: 'white',
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 3.84,
    elevation: 5,
  },
  toggleThumbActive: {
    transform: [{ translateX: 20 }],
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    marginTop: 16,
  },
  resetButtonText: {
    fontSize: 16,
    color: '#EF4444',
    marginLeft: 8,
    fontWeight: '600',
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    marginTop: 16,
    marginBottom: 8,
  },
  testButtonText: {
    fontSize: 16,
    color: '#10B981',
    marginLeft: 8,
    fontWeight: '600',
  },
});