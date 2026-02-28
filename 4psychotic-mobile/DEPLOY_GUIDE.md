# 4psychotic Mobile App - Complete Deployment Guide

## 🎯 Overview

This guide walks you through deploying the 4psychotic React Native app to:
- **Web** (Vercel, Netlify, or self-hosted)
- **iOS** (App Store)
- **Android** (Google Play Store)

All platforms use a single codebase with Expo and EAS (Expo Application Services).

---

## 📋 Prerequisites

### Required Accounts
- [ ] **Expo Account** (free) - https://expo.dev
- [ ] **Apple Developer Account** ($99/year) - https://developer.apple.com
- [ ] **Google Play Developer Account** ($25 one-time) - https://play.google.com/console
- [ ] **Web Hosting** (Vercel/Netlify/self-hosted)

### Required Software
```bash
# Install Node.js 16+
node --version

# Install EAS CLI
npm install -g eas-cli

# Verify installation
eas --version
```

---

## 🔧 Initial Setup

### 1. Set Your EXPO_ID

```bash
# Get your Expo project ID from https://expo.dev/projects
export EXPO_ID=your-expo-project-id

# Or add to ~/.bashrc or ~/.zshrc for persistence
echo "export EXPO_ID=your-expo-project-id" >> ~/.bashrc
source ~/.bashrc
```

### 2. Run Setup Script

```bash
cd /home/ubuntu/4psychotic-mobile
bash scripts/setup-deployment.sh
```

This will:
- ✅ Verify EAS CLI installation
- ✅ Check Expo login
- ✅ Configure app.json with your Expo project ID
- ✅ Set up build profiles
- ✅ Test the configuration

### 3. Verify Configuration

```bash
# Check app.json
cat app.json | grep projectId

# Check eas.json
cat eas.json | grep projectId
```

---

## 🌐 Web Deployment

### Build for Web

```bash
cd /home/ubuntu/4psychotic-mobile
npm run build
```

Output: `dist/` directory (ready to deploy)

### Option 1: Deploy to Vercel (Recommended)

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
cd dist
vercel --prod

# Or from project root
vercel --prod --cwd dist
```

**Result:** Your app at `4psychotic.vercel.app`

### Option 2: Deploy to Netlify

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy
cd dist
netlify deploy --prod --dir .

# Or from project root
netlify deploy --prod --dir dist
```

**Result:** Your app at `4psychotic.netlify.app`

### Option 3: Self-Hosted (AWS, DigitalOcean, etc.)

```bash
# Build
npm run build

# Upload dist/ to your server
scp -r dist/* user@server:/var/www/4psychotic

# Or with rsync
rsync -avz dist/ user@server:/var/www/4psychotic/
```

---

## 📱 iOS Deployment

### Prerequisites

- macOS with Xcode installed
- Apple Developer Account
- Apple Team ID (from https://developer.apple.com/account)

### Step 1: Create App in App Store Connect

1. Go to https://appstoreconnect.apple.com
2. Click "My Apps"
3. Click "+" → "New App"
4. Fill in:
   - **Platform:** iOS
   - **Name:** 4psychotic
   - **Bundle ID:** com.psychotic.mobile
   - **SKU:** 4psychotic-001
   - **User Access:** Full Access

### Step 2: Configure Signing Credentials

```bash
# Let EAS handle signing automatically
eas credentials

# Select iOS
# Choose "Automatic managed signing"
# Enter your Apple ID and password
```

### Step 3: Build for iOS

```bash
# Development build (for testing)
eas build --platform ios --profile development

# Production build (for App Store)
eas build --platform ios --profile production
```

**First time?** You'll be prompted for:
- Apple ID email
- Apple ID password
- Team ID

### Step 4: Download Build

```bash
# Check build status
eas build:list

# Download .ipa file from Expo dashboard
# Or use:
eas build:download --latest --platform ios
```

### Step 5: Submit to App Store

#### Option A: Automatic Submission (Recommended)

```bash
eas submit --platform ios --latest
```

You'll be prompted for:
- Apple ID
- Apple ID password
- App-specific password (generate at https://appleid.apple.com)

#### Option B: Manual Submission

1. Download .ipa from Expo dashboard
2. Open Xcode: `Xcode → Open → dist/4psychotic.ipa`
3. Click "Distribute App"
4. Select "App Store Connect"
5. Follow the wizard

### Step 6: Complete App Store Info

In App Store Connect:
1. **Pricing and Availability:** Set to Free
2. **App Information:**
   - Subtitle: "Psychedelic Gaming Live Streaming"
   - Category: Entertainment
   - Privacy Policy URL: https://your-domain.com/privacy
3. **Screenshots:** Upload 2-5 per device type
4. **Description:** 
   ```
   Watch live PUBG Mobile esports, gaming highlights, and psychedelic content.
   Real-time streaming status, video gallery, and community engagement.
   ```
5. **Keywords:** gaming, esports, live, streaming, psychedelic
6. **Support URL:** https://your-domain.com/support

### Step 7: Submit for Review

1. Click "Build"
2. Select your build
3. Fill in "Version Release Information"
4. Click "Submit for Review"

**Review time:** 24-48 hours typically

---

## 🤖 Android Deployment

### Prerequisites

- Google Play Developer Account
- Android keystore (EAS will create automatically)

### Step 1: Create App in Google Play Console

1. Go to https://play.google.com/console
2. Click "Create app"
3. Fill in:
   - **App name:** 4psychotic
   - **Default language:** English
   - **App or game:** App
   - **Free or paid:** Free

### Step 2: Configure Signing Credentials

```bash
# Let EAS handle signing automatically
eas credentials

# Select Android
# Choose "Automatic managed signing"
# EAS will create keystore automatically
```

### Step 3: Build for Android

```bash
# Development build (for testing)
eas build --platform android --profile development

# Production build (for Google Play)
eas build --platform android --profile production
```

### Step 4: Download Build

```bash
# Check build status
eas build:list

# Download .aab file from Expo dashboard
# Or use:
eas build:download --latest --platform android
```

### Step 5: Submit to Google Play

#### Option A: Automatic Submission (Recommended)

```bash
eas submit --platform android --latest
```

#### Option B: Manual Submission

1. Download .aab from Expo dashboard
2. Go to Google Play Console
3. Select your app
4. Click "Release" → "Production"
5. Click "Create new release"
6. Upload .aab file
7. Fill in release notes
8. Click "Review release"

### Step 6: Complete Google Play Info

In Google Play Console:
1. **Store Listing:**
   - Title: 4psychotic
   - Short description: "Psychedelic Gaming Live Streaming"
   - Full description: (same as iOS)
   - Screenshots: 2-8 per device type
   - Feature graphic: 1024x500px
   - Promo video: (optional)

2. **Content Rating:**
   - Complete questionnaire
   - Get rating

3. **Target Audience:**
   - Select appropriate age group
   - Content guidelines

4. **Pricing & Distribution:**
   - Free
   - Select countries/regions

### Step 7: Submit for Review

1. Go to "Release" → "Production"
2. Review all information
3. Click "Submit release"

**Review time:** Usually 2-4 hours

---

## 🔄 Over-the-Air Updates

Enable instant updates without app store resubmission:

```bash
# Create update
eas update --branch production

# View update status
eas update:list

# Rollback to previous update
eas update:rollback --branch production
```

---

## 📊 Monitoring & Analytics

### Enable Crash Reporting

```bash
npm install @sentry/react-native

# Initialize in app
import * as Sentry from "@sentry/react-native";

Sentry.init({
  dsn: "YOUR_SENTRY_DSN",
  environment: "production",
});
```

### Enable Analytics

```bash
npm install expo-analytics

# Track events
import { Analytics } from 'expo-analytics';

const analytics = new Analytics('YOUR_TRACKING_ID');
analytics.hit({
  hitType: 'pageview',
  page: '/home',
});
```

---

## 🐛 Troubleshooting

### Build Failures

```bash
# Clear cache and retry
eas build --platform ios --clear-cache
eas build --platform android --clear-cache

# View detailed logs
eas build:view --id <build-id> --logs
```

### Signing Issues

```bash
# Reset credentials
eas credentials --platform ios --clear
eas credentials --platform android --clear

# Reconfigure
eas credentials
```

### App Crashes

1. Check Sentry dashboard
2. Review device logs:
   ```bash
   # iOS
   xcrun simctl spawn booted log stream --predicate 'eventMessage contains[cd] "4psychotic"'
   
   # Android
   adb logcat | grep 4psychotic
   ```

### Slow Performance

1. Profile with React DevTools
2. Check network requests in DevTools
3. Optimize images and assets
4. Use `React.memo()` for expensive components

---

## ✅ Pre-Launch Checklist

### Before Web Deployment
- [ ] Test on desktop/tablet
- [ ] Check responsive design
- [ ] Verify all links work
- [ ] Test contact form
- [ ] Check YouTube API integration
- [ ] Set up analytics
- [ ] Configure domain/SSL

### Before iOS Submission
- [ ] Test on iOS simulator
- [ ] Test on physical iPhone
- [ ] Check app icons (all sizes)
- [ ] Verify permissions requests
- [ ] Test all screens and navigation
- [ ] Check performance (< 3s load)
- [ ] Prepare screenshots
- [ ] Write app description
- [ ] Set up privacy policy

### Before Android Submission
- [ ] Test on Android emulator
- [ ] Test on physical Android device
- [ ] Check app icons (all sizes)
- [ ] Verify permissions requests
- [ ] Test all screens and navigation
- [ ] Check performance (< 3s load)
- [ ] Prepare screenshots
- [ ] Write app description
- [ ] Set up privacy policy

---

## 📞 Support

### Resources
- Expo Docs: https://docs.expo.dev
- EAS Docs: https://docs.expo.dev/eas
- React Native: https://reactnative.dev
- App Store: https://developer.apple.com/app-store
- Google Play: https://play.google.com/console

### Getting Help
- Expo Discord: https://chat.expo.dev
- GitHub Issues: https://github.com/expo/expo/issues
- Stack Overflow: Tag `expo` or `react-native`

---

## 📝 Version Management

### Update Version Numbers

```bash
# Update app version
# Edit app.json:
{
  "expo": {
    "version": "1.1.0",  // Semantic versioning
    "ios": {
      "buildNumber": "2"  // Increment for each build
    },
    "android": {
      "versionCode": 2    // Increment for each build
    }
  }
}
```

### Create Release Notes

```bash
# Create CHANGELOG.md
## Version 1.1.0 (2025-02-27)
- Added new features
- Fixed bugs
- Improved performance
```

---

## 🎉 Success!

Once your app is live:

1. **Share with users:**
   - iOS: https://apps.apple.com/app/4psychotic
   - Android: https://play.google.com/store/apps/details?id=com.psychotic.mobile
   - Web: https://4psychotic.vercel.app

2. **Monitor performance:**
   - Check Sentry for crashes
   - Review analytics
   - Gather user feedback

3. **Plan updates:**
   - Use OTA updates for quick fixes
   - Plan major releases quarterly
   - Keep dependencies updated

---

**Last updated: February 2025**
**Built with ❤️ by Manus**
