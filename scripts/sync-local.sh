#!/bin/bash

# ============================================================================
# SYNC LOCAL - Desenvolvimento
# ============================================================================
# Sincroniza mudanças local <-> GitHub
# Atualiza dependências e banco de dados local
# ============================================================================

set -e

echo "🔄 Sync Local - Desenvolvimento"
echo "==============================="
echo ""

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# ============================================================================
# 1. GIT PULL - Puxar mudanças do GitHub
# ============================================================================

echo -e "${BLUE}[1/5] Pulling do GitHub...${NC}"

CURRENT_BRANCH=$(git branch --show-current)
echo "   Branch: $CURRENT_BRANCH"

# Stash changes if any
if [[ -n $(git status -s) ]]; then
  echo -e "${YELLOW}   Salvando mudanças locais...${NC}"
  git stash
  STASHED=true
else
  STASHED=false
fi

# Pull with retry
MAX_RETRIES=4
RETRY_DELAY=2

for i in $(seq 1 $MAX_RETRIES); do
  if git pull origin $CURRENT_BRANCH; then
    echo -e "${GREEN}✅ Pull OK${NC}"
    break
  else
    if [ $i -lt $MAX_RETRIES ]; then
      echo -e "${YELLOW}⚠️  Tentativa $i falhou, tentando novamente em ${RETRY_DELAY}s...${NC}"
      sleep $RETRY_DELAY
      RETRY_DELAY=$((RETRY_DELAY * 2))
    else
      echo -e "${RED}❌ Pull falhou após $MAX_RETRIES tentativas${NC}"
      exit 1
    fi
  fi
done

# Restore stashed changes
if [ "$STASHED" = true ]; then
  echo "   Restaurando mudanças locais..."
  if git stash pop; then
    echo -e "${GREEN}   Mudanças restauradas${NC}"
  else
    echo -e "${YELLOW}   ⚠️  Conflitos detectados - resolva manualmente${NC}"
  fi
fi

# ============================================================================
# 2. NPM - Atualizar dependências
# ============================================================================

echo ""
echo -e "${BLUE}[2/5] Verificando dependências...${NC}"

# Check if package.json or package-lock.json changed
if git diff HEAD@{1} --name-only | grep -q "package"; then
  echo "   Dependências mudaram, atualizando..."
  npm install
  echo -e "${GREEN}✅ Dependências atualizadas${NC}"
else
  echo "   Sem mudanças em dependências"
fi

# ============================================================================
# 3. SUPABASE - Sync migrations
# ============================================================================

echo ""
echo -e "${BLUE}[3/5] Supabase local...${NC}"

if ! command -v supabase &> /dev/null; then
  echo -e "${YELLOW}   ⚠️  Supabase CLI não instalado${NC}"
  echo "   Instale: https://supabase.com/docs/guides/cli"
else
  # Check if Supabase is running
  if curl -s http://127.0.0.1:54321/rest/v1/ > /dev/null 2>&1; then
    echo "   Supabase já está rodando"

    # Check for new migrations
    if git diff HEAD@{1} --name-only | grep -q "supabase/migrations"; then
      echo "   Novas migrações detectadas, aplicando..."
      read -p "   Resetar banco de dados local? (s/N): " reset_db
      if [ "$reset_db" = "s" ] || [ "$reset_db" = "S" ]; then
        supabase db reset
        echo -e "${GREEN}   ✅ Banco resetado e migrações aplicadas${NC}"
      else
        echo "   Migrações não aplicadas (requer reset)"
      fi
    fi
  else
    echo "   Supabase não está rodando"
    read -p "   Iniciar Supabase local? (s/N): " start_supabase
    if [ "$start_supabase" = "s" ] || [ "$start_supabase" = "S" ]; then
      supabase start
      echo -e "${GREEN}   ✅ Supabase iniciado${NC}"
    fi
  fi
fi

# ============================================================================
# 4. ENV - Verificar variáveis de ambiente
# ============================================================================

echo ""
echo -e "${BLUE}[4/5] Verificando .env...${NC}"

if [ ! -f ".env" ]; then
  echo -e "${YELLOW}   ⚠️  Arquivo .env não encontrado${NC}"
  read -p "   Criar de .env.example? (s/N): " create_env
  if [ "$create_env" = "s" ] || [ "$create_env" = "S" ]; then
    cp .env.example .env
    echo -e "${GREEN}   ✅ .env criado${NC}"
    echo -e "${YELLOW}   ⚠️  IMPORTANTE: Configure as variáveis em .env${NC}"
  fi
else
  echo "   .env existe"
fi

# ============================================================================
# 5. BUILD TEST - Verificar se build funciona
# ============================================================================

echo ""
echo -e "${BLUE}[5/5] Testando build...${NC}"

if npm run build > /tmp/build.log 2>&1; then
  echo -e "${GREEN}✅ Build OK${NC}"
  # Clean build
  rm -rf dist
else
  echo -e "${YELLOW}⚠️  Build falhou${NC}"
  echo "   Ver log: /tmp/build.log"
fi

# ============================================================================
# RESUMO
# ============================================================================

echo ""
echo "==============================="
echo -e "${GREEN}✅ Sync Completo!${NC}"
echo "==============================="
echo ""
echo "Status:"
echo "  ✅ Git: Pull realizado"
echo "  ✅ NPM: Dependências OK"
if command -v supabase &> /dev/null; then
  if curl -s http://127.0.0.1:54321/rest/v1/ > /dev/null 2>&1; then
    echo "  ✅ Supabase: Rodando"
  else
    echo "  ⚠️  Supabase: Parado"
  fi
else
  echo "  ⚠️  Supabase: CLI não instalado"
fi
echo ""
echo "Para iniciar desenvolvimento:"
echo "  npm run dev"
echo ""
echo -e "${GREEN}Pronto para desenvolver! 🚀${NC}"
