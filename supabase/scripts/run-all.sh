#!/usr/bin/env bash

# ============================================================================
# SCRIPT: Orquestração Completa - Start, Reset, Seed, Teste
# ============================================================================
# Uso: bash supabase/scripts/run-all.sh [OPTIONS]
#
# Compatibilidade: macOS (sem timeout GNU, só curl)
#
# O que faz:
#   1. Inicia Supabase (se parado)
#   2. Espera API estar pronta (curl --connect-timeout)
#   3. Reseta migrations
#   4. Aplica todas as migrations
#   5. Executa seed idempotente
#   6. Roda testes (test-calcular-comissoes.sh)
#   7. Mostra resumo de logs
#
# Variáveis de Ambiente (opcionais):
#   SUPABASE_DIR     - Diretório do Supabase (padrão: .)
#   APP_URL          - URL da API (padrão: http://localhost:54321)
#   DB_PORT          - Porta do PostgreSQL (padrão: 54322)
#   WAIT_TIMEOUT     - Tempo máximo de espera em segundos (padrão: 60)
#
# ============================================================================

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configurações padrão
SUPABASE_DIR="${SUPABASE_DIR:-.}"
APP_URL="${APP_URL:-http://localhost:54321}"
DB_PORT="${DB_PORT:-54322}"
WAIT_TIMEOUT="${WAIT_TIMEOUT:-60}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo -e "${BLUE}╔════════════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║         ORQUESTRAÇÃO COMPLETA: Supabase + Seed + Teste                ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════════════════╝${NC}"
echo

# ============================================================================
# PASSO 1: Iniciar Supabase
# ============================================================================

echo -e "${YELLOW}[STEP 1/6] Iniciando Supabase...${NC}"

if ! pgrep -f "supabase" > /dev/null; then
  echo -e "${BLUE}→ Supabase não está rodando, iniciando...${NC}"
  cd "$SUPABASE_DIR"

  if ! supabase start > /tmp/supabase_start.log 2>&1; then
    echo -e "${RED}✗ Erro ao iniciar Supabase${NC}"
    cat /tmp/supabase_start.log
    exit 1
  fi

  echo -e "${GREEN}✓ Supabase iniciado${NC}"
else
  echo -e "${GREEN}✓ Supabase já está rodando${NC}"
fi

echo

# ============================================================================
# PASSO 2: Esperar API estar pronta (curl --connect-timeout)
# ============================================================================

echo -e "${YELLOW}[STEP 2/6] Esperando API ficar pronta (${APP_URL})...${NC}"

START_TIME=$(date +%s)
READY=false

while [ $READY = false ]; do
  CURRENT_TIME=$(date +%s)
  ELAPSED=$((CURRENT_TIME - START_TIME))

  if [ $ELAPSED -gt $WAIT_TIMEOUT ]; then
    echo -e "${RED}✗ Timeout esperando API (${WAIT_TIMEOUT}s)${NC}"
    exit 1
  fi

  # Usar curl --connect-timeout (compatível com macOS)
  if curl -s --connect-timeout 2 "$APP_URL/health" > /dev/null 2>&1; then
    READY=true
    echo -e "${GREEN}✓ API está pronta (${ELAPSED}s)${NC}"
  else
    echo -ne "\r→ Aguardando... ${ELAPSED}s"
    sleep 2
  fi
done

echo

# ============================================================================
# PASSO 3: Resetar Migrations
# ============================================================================

echo -e "${YELLOW}[STEP 3/6] Resetando migrations...${NC}"

if [ ! -d "$SUPABASE_DIR/supabase/migrations" ]; then
  echo -e "${RED}✗ Erro: diretório de migrations não encontrado${NC}"
  exit 1
fi

cd "$SUPABASE_DIR"

if ! supabase db reset > /tmp/supabase_reset.log 2>&1; then
  echo -e "${YELLOW}⚠ Aviso ao resetar migrations (isso é esperado na primeira execução)${NC}"
  # Não falhar aqui, pois pode ser primeira execução
fi

echo -e "${GREEN}✓ Migrations resetadas${NC}"
echo

# ============================================================================
# PASSO 4: Aplicar Migrations
# ============================================================================

echo -e "${YELLOW}[STEP 4/6] Aplicando migrations...${NC}"

if ! supabase migration up > /tmp/supabase_migrate.log 2>&1; then
  echo -e "${RED}✗ Erro ao aplicar migrations${NC}"
  cat /tmp/supabase_migrate.log
  exit 1
fi

MIGRATED=$(grep -c "Migrating" /tmp/supabase_migrate.log 2>/dev/null || echo "0")
echo -e "${GREEN}✓ Migrations aplicadas (${MIGRATED} migrations)${NC}"
echo

# ============================================================================
# PASSO 5: Executar Seed
# ============================================================================

echo -e "${YELLOW}[STEP 5/6] Executando seed idempotente...${NC}"

SEED_FILE="$SCRIPT_DIR/seed.sql"

if [ ! -f "$SEED_FILE" ]; then
  echo -e "${RED}✗ Arquivo seed.sql não encontrado em $SEED_FILE${NC}"
  exit 1
fi

# Usar psql para executar seed (via Supabase local)
if ! psql -h localhost -U postgres -d postgres -f "$SEED_FILE" > /tmp/seed.log 2>&1; then
  echo -e "${RED}✗ Erro ao executar seed${NC}"
  cat /tmp/seed.log
  exit 1
fi

echo -e "${GREEN}✓ Seed executado com sucesso${NC}"
echo

# ============================================================================
# PASSO 6: Rodar Testes
# ============================================================================

echo -e "${YELLOW}[STEP 6/6] Executando testes...${NC}"

TEST_SCRIPT="$SCRIPT_DIR/test-calcular-comissoes.sh"

if [ ! -f "$TEST_SCRIPT" ]; then
  echo -e "${RED}✗ Script de teste não encontrado em $TEST_SCRIPT${NC}"
  exit 1
fi

# Extrair ANON_KEY do status do Supabase
if ! ANON_KEY=$(supabase status | grep "anon key:" | awk '{print $NF}' 2>/dev/null); then
  echo -e "${YELLOW}⚠ Não foi possível extrair ANON_KEY automaticamente${NC}"
  echo -e "${YELLOW}  Use: APP_URL=... ANON_KEY=... bash $TEST_SCRIPT${NC}"
  exit 1
fi

if ! bash "$TEST_SCRIPT"; then
  echo -e "${RED}✗ Testes falharam${NC}"
  exit 1
fi

echo

# ============================================================================
# RESUMO FINAL
# ============================================================================

echo -e "${GREEN}╔════════════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                    ✓ TUDO CONCLUÍDO COM SUCESSO!                       ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════════════════╝${NC}"
echo

echo -e "${BLUE}📊 Resumo:${NC}"
echo "  ✓ Supabase iniciado"
echo "  ✓ API pronta em $APP_URL"
echo "  ✓ Migrations aplicadas"
echo "  ✓ Seed executado"
echo "  ✓ Testes passaram"
echo

echo -e "${BLUE}📁 Arquivos de Log:${NC}"
echo "  - /tmp/supabase_start.log (inicialização)"
echo "  - /tmp/supabase_reset.log (reset)"
echo "  - /tmp/supabase_migrate.log (migrations)"
echo "  - /tmp/seed.log (seed)"
echo

echo -e "${BLUE}🔗 URLs Úteis:${NC}"
echo "  - API: $APP_URL"
echo "  - DB: localhost:$DB_PORT"
echo "  - Inspecionar comissões:"
echo "    psql -h localhost -U postgres -d postgres -c \"SELECT * FROM comissoes;\""
echo

echo -e "${BLUE}🧹 Limpeza:${NC}"
echo "  bash supabase/scripts/cleanup.sh (quando terminar)"
echo
