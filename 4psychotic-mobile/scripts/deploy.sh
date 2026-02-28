#!/bin/bash

################################################################################
# 4psychotic Mobile App - Master Deployment Script
# Deploys to Web, iOS, and Android with a single command
#
# Usage:
#   ./scripts/deploy.sh [web|ios|android|all] [development|preview|production]
#
# Examples:
#   ./scripts/deploy.sh web production
#   ./scripts/deploy.sh ios production
#   ./scripts/deploy.sh android production
#   ./scripts/deploy.sh all production
################################################################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="4psychotic"
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOG_FILE="$PROJECT_DIR/logs/deploy_${TIMESTAMP}.log"
DIST_DIR="$PROJECT_DIR/dist"

# Create logs directory
mkdir -p "$PROJECT_DIR/logs"

# Helper functions
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

success() {
    echo -e "${GREEN}✅ $1${NC}" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}❌ $1${NC}" | tee -a "$LOG_FILE"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}" | tee -a "$LOG_FILE"
}

# Print header
print_header() {
    echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║${NC}  4psychotic Mobile App - Deployment Script             ${BLUE}║${NC}"
    echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        error "Node.js is not installed"
        exit 1
    fi
    success "Node.js $(node --version) found"
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        error "npm is not installed"
        exit 1
    fi
    success "npm $(npm --version) found"
    
    # Check EAS CLI for mobile builds
    if [[ "$PLATFORM" != "web" ]]; then
        if ! command -v eas &> /dev/null; then
            warning "EAS CLI not found. Installing..."
            npm install -g eas-cli
        fi
        success "EAS CLI $(eas --version) found"
    fi
    
    # Check Expo CLI
    if ! command -v expo &> /dev/null; then
        warning "Expo CLI not found. Installing..."
        npm install -g expo-cli
    fi
    success "Expo CLI found"
    
    # Check EXPO_ID for mobile builds
    if [[ "$PLATFORM" != "web" ]]; then
        if [ -z "$EXPO_ID" ]; then
            error "EXPO_ID environment variable not set"
            error "Please set: export EXPO_ID=your-project-id"
            exit 1
        fi
        success "EXPO_ID configured: $EXPO_ID"
    fi
}

# Validate inputs
validate_inputs() {
    if [ $# -lt 1 ]; then
        error "Missing platform argument"
        echo "Usage: $0 [web|ios|android|all] [development|preview|production]"
        exit 1
    fi
    
    PLATFORM="$1"
    PROFILE="${2:-production}"
    
    case "$PLATFORM" in
        web|ios|android|all)
            success "Platform: $PLATFORM"
            ;;
        *)
            error "Invalid platform: $PLATFORM"
            error "Valid options: web, ios, android, all"
            exit 1
            ;;
    esac
    
    case "$PROFILE" in
        development|preview|production)
            success "Profile: $PROFILE"
            ;;
        *)
            error "Invalid profile: $PROFILE"
            error "Valid options: development, preview, production"
            exit 1
            ;;
    esac
}

# Deploy to web
deploy_web() {
    log "Starting web deployment..."
    
    cd "$PROJECT_DIR"
    
    log "Building web app..."
    npm run build 2>&1 | tee -a "$LOG_FILE"
    
    if [ ! -d "$DIST_DIR" ]; then
        error "Build failed: dist directory not found"
        exit 1
    fi
    
    success "Web build completed: $DIST_DIR"
    
    # Check for deployment tool
    if command -v vercel &> /dev/null; then
        log "Deploying to Vercel..."
        cd "$DIST_DIR"
        vercel --prod 2>&1 | tee -a "$LOG_FILE"
        success "Vercel deployment completed"
    elif command -v netlify &> /dev/null; then
        log "Deploying to Netlify..."
        cd "$DIST_DIR"
        netlify deploy --prod --dir . 2>&1 | tee -a "$LOG_FILE"
        success "Netlify deployment completed"
    else
        warning "Neither Vercel nor Netlify CLI found"
        warning "Manual deployment required:"
        warning "  Upload contents of $DIST_DIR to your web host"
    fi
    
    cd "$PROJECT_DIR"
}

# Deploy to iOS
deploy_ios() {
    log "Starting iOS deployment..."
    
    cd "$PROJECT_DIR"
    
    log "Building for iOS ($PROFILE)..."
    
    if [ "$PROFILE" = "production" ]; then
        eas build --platform ios --profile production 2>&1 | tee -a "$LOG_FILE"
        BUILD_ID=$(eas build:list --platform ios --limit 1 --json | jq -r '.[0].id')
        success "iOS production build completed: $BUILD_ID"
        
        log "Submitting to App Store..."
        eas submit --platform ios --latest 2>&1 | tee -a "$LOG_FILE"
        success "iOS App Store submission completed"
    else
        eas build --platform ios --profile "$PROFILE" 2>&1 | tee -a "$LOG_FILE"
        BUILD_ID=$(eas build:list --platform ios --limit 1 --json | jq -r '.[0].id')
        success "iOS $PROFILE build completed: $BUILD_ID"
        
        log "Downloading build..."
        eas build:download --latest --platform ios 2>&1 | tee -a "$LOG_FILE"
        success "iOS build downloaded"
    fi
}

# Deploy to Android
deploy_android() {
    log "Starting Android deployment..."
    
    cd "$PROJECT_DIR"
    
    log "Building for Android ($PROFILE)..."
    
    if [ "$PROFILE" = "production" ]; then
        eas build --platform android --profile production 2>&1 | tee -a "$LOG_FILE"
        BUILD_ID=$(eas build:list --platform android --limit 1 --json | jq -r '.[0].id')
        success "Android production build completed: $BUILD_ID"
        
        log "Submitting to Google Play..."
        eas submit --platform android --latest 2>&1 | tee -a "$LOG_FILE"
        success "Android Google Play submission completed"
    else
        eas build --platform android --profile "$PROFILE" 2>&1 | tee -a "$LOG_FILE"
        BUILD_ID=$(eas build:list --platform android --limit 1 --json | jq -r '.[0].id')
        success "Android $PROFILE build completed: $BUILD_ID"
        
        log "Downloading build..."
        eas build:download --latest --platform android 2>&1 | tee -a "$LOG_FILE"
        success "Android build downloaded"
    fi
}

# Deploy all platforms
deploy_all() {
    log "Starting multi-platform deployment..."
    
    log "Building for all platforms ($PROFILE)..."
    eas build --platform all --profile "$PROFILE" 2>&1 | tee -a "$LOG_FILE"
    
    success "All platform builds completed"
    
    if [ "$PROFILE" = "production" ]; then
        log "Submitting to app stores..."
        eas submit --platform all --latest 2>&1 | tee -a "$LOG_FILE"
        success "All app store submissions completed"
    fi
}

# Generate deployment report
generate_report() {
    local report_file="$PROJECT_DIR/logs/deployment_report_${TIMESTAMP}.md"
    
    cat > "$report_file" << EOF
# 4psychotic Deployment Report

**Date:** $(date)
**Platform:** $PLATFORM
**Profile:** $PROFILE
**Status:** Success ✅

## Build Information

- **Project:** $PROJECT_NAME
- **Directory:** $PROJECT_DIR
- **Log File:** $LOG_FILE

## Deployment Details

### Web
- Build Output: $DIST_DIR
- Status: Completed

### iOS
- Profile: $PROFILE
- Status: Completed

### Android
- Profile: $PROFILE
- Status: Completed

## Next Steps

1. Monitor app store submissions
2. Check build status: \`eas build:list\`
3. View logs: \`tail -f $LOG_FILE\`
4. For issues: Check DEPLOY_GUIDE.md

## Useful Commands

\`\`\`bash
# Check build status
eas build:list

# View specific build
eas build:view --id <build-id>

# Download build
eas build:download --latest --platform ios

# Submit to stores
eas submit --platform ios --latest
eas submit --platform android --latest

# Create OTA update
eas update --branch production

# Rollback update
eas update:rollback --branch production
\`\`\`

---
Generated by deployment script
EOF
    
    success "Deployment report: $report_file"
}

# Main execution
main() {
    print_header
    
    validate_inputs "$@"
    check_prerequisites
    
    log "Deployment started for platform: $PLATFORM (profile: $PROFILE)"
    log "Log file: $LOG_FILE"
    echo ""
    
    case "$PLATFORM" in
        web)
            deploy_web
            ;;
        ios)
            deploy_ios
            ;;
        android)
            deploy_android
            ;;
        all)
            deploy_all
            ;;
    esac
    
    echo ""
    generate_report
    
    echo ""
    success "Deployment completed successfully!"
    echo ""
    log "Summary:"
    log "  Platform: $PLATFORM"
    log "  Profile: $PROFILE"
    log "  Log: $LOG_FILE"
    echo ""
}

# Run main function
main "$@"
