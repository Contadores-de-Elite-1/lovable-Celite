#!/usr/bin/env node

/**
 * CLOUD E2E TEST - VERIFY RESULTS
 * Check if webhook was processed and commissions calculated
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs/promises';

// CLOUD credentials
const supabaseUrl = 'https://zytxwdgzjqrcmbnpgofj.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5dHh3ZGd6anFyY21ibnBnb2ZqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDk4NjY0MiwiZXhwIjoyMDc2NTYyNjQyfQ.uC4X8zC-XtPNfQC0m7aKEoYO8DtCtbT4kZ67QGI-1A4';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

console.log('🌐 CLOUD E2E TEST - VERIFY RESULTS\n');
console.log('═══════════════════════════════════════════════════════════════\n');

// Load scenario data
const scenarioData = JSON.parse(await fs.readFile('cloud-scenario-data.json', 'utf-8'));
const clienteId = scenarioData.cliente.id;

console.log('🔍 Buscando dados na CLOUD...\n');

// =============================================================================
// 1. Check Pagamentos (Payments)
// =============================================================================

console.log('💳 STEP 1: Verificando Pagamentos\n');

const { data: pagamentos, error: pagError } = await supabase
  .from('pagamentos')
  .select('*')
  .eq('cliente_id', clienteId)
  .order('created_at', { ascending: false });

if (pagError) {
  console.error('❌ Erro ao buscar pagamentos:', pagError.message);
} else if (!pagamentos || pagamentos.length === 0) {
  console.log('⚠️  Nenhum pagamento encontrado!');
  console.log('   O webhook pode não ter sido processado.');
} else {
  const pagamento = pagamentos[0];
  console.log(`✅ Pagamento encontrado!`);
  console.log(`   ID: ${pagamento.id.substring(0, 13)}...`);
  console.log(`   Asaas Payment ID: ${pagamento.asaas_payment_id}`);
  console.log(`   Valor Bruto: R$ ${pagamento.valor_bruto}`);
  console.log(`   Valor Líquido: R$ ${pagamento.valor_liquido}`);
  console.log(`   Status: ${pagamento.status}`);
  console.log(`   Tipo: ${pagamento.tipo}`);
  console.log(`   Competência: ${pagamento.competencia}`);
  console.log();
}

// =============================================================================
// 2. Check Comissões (Commissions)
// =============================================================================

console.log('═══════════════════════════════════════════════════════════════\n');
console.log('💰 STEP 2: Verificando Comissões\n');

const { data: comissoes, error: comError } = await supabase
  .from('comissoes')
  .select(`
    *,
    contadores (
      user_id,
      nivel,
      clientes_ativos
    )
  `)
  .eq('cliente_id', clienteId)
  .order('valor_calculado', { ascending: false });

if (comError) {
  console.error('❌ Erro ao buscar comissões:', comError.message);
} else if (!comissoes || comissoes.length === 0) {
  console.log('⚠️  Nenhuma comissão encontrada!');
  console.log('   As comissões podem não ter sido calculadas ainda.');
  console.log('   Aguarde alguns segundos e tente novamente.');
} else {
  console.log(`✅ ${comissoes.length} comissão(ões) encontrada(s)!\n`);

  const contadoresMap = scenarioData.contadores;
  let totalComissoes = 0;

  for (const com of comissoes) {
    let contadorNome = 'Desconhecido';

    if (com.contador_id === contadoresMap.carlos.contador_id) {
      contadorNome = 'Carlos (Diamante)';
    } else if (com.contador_id === contadoresMap.maria.contador_id) {
      contadorNome = 'Maria (Ouro)';
    } else if (com.contador_id === contadoresMap.joao.contador_id) {
      contadorNome = 'João (Bronze)';
    }

    console.log(`📊 ${contadorNome}`);
    console.log(`   Tipo: ${com.tipo_comissao}`);
    console.log(`   Valor Calculado: R$ ${com.valor_calculado}`);
    console.log(`   Status: ${com.status}`);
    console.log(`   Nível: ${com.nivel || 'N/A'}`);
    console.log();

    totalComissoes += parseFloat(com.valor_calculado);
  }

  console.log('═══════════════════════════════════════════════════════════════\n');
  console.log('📈 RESUMO:\n');
  console.log(`   Total de Comissões: R$ ${totalComissoes.toFixed(2)}`);

  if (pagamentos && pagamentos.length > 0) {
    const percentual = ((totalComissoes / pagamentos[0].valor_liquido) * 100).toFixed(1);
    console.log(`   Percentual: ${percentual}% do valor líquido`);
  }

  console.log();
}

// =============================================================================
// 3. Contadores Status
// =============================================================================

console.log('═══════════════════════════════════════════════════════════════\n');
console.log('👥 STEP 3: Status dos Contadores\n');

const { data: contadores } = await supabase
  .from('contadores')
  .select('*')
  .in('id', [
    scenarioData.contadores.carlos.contador_id,
    scenarioData.contadores.maria.contador_id,
    scenarioData.contadores.joao.contador_id
  ]);

if (contadores) {
  const contadoresMap = scenarioData.contadores;

  for (const cont of contadores) {
    let nome = 'Desconhecido';

    if (cont.id === contadoresMap.carlos.contador_id) {
      nome = 'Carlos (Diamante)';
    } else if (cont.id === contadoresMap.maria.contador_id) {
      nome = 'Maria (Ouro)';
    } else if (cont.id === contadoresMap.joao.contador_id) {
      nome = 'João (Bronze)';
    }

    console.log(`📍 ${nome}`);
    console.log(`   Nível: ${cont.nivel}`);
    console.log(`   Clientes Ativos: ${cont.clientes_ativos}`);
    console.log(`   Status: ${cont.status}`);
    console.log();
  }
}

console.log('═══════════════════════════════════════════════════════════════');
console.log();
console.log('✅ VERIFICAÇÃO CONCLUÍDA!');
console.log();
console.log('📊 PRÓXIMAS AÇÕES:');
console.log('   • Se viu comissões calculadas = ✅ SUCESSO TOTAL!');
console.log('   • Se não viu comissões = Verifique os logs do webhook');
console.log();
console.log('🔍 Para ver logs do webhook:');
console.log('   supabase functions logs webhook-asaas --limit 20');
console.log();
console.log('🔍 Para ver logs de cálculo de comissões:');
console.log('   supabase functions logs calcular-comissoes --limit 20');
console.log();
