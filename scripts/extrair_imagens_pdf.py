#!/usr/bin/env python3
"""
Script para extrair imagens do PDF PLANOS__E_SERVIÇOS.pdf

Instalar dependências:
pip install PyMuPDF pillow

Ou:
pip install pdf2image pillow

Executar:
python3 scripts/extrair_imagens_pdf.py
"""

import sys
import os
from pathlib import Path

# Caminhos
script_dir = Path(__file__).parent
project_root = script_dir.parent
pdf_path = project_root / 'public' / 'PLANOS__E_SERVIÇOS.pdf'
output_dir = project_root / 'public' / 'images' / 'espaco'

# Nomes das imagens baseado nas descrições
IMAGENS = [
    {
        'nome': 'exterior-noturno.jpg',
        'descricao': 'Vista noturna do prédio Top Class com iluminação',
        'pagina': 1  # Assumindo primeira página
    },
    {
        'nome': 'exterior-diurno-sinal.jpg',
        'descricao': 'Vista diurna com sinalização "topclass" destacada',
        'pagina': 2  # Assumindo segunda página
    },
    {
        'nome': 'exterior-diurno-completo.jpg',
        'descricao': 'Vista completa do prédio durante o dia',
        'pagina': 3  # Assumindo terceira página
    },
]

def criar_output_dir():
    """Criar diretório de saída se não existir"""
    output_dir.mkdir(parents=True, exist_ok=True)
    print(f'✅ Diretório criado: {output_dir}')

def verificar_pdf():
    """Verificar se PDF existe"""
    if not pdf_path.exists():
        print(f'❌ PDF não encontrado: {pdf_path}')
        sys.exit(1)
    print(f'✅ PDF encontrado: {pdf_path}')

def extrair_com_pymupdf():
    """Extrair imagens usando PyMuPDF (fitz)"""
    try:
        import fitz  # PyMuPDF
        print('\n📄 Extraindo com PyMuPDF...\n')
        
        doc = fitz.open(str(pdf_path))
        print(f'✅ PDF aberto: {len(doc)} páginas\n')
        
        imagens_extraidas = []
        
        for page_num, page in enumerate(doc, start=1):
            image_list = page.get_images()
            
            if image_list:
                print(f'📄 Página {page_num}: {len(image_list)} imagem(ns) encontrada(s)')
                
                # Encontrar a maior imagem da página (provavelmente a foto principal)
                maior_imagem = None
                maior_tamanho = 0
                
                for img in image_list:
                    xref = img[0]
                    base_image = doc.extract_image(xref)
                    image_bytes = base_image["image"]
                    
                    # Selecionar a maior imagem
                    if len(image_bytes) > maior_tamanho:
                        maior_tamanho = len(image_bytes)
                        maior_imagem = (base_image, xref)
                
                # Salvar apenas a maior imagem da página
                if maior_imagem:
                    base_image, xref = maior_imagem
                    image_bytes = base_image["image"]
                    image_ext = base_image["ext"]
                    
                    # Determinar nome baseado na ordem
                    if page_num <= len(IMAGENS):
                        nome_arquivo = IMAGENS[page_num - 1]['nome']
                        # Forçar extensão .jpg
                        if not nome_arquivo.endswith('.jpg'):
                            nome_arquivo = nome_arquivo.replace('.png', '.jpg').replace('.jpeg', '.jpg')
                        # Se não tem extensão, adicionar baseado no tipo
                        if '.' not in nome_arquivo:
                            nome_arquivo = f'{nome_arquivo}.{image_ext}' if image_ext != 'jpeg' else f'{nome_arquivo}.jpg'
                    else:
                        nome_arquivo = f'imagem-p{page_num}.jpg'
                    
                    output_path = output_dir / nome_arquivo
                    
                    # Converter para JPG se necessário (usar PIL se disponível)
                    try:
                        from PIL import Image
                        import io
                        
                        # Converter para JPG
                        img_pil = Image.open(io.BytesIO(image_bytes))
                        if img_pil.mode in ('RGBA', 'LA', 'P'):
                            # Criar fundo branco para imagens com transparência
                            background = Image.new('RGB', img_pil.size, (255, 255, 255))
                            if img_pil.mode == 'P':
                                img_pil = img_pil.convert('RGBA')
                            background.paste(img_pil, mask=img_pil.split()[-1] if img_pil.mode == 'RGBA' else None)
                            img_pil = background
                        
                        # Salvar como JPG
                        output_path = output_dir / nome_arquivo.replace('.png', '.jpg').replace('.jpeg', '.jpg')
                        img_pil.save(str(output_path), 'JPEG', quality=95, optimize=True)
                    except:
                        # Se não tiver PIL, salvar como está
                        with open(output_path, "wb") as img_file:
                            img_file.write(image_bytes)
                    
                    print(f'  ✅ Salvo: {nome_arquivo} ({output_path.stat().st_size} bytes)')
                    imagens_extraidas.append(nome_arquivo)
        
        doc.close()
        
        if imagens_extraidas:
            print(f'\n✅ {len(imagens_extraidas)} imagem(ns) extraída(s) com sucesso!')
            return True
        else:
            print('\n⚠️  Nenhuma imagem encontrada no PDF')
            return False
            
    except ImportError:
        print('⚠️  PyMuPDF não instalado')
        print('   Instale com: pip install PyMuPDF')
        return False
    except Exception as e:
        print(f'❌ Erro ao extrair com PyMuPDF: {e}')
        return False

def extrair_com_pdf2image():
    """Extrair imagens usando pdf2image (converte páginas inteiras)"""
    try:
        from pdf2image import convert_from_path
        from PIL import Image
        import io
        
        print('\n📄 Extraindo com pdf2image...\n')
        
        images = convert_from_path(str(pdf_path))
        print(f'✅ PDF convertido: {len(images)} página(s)\n')
        
        for i, image in enumerate(images):
            if i < len(IMAGENS):
                nome_arquivo = IMAGENS[i]['nome']
                # Converter para JPG se necessário
                if not nome_arquivo.endswith('.jpg'):
                    nome_arquivo = nome_arquivo.replace('.png', '.jpg')
            else:
                nome_arquivo = f'pagina-{i + 1}.jpg'
            
            output_path = output_dir / nome_arquivo
            
            # Salvar como JPG
            image.save(str(output_path), 'JPEG', quality=95)
            print(f'✅ Salvo: {nome_arquivo} ({output_path.stat().st_size} bytes)')
        
        print(f'\n✅ {len(images)} imagem(ns) extraída(s) com sucesso!')
        return True
        
    except ImportError:
        print('⚠️  pdf2image não instalado')
        print('   Instale com: pip install pdf2image pillow')
        print('   macOS: brew install poppler')
        print('   Linux: apt-get install poppler-utils')
        return False
    except Exception as e:
        print(f'❌ Erro ao extrair com pdf2image: {e}')
        return False

def main():
    print('=' * 60)
    print('📸 EXTRAÇÃO DE IMAGENS DO PDF')
    print('=' * 60)
    print(f'\n📂 PDF: {pdf_path.name}')
    print(f'📁 Saída: {output_dir}\n')
    
    # Criar diretório
    criar_output_dir()
    
    # Verificar PDF
    verificar_pdf()
    
    # Listar imagens esperadas
    print('\n📋 Imagens que serão extraídas:')
    for img in IMAGENS:
        print(f'  • {img["nome"]}')
        print(f'    → {img["descricao"]}')
    
    # Tentar métodos de extração
    print('\n' + '=' * 60)
    
    # Método 1: PyMuPDF (melhor para extrair imagens individuais)
    if extrair_com_pymupdf():
        return
    
    # Método 2: pdf2image (converte páginas inteiras)
    print('\n' + '=' * 60)
    if extrair_com_pdf2image():
        return
    
    # Se nenhum método funcionou
    print('\n' + '=' * 60)
    print('❌ Nenhum método de extração disponível')
    print('\n📚 Para instalar dependências:')
    print('   pip install PyMuPDF')
    print('   # OU')
    print('   pip install pdf2image pillow')
    print('   # macOS também precisa:')
    print('   brew install poppler')
    print('\n🔗 OU use ferramenta online:')
    print('   https://www.ilovepdf.com/extract-images-from-pdf')
    sys.exit(1)

if __name__ == '__main__':
    main()

