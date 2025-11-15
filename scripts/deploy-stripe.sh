#!/bin/bash

# 🚀 DEPLOY COMPLETO STRIPE - Contadores de Elite
# Este script faz o deploy completo da integração Stripe
# Data: 15 de novembro de 2025

set -e  # Exit on error

PROJECT_REF="zytxwdgzjqrcmbnpgofj"
BRANCH="claude/auto-mode-mobile-first-011Qqu5wN96UmLxdioNTka61"

echo "════════════════════════════════════════════════════════"
echo "  🚀 STRIPE DEPLOYMENT - Contadores de Elite"
echo "════════════════════════════════════════════════════════"
echo ""
echo "Project: $PROJECT_REF"
echo "Branch: $BRANCH"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if supabase CLI is installed
echo -e "${BLUE}[1/6]${NC} Verificando Supabase CLI..."
if ! command -v supabase &> /dev/null; then
    echo -e "${RED}✗ Supabase CLI não encontrado!${NC}"
    echo "Instale com: npm install -g supabase"
    exit 1
fi
echo -e "${GREEN}✓ Supabase CLI encontrado${NC}"
echo ""

# Login check
echo -e "${BLUE}[2/6]${NC} Verificando login Supabase..."
if ! supabase projects list &> /dev/null; then
    echo -e "${YELLOW}⚠ Não está logado. Execute:${NC}"
    echo "  supabase login"
    exit 1
fi
echo -e "${GREEN}✓ Login OK${NC}"
echo ""

# Deploy migrations
echo -e "${BLUE}[3/6]${NC} Executando migrations..."
echo "  → 20251115060000_add_stripe_fields_to_pagamentos.sql"
echo "  → 20251115070000_add_stripe_fields_to_clientes.sql"
echo ""
read -p "Deseja executar as migrations? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    supabase db push --project-ref $PROJECT_REF
    echo -e "${GREEN}✓ Migrations executadas${NC}"
else
    echo -e "${YELLOW}⚠ Migrations puladas${NC}"
fi
echo ""

# Deploy edge functions
echo -e "${BLUE}[4/6]${NC} Fazendo deploy das Edge Functions..."
echo ""

# Deploy create-checkout-session
echo "  📦 Deploying create-checkout-session..."
if supabase functions deploy create-checkout-session --project-ref $PROJECT_REF; then
    echo -e "${GREEN}  ✓ create-checkout-session deployed${NC}"
else
    echo -e "${RED}  ✗ Erro ao fazer deploy de create-checkout-session${NC}"
    exit 1
fi
echo ""

# Deploy webhook-stripe
echo "  📦 Deploying webhook-stripe..."
if supabase functions deploy webhook-stripe --project-ref $PROJECT_REF; then
    echo -e "${GREEN}  ✓ webhook-stripe deployed${NC}"
else
    echo -e "${RED}  ✗ Erro ao fazer deploy de webhook-stripe${NC}"
    exit 1
fi
echo ""

# Check environment variables
echo -e "${BLUE}[5/6]${NC} Verificando variáveis de ambiente..."
echo ""
echo -e "${YELLOW}⚠ IMPORTANTE: Verifique se as seguintes variáveis estão configuradas:${NC}"
echo ""
echo "  1. STRIPE_SECRET_KEY=sk_test_... ou sk_live_..."
echo "  2. STRIPE_WEBHOOK_SECRET=whsec_..."
echo "  3. STRIPE_PRICE_ID=price_..."
echo ""
echo "Configure em: https://supabase.com/dashboard/project/$PROJECT_REF/settings/functions"
echo ""
read -p "Variáveis configuradas? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${RED}✗ Configure as variáveis antes de continuar${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Variáveis OK${NC}"
echo ""

# Instructions for Stripe webhook
echo -e "${BLUE}[6/6]${NC} Configuração do Webhook no Stripe..."
echo ""
echo -e "${YELLOW}📋 PRÓXIMOS PASSOS MANUAIS:${NC}"
echo ""
echo "1. Abrir: https://dashboard.stripe.com/webhooks"
echo "2. Clicar em 'Add endpoint'"
echo "3. Endpoint URL:"
echo "   https://$PROJECT_REF.supabase.co/functions/v1/webhook-stripe"
echo ""
echo "4. Selecionar os eventos:"
echo "   ☑ checkout.session.completed"
echo "   ☑ customer.subscription.created"
echo "   ☑ customer.subscription.updated"
echo "   ☑ customer.subscription.deleted"
echo "   ☑ invoice.payment_succeeded"
echo "   ☑ invoice.payment_failed"
echo ""
echo "5. Copiar o 'Signing secret' (whsec_...)"
echo "6. Adicionar como STRIPE_WEBHOOK_SECRET nas variáveis de ambiente"
echo ""

echo "════════════════════════════════════════════════════════"
echo -e "${GREEN}✅ DEPLOY COMPLETO!${NC}"
echo "════════════════════════════════════════════════════════"
echo ""
echo "🧪 Para testar:"
echo "   cd scripts && ./test-stripe-local.sh"
echo ""
echo "📊 Logs das functions:"
echo "   https://supabase.com/dashboard/project/$PROJECT_REF/functions"
echo ""
echo "🎉 Stripe está pronto para uso!"
echo ""
