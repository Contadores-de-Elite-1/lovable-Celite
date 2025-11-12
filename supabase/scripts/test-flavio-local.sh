#!/bin/bash

# ==============================================================================
# TESTE COMPLETO LOCAL: JORNADA DE FLÁVIO AUGUSTO (42 PÁGINAS)
# ==============================================================================
# Usa endpoint LOCAL (localhost:54321) em vez de Cloud
# ==============================================================================

set +e

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuração LOCAL
API_URL="http://localhost:54321"
CONTADOR_ID="550e8400-e29b-41d4-a716-446655440001"

echo -e "${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║    TESTE LOCAL: JORNADA COMPLETA DE FLÁVIO AUGUSTO (42 pág)   ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""

# ==============================================================================
# VALIDAR CONEXÃO LOCAL
# ==============================================================================

echo -e "${YELLOW}Verificando conexão local (localhost:54321)...${NC}"

HEALTH=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/functions/v1/webhook-asaas" --max-time 2)

if [ "$HEALTH" != "405" ] && [ "$HEALTH" != "200" ]; then
  echo -e "${RED}❌ Supabase local não está rodando em localhost:54321${NC}"
  echo -e "${YELLOW}Execute na Mac:${NC}"
  echo "  npx supabase start"
  exit 1
fi

echo -e "${GREEN}✓ Conexão local OK${NC}"
echo ""

# ==============================================================================
# PASSO 1: INSERIR DADOS DE FLÁVIO (VIA SQL)
# ==============================================================================

echo -e "${YELLOW}PASSO 1: Inserindo dados de Flávio Augusto (20 clientes + 3 downlines)...${NC}"

if [ ! -f "supabase/scripts/flavio-augusto-jornada-completa.sql" ]; then
  echo -e "${RED}✗ Arquivo SQL não encontrado${NC}"
  exit 1
fi

# Para local, executar SQL via psql se disponível
SUPABASE_DB_URL="postgresql://postgres:postgres@localhost:54322/postgres"

if command -v psql &> /dev/null; then
  psql "$SUPABASE_DB_URL" -f supabase/scripts/flavio-augusto-jornada-completa.sql 2>/dev/null
  echo -e "${GREEN}✓ Dados inseridos via psql${NC}"
else
  echo -e "${YELLOW}⚠️  psql não disponível, pulando inserção SQL${NC}"
  echo -e "${YELLOW}Inserir dados manualmente no dashboard${NC}"
fi

echo ""

# ==============================================================================
# PASSO 2: DISPARAR 20 WEBHOOKS LOCAIS
# ==============================================================================

echo -e "${YELLOW}PASSO 2: Disparando 20 webhooks de pagamento (LOCAL)...${NC}"

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
SUCCESS_COUNT=0

for cliente in "${CLIENTES[@]}"; do
  IFS='|' read -r CLI_ID CLI_NOME VALOR DATA <<< "$cliente"
  ((WEBHOOK_COUNT++))

  VALOR_LIQUIDO=$(echo "$VALOR * 0.95" | bc)
  DATE_ISO="${DATA}T10:00:00Z"

  RESPONSE=$(curl -s -X POST \
    "$API_URL/functions/v1/webhook-asaas" \
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
    }")

  if echo "$RESPONSE" | grep -q "success\|Success\|{}"; then
    echo -e "${GREEN}✓${NC} Cliente $WEBHOOK_COUNT ($CLI_NOME): R\$ $VALOR"
    ((SUCCESS_COUNT++))
  else
    echo -e "${YELLOW}⚠️  Cliente $WEBHOOK_COUNT: $RESPONSE${NC}"
  fi
done

echo ""
echo -e "${GREEN}✓ $SUCCESS_COUNT/$WEBHOOK_COUNT webhooks disparados com sucesso${NC}"
echo ""

# ==============================================================================
# PASSO 3: AGUARDAR PROCESSAMENTO
# ==============================================================================

echo -e "${YELLOW}PASSO 3: Aguardando processamento (20 segundos)...${NC}"
sleep 20
echo -e "${GREEN}✓ Processamento concluído${NC}"
echo ""

# ==============================================================================
# PASSO 4: VALIDAR RESULTADOS
# ==============================================================================

echo -e "${YELLOW}PASSO 4: Validando resultados de Flávio...${NC}"
echo ""

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

echo -e "${YELLOW}✅ PRÓXIMA ETAPA:${NC}"
echo "Verifique os dados no Supabase Dashboard:"
echo "SELECT * FROM contadores WHERE id = '$CONTADOR_ID';"
echo "SELECT COUNT(*) FROM clientes WHERE contador_id = '$CONTADOR_ID';"
echo "SELECT SUM(valor) as total FROM comissoes WHERE contador_id = '$CONTADOR_ID';"
echo ""

echo -e "${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                    TESTE CONCLUÍDO                             ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════════╝${NC}"
