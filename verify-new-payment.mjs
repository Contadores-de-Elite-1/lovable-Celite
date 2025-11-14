#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import fs from 'fs/promises';

const supabaseUrl = 'https://zytxwdgzjqrcmbnpgofj.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5dHh3ZGd6anFyY21ibnBnb2ZqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDk4NjY0MiwiZXhwIjoyMDc2NTYyNjQyfQ.uC4X8zC-XtPNfQC0m7aKEoYO8DtCtbT4kZ67QGI-1A4';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

console.log('🔍 Verificando novo pagamento e comissões\n');
console.log('═══════════════════════════════════════════════════════════════\n');

const testData = JSON.parse(await fs.readFile('e2e-new-test.json', 'utf-8'));
const clienteId = testData.cliente.id;
const pagamentoId = testData.payment.id;

console.log(`💳 Procurando pagamento: ${pagamentoId}\n`);

// Check pagamento
const { data: pagamentos, error: pagError } = await supabase
  .from('pagamentos')
  .select('*')
  .eq('cliente_id', clienteId)
  .order('created_at', { ascending: false });

if (pagError) {
  console.error('❌ Erro:', pagError.message);
} else if (!pagamentos || pagamentos.length === 0) {
  console.log('⚠️  Nenhum pagamento encontrado ainda!');
  console.log('   O webhook pode não ter sido processado.');
  console.log('   Aguarde alguns segundos e tente novamente.\n');
} else {
  const pag = pagamentos[0];
  console.log('✅ Pagamento encontrado!');
  console.log(`   ID: ${pag.id.substring(0, 13)}...`);
  console.log(`   Asaas: ${pag.asaas_payment_id}`);
  console.log(`   Valor Bruto: R$ ${pag.valor_bruto}`);
  console.log(`   Valor Líquido: R$ ${pag.valor_liquido}`);
  console.log(`   Status: ${pag.status}`);
  console.log();
}

console.log('═══════════════════════════════════════════════════════════════\n');
console.log('💰 Procurando comissões\n');

// Check comissoes
const { data: comissoes, error: comError } = await supabase
  .from('comissoes')
  .select(`
    *,
    contadores(nivel, user_id)
  `)
  .eq('cliente_id', clienteId)
  .order('valor_calculado', { ascending: false });

if (comError) {
  console.error('❌ Erro:', comError.message);
} else if (!comissoes || comissoes.length === 0) {
  console.log('⚠️  Nenhuma comissão encontrada ainda!');
  console.log('   As comissões podem não ter sido calculadas ainda.');
  console.log('   Aguarde alguns segundos e tente novamente.\n');
} else {
  console.log(`✅ ${comissoes.length} comissão(ões) encontrada(s)!\n`);

  let total = 0;
  for (const com of comissoes) {
    const nivel = com.contadores?.nivel || 'desconhecido';
    console.log(`📊 ${nivel.toUpperCase()}`);
    console.log(`   Tipo: ${com.tipo_comissao}`);
    console.log(`   Valor: R$ ${com.valor_calculado}`);
    console.log(`   Status: ${com.status}`);
    console.log();
    total += parseFloat(com.valor_calculado);
  }

  console.log('═══════════════════════════════════════════════════════════════\n');
  console.log('📈 RESUMO:\n');
  console.log(`   Total de Comissões: R$ ${total.toFixed(2)}`);
  if (pagamentos && pagamentos.length > 0) {
    const percentual = ((total / pagamentos[0].valor_liquido) * 100).toFixed(1);
    console.log(`   Percentual: ${percentual}% do valor líquido`);
  }
  console.log();
}

console.log('═══════════════════════════════════════════════════════════════\n');
console.log('✅ VERIFICAÇÃO CONCLUÍDA!\n');
