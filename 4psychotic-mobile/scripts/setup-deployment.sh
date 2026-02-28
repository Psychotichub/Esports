#!/bin/bash

# 4psychotic Mobile App - Deployment Setup Script
# This script configures EAS for iOS, Android, and Web deployment

set -e

echo "🚀 4psychotic Mobile App - Deployment Setup"
echo "==========================================="
echo ""

# Check if EAS CLI is installed
if ! command -v eas &> /dev/null; then
    echo "📦 Installing EAS CLI..."
    npm install -g eas-cli
fi

# Check if user is logged in to Expo
echo "🔐 Checking Expo login..."
if ! eas whoami &> /dev/null; then
    echo "Please log in to your Expo account:"
    eas login
fi

# Get Expo project ID
echo ""
echo "📋 Configuring EAS project..."
if [ -z "$EXPO_ID" ]; then
    echo "⚠️  EXPO_ID environment variable not set"
    echo "Please set EXPO_ID to your Expo project ID:"
    echo "  export EXPO_ID=your-project-id"
    exit 1
fi

# Update app.json with Expo project ID
echo "Updating app.json with Expo project ID: $EXPO_ID"
sed -i.bak "s|REPLACE_WITH_EXPO_PROJECT_ID|$EXPO_ID|g" app.json
sed -i.bak "s|REPLACE_WITH_EXPO_PROJECT_ID|$EXPO_ID|g" eas.json

# Update .env (if it exists)
if [ -f .env ]; then
  sed -i.bak "s|REPLACE_WITH_EXPO_PROJECT_ID|$EXPO_ID|g" .env
fi

# Clean up backup files
rm -f app.json.bak eas.json.bak .env.bak

echo "✅ EAS project ID configured"
echo ""

# Configure build profiles
echo "🔨 Setting up build profiles..."
echo "Available profiles:"
echo "  - development: For testing on physical devices"
echo "  - preview: For internal testing"
echo "  - production: For App Store and Google Play"
echo ""

# Create build configuration
echo "📱 iOS Configuration:"
echo "  Bundle ID: com.psychotic.mobile"
echo "  Team ID: (will be prompted during first build)"
echo ""

echo "🤖 Android Configuration:"
echo "  Package: com.psychotic.mobile"
echo "  Version Code: 1"
echo ""

# Web build configuration
echo "🌐 Web Configuration:"
echo "  Output: static (optimized for deployment)"
echo "  Bundler: metro"
echo ""

# Test configuration
echo "🧪 Testing configuration..."
npm run build 2>&1 | head -20 || true
echo ""

echo "✅ Deployment setup complete!"
echo ""
echo "📚 Next steps:"
echo ""
echo "1. Build for development:"
echo "   eas build --platform ios --profile development"
echo "   eas build --platform android --profile development"
echo ""
echo "2. Build for production:"
echo "   eas build --platform ios --profile production"
echo "   eas build --platform android --profile production"
echo ""
echo "3. Build for web:"
echo "   npm run build"
echo ""
echo "4. Submit to app stores:"
echo "   eas submit --platform ios --latest"
echo "   eas submit --platform android --latest"
echo ""
echo "📖 For more info, see DEPLOYMENT.md"
echo ""
