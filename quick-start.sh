#!/bin/bash

# ============================================================================
# CONTADORES DE ELITE - QUICK START
# ============================================================================
# Script para iniciar o desenvolvimento rapidamente
# ============================================================================

set -e  # Exit on error

echo "🚀 Contadores de Elite - Quick Start"
echo "===================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if .env exists
if [ ! -f .env ]; then
  echo -e "${YELLOW}⚠️  Arquivo .env não encontrado${NC}"
  echo ""
  echo "Criando .env a partir de .env.example..."
  cp .env.example .env
  echo -e "${GREEN}✅ Arquivo .env criado${NC}"
  echo ""
  echo -e "${YELLOW}⚠️  IMPORTANTE: Edite o arquivo .env e preencha as variáveis antes de continuar${NC}"
  echo ""
  echo "Execute:"
  echo "  1. supabase start (para iniciar Supabase local)"
  echo "  2. supabase status (para ver as credenciais)"
  echo "  3. Edite .env com as credenciais do supabase status"
  echo "  4. Execute este script novamente: ./quick-start.sh"
  echo ""
  exit 1
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
  echo "📦 Instalando dependências..."
  npm install
  echo -e "${GREEN}✅ Dependências instaladas${NC}"
  echo ""
fi

# Check if Supabase is running
echo "🔍 Verificando Supabase..."
if ! curl -s http://127.0.0.1:54321/rest/v1/ > /dev/null 2>&1; then
  echo -e "${YELLOW}⚠️  Supabase não está rodando${NC}"
  echo ""
  echo "Iniciando Supabase local..."
  supabase start
  echo -e "${GREEN}✅ Supabase iniciado${NC}"
  echo ""
else
  echo -e "${GREEN}✅ Supabase já está rodando${NC}"
  echo ""
fi

# Show Supabase status
echo "📊 Status do Supabase:"
supabase status
echo ""

# Ask user what they want to do
echo "O que você quer fazer?"
echo ""
echo "  1) Iniciar servidor de desenvolvimento (npm run dev)"
echo "  2) Fazer build de produção (npm run build)"
echo "  3) Executar testes"
echo "  4) Ver logs do Supabase"
echo "  5) Resetar banco de dados (supabase db reset)"
echo "  6) Sair"
echo ""
read -p "Escolha uma opção (1-6): " choice

case $choice in
  1)
    echo ""
    echo "🚀 Iniciando servidor de desenvolvimento..."
    echo ""
    echo -e "${GREEN}Aplicação disponível em: http://localhost:8080${NC}"
    echo ""
    npm run dev
    ;;
  2)
    echo ""
    echo "🏗️  Fazendo build de produção..."
    npm run build
    echo ""
    echo -e "${GREEN}✅ Build completo! Arquivos em: dist/${NC}"
    echo ""
    echo "Para testar o build localmente:"
    echo "  npm run preview"
    ;;
  3)
    echo ""
    echo "🧪 Executando testes..."
    npm test
    ;;
  4)
    echo ""
    echo "📋 Logs do Supabase (Ctrl+C para sair):"
    supabase logs --tail
    ;;
  5)
    echo ""
    echo -e "${YELLOW}⚠️  Isso vai RESETAR o banco de dados. Todos os dados serão perdidos!${NC}"
    read -p "Tem certeza? (s/N): " confirm
    if [ "$confirm" = "s" ] || [ "$confirm" = "S" ]; then
      supabase db reset
      echo -e "${GREEN}✅ Banco de dados resetado${NC}"
    else
      echo "Operação cancelada"
    fi
    ;;
  6)
    echo "👋 Até logo!"
    exit 0
    ;;
  *)
    echo -e "${RED}❌ Opção inválida${NC}"
    exit 1
    ;;
esac
