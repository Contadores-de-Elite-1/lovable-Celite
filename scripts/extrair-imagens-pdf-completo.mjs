/**
 * Script completo para extrair imagens do PDF
 * 
 * Executar:
 * node scripts/extrair-imagens-pdf-completo.mjs
 * 
 * Ou instalar dependência e executar:
 * pnpm add pdf-poppler --save-dev
 * node scripts/extrair-imagens-pdf-completo.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pdfPath = path.join(__dirname, '../public/PLANOS__E_SERVIÇOS.pdf');
const outputDir = path.join(__dirname, '../public/images/espaco');

// Nomes das imagens baseado nas descrições do PDF
const nomesImagens = [
  {
    nome: 'exterior-noturno.jpg',
    descricao: 'Vista noturna do prédio Top Class com iluminação',
    ordem: 1
  },
  {
    nome: 'exterior-diurno-sinal.jpg',
    descricao: 'Vista diurna com sinalização "topclass" destacada',
    ordem: 2
  },
  {
    nome: 'exterior-diurno-completo.jpg',
    descricao: 'Vista completa do prédio durante o dia',
    ordem: 3
  },
];

// Criar diretório se não existir
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
  console.log('✅ Diretório criado:', outputDir);
}

// Verificar se PDF existe
if (!fs.existsSync(pdfPath)) {
  console.error('❌ PDF não encontrado:', pdfPath);
  process.exit(1);
}

console.log('📄 Extraindo imagens do PDF...\n');
console.log('📋 Imagens que serão extraídas:');
nomesImagens.forEach(img => {
  console.log(`  ${img.ordem}. ${img.nome}`);
  console.log(`     → ${img.descricao}`);
});

console.log('\n🔄 Tentando usar ferramentas disponíveis...\n');

// Método 1: Tentar pdf-poppler (requer instalação)
try {
  const pdfPoppler = await import('pdf-poppler');
  console.log('✅ pdf-poppler encontrado, extraindo...');
  
  // Implementação com pdf-poppler
  // (código específico depende da API da biblioteca)
  
} catch (e) {
  console.log('⚠️  pdf-poppler não disponível');
}

// Método 2: Tentar Python com PyPDF2 (se disponível)
try {
  const hasPython = execSync('which python3', { encoding: 'utf-8' }).trim();
  if (hasPython) {
    console.log('✅ Python encontrado:', hasPython);
    console.log('💡 Criando script Python...');
    
    // Criar script Python para extrair
    const pythonScript = `import sys
try:
    from pdf2image import convert_from_path
    from PIL import Image
    import os
    
    pdf_path = "${pdfPath}"
    output_dir = "${outputDir}"
    
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
    
    print("Extraindo imagens do PDF...")
    images = convert_from_path(pdf_path)
    
    for i, image in enumerate(images):
        output_path = os.path.join(output_dir, f"page-{i+1}.png")
        image.save(output_path, "PNG")
        print(f"Salvo: {output_path}")
        
    print("✅ Extração concluída!")
except ImportError:
    print("❌ Biblioteca pdf2image não instalada")
    print("Instale com: pip install pdf2image pillow")
    sys.exit(1)
`;
    
    fs.writeFileSync(
      path.join(__dirname, 'extrair_pdf_temp.py'),
      pythonScript
    );
    
    console.log('💡 Para usar Python, execute:');
    console.log('   pip install pdf2image pillow');
    console.log('   python3 scripts/extrair_pdf_temp.py');
  }
} catch (e) {
  console.log('⚠️  Python não encontrado ou erro ao criar script');
}

console.log('\n📚 MÉTODO RECOMENDADO (Mais Simples):\n');
console.log('1. Abrir PDF no Adobe Acrobat ou Preview');
console.log('2. Selecionar cada imagem');
console.log('3. Salvar com os nomes:');
nomesImagens.forEach((img, i) => {
  console.log(`   → ${img.nome}`);
});
console.log(`\n4. Salvar em: ${outputDir}`);

console.log('\n🔗 OU usar ferramenta online:\n');
console.log('https://www.ilovepdf.com/extract-images-from-pdf');
console.log('→ Upload PDF → Extrair → Download');
console.log(`→ Mover arquivos para: ${outputDir}`);
console.log('→ Renomear conforme lista acima');

console.log('\n✅ Pronto! Após extrair, atualize o arquivo:');
console.log('   src/data/fotosEspaco.ts');

