/**
 * Sentry configuration for error monitoring
 * Only initializes when SENTRY_DSN environment variable is set
 */

import * as Sentry from 'sentry-expo';
import Constants from 'expo-constants';

// Get Sentry DSN from environment
const SENTRY_DSN = Constants.expoConfig?.extra?.SENTRY_DSN || process.env.SENTRY_DSN;

// Initialize Sentry only if DSN is available
if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    debug: __DEV__, // Enable debug mode only in development
    
    // Release tracking
    release: Constants.expoConfig?.version || 'unknown',
    environment: __DEV__ ? 'development' : 'production',
    
    // Performance monitoring
    tracesSampleRate: __DEV__ ? 1.0 : 0.1,
    
    // Error sampling
    // Note: Replay features not available in sentry-expo
    
    // Integrations
    integrations: [
      // Add any additional integrations here
    ],
    
    // Before send hook to filter sensitive data
    beforeSend(event) {
      // Remove sensitive information from error events
      if (event.request?.headers) {
        delete event.request.headers.authorization;
        delete event.request.headers['x-api-key'];
      }
      
      // Remove PII from error messages
      if (event.message) {
        event.message = event.message.replace(/password|token|key|secret/gi, '[REDACTED]');
      }
      
      return event;
    },
  });
  
  console.log('✅ Sentry initialized successfully');
} else {
  console.log('ℹ️ Sentry DSN not found, error monitoring disabled');
}

export { Sentry };
