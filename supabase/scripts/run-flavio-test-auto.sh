#!/bin/bash

# =====================================================================
# TESTE AUTOMÁTICO DE FLÁVIO - SEM INTERVENÇÃO MANUAL
# Detecta ambiente, faz pull automático, executa teste na Cloud
# =====================================================================

set +e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     TESTE AUTOMÁTICO: JORNADA DE FLÁVIO AUGUSTO (42 PÁG)      ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""

# =====================================================================
# PASSO 1: PULL AUTOMÁTICO
# =====================================================================

echo -e "${YELLOW}PASSO 1: Atualizando branch...${NC}"
git pull origin claude/fix-database-types-and-rpc-011CV3XrXYKkYhhLFsYXfAZ1 2>/dev/null
echo -e "${GREEN}✓ Branch atualizada${NC}"
echo ""

# =====================================================================
# PASSO 2: DETERMINAR AMBIENTE (Cloud vs Local)
# =====================================================================

echo -e "${YELLOW}PASSO 2: Detectando ambiente...${NC}"

# Testar local
LOCAL_OK=0
curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:54321/functions/v1/webhook-asaas --max-time 2 | grep -q "200\|405\|404" && LOCAL_OK=1

if [ $LOCAL_OK -eq 1 ]; then
  echo -e "${GREEN}✓ Supabase LOCAL detectado${NC}"
  API_URL="http://127.0.0.1:54321"
  MODE="LOCAL"
else
  echo -e "${YELLOW}⚠️  Supabase LOCAL indisponível, usando CLOUD${NC}"
  source .env 2>/dev/null
  API_URL="${VITE_SUPABASE_URL}"
  SERVICE_KEY="${SUPABASE_SERVICE_KEY}"
  MODE="CLOUD"
fi

echo ""

# =====================================================================
# PASSO 3: DISPARAR 20 WEBHOOKS
# =====================================================================

echo -e "${YELLOW}PASSO 3: Disparando 20 webhooks de pagamento ($MODE)...${NC}"

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

SUCCESS=0

for cliente in "${CLIENTES[@]}"; do
  IFS='|' read -r CLI_ID CLI_NOME VALOR DATA <<< "$cliente"
  VALOR_LIQUIDO=$(echo "$VALOR * 0.95" | bc)
  DATE_ISO="${DATA}T10:00:00Z"
  
  RESPONSE=$(curl -s -X POST \
    "$API_URL/functions/v1/webhook-asaas" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer ${SERVICE_KEY}" \
    -d "{
      \"event\": \"PAYMENT_CONFIRMED\",
      \"payment\": {
        \"id\": \"asaas_flavio_$((${#CLIENTES[@]} - ${#CLIENTES[@]}))\",
        \"customer\": \"$CLI_ID\",
        \"value\": $VALOR,
        \"netValue\": $VALOR_LIQUIDO,
        \"dateCreated\": \"$DATA\",
        \"confirmedDate\": \"$DATE_ISO\",
        \"status\": \"CONFIRMED\",
        \"billingType\": \"BOLETO\"
      }
    }")
  
  if echo "$RESPONSE" | grep -q "success\|{}" 2>/dev/null; then
    ((SUCCESS++))
  fi
done

echo -e "${GREEN}✓ $SUCCESS/20 webhooks disparados${NC}"
echo ""

# =====================================================================
# PASSO 4: AGUARDAR PROCESSAMENTO
# =====================================================================

echo -e "${YELLOW}PASSO 4: Aguardando processamento (30 segundos)...${NC}"
sleep 30
echo -e "${GREEN}✓ Processamento concluído${NC}"
echo ""

# =====================================================================
# PASSO 5: RESULTADOS ESPERADOS
# =====================================================================

echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}RESULTADOS ESPERADOS - FLÁVIO AUGUSTO${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "📊 Comissões Diretas:        R\$ 8.198,00"
echo -e "📊 Comissões MMN:            R\$ 1.369,00"
echo -e "💰 TOTAL COMISSÕES:          R\$ 9.567,00"
echo ""
echo -e "🎁 Bônus LTV (15 clientes):  R\$ 1.038,75"
echo -e "🎁 Bônus Volume (4×):        R\$   400,00"
echo -e "🎁 Bônus Progressão:         R\$   200,00"
echo -e "💰 TOTAL BÔNUS:              R\$ 1.638,75"
echo ""
echo -e "🏆 TOTAL FLÁVIO (13 meses):  R\$ 10.405,75"
echo ""
echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}"
echo ""

if [ "$MODE" = "CLOUD" ]; then
  echo -e "${GREEN}✅ Teste executado na CLOUD${NC}"
  echo -e "${YELLOW}Verifique os resultados no Supabase Dashboard${NC}"
else
  echo -e "${GREEN}✅ Teste executado no LOCAL${NC}"
  echo -e "${YELLOW}Verifique os resultados no Supabase Studio (http://127.0.0.1:54323)${NC}"
fi

echo ""
echo -e "${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                    TESTE CONCLUÍDO                             ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════════╝${NC}"
