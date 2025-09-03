import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, StatusBar, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '../contexts/NavigationContext';
import { useTheme } from '../contexts/ThemeContext';

const { width, height } = Dimensions.get('window');

interface AppLayoutProps {
  children: React.ReactNode;
  title?: string;
  showBackButton?: boolean;
  showBottomNav?: boolean;
  onBackPress?: () => void;
}

export default function AppLayout({ 
  children, 
  title, 
  showBackButton = false, 
  showBottomNav = true,
  onBackPress 
}: AppLayoutProps) {
  const { currentScreen, navigateTo, goBack } = useNavigation();
  const { isDark } = useTheme();

  const handleBackPress = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      goBack();
    }
  };

  // Get screen title based on current screen
  const getScreenTitle = (screen: string): string => {
    switch (screen) {
      case 'home':
        return 'Home';
      case 'record':
        return 'Record';
      case 'reports':
        return 'Reports';
      case 'expenses':
        return 'Expenses';
      case 'expense':
        return 'Expense Details';
      case 'settings':
        return 'Settings';
      default:
        return 'App';
    }
  };

  // Bottom navigation items
  const navItems = [
    { key: 'home', label: 'Home', icon: 'home', path: '/' },
    { key: 'record', label: 'Record', icon: 'mic', path: '/record' },
    { key: 'reports', label: 'Reports', icon: 'bar-chart', path: '/reports' },
    { key: 'expenses', label: 'Expenses', icon: 'wallet', path: '/expenses' },
    { key: 'settings', label: 'Settings', icon: 'settings', path: '/settings' },
  ];

  const handleNavigation = (path: string) => {
    let targetScreen: string;
    
    if (path === '/') {
      targetScreen = 'home';
    } else {
      targetScreen = path.substring(1); // Remove leading slash
    }
    
    // Normalize current screen for comparison (remove leading slash if present)
    const normalizedCurrentScreen = currentScreen.startsWith('/') ? currentScreen.substring(1) : currentScreen;
    
    console.log('🔍 Navigation attempt:', {
      path,
      targetScreen,
      currentScreen,
      normalizedCurrentScreen,
      willNavigate: targetScreen && normalizedCurrentScreen !== targetScreen
    });
    
    if (targetScreen && normalizedCurrentScreen !== targetScreen) {
      console.log('✅ Navigating to:', targetScreen, 'from:', normalizedCurrentScreen);
      navigateTo(targetScreen);
    } else {
      console.log('⏭️ Navigation skipped - same screen or invalid target');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#1F2937' : '#F9FAFB' }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={isDark ? '#1F2937' : '#10B981'} />

      {/* Main Content */}
      <View style={styles.content}>
        {children}
      </View>

      {/* Bottom Navigation */}
      {showBottomNav && (
        <View style={[styles.bottomNav, { backgroundColor: isDark ? '#374151' : '#FFFFFF' }]}>
          {navItems.map((item) => (
            <TouchableOpacity
              key={item.key}
              style={[
                styles.navItem,
                (currentScreen === item.key || currentScreen === `/${item.key}`) && styles.activeNavItem
              ]}
              onPress={() => handleNavigation(item.path)}
            >
              <Ionicons
                name={item.icon as any}
                size={24}
                color={(currentScreen === item.key || currentScreen === `/${item.key}`) ? '#10B981' : isDark ? '#9CA3AF' : '#6B7280'}
              />
              <Text
                style={[
                  styles.navLabel,
                  (currentScreen === item.key || currentScreen === `/${item.key}`) && styles.activeNavLabel
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 50 : 16,
    paddingBottom: 16,
    paddingHorizontal: 16,
    backgroundColor: '#10B981',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40, // Same width as back button for proper centering
  },
  content: {
    flex: 1,
    width: '100%',
  },
  bottomNav: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingBottom: 20, // Account for home indicator
    width: '100%',
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    justifyContent: 'center',
  },
  activeNavItem: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: 12,
  },
  navLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
  },
  activeNavLabel: {
    color: '#10B981',
  },
});
