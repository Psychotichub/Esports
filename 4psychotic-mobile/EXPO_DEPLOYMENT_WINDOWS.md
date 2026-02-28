# Deploy 4psychotic to Your Expo Account - Windows Guide

Your Expo Project ID: `b73fb944-4b64-47ca-a7d6-241550b6d7cf`

## Quick Start (5 minutes)

### Step 1: Download Project
Download the 4psychotic-mobile folder to your Windows computer.

### Step 2: Install Dependencies
Open Command Prompt in the project folder:
```cmd
cd C:\Users\YourName\Projects\4psychotic-mobile
npm install
```

### Step 3: Login to Expo
```cmd
npx expo login
```

Enter your Expo account credentials (email and password).

### Step 4: Deploy to Expo
```cmd
npx expo publish
```

This will publish your app to your Expo account!

---

## View Your App

### Option 1: Expo Go App (Easiest)
1. Download "Expo Go" app on your phone (iOS App Store or Google Play)
2. Open Expo Go
3. Scan the QR code from the publish output
4. Your app loads instantly!

### Option 2: Web Browser
Visit: https://expo.dev/projects/b73fb944-4b64-47ca-a7d6-241550b6d7cf

### Option 3: Expo Dashboard
1. Go to https://expo.dev
2. Login with your account
3. Click on "4psychotic-mobile" project
4. View your published app

---

## Troubleshooting

### "expo: command not found"
```cmd
npm install -g expo-cli
```

### "Not authenticated"
```cmd
npx expo logout
npx expo login
```

### "Project not found"
Make sure you're in the correct project folder and the Expo Project ID is correct in `app.json`.

---

## What Gets Deployed

✅ All 4 screens (Home, Videos, Profile, Settings)
✅ Bottom tab navigation
✅ YouTube integration
✅ Live streaming status
✅ Contact form
✅ Dark theme with neon aesthetics

---

## Next Steps After Publishing

1. **Share with others:** Send them the Expo link or QR code
2. **Build for iOS:** `eas build --platform ios --profile production`
3. **Build for Android:** `eas build --platform android --profile production`
4. **Submit to stores:** Follow the deployment scripts provided

---

## Your Expo Project Details

- **Project ID:** b73fb944-4b64-47ca-a7d6-241550b6d7cf
- **Project Name:** 4psychotic-mobile
- **Owner:** psychotic
- **Dashboard:** https://expo.dev/projects/b73fb944-4b64-47ca-a7d6-241550b6d7cf

---

**That's it! Your app will be live in seconds.** 🚀
