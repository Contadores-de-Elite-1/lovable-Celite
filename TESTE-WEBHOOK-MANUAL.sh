#!/bin/bash
# ============================================================================
# TESTE MANUAL DO WEBHOOK V3.0
# ============================================================================

echo "🧪 Testando Webhook V3.0..."
echo ""

# URL do webhook
WEBHOOK_URL="https://zytxwdgzjqrcmbnpgofj.supabase.co/functions/v1/webhook-asaas"

# Payload de teste simulando ASAAS
PAYLOAD='{
  "event": "PAYMENT_RECEIVED",
  "id": "evt_teste_manual_'$(date +%s)'",
  "payment": {
    "id": "pay_teste_manual_'$(date +%s)'",
    "customer": "cus_teste_novo_cliente",
    "value": 199.90,
    "netValue": 189.90,
    "dateCreated": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'",
    "confirmedDate": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'",
    "status": "RECEIVED",
    "billingType": "PIX",
    "description": "Teste manual webhook V3.0 ref=TESTE2025A"
  }
}'

echo "📤 Enviando payload:"
echo "$PAYLOAD" | jq '.' 2>/dev/null || echo "$PAYLOAD"
echo ""
echo "🌐 URL: $WEBHOOK_URL"
echo ""

# Enviar webhook
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD")

# Separar corpo e status code
BODY=$(echo "$RESPONSE" | head -n -1)
STATUS=$(echo "$RESPONSE" | tail -n 1)

echo "📥 Response:"
echo "Status Code: $STATUS"
echo ""
echo "Body:"
echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
echo ""

# Verificar resultado
if [ "$STATUS" -eq 200 ]; then
  echo "✅ WEBHOOK FUNCIONOU!"
  echo ""
  echo "Verificar:"
  echo "1. Tabela 'clientes' - cliente auto-criado"
  echo "2. Tabela 'pagamentos' - pagamento registrado"
  echo "3. Tabela 'comissoes' - comissões calculadas"
  echo "4. Tabela 'audit_logs' - logs de processamento"
else
  echo "❌ WEBHOOK RETORNOU ERRO!"
  echo ""
  echo "Verificar logs em:"
  echo "https://supabase.com/dashboard/project/zytxwdgzjqrcmbnpgofj/functions/webhook-asaas/logs"
fi

echo ""
echo "════════════════════════════════════════"
