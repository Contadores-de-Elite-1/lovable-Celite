#!/bin/bash

# ============================================================================
# TESTE COMPLETO MOCK - Orquestra tudo de uma vez
# ============================================================================
# Executa:
# 1. Setup de dados fictícios
# 2. Testa webhooks
# 3. Verifica resultados

set -a
source .env
set +a

PROJECT_ID="$VITE_SUPABASE_PROJECT_ID"

echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║          TESTE COMPLETO DE JORNADA DO CONTADOR                ║"
echo "║            (Mock Data - Sem integração ASAAS real)            ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# ============================================================================
# PASSO 1: SETUP DADOS FICTÍCIOS
# ============================================================================

echo "PASSO 1: Criando dados fictícios..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

npx supabase db push --db-url "postgresql://postgres:postgres@localhost:54321/postgres" < supabase/scripts/setup-mock-data.sql 2>&1 || \
  echo "⚠ Rodando contra Cloud (sem acesso local)"

echo "✓ Dados fictícios preparados"
echo ""

# ============================================================================
# PASSO 2: TESTAR WEBHOOKS
# ============================================================================

echo "PASSO 2: Simulando webhooks ASAAS..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

bash supabase/scripts/test-mock-webhook.sh

echo ""

# ============================================================================
# PASSO 3: AGUARDAR PROCESSAMENTO
# ============================================================================

echo "PASSO 3: Aguardando processamento (5 segundos)..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
sleep 5
echo "✓ Pronto"
echo ""

# ============================================================================
# PASSO 4: VERIFICAR RESULTADOS
# ============================================================================

echo "PASSO 4: Verificando resultados..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "Conectando ao banco de dados..."
RESULTS=$(npx supabase db execute -f supabase/scripts/verify-mock-results.sql --project-ref "$PROJECT_ID" 2>/dev/null || echo "Erro ao conectar")

if [ "$RESULTS" != "Erro ao conectar" ]; then
  echo "$RESULTS"
else
  echo "⚠ Não consegui conectar ao banco via CLI"
  echo "   Veja os resultados no Supabase Dashboard:"
  echo "   1. SQL Editor"
  echo "   2. Cole o conteúdo de: supabase/scripts/verify-mock-results.sql"
  echo "   3. Execute"
fi

echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                    TESTE FINALIZADO                           ║"
echo "║                                                                ║"
echo "║  Próximos passos:                                              ║"
echo "║  1. Verifique os dados no Frontend (/comissoes)               ║"
echo "║  2. Valide os bônus calculados                                 ║"
echo "║  3. Teste a jornada do aprovador                              ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
