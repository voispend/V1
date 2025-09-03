import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'Voice-Based Expense Tracker',
  slug: 'voice-expense-tracker',
  version: '2.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'automatic',
  splash: {
    image: './assets/splash.png',
    resizeMode: 'contain',
    backgroundColor: '#10B981'
  },
  assetBundlePatterns: [
    '**/*'
  ],
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.voispend.expensetracker',
    buildNumber: '2.0.0',
    infoPlist: {
      NSCameraUsageDescription: 'This app uses the camera to scan receipts for expense tracking.',
      NSMicrophoneUsageDescription: 'This app uses the microphone to record voice notes for expense tracking.',
      NSPhotoLibraryUsageDescription: 'This app accesses your photo library to select receipt images.',
      NSFaceIDUsageDescription: 'This app uses Face ID for secure authentication.'
    }
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#10B981'
    },
    package: 'com.voispend.expensetracker',
    versionCode: 200,
    permissions: [
      'android.permission.CAMERA',
      'android.permission.RECORD_AUDIO',
      'android.permission.READ_EXTERNAL_STORAGE',
      'android.permission.WRITE_EXTERNAL_STORAGE',
      'android.permission.INTERNET',
      'android.permission.ACCESS_NETWORK_STATE'
    ]
  },
  web: {
    favicon: './assets/favicon.png',
    bundler: 'metro',
    output: 'static',
    build: {
      babel: {
        include: ['@expo/vector-icons']
      }
    }
  },
  plugins: [
    'expo-router',
    [
      'expo-av',
      {
        microphonePermission: 'Allow Voice-Based Expense Tracker to access your microphone to record voice notes.',
        cameraPermission: 'Allow Voice-Based Expense Tracker to access your camera to scan receipts.'
      }
    ],
    [
      'expo-image-picker',
      {
        photosPermission: 'Allow Voice-Based Expense Tracker to access your photo library to select receipt images.',
        cameraPermission: 'Allow Voice-Based Expense Tracker to access your camera to scan receipts.'
      }
    ],
    'sentry-expo'
  ],
  extra: {
    // Production environment variables
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    SENTRY_DSN: process.env.SENTRY_DSN,
    
    // Development overrides (for local testing)
    ...(process.env.NODE_ENV === 'development' && {
      EXPO_PUBLIC_SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL,
      EXPO_PUBLIC_SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
      EXPO_PUBLIC_OPENAI_API_KEY: process.env.EXPO_PUBLIC_OPENAI_API_KEY,
    }),
    
    // Build configuration
    eas: {
      projectId: process.env.EAS_PROJECT_ID || 'your-eas-project-id'
    }
  },
  experiments: {
    typedRoutes: true,
    tsconfigPaths: true
  }
});


