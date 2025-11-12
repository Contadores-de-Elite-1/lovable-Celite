#!/bin/bash

# ============================================================================
# TESTE DE WEBHOOK MOCK
# ============================================================================
# Script que simula pagamentos ASAAS e testa se:
# 1. Webhook processa pagamento
# 2. Comissões são calculadas
# 3. Bônus são registrados

set -a
source .env
set +a

API_URL="$VITE_SUPABASE_URL"
SERVICE_KEY="$SUPABASE_SERVICE_KEY"

echo "=========================================="
echo "TESTE DE WEBHOOK MOCK - Jornada Completa"
echo "=========================================="
echo ""
echo "Endpoint: $API_URL/functions/v1/webhook-asaas"
echo ""

# ============================================================================
# TESTE 1: Simular pagamento de ativação (Cliente 1)
# ============================================================================

echo "TESTE 1: Pagamento de Ativação"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

RESPONSE=$(curl -s -X POST \
  "$API_URL/functions/v1/webhook-asaas" \
  -H "Authorization: Bearer $SERVICE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "event": "PAYMENT_CONFIRMED",
    "payment": {
      "id": "asaas_mock_test_001",
      "customer": "cust_mock_001",
      "value": 1000.00,
      "netValue": 950.00,
      "dateCreated": "2025-10-01",
      "confirmedDate": "2025-10-01T10:00:00Z",
      "status": "CONFIRMED",
      "billingType": "BOLETO"
    }
  }')

echo "Response:"
echo "$RESPONSE" | jq . 2>/dev/null || echo "$RESPONSE"
echo ""

# ============================================================================
# TESTE 2: Simular segundo pagamento (Cliente 1 - Mensalidade)
# ============================================================================

echo "TESTE 2: Pagamento de Mensalidade"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

RESPONSE=$(curl -s -X POST \
  "$API_URL/functions/v1/webhook-asaas" \
  -H "Authorization: Bearer $SERVICE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "event": "PAYMENT_CONFIRMED",
    "payment": {
      "id": "asaas_mock_test_002",
      "customer": "cust_mock_001",
      "value": 500.00,
      "netValue": 475.00,
      "dateCreated": "2025-11-01",
      "confirmedDate": "2025-11-01T10:00:00Z",
      "status": "CONFIRMED",
      "billingType": "BOLETO"
    }
  }')

echo "Response:"
echo "$RESPONSE" | jq . 2>/dev/null || echo "$RESPONSE"
echo ""

# ============================================================================
# TESTE 3: Simular pagamento do Cliente 2 (Ativação)
# ============================================================================

echo "TESTE 3: Pagamento de Ativação (Cliente 2)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

RESPONSE=$(curl -s -X POST \
  "$API_URL/functions/v1/webhook-asaas" \
  -H "Authorization: Bearer $SERVICE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "event": "PAYMENT_CONFIRMED",
    "payment": {
      "id": "asaas_mock_test_003",
      "customer": "cust_mock_002",
      "value": 800.00,
      "netValue": 760.00,
      "dateCreated": "2025-10-15",
      "confirmedDate": "2025-10-15T10:00:00Z",
      "status": "CONFIRMED",
      "billingType": "BOLETO"
    }
  }')

echo "Response:"
echo "$RESPONSE" | jq . 2>/dev/null || echo "$RESPONSE"
echo ""

echo "=========================================="
echo "✅ Webhooks disparados"
echo "Próximo passo: Verificar comissões/bônus"
echo "=========================================="
