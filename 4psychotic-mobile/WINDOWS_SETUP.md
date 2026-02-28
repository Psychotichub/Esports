# 4psychotic Mobile App - Windows Setup Guide

Complete setup and deployment guide for Windows users.

## 🖥️ Windows Prerequisites

### 1. Install Node.js & npm

1. Download from https://nodejs.org/
2. Choose **LTS (Long Term Support)** version
3. Run installer and follow prompts
4. **Important:** Check "Add to PATH" during installation

Verify installation:
```cmd
node --version
npm --version
```

### 2. Install Git (Optional but Recommended)

1. Download from https://git-scm.com/download/win
2. Run installer with default settings
3. Verify: `git --version`

### 3. Install EAS CLI

Open **Command Prompt** or **PowerShell** and run:

```cmd
npm install -g eas-cli
```

Verify:
```cmd
eas --version
```

### 4. Create Expo Account

1. Go to https://expo.dev
2. Click "Sign Up"
3. Create account with email/password
4. Verify email

### 5. Login to Expo

```cmd
eas login
```

Enter your Expo credentials when prompted.

---

## 📁 Project Setup

### 1. Extract Project Files

1. Download the 4psychotic-mobile folder
2. Extract to a location like: `C:\Users\YourName\Projects\4psychotic-mobile`
3. Open **Command Prompt** in this folder

### 2. Install Dependencies

```cmd
cd C:\Users\YourName\Projects\4psychotic-mobile
npm install
```

This will take 2-5 minutes. Wait for it to complete.

### 3. Set Environment Variables

#### Option A: Temporary (Current Session Only)

```cmd
set EXPO_ID=your-expo-project-id
```

#### Option B: Permanent (All Sessions)

1. Open **System Properties**:
   - Press `Win + X` → "System"
   - Click "Advanced system settings"
   - Click "Environment Variables"

2. Click "New" under "User variables"
3. Variable name: `EXPO_ID`
4. Variable value: `your-expo-project-id`
5. Click OK

To find your EXPO_ID:
1. Go to https://expo.dev/projects
2. Find your project
3. Copy the project ID

### 4. Verify Setup

```cmd
echo %EXPO_ID%
eas --version
npm --version
node --version
```

---

## 🚀 Deployment Commands

### Web Deployment

```cmd
REM Build for web
npm run build

REM Deploy to Vercel
cd dist
vercel --prod

REM Or deploy to Netlify
netlify deploy --prod --dir .
```

### iOS Deployment (macOS Only)

```cmd
REM Build for iOS
eas build --platform ios --profile production

REM Submit to App Store
eas submit --platform ios --latest
```

**Note:** iOS builds require macOS. If you're on Windows, you can still build for Android and web.

### Android Deployment

```cmd
REM Build for Android
eas build --platform android --profile production

REM Submit to Google Play
eas submit --platform android --latest
```

### Using Batch Scripts

Windows batch files are provided for easy deployment:

```cmd
REM Master deployment
scripts\deploy.bat all production

REM Web only
scripts\deploy-web.bat vercel --prod

REM Android only
scripts\deploy-android.bat production --submit

REM iOS only (macOS)
scripts\deploy-ios.bat production --submit
```

---

## 📱 Testing on Windows

### Test Web Version

```cmd
npm run web
```

This opens the app in your default browser at `http://localhost:19000`

### Test Android Emulator

1. Install **Android Studio** from https://developer.android.com/studio
2. Open Android Studio
3. Click "AVD Manager" (virtual device icon)
4. Create or select an emulator
5. Click play button to start emulator
6. In Command Prompt:
   ```cmd
   npm run android
   ```

### Test iOS Simulator

**Note:** iOS simulator only works on macOS. If you're on Windows, you can:
- Test on physical iPhone using Expo Go app
- Use a Mac for iOS testing
- Deploy to TestFlight for testing

---

## 🔍 Troubleshooting

### "npm: command not found"

**Solution:** Node.js not installed or not in PATH
1. Install Node.js from https://nodejs.org/
2. **Important:** Check "Add to PATH" during installation
3. Restart Command Prompt
4. Try again

### "eas: command not found"

**Solution:** EAS CLI not installed
```cmd
npm install -g eas-cli
```

### "EXPO_ID not set"

**Solution:** Environment variable not configured
```cmd
set EXPO_ID=your-project-id
```

Or set permanently in System Properties (see above).

### Build Fails with "No credentials found"

**Solution:** EAS credentials not configured
```cmd
eas credentials
```

Follow prompts to set up signing credentials.

### Port Already in Use

**Solution:** Another app using port 19000
```cmd
REM Find and kill process using port 19000
netstat -ano | findstr :19000
taskkill /PID <PID> /F
```

Or use different port:
```cmd
npm start -- --port 19001
```

### "dist directory not found"

**Solution:** Build failed
```cmd
REM Clear cache and rebuild
rmdir /s /q dist
npm run build
```

---

## 📚 Project Structure

```
4psychotic-mobile/
├── app/                          # React Native app code
│   ├── _layout.tsx              # Root navigation
│   ├── screens/                 # App screens
│   │   ├── HomeScreen.tsx
│   │   ├── VideosScreen.tsx
│   │   ├── ProfileScreen.tsx
│   │   └── SettingsScreen.tsx
│   └── lib/                     # Utilities
├── scripts/                      # Deployment scripts
│   ├── deploy.bat               # Master deployment (Windows)
│   ├── deploy-web.bat           # Web deployment (Windows)
│   ├── deploy-ios.bat           # iOS deployment (Windows)
│   ├── deploy-android.bat       # Android deployment (Windows)
│   ├── deploy.sh                # Master deployment (Mac/Linux)
│   ├── deploy-web.sh            # Web deployment (Mac/Linux)
│   ├── deploy-ios.sh            # iOS deployment (Mac/Linux)
│   └── deploy-android.sh        # Android deployment (Mac/Linux)
├── app.json                      # Expo configuration
├── eas.json                      # EAS build profiles
├── package.json                  # Dependencies
├── DEPLOY_GUIDE.md              # Deployment guide
├── DEPLOYMENT_SCRIPTS.md        # Script documentation
└── WINDOWS_SETUP.md             # This file
```

---

## 🎯 Quick Start Checklist

- [ ] Install Node.js
- [ ] Install EAS CLI: `npm install -g eas-cli`
- [ ] Create Expo account at https://expo.dev
- [ ] Login to Expo: `eas login`
- [ ] Extract project files
- [ ] Run: `npm install`
- [ ] Set EXPO_ID environment variable
- [ ] Test web: `npm run web`
- [ ] Test Android: `npm run android` (with emulator)
- [ ] Deploy: `npm run build` then `vercel --prod --cwd dist`

---

## 📞 Getting Help

### Resources

- **Expo Docs:** https://docs.expo.dev
- **EAS Docs:** https://docs.expo.dev/eas
- **React Native:** https://reactnative.dev
- **Node.js:** https://nodejs.org/en/docs/

### Common Issues

1. **Installation Issues:**
   - Restart Command Prompt after installing Node.js
   - Run as Administrator if permission denied
   - Check internet connection

2. **Build Issues:**
   - Clear cache: `npm cache clean --force`
   - Delete node_modules: `rmdir /s /q node_modules`
   - Reinstall: `npm install`

3. **Deployment Issues:**
   - Check logs: `cat logs\deploy_*.log`
   - Verify credentials: `eas credentials`
   - Check Expo dashboard: https://expo.dev/projects

---

## 🔐 Security Notes

### Protect Your Credentials

- Never commit `.env` files to git
- Never share your EXPO_ID publicly
- Keep Apple ID password secure
- Use app-specific passwords for App Store

### Environment Variables

Store sensitive data in environment variables:
```cmd
set EXPO_ID=your-project-id
set YOUTUBE_API_KEY=your-api-key
```

---

## 🚀 Next Steps

1. **Set up your environment:** Follow prerequisites above
2. **Test locally:** `npm run web`
3. **Deploy to web:** `npm run build && vercel --prod --cwd dist`
4. **Deploy to Android:** `eas build --platform android --profile production`
5. **Deploy to iOS:** (macOS only) `eas build --platform ios --profile production`

---

## 📝 Notes for Windows Users

- Use `\` for file paths (e.g., `scripts\deploy.bat`)
- Use `set` instead of `export` for environment variables
- Batch files (`.bat`) are provided for all deployment scripts
- PowerShell users can use bash scripts with WSL (Windows Subsystem for Linux)

---

**Last updated: February 2025**
**Built with ❤️ by Manus**
