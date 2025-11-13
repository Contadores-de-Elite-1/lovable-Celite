#!/bin/bash
###############################################################################
# RUN-E2E-CLOUD.SH
# Script SIMPLES para rodar E2E tests contra Supabase CLOUD
# Sem Docker, sem Supabase local
#
# Uso:
#   export SUPABASE_ACCESS_TOKEN="sbp_..."
#   bash supabase/scripts/run-e2e-cloud.sh
###############################################################################

set -e

BLUE='\033[0;34m'
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║          E2E TESTING: Supabase Cloud (SEM Docker)                      ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════════════════╝${NC}"

# Carregar .env
if [ -f ".env" ]; then
  set -a
  source .env
  set +a
fi

# Verificar variáveis obrigatórias
if [ -z "$SUPABASE_ACCESS_TOKEN" ]; then
  echo -e "${RED}✗ SUPABASE_ACCESS_TOKEN não definido${NC}"
  echo "Exporte antes de rodar:"
  echo "  export SUPABASE_ACCESS_TOKEN=\"sbp_...\""
  exit 1
fi

if [ -z "$VITE_SUPABASE_PROJECT_ID" ]; then
  echo -e "${RED}✗ VITE_SUPABASE_PROJECT_ID não definido em .env${NC}"
  exit 1
fi

export SUPABASE_PROJECT_REF="$VITE_SUPABASE_PROJECT_ID"

echo -e "${GREEN}✓ SUPABASE_PROJECT_REF=$SUPABASE_PROJECT_REF${NC}"
echo -e "${GREEN}✓ SUPABASE_ACCESS_TOKEN configurado${NC}"

# Rodar testes
echo -e "\n${YELLOW}═══════════════════════════════════════════════════════════════════════${NC}"
echo -e "${YELLOW}Executando E2E Tests contra Supabase Cloud${NC}"
echo -e "${YELLOW}═══════════════════════════════════════════════════════════════════════${NC}\n"

bash supabase/scripts/test-e2e-complete.sh
exit $?
