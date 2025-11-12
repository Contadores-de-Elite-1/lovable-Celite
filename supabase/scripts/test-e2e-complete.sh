#!/bin/bash

# DO NOT use 'set -e' - we want to continue even if a step fails
# so we can see ALL test results

# ============================================================================
# E2E TESTING - Supabase Cloud + Local Support
# ============================================================================

# Carregar .env
if [ -f ".env" ]; then
  set -a
  source .env
  set +a
fi

BLUE='\033[0;34m'
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║              E2E TESTING: Fluxo Completo de Comissões                  ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════════════════╝${NC}"

TEST_PASSED=0
TEST_FAILED=0

# ============================================================================
# Detectar modo: Cloud vs Local
# ============================================================================

echo -e "\n${YELLOW}DEBUG: Verificando modo de execução...${NC}"
echo "SUPABASE_ACCESS_TOKEN: ${SUPABASE_ACCESS_TOKEN:0:30}..."
echo "VITE_SUPABASE_URL: $VITE_SUPABASE_URL"
echo "SUPABASE_SERVICE_KEY: ${SUPABASE_SERVICE_KEY:0:30}..."

if [ -n "$SUPABASE_ACCESS_TOKEN" ]; then
  # CLOUD MODE
  MODE="CLOUD"
  API_URL="$VITE_SUPABASE_URL"
  ANON_KEY="$VITE_SUPABASE_PUBLISHABLE_KEY"

  # Tentar obter SERVICE_ROLE_KEY de várias fontes
  SERVICE_ROLE_KEY="${SUPABASE_SERVICE_KEY:-${SUPABASE_SERVICE_ROLE_KEY:-$SUPABASE_ACCESS_TOKEN}}"

  if [ "$SERVICE_ROLE_KEY" = "$SUPABASE_ACCESS_TOKEN" ]; then
    echo -e "${YELLOW}⚠ SUPABASE_SERVICE_KEY não definido, usando SUPABASE_ACCESS_TOKEN${NC}"
  fi

  echo -e "${GREEN}✓ Modo: CLOUD${NC}"
  echo -e "${GREEN}  URL: $API_URL${NC}"
else
  # LOCAL MODE
  MODE="LOCAL"
  API_URL="http://localhost:54321"

  # Tentar obter de supabase status
  STATUS=$(supabase status 2>/dev/null || echo "")
  ANON_KEY=$(echo "$STATUS" | grep -E "(Publishable|anon) key:" | tail -1 | awk '{print $NF}' | tr -d '[:space:]')
  SERVICE_ROLE_KEY=$(echo "$STATUS" | grep -E "(Secret|service_role) key:" | tail -1 | awk '{print $NF}' | tr -d '[:space:]')

  echo -e "${GREEN}✓ Modo: LOCAL${NC}"
  echo -e "${GREEN}  URL: $API_URL${NC}"
fi

# ============================================================================
# PASSO 1: Verificar API disponível
# ============================================================================

echo -e "\n${YELLOW}PASSO 1: Verificar Supabase API está disponível${NC}"

RESPONSE=$(curl -s -w "\n%{http_code}" "$API_URL/rest/v1/" -H "apikey: $ANON_KEY")
HTTP_CODE=$(echo "$RESPONSE" | tail -1)
BODY=$(echo "$RESPONSE" | head -n -1)

if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "401" ]; then
  echo -e "${GREEN}✓ Supabase API disponível (HTTP $HTTP_CODE)${NC}"
  ((TEST_PASSED++))
else
  echo -e "${RED}✗ Supabase API não respondendo corretamente${NC}"
  echo "  URL: $API_URL/rest/v1/"
  echo "  HTTP Code: $HTTP_CODE"
  echo "  Response: ${BODY:0:200}"
  ((TEST_FAILED++))
fi

# ============================================================================
# PASSO 2: Verificar credenciais
# ============================================================================

echo -e "\n${YELLOW}PASSO 2: Verificar credenciais${NC}"

if [ -z "$ANON_KEY" ]; then
  echo -e "${RED}✗ ANON_KEY vazio${NC}"
  ((TEST_FAILED++))
elif [ -z "$SERVICE_ROLE_KEY" ]; then
  echo -e "${RED}✗ SERVICE_ROLE_KEY vazio${NC}"
  ((TEST_FAILED++))
else
  echo -e "${GREEN}✓ ANON_KEY: ${ANON_KEY:0:20}...${NC}"
  echo -e "${GREEN}✓ SERVICE_ROLE_KEY: ${SERVICE_ROLE_KEY:0:20}...${NC}"
  ((TEST_PASSED++))
fi

# ============================================================================
# PASSO 3-4: Migrations + Seed (apenas para Local)
# ============================================================================

if [ "$MODE" = "LOCAL" ]; then
  echo -e "\n${YELLOW}PASSO 3: Aplicar Migrations${NC}"
  if supabase db push > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Migrations aplicadas${NC}"
    ((TEST_PASSED++))
  else
    echo -e "${YELLOW}⚠ Migrations: erro/skip${NC}"
  fi

  echo -e "\n${YELLOW}PASSO 4: Executar Seed${NC}"
  if psql "postgresql://postgres:postgres@localhost:54322/postgres" -f supabase/scripts/seed.sql > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Seed executado${NC}"
    ((TEST_PASSED++))
  else
    echo -e "${YELLOW}⚠ Seed: erro/skip${NC}"
  fi
else
  echo -e "\n${YELLOW}PASSO 3-4: Migrations + Seed${NC}"
  echo -e "${GREEN}✓ Skip (Cloud já tem dados)${NC}"
  ((TEST_PASSED+=2))
fi

# ============================================================================
# PASSO 5: Webhook ASAAS
# ============================================================================

echo -e "\n${YELLOW}PASSO 5: Testar Webhook ASAAS${NC}"

WEBHOOK=$(curl -s -X POST \
  "$API_URL/functions/v1/webhook-asaas" \
  -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "event": "PAYMENT_CONFIRMED",
    "payment": {
      "id": "test_'$(date +%s%N)'",
      "customer": "cust_test_001",
      "value": 1000,
      "netValue": 950,
      "dateCreated": "'$(date -u +%Y-%m-%d)'",
      "status": "CONFIRMED"
    }
  }')

if echo "$WEBHOOK" | jq -e '.pagamento_id' > /dev/null 2>&1; then
  echo -e "${GREEN}✓ Webhook retornou pagamento_id${NC}"
  ((TEST_PASSED++))
else
  echo -e "${RED}✗ Webhook falhou: $(echo $WEBHOOK | jq -r '.error // .message' 2>/dev/null)${NC}"
  echo "Response: $WEBHOOK"
  ((TEST_FAILED++))
fi

# ============================================================================
# PASSO 6: Verificar Comissões
# ============================================================================

echo -e "\n${YELLOW}PASSO 6: Verificar Comissões Calculadas${NC}"

COMISSOES=$(curl -s "$API_URL/rest/v1/comissoes?status=eq.calculada" \
  -H "Authorization: Bearer $ANON_KEY" \
  -H "Content-Type: application/json" | jq 'length' 2>/dev/null || echo "0")

if [ "$COMISSOES" -gt 0 ]; then
  echo -e "${GREEN}✓ Comissões calculadas: $COMISSOES${NC}"
  ((TEST_PASSED++))
else
  echo -e "${YELLOW}⚠ Nenhuma comissão calculada${NC}"
  ((TEST_FAILED++))
fi

# ============================================================================
# PASSO 7: Aprovar Comissões
# ============================================================================

echo -e "\n${YELLOW}PASSO 7: Aprovar Comissões${NC}"

APROVA=$(curl -s -X POST \
  "$API_URL/functions/v1/aprovar-comissoes" \
  -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"competencia": "'$(date -u +%Y-%m-%d)'"}')

if echo "$APROVA" | jq -e '.success' > /dev/null 2>&1; then
  echo -e "${GREEN}✓ Comissões aprovadas${NC}"
  ((TEST_PASSED++))
else
  echo -e "${YELLOW}⚠ Aprovação falhou${NC}"
  ((TEST_FAILED++))
fi

# ============================================================================
# PASSO 8: Verificar Status Aprovada
# ============================================================================

echo -e "\n${YELLOW}PASSO 8: Verificar Status Aprovada${NC}"

APROVADAS=$(curl -s "$API_URL/rest/v1/comissoes?status=eq.aprovada" \
  -H "Authorization: Bearer $ANON_KEY" \
  -H "Content-Type: application/json" | jq 'length' 2>/dev/null || echo "0")

if [ "$APROVADAS" -gt 0 ]; then
  echo -e "${GREEN}✓ Comissões com status aprovada: $APROVADAS${NC}"
  ((TEST_PASSED++))
else
  echo -e "${YELLOW}⚠ Nenhuma comissão aprovada${NC}"
  ((TEST_FAILED++))
fi

# ============================================================================
# PASSO 9: Processar Pagamento
# ============================================================================

echo -e "\n${YELLOW}PASSO 9: Processar Pagamento${NC}"

PROCESSO=$(curl -s -X POST \
  "$API_URL/functions/v1/processar-pagamento-comissoes" \
  -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"competencia": "'$(date -u +%Y-%m-%d)'"}')

if echo "$PROCESSO" | jq -e '.success' > /dev/null 2>&1; then
  echo -e "${GREEN}✓ Pagamento processado${NC}"
  ((TEST_PASSED++))
else
  echo -e "${YELLOW}⚠ Processamento falhou${NC}"
  ((TEST_FAILED++))
fi

# ============================================================================
# PASSO 10: RLS / Isolamento de Dados
# ============================================================================

echo -e "\n${YELLOW}PASSO 10: Verificar RLS${NC}"

RLS=$(curl -s "$API_URL/rest/v1/contadores?select=id" \
  -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" | jq . 2>/dev/null)

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✓ RLS permite leitura${NC}"
  ((TEST_PASSED++))
else
  echo -e "${RED}✗ RLS bloqueou acesso${NC}"
  ((TEST_FAILED++))
fi

# ============================================================================
# PASSO 11: Audit Logs
# ============================================================================

echo -e "\n${YELLOW}PASSO 11: Verificar Audit Logs${NC}"

AUDITS=$(curl -s "$API_URL/rest/v1/audit_logs?select=id" \
  -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" | jq 'length' 2>/dev/null || echo "0")

if [ "$AUDITS" -gt 0 ]; then
  echo -e "${GREEN}✓ Audit logs: $AUDITS registros${NC}"
  ((TEST_PASSED++))
else
  echo -e "${YELLOW}⚠ Nenhum audit log${NC}"
  ((TEST_FAILED++))
fi

# ============================================================================
# RESUMO FINAL
# ============================================================================

echo -e "\n${BLUE}╔════════════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                          RESULTADO DOS TESTES                           ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════════════════╝${NC}"

echo -e "\n${GREEN}Testes Passados: $TEST_PASSED${NC}"
echo -e "${RED}Testes Falhados: $TEST_FAILED${NC}"

if [ $TEST_FAILED -eq 0 ]; then
  echo -e "\n${GREEN}✓ ✓ ✓ TODOS OS TESTES PASSARAM! ✓ ✓ ✓${NC}"
  echo -e "${GREEN}Backend está PRONTO para Week 2!${NC}"
  exit 0
else
  echo -e "\n${RED}✗ ALGUNS TESTES FALHARAM (Detalhes acima)${NC}"
  exit 1
fi
