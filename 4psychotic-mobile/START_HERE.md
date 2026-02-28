# 🎮 4psychotic Mobile App - START HERE

Welcome! This is your complete React Native cross-platform app ready to deploy.

## 📦 What You Have

A production-ready mobile app that works on:
- ✅ **Web** (all browsers)
- ✅ **iOS** (iPhone/iPad)
- ✅ **Android** (phones/tablets)

All from a **single codebase**!

---

## 🚀 Quick Start (5 Minutes)

### 1️⃣ Extract Files
Extract this zip file to your computer.

### 2️⃣ Install Dependencies
Open Command Prompt in the project folder:
```cmd
cd C:\Users\YourName\Projects\4psychotic-mobile
npm install
```

### 3️⃣ Login to Expo
```cmd
npx expo login
```

Enter your Expo credentials.

### 4️⃣ Publish to Expo
```cmd
npx expo publish
```

**Done!** Your app is now live on your Expo account.

---

## 📱 View Your App

### Option 1: Expo Go App (Easiest) 📲
1. Download "Expo Go" on your phone (iOS App Store or Google Play)
2. Open Expo Go
3. Scan the QR code from step 4
4. Your app loads instantly!

### Option 2: Web Browser 🌐
Visit: https://expo.dev/projects/b73fb944-4b64-47ca-a7d6-241550b6d7cf

### Option 3: Expo Dashboard 📊
1. Go to https://expo.dev
2. Login with your account
3. Click "4psychotic-mobile"
4. View your published app

---

## 📋 Project Contents

```
4psychotic-mobile/
├── app/                          # React Native app code
│   ├── _layout.tsx              # Bottom tab navigation
│   ├── screens/                 # 4 complete screens
│   │   ├── HomeScreen.tsx       # Hero, live status, featured content
│   │   ├── VideosScreen.tsx     # YouTube gallery
│   │   ├── ProfileScreen.tsx    # Channel stats, social links
│   │   └── SettingsScreen.tsx   # Contact form, preferences
│   ├── lib/                     # Utilities & tRPC client
│   ├── components/              # Reusable components
│   └── hooks/                   # Custom React hooks
│
├── scripts/                      # Deployment scripts
│   ├── deploy.bat               # Master deployment (Windows)
│   ├── deploy-web.bat           # Web deployment (Windows)
│   ├── deploy-ios.bat           # iOS deployment (Windows)
│   ├── deploy-android.bat       # Android deployment (Windows)
│   └── *.sh                     # Mac/Linux versions
│
├── assets/                       # Images & icons
├── package.json                 # Dependencies
├── app.json                     # Expo configuration
├── eas.json                     # EAS build profiles
│
├── README.md                    # General overview
├── README_WINDOWS.md            # Windows quick start
├── WINDOWS_SETUP.md             # Detailed Windows setup
├── EXPO_DEPLOYMENT_WINDOWS.md   # Expo deployment guide
├── DEPLOY_GUIDE.md              # Full deployment guide
├── DEPLOYMENT_SCRIPTS.md        # Script documentation
└── START_HERE.md                # This file
```

---

## ✨ App Features

### 🏠 Home Screen
- Hero section with live streaming status
- Featured content cards
- About section with brand story
- Social media links

### 🎥 Videos Screen
- Gaming highlights gallery (6 videos)
- YouTube video player
- View counts and upload dates
- Modal lightbox for full-screen viewing

### 👤 Profile Screen
- Channel statistics (1.7K+ followers)
- Social media links (Facebook, Instagram, YouTube, Twitter)
- Featured posts
- Community information

### ⚙️ Settings Screen
- Contact form (name, email, subject, message)
- Form validation
- Success state
- Support information

---

## 🔧 Your Expo Project

- **Project ID:** `b73fb944-4b64-47ca-a7d6-241550b6d7cf`
- **Project Name:** 4psychotic-mobile
- **Owner:** psychotic
- **Dashboard:** https://expo.dev/projects/b73fb944-4b64-47ca-a7d6-241550b6d7cf

---

## 📚 Documentation Files

| File | Purpose |
|------|---------|
| **START_HERE.md** | This file - quick overview |
| **EXPO_DEPLOYMENT_WINDOWS.md** | 5-minute Expo deployment |
| **README_WINDOWS.md** | Windows quick start guide |
| **WINDOWS_SETUP.md** | Detailed Windows setup |
| **DEPLOY_GUIDE.md** | Complete deployment guide |
| **DEPLOYMENT_SCRIPTS.md** | Script documentation |
| **README.md** | General project info |

---

## 🎯 Deployment Options

### Option 1: Expo (Recommended for Testing)
```cmd
npx expo publish
```
View on Expo Go app or web.

### Option 2: Web (Vercel/Netlify)
```cmd
npm run build
vercel --prod --cwd dist
```

### Option 3: iOS App Store
```cmd
eas build --platform ios --profile production
eas submit --platform ios --latest
```

### Option 4: Google Play
```cmd
eas build --platform android --profile production
eas submit --platform android --latest
```

---

## 🛠️ Windows Batch Scripts

All deployment scripts are provided as `.bat` files:

```cmd
REM Master deployment
scripts\deploy.bat all production

REM Web only
scripts\deploy-web.bat vercel --prod

REM Android only
scripts\deploy-android.bat production --submit

REM iOS only
scripts\deploy-ios.bat production --submit
```

---

## ⚙️ System Requirements

- **Node.js** 16+ (download from https://nodejs.org/)
- **npm** (comes with Node.js)
- **Expo Account** (free at https://expo.dev)
- **Windows/Mac/Linux**

---

## 🔍 Troubleshooting

### "npm: command not found"
→ Install Node.js from https://nodejs.org/

### "expo: command not found"
→ Run: `npm install -g expo-cli`

### "Not authenticated"
→ Run: `npx expo logout` then `npx expo login`

### Build fails
→ Try: `npm cache clean --force && npm install`

See **WINDOWS_SETUP.md** for more troubleshooting.

---

## 📞 Getting Help

1. **Read the docs** — Check the documentation files above
2. **Expo Docs** — https://docs.expo.dev
3. **React Native** — https://reactnative.dev
4. **Node.js** — https://nodejs.org/en/docs/

---

## ✅ Checklist

- [ ] Extract zip file
- [ ] Install Node.js (if needed)
- [ ] Run `npm install`
- [ ] Run `npx expo login`
- [ ] Run `npx expo publish`
- [ ] Download Expo Go app
- [ ] Scan QR code to view app
- [ ] Share with others!

---

## 🎉 You're Ready!

Your app is production-ready and can be deployed immediately.

**Next step:** Follow the "Quick Start" section above to deploy to Expo.

---

**Happy coding! 🚀**

Built with ❤️ by Manus
