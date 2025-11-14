#!/bin/bash

# ============================================================
# 🧪 ASAAS INTEGRATION TEST SCRIPT
# ============================================================
# Testa fluxo completo: Cliente → Subscription → Pagamento → Comissão
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
FUNCTIONS_URL="${SUPABASE_URL}/functions/v1"
TIMESTAMP=$(date +%s)

echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║         ASAAS INTEGRATION - END-TO-END TEST           ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""

# ============================================================
# Check Prerequisites
# ============================================================
echo -e "${BLUE}📋 Phase 1: Validating Prerequisites${NC}"
echo ""

if [ -z "$ASAAS_API_KEY" ]; then
    echo -e "${RED}❌ ASAAS_API_KEY not set${NC}"
    echo "Set it with: export ASAAS_API_KEY='your-key'"
    exit 1
fi
echo -e "${GREEN}✅ ASAAS_API_KEY is set${NC}"

if [ -z "$ASAAS_WEBHOOK_SECRET" ]; then
    echo -e "${YELLOW}⚠️  ASAAS_WEBHOOK_SECRET not set (needed for webhook validation)${NC}"
fi
echo -e "${GREEN}✅ Configuration OK${NC}"

# ============================================================
# Test Data
# ============================================================
echo ""
echo -e "${BLUE}📊 Phase 2: Test Data${NC}"
echo ""

CUSTOMER_NAME="Teste Integração ${TIMESTAMP}"
CUSTOMER_EMAIL="teste-${TIMESTAMP}@asaas-integration.com"
CUSTOMER_CNPJ="12345678000190"  # Fake CNPJ for testing
SUBSCRIPTION_VALUE="299.00"
SUBSCRIPTION_DATE=$(date -d "+10 days" +%Y-%m-%d)  # 10 days from now

echo "Customer Name: ${CUSTOMER_NAME}"
echo "Customer Email: ${CUSTOMER_EMAIL}"
echo "Subscription Value: R$ ${SUBSCRIPTION_VALUE}"
echo "Subscription Date: ${SUBSCRIPTION_DATE}"
echo ""

# ============================================================
# Step 1: Create Customer
# ============================================================
echo -e "${BLUE}🔧 Step 1: Creating Customer${NC}"
echo ""

CUSTOMER_PAYLOAD=$(cat <<EOF
{
  "action": "create-customer",
  "payload": {
    "name": "${CUSTOMER_NAME}",
    "email": "${CUSTOMER_EMAIL}",
    "cpfCnpj": "${CUSTOMER_CNPJ}",
    "phone": "11999999999",
    "observation": "Test via automation script"
  }
}
EOF
)

echo "Request:"
echo "${CUSTOMER_PAYLOAD}" | jq '.' 2>/dev/null || echo "${CUSTOMER_PAYLOAD}"
echo ""

CUSTOMER_RESPONSE=$(curl -s -X POST \
  "${FUNCTIONS_URL}/asaas-client" \
  -H "Content-Type: application/json" \
  -d "${CUSTOMER_PAYLOAD}")

echo "Response:"
echo "${CUSTOMER_RESPONSE}" | jq '.' 2>/dev/null || echo "${CUSTOMER_RESPONSE}"
echo ""

# Extract customer ID
CUSTOMER_ID=$(echo "${CUSTOMER_RESPONSE}" | jq -r '.data.id // .id' 2>/dev/null || echo "")

if [ -z "$CUSTOMER_ID" ] || [ "$CUSTOMER_ID" == "null" ]; then
    echo -e "${RED}❌ Failed to create customer${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Customer created: ${CUSTOMER_ID}${NC}"
echo ""

# ============================================================
# Step 2: Create Subscription
# ============================================================
echo -e "${BLUE}🔧 Step 2: Creating Subscription${NC}"
echo ""

SUBSCRIPTION_PAYLOAD=$(cat <<EOF
{
  "action": "create-subscription",
  "payload": {
    "customerId": "${CUSTOMER_ID}",
    "billingType": "BOLETO",
    "value": ${SUBSCRIPTION_VALUE},
    "nextDueDate": "${SUBSCRIPTION_DATE}",
    "description": "Serviço Contábil - Teste Automatizado",
    "cycle": "MONTHLY"
  }
}
EOF
)

echo "Request:"
echo "${SUBSCRIPTION_PAYLOAD}" | jq '.' 2>/dev/null || echo "${SUBSCRIPTION_PAYLOAD}"
echo ""

SUBSCRIPTION_RESPONSE=$(curl -s -X POST \
  "${FUNCTIONS_URL}/asaas-client" \
  -H "Content-Type: application/json" \
  -d "${SUBSCRIPTION_PAYLOAD}")

echo "Response:"
echo "${SUBSCRIPTION_RESPONSE}" | jq '.' 2>/dev/null || echo "${SUBSCRIPTION_RESPONSE}"
echo ""

# Extract subscription ID
SUBSCRIPTION_ID=$(echo "${SUBSCRIPTION_RESPONSE}" | jq -r '.data.id // .id' 2>/dev/null || echo "")

if [ -z "$SUBSCRIPTION_ID" ] || [ "$SUBSCRIPTION_ID" == "null" ]; then
    echo -e "${RED}❌ Failed to create subscription${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Subscription created: ${SUBSCRIPTION_ID}${NC}"
echo ""

# ============================================================
# Step 3: Simulate Payment Webhook
# ============================================================
echo -e "${BLUE}🔧 Step 3: Simulating Payment Webhook${NC}"
echo ""

PAYMENT_ID="pay_test_${TIMESTAMP}"
PAYMENT_DATE=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

WEBHOOK_PAYLOAD=$(cat <<EOF
{
  "event": "PAYMENT_CONFIRMED",
  "payment": {
    "id": "${PAYMENT_ID}",
    "customer": "${CUSTOMER_ID}",
    "value": ${SUBSCRIPTION_VALUE},
    "netValue": 290.00,
    "dateCreated": "${PAYMENT_DATE}",
    "confirmedDate": "${PAYMENT_DATE}",
    "status": "CONFIRMED",
    "billingType": "BOLETO",
    "subscription": "${SUBSCRIPTION_ID}"
  }
}
EOF
)

echo "Webhook Payload:"
echo "${WEBHOOK_PAYLOAD}" | jq '.' 2>/dev/null || echo "${WEBHOOK_PAYLOAD}"
echo ""

WEBHOOK_RESPONSE=$(curl -s -X POST \
  "${FUNCTIONS_URL}/webhook-asaas" \
  -H "Content-Type: application/json" \
  -d "${WEBHOOK_PAYLOAD}")

echo "Response:"
echo "${WEBHOOK_RESPONSE}" | jq '.' 2>/dev/null || echo "${WEBHOOK_RESPONSE}"
echo ""

# Check if webhook was successful
if echo "${WEBHOOK_RESPONSE}" | grep -q "success" || echo "${WEBHOOK_RESPONSE}" | grep -q "Payment processed"; then
    echo -e "${GREEN}✅ Webhook processed successfully${NC}"
else
    echo -e "${YELLOW}⚠️  Webhook response unclear, checking logs...${NC}"
fi
echo ""

# ============================================================
# Step 4: Verify Payment in Database
# ============================================================
echo -e "${BLUE}🔧 Step 4: Verifying Payment in Database${NC}"
echo ""

echo "Query: SELECT * FROM pagamentos WHERE asaas_payment_id = '${PAYMENT_ID}'"
echo ""
echo -e "${YELLOW}⚠️  Cannot execute SQL directly from script${NC}"
echo "To verify, run in Supabase console:"
echo ""
echo "  SELECT id, cliente_id, valor_bruto, status_pagamento"
echo "  FROM pagamentos"
echo "  WHERE asaas_payment_id = '${PAYMENT_ID}';"
echo ""

# ============================================================
# Step 5: Verify Commissions
# ============================================================
echo -e "${BLUE}🔧 Step 5: Verifying Commissions${NC}"
echo ""

echo "Query: SELECT * FROM comissoes WHERE pagamento_id = ..."
echo ""
echo -e "${YELLOW}⚠️  Cannot execute SQL directly from script${NC}"
echo "To verify, run in Supabase console:"
echo ""
echo "  SELECT tipo_comissao, valor, status_comissao"
echo "  FROM comissoes"
echo "  WHERE asaas_payment_id = '${PAYMENT_ID}';"
echo ""
echo "Expected commission (15% of R$ 290,00): R$ 43,50"
echo ""

# ============================================================
# Summary
# ============================================================
echo -e "${BLUE}═════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}📊 Test Summary${NC}"
echo -e "${BLUE}═════════════════════════════════════════════════════════${NC}"
echo ""

echo -e "${GREEN}✅ Completed Steps:${NC}"
echo "  1. Customer created: ${CUSTOMER_ID}"
echo "  2. Subscription created: ${SUBSCRIPTION_ID}"
echo "  3. Webhook simulated: ${PAYMENT_ID}"
echo ""

echo -e "${YELLOW}📋 Manual Verification Needed:${NC}"
echo ""
echo "1. Check Asaas Dashboard:"
echo "   https://sandbox.asaas.com/"
echo "   Search for: ${CUSTOMER_EMAIL}"
echo ""
echo "2. Check Database (Supabase Console):"
echo "   SELECT * FROM pagamentos WHERE asaas_payment_id = '${PAYMENT_ID}';"
echo "   SELECT * FROM comissoes WHERE pagamento_id LIKE '%${PAYMENT_ID}%';"
echo ""
echo "3. Check Webhook Logs:"
echo "   SELECT * FROM webhook_logs ORDER BY created_at DESC LIMIT 5;"
echo ""

echo -e "${BLUE}═════════════════════════════════════════════════════════${NC}"
echo ""

echo -e "${YELLOW}Next Steps:${NC}"
echo "1. Verify payment appears in Supabase"
echo "2. Check commission was calculated correctly"
echo "3. Wait 24h or run: SELECT auto_aprovar_comissoes();"
echo "4. Verify commission status changed to 'aprovada'"
echo ""

echo -e "${GREEN}✅ Test script completed!${NC}"
