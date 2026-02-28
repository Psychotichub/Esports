# 4psychotic Mobile App - Deployment Guide

## Overview

This guide covers deploying the 4psychotic React Native app to web, iOS, and Android platforms.

## Web Deployment

### Option 1: Vercel (Recommended)

```bash
# Install Vercel CLI
npm install -g vercel

# Build the app
npm run build

# Deploy
vercel --prod
```

### Option 2: Netlify

```bash
# Build the app
npm run build

# Deploy
netlify deploy --prod --dir=dist
```

### Option 3: Self-hosted

```bash
# Build the app
npm run build

# Upload dist/ folder to your server
scp -r dist/* user@server:/var/www/4psychotic
```

## iOS Deployment

### Prerequisites

- macOS with Xcode installed
- Apple Developer Account ($99/year)
- Expo Account (free)

### Steps

1. **Configure EAS**
```bash
npm install -g eas-cli
eas build:configure
```

2. **Build for iOS**
```bash
eas build --platform ios --profile production
```

3. **Download Build**
- Check build status: `eas build:list`
- Download .ipa file from Expo dashboard

4. **Submit to App Store**
- Open App Store Connect
- Create new app
- Upload .ipa using Transporter
- Fill in app details, screenshots, description
- Submit for review

### App Store Requirements

- App name: "4psychotic"
- Bundle ID: `com.psychotic.mobile`
- Category: Entertainment
- Privacy Policy: Required
- Screenshots: 2-5 per device type
- Description: 160 characters max

## Android Deployment

### Prerequisites

- Android SDK installed
- Google Play Developer Account ($25 one-time)
- Expo Account (free)

### Steps

1. **Build for Android**
```bash
eas build --platform android --profile production
```

2. **Download Build**
- Check build status: `eas build:list`
- Download .aab (Android App Bundle) file

3. **Submit to Google Play**
- Open Google Play Console
- Create new app
- Upload .aab file
- Fill in app details, screenshots, description
- Submit for review

### Google Play Requirements

- App name: "4psychotic"
- Package name: `com.psychotic.mobile`
- Category: Games > Entertainment
- Content rating: Required
- Privacy policy: Required
- Screenshots: 2-8 per device type
- Description: 4000 characters max
- Promotional graphic: 1024x500px

## Over-the-Air Updates

Enable instant updates without app store resubmission:

```bash
# Create update
eas update --branch production

# Publish update
eas update --branch production --message "Bug fixes and improvements"
```

## Environment Configuration

### Production .env

```
EXPO_PUBLIC_API_URL=https://4psychotic-api.example.com
EXPO_PUBLIC_YOUTUBE_CHANNEL_ID=UCxxxxxxxxxxxxxx
```

### Secrets Management

Store sensitive data in Expo secrets:

```bash
eas secret:create YOUTUBE_API_KEY
eas secret:create CONTACT_EMAIL
```

## Monitoring & Analytics

### Crash Reporting

```bash
npm install @sentry/react-native
```

### Analytics

```bash
npm install expo-analytics
```

## Performance Optimization

### Bundle Size

```bash
# Analyze bundle
npm run build -- --analyze

# Optimize
npm install --save-dev metro-visualizer
```

### Code Splitting

Already configured in Expo - no additional setup needed.

## Troubleshooting

### Build Failures

```bash
# Clear cache
eas build --platform ios --clear-cache

# Check logs
eas build:view --id <build-id>
```

### App Crashes

1. Check Sentry dashboard for crash reports
2. Review device logs: `adb logcat` (Android)
3. Review Xcode console (iOS)

### Slow Performance

1. Profile with React DevTools
2. Check network requests
3. Optimize images and assets
4. Use React.memo for expensive components

## Rollback Procedures

### Web
```bash
# Revert to previous deployment
vercel rollback
```

### iOS/Android
- Use Expo Updates to rollback to previous version
- Or resubmit previous build to app stores

## Monitoring Checklist

- [ ] App loads without errors
- [ ] All screens render correctly
- [ ] Navigation works smoothly
- [ ] YouTube API integration functional
- [ ] Contact form submits successfully
- [ ] Performance acceptable (< 3s load time)
- [ ] Crashes reported to Sentry
- [ ] Analytics tracking active

## Support

For deployment issues:
- Expo Docs: https://docs.expo.dev
- React Native Docs: https://reactnative.dev
- Email: contact@4psychotic.com

---

Last updated: Feb 2025
