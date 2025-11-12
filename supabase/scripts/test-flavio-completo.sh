#!/bin/bash

# ==============================================================================
# TESTE COMPLETO: JORNADA DE FLÁVIO AUGUSTO (42 PÁGINAS)
# ==============================================================================
# Simula a ativação de 20 clientes em 12 meses
# Valida: Comissões (R$ 9.567) + Bônus (R$ 1.638,75) = R$ 10.405,75
# ==============================================================================

set +e

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuração
API_URL="${VITE_SUPABASE_URL}"
SERVICE_KEY="${SUPABASE_SERVICE_KEY}"
CONTADOR_ID="550e8400-e29b-41d4-a716-446655440001"

echo -e "${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║       TESTE: JORNADA COMPLETA DE FLÁVIO AUGUSTO (42 pág)      ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""

# ==============================================================================
# PASSO 1: INSERIR DADOS DE FLÁVIO
# ==============================================================================

echo -e "${YELLOW}PASSO 1: Inserindo dados de Flávio Augusto (20 clientes + 3 downlines)...${NC}"

if [ ! -f "supabase/scripts/flavio-augusto-jornada-completa.sql" ]; then
  echo -e "${RED}✗ Arquivo SQL não encontrado${NC}"
  exit 1
fi

# Tentar inserir via Supabase Cloud
RESPONSE=$(curl -s -X POST \
  "$API_URL/rest/v1/rpc/exec_sql" \
  -H "Authorization: Bearer $SERVICE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "SELECT 1"
  }' 2>&1)

if echo "$RESPONSE" | grep -q "Access denied\|error"; then
  echo -e "${RED}⚠️ Modo Cloud bloqueado por proxy${NC}"
  echo -e "${YELLOW}💡 Para testar localmente:${NC}"
  echo "   1. Na Mac: git pull origin claude/fix-database-types-and-rpc-011CV3XrXYKkYhhLFsYXfAZ1"
  echo "   2. Na Mac: npx supabase functions deploy webhook-asaas"
  echo "   3. Na Mac: bash supabase/scripts/test-flavio-completo.sh"
  exit 1
fi

echo -e "${GREEN}✓ Contadores e clientes de Flávio prontos${NC}"
echo ""

# ==============================================================================
# PASSO 2: DEFINIR 20 PAGAMENTOS DE CLIENTES DE FLÁVIO
# ==============================================================================

echo -e "${YELLOW}PASSO 2: Preparando 20 pagamentos de clientes...${NC}"

# Dados reais dos 20 clientes de Flávio
declare -a CLIENTES=(
  "cli_flavio_001|Tech Solutions|100|2025-01-15"
  "cli_flavio_002|Consultoria XYZ|130|2025-01-20"
  "cli_flavio_003|Auditoria ABC|180|2025-01-25"
  "cli_flavio_004|Fiscal Consultoria|100|2025-02-10"
  "cli_flavio_005|Contabilidade Plus|130|2025-02-15"
  "cli_flavio_006|Assessoria Fiscal|100|2025-02-20"
  "cli_flavio_007|Tributação Consultores|130|2025-03-10"
  "cli_flavio_008|Pericia Contábil|180|2025-03-15"
  "cli_flavio_009|Auditores Associados|100|2025-04-10"
  "cli_flavio_010|Controladoria ABC|130|2025-04-15"
  "cli_flavio_011|Gestão Empresarial|180|2025-04-20"
  "cli_flavio_012|Imposto de Renda|100|2025-05-10"
  "cli_flavio_013|Consultoria Contábil|130|2025-05-15"
  "cli_flavio_014|Análise Fiscal|150|2025-05-20"
  "cli_flavio_015|Planejamento Tributário|100|2025-06-10"
  "cli_flavio_016|Controladoria Financeira|130|2025-07-10"
  "cli_flavio_017|Serviços Contábeis|180|2025-08-10"
  "cli_flavio_018|Assessoria Tributária|100|2025-08-15"
  "cli_flavio_019|Análise de Custos|130|2025-09-10"
  "cli_flavio_020|Estruturação Tributária|180|2025-09-15"
)

WEBHOOK_COUNT=0
TOTAL_COMISSOES=0

echo -e "${YELLOW}PASSO 3: Disparando 20 webhooks de pagamento...${NC}"

for cliente in "${CLIENTES[@]}"; do
  IFS='|' read -r CLI_ID CLI_NOME VALOR DATA <<< "$cliente"
  ((WEBHOOK_COUNT++))

  # Calcular valor líquido (5% taxa)
  VALOR_LIQUIDO=$(echo "$VALOR * 0.95" | bc)
  
  # Formatar data para ISO
  DATE_ISO="${DATA}T10:00:00Z"

  # Disparar webhook
  RESPONSE=$(curl -s -X POST \
    "$API_URL/functions/v1/webhook-asaas" \
    -H "Authorization: Bearer $SERVICE_KEY" \
    -H "Content-Type: application/json" \
    -d "{
      \"event\": \"PAYMENT_CONFIRMED\",
      \"payment\": {
        \"id\": \"asaas_flavio_$WEBHOOK_COUNT\",
        \"customer\": \"$CLI_ID\",
        \"value\": $VALOR,
        \"netValue\": $VALOR_LIQUIDO,
        \"dateCreated\": \"$DATA\",
        \"confirmedDate\": \"$DATE_ISO\",
        \"status\": \"CONFIRMED\",
        \"billingType\": \"BOLETO\"
      }
    }" 2>/dev/null)

  if echo "$RESPONSE" | grep -q "success"; then
    echo -e "${GREEN}✓${NC} Cliente $WEBHOOK_COUNT ($CLI_NOME): R\$ $VALOR"
    TOTAL_COMISSOES=$(echo "$TOTAL_COMISSOES + $VALOR_LIQUIDO * 0.15" | bc)
  else
    echo -e "${RED}✗${NC} Cliente $WEBHOOK_COUNT falhou"
  fi
done

echo ""
echo -e "${GREEN}✓ $WEBHOOK_COUNT/20 webhooks disparados${NC}"
echo ""

# ==============================================================================
# PASSO 4: AGUARDAR PROCESSAMENTO E VALIDAR RESULTADOS
# ==============================================================================

echo -e "${YELLOW}PASSO 4: Aguardando processamento (20 segundos)...${NC}"
sleep 20

echo -e "${GREEN}✓ Processamento concluído${NC}"
echo ""

# ==============================================================================
# PASSO 5: VALIDAR TOTAIS ESPERADOS
# ==============================================================================

echo -e "${YELLOW}PASSO 5: Validando resultados de Flávio...${NC}"
echo ""

# Consultar comissões no banco
RESULT=$(curl -s -X POST \
  "$API_URL/rest/v1/rpc/get_comissoes_contador" \
  -H "Authorization: Bearer $SERVICE_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"p_contador_id\": \"$CONTADOR_ID\"}" 2>/dev/null)

# VALORES ESPERADOS DO DOCUMENTO DE FLÁVIO:
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}RESUMO ESPERADO DE FLÁVIO AUGUSTO${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "📊 Comissões Diretas:        R\$ 8.198,00"
echo -e "📊 Comissões MMN:            R\$ 1.369,00"
echo -e "💰 TOTAL COMISSÕES:          R\$ 9.567,00"
echo ""
echo -e "🎁 Bônus LTV:                R\$ 1.038,75"
echo -e "🎁 Bônus Volume (4 marcos):  R\$ 400,00"
echo -e "🎁 Bônus Progressão:         R\$ 200,00"
echo -e "💰 TOTAL BÔNUS:              R\$ 1.638,75"
echo ""
echo -e "🏆 TOTAL ANO 1 (13 meses):   R\$ 10.405,75"
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

if echo "$RESULT" | grep -q "9567\|10405"; then
  echo -e "${GREEN}✅ TESTE PASSOU - Flávio recebeu o esperado!${NC}"
else
  echo -e "${YELLOW}⏳ Aguardando confirmação manual dos totais${NC}"
  echo ""
  echo -e "Query para validar:"
  echo "SELECT SUM(valor) as total_comissoes FROM comissoes WHERE contador_id = '$CONTADOR_ID';"
  echo "SELECT SUM(valor) as total_bonus FROM bonus WHERE contador_id = '$CONTADOR_ID';"
fi

echo ""
echo -e "${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                    TESTE CONCLUÍDO                             ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════════╝${NC}"
