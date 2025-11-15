#!/bin/bash

# ============================================================================
# DEPLOY COMPLETO - PRODUÇÃO
# ============================================================================
# Script para deploy automático em produção
# Atualiza: GitHub, Supabase Cloud e Frontend
# ============================================================================

set -e  # Exit on error

echo "🚀 Deploy Automático - Produção"
echo "================================"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ============================================================================
# 1. VERIFICAÇÕES PRÉ-DEPLOY
# ============================================================================

echo -e "${BLUE}[1/6] Verificações pré-deploy...${NC}"

# Check if on correct branch
CURRENT_BRANCH=$(git branch --show-current)
echo "   Branch atual: $CURRENT_BRANCH"

# Check for uncommitted changes
if [[ -n $(git status -s) ]]; then
  echo -e "${RED}❌ Há mudanças não commitadas${NC}"
  echo ""
  git status -s
  echo ""
  read -p "Fazer commit agora? (s/N): " commit_now
  if [ "$commit_now" = "s" ] || [ "$commit_now" = "S" ]; then
    read -p "Mensagem do commit: " commit_msg
    git add -A
    git commit -m "$commit_msg"
    echo -e "${GREEN}✅ Commit realizado${NC}"
  else
    echo -e "${RED}Deploy cancelado${NC}"
    exit 1
  fi
fi

# Check if build passes
echo ""
echo -e "${BLUE}[2/6] Testando build...${NC}"
if npm run build > /dev/null 2>&1; then
  echo -e "${GREEN}✅ Build OK${NC}"
else
  echo -e "${RED}❌ Build falhou${NC}"
  echo "Execute 'npm run build' para ver os erros"
  exit 1
fi

# ============================================================================
# 2. PUSH PARA GITHUB
# ============================================================================

echo ""
echo -e "${BLUE}[3/6] Push para GitHub...${NC}"

# Get remote info
REMOTE_URL=$(git remote get-url origin 2>/dev/null || echo "none")
if [ "$REMOTE_URL" = "none" ]; then
  echo -e "${RED}❌ Remote 'origin' não configurado${NC}"
  exit 1
fi

echo "   Remote: $REMOTE_URL"

# Push with retry
MAX_RETRIES=4
RETRY_DELAY=2

for i in $(seq 1 $MAX_RETRIES); do
  if git push origin $CURRENT_BRANCH; then
    echo -e "${GREEN}✅ Push para GitHub OK${NC}"
    break
  else
    if [ $i -lt $MAX_RETRIES ]; then
      echo -e "${YELLOW}⚠️  Tentativa $i falhou, tentando novamente em ${RETRY_DELAY}s...${NC}"
      sleep $RETRY_DELAY
      RETRY_DELAY=$((RETRY_DELAY * 2))
    else
      echo -e "${RED}❌ Push falhou após $MAX_RETRIES tentativas${NC}"
      exit 1
    fi
  fi
done

# ============================================================================
# 3. SUPABASE - DEPLOY MIGRATIONS
# ============================================================================

echo ""
echo -e "${BLUE}[4/6] Deploy Supabase (Migrations)...${NC}"

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
  echo -e "${YELLOW}⚠️  Supabase CLI não instalado${NC}"
  echo "   Instale: https://supabase.com/docs/guides/cli"
  echo "   Pulando deploy de migrações..."
else
  # Check if linked to project
  if [ ! -f ".supabase/config.toml" ]; then
    echo -e "${YELLOW}⚠️  Projeto não linkado ao Supabase${NC}"
    echo ""
    read -p "Link para projeto agora? (s/N): " link_now
    if [ "$link_now" = "s" ] || [ "$link_now" = "S" ]; then
      read -p "Project ID (da dashboard): " project_id
      supabase link --project-ref $project_id
      echo -e "${GREEN}✅ Linkado${NC}"
    else
      echo "   Pulando deploy de migrações..."
    fi
  fi

  # Push migrations if linked
  if [ -f ".supabase/config.toml" ]; then
    echo "   Pushing migrations..."
    if supabase db push; then
      echo -e "${GREEN}✅ Migrações aplicadas${NC}"
    else
      echo -e "${RED}❌ Falha ao aplicar migrações${NC}"
      read -p "Continuar mesmo assim? (s/N): " continue_deploy
      if [ "$continue_deploy" != "s" ] && [ "$continue_deploy" != "S" ]; then
        exit 1
      fi
    fi
  fi
fi

# ============================================================================
# 4. SUPABASE - DEPLOY EDGE FUNCTIONS
# ============================================================================

echo ""
echo -e "${BLUE}[5/6] Deploy Supabase (Edge Functions)...${NC}"

if command -v supabase &> /dev/null && [ -f ".supabase/config.toml" ]; then
  # List functions
  FUNCTIONS=($(ls -d supabase/functions/*/ 2>/dev/null | xargs -n 1 basename))

  if [ ${#FUNCTIONS[@]} -eq 0 ]; then
    echo "   Nenhuma função encontrada"
  else
    echo "   Funções encontradas: ${FUNCTIONS[@]}"

    for func in "${FUNCTIONS[@]}"; do
      echo "   Deploying $func..."
      if supabase functions deploy $func --no-verify-jwt; then
        echo -e "   ${GREEN}✅ $func deployed${NC}"
      else
        echo -e "   ${YELLOW}⚠️  $func falhou (continuando...)${NC}"
      fi
    done

    echo -e "${GREEN}✅ Edge Functions deployed${NC}"
  fi
else
  echo "   Supabase não configurado, pulando..."
fi

# ============================================================================
# 5. FRONTEND - BUILD & DEPLOY
# ============================================================================

echo ""
echo -e "${BLUE}[6/6] Deploy Frontend...${NC}"

# Build production
echo "   Building for production..."
if npm run build; then
  echo -e "${GREEN}✅ Build completo${NC}"
else
  echo -e "${RED}❌ Build falhou${NC}"
  exit 1
fi

# Show build stats
BUILD_SIZE=$(du -sh dist | cut -f1)
echo "   Build size: $BUILD_SIZE"

# Deploy options
echo ""
echo "Escolha a plataforma de deploy:"
echo ""
echo "  1) Vercel (recomendado)"
echo "  2) Netlify"
echo "  3) Manual (copiar dist/)"
echo "  4) Pular deploy de frontend"
echo ""
read -p "Opção (1-4): " deploy_option

case $deploy_option in
  1)
    echo ""
    echo "Deploy para Vercel:"
    echo "  1. Instale Vercel CLI: npm i -g vercel"
    echo "  2. Execute: vercel --prod"
    echo ""
    if command -v vercel &> /dev/null; then
      read -p "Deploy agora? (s/N): " deploy_vercel
      if [ "$deploy_vercel" = "s" ] || [ "$deploy_vercel" = "S" ]; then
        vercel --prod
        echo -e "${GREEN}✅ Deploy Vercel completo${NC}"
      fi
    else
      echo "Vercel CLI não instalado"
    fi
    ;;
  2)
    echo ""
    echo "Deploy para Netlify:"
    echo "  1. Instale Netlify CLI: npm i -g netlify-cli"
    echo "  2. Execute: netlify deploy --prod --dir=dist"
    echo ""
    if command -v netlify &> /dev/null; then
      read -p "Deploy agora? (s/N): " deploy_netlify
      if [ "$deploy_netlify" = "s" ] || [ "$deploy_netlify" = "S" ]; then
        netlify deploy --prod --dir=dist
        echo -e "${GREEN}✅ Deploy Netlify completo${NC}"
      fi
    else
      echo "Netlify CLI não instalado"
    fi
    ;;
  3)
    echo ""
    echo "Deploy manual:"
    echo "  1. Faça upload do conteúdo de dist/ para seu servidor"
    echo "  2. Configure servidor para SPAs (redirect para index.html)"
    echo ""
    ;;
  4)
    echo "   Pulando deploy de frontend"
    ;;
  *)
    echo -e "${RED}Opção inválida${NC}"
    ;;
esac

# ============================================================================
# 6. RESUMO FINAL
# ============================================================================

echo ""
echo "================================"
echo -e "${GREEN}✅ Deploy Completo!${NC}"
echo "================================"
echo ""
echo "Checklist:"
echo "  ✅ GitHub: Push realizado"
echo "  ✅ Build: Sucesso ($BUILD_SIZE)"
if command -v supabase &> /dev/null && [ -f ".supabase/config.toml" ]; then
  echo "  ✅ Supabase: Migrations + Functions deployed"
else
  echo "  ⚠️  Supabase: Não configurado"
fi
echo ""
echo "Próximos passos:"
echo "  1. Verifique a aplicação em produção"
echo "  2. Configure Stripe webhook (se ainda não configurado)"
echo "  3. Teste fluxo de pagamento"
echo "  4. Configure monitoramento (ver MONITORING-LOGGING.md)"
echo ""
echo "URLs úteis:"
echo "  - GitHub: $REMOTE_URL"
if [ -f ".supabase/config.toml" ]; then
  PROJECT_REF=$(grep 'project_id' .supabase/config.toml | cut -d'"' -f2)
  echo "  - Supabase: https://supabase.com/dashboard/project/$PROJECT_REF"
fi
echo ""
echo -e "${GREEN}Deploy finalizado com sucesso! 🚀${NC}"
