#!/bin/bash

# =====================================================================
# CHAMADA À FUNÇÃO EDGE: EXEC-TEST-FLAVIO
# =====================================================================

set -e

PROJECT_ID="zytxwdgzjqrcmbnpgofj"
FUNCTION_URL="https://${PROJECT_ID}.supabase.co/functions/v1/exec-test-flavio"
SERVICE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5dHh3ZGd6anFyY21ibnBnb2ZqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDk4NjY0MiwiZXhwIjoyMDc2NTYyNjQyfQ.uC4X8zC-XtPNfQC0m7aKEoYO8DtCtbT4kZ67QGI-1A4"

echo "=========================================="
echo "CHAMANDO: exec-test-flavio"
echo "=========================================="
echo ""
echo "URL: $FUNCTION_URL"
echo ""

# Fazer requisição POST
response=$(curl -s -X POST \
  "$FUNCTION_URL" \
  -H "Authorization: Bearer $SERVICE_KEY" \
  -H "Content-Type: application/json" \
  -d '{}')

echo "RESPOSTA:"
echo "$response" | jq . 2>/dev/null || echo "$response"
echo ""
echo "=========================================="
