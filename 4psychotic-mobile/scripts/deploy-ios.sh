#!/bin/bash

################################################################################
# 4psychotic - iOS Deployment Script
# Builds and submits to App Store using EAS
#
# Usage:
#   ./scripts/deploy-ios.sh [development|preview|production] [--submit]
#
# Examples:
#   ./scripts/deploy-ios.sh development
#   ./scripts/deploy-ios.sh production --submit
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
LOG_FILE="$PROJECT_DIR/logs/ios_deploy_${TIMESTAMP}.log"

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
    echo -e "${BLUE}║${NC}  4psychotic - iOS Deployment                           ${BLUE}║${NC}"
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
    
    # Check Xcode (macOS only)
    if [[ "$OSTYPE" == "darwin"* ]]; then
        if ! command -v xcode-select &> /dev/null; then
            warning "Xcode not found. Some features may not work."
        else
            success "Xcode found"
        fi
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
    log "Setting up iOS signing credentials..."
    
    # Check if credentials already exist
    if eas credentials --platform ios 2>/dev/null | grep -q "Credentials"; then
        success "Credentials already configured"
        return
    fi
    
    log "Configuring new credentials..."
    eas credentials --platform ios 2>&1 | tee -a "$LOG_FILE"
    
    success "Credentials configured"
}

# Build for iOS
build_ios() {
    log "Building for iOS ($PROFILE)..."
    
    cd "$PROJECT_DIR"
    
    # Validate app.json
    if [ ! -f "app.json" ]; then
        error "app.json not found"
    fi
    
    log "Starting EAS build..."
    eas build --platform ios --profile "$PROFILE" 2>&1 | tee -a "$LOG_FILE"
    
    # Get build ID
    BUILD_ID=$(eas build:list --platform ios --limit 1 --json 2>/dev/null | jq -r '.[0].id' 2>/dev/null || echo "")
    
    if [ -z "$BUILD_ID" ]; then
        warning "Could not retrieve build ID"
    else
        success "iOS build completed: $BUILD_ID"
        echo "$BUILD_ID" > "$PROJECT_DIR/logs/ios_build_id_${TIMESTAMP}.txt"
    fi
}

# Download build
download_build() {
    log "Downloading iOS build..."
    
    cd "$PROJECT_DIR"
    
    eas build:download --latest --platform ios 2>&1 | tee -a "$LOG_FILE"
    
    # Find downloaded file
    IPA_FILE=$(find . -name "*.ipa" -type f -printf '%T@ %p\n' | sort -rn | head -1 | cut -d' ' -f2-)
    
    if [ -f "$IPA_FILE" ]; then
        success "Build downloaded: $IPA_FILE"
        echo "$IPA_FILE" > "$PROJECT_DIR/logs/ios_ipa_path_${TIMESTAMP}.txt"
    else
        warning "Could not locate .ipa file"
    fi
}

# Submit to App Store
submit_to_app_store() {
    log "Submitting to App Store..."
    
    cd "$PROJECT_DIR"
    
    log "Starting App Store submission..."
    eas submit --platform ios --latest 2>&1 | tee -a "$LOG_FILE"
    
    success "App Store submission completed"
}

# Generate deployment report
generate_report() {
    cat > "$PROJECT_DIR/logs/ios_deployment_report_${TIMESTAMP}.md" << EOF
# 4psychotic iOS Deployment Report

**Date:** $(date)
**Profile:** $PROFILE
**Submit to App Store:** $SUBMIT_FLAG

## Build Information

- **Platform:** iOS
- **Bundle ID:** com.psychotic.mobile
- **Profile:** $PROFILE
- **Timestamp:** $TIMESTAMP

## Build Details

### Build ID
$(cat "$PROJECT_DIR/logs/ios_build_id_${TIMESTAMP}.txt" 2>/dev/null || echo "Not available")

### IPA File
$(cat "$PROJECT_DIR/logs/ios_ipa_path_${TIMESTAMP}.txt" 2>/dev/null || echo "Not available")

## Deployment Status

- **Build:** ✅ Completed
- **Download:** ✅ Completed
- **App Store:** $([ "$SUBMIT_FLAG" = "true" ] && echo "✅ Submitted" || echo "⏳ Pending")

## Next Steps

### If Not Submitted
1. Review build in Expo dashboard
2. Test on device or simulator
3. Run: \`./scripts/deploy-ios.sh $PROFILE --submit\`

### After Submission
1. Monitor App Store review status
2. Check email for review updates
3. Prepare for release

## Useful Commands

\`\`\`bash
# Check build status
eas build:list --platform ios

# View build details
eas build:view --id <build-id>

# Download build
eas build:download --latest --platform ios

# Submit to App Store
eas submit --platform ios --latest

# View submission status
eas submit:list --platform ios
\`\`\`

## App Store Connect

1. Go to https://appstoreconnect.apple.com
2. Select your app
3. Go to "TestFlight" to see submitted builds
4. Go to "App Store" to manage release

## Troubleshooting

### Build Failed
- Check logs: \`eas build:view --id <build-id> --logs\`
- Verify app.json configuration
- Check signing credentials: \`eas credentials --platform ios\`

### Submission Failed
- Verify App Store Connect setup
- Check Apple ID credentials
- Review app requirements and guidelines

### Code Signing Issues
- Reset credentials: \`eas credentials --platform ios --clear\`
- Reconfigure: \`eas credentials --platform ios\`

---
Generated by iOS deployment script
EOF
    
    success "iOS deployment report: $PROJECT_DIR/logs/ios_deployment_report_${TIMESTAMP}.md"
}

# Main execution
main() {
    print_header
    
    validate_profile "$1"
    
    SUBMIT_FLAG="${2:-false}"
    if [ "$2" = "--submit" ]; then
        SUBMIT_FLAG="true"
    fi
    
    log "Starting iOS deployment..."
    log "Profile: $PROFILE"
    log "Submit to App Store: $SUBMIT_FLAG"
    echo ""
    
    check_prerequisites
    echo ""
    
    setup_credentials
    echo ""
    
    build_ios
    echo ""
    
    download_build
    echo ""
    
    if [ "$SUBMIT_FLAG" = "true" ]; then
        log "Submitting to App Store..."
        submit_to_app_store
        echo ""
    else
        warning "Build not submitted to App Store"
        warning "To submit, run: ./scripts/deploy-ios.sh $PROFILE --submit"
        echo ""
    fi
    
    generate_report
    
    echo ""
    success "iOS deployment completed!"
    echo ""
}

main "$@"
