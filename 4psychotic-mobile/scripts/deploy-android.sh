#!/bin/bash

################################################################################
# 4psychotic - Android Deployment Script
# Builds and submits to Google Play using EAS
#
# Usage:
#   ./scripts/deploy-android.sh [development|preview|production] [--submit]
#
# Examples:
#   ./scripts/deploy-android.sh development
#   ./scripts/deploy-android.sh production --submit
################################################################################

set -e

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Configuration
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOG_FILE="$PROJECT_DIR/logs/android_deploy_${TIMESTAMP}.log"

mkdir -p "$PROJECT_DIR/logs"

# Helper functions
log() {
    echo -e "${BLUE}[$(date +'%H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

success() {
    echo -e "${GREEN}✅ $1${NC}" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}❌ $1${NC}" | tee -a "$LOG_FILE"
    exit 1
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}" | tee -a "$LOG_FILE"
}

# Print header
print_header() {
    echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║${NC}  4psychotic - Android Deployment                       ${BLUE}║${NC}"
    echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        error "Node.js is not installed"
    fi
    success "Node.js found"
    
    # Check EAS CLI
    if ! command -v eas &> /dev/null; then
        warning "EAS CLI not found. Installing..."
        npm install -g eas-cli
    fi
    success "EAS CLI found"
    
    # Check Expo CLI
    if ! command -v expo &> /dev/null; then
        warning "Expo CLI not found. Installing..."
        npm install -g expo-cli
    fi
    success "Expo CLI found"
    
    # Check EXPO_ID
    if [ -z "$EXPO_ID" ]; then
        error "EXPO_ID environment variable not set"
        error "Set with: export EXPO_ID=your-project-id"
    fi
    success "EXPO_ID configured"
    
    # Check Android SDK (optional)
    if command -v adb &> /dev/null; then
        success "Android SDK found"
    else
        warning "Android SDK not found (optional)"
    fi
}

# Validate profile
validate_profile() {
    PROFILE="${1:-production}"
    
    case "$PROFILE" in
        development|preview|production)
            success "Profile: $PROFILE"
            ;;
        *)
            error "Invalid profile: $PROFILE"
            error "Valid options: development, preview, production"
            ;;
    esac
}

# Setup signing credentials
setup_credentials() {
    log "Setting up Android signing credentials..."
    
    # Check if credentials already exist
    if eas credentials --platform android 2>/dev/null | grep -q "Credentials"; then
        success "Credentials already configured"
        return
    fi
    
    log "Configuring new credentials..."
    eas credentials --platform android 2>&1 | tee -a "$LOG_FILE"
    
    success "Credentials configured"
}

# Build for Android
build_android() {
    log "Building for Android ($PROFILE)..."
    
    cd "$PROJECT_DIR"
    
    # Validate app.json
    if [ ! -f "app.json" ]; then
        error "app.json not found"
    fi
    
    log "Starting EAS build..."
    eas build --platform android --profile "$PROFILE" 2>&1 | tee -a "$LOG_FILE"
    
    # Get build ID
    BUILD_ID=$(eas build:list --platform android --limit 1 --json 2>/dev/null | jq -r '.[0].id' 2>/dev/null || echo "")
    
    if [ -z "$BUILD_ID" ]; then
        warning "Could not retrieve build ID"
    else
        success "Android build completed: $BUILD_ID"
        echo "$BUILD_ID" > "$PROJECT_DIR/logs/android_build_id_${TIMESTAMP}.txt"
    fi
}

# Download build
download_build() {
    log "Downloading Android build..."
    
    cd "$PROJECT_DIR"
    
    eas build:download --latest --platform android 2>&1 | tee -a "$LOG_FILE"
    
    # Find downloaded file
    AAB_FILE=$(find . -name "*.aab" -type f -printf '%T@ %p\n' | sort -rn | head -1 | cut -d' ' -f2-)
    APK_FILE=$(find . -name "*.apk" -type f -printf '%T@ %p\n' | sort -rn | head -1 | cut -d' ' -f2-)
    
    if [ -f "$AAB_FILE" ]; then
        success "Build downloaded: $AAB_FILE"
        echo "$AAB_FILE" > "$PROJECT_DIR/logs/android_aab_path_${TIMESTAMP}.txt"
    elif [ -f "$APK_FILE" ]; then
        success "Build downloaded: $APK_FILE"
        echo "$APK_FILE" > "$PROJECT_DIR/logs/android_apk_path_${TIMESTAMP}.txt"
    else
        warning "Could not locate .aab or .apk file"
    fi
}

# Submit to Google Play
submit_to_google_play() {
    log "Submitting to Google Play..."
    
    cd "$PROJECT_DIR"
    
    log "Starting Google Play submission..."
    eas submit --platform android --latest 2>&1 | tee -a "$LOG_FILE"
    
    success "Google Play submission completed"
}

# Test build on emulator
test_on_emulator() {
    log "Testing on Android emulator..."
    
    if ! command -v adb &> /dev/null; then
        warning "Android SDK not found. Skipping emulator test."
        return
    fi
    
    # Check if emulator is running
    if ! adb devices | grep -q "emulator"; then
        warning "No Android emulator running"
        warning "Start emulator: Android Studio → AVD Manager"
        return
    fi
    
    # Find APK file
    APK_FILE=$(find "$PROJECT_DIR" -name "*.apk" -type f -printf '%T@ %p\n' | sort -rn | head -1 | cut -d' ' -f2-)
    
    if [ -z "$APK_FILE" ]; then
        warning "APK file not found"
        return
    fi
    
    log "Installing APK on emulator..."
    adb install -r "$APK_FILE" 2>&1 | tee -a "$LOG_FILE"
    
    success "APK installed on emulator"
}

# Generate deployment report
generate_report() {
    cat > "$PROJECT_DIR/logs/android_deployment_report_${TIMESTAMP}.md" << EOF
# 4psychotic Android Deployment Report

**Date:** $(date)
**Profile:** $PROFILE
**Submit to Google Play:** $SUBMIT_FLAG

## Build Information

- **Platform:** Android
- **Package:** com.psychotic.mobile
- **Profile:** $PROFILE
- **Timestamp:** $TIMESTAMP

## Build Details

### Build ID
$(cat "$PROJECT_DIR/logs/android_build_id_${TIMESTAMP}.txt" 2>/dev/null || echo "Not available")

### Build Files
- **AAB:** $(cat "$PROJECT_DIR/logs/android_aab_path_${TIMESTAMP}.txt" 2>/dev/null || echo "Not available")
- **APK:** $(cat "$PROJECT_DIR/logs/android_apk_path_${TIMESTAMP}.txt" 2>/dev/null || echo "Not available")

## Deployment Status

- **Build:** ✅ Completed
- **Download:** ✅ Completed
- **Google Play:** $([ "$SUBMIT_FLAG" = "true" ] && echo "✅ Submitted" || echo "⏳ Pending")

## Next Steps

### If Not Submitted
1. Review build in Expo dashboard
2. Test on emulator or device
3. Run: \`./scripts/deploy-android.sh $PROFILE --submit\`

### After Submission
1. Monitor Google Play review status
2. Check email for review updates
3. Prepare for release

## Useful Commands

\`\`\`bash
# Check build status
eas build:list --platform android

# View build details
eas build:view --id <build-id>

# Download build
eas build:download --latest --platform android

# Submit to Google Play
eas submit --platform android --latest

# View submission status
eas submit:list --platform android

# Test on emulator
adb install -r app.apk
adb shell am start -n com.psychotic.mobile/.MainActivity
\`\`\`

## Google Play Console

1. Go to https://play.google.com/console
2. Select your app
3. Go to "Internal Testing" to see submitted builds
4. Go to "Production" to manage release

## Troubleshooting

### Build Failed
- Check logs: \`eas build:view --id <build-id> --logs\`
- Verify app.json configuration
- Check signing credentials: \`eas credentials --platform android\`

### Submission Failed
- Verify Google Play Console setup
- Check service account credentials
- Review app requirements and policies

### Signing Issues
- Reset credentials: \`eas credentials --platform android --clear\`
- Reconfigure: \`eas credentials --platform android\`

### Emulator Issues
- Start emulator: Android Studio → AVD Manager
- Check adb: \`adb devices\`
- Reinstall app: \`adb uninstall com.psychotic.mobile && adb install app.apk\`

---
Generated by Android deployment script
EOF
    
    success "Android deployment report: $PROJECT_DIR/logs/android_deployment_report_${TIMESTAMP}.md"
}

# Main execution
main() {
    print_header
    
    validate_profile "$1"
    
    SUBMIT_FLAG="${2:-false}"
    if [ "$2" = "--submit" ]; then
        SUBMIT_FLAG="true"
    fi
    
    log "Starting Android deployment..."
    log "Profile: $PROFILE"
    log "Submit to Google Play: $SUBMIT_FLAG"
    echo ""
    
    check_prerequisites
    echo ""
    
    setup_credentials
    echo ""
    
    build_android
    echo ""
    
    download_build
    echo ""
    
    # Optional: Test on emulator
    if [ "$PROFILE" != "production" ]; then
        log "Attempting emulator test..."
        test_on_emulator
        echo ""
    fi
    
    if [ "$SUBMIT_FLAG" = "true" ]; then
        log "Submitting to Google Play..."
        submit_to_google_play
        echo ""
    else
        warning "Build not submitted to Google Play"
        warning "To submit, run: ./scripts/deploy-android.sh $PROFILE --submit"
        echo ""
    fi
    
    generate_report
    
    echo ""
    success "Android deployment completed!"
    echo ""
}

main "$@"
