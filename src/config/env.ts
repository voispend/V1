// Environment configuration for both Expo and Vite
import Constants from 'expo-constants';

// Debug: Log what we're getting from expo-constants
console.log('🔍 Expo Constants Debug:', {
  expoConfig: Constants.expoConfig?.extra,
  hasExpoConfig: !!Constants.expoConfig,
  hasExtra: !!Constants.expoConfig?.extra
});

// Helper function to get the appropriate API base URL
const getApiBaseUrl = () => {
  // Use environment variables from Expo config
  return Constants.expoConfig?.extra?.API_BASE_URL || 
         Constants.expoConfig?.extra?.EXPO_PUBLIC_API_BASE_URL;
};

export const ENV = {
  // Supabase configuration
  SUPABASE_URL: Constants.expoConfig?.extra?.SUPABASE_URL || 
                Constants.expoConfig?.extra?.EXPO_PUBLIC_SUPABASE_URL,
  SUPABASE_ANON_KEY: Constants.expoConfig?.extra?.SUPABASE_ANON_KEY || 
                     Constants.expoConfig?.extra?.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  
  // OpenAI configuration
  OPENAI_API_KEY: Constants.expoConfig?.extra?.OPENAI_API_KEY || 
                  Constants.expoConfig?.extra?.EXPO_PUBLIC_OPENAI_API_KEY,
  
  // Backend API configuration
  API_BASE_URL: getApiBaseUrl(),
};

// Validate required environment variables
export const validateEnv = () => {
  const required = ['SUPABASE_URL', 'SUPABASE_ANON_KEY'];
  const missing = required.filter(key => !ENV[key as keyof typeof ENV]);
  
  if (missing.length > 0) {
    console.warn(`Missing environment variables: ${missing.join(', ')}`);
    return false;
  }
  
  return true;
};

// Check if we're in development mode
export const isDevelopment = __DEV__;

// Check if we're running on web
export const isWeb = typeof window !== 'undefined';

// Check if we're running on mobile
export const isMobile = !isWeb;

// Log environment status in development
if (isDevelopment) {
  console.log('🌍 Environment Configuration:', {
    SUPABASE_URL: ENV.SUPABASE_URL ? '✅ Configured' : '❌ Missing',
    SUPABASE_ANON_KEY: ENV.SUPABASE_ANON_KEY ? '✅ Configured' : '❌ Missing',
    OPENAI_API_KEY: ENV.OPENAI_API_KEY ? '✅ Configured' : '❌ Missing',
    API_BASE_URL: ENV.API_BASE_URL ? '✅ Configured' : '❌ Missing',
  });
  
  console.log('🔑 Actual Values:', {
    SUPABASE_URL: ENV.SUPABASE_URL,
    SUPABASE_ANON_KEY: ENV.SUPABASE_ANON_KEY ? `${ENV.SUPABASE_ANON_KEY.substring(0, 20)}...` : 'MISSING',
    API_BASE_URL: ENV.API_BASE_URL,
  });
  
  // Log the platform-specific API URL
  console.log('🔗 Final API_BASE_URL for receipt parsing:', ENV.API_BASE_URL);
}
