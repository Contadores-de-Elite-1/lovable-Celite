#!/bin/bash

# ⚡ TESTE MANUAL DO WEBHOOK - CONFIRMAR QUE ENDPOINT ESTÁ VIVO

echo "🔍 TESTANDO WEBHOOK MANUALMENTE..."
echo ""
echo "URL: https://zytxwdgzjqrcmbnpgofj.supabase.co/functions/v1/webhook-asaas"
echo ""

# Payload de teste (simulando ASAAS)
PAYLOAD='{
  "event": "PAYMENT_RECEIVED",
  "id": "evt_test_manual_123",
  "dateCreated": "2025-11-15T00:00:00Z",
  "payment": {
    "id": "pay_test_manual_123",
    "customer": "cus_test_manual",
    "value": 199.90,
    "netValue": 189.90,
    "dateCreated": "2025-11-15T00:00:00Z",
    "confirmedDate": "2025-11-15T00:00:00Z",
    "status": "RECEIVED",
    "billingType": "PIX",
    "description": "Teste manual ref=TESTE2025A"
  }
}'

echo "📤 Enviando payload de teste..."
echo ""

# Executar curl com output detalhado
curl -v -X POST "https://zytxwdgzjqrcmbnpgofj.supabase.co/functions/v1/webhook-asaas" \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD" \
  2>&1 | tee /tmp/webhook-test-result.txt

echo ""
echo ""
echo "════════════════════════════════════════════════════════════"
echo ""

# Analisar resultado
if grep -q "HTTP.*200" /tmp/webhook-test-result.txt; then
  echo "✅ SUCESSO! Webhook respondeu 200 OK!"
  echo ""
  echo "   Isso significa que:"
  echo "   • Edge Function está deployada ✅"
  echo "   • Endpoint está vivo e respondendo ✅"
  echo "   • Problema é no ASAAS não enviar ✅"
  echo ""
  echo "📋 PRÓXIMO PASSO:"
  echo "   Configurar webhook no ASAAS Sandbox:"
  echo "   URL: https://zytxwdgzjqrcmbnpgofj.supabase.co/functions/v1/webhook-asaas"
  echo "   Eventos: PAYMENT_RECEIVED, PAYMENT_CONFIRMED"
  echo ""
elif grep -q "HTTP.*404" /tmp/webhook-test-result.txt; then
  echo "❌ ERRO 404 - Edge Function não encontrada!"
  echo ""
  echo "   Possíveis causas:"
  echo "   • Edge Function não foi deployada"
  echo "   • Nome da função está errado"
  echo "   • URL está incorreta"
  echo ""
  echo "📋 PRÓXIMO PASSO:"
  echo "   Verificar deploy no GitHub Actions"
  echo "   Ou deployar manualmente: supabase functions deploy webhook-asaas"
  echo ""
elif grep -q "HTTP.*500" /tmp/webhook-test-result.txt; then
  echo "⚠️  ERRO 500 - Erro interno na função!"
  echo ""
  echo "   Possível causa:"
  echo "   • Variável ASAAS_API_KEY não configurada"
  echo "   • Erro na lógica da função"
  echo ""
  echo "📋 PRÓXIMO PASSO:"
  echo "   Ver logs: https://supabase.com/dashboard/project/zytxwdgzjqrcmbnpgofj/functions/webhook-asaas/logs"
  echo ""
else
  echo "⚠️  Resposta inesperada ou erro de rede"
  echo ""
  echo "📋 Verifique o output acima ↑"
  echo ""
fi

echo "════════════════════════════════════════════════════════════"
echo ""
echo "💡 DICA: Ver logs completos da Edge Function:"
echo "   https://supabase.com/dashboard/project/zytxwdgzjqrcmbnpgofj/functions/webhook-asaas/logs"
echo ""
