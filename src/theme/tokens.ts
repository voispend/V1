// Design Tokens - Single source of truth for the entire app
// Based on 8pt grid system for consistent spacing

export const space = {
  // 8pt grid system: space(n) = n * 8
  0: 0,
  1: 8,
  2: 16,
  3: 24,
  4: 32,
  5: 40,
  6: 48,
  7: 56,
  8: 64,
  9: 72,
  10: 80,
  12: 96,
  16: 128,
  20: 160,
  24: 192,
  32: 256,
};

export const radius = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  pill: 999,
};

export const colors = {
  // Brand colors (emerald scale)
  brand: {
    50: '#ECFDF5',
    100: '#D1FAE5',
    200: '#A7F3D0',
    300: '#6EE7B7',
    400: '#34D399',
    500: '#10B981', // Primary brand
    600: '#059669',
    700: '#047857',
    800: '#065F46',
    900: '#064E3B',
  },
  
  // Gray scale
  gray: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
  },
  
  // Semantic colors
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
  
  // Surface colors
  surface: {
    primary: '#FFFFFF',
    secondary: '#F9FAFB',
    tertiary: '#F3F4F6',
  },
  
  // Background colors
  background: {
    primary: '#FFFFFF',
    secondary: '#F9FAFB',
    dark: '#1F2937',
  },
  
  // Text colors
  text: {
    primary: '#111827',
    secondary: '#374151',
    tertiary: '#6B7280',
    inverse: '#FFFFFF',
  },
};

export const shadows = {
  // Single shadow level for consistency
  default: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
};

export const typography = {
  // Title text: 28/34/700
  title: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '700' as const,
  },
  
  // Section titles: 20/26/700
  sectionTitle: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '700' as const,
  },
  
  // Body: 16/22/500
  body: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '500' as const,
  },
  
  // Body Bold: 16/22/600
  bodyBold: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '600' as const,
  },
  
  // Meta: 13/18/500
  meta: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500' as const,
  },
  
  // Large numbers for KPIs
  kpi: {
    fontSize: 40,
    lineHeight: 44,
    fontWeight: '800' as const,
  },
};

export const layout = {
  // Global screen padding
  screenPadding: 20,
  
  // Icon sizes (20-24 across the app)
  icon: {
    small: 20,
    medium: 24,
    large: 28,
  },
  
  // Component heights
  buttonHeight: 48,
  chipHeight: 40,
  inputHeight: 48,
  tabBarHeight: 64,
  
  // Card padding
  cardPadding: 16,
  
  // Section gaps
  sectionGap: 16,
  cardGap: 16,
};

// Helper function for consistent spacing
export const getSpace = (multiplier: number) => multiplier * 8;
