#!/bin/bash

# Cores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}════════════════════════════════════════════${NC}"
echo -e "${BLUE}EXECUTAR TESTE FLÁVIO LOCALMENTE${NC}"
echo -e "${BLUE}════════════════════════════════════════════${NC}"
echo ""

# 1. Verificar se Supabase está rodando
echo -e "${YELLOW}Passo 1: Verificando Supabase local...${NC}"
STATUS=$(supabase status --workdir ./lovable-Celite 2>&1 | grep "Database URL")

if [ -z "$STATUS" ]; then
  echo -e "${RED}✗ Supabase não está rodando${NC}"
  echo -e "${YELLOW}  Execute primeiro: bash supabase/scripts/diagnose-and-start.sh${NC}"
  exit 1
fi

echo -e "${GREEN}✓ Supabase está rodando${NC}"
echo ""

# 2. Executar o script SQL
echo -e "${YELLOW}Passo 2: Executando script de limpeza e reinserção...${NC}"
echo -e "${YELLOW}  Arquivo: supabase/scripts/flavio-limpar-e-reinserir.sql${NC}"
echo ""

# Tentar usar docker exec se disponível
if command -v docker &> /dev/null; then
  CONTAINER=$(docker ps --filter "label=com.supabase.cli.project=zytxwdgzjqrcmbnpgofj" --filter "name=db" -q | head -1)

  if [ ! -z "$CONTAINER" ]; then
    echo -e "${YELLOW}  Usando Docker para executar SQL...${NC}"
    cat supabase/scripts/flavio-limpar-e-reinserir.sql | docker exec -i "$CONTAINER" psql -U postgres -d postgres
    RESULT=$?
  else
    echo -e "${YELLOW}  Container Docker não encontrado, usando arquivo...${NC}"
    RESULT=1
  fi
else
  RESULT=1
fi

# Se Docker não funcionou, informar o usuário
if [ $RESULT -ne 0 ]; then
  echo ""
  echo -e "${RED}✗ Não consegui executar SQL automaticamente${NC}"
  echo ""
  echo -e "${YELLOW}Solução: Execute o SQL manualmente${NC}"
  echo -e "  1. Abra: supabase/scripts/flavio-limpar-e-reinserir.sql"
  echo -e "  2. Copie TODO o conteúdo (Ctrl+A → Ctrl+C)"
  echo -e "  3. Vá para: https://supabase.com/dashboard/project/zytxwdgzjqrcmbnpgofj/sql/new"
  echo -e "  4. Cole (Ctrl+V) e execute (Ctrl+Enter)"
  echo ""
  exit 1
fi

echo ""
echo -e "${GREEN}✓ SQL executado com sucesso!${NC}"
echo ""
echo -e "${BLUE}════════════════════════════════════════════${NC}"
echo -e "${GREEN}Resultado esperado:${NC}"
echo ""
echo -e "  Clientes Diretos: 20"
echo -e "  Faturamento (13 meses): R\$ 36.010,00"
echo -e "  Bônus Inseridos: 7 registros = R\$ 1.638,75"
echo -e "  Total Ano 1: R\$ 11.205,75"
echo ""
echo -e "${BLUE}════════════════════════════════════════════${NC}"
