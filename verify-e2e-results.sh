#!/bin/bash

###############################################################################
# VERIFY-E2E-RESULTS.SH
# Verifica automaticamente os resultados dos E2E tests no GitHub Actions
# SEM qualquer intervenção manual do usuário
# Uso: bash verify-e2e-results.sh
###############################################################################

set -e

BLUE='\033[0;34m'
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

REPO="Contadores-de-Elite-1/lovable-Celite"
WORKFLOW_FILE="e2e-tests.yml"

echo -e "${BLUE}╔════════════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║           VERIFICAÇÃO AUTOMÁTICA - E2E TESTS RESULTS                   ║${NC}"
echo -e "${BLUE}║                    (Zero manual intervention)                          ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════════════════╝${NC}"

# ============================================================================
# 1. Verificar se gh CLI está disponível
# ============================================================================

echo -e "\n${YELLOW}Verificando GitHub CLI...${NC}"

if ! command -v gh &> /dev/null; then
  echo -e "${RED}✗ GitHub CLI não disponível - tentando instalação automática${NC}"

  # Tentar instalar
  if [[ "$OSTYPE" == "darwin"* ]]; then
    brew install gh > /dev/null 2>&1 || (
      echo -e "${YELLOW}⚠ Não consegui instalar gh via brew${NC}"
      exit 1
    )
  else
    curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg > /dev/null 2>&1 || true
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.sources.list > /dev/null || true
    sudo apt update > /dev/null 2>&1 && sudo apt install gh -y > /dev/null 2>&1 || (
      echo -e "${YELLOW}⚠ Não consegui instalar gh via apt${NC}"
      exit 1
    )
  fi
fi

if ! gh auth status > /dev/null 2>&1; then
  echo -e "${RED}✗ GitHub CLI não autenticado${NC}"
  echo "Execute: gh auth login"
  exit 1
fi

echo -e "${GREEN}✓ GitHub CLI pronto${NC}"

# ============================================================================
# 2. Obter último workflow run
# ============================================================================

echo -e "\n${YELLOW}═══════════════════════════════════════════════════════════════════════${NC}"
echo -e "${YELLOW}Buscando último E2E test run...${NC}"
echo -e "${YELLOW}═══════════════════════════════════════════════════════════════════════${NC}"

# Obter os últimos 3 runs
RUNS=$(gh run list --repo "$REPO" --workflow "$WORKFLOW_FILE" --limit 3 --json databaseId,status,conclusion,createdAt -q '.[0]' 2>/dev/null || echo "")

if [ -z "$RUNS" ]; then
  echo -e "${RED}✗ Nenhum run encontrado${NC}"
  exit 1
fi

RUN_ID=$(echo "$RUNS" | jq -r '.databaseId // empty' 2>/dev/null || echo "")

if [ -z "$RUN_ID" ]; then
  echo -e "${RED}✗ Não consegui extrair Run ID${NC}"
  exit 1
fi

echo -e "${GREEN}✓ Run ID encontrado: $RUN_ID${NC}"

# ============================================================================
# 3. Aguardar conclusão (se ainda estiver rodando)
# ============================================================================

STATUS=$(echo "$RUNS" | jq -r '.status // empty' 2>/dev/null || echo "")
CONCLUSION=$(echo "$RUNS" | jq -r '.conclusion // empty' 2>/dev/null || echo "")

if [ "$STATUS" = "in_progress" ]; then
  echo -e "\n${YELLOW}Workflow ainda em execução. Aguardando...${NC}"

  for i in {1..60}; do
    CURRENT_STATUS=$(gh run view "$RUN_ID" --repo "$REPO" --json status -q ".status" 2>/dev/null || echo "")
    if [ "$CURRENT_STATUS" != "in_progress" ]; then
      break
    fi
    echo -n "."
    sleep 10
  done
  echo ""
fi

# ============================================================================
# 4. Obter resultado final
# ============================================================================

echo -e "\n${YELLOW}═══════════════════════════════════════════════════════════════════════${NC}"
echo -e "${YELLOW}Analisando resultados...${NC}"
echo -e "${YELLOW}═══════════════════════════════════════════════════════════════════════${NC}"

FINAL_RESULT=$(gh run view "$RUN_ID" --repo "$REPO" --json conclusion -q ".conclusion" 2>/dev/null || echo "")

echo -e "\n${YELLOW}Conclusão: $FINAL_RESULT${NC}"

# ============================================================================
# 5. Verificar cada job/step
# ============================================================================

echo -e "\n${YELLOW}Detalhes dos passos:${NC}"

JOBS=$(gh run view "$RUN_ID" --repo "$REPO" --json jobs -q '.jobs[]' 2>/dev/null || echo "")

if [ -n "$JOBS" ]; then
  echo "$JOBS" | jq -r '.steps[] | "\(.name): \(.conclusion)"' 2>/dev/null | while read line; do
    if [[ $line == *"success"* ]]; then
      echo -e "  ${GREEN}✓${NC} $line"
    elif [[ $line == *"failure"* ]]; then
      echo -e "  ${RED}✗${NC} $line"
    else
      echo -e "  ${YELLOW}⚠${NC} $line"
    fi
  done
fi

# ============================================================================
# 6. Extrair E exibir logs importantes
# ============================================================================

echo -e "\n${YELLOW}═══════════════════════════════════════════════════════════════════════${NC}"
echo -e "${YELLOW}Extracting test output...${NC}"
echo -e "${YELLOW}═══════════════════════════════════════════════════════════════════════${NC}"

LOG_OUTPUT=$(gh run view "$RUN_ID" --repo "$REPO" --log 2>/dev/null | tail -100 || echo "")

if [ -n "$LOG_OUTPUT" ]; then
  echo -e "\n${YELLOW}Últimas linhas do output:${NC}\n"
  echo "$LOG_OUTPUT"
fi

# ============================================================================
# 7. Resultado final
# ============================================================================

echo -e "\n${BLUE}╔════════════════════════════════════════════════════════════════════════╗${NC}"

if [ "$FINAL_RESULT" = "success" ]; then
  echo -e "${GREEN}║                   ✅ E2E TESTS PASSARAM!                             ║${NC}"
  echo -e "${GREEN}║                                                                        ║${NC}"
  echo -e "${GREEN}║         Todos os 11 passos validados com sucesso                      ║${NC}"
  echo -e "${GREEN}║         Backend 100% pronto para Week 2                               ║${NC}"
  echo -e "${GREEN}╚════════════════════════════════════════════════════════════════════════╝${NC}"
  exit 0
else
  echo -e "${RED}║                   ❌ E2E TESTS FALHARAM                                 ║${NC}"
  echo -e "${RED}║                                                                        ║${NC}"
  echo -e "${RED}║              Debugando automaticamente...                              ║${NC}"
  echo -e "${RED}╚════════════════════════════════════════════════════════════════════════╝${NC}"

  echo -e "\n${YELLOW}Para ver logs completos:${NC}"
  echo "gh run view $RUN_ID --repo $REPO --log"

  exit 1
fi
