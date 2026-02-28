# 4psychotic Mobile App - Windows User Guide

**Welcome!** This guide will help you get started with the 4psychotic React Native app on Windows.

## 📦 What You Have

A complete cross-platform mobile app that works on:
- ✅ **Web** (browsers)
- ✅ **iOS** (iPhone/iPad)
- ✅ **Android** (phones/tablets)

All from a single codebase!

## 🚀 Quick Start (5 minutes)

### 1. Install Node.js

1. Download from: https://nodejs.org/ (LTS version)
2. Run installer
3. **Check "Add to PATH"** during installation
4. Restart your computer

Verify:
```cmd
node --version
npm --version
```

### 2. Install EAS CLI

Open **Command Prompt** and run:

```cmd
npm install -g eas-cli
eas login
```

Enter your Expo credentials (create at https://expo.dev if needed).

### 3. Extract & Setup Project

```cmd
cd C:\Users\YourName\Projects
npm install
```

### 4. Set Environment Variable

```cmd
set EXPO_ID=your-expo-project-id
```

### 5. Test It!

```cmd
npm run web
```

Your app opens in browser at `http://localhost:19000`

---

## 📋 Project Contents

```
4psychotic-mobile/
├── app/                    # React Native app code
├── scripts/               # Deployment scripts (.bat for Windows)
├── package.json          # Dependencies
├── app.json              # Expo config
├── eas.json              # Build profiles
├── WINDOWS_SETUP.md      # Detailed setup guide
├── DEPLOY_GUIDE.md       # Deployment guide
└── DEPLOYMENT_SCRIPTS.md # Script documentation
```

---

## 🎯 Common Tasks

### Run Web Version

```cmd
npm run web
```

### Run Android Emulator

```cmd
npm run android
```

(Requires Android Studio and emulator running)

### Build for Web

```cmd
npm run build
```

Output: `dist/` folder (ready to upload)

### Deploy to Vercel

```cmd
npm run build
cd dist
vercel --prod
```

### Deploy to Android

```cmd
eas build --platform android --profile production
eas submit --platform android --latest
```

### Deploy to iOS

```cmd
eas build --platform ios --profile production
eas submit --platform ios --latest
```

(Requires macOS for iOS)

---

## 🛠️ Deployment Scripts (Windows)

### Master Deployment Script

```cmd
REM Deploy to all platforms
scripts\deploy.bat all production

REM Deploy to web only
scripts\deploy.bat web production

REM Deploy to Android only
scripts\deploy.bat android production
```

### Individual Scripts

```cmd
REM Web deployment
scripts\deploy-web.bat vercel --prod

REM Android deployment
scripts\deploy-android.bat production --submit

REM iOS deployment (macOS only)
scripts\deploy-ios.bat production --submit
```

---

## 📱 App Features

### Home Screen
- Hero section with live streaming status
- Featured content cards
- About section
- Social links

### Videos Screen
- Gaming highlights gallery
- YouTube video player
- View counts and dates
- Modal lightbox

### Profile Screen
- Channel statistics
- Social media links
- Featured posts
- Community info

### Settings Screen
- Contact form
- Preferences
- Support information

---

## 🔧 Troubleshooting

### "npm: command not found"
→ Install Node.js and restart Command Prompt

### "eas: command not found"
→ Run: `npm install -g eas-cli`

### "EXPO_ID not set"
→ Run: `set EXPO_ID=your-project-id`

### Build fails
→ Try: `npm cache clean --force && npm install`

### Port already in use
→ Run: `npm start -- --port 19001`

See **WINDOWS_SETUP.md** for detailed troubleshooting.

---

## 📚 Documentation Files

| File | Purpose |
|------|---------|
| **README_WINDOWS.md** | This file - quick start |
| **WINDOWS_SETUP.md** | Detailed setup guide |
| **DEPLOY_GUIDE.md** | Step-by-step deployment |
| **DEPLOYMENT_SCRIPTS.md** | Script documentation |
| **README.md** | General project info |

---

## 🌐 Deployment Platforms

### Web
- **Vercel** (recommended): `vercel --prod --cwd dist`
- **Netlify**: `netlify deploy --prod --dir dist`
- **Self-hosted**: Upload `dist/` to your server

### iOS
- **App Store**: Requires macOS and Apple Developer account

### Android
- **Google Play**: Works on Windows with EAS

---

## 🎓 Learning Resources

- **Expo Docs:** https://docs.expo.dev
- **React Native:** https://reactnative.dev
- **Node.js:** https://nodejs.org/
- **EAS:** https://docs.expo.dev/eas

---

## 📞 Need Help?

1. Check **WINDOWS_SETUP.md** for detailed setup
2. Check **DEPLOY_GUIDE.md** for deployment steps
3. Check **DEPLOYMENT_SCRIPTS.md** for script details
4. Visit https://docs.expo.dev
5. Check logs in `logs/` folder

---

## ✨ Next Steps

1. ✅ Install Node.js
2. ✅ Install EAS CLI
3. ✅ Extract project
4. ✅ Run `npm install`
5. ✅ Set EXPO_ID
6. ✅ Test: `npm run web`
7. ✅ Deploy!

---

**Happy coding! 🚀**

Built with ❤️ by Manus
