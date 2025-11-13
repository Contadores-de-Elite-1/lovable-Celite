#!/bin/bash

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}════════════════════════════════════════════${NC}"
echo -e "${BLUE}DIAGNÓSTICO E INÍCIO DO SUPABASE LOCAL${NC}"
echo -e "${BLUE}════════════════════════════════════════════${NC}"
echo ""

# 1. Verificar porta 54321
echo -e "${YELLOW}1. Verificando porta 54321...${NC}"
if lsof -Pi :54321 -sTCP:LISTEN -t > /dev/null 2>&1 ; then
  echo -e "${GREEN}✓ Porta 54321 está aberta${NC}"
else
  echo -e "${RED}✗ Porta 54321 NÃO está aberta${NC}"
fi

# 2. Verificar se Supabase está rodando
echo ""
echo -e "${YELLOW}2. Verificando processo Supabase...${NC}"
if pgrep -f "supabase" > /dev/null; then
  echo -e "${GREEN}✓ Processo Supabase encontrado${NC}"
else
  echo -e "${RED}✗ Nenhum processo Supabase encontrado${NC}"
fi

# 3. Tentar conectar
echo ""
echo -e "${YELLOW}3. Testando conexão com 127.0.0.1:54321...${NC}"
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:54321/functions/v1/webhook-asaas --max-time 2)

if [ "$RESPONSE" = "405" ] || [ "$RESPONSE" = "200" ] || [ "$RESPONSE" = "404" ]; then
  echo -e "${GREEN}✓ Conexão OK (HTTP $RESPONSE)${NC}"
  exit 0
else
  echo -e "${RED}✗ Sem resposta (HTTP $RESPONSE)${NC}"
fi

# 4. Se não respondeu, tentar reiniciar
echo ""
echo -e "${YELLOW}4. Tentando reiniciar Supabase...${NC}"

# Parar
echo -e "${YELLOW}  Parando Supabase...${NC}"
npx supabase stop 2>/dev/null

# Aguardar 2 segundos
sleep 2

# Iniciar
echo -e "${YELLOW}  Iniciando Supabase...${NC}"
npx supabase start

echo ""
echo -e "${YELLOW}5. Testando conexão novamente...${NC}"
sleep 3

RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:54321/functions/v1/webhook-asaas --max-time 2)

if [ "$RESPONSE" = "405" ] || [ "$RESPONSE" = "200" ] || [ "$RESPONSE" = "404" ]; then
  echo -e "${GREEN}✓ Supabase iniciado com sucesso!${NC}"
  echo ""
  echo -e "${BLUE}════════════════════════════════════════════${NC}"
  echo -e "${GREEN}Supabase está pronto. Agora execute:${NC}"
  echo -e "  ${YELLOW}bash supabase/scripts/test-flavio-local.sh${NC}"
  echo -e "${BLUE}════════════════════════════════════════════${NC}"
  exit 0
else
  echo -e "${RED}✗ Supabase ainda não está respondendo${NC}"
  echo -e "${RED}  Tente: npx supabase stop && npx supabase start${NC}"
  exit 1
fi
