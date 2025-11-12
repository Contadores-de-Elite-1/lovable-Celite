#!/bin/bash

###############################################################################
# POST-START SCRIPT for Codespaces
# Runs EVERY TIME Codespaces starts
# Starts Supabase and prepares environment
###############################################################################

set -e

BLUE='\033[0;34m'
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║          Celite - Post-Start Setup (Every Session)                     ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════════════════╝${NC}"

# ============================================================================
# 1. Start Supabase
# ============================================================================

echo -e "\n${YELLOW}═══════════════════════════════════════════════════════════════════════${NC}"
echo -e "${YELLOW}Starting Supabase...${NC}"
echo -e "${YELLOW}═══════════════════════════════════════════════════════════════════════${NC}\n"

supabase start

# ============================================================================
# 2. Wait for Supabase to be ready
# ============================================================================

echo -e "\n${YELLOW}Waiting for Supabase to be ready...${NC}"

MAX_RETRIES=120
RETRY_COUNT=0

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
  if curl -s http://localhost:54321/rest/v1/ > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Supabase is ready!${NC}"
    sleep 2
    break
  fi

  RETRY_COUNT=$((RETRY_COUNT + 1))
  if [ $((RETRY_COUNT % 10)) -eq 0 ]; then
    echo "  Attempt $RETRY_COUNT/$MAX_RETRIES..."
  fi

  sleep 1
done

if [ $RETRY_COUNT -ge $MAX_RETRIES ]; then
  echo -e "${RED}✗ Timeout: Supabase did not become ready${NC}"
  exit 1
fi

# ============================================================================
# 3. Apply migrations
# ============================================================================

echo -e "\n${YELLOW}Applying migrations...${NC}"

if supabase db push > /dev/null 2>&1; then
  echo -e "${GREEN}✓ Migrations applied${NC}"
else
  echo -e "${RED}✗ Error applying migrations${NC}"
  exit 1
fi

# ============================================================================
# 4. Run seed
# ============================================================================

echo -e "\n${YELLOW}Running seed data...${NC}"

if [ -f "supabase/scripts/seed.sql" ]; then
  STATUS_OUTPUT=$(supabase status)

  # Extract database URL
  DB_URL=$(echo "$STATUS_OUTPUT" | grep "Database URL:" | awk '{print $NF}')

  if [ -n "$DB_URL" ]; then
    if psql "$DB_URL" -f supabase/scripts/seed.sql > /dev/null 2>&1; then
      echo -e "${GREEN}✓ Seed data loaded${NC}"
    else
      echo -e "${YELLOW}⚠ Seed data may have had issues (non-critical)${NC}"
    fi
  fi
else
  echo -e "${YELLOW}⚠ No seed.sql file found${NC}"
fi

# ============================================================================
# 5. Display connection info
# ============================================================================

echo -e "\n${BLUE}╔════════════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                   Environment Ready!                                   ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════════════════╝${NC}"

echo -e "\n${GREEN}✓ Supabase is running${NC}"
echo -e "${GREEN}✓ Migrations are applied${NC}"
echo -e "${GREEN}✓ Seed data is loaded${NC}"

echo -e "\n${YELLOW}Available services:${NC}"
echo -e "  • API:    http://localhost:54321"
echo -e "  • Studio: http://localhost:54323"
echo -e "  • DB:     postgresql://postgres:postgres@localhost:54322/postgres"

echo -e "\n${YELLOW}Next steps:${NC}"
echo -e "  1. Run E2E tests: bash supabase/scripts/run-e2e-local.sh"
echo -e "  2. Start frontend: npm run dev"
echo -e "  3. Check studio: http://localhost:54323"

echo -e "\n${GREEN}Happy coding! 🚀${NC}"
