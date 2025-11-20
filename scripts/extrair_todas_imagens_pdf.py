#!/usr/bin/env python3
"""
Script para extrair TODAS as imagens do PDF PLANOS__E_SERVIÇOS.pdf
"""

import sys
import os
from pathlib import Path

script_dir = Path(__file__).parent
project_root = script_dir.parent
pdf_path = project_root / 'public' / 'PLANOS__E_SERVIÇOS.pdf'
output_dir = project_root / 'public' / 'images' / 'espaco'

def extrair_todas_imagens():
    """Extrair TODAS as imagens usando PyMuPDF"""
    try:
        import fitz  # PyMuPDF
        from PIL import Image
        import io
        
        print('=' * 60)
        print('📸 EXTRAÇÃO COMPLETA DE IMAGENS DO PDF')
        print('=' * 60)
        print(f'\n📂 PDF: {pdf_path.name}')
        print(f'📁 Saída: {output_dir}\n')
        
        output_dir.mkdir(parents=True, exist_ok=True)
        
        if not pdf_path.exists():
            print(f'❌ PDF não encontrado: {pdf_path}')
            sys.exit(1)
        
        doc = fitz.open(str(pdf_path))
        print(f'✅ PDF aberto: {len(doc)} páginas\n')
        
        todas_imagens = []
        
        for page_num, page in enumerate(doc, start=1):
            image_list = page.get_images()
            
            if image_list:
                print(f'📄 Página {page_num}: {len(image_list)} imagem(ns) encontrada(s)')
                
                # Extrair TODAS as imagens da página
                for img_index, img in enumerate(image_list, start=1):
                    xref = img[0]
                    base_image = doc.extract_image(xref)
                    image_bytes = base_image["image"]
                    image_ext = base_image["ext"]
                    
                    # Nomear: pagina-p_numero-img_index
                    nome_arquivo = f'pagina-{page_num}-img-{img_index}.jpg'
                    output_path = output_dir / nome_arquivo
                    
                    # Converter para JPG
                    try:
                        img_pil = Image.open(io.BytesIO(image_bytes))
                        if img_pil.mode in ('RGBA', 'LA', 'P'):
                            background = Image.new('RGB', img_pil.size, (255, 255, 255))
                            if img_pil.mode == 'P':
                                img_pil = img_pil.convert('RGBA')
                            background.paste(img_pil, mask=img_pil.split()[-1] if img_pil.mode == 'RGBA' else None)
                            img_pil = background
                        
                        img_pil.save(str(output_path), 'JPEG', quality=95, optimize=True)
                        tamanho_kb = output_path.stat().st_size / 1024
                        print(f'  ✅ {nome_arquivo} ({tamanho_kb:.1f} KB)')
                        todas_imagens.append(nome_arquivo)
                    except Exception as e:
                        print(f'  ⚠️  Erro ao processar {nome_arquivo}: {e}')
                        # Tentar salvar como está
                        try:
                            with open(output_path, "wb") as img_file:
                                img_file.write(image_bytes)
                            print(f'  ✅ {nome_arquivo} (salvo sem conversão)')
                            todas_imagens.append(nome_arquivo)
                        except:
                            print(f'  ❌ Falha ao salvar {nome_arquivo}')
        
        doc.close()
        
        print(f'\n✅ Total: {len(todas_imagens)} imagem(ns) extraída(s) com sucesso!')
        print(f'\n📁 Localização: {output_dir}')
        
        return True
            
    except ImportError:
        print('❌ PyMuPDF não instalado')
        print('   Instale com: pip install PyMuPDF pillow')
        return False
    except Exception as e:
        print(f'❌ Erro: {e}')
        import traceback
        traceback.print_exc()
        return False

if __name__ == '__main__':
    extrair_todas_imagens()

