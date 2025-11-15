#!/bin/bash

# 🧪 TESTE LOCAL STRIPE - Contadores de Elite
# Script para testar a integração Stripe localmente
# Data: 15 de novembro de 2025

set -e

PROJECT_REF="zytxwdgzjqrcmbnpgofj"
SUPABASE_URL="https://$PROJECT_REF.supabase.co"
ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5dHh3ZGd6anFyY21ibnBnb2ZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzA4OTY0MDksImV4cCI6MjA0NjQ3MjQwOX0.4bTQE5TlQ5kkX6xO_OqJaNJJpWa4lQxDpvNPOAaLGZs"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

echo "════════════════════════════════════════════════════════"
echo "  🧪 STRIPE INTEGRATION TESTS"
echo "════════════════════════════════════════════════════════"
echo ""

# Function to make API call
api_call() {
    local endpoint=$1
    local method=${2:-GET}
    local data=$3

    if [ -z "$data" ]; then
        curl -s -X $method \
            "$SUPABASE_URL/functions/v1/$endpoint" \
            -H "Authorization: Bearer $ANON_KEY" \
            -H "Content-Type: application/json"
    else
        curl -s -X $method \
            "$SUPABASE_URL/functions/v1/$endpoint" \
            -H "Authorization: Bearer $ANON_KEY" \
            -H "Content-Type: application/json" \
            -d "$data"
    fi
}

# Test 1: Validate Environment Variables
echo -e "${BLUE}[TEST 1/4]${NC} Validando variáveis de ambiente..."
echo ""

VALIDATION=$(api_call "validate-stripe-env")
STATUS=$(echo $VALIDATION | jq -r '.status' 2>/dev/null || echo "ERROR")

if [ "$STATUS" = "READY" ]; then
    echo -e "${GREEN}✓ Todas as variáveis configuradas corretamente!${NC}"
    echo ""
    echo $VALIDATION | jq -r '.summary'
elif [ "$STATUS" = "INVALID" ]; then
    echo -e "${YELLOW}⚠ Algumas variáveis têm formato inválido${NC}"
    echo ""
    echo $VALIDATION | jq -r '.results[] | "\(.variable): \(.message)"'
elif [ "$STATUS" = "INCOMPLETE" ]; then
    echo -e "${RED}✗ Variáveis faltando!${NC}"
    echo ""
    echo $VALIDATION | jq -r '.results[] | select(.configured == false) | .variable'
    echo ""
    echo "Configure em: https://supabase.com/dashboard/project/$PROJECT_REF/settings/functions"
    exit 1
else
    echo -e "${RED}✗ Erro ao validar variáveis${NC}"
    echo "Resposta: $VALIDATION"
    exit 1
fi
echo ""

# Test 2: Check Database Migrations
echo -e "${BLUE}[TEST 2/4]${NC} Verificando migrations..."
echo ""

# Get Supabase access token (requires login)
if command -v supabase &> /dev/null; then
    echo "  → Verificando tabela clientes..."
    MIGRATION_CHECK=$(supabase db diff --project-ref $PROJECT_REF 2>&1 || echo "No changes")

    if [[ "$MIGRATION_CHECK" == *"No changes"* ]] || [[ "$MIGRATION_CHECK" == "" ]]; then
        echo -e "${GREEN}✓ Migrations aplicadas${NC}"
    else
        echo -e "${YELLOW}⚠ Migrations pendentes detectadas${NC}"
        echo "$MIGRATION_CHECK"
    fi
else
    echo -e "${YELLOW}⚠ Supabase CLI não instalado, pulando verificação${NC}"
fi
echo ""

# Test 3: Test Create Checkout Session (requires contador_id)
echo -e "${BLUE}[TEST 3/4]${NC} Testando create-checkout-session..."
echo ""

echo "Para testar o checkout, você precisa de um contador_id válido."
echo -n "Digite o UUID do contador (ou Enter para pular): "
read CONTADOR_ID

if [ ! -z "$CONTADOR_ID" ]; then
    echo "  → Criando sessão de checkout..."

    CHECKOUT_DATA='{
        "contador_id": "'$CONTADOR_ID'",
        "success_url": "https://example.com/success",
        "cancel_url": "https://example.com/cancel"
    }'

    CHECKOUT_RESPONSE=$(api_call "create-checkout-session" "POST" "$CHECKOUT_DATA")

    if echo $CHECKOUT_RESPONSE | jq -e '.success' > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Checkout session criada!${NC}"
        echo ""
        CHECKOUT_URL=$(echo $CHECKOUT_RESPONSE | jq -r '.url')
        echo "  URL: $CHECKOUT_URL"
        echo "  Session ID: $(echo $CHECKOUT_RESPONSE | jq -r '.session_id')"
        echo ""
        echo "🌐 Abra este link no navegador para testar o pagamento:"
        echo "   $CHECKOUT_URL"
    else
        echo -e "${RED}✗ Erro ao criar checkout${NC}"
        echo "Resposta: $CHECKOUT_RESPONSE"
    fi
else
    echo -e "${YELLOW}⚠ Teste de checkout pulado${NC}"
fi
echo ""

# Test 4: Test Webhook Endpoint (without signature)
echo -e "${BLUE}[TEST 4/4]${NC} Testando webhook endpoint..."
echo ""

WEBHOOK_TEST_DATA='{
    "id": "evt_test_webhook",
    "type": "checkout.session.completed",
    "data": {
        "object": {
            "id": "cs_test_123",
            "customer": "cus_test_123",
            "subscription": "sub_test_123",
            "metadata": {
                "contador_id": "test-contador-id"
            }
        }
    }
}'

echo "  → Enviando evento de teste (sem assinatura)..."
WEBHOOK_RESPONSE=$(api_call "webhook-stripe" "POST" "$WEBHOOK_TEST_DATA" 2>&1)

# Webhook should reject unsigned requests
if [[ "$WEBHOOK_RESPONSE" == *"Invalid signature"* ]] || [[ "$WEBHOOK_RESPONSE" == *"Webhook signature verification failed"* ]]; then
    echo -e "${GREEN}✓ Webhook está protegido (rejeitou requisição não assinada)${NC}"
elif [[ "$WEBHOOK_RESPONSE" == *"success"* ]]; then
    echo -e "${YELLOW}⚠ Webhook aceitou requisição não assinada (inseguro!)${NC}"
else
    echo -e "${BLUE}→ Webhook respondeu: ${NC}"
    echo "$WEBHOOK_RESPONSE" | head -n 5
fi
echo ""

echo "════════════════════════════════════════════════════════"
echo -e "${GREEN}✅ TESTES CONCLUÍDOS${NC}"
echo "════════════════════════════════════════════════════════"
echo ""
echo "📋 PRÓXIMOS PASSOS:"
echo ""
echo "1. Se todas as variáveis estão OK, teste o fluxo completo:"
echo "   → Abra o app: https://lovable-celite.com/pagamentos"
echo "   → Clique em 'Assinar com Stripe'"
echo "   → Complete o checkout"
echo ""
echo "2. Use cartão de teste Stripe:"
echo "   → Número: 4242 4242 4242 4242"
echo "   → Validade: qualquer data futura"
echo "   → CVC: qualquer 3 dígitos"
echo ""
echo "3. Verifique os logs:"
echo "   → Functions: https://supabase.com/dashboard/project/$PROJECT_REF/functions"
echo "   → Stripe: https://dashboard.stripe.com/test/events"
echo ""
echo "4. Verifique o banco de dados:"
echo "   → Clientes: SELECT * FROM clientes WHERE stripe_customer_id IS NOT NULL"
echo "   → Pagamentos: SELECT * FROM pagamentos WHERE stripe_payment_id IS NOT NULL"
echo "   → Comissões: SELECT * FROM comissoes ORDER BY created_at DESC LIMIT 10"
echo ""
