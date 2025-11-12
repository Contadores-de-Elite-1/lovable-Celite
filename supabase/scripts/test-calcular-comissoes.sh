#!/usr/bin/env bash

# ============================================================================
# SCRIPT DE TESTE: Calcular Comissões
# ============================================================================
# Uso: ./supabase/scripts/test-calcular-comissoes.sh
#
# Variáveis de ambiente esperadas:
#   APP_URL         - URL base da aplicação (ex: http://localhost:54321)
#   ANON_KEY        - Chave anônima do Supabase
#   ENVIRONMENT     - development ou production (opcional)
#
# Exemplos:
#   # Local
#   APP_URL=http://localhost:54321 ANON_KEY=eyJxxx... ./supabase/scripts/test-calcular-comissoes.sh
#
#   # Com production
#   APP_URL=https://api.example.com ANON_KEY=eyJxxx... ENVIRONMENT=production ./supabase/scripts/test-calcular-comissoes.sh
#
# ============================================================================

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Validar variáveis de ambiente obrigatórias
if [ -z "$APP_URL" ]; then
  echo -e "${RED}✗ Erro: APP_URL não definida${NC}"
  echo "Use: APP_URL=http://localhost:54321 ANON_KEY=xyz... $0"
  exit 1
fi

if [ -z "$ANON_KEY" ]; then
  echo -e "${RED}✗ Erro: ANON_KEY não definida${NC}"
  echo "Use: APP_URL=http://localhost:54321 ANON_KEY=xyz... $0"
  exit 1
fi

ENVIRONMENT="${ENVIRONMENT:-development}"
FUNCTION_URL="${APP_URL}/functions/v1/calcular-comissoes"

echo -e "${YELLOW}=== TESTE: CALCULAR COMISSÕES ===${NC}"
echo "App URL: $APP_URL"
echo "Function URL: $FUNCTION_URL"
echo "Environment: $ENVIRONMENT"
echo

# 2. IDs FIXOS (mesmos da seed)
CONTADOR_ID="550e8400-e29b-41d4-a716-446655440001"
CLIENTE_ID="550e8400-e29b-41d4-a716-446655440011"
PAGAMENTO_ID="550e8400-e29b-41d4-a716-446655440021"
COMPETENCIA="2025-11-01"
VALOR_LIQUIDO=1000.00

echo -e "${YELLOW}📊 Dados de Teste:${NC}"
echo "  Contador ID: $CONTADOR_ID"
echo "  Cliente ID: $CLIENTE_ID"
echo "  Pagamento ID: $PAGAMENTO_ID"
echo "  Competência: $COMPETENCIA"
echo "  Valor Líquido: $VALOR_LIQUIDO"
echo

# 3. TESTE 1: Request válido
echo -e "${YELLOW}[TEST 1] Request válido - esperado 201${NC}"

PAYLOAD_1=$(cat <<EOF
{
  "pagamento_id": "$PAGAMENTO_ID",
  "cliente_id": "$CLIENTE_ID",
  "contador_id": "$CONTADOR_ID",
  "valor_liquido": $VALOR_LIQUIDO,
  "competencia": "$COMPETENCIA",
  "is_primeira_mensalidade": true
}
EOF
)

echo "Payload:"
echo "$PAYLOAD_1" | jq .
echo

RESPONSE_1=$(curl -s -X POST \
  "$FUNCTION_URL" \
  -H "Authorization: Bearer $ANON_KEY" \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD_1" \
  -w "\n%{http_code}")

HTTP_CODE=$(echo "$RESPONSE_1" | tail -n 1)
BODY=$(echo "$RESPONSE_1" | head -n -1)

echo "Response HTTP $HTTP_CODE:"
echo "$BODY" | jq . 2>/dev/null || echo "$BODY"
echo

if [ "$HTTP_CODE" = "201" ] || [ "$HTTP_CODE" = "200" ]; then
  echo -e "${GREEN}✓ TEST 1 PASSED${NC}"
else
  echo -e "${RED}✗ TEST 1 FAILED${NC}"
fi

echo

# 4. TESTE 2: Idempotência - mesmo request
echo -e "${YELLOW}[TEST 2] Idempotência - mesmo request deve retornar 200${NC}"

RESPONSE_2=$(curl -s -X POST \
  "$FUNCTION_URL" \
  -H "Authorization: Bearer $ANON_KEY" \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD_1" \
  -w "\n%{http_code}")

HTTP_CODE=$(echo "$RESPONSE_2" | tail -n 1)
BODY=$(echo "$RESPONSE_2" | head -n -1)

echo "Response HTTP $HTTP_CODE:"
echo "$BODY" | jq . 2>/dev/null || echo "$BODY"
echo

if [ "$HTTP_CODE" = "200" ]; then
  echo -e "${GREEN}✓ TEST 2 PASSED (Idempotência funcionando)${NC}"
else
  echo -e "${RED}✗ TEST 2 FAILED (Esperado 200, obteve $HTTP_CODE)${NC}"
fi

echo

# 5. TESTE 3: Validação - Payload inválido (JSON malformado)
echo -e "${YELLOW}[TEST 3] Validação - JSON malformado deve retornar 400${NC}"

RESPONSE_3=$(curl -s -X POST \
  "$FUNCTION_URL" \
  -H "Authorization: Bearer $ANON_KEY" \
  -H "Content-Type: application/json" \
  -d "{ invalid json }" \
  -w "\n%{http_code}")

HTTP_CODE=$(echo "$RESPONSE_3" | tail -n 1)
BODY=$(echo "$RESPONSE_3" | head -n -1)

echo "Response HTTP $HTTP_CODE:"
echo "$BODY" | jq . 2>/dev/null || echo "$BODY"
echo

if [ "$HTTP_CODE" = "400" ]; then
  echo -e "${GREEN}✓ TEST 3 PASSED (Validação de JSON funcionando)${NC}"
else
  echo -e "${YELLOW}⚠ TEST 3 INFO: Esperado 400, obteve $HTTP_CODE${NC}"
fi

echo

# 6. TESTE 4: Validação - Campo obrigatório faltando
echo -e "${YELLOW}[TEST 4] Validação - Campo obrigatório faltando deve retornar 400${NC}"

PAYLOAD_4=$(cat <<EOF
{
  "pagamento_id": "$PAGAMENTO_ID",
  "cliente_id": "$CLIENTE_ID"
}
EOF
)

RESPONSE_4=$(curl -s -X POST \
  "$FUNCTION_URL" \
  -H "Authorization: Bearer $ANON_KEY" \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD_4" \
  -w "\n%{http_code}")

HTTP_CODE=$(echo "$RESPONSE_4" | tail -n 1)
BODY=$(echo "$RESPONSE_4" | head -n -1)

echo "Response HTTP $HTTP_CODE:"
echo "$BODY" | jq . 2>/dev/null || echo "$BODY"
echo

if [ "$HTTP_CODE" = "400" ]; then
  echo -e "${GREEN}✓ TEST 4 PASSED (Validação de campos funcionando)${NC}"
else
  echo -e "${YELLOW}⚠ TEST 4 INFO: Esperado 400, obteve $HTTP_CODE${NC}"
fi

echo

# 7. TESTE 5: Validação - Formato de data inválido
echo -e "${YELLOW}[TEST 5] Validação - Data inválida deve retornar 400${NC}"

PAYLOAD_5=$(cat <<EOF
{
  "pagamento_id": "$PAGAMENTO_ID",
  "cliente_id": "$CLIENTE_ID",
  "contador_id": "$CONTADOR_ID",
  "valor_liquido": $VALOR_LIQUIDO,
  "competencia": "2025-13-45",
  "is_primeira_mensalidade": true
}
EOF
)

RESPONSE_5=$(curl -s -X POST \
  "$FUNCTION_URL" \
  -H "Authorization: Bearer $ANON_KEY" \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD_5" \
  -w "\n%{http_code}")

HTTP_CODE=$(echo "$RESPONSE_5" | tail -n 1)
BODY=$(echo "$RESPONSE_5" | head -n -1)

echo "Response HTTP $HTTP_CODE:"
echo "$BODY" | jq . 2>/dev/null || echo "$BODY"
echo

if [ "$HTTP_CODE" = "400" ]; then
  echo -e "${GREEN}✓ TEST 5 PASSED (Validação de formato de data funcionando)${NC}"
else
  echo -e "${YELLOW}⚠ TEST 5 INFO: Esperado 400, obteve $HTTP_CODE${NC}"
fi

echo

echo -e "${GREEN}=== TESTES CONCLUÍDOS ===${NC}"
echo
echo "Próximas ações:"
echo "  1. Verificar logs: supabase functions list"
echo "  2. Consultar comissões criadas:"
echo "     SELECT * FROM comissoes WHERE pagamento_id = '$PAGAMENTO_ID';"
echo "  3. Verificar logs de cálculo:"
echo "     SELECT * FROM comissoes_calculo_log WHERE comissao_id IN (SELECT id FROM comissoes WHERE pagamento_id = '$PAGAMENTO_ID');"
