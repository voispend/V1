import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface SafeBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface SafeBoundaryState {
  hasError: boolean;
  error?: Error;
}

/**
 * Safe error boundary that shows a friendly fallback
 * Does not alter UI layout unless an error actually occurs
 */
export class SafeBoundary extends React.Component<SafeBoundaryProps, SafeBoundaryState> {
  constructor(props: SafeBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): SafeBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error for debugging (dev only)
    if (__DEV__) {
      console.error('SafeBoundary caught error:', error, errorInfo);
    }
    
    // TODO: Send to Sentry if available
    // if (Sentry) {
    //   Sentry.captureException(error, { extra: errorInfo });
    // }
  }

  render() {
    if (this.state.hasError) {
      // Show fallback or default error UI
      if (this.props.fallback) {
        return this.props.fallback;
      }
      
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Something went wrong.</Text>
          <Text style={styles.errorSubtext}>Please try again later.</Text>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  errorContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    margin: 16,
  },
  errorText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#DC2626',
    marginBottom: 4,
  },
  errorSubtext: {
    fontSize: 14,
    color: '#6B7280',
  },
});
