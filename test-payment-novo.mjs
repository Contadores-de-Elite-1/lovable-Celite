#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import fs from 'fs/promises';

const supabase = createClient(
  'https://zytxwdgzjqrcmbnpgofj.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5dHh3ZGd6anFyY21ibnBnb2ZqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDk4NjY0MiwiZXhwIjoyMDc2NTYyNjQyfQ.uC4X8zC-XtPNfQC0m7aKEoYO8DtCtbT4kZ67QGI-1A4'
);

const testData = JSON.parse(await fs.readFile('e2e-new-test.json', 'utf-8'));
const clienteId = testData.cliente.id;

console.log('🔍 Verificando resultado do webhook\n');
console.log('═══════════════════════════════════════════════════════════════\n');

// Check pagamento
const { data: pag } = await supabase
  .from('pagamentos')
  .select('*')
  .eq('cliente_id', clienteId)
  .single();

if (pag) {
  console.log('✅ PAGAMENTO PROCESSADO!');
  console.log(`   ID: ${pag.id.substring(0, 13)}...`);
  console.log(`   Valor Líquido: R$ ${pag.valor_liquido}`);
  console.log(`   Status: ${pag.status}\n`);
} else {
  console.log('⚠️  Pagamento não encontrado ainda\n');
}

// Check comissoes
const { data: com } = await supabase
  .from('comissoes')
  .select('*,contadores(nivel)')
  .eq('cliente_id', clienteId)
  .order('valor', { ascending: false });

if (com && com.length > 0) {
  console.log(`✅ ${com.length} COMISSÃO(ÕES) CALCULADA(S)!\n`);
  let total = 0;
  for (const c of com) {
    console.log(`📊 ${c.contadores.nivel.toUpperCase()}`);
    console.log(`   Valor: R$ ${c.valor}`);
    console.log(`   Tipo: ${c.tipo_comissao}\n`);
    total += parseFloat(c.valor);
  }
  console.log(`💰 TOTAL: R$ ${total.toFixed(2)}`);
} else {
  console.log('⚠️  Nenhuma comissão calculada ainda');
}

console.log('\n═══════════════════════════════════════════════════════════════');
