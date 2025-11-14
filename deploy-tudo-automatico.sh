#!/bin/bash

# Script de Deploy Automático - Webhook ASAAS
# Execute no seu Mac

echo "🚀 DEPLOY AUTOMÁTICO - WEBHOOK ASAAS"
echo "===================================="
echo ""

# Deploy webhook corrigido
echo "📦 Fazendo deploy do webhook-asaas..."
supabase functions deploy webhook-asaas --project-ref zytxwdgzjqrcmbnpgofj

if [ $? -eq 0 ]; then
    echo "✅ Webhook deployed com sucesso!"
    echo ""

    # Configurar webhook no ASAAS
    echo "🔗 Configurando webhook no ASAAS..."
    node configurar-webhook-asaas.mjs

    if [ $? -eq 0 ]; then
        echo "✅ Webhook configurado no ASAAS!"
        echo ""

        # Criar cliente de teste
        echo "👤 Criando cliente de teste..."
        node create-cliente-cloud.mjs

        if [ $? -eq 0 ]; then
            echo "✅ Cliente criado!"
            echo ""
            echo "=========================================="
            echo "✅ DEPLOY COMPLETO!"
            echo "=========================================="
            echo ""
            echo "🎯 Próximo passo: Testar pagamento"
            echo "   node test-baby-step-3-create-payment.mjs"
            echo ""
        else
            echo "⚠️  Erro ao criar cliente. Continue manualmente."
        fi
    else
        echo "⚠️  Erro ao configurar webhook. Continue manualmente."
    fi
else
    echo "❌ Erro no deploy. Verifique credenciais."
fi
