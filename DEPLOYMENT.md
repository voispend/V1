# 🚀 Production Deployment Guide

## Overview
This guide covers deploying the Voice-Based Expense Tracker app to production, including both the mobile app and backend services.

## 📱 Mobile App Deployment

### Prerequisites
- [EAS CLI](https://docs.expo.dev/build/setup/) installed and configured
- [Expo account](https://expo.dev/signup) with appropriate permissions
- [Apple Developer Account](https://developer.apple.com/) (for iOS)
- [Google Play Console](https://play.google.com/console/) (for Android)

### 1. Environment Setup

#### Production Environment Variables
Create a `.env.production` file in the root directory:
```bash
# Supabase Configuration
SUPABASE_URL=https://nnhurpzfefzgirhzzjcg.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key

# OpenAI Configuration
OPENAI_API_KEY=your-openai-api-key

# Build Configuration
NODE_ENV=production
EAS_PROJECT_ID=your-eas-project-id
```

#### Update app.config.ts
Ensure your `app.config.ts` has production settings:
```typescript
export default ({ config }: ConfigContext): ExpoConfig => ({
  name: 'Voice-Based Expense Tracker',
  slug: 'voice-expense-tracker',
  version: '2.0.0',
  // ... other configuration
});
```

### 2. Build Configuration

#### EAS Build Setup
```bash
# Install EAS CLI
npm install -g @expo/eas-cli

# Login to Expo
eas login

# Configure EAS Build
eas build:configure

# Update eas.json with your project details
```

#### Build Commands
```bash
# Development build (for testing)
eas build --profile development --platform ios
eas build --profile development --platform android

# Preview build (for internal testing)
eas build --profile preview --platform ios
eas build --profile preview --platform android

# Production build
eas build --profile production --platform ios
eas build --profile production --platform android
```

### 3. App Store Submission

#### iOS App Store
```bash
# Submit to App Store Connect
eas submit --profile production --platform ios

# Or manually upload via Xcode
```

#### Google Play Store
```bash
# Submit to Google Play Console
eas submit --profile production --platform android

# Or manually upload via Google Play Console
```

## 🔧 Backend Deployment (Supabase)

### 1. Edge Functions

#### Deploy Receipt Parsing Function
```bash
# Navigate to Supabase functions directory
cd supabase/functions

# Deploy function
supabase functions deploy receipt-parse-public --project-ref nnhurpzfefzgirhzzjcg
```

#### Function Configuration
The `receipt-parse-public` function includes:
- ✅ Rate limiting (10 requests per minute)
- ✅ Input validation
- ✅ Error handling
- ✅ CORS support
- ✅ Health check endpoint

### 2. Database Setup

#### Row Level Security (RLS)
Ensure RLS policies are enabled for production:

```sql
-- Enable RLS on expenses table
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- Policy for users to see only their expenses
CREATE POLICY "Users can view own expenses" ON expenses
  FOR SELECT USING (auth.uid() = user_id);

-- Policy for users to insert their own expenses
CREATE POLICY "Users can insert own expenses" ON expenses
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy for users to update their own expenses
CREATE POLICY "Users can update own expenses" ON expenses
  FOR UPDATE USING (auth.uid() = user_id);

-- Policy for users to delete their own expenses
CREATE POLICY "Users can delete own expenses" ON expenses
  FOR DELETE USING (auth.uid() = user_id);
```

#### Database Migrations
```bash
# Apply database migrations
supabase db push --project-ref nnhurpzfefzgirhzzjcg
```

### 3. Environment Variables

#### Supabase Secrets
```bash
# Set OpenAI API key
supabase secrets set OPENAI_API_KEY=your-openai-api-key --project-ref nnhurpzfefzgirhzzjcg

# Verify secrets
supabase secrets list --project-ref nnhurpzfefzgirhzzjcg
```

## 🔒 Security Configuration

### 1. Authentication
- ✅ Supabase Auth enabled
- ✅ Email confirmation required
- ✅ Password strength requirements
- ✅ Session management

### 2. API Security
- ✅ Rate limiting on Edge Functions
- ✅ CORS properly configured
- ✅ Input validation
- ✅ Error message sanitization

### 3. Data Protection
- ✅ Row Level Security (RLS) enabled
- ✅ User data isolation
- ✅ Secure API keys storage

## 📊 Monitoring & Analytics

### 1. Supabase Dashboard
- Monitor Edge Function performance
- Track database usage
- View authentication metrics
- Monitor API rate limits

### 2. App Performance
- EAS Build analytics
- App Store Connect metrics
- Google Play Console analytics
- Crash reporting (Sentry integration)

## 🚨 Production Checklist

### Before Deployment
- [ ] Environment variables configured
- [ ] Edge Functions deployed and tested
- [ ] Database migrations applied
- [ ] RLS policies configured
- [ ] Rate limiting tested
- [ ] Error handling verified
- [ ] CORS configuration tested

### After Deployment
- [ ] Health check endpoints responding
- [ ] Receipt parsing working
- [ ] Voice recording functional
- [ ] Authentication working
- [ ] Data persistence verified
- [ ] Performance metrics monitored
- [ ] Error logs reviewed

## 🔄 Update Process

### 1. Code Updates
```bash
# Pull latest changes
git pull origin main

# Install dependencies
npm install

# Test locally
npm start
```

### 2. Function Updates
```bash
# Deploy updated Edge Functions
supabase functions deploy receipt-parse-public --project-ref nnhurpzfefzgirhzzjcg
```

### 3. App Updates
```bash
# Build new version
eas build --profile production --platform all

# Submit to stores
eas submit --profile production --platform all
```

## 📞 Support & Troubleshooting

### Common Issues
1. **Edge Function Timeout**: Check OpenAI API response times
2. **Rate Limiting**: Monitor client request patterns
3. **Authentication Errors**: Verify Supabase configuration
4. **Build Failures**: Check EAS build logs

### Resources
- [Expo Documentation](https://docs.expo.dev/)
- [Supabase Documentation](https://supabase.com/docs)
- [EAS Build Documentation](https://docs.expo.dev/build/)
- [App Store Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [Google Play Policies](https://play.google.com/about/developer-content-policy/)

## 🎯 Performance Optimization

### 1. Edge Functions
- Use gpt-4o-mini for cost optimization
- Implement proper caching
- Monitor execution times

### 2. Mobile App
- Optimize image sizes
- Implement lazy loading
- Use appropriate build profiles

### 3. Database
- Monitor query performance
- Implement proper indexing
- Use connection pooling

---

**Last Updated**: September 2, 2025  
**Version**: 2.0.0  
**Maintainer**: Development Team
