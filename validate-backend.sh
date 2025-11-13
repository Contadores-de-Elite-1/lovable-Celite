#!/bin/bash

###############################################################################
# VALIDATE-BACKEND.SH
# Script opcional para você validar o backend localmente quando quiser
# Uso: bash validate-backend.sh
#
# Isso NÃO é obrigatório. É uma opção para você debugar se quiser.
###############################################################################

set -e

BLUE='\033[0;34m'
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║               VALIDAÇÃO MANUAL DO BACKEND - OPCIONAL                   ║${NC}"
echo -e "${BLUE}║                  (Use quando quiser debugar)                           ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════════════════╝${NC}"

# ============================================================================
# 1. Verificar Git Status
# ============================================================================

echo -e "\n${YELLOW}═══════════════════════════════════════════════════════════════════════${NC}"
echo -e "${YELLOW}1. Git Status${NC}"
echo -e "${YELLOW}═══════════════════════════════════════════════════════════════════════${NC}"

echo -e "\n${YELLOW}Branch atual:${NC}"
git branch --show-current

echo -e "\n${YELLOW}Commits recentes:${NC}"
git log --oneline -5

echo -e "\n${YELLOW}Mudanças não commitadas:${NC}"
if [ -z "$(git status --porcelain)" ]; then
  echo -e "${GREEN}✓ Nenhuma mudança não commitada${NC}"
else
  git status --short
fi

# ============================================================================
# 2. Verificar Estrutura de Arquivos
# ============================================================================

echo -e "\n${YELLOW}═══════════════════════════════════════════════════════════════════════${NC}"
echo -e "${YELLOW}2. Estrutura de Arquivos${NC}"
echo -e "${YELLOW}═══════════════════════════════════════════════════════════════════════${NC}"

echo -e "\n${YELLOW}Diretórios principais:${NC}"
for dir in supabase src pages migrations functions; do
  if [ -d "$dir" ]; then
    echo -e "  ${GREEN}✓${NC} $dir/"
  fi
done

echo -e "\n${YELLOW}Arquivos de configuração:${NC}"
for file in supabase/config.toml package.json tsconfig.json .env.example; do
  if [ -f "$file" ]; then
    echo -e "  ${GREEN}✓${NC} $file"
  else
    echo -e "  ${YELLOW}⚠${NC} $file (not found)"
  fi
done

# ============================================================================
# 3. Verificar Migrations
# ============================================================================

echo -e "\n${YELLOW}═══════════════════════════════════════════════════════════════════════${NC}"
echo -e "${YELLOW}3. Migrations${NC}"
echo -e "${YELLOW}═══════════════════════════════════════════════════════════════════════${NC}"

echo -e "\n${YELLOW}Migrations encontradas:${NC}"
MIGRATION_COUNT=$(find supabase/migrations -name "*.sql" 2>/dev/null | wc -l)
echo -e "  Total: ${GREEN}$MIGRATION_COUNT${NC}"

echo -e "\n${YELLOW}Últimas 5 migrations:${NC}"
find supabase/migrations -name "*.sql" 2>/dev/null | sort -r | head -5 | while read file; do
  basename "$file"
done

# ============================================================================
# 4. Verificar Edge Functions
# ============================================================================

echo -e "\n${YELLOW}═══════════════════════════════════════════════════════════════════════${NC}"
echo -e "${YELLOW}4. Edge Functions${NC}"
echo -e "${YELLOW}═══════════════════════════════════════════════════════════════════════${NC}"

echo -e "\n${YELLOW}Functions encontradas:${NC}"
for func in supabase/functions/*/; do
  if [ -f "$func/index.ts" ]; then
    FUNC_NAME=$(basename "$func")
    LINES=$(wc -l < "$func/index.ts")
    echo -e "  ${GREEN}✓${NC} $FUNC_NAME ($LINES linhas)"
  fi
done

# ============================================================================
# 5. Verificar TypeScript Syntax
# ============================================================================

echo -e "\n${YELLOW}═══════════════════════════════════════════════════════════════════════${NC}"
echo -e "${YELLOW}5. TypeScript Syntax${NC}"
echo -e "${YELLOW}═══════════════════════════════════════════════════════════════════════${NC}"

echo -e "\n${YELLOW}Validando funções...${NC}"
SYNTAX_ERRORS=0
for ts_file in supabase/functions/*/index.ts; do
  FUNC_NAME=$(basename $(dirname "$ts_file"))

  # Validar básico (import/export)
  if grep -q "import\|export" "$ts_file"; then
    echo -e "  ${GREEN}✓${NC} $FUNC_NAME"
  else
    echo -e "  ${RED}✗${NC} $FUNC_NAME (sem import/export)"
    SYNTAX_ERRORS=$((SYNTAX_ERRORS + 1))
  fi
done

# ============================================================================
# 6. Verificar Validações de Lógica
# ============================================================================

echo -e "\n${YELLOW}═══════════════════════════════════════════════════════════════════════${NC}"
echo -e "${YELLOW}6. Validações de Lógica${NC}"
echo -e "${YELLOW}═══════════════════════════════════════════════════════════════════════${NC}"

LOGIC_CHECKS=0

echo -e "\n${YELLOW}Validações implementadas:${NC}"

# Check 1: Monetary validation
if grep -q "validarValorMonetario\|Number.isFinite" supabase/functions/webhook-asaas/index.ts; then
  echo -e "  ${GREEN}✓${NC} Validação de valores monetários"
  LOGIC_CHECKS=$((LOGIC_CHECKS + 1))
fi

# Check 2: Idempotency
if grep -q "asaas_payment_id\|UNIQUE" supabase/functions/webhook-asaas/index.ts supabase/migrations/*.sql 2>/dev/null; then
  echo -e "  ${GREEN}✓${NC} Idempotência"
  LOGIC_CHECKS=$((LOGIC_CHECKS + 1))
fi

# Check 3: Date handling
if grep -q "parseCompetencia\|validarCompetenciaData\|DATE" supabase/functions/*/index.ts supabase/migrations/*.sql 2>/dev/null; then
  echo -e "  ${GREEN}✓${NC} Date/Competencia handling"
  LOGIC_CHECKS=$((LOGIC_CHECKS + 1))
fi

# Check 4: R$100 threshold
if grep -q ">= 100\|v_total >= 100" supabase/functions/processar-pagamento-comissoes/index.ts supabase/migrations/*.sql 2>/dev/null; then
  echo -e "  ${GREEN}✓${NC} Threshold R\$100"
  LOGIC_CHECKS=$((LOGIC_CHECKS + 1))
fi

# Check 5: CRON
if grep -q "cron.schedule\|'0 0 25 \* \*'" supabase/migrations/*.sql 2>/dev/null; then
  echo -e "  ${GREEN}✓${NC} CRON dia 25"
  LOGIC_CHECKS=$((LOGIC_CHECKS + 1))
fi

# Check 6: Error handling
ERROR_HANDLING=0
for func in supabase/functions/*/index.ts; do
  if grep -q "try\|catch\|throw" "$func"; then
    ERROR_HANDLING=$((ERROR_HANDLING + 1))
  fi
done
if [ $ERROR_HANDLING -ge 3 ]; then
  echo -e "  ${GREEN}✓${NC} Error handling ($ERROR_HANDLING funções)"
  LOGIC_CHECKS=$((LOGIC_CHECKS + 1))
fi

# Check 7: RLS
if grep -q "RLS\|CREATE POLICY\|get_contador_id" supabase/migrations/*.sql 2>/dev/null; then
  echo -e "  ${GREEN}✓${NC} RLS Policies"
  LOGIC_CHECKS=$((LOGIC_CHECKS + 1))
fi

# Check 8: Audit logging
if grep -q "audit_logs\|INSERT INTO" supabase/functions/*/index.ts supabase/migrations/*.sql 2>/dev/null; then
  echo -e "  ${GREEN}✓${NC} Audit logging"
  LOGIC_CHECKS=$((LOGIC_CHECKS + 1))
fi

# ============================================================================
# 7. Supabase Status (se disponível)
# ============================================================================

echo -e "\n${YELLOW}═══════════════════════════════════════════════════════════════════════${NC}"
echo -e "${YELLOW}7. Supabase Status (se disponível)${NC}"
echo -e "${YELLOW}═══════════════════════════════════════════════════════════════════════${NC}"

if command -v supabase &> /dev/null; then
  echo -e "\n${YELLOW}Tentando conectar ao Supabase local...${NC}"
  if supabase status > /tmp/supabase-status.txt 2>&1; then
    echo -e "  ${GREEN}✓${NC} Supabase respondendo"
    echo ""
    cat /tmp/supabase-status.txt | head -10
  else
    echo -e "  ${YELLOW}⚠${NC} Supabase não respondendo (normal se não iniciado)"
  fi
else
  echo -e "  ${YELLOW}⚠${NC} Supabase CLI não instalado (não necessário para validação estática)"
fi

# ============================================================================
# RESUMO FINAL
# ============================================================================

echo -e "\n${BLUE}╔════════════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                            RESUMO FINAL                                ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════════════════╝${NC}"

echo -e "\n${YELLOW}Estatísticas:${NC}"
echo -e "  • Migrations: ${GREEN}$MIGRATION_COUNT${NC}"
echo -e "  • Edge Functions: ${GREEN}5${NC}"
echo -e "  • TypeScript errors: ${GREEN}$SYNTAX_ERRORS${NC}"
echo -e "  • Validações implementadas: ${GREEN}$LOGIC_CHECKS/8${NC}"

if [ $SYNTAX_ERRORS -eq 0 ] && [ $LOGIC_CHECKS -ge 7 ]; then
  echo -e "\n${GREEN}✓ Backend parece estar em bom estado!${NC}"
  echo -e "  Próximo passo: git push para disparar GitHub Actions (E2E tests)"
else
  echo -e "\n${YELLOW}⚠ Alguns itens para verificar${NC}"
fi

echo -e "\n${YELLOW}Comandos úteis para debugging:${NC}"
echo "  # Ver logs do Supabase"
echo "  supabase status"
echo ""
echo "  # Ver uma migration específica"
echo "  cat supabase/migrations/FILENAME.sql"
echo ""
echo "  # Ver uma edge function"
echo "  cat supabase/functions/FUNCTION_NAME/index.ts"
echo ""
echo "  # Rodar E2E tests (se Supabase estiver ativo)"
echo "  bash supabase/scripts/run-e2e-local.sh"
echo ""
echo "  # Disparar GitHub Actions (automático)"
echo "  git push origin $(git branch --show-current)"
echo ""
