/**
 * Script para extrair imagens do PDF
 * 
 * Instalar dependência primeiro:
 * pnpm add pdf-poppler --save-dev
 * 
 * OU usar:
 * pnpm add pdfjs-dist --save-dev
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Tentar importar bibliotecas (opcional)
let pdfPoppler;
let pdfjsDist;

try {
  pdfPoppler = await import('pdf-poppler');
} catch (e) {
  console.log('⚠️  pdf-poppler não instalado');
}

try {
  pdfjsDist = await import('pdfjs-dist');
} catch (e) {
  console.log('⚠️  pdfjs-dist não instalado');
}

const pdfPath = path.join(__dirname, '../public/PLANOS__E_SERVIÇOS.pdf');
const outputDir = path.join(__dirname, '../public/images/espaco');

// Criar diretório se não existir
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

console.log('📄 Extraindo imagens do PDF...');
console.log(`📂 PDF: ${pdfPath}`);
console.log(`📁 Saída: ${outputDir}\n`);

// Verificar se PDF existe
if (!fs.existsSync(pdfPath)) {
  console.error('❌ PDF não encontrado:', pdfPath);
  process.exit(1);
}

// Nomes esperados das imagens baseado nas descrições do PDF
const nomesImagens = [
  'exterior-noturno.jpg',
  'exterior-diurno-sinal.jpg', 
  'exterior-diurno-completo.jpg',
];

console.log('📋 Nomes de arquivos esperados:');
nomesImagens.forEach((nome, i) => {
  console.log(`  ${i + 1}. ${nome}`);
});

console.log('\n⚠️  Para extrair imagens automaticamente:');
console.log('1. Instalar biblioteca: pnpm add pdf-poppler --save-dev');
console.log('2. Executar: node scripts/extrair-imagens-pdf.mjs');
console.log('\n🔗 OU usar ferramenta online:');
console.log('- https://www.ilovepdf.com/extract-images-from-pdf');
console.log('  → Upload PDF → Extrair → Download');
console.log('  → Salvar em: public/images/espaco/');
console.log('  → Renomear conforme nomes acima');

