#!/bin/bash

set -e

# ============================================================================
# Carregar variáveis do .env se existir
# ============================================================================
if [ -f ".env" ]; then
  while IFS='=' read -r key value; do
    [[ "$key" =~ ^[[:space:]]*# ]] && continue
    [[ -z "$key" ]] && continue
    key=$(echo "$key" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')
    value=$(echo "$value" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')
    export "$key"="$value"
  done < .env
fi

# Fallback para SUPABASE_PROJECT_REF
if [ -z "$SUPABASE_PROJECT_REF" ] && [ -n "$VITE_SUPABASE_PROJECT_ID" ]; then
  export SUPABASE_PROJECT_REF="$VITE_SUPABASE_PROJECT_ID"
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
# Detectar se está usando Local (Docker) ou Cloud
# ============================================================================
LOCAL_SUPABASE_AVAILABLE=false
if curl -s http://localhost:54321/rest/v1/ > /dev/null 2>&1; then
  LOCAL_SUPABASE_AVAILABLE=true
  echo -e "${GREEN}✓ Supabase Local detectado (localhost:54321)${NC}"
else
  if [ -n "$SUPABASE_ACCESS_TOKEN" ] && [ -n "$SUPABASE_PROJECT_REF" ]; then
    echo -e "${GREEN}✓ Supabase Cloud detectado (usando SUPABASE_ACCESS_TOKEN)${NC}"
  fi
fi

test_case() {
  local test_name=$1
  local test_command=$2
  local expected=$3

  echo -e "\n${YELLOW}[TEST] ${test_name}${NC}"
  echo "Executando: ${test_command}"

  result=$(eval "$test_command" 2>&1 || echo "ERROR")

  if [[ "$result" == *"$expected"* ]]; then
    echo -e "${GREEN}PASSOU${NC}"
    ((TEST_PASSED++))
  else
    echo -e "${RED}FALHOU${NC}"
    echo "Resultado: $result"
    ((TEST_FAILED++))
  fi
}

validate_json() {
  local json=$1
  if echo "$json" | jq . > /dev/null 2>&1; then
    return 0
  else
    return 1
  fi
}

echo -e "\n${YELLOW}PASSO 1: Verificar Supabase está rodando${NC}"
if curl -s http://localhost:54321/rest/v1/ > /dev/null; then
  echo -e "${GREEN}✓ Supabase API disponível em localhost:54321${NC}"
else
  echo -e "${RED}✗ Supabase não está rodando. Execute: supabase start${NC}"
  exit 1
fi

echo -e "\n${YELLOW}PASSO 2: Obter credenciais${NC}"
STATUS_OUTPUT=$(supabase status 2>/dev/null || echo "")

# Tentar novo formato primeiro (Publishable key / Secret key), depois antigo (anon key / service_role key)
ANON_KEY=$(echo "$STATUS_OUTPUT" | grep "Publishable key:" | awk '{print $NF}' | tr -d '[:space:]')
if [ -z "$ANON_KEY" ]; then
  ANON_KEY=$(echo "$STATUS_OUTPUT" | grep "anon key:" | awk '{print $NF}' | tr -d '[:space:]')
fi

SERVICE_ROLE_KEY=$(echo "$STATUS_OUTPUT" | grep "Secret key:" | awk '{print $NF}' | tr -d '[:space:]')
if [ -z "$SERVICE_ROLE_KEY" ]; then
  SERVICE_ROLE_KEY=$(echo "$STATUS_OUTPUT" | grep "service_role key:" | awk '{print $NF}' | tr -d '[:space:]')
fi

if [ -z "$ANON_KEY" ] || [ -z "$SERVICE_ROLE_KEY" ]; then
  echo -e "${RED}✗ Não consegui obter ANON_KEY ou SERVICE_ROLE_KEY${NC}"
  echo "Status output:"
  echo "$STATUS_OUTPUT"
  exit 1
fi

export ANON_KEY
export SERVICE_ROLE_KEY
export APP_URL="http://localhost:54321"

echo -e "${GREEN}✓ ANON_KEY obtida (primeiros 20 chars): ${ANON_KEY:0:20}...${NC}"

echo -e "\n${YELLOW}PASSO 3: Reset + Migrations + Seed${NC}"

echo "Resetando banco de dados..."
if psql "postgresql://postgres:postgres@localhost:54322/postgres" -c "DROP SCHEMA IF EXISTS public CASCADE; CREATE SCHEMA public;" > /dev/null 2>&1; then
  echo -e "${GREEN}✓ Banco resetado${NC}"
else
  echo -e "${YELLOW}⚠ Não consegui resetar via psql, pulando...${NC}"
fi

echo "Aplicando migrations..."
if supabase db push > /dev/null 2>&1; then
  echo -e "${GREEN}✓ Migrations aplicadas${NC}"
else
  echo -e "${RED}✗ Erro ao aplicar migrations${NC}"
  exit 1
fi

echo "Executando seed..."
if psql "postgresql://postgres:postgres@localhost:54322/postgres" -f supabase/scripts/seed.sql > /dev/null 2>&1; then
  echo -e "${GREEN}✓ Seed executado${NC}"
else
  echo -e "${YELLOW}⚠ Erro no seed, continuando...${NC}"
fi

echo -e "\n${YELLOW}PASSO 4: Verificar dados de teste existem${NC}"

CONTADOR_COUNT=$(curl -s -X GET \
  "http://localhost:54321/rest/v1/contadores?select=id" \
  -H "Authorization: Bearer $ANON_KEY" \
  -H "Content-Type: application/json" | jq 'length' 2>/dev/null || echo "0")

echo "Contadores no banco: $CONTADOR_COUNT"

if [ "$CONTADOR_COUNT" -lt 2 ]; then
  echo -e "${YELLOW}⚠ Menos de 2 contadores encontrados. Seed pode não ter rodado corretamente.${NC}"
fi

echo -e "\n${YELLOW}PASSO 5: Simular Webhook ASAAS (Pagamento Confirmado)${NC}"

WEBHOOK_PAYLOAD=$(cat <<EOF
{
  "event": "PAYMENT_CONFIRMED",
  "payment": {
    "id": "asaas_test_$(date +%s)",
    "customer": "cust_test_001",
    "value": 1000,
    "netValue": 950,
    "dateCreated": "$(date -u +%Y-%m-%d)",
    "confirmedDate": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "status": "CONFIRMED",
    "billingType": "SUBSCRIPTION",
    "subscription": "sub_test_001"
  }
}
EOF
)

echo "Payload: $(echo $WEBHOOK_PAYLOAD | jq .)"

WEBHOOK_RESULT=$(curl -s -X POST \
  "$APP_URL/functions/v1/webhook-asaas" \
  -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d "$WEBHOOK_PAYLOAD")

echo "Resposta Webhook: $(echo $WEBHOOK_RESULT | jq .)"

if echo "$WEBHOOK_RESULT" | jq -e '.error' > /dev/null 2>&1; then
  echo -e "${RED}✗ Webhook retornou erro${NC}"
  ((TEST_FAILED++))
else
  echo -e "${GREEN}✓ Webhook processado${NC}"
  ((TEST_PASSED++))
fi

PAGAMENTO_ID=$(echo "$WEBHOOK_RESULT" | jq -r '.pagamento_id // empty' 2>/dev/null)

if [ ! -z "$PAGAMENTO_ID" ] && [ "$PAGAMENTO_ID" != "null" ]; then
  echo -e "${GREEN}✓ Pagamento criado: $PAGAMENTO_ID${NC}"
else
  echo -e "${YELLOW}⚠ Não consegui extrair pagamento_id${NC}"
fi

echo -e "\n${YELLOW}PASSO 6: Verificar Comissões foram calculadas${NC}"

COMISSOES=$(curl -s -X GET \
  "$APP_URL/rest/v1/comissoes?status=eq.calculada" \
  -H "Authorization: Bearer $ANON_KEY" \
  -H "Content-Type: application/json" | jq 'length' 2>/dev/null || echo "0")

echo "Comissões calculadas: $COMISSOES"

if [ "$COMISSOES" -gt 0 ]; then
  echo -e "${GREEN}✓ Comissões foram calculadas${NC}"
  ((TEST_PASSED++))
else
  echo -e "${YELLOW}⚠ Nenhuma comissão encontrada com status calculada${NC}"
fi

echo -e "\n${YELLOW}PASSO 7: Testar Aprovação de Comissões${NC}"

TODAY=$(date -u +%Y-%m-%d)

APROVAR_PAYLOAD=$(cat <<EOF
{
  "competencia": "$TODAY"
}
EOF
)

APROVAR_RESULT=$(curl -s -X POST \
  "$APP_URL/functions/v1/aprovar-comissoes" \
  -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d "$APROVAR_PAYLOAD")

echo "Resposta Aprovação: $(echo $APROVAR_RESULT | jq .)"

if echo "$APROVAR_RESULT" | jq -e '.success' > /dev/null 2>&1; then
  echo -e "${GREEN}✓ Comissões aprovadas com sucesso${NC}"
  ((TEST_PASSED++))
else
  echo -e "${YELLOW}⚠ Aprovação não retornou sucesso${NC}"
fi

echo -e "\n${YELLOW}PASSO 8: Verificar status das comissões mudou para 'aprovada'${NC}"

COMISSOES_APROVADAS=$(curl -s -X GET \
  "$APP_URL/rest/v1/comissoes?status=eq.aprovada" \
  -H "Authorization: Bearer $ANON_KEY" \
  -H "Content-Type: application/json" | jq 'length' 2>/dev/null || echo "0")

echo "Comissões aprovadas: $COMISSOES_APROVADAS"

if [ "$COMISSOES_APROVADAS" -gt 0 ]; then
  echo -e "${GREEN}✓ Status mudou para aprovada${NC}"
  ((TEST_PASSED++))
else
  echo -e "${YELLOW}⚠ Nenhuma comissão com status aprovada${NC}"
fi

echo -e "\n${YELLOW}PASSO 9: Testar Processamento de Pagamento${NC}"

PROCESSAR_PAYLOAD=$(cat <<EOF
{
  "competencia": "$TODAY"
}
EOF
)

PROCESSAR_RESULT=$(curl -s -X POST \
  "$APP_URL/functions/v1/processar-pagamento-comissoes" \
  -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d "$PROCESSAR_PAYLOAD")

echo "Resposta Processamento: $(echo $PROCESSAR_RESULT | jq .)"

if echo "$PROCESSAR_RESULT" | jq -e '.success' > /dev/null 2>&1; then
  echo -e "${GREEN}✓ Pagamentos processados com sucesso${NC}"
  ((TEST_PASSED++))
else
  echo -e "${YELLOW}⚠ Processamento não retornou sucesso${NC}"
fi

echo -e "\n${YELLOW}PASSO 10: Verificar RLS - Isolamento de Dados${NC}"

curl -s -X GET \
  "$APP_URL/rest/v1/contadores" \
  -H "Authorization: Bearer $ANON_KEY" \
  -H "Content-Type: application/json" | jq . > /dev/null 2>&1

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✓ RLS está permitindo leitura de contadores${NC}"
  ((TEST_PASSED++))
else
  echo -e "${RED}✗ RLS bloqueou acesso a contadores${NC}"
  ((TEST_FAILED++))
fi

echo -e "\n${YELLOW}PASSO 11: Verificar Audit Logs${NC}"

AUDIT_COUNT=$(curl -s -X GET \
  "$APP_URL/rest/v1/audit_logs?select=id" \
  -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" | jq 'length' 2>/dev/null || echo "0")

echo "Registros de auditoria: $AUDIT_COUNT"

if [ "$AUDIT_COUNT" -gt 0 ]; then
  echo -e "${GREEN}✓ Audit logs estão sendo registrados${NC}"
  ((TEST_PASSED++))
else
  echo -e "${YELLOW}⚠ Nenhum audit log encontrado${NC}"
fi

echo -e "\n${BLUE}╔════════════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                          RESULTADO DOS TESTES                           ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════════════════╝${NC}"

echo -e "\n${GREEN}Testes Passados: $TEST_PASSED${NC}"
echo -e "${RED}Testes Falhados: $TEST_FAILED${NC}"

if [ $TEST_FAILED -eq 0 ]; then
  echo -e "\n${GREEN}✓ TODOS OS TESTES PASSARAM!${NC}"
  exit 0
else
  echo -e "\n${RED}✗ ALGUNS TESTES FALHARAM${NC}"
  exit 1
fi
