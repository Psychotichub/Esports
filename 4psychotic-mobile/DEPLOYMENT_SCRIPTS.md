# 4psychotic Deployment Scripts

Complete automation for deploying to web, iOS, and Android platforms.

## 📋 Overview

Four powerful deployment scripts handle the entire deployment pipeline:

| Script | Purpose | Platforms |
|--------|---------|-----------|
| `deploy.sh` | Master deployment script | Web, iOS, Android, All |
| `deploy-web.sh` | Web deployment only | Vercel, Netlify, S3, Manual |
| `deploy-ios.sh` | iOS deployment only | App Store |
| `deploy-android.sh` | Android deployment only | Google Play |

## 🚀 Quick Start

### 1. Set Environment Variables

```bash
export EXPO_ID=your-expo-project-id
export AWS_REGION=us-east-1          # For S3 deployment
export S3_BUCKET=your-bucket-name    # For S3 deployment
```

### 2. Run Deployment

```bash
# Deploy to all platforms (production)
./scripts/deploy.sh all production

# Deploy to web only
./scripts/deploy-web.sh vercel --prod

# Deploy to iOS
./scripts/deploy-ios.sh production --submit

# Deploy to Android
./scripts/deploy-android.sh production --submit
```

## 📖 Master Deployment Script

### Usage

```bash
./scripts/deploy.sh [platform] [profile] [options]
```

### Parameters

- **platform**: `web`, `ios`, `android`, or `all`
- **profile**: `development`, `preview`, or `production`
- **options**: Additional flags (optional)

### Examples

```bash
# Development build for all platforms
./scripts/deploy.sh all development

# Production build for iOS only
./scripts/deploy.sh ios production

# Production build for Android with submission
./scripts/deploy.sh android production

# Web deployment to production
./scripts/deploy.sh web production
```

### Output

- ✅ Automated builds for all platforms
- ✅ Automatic app store submission (production only)
- ✅ Detailed deployment logs
- ✅ Build reports and summaries
- ✅ Error handling and rollback instructions

### Logs

All deployments are logged to `logs/deploy_TIMESTAMP.log`

```bash
# View latest deployment log
tail -f logs/deploy_*.log

# View all deployment logs
ls -lah logs/deploy_*.log
```

---

## 🌐 Web Deployment Script

### Usage

```bash
./scripts/deploy-web.sh [provider] [--prod]
```

### Providers

| Provider | Command | Output |
|----------|---------|--------|
| **Vercel** | `./scripts/deploy-web.sh vercel --prod` | https://4psychotic.vercel.app |
| **Netlify** | `./scripts/deploy-web.sh netlify --prod` | https://4psychotic.netlify.app |
| **AWS S3** | `./scripts/deploy-web.sh s3 --prod` | s3://your-bucket |
| **Manual** | `./scripts/deploy-web.sh manual` | Instructions |

### Examples

```bash
# Deploy to Vercel (production)
./scripts/deploy-web.sh vercel --prod

# Deploy to Netlify (preview)
./scripts/deploy-web.sh netlify

# Deploy to S3 (production)
export S3_BUCKET=my-bucket
export AWS_REGION=us-east-1
./scripts/deploy-web.sh s3 --prod

# Get manual deployment instructions
./scripts/deploy-web.sh manual
```

### Features

- ✅ Automatic build optimization
- ✅ Multi-provider support
- ✅ Preview and production deployments
- ✅ Build size reporting
- ✅ Rollback instructions
- ✅ Deployment summary generation

### Environment Variables

```bash
# For S3 deployment
export S3_BUCKET=my-bucket
export AWS_REGION=us-east-1
export CLOUDFRONT_DISTRIBUTION_ID=E123ABC  # Optional

# For Vercel (auto-detected)
# Vercel CLI handles authentication

# For Netlify (auto-detected)
# Netlify CLI handles authentication
```

### Output

- Build directory: `dist/`
- Deployment logs: `logs/web_deploy_TIMESTAMP.log`
- Summary: `logs/web_deployment_summary_TIMESTAMP.md`

---

## 📱 iOS Deployment Script

### Usage

```bash
./scripts/deploy-ios.sh [profile] [--submit]
```

### Profiles

- **development**: For testing on physical devices
- **preview**: For internal testing
- **production**: For App Store submission

### Examples

```bash
# Build for development (no submission)
./scripts/deploy-ios.sh development

# Build for production and submit to App Store
./scripts/deploy-ios.sh production --submit

# Build for preview (internal testing)
./scripts/deploy-ios.sh preview

# Build without submission (review first)
./scripts/deploy-ios.sh production
```

### Prerequisites

- [ ] Apple Developer Account ($99/year)
- [ ] App created in App Store Connect
- [ ] Bundle ID: `com.psychotic.mobile`
- [ ] EAS credentials configured

### Features

- ✅ Automatic credential setup
- ✅ EAS build management
- ✅ App Store submission
- ✅ Build download
- ✅ Detailed reporting
- ✅ Troubleshooting guide

### Workflow

```bash
# Step 1: Setup (first time only)
./scripts/deploy-ios.sh development

# Step 2: Review build
# - Check Expo dashboard
# - Test on device/simulator

# Step 3: Submit to App Store
./scripts/deploy-ios.sh production --submit

# Step 4: Monitor review
# - Check App Store Connect
# - Wait for review (24-48 hours)
```

### Logs

- Build ID: `logs/ios_build_id_TIMESTAMP.txt`
- IPA path: `logs/ios_ipa_path_TIMESTAMP.txt`
- Report: `logs/ios_deployment_report_TIMESTAMP.md`

---

## 🤖 Android Deployment Script

### Usage

```bash
./scripts/deploy-android.sh [profile] [--submit]
```

### Profiles

- **development**: For testing on physical devices
- **preview**: For internal testing
- **production**: For Google Play submission

### Examples

```bash
# Build for development (no submission)
./scripts/deploy-android.sh development

# Build for production and submit to Google Play
./scripts/deploy-android.sh production --submit

# Build for preview (internal testing)
./scripts/deploy-android.sh preview

# Build without submission (review first)
./scripts/deploy-android.sh production
```

### Prerequisites

- [ ] Google Play Developer Account ($25 one-time)
- [ ] App created in Google Play Console
- [ ] Package: `com.psychotic.mobile`
- [ ] EAS credentials configured

### Features

- ✅ Automatic credential setup
- ✅ EAS build management
- ✅ Google Play submission
- ✅ Build download (AAB/APK)
- ✅ Emulator testing
- ✅ Detailed reporting
- ✅ Troubleshooting guide

### Workflow

```bash
# Step 1: Setup (first time only)
./scripts/deploy-android.sh development

# Step 2: Test on emulator
# - Android Studio → AVD Manager
# - Start emulator
# - Script auto-installs APK

# Step 3: Submit to Google Play
./scripts/deploy-android.sh production --submit

# Step 4: Monitor review
# - Check Google Play Console
# - Wait for review (2-4 hours)
```

### Logs

- Build ID: `logs/android_build_id_TIMESTAMP.txt`
- AAB path: `logs/android_aab_path_TIMESTAMP.txt`
- APK path: `logs/android_apk_path_TIMESTAMP.txt`
- Report: `logs/android_deployment_report_TIMESTAMP.md`

---

## 📊 Deployment Workflow

### Complete Multi-Platform Deployment

```bash
# 1. Setup environment
export EXPO_ID=your-project-id

# 2. Deploy to all platforms (production)
./scripts/deploy.sh all production

# 3. Monitor builds
eas build:list

# 4. Check deployment status
cat logs/deploy_*.log | tail -50

# 5. View reports
cat logs/*_report_*.md
```

### Staged Deployment

```bash
# 1. Development build for testing
./scripts/deploy.sh all development

# 2. Preview build for internal testing
./scripts/deploy.sh all preview

# 3. Production build with submission
./scripts/deploy.sh all production
```

### Platform-Specific Deployment

```bash
# Web only
./scripts/deploy-web.sh vercel --prod

# iOS only
./scripts/deploy-ios.sh production --submit

# Android only
./scripts/deploy-android.sh production --submit
```

---

## 🔍 Monitoring & Logs

### View Deployment Logs

```bash
# Latest deployment
tail -f logs/deploy_*.log

# Specific platform
tail -f logs/ios_deploy_*.log
tail -f logs/android_deploy_*.log
tail -f logs/web_deploy_*.log

# All logs
ls -lah logs/
```

### Check Build Status

```bash
# All builds
eas build:list

# iOS builds
eas build:list --platform ios

# Android builds
eas build:list --platform android

# Specific build
eas build:view --id <build-id>
```

### View Deployment Reports

```bash
# Latest report
cat logs/*_report_*.md | tail -100

# Specific platform
cat logs/ios_deployment_report_*.md
cat logs/android_deployment_report_*.md
cat logs/web_deployment_report_*.md
```

---

## 🐛 Troubleshooting

### Build Failures

```bash
# Check detailed logs
eas build:view --id <build-id> --logs

# Clear cache and retry
eas build --platform ios --clear-cache
eas build --platform android --clear-cache

# Reset credentials
eas credentials --platform ios --clear
eas credentials --platform android --clear
```

### Submission Failures

```bash
# Check submission status
eas submit:list

# View submission details
eas submit:view --id <submission-id>

# Retry submission
eas submit --platform ios --latest
eas submit --platform android --latest
```

### Script Errors

```bash
# Run with debug output
bash -x scripts/deploy.sh web production

# Check prerequisites
node --version
npm --version
eas --version
expo --version

# Verify environment
echo $EXPO_ID
echo $AWS_REGION
echo $S3_BUCKET
```

---

## 🔐 Security Best Practices

### Environment Variables

```bash
# Never commit to git
echo ".env" >> .gitignore

# Store in secure location
~/.bashrc  # or ~/.zshrc

# Use CI/CD secrets for automation
# GitHub Actions, GitLab CI, etc.
```

### Credentials Management

```bash
# EAS handles signing automatically
eas credentials

# Never share credentials
# Never commit keystore files
# Never expose API keys

# Rotate credentials periodically
eas credentials --platform ios --clear
eas credentials --platform android --clear
```

### App Store Credentials

```bash
# Use app-specific passwords
# https://appleid.apple.com

# Store securely in CI/CD
# Never hardcode in scripts
```

---

## 📈 Performance Tips

### Faster Builds

```bash
# Use preview profile (faster)
./scripts/deploy-ios.sh preview

# Parallel builds (all platforms)
./scripts/deploy.sh all production

# Cache builds
eas build:list --limit 10
```

### Smaller App Size

```bash
# Check bundle size
npm run build -- --analyze

# Optimize images
# Use WebP format
# Compress assets

# Remove unused dependencies
npm prune --production
```

---

## 🎯 Common Tasks

### Deploy Web Only

```bash
./scripts/deploy-web.sh vercel --prod
```

### Deploy iOS Only

```bash
./scripts/deploy-ios.sh production --submit
```

### Deploy Android Only

```bash
./scripts/deploy-android.sh production --submit
```

### Deploy All Platforms

```bash
./scripts/deploy.sh all production
```

### Create OTA Update

```bash
eas update --branch production
```

### Rollback Update

```bash
eas update:rollback --branch production
```

### Test on Emulator

```bash
./scripts/deploy-android.sh development
# APK auto-installs on running emulator
```

---

## 📚 Additional Resources

- [Expo Docs](https://docs.expo.dev)
- [EAS Documentation](https://docs.expo.dev/eas)
- [React Native Docs](https://reactnative.dev)
- [App Store Connect](https://appstoreconnect.apple.com)
- [Google Play Console](https://play.google.com/console)

---

## 📞 Support

For issues with deployment scripts:

1. Check logs: `tail -f logs/deploy_*.log`
2. Review DEPLOY_GUIDE.md
3. Check Expo docs: https://docs.expo.dev
4. Ask in Expo Discord: https://chat.expo.dev

---

**Last updated: February 2025**
**Built with ❤️ by Manus**
