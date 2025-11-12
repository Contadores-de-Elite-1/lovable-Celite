#!/bin/bash

###############################################################################
# RUN-E2E-LOCAL.SH
# ⚠️  AVISO: Use GitHub Actions, não rode manualmente!
#
# Este script é executado AUTOMATICAMENTE por:
# 1. GitHub Actions (via .github/workflows/e2e-tests.yml)
# 2. Codespaces post-start hook
#
# NÃO rode manualmente com: bash supabase/scripts/run-e2e-local.sh
###############################################################################

set -e

BLUE='\033[0;34m'
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# ============================================================================
# ENFORCEMENT: Bloquer execução manual no Codespaces local
# ============================================================================

# Se estamos em GitHub Actions, OK para rodar
if [ -n "$GITHUB_ACTIONS" ]; then
  # GitHub Actions is running this
  :
# Se estamos em Codespaces, BLOQUEAR
elif [ -n "$CODESPACES" ] || [ -n "$GITHUB_CODESPACES" ]; then
  echo -e "${RED}╔════════════════════════════════════════════════════════════════════════╗${NC}"
  echo -e "${RED}║                  ❌ BLOQUEADO: NÃO RODE MANUALMENTE!                    ║${NC}"
  echo -e "${RED}╚════════════════════════════════════════════════════════════════════════╝${NC}"
  echo ""
  echo -e "${RED}Você está tentando rodar testes manualmente no Codespaces.${NC}"
  echo -e "${RED}Isso viola a política ZERO_MANUAL_GUARANTEE.${NC}"
  echo ""
  echo -e "${YELLOW}✅ O QUE FAZER:${NC}"
  echo -e "  Opção 1: GitHub.com → Actions → Run Workflow (5 cliques, nenhum terminal)"
  echo -e "  Opção 2: bash scripts/auto-run-e2e-tests.sh (dispara GitHub Actions)"
  echo ""
  echo -e "${YELLOW}❌ O QUE NÃO FAZER:${NC}"
  echo -e "  bash supabase/scripts/run-e2e-local.sh (MANUAL = PROIBIDO)"
  echo ""
  exit 1
fi

echo -e "${BLUE}╔════════════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║         CELITE E2E TESTING - Running via Automation                    ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════════════════╝${NC}"

# ============================================================================
# ETAPA 1: Verificar/Iniciar Supabase
# ============================================================================

echo -e "\n${YELLOW}═══════════════════════════════════════════════════════════════════════${NC}"
echo -e "${YELLOW}ETAPA 1: Verificar/Iniciar Supabase${NC}"
echo -e "${YELLOW}═══════════════════════════════════════════════════════════════════════${NC}"

MAX_RETRIES=120  # 2 minutos (120 * 1 segundo)
RETRY_COUNT=0

# Função para verificar se Supabase está rodando
supabase_is_running() {
  curl -s http://localhost:54321/rest/v1/ > /dev/null 2>&1
  return $?
}

# Verificar se já está rodando
if supabase_is_running; then
  echo -e "${GREEN}✓ Supabase já está rodando em localhost:54321${NC}"
else
  echo "Supabase não está rodando. Iniciando..."
  supabase start > /dev/null 2>&1 &
  SUPABASE_PID=$!
  echo "Supabase iniciado (PID: $SUPABASE_PID)"

  echo "Aguardando Supabase ficar pronto..."

  while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if supabase_is_running; then
      echo -e "${GREEN}✓ Supabase está pronto!${NC}"
      sleep 2  # Esperar extra para ter certeza
      break
    fi

    RETRY_COUNT=$((RETRY_COUNT + 1))
    if [ $((RETRY_COUNT % 10)) -eq 0 ]; then
      echo "  Tentativa $RETRY_COUNT/$MAX_RETRIES..."
    fi

    sleep 1
  done

  if [ $RETRY_COUNT -ge $MAX_RETRIES ]; then
    echo -e "${RED}✗ Timeout: Supabase não ficou pronto em 2 minutos${NC}"
    echo "Dicas de debug:"
    echo "  1. Verifique se o Docker está rodando: docker ps"
    echo "  2. Verifique logs: supabase status"
    echo "  3. Tente resetar: supabase stop && rm -rf .supabase && supabase start"
    exit 1
  fi
fi

# Verificar credenciais
echo -e "\n${YELLOW}Verificando credenciais...${NC}"
STATUS=$(supabase status)

# Tentar novo formato primeiro (Publishable key), depois antigo (anon key)
ANON_KEY=$(echo "$STATUS" | grep "Publishable key:" | awk '{print $NF}' | tr -d '[:space:]')
if [ -z "$ANON_KEY" ]; then
  ANON_KEY=$(echo "$STATUS" | grep "anon key:" | awk '{print $NF}' | tr -d '[:space:]')
fi

# Tentar novo formato para Secret key, depois antigo (service_role key)
SERVICE_ROLE_KEY=$(echo "$STATUS" | grep "Secret key:" | awk '{print $NF}' | tr -d '[:space:]')
if [ -z "$SERVICE_ROLE_KEY" ]; then
  SERVICE_ROLE_KEY=$(echo "$STATUS" | grep "service_role key:" | awk '{print $NF}' | tr -d '[:space:]')
fi

if [ -z "$ANON_KEY" ] || [ -z "$SERVICE_ROLE_KEY" ]; then
  echo -e "${RED}✗ Não consegui obter ANON_KEY ou SERVICE_ROLE_KEY${NC}"
  echo "Status output:"
  echo "$STATUS"
  exit 1
fi

echo -e "${GREEN}✓ Credenciais obtidas${NC}"

# ============================================================================
# ETAPA 2: Rodar E2E Tests
# ============================================================================

echo -e "\n${YELLOW}═══════════════════════════════════════════════════════════════════════${NC}"
echo -e "${YELLOW}ETAPA 2: Executar Testes E2E Completos${NC}"
echo -e "${YELLOW}═══════════════════════════════════════════════════════════════════════${NC}\n"

# Verificar se o script de testes existe
if [ ! -f "supabase/scripts/test-e2e-complete.sh" ]; then
  echo -e "${RED}✗ Script de testes não encontrado: supabase/scripts/test-e2e-complete.sh${NC}"
  exit 1
fi

# Rodar o teste
bash supabase/scripts/test-e2e-complete.sh
TEST_RESULT=$?

# ============================================================================
# ETAPA 3: Resumo Final
# ============================================================================

echo -e "\n${YELLOW}═══════════════════════════════════════════════════════════════════════${NC}"
echo -e "${YELLOW}ETAPA 3: Resumo Final${NC}"
echo -e "${YELLOW}═══════════════════════════════════════════════════════════════════════${NC}"

if [ $TEST_RESULT -eq 0 ]; then
  echo -e "\n${GREEN}╔════════════════════════════════════════════════════════════════════════╗${NC}"
  echo -e "${GREEN}║                   ✓ TODOS OS TESTES PASSARAM!                         ║${NC}"
  echo -e "${GREEN}║                     Sistema está pronto para usar                     ║${NC}"
  echo -e "${GREEN}╚════════════════════════════════════════════════════════════════════════╝${NC}"
  echo ""
  echo "Próximos passos:"
  echo "  1. Manter Supabase rodando: supabase start"
  echo "  2. Começar desenvolvimento do frontend"
  echo "  3. Rodar testes novamente antes de commits importantes"

  # Save result for CI/CD pipelines
  echo "PASSED" > /tmp/e2e-results.txt
  exit 0
else
  echo -e "\n${RED}╔════════════════════════════════════════════════════════════════════════╗${NC}"
  echo -e "${RED}║                   ✗ ALGUNS TESTES FALHARAM                            ║${NC}"
  echo -e "${RED}╚════════════════════════════════════════════════════════════════════════╝${NC}"
  echo ""
  echo "Debug:"
  echo "  1. Verificar logs do webhook:"
  echo "     supabase functions logs webhook-asaas"
  echo "  2. Verificar database diretamente:"
  echo "     psql postgresql://postgres:postgres@localhost:54322/postgres"
  echo "  3. Verificar migrations:"
  echo "     supabase db push --dry-run"

  # Save result for CI/CD pipelines
  echo "FAILED" > /tmp/e2e-results.txt
  echo ""
  echo "Manter Supabase rodando para investigar:"
  echo "  supabase start"
  exit 1
fi
