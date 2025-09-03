import { View, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from '../src/contexts/AuthContext';
import { ThemeProvider } from '../src/contexts/ThemeContext';
import { UserProvider } from '../src/contexts/UserContext';
import { LanguageProvider } from '../src/contexts/LanguageContext';
import { UserPreferencesProvider } from '../src/contexts/UserPreferencesContext';
import { NotificationProvider } from '../src/contexts/NotificationContext';
import { NavigationProvider, useNavigation } from '../src/contexts/NavigationContext';
import AppLayout from '../src/components/AppLayout';
import HomeScreen from './index';
import RecordScreen from './record';
import ReportsScreen from './reports';
import ExpensesScreen from './expenses';
import SettingsScreen from './settings';
import PrivacyScreen from './settings/privacy';
import FAQScreen from './settings/faq';
import LoginScreen from './login';

import 'react-native-url-polyfill/auto';
import 'react-native-get-random-values';
import '../src/config/sentry'; // Initialize Sentry

function AppContent() {
  const { user, loading } = useAuth();
  const { currentScreen, currentParams } = useNavigation();

  // Show loading or auth screens
  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar style="light" />
        {/* Loading screen */}
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.container}>
        <StatusBar style="light" />
        <LoginScreen />
      </View>
    );
  }

  // Render the appropriate screen based on currentScreen
  const renderScreen = () => {
    console.log('🔍 Layout renderScreen:', { 
      currentScreen, 
      currentParams
    });
    
    switch (currentScreen) {
      case 'home':
        return <HomeScreen />;
      case 'record':
        return <RecordScreen />;
      case 'reports':
        return <ReportsScreen />;
      case 'expenses':
        return <ExpensesScreen />;
      case 'settings':
        return <SettingsScreen />;
      case 'settings/privacy':
        return <PrivacyScreen />;
      case 'settings/faq':
        return <FAQScreen />;
      default:
        return <HomeScreen />;
    }
  };

  return (
    <AppLayout>
      {renderScreen()}
    </AppLayout>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <LanguageProvider>
          <AuthProvider>
            <UserPreferencesProvider>
              <NotificationProvider>
                <UserProvider>
                  <NavigationProvider>
                    <AppContent />
                    <StatusBar style="light" />
                  </NavigationProvider>
                </UserProvider>
              </NotificationProvider>
            </UserPreferencesProvider>
          </AuthProvider>
        </LanguageProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
});