#!/bin/bash

################################################################################
# 4psychotic - Web Deployment Script
# Builds and deploys to Vercel, Netlify, or self-hosted
#
# Usage:
#   ./scripts/deploy-web.sh [vercel|netlify|s3|manual] [--prod]
#
# Examples:
#   ./scripts/deploy-web.sh vercel --prod
#   ./scripts/deploy-web.sh netlify --prod
#   ./scripts/deploy-web.sh s3 --prod
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
DIST_DIR="$PROJECT_DIR/dist"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOG_FILE="$PROJECT_DIR/logs/web_deploy_${TIMESTAMP}.log"

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
    echo -e "${BLUE}║${NC}  4psychotic - Web Deployment                           ${BLUE}║${NC}"
    echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

# Build web app
build_web() {
    log "Building web application..."
    cd "$PROJECT_DIR"
    
    # Clean previous build
    rm -rf "$DIST_DIR"
    
    # Run build
    npm run build 2>&1 | tee -a "$LOG_FILE"
    
    if [ ! -d "$DIST_DIR" ]; then
        error "Build failed: dist directory not created"
    fi
    
    # Get build size
    BUILD_SIZE=$(du -sh "$DIST_DIR" | cut -f1)
    success "Web build completed ($BUILD_SIZE)"
}

# Deploy to Vercel
deploy_vercel() {
    log "Deploying to Vercel..."
    
    if ! command -v vercel &> /dev/null; then
        warning "Vercel CLI not found. Installing..."
        npm install -g vercel
    fi
    
    cd "$DIST_DIR"
    
    if [ "$PROD_FLAG" = "true" ]; then
        log "Production deployment..."
        vercel --prod --yes 2>&1 | tee -a "$LOG_FILE"
        success "Production deployment to Vercel completed"
    else
        log "Preview deployment..."
        vercel --yes 2>&1 | tee -a "$LOG_FILE"
        success "Preview deployment to Vercel completed"
    fi
    
    cd "$PROJECT_DIR"
}

# Deploy to Netlify
deploy_netlify() {
    log "Deploying to Netlify..."
    
    if ! command -v netlify &> /dev/null; then
        warning "Netlify CLI not found. Installing..."
        npm install -g netlify-cli
    fi
    
    cd "$DIST_DIR"
    
    if [ "$PROD_FLAG" = "true" ]; then
        log "Production deployment..."
        netlify deploy --prod --dir . 2>&1 | tee -a "$LOG_FILE"
        success "Production deployment to Netlify completed"
    else
        log "Preview deployment..."
        netlify deploy --dir . 2>&1 | tee -a "$LOG_FILE"
        success "Preview deployment to Netlify completed"
    fi
    
    cd "$PROJECT_DIR"
}

# Deploy to AWS S3
deploy_s3() {
    log "Deploying to AWS S3..."
    
    if ! command -v aws &> /dev/null; then
        error "AWS CLI not found. Install with: pip install awscli"
    fi
    
    # Get S3 bucket from environment or prompt
    if [ -z "$S3_BUCKET" ]; then
        read -p "Enter S3 bucket name: " S3_BUCKET
    fi
    
    if [ -z "$AWS_REGION" ]; then
        AWS_REGION="us-east-1"
    fi
    
    log "Uploading to s3://$S3_BUCKET..."
    
    aws s3 sync "$DIST_DIR" "s3://$S3_BUCKET/" \
        --region "$AWS_REGION" \
        --delete \
        --cache-control "public, max-age=3600" \
        2>&1 | tee -a "$LOG_FILE"
    
    success "S3 deployment completed"
    
    # Invalidate CloudFront if configured
    if [ ! -z "$CLOUDFRONT_DISTRIBUTION_ID" ]; then
        log "Invalidating CloudFront cache..."
        aws cloudfront create-invalidation \
            --distribution-id "$CLOUDFRONT_DISTRIBUTION_ID" \
            --paths "/*" \
            2>&1 | tee -a "$LOG_FILE"
        success "CloudFront cache invalidated"
    fi
}

# Manual deployment instructions
deploy_manual() {
    echo ""
    echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║${NC}  Manual Deployment Instructions                        ${BLUE}║${NC}"
    echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    
    echo "Build directory: $DIST_DIR"
    echo ""
    echo "Option 1: SCP to Server"
    echo "  scp -r $DIST_DIR/* user@server:/var/www/4psychotic"
    echo ""
    echo "Option 2: Rsync to Server"
    echo "  rsync -avz $DIST_DIR/ user@server:/var/www/4psychotic/"
    echo ""
    echo "Option 3: Docker"
    echo "  docker build -t 4psychotic:latest ."
    echo "  docker push your-registry/4psychotic:latest"
    echo ""
    echo "Option 4: FTP"
    echo "  ftp user@ftp-server"
    echo "  cd /public_html"
    echo "  mput $DIST_DIR/*"
    echo ""
    
    success "Build ready for manual deployment"
}

# Generate deployment summary
generate_summary() {
    local provider="$1"
    
    cat > "$PROJECT_DIR/logs/web_deployment_summary_${TIMESTAMP}.md" << EOF
# 4psychotic Web Deployment Summary

**Date:** $(date)
**Provider:** $provider
**Build Size:** $(du -sh "$DIST_DIR" | cut -f1)
**Files:** $(find "$DIST_DIR" -type f | wc -l)

## Build Information

- **Output Directory:** $DIST_DIR
- **Log File:** $LOG_FILE

## Deployment Details

### Provider: $provider
- **Production:** $PROD_FLAG
- **Timestamp:** $TIMESTAMP

## Performance Metrics

\`\`\`
$(cd "$DIST_DIR" && find . -type f -exec wc -c {} + | sort -rn | head -10)
\`\`\`

## Next Steps

1. Verify deployment at your domain
2. Test all functionality
3. Monitor performance
4. Set up analytics

## Rollback Instructions

### Vercel
\`\`\`bash
vercel rollback
\`\`\`

### Netlify
\`\`\`bash
netlify deploy --prod --dir $DIST_DIR
\`\`\`

### S3
\`\`\`bash
aws s3 sync s3://$S3_BUCKET/ . --delete
\`\`\`

---
Generated by web deployment script
EOF
    
    success "Deployment summary: $PROJECT_DIR/logs/web_deployment_summary_${TIMESTAMP}.md"
}

# Validate inputs
validate_inputs() {
    PROVIDER="${1:-manual}"
    PROD_FLAG="${2:-false}"
    
    if [ "$2" = "--prod" ]; then
        PROD_FLAG="true"
    fi
    
    case "$PROVIDER" in
        vercel|netlify|s3|manual)
            success "Provider: $PROVIDER"
            ;;
        *)
            error "Invalid provider: $PROVIDER"
            error "Valid options: vercel, netlify, s3, manual"
            ;;
    esac
}

# Main execution
main() {
    print_header
    
    validate_inputs "$@"
    
    log "Starting web deployment..."
    log "Provider: $PROVIDER"
    log "Production: $PROD_FLAG"
    echo ""
    
    build_web
    echo ""
    
    case "$PROVIDER" in
        vercel)
            deploy_vercel
            ;;
        netlify)
            deploy_netlify
            ;;
        s3)
            deploy_s3
            ;;
        manual)
            deploy_manual
            ;;
    esac
    
    echo ""
    generate_summary "$PROVIDER"
    
    echo ""
    success "Web deployment process completed!"
    echo ""
}

main "$@"
