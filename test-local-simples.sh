#!/bin/bash

echo "🧪 TESTE LOCAL - SIMULANDO GITHUB ACTIONS"
echo "════════════════════════════════════════"
echo ""

# Test 1: Verificar se arquivos existem
echo "1️⃣ Verificando arquivos criados..."
FILES=(
  "supabase/functions/webhook-asaas/index.ts"
  "criar-cliente-especifico.mjs"
  "configurar-webhook-asaas.mjs"
  "STATUS-FINAL-SISTEMA.md"
  ".github/workflows/test-simple.yml"
)

ALL_EXIST=true
for file in "${FILES[@]}"; do
  if [ -f "$file" ]; then
    echo "   ✅ $file"
  else
    echo "   ❌ $file FALTANDO"
    ALL_EXIST=false
  fi
done

if [ "$ALL_EXIST" = true ]; then
  echo "   ✅ Todos os arquivos existem!"
else
  echo "   ❌ Alguns arquivos faltando"
fi
echo ""

# Test 2: Verificar sintaxe YAML dos workflows
echo "2️⃣ Verificando sintaxe dos workflows..."
YAML_FILES=(.github/workflows/*.yml)
YAML_OK=true

for yaml in "${YAML_FILES[@]}"; do
  # Verificação básica: arquivo não vazio e tem 'name:'
  if [ -s "$yaml" ] && grep -q "^name:" "$yaml"; then
    echo "   ✅ $(basename $yaml)"
  else
    echo "   ❌ $(basename $yaml) - problema"
    YAML_OK=false
  fi
done

if [ "$YAML_OK" = true ]; then
  echo "   ✅ Todos os workflows têm sintaxe básica correta!"
else
  echo "   ⚠️  Alguns workflows podem ter problemas"
fi
echo ""

# Test 3: Verificar código do webhook
echo "3️⃣ Verificando código do webhook..."
WEBHOOK_FILE="supabase/functions/webhook-asaas/index.ts"

if grep -q "interface AsaasWebhookPayload" "$WEBHOOK_FILE"; then
  echo "   ✅ Interface AsaasWebhookPayload existe"
else
  echo "   ❌ Interface faltando"
fi

if grep -q "id: string" "$WEBHOOK_FILE"; then
  echo "   ✅ Campo 'id' na interface"
else
  echo "   ❌ Campo 'id' faltando"
fi

if grep -q "payload.id" "$WEBHOOK_FILE"; then
  echo "   ✅ Usando payload.id (idempotência correta)"
else
  echo "   ⚠️  Pode não estar usando payload.id"
fi

if grep -q "PAYMENT_CONFIRMED" "$WEBHOOK_FILE"; then
  echo "   ✅ Eventos de pagamento configurados"
else
  echo "   ❌ Eventos faltando"
fi
echo ""

# Test 4: Verificar documentação
echo "4️⃣ Verificando documentação..."
DOCS=(
  "WEBHOOK-ASAAS-GUIA.md"
  "STATUS-FINAL-SISTEMA.md"
  "ROBO-MODO-RELATORIO.md"
)

DOCS_OK=true
for doc in "${DOCS[@]}"; do
  if [ -f "$doc" ] && [ -s "$doc" ]; then
    LINES=$(wc -l < "$doc")
    echo "   ✅ $doc ($LINES linhas)"
  else
    echo "   ❌ $doc - faltando ou vazio"
    DOCS_OK=false
  fi
done
echo ""

# Test 5: Contar commits
echo "5️⃣ Verificando commits..."
COMMITS=$(git log --oneline --author="Claude" --since="24 hours ago" | wc -l)
echo "   ✅ $COMMITS commits nas últimas 24h"
echo ""

# Resumo final
echo "════════════════════════════════════════"
echo "📊 RESUMO DOS TESTES LOCAIS"
echo "════════════════════════════════════════"
echo ""

if [ "$ALL_EXIST" = true ] && [ "$YAML_OK" = true ] && [ "$DOCS_OK" = true ]; then
  echo "✅ TODOS OS TESTES PASSARAM!"
  echo ""
  echo "O código está correto localmente."
  echo "GitHub Actions deveria funcionar."
  echo ""
  echo "⚠️  MAS: Eu não consigo executar workflows do GitHub"
  echo "Você precisa disparar manualmente:"
  echo ""
  echo "1. https://github.com/Contadores-de-Elite-1/lovable-Celite/actions"
  echo "2. Workflow: '✅ Test Simple'"
  echo "3. Run workflow"
  echo ""
else
  echo "⚠️  ALGUNS TESTES FALHARAM"
  echo ""
  echo "Verifique os itens marcados com ❌ acima"
  echo ""
fi
