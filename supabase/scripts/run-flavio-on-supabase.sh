#!/bin/bash

# =====================================================================
# EXECUTA O TESTE FLÁVIO NO SUPABASE CLOUD
# =====================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SQL_FILE="$SCRIPT_DIR/flavio-insert-complete.sql"
PROJECT_ID="zytxwdgzjqrcmbnpgofj"
SUPABASE_URL="https://supabase.com/dashboard/project/$PROJECT_ID/sql/new"

echo "=========================================="
echo "EXECUTAR TESTE FLÁVIO NO SUPABASE"
echo "=========================================="
echo ""

if [ ! -f "$SQL_FILE" ]; then
    echo "❌ Arquivo não encontrado: $SQL_FILE"
    exit 1
fi

echo "✅ SQL file localizado: $SQL_FILE"
echo ""

# Copiar SQL para clipboard
if command -v xclip &> /dev/null; then
    cat "$SQL_FILE" | xclip -selection clipboard
    echo "✅ SQL copiado para clipboard!"
    echo ""
elif command -v pbcopy &> /dev/null; then
    cat "$SQL_FILE" | pbcopy
    echo "✅ SQL copiado para clipboard!"
    echo ""
else
    echo "⚠️  Não consegui copiar para clipboard"
    echo ""
fi

# Mostrar instruções
echo "📝 INSTRUÇÕES PARA EXECUTAR:"
echo ""
echo "1. Abra o Supabase Dashboard:"
echo "   $SUPABASE_URL"
echo ""
echo "2. Cole o SQL (Ctrl+V ou Cmd+V)"
echo ""
echo "3. Clique em 'Run' (ou Ctrl+Enter / Cmd+Enter)"
echo ""
echo "4. Aguarde a execução completar"
echo ""
echo "5. Verifique os resultados da validação final"
echo ""
echo "📊 RESULTADO ESPERADO:"
echo "   - Clientes: 20"
echo "   - Total Comissões: 9567.00"
echo "   - Total Bônus: 1638.75"
echo "   - TOTAL FLÁVIO: 10405.75"
echo ""
echo "=========================================="
