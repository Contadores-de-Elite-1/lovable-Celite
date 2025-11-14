#!/bin/bash

# Script para verificar deploy e continuar setup
# Execute depois que GitHub Actions terminar

echo "🔍 VERIFICANDO STATUS DO DEPLOY..."
echo "===================================="
echo ""

# Verificar se webhook está acessível
echo "📡 Testando endpoint do webhook..."
WEBHOOK_URL="https://zytxwdgzjqrcmbnpgofj.supabase.co/functions/v1/webhook-asaas"

HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d '{"test":"ping"}')

if [ "$HTTP_STATUS" == "200" ] || [ "$HTTP_STATUS" == "400" ]; then
    echo "✅ Webhook está respondendo! (HTTP $HTTP_STATUS)"
    echo ""

    # Configurar webhook no ASAAS
    echo "🔗 Configurando webhook no ASAAS..."
    node configurar-webhook-asaas.mjs

    if [ $? -eq 0 ]; then
        echo ""
        echo "✅ Webhook configurado no ASAAS!"
        echo ""

        # Perguntar se quer criar cliente
        read -p "👤 Criar cliente de teste? (s/n): " CREATE_CLIENT

        if [ "$CREATE_CLIENT" == "s" ] || [ "$CREATE_CLIENT" == "S" ]; then
            echo ""
            echo "Criando cliente..."
            node create-cliente-cloud.mjs

            if [ $? -eq 0 ]; then
                echo ""
                echo "════════════════════════════════════════"
                echo "✅ SETUP 100% COMPLETO!"
                echo "════════════════════════════════════════"
                echo ""
                echo "🎯 Próximo passo: Testar pagamento"
                echo "   node test-baby-step-3-create-payment.mjs"
                echo ""
            fi
        else
            echo ""
            echo "════════════════════════════════════════"
            echo "✅ Webhook configurado!"
            echo "════════════════════════════════════════"
            echo ""
            echo "Para criar cliente depois:"
            echo "   node create-cliente-cloud.mjs"
            echo ""
        fi
    else
        echo "⚠️  Erro ao configurar webhook. Tente manualmente:"
        echo "   node configurar-webhook-asaas.mjs"
    fi
else
    echo "⚠️  Webhook não está respondendo ainda (HTTP $HTTP_STATUS)"
    echo ""
    echo "Possíveis causas:"
    echo "1. GitHub Actions ainda está rodando"
    echo "2. Deploy falhou"
    echo ""
    echo "Verifique: https://github.com/Contadores-de-Elite-1/lovable-Celite/actions"
    echo ""
    echo "Quando deploy terminar, execute este script novamente:"
    echo "   ./verificar-e-continuar.sh"
    echo ""
fi
