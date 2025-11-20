/**
 * Script para extrair imagens do PDF "PLANOS__E_SERVIÇOS.pdf"
 * 
 * Instalar dependências:
 * pnpm add pdf2pic pdf-lib --save-dev
 * 
 * Ou usar:
 * pnpm add pdfjs-dist canvas --save-dev
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pdfPath = path.join(__dirname, '../public/PLANOS__E_SERVIÇOS.pdf');
const outputDir = path.join(__dirname, '../public/images/espaco');

// Criar diretório se não existir
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

console.log('📄 Extraindo imagens do PDF...');
console.log(`📂 PDF: ${pdfPath}`);
console.log(`📁 Saída: ${outputDir}`);

// Verificar se PDF existe
if (!fs.existsSync(pdfPath)) {
  console.error('❌ PDF não encontrado:', pdfPath);
  process.exit(1);
}

console.log('\n⚠️  Para extrair imagens, você precisa:');
console.log('1. Abrir o PDF manualmente');
console.log('2. Usar uma ferramenta online (recomendado)');
console.log('3. Ou instalar biblioteca PDF');
console.log('\n🔗 Ferramentas recomendadas:');
console.log('- https://www.ilovepdf.com/extract-images-from-pdf');
console.log('- Adobe Acrobat (Tools → Edit PDF → Select Image → Save)');
console.log('- Preview (Mac): Select Image → Copy → Export');

