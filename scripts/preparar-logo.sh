#!/bin/bash
# Script para preparar logo da Top Class
# Copia a logo atualizada para o nome padrão usado pelo app

cd "$(dirname "$0")/.."

echo "🎨 Preparando logo da Top Class..."
echo ""

# Diretório de imagens
IMAGES_DIR="public/images"
LOGO_NAME="logo-topclass.png"

# Possíveis arquivos de logo (em ordem de prioridade)
POSSIVEIS_LOGS=(
  "Logo TopClass.png"
  "Logo redonda .jpeg"
  "topclass..png"
  "WhatsApp Image 2025-11-19 at 13.43.55.jpeg"
  "WhatsApp Image 2025-11-19 at 13.43.56 (1).jpeg"
  "WhatsApp Image 2025-11-19 at 13.43.56.jpeg"
)

# Verificar se já existe logo-topclass.png
if [ -f "$IMAGES_DIR/$LOGO_NAME" ]; then
  echo "✅ Logo já existe: $LOGO_NAME"
  echo ""
  ls -lh "$IMAGES_DIR/$LOGO_NAME"
  exit 0
fi

# Tentar copiar das pastas
echo "🔍 Procurando logo atualizada..."

# Primeiro, verificar em espaco/
for logo in "${POSSIVEIS_LOGS[@]}"; do
  if [ -f "$IMAGES_DIR/espaco/$logo" ]; then
    echo "📋 Encontrado: espaco/$logo"
    echo "📋 Copiando para: $LOGO_NAME"
    
    # Converter para PNG se necessário
    if [[ "$logo" == *.jpeg ]] || [[ "$logo" == *.jpg ]]; then
      # Usar sips no macOS para converter
      sips -s format png "$IMAGES_DIR/espaco/$logo" --out "$IMAGES_DIR/$LOGO_NAME" 2>/dev/null
      if [ $? -eq 0 ]; then
        echo "✅ Logo convertida e copiada: $LOGO_NAME"
        exit 0
      fi
    else
      cp "$IMAGES_DIR/espaco/$logo" "$IMAGES_DIR/$LOGO_NAME"
      if [ $? -eq 0 ]; then
        echo "✅ Logo copiada: $LOGO_NAME"
        exit 0
      fi
    fi
  fi
done

# Verificar na raiz de images/
for logo in "${POSSIVEIS_LOGS[@]}"; do
  if [ -f "$IMAGES_DIR/$logo" ]; then
    echo "📋 Encontrado: $logo"
    echo "📋 Copiando para: $LOGO_NAME"
    
    # Converter para PNG se necessário
    if [[ "$logo" == *.jpeg ]] || [[ "$logo" == *.jpg ]]; then
      sips -s format png "$IMAGES_DIR/$logo" --out "$IMAGES_DIR/$LOGO_NAME" 2>/dev/null
      if [ $? -eq 0 ]; then
        echo "✅ Logo convertida e copiada: $LOGO_NAME"
        exit 0
      fi
    else
      cp "$IMAGES_DIR/$logo" "$IMAGES_DIR/$LOGO_NAME"
      if [ $? -eq 0 ]; then
        echo "✅ Logo copiada: $LOGO_NAME"
        exit 0
      fi
    fi
  fi
done

echo "⚠️  Nenhuma logo encontrada automaticamente"
echo ""
echo "📝 Para usar sua logo atualizada:"
echo "   1. Copie sua logo para: $IMAGES_DIR/$LOGO_NAME"
echo "   2. OU renomeie: mv 'sua-logo.png' $IMAGES_DIR/$LOGO_NAME"
echo ""
echo "   Formato recomendado: PNG ou JPG"
echo "   Tamanho recomendado: 512x512px (ou proporcional)"

