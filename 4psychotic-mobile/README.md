# 4psychotic Mobile App

A cross-platform React Native application built with Expo that runs on **web**, **iOS**, and **Android**. Features real-time YouTube live streaming status, video gallery, channel profile, and contact form.

## 🎮 Features

- **Home Screen**: Hero section with live status badge, featured content cards, and about section
- **Videos Screen**: Gallery of gaming highlights with embedded YouTube player in modal
- **Profile Screen**: Channel statistics, social media links, and featured posts
- **Settings Screen**: Contact form with email validation and submission handling
- **Real-time Integration**: YouTube Data API integration for live status detection
- **Bottom Tab Navigation**: Intuitive navigation across all screens
- **Dark Theme**: Neon Brutalism aesthetic with red/teal accents
- **Cross-platform**: Single codebase for web, iOS, and Android

## 🚀 Quick Start

```bash
npm install
npm start
npm run web      # Web
npm run ios      # iOS
npm run android  # Android
```

## 📁 Project Structure

```
app/
├── _layout.tsx              # Root layout with bottom tab navigation
├── screens/
│   ├── HomeScreen.tsx       # Hero, live status, featured content
│   ├── VideosScreen.tsx     # Video gallery with modal player
│   ├── ProfileScreen.tsx    # Channel stats and social links
│   └── SettingsScreen.tsx   # Contact form and app info
├── lib/
│   ├── trpc.ts              # tRPC client setup
│   └── TRPCProvider.tsx     # tRPC context provider
```

## 🔗 Backend Integration

Connected to 4psychotic landing page backend:
- **API**: https://3000-i71gq6sd7bfm36fxu2piq-d8436c31.us1.manus.computer/api/trpc
- **YouTube API**: Real-time live status
- **Contact Form**: Message submission

## 🎨 Design

- Dark Background: #0a0e1a
- Neon Red: #ff1744
- Neon Teal: #00e5ff

## 📦 Building

```bash
# Web
npm run build

# iOS & Android
npm install -g eas-cli
eas build:configure
eas build --platform ios
eas build --platform android
```

© 2025 4psychotic. All rights reserved.
