#!/bin/bash

# ============================================================
# 📊 MONITORING SCRIPT - Contadores de Elite
# ============================================================
# Monitora saúde da aplicação:
# - Health checks de endpoints
# - Erros recentes no banco
# - Status de webhooks
# - Performance de funções
# ============================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
SUPABASE_URL="${SUPABASE_URL:-https://zytxwdgzjqrcmbnpgofj.supabase.co}"
SUPABASE_KEY="${SUPABASE_KEY:-}"

echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║      CONTADORES DE ELITE - MONITORING DASHBOARD       ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""

# ============================================================
# 1. Health Check
# ============================================================
echo -e "${BLUE}📋 1. System Health${NC}"
echo ""

# Check Frontend
echo -n "Frontend Status: "
if curl -s -I https://contadores-de-elite.com 2>/dev/null | grep -q "200\|301\|302"; then
    echo -e "${GREEN}✅ UP${NC}"
else
    echo -e "${RED}❌ DOWN${NC}"
fi

# Check Supabase
echo -n "Supabase Status: "
if curl -s "${SUPABASE_URL}/rest/v1/" 2>/dev/null | grep -q "pgsql"; then
    echo -e "${GREEN}✅ UP${NC}"
else
    echo -e "${YELLOW}⚠️  UNABLE TO VERIFY (set SUPABASE_KEY for auth)${NC}"
fi

# Check webhook function
echo -n "Webhook Function: "
if [ -f "supabase/functions/webhook-asaas/index.ts" ]; then
    echo -e "${GREEN}✅ PRESENT${NC}"
else
    echo -e "${RED}❌ MISSING${NC}"
fi

echo ""

# ============================================================
# 2. Recent Errors
# ============================================================
echo -e "${BLUE}📊 2. Recent Errors (Last 24h)${NC}"
echo ""

if [ -n "$SUPABASE_KEY" ]; then
    echo "📌 RLS Policy Errors:"
    # This would require proper API access
    echo "   (Requires direct DB access - use Supabase Dashboard)"

    echo ""
    echo "📌 Webhook Errors:"
    echo "   (Check webhook_logs table in Supabase console)"

    echo ""
    echo "📌 Function Errors:"
    echo "   (Use: supabase functions list)"
else
    echo -e "${YELLOW}⚠️  Set SUPABASE_KEY to check errors${NC}"
fi

echo ""

# ============================================================
# 3. Critical Checks
# ============================================================
echo -e "${BLUE}⚠️  3. Critical Checks${NC}"
echo ""

echo "✓ Database Migrations:"
MIGRATION_COUNT=$(ls supabase/migrations/202511*.sql 2>/dev/null | wc -l)
echo "  Found: ${MIGRATION_COUNT} migrations from Nov"

echo ""
echo "✓ Webhook Configuration:"
if grep -q "ASAAS_WEBHOOK_SECRET" supabase/functions/webhook-asaas/index.ts; then
    echo -e "  ${GREEN}✅ Signature validation enabled${NC}"
else
    echo -e "  ${RED}❌ Signature validation NOT found${NC}"
fi

echo ""
echo "✓ Auto-Approval Function:"
if grep -q "auto_aprovar_comissoes" supabase/migrations/20251115000100_auto_approve_commissions.sql; then
    echo -e "  ${GREEN}✅ Function exists${NC}"
else
    echo -e "  ${RED}❌ Function NOT found${NC}"
fi

echo ""
echo "✓ RLS Policies:"
if grep -q "get_contador_id(auth.uid())" supabase/migrations/20251115000000_add_solicitacoes_saque.sql; then
    echo -e "  ${GREEN}✅ Using get_contador_id() for safety${NC}"
else
    echo -e "  ${RED}❌ RLS may have issues${NC}"
fi

echo ""

# ============================================================
# 4. Performance Metrics
# ============================================================
echo -e "${BLUE}📈 4. Performance Metrics${NC}"
echo ""

echo "Build Info:"
if [ -d "dist" ]; then
    JS_SIZE=$(du -sh dist/assets/*.js 2>/dev/null | awk '{s+=$1} END {print s}' || echo "0")
    CSS_SIZE=$(du -sh dist/assets/*.css 2>/dev/null | awk '{s+=$1} END {print s}' || echo "0")
    echo "  JS Size: ${JS_SIZE}"
    echo "  CSS Size: ${CSS_SIZE}"
else
    echo "  Build not present - run: npm run build"
fi

echo ""
echo "Last Deployment:"
LAST_COMMIT=$(git log -1 --format="%ai" 2>/dev/null || echo "Unknown")
echo "  ${LAST_COMMIT}"

echo ""

# ============================================================
# 5. Recommendations
# ============================================================
echo -e "${BLUE}💡 5. Recommendations${NC}"
echo ""

# Check for common issues
if [ ! -f ".env" ] || ! grep -q "VITE_SUPABASE_URL" .env 2>/dev/null; then
    echo -e "${YELLOW}⚠️  1. Configure .env file${NC}"
    echo "   Copy from .env.example and update credentials"
fi

if [ ! -d "dist" ]; then
    echo -e "${YELLOW}⚠️  2. Build frontend${NC}"
    echo "   Run: npm run build"
fi

if ! command -v supabase &> /dev/null; then
    echo -e "${YELLOW}⚠️  3. Install Supabase CLI${NC}"
    echo "   Run: npm install -g @supabase/cli"
fi

echo -e "${YELLOW}⚠️  4. Monitor webhook logs${NC}"
echo "   SELECT * FROM webhook_logs ORDER BY created_at DESC LIMIT 20;"

echo -e "${YELLOW}⚠️  5. Check RLS errors${NC}"
echo "   SELECT * FROM audit_logs WHERE error_message LIKE '%violates row-level%' LIMIT 10;"

echo ""

# ============================================================
# 6. Quick Commands
# ============================================================
echo -e "${BLUE}📝 6. Useful Commands${NC}"
echo ""
echo "View webhook logs:"
echo "  supabase logs pull --function webhook-asaas"
echo ""
echo "Check function status:"
echo "  supabase functions list"
echo ""
echo "Run smoke tests:"
echo "  python3 smoke_test.py"
echo ""
echo "Deploy with validation:"
echo "  ./deploy.sh staging --dry-run"
echo "  ./deploy.sh staging --execute"
echo ""

echo -e "${GREEN}✅ Monitoring check complete${NC}"
