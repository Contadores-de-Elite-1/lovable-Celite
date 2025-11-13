#!/bin/bash

###############################################################################
# POST-CREATE SCRIPT for Codespaces
# Runs ONCE when the Codespaces environment is created
# Installs all dependencies and tools
###############################################################################

set -e

BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║            Celite - Post-Create Setup (First Time Only)                ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════════════════╝${NC}"

# ============================================================================
# 1. Install Node dependencies
# ============================================================================

echo -e "\n${YELLOW}Installing Node.js dependencies...${NC}"
npm install > /dev/null 2>&1 || (
  echo -e "${YELLOW}⚠ npm install failed or no dependencies${NC}"
)

# ============================================================================
# 2. Install Supabase CLI
# ============================================================================

echo -e "\n${YELLOW}Installing Supabase CLI...${NC}"
if ! command -v supabase &> /dev/null; then
  # Install Supabase CLI via official installer
  curl -fsSL https://raw.githubusercontent.com/supabase/cli/main/install.sh | bash > /dev/null 2>&1 || (
    # Fallback: try apt-get for Linux environments
    apt-get update > /dev/null 2>&1 && apt-get install -y supabase > /dev/null 2>&1
  ) || (
    echo -e "${YELLOW}⚠ Warning: Could not install Supabase CLI automatically${NC}"
  )

  if command -v supabase &> /dev/null; then
    echo -e "${GREEN}✓ Supabase CLI installed${NC}"
  else
    echo -e "${YELLOW}⚠ Supabase CLI installation may have failed${NC}"
  fi
else
  echo -e "${GREEN}✓ Supabase CLI already installed${NC}"
fi

# ============================================================================
# 3. Initialize Supabase
# ============================================================================

echo -e "\n${YELLOW}Initializing Supabase local setup...${NC}"
if [ ! -d ".supabase" ]; then
  supabase init > /dev/null 2>&1
  echo -e "${GREEN}✓ Supabase initialized${NC}"
else
  echo -e "${GREEN}✓ Supabase already initialized${NC}"
fi

# ============================================================================
# 4. Verify tools are available
# ============================================================================

echo -e "\n${YELLOW}Verifying tools...${NC}"

TOOLS=("git" "curl" "jq" "docker" "node" "npm" "psql" "supabase")

for tool in "${TOOLS[@]}"; do
  if command -v "$tool" &> /dev/null; then
    VERSION=$(eval "$tool --version 2>/dev/null || $tool -v 2>/dev/null || echo 'installed'")
    echo -e "${GREEN}✓ $tool: $VERSION${NC}"
  else
    echo -e "${YELLOW}⚠ $tool: NOT FOUND (may install on first start)${NC}"
  fi
done

# ============================================================================
# 5. Summary
# ============================================================================

echo -e "\n${BLUE}╔════════════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                   Post-Create Setup Complete!                         ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════════════════╝${NC}"

echo -e "\n${GREEN}✓ Environment ready!${NC}"
echo -e "${YELLOW}Next: Environment will auto-start Supabase and run tests on next restart.${NC}"
echo -e "${YELLOW}Or manually run: bash .devcontainer/post-start.sh${NC}"
