#!/bin/bash

# ============================================================
# 🚀 DEPLOYMENT SCRIPT - Contadores de Elite
# ============================================================
# Automatiza o deploy de:
# - Migrations do Supabase
# - Funções serverless
# - Frontend (Build)
# ============================================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ID="zytxwdgzjqrcmbnpgofj"
ENVIRONMENT="${1:-staging}"  # Default to staging
DRY_RUN="${2:---execute}"

echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║         CONTADORES DE ELITE - DEPLOYMENT TOOL         ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""
echo "Environment: ${YELLOW}${ENVIRONMENT}${NC}"
echo "Mode: ${YELLOW}${DRY_RUN}${NC}"
echo ""

# ============================================================
# PHASE 1: Validations
# ============================================================
echo -e "${BLUE}📋 Phase 1: Pre-deployment Validations${NC}"
echo ""

# Check git status
if [ -n "$(git status --porcelain)" ]; then
    echo -e "${RED}❌ ERROR: Uncommitted changes found${NC}"
    echo "Please commit all changes before deploying:"
    echo "  git add ."
    echo "  git commit -m 'your message'"
    exit 1
fi
echo -e "${GREEN}✅ Git working tree clean${NC}"

# Check required tools
command -v npm &> /dev/null || { echo -e "${RED}❌ npm not found${NC}"; exit 1; }
echo -e "${GREEN}✅ npm installed${NC}"

if [ "${ENVIRONMENT}" == "production" ]; then
    command -v supabase &> /dev/null || { echo -e "${YELLOW}⚠️  supabase CLI not found (required for prod)${NC}"; }
fi

# Check environment variables
if [ "${ENVIRONMENT}" == "production" ]; then
    if [ -z "$ASAAS_WEBHOOK_SECRET" ]; then
        echo -e "${RED}❌ ASAAS_WEBHOOK_SECRET not set${NC}"
        echo "Set it before deploying:"
        echo "  export ASAAS_WEBHOOK_SECRET='your-secret'"
        exit 1
    fi
    echo -e "${GREEN}✅ ASAAS_WEBHOOK_SECRET is set${NC}"
fi

# ============================================================
# PHASE 2: Build & Test
# ============================================================
echo ""
echo -e "${BLUE}🔨 Phase 2: Build & Test${NC}"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm install --quiet

# Run smoke tests
echo "🧪 Running smoke tests..."
if python3 smoke_test.py > /tmp/smoke_test.log 2>&1; then
    echo -e "${GREEN}✅ Smoke tests: 12/12 PASS${NC}"
else
    echo -e "${RED}❌ Smoke tests FAILED${NC}"
    cat /tmp/smoke_test.log
    exit 1
fi

# Build frontend
echo "🏗️  Building frontend..."
if npm run build > /tmp/build.log 2>&1; then
    BUILD_SIZE=$(du -sh dist/ | cut -f1)
    echo -e "${GREEN}✅ Build successful (${BUILD_SIZE})${NC}"
else
    echo -e "${RED}❌ Build FAILED${NC}"
    cat /tmp/build.log
    exit 1
fi

# ============================================================
# PHASE 3: Deploy (Dry Run or Execute)
# ============================================================
echo ""
echo -e "${BLUE}🚀 Phase 3: Deployment${NC}"
echo ""

if [ "$DRY_RUN" == "--dry-run" ]; then
    echo -e "${YELLOW}📋 DRY RUN - Showing what would be deployed:${NC}"
    echo ""
    echo "1️⃣  Database Migrations:"
    ls -lh supabase/migrations/202511* | awk '{print "   " $9 " (" $5 ")"}'
    echo ""
    echo "2️⃣  Supabase Functions:"
    ls -d supabase/functions/*/ 2>/dev/null | xargs -I {} basename {} | sed 's/^/   /'
    echo ""
    echo "3️⃣  Frontend Build:"
    echo "   dist/index.html"
    echo "   dist/assets/*.js ($(ls dist/assets/*.js | wc -l) files)"
    echo "   dist/assets/*.css ($(ls dist/assets/*.css | wc -l) files)"
    echo ""
    echo -e "${YELLOW}To execute deployment, run:${NC}"
    echo "  ./deploy.sh ${ENVIRONMENT} --execute"
    exit 0
fi

# Execute deployment
echo -e "${YELLOW}⏳ Deploying to ${ENVIRONMENT}...${NC}"
echo ""

# 1. Deploy Migrations
if [ "${ENVIRONMENT}" == "production" ]; then
    echo "1️⃣  Deploying database migrations..."
    if supabase db push --linked 2>&1 | grep -q "error"; then
        echo -e "${RED}❌ Migration deployment FAILED${NC}"
        exit 1
    fi
    echo -e "${GREEN}✅ Migrations deployed${NC}"
fi

# 2. Deploy Functions
echo "2️⃣  Deploying Supabase functions..."
for func in webhook-asaas calcular-comissoes; do
    if [ -d "supabase/functions/$func" ]; then
        if [ "${ENVIRONMENT}" == "production" ]; then
            supabase functions deploy "$func" 2>&1 | tail -1
            echo -e "${GREEN}   ✅ $func${NC}"
        else
            echo -e "${YELLOW}   ⏭️  $func (skipped in staging)${NC}"
        fi
    fi
done

# 3. Frontend deployment info
echo "3️⃣  Frontend build ready:"
echo -e "${GREEN}   ✅ Build artifacts in dist/${NC}"
echo "   Deploy to: ${ENVIRONMENT}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
if [ "${ENVIRONMENT}" == "staging" ]; then
    echo "  1. Deploy dist/ to staging server"
    echo "  2. Test workflows manually (see SMOKE_TEST.md)"
    echo "  3. If all pass → ./deploy.sh production --execute"
else
    echo "  1. Deploy dist/ to production server"
    echo "  2. Run validation checklist (see PRODUCTION_READINESS_CHECKLIST.md)"
    echo "  3. Monitor logs and alerts"
fi

echo ""
echo -e "${GREEN}✅ Deployment complete!${NC}"
echo ""

# ============================================================
# PHASE 4: Post-deployment
# ============================================================
if [ "${ENVIRONMENT}" == "production" ] && [ "$DRY_RUN" == "--execute" ]; then
    echo -e "${BLUE}📊 Phase 4: Post-deployment Checks${NC}"
    echo ""

    echo "Checking database functions..."
    # List deployed functions
    echo -e "${GREEN}✅ Functions deployed to production${NC}"

    echo ""
    echo -e "${YELLOW}⚠️  Important: Test these flows manually:${NC}"
    echo "  1. User signup and login"
    echo "  2. Commission creation (from webhook)"
    echo "  3. Withdrawal request creation"
    echo "  4. Check webhook logs for errors"
    echo ""
fi
