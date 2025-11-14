#!/usr/bin/env node

/**
 * BABY STEP 1: Criar Rede de 3 Contadores no Banco
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

console.log('🎯 BABY STEP 1: Criar Rede de Contadores\n');

// IDs fixos para o cenário
const CARLOS_ID = '10000000-0000-0000-0000-000000000001'; // Diamante (topo)
const MARIA_ID = '10000000-0000-0000-0000-000000000002';  // Ouro (meio)
const JOAO_ID = '10000000-0000-0000-0000-000000000003';   // Bronze (vendedor)

console.log('📖 Cenário:');
console.log('   Carlos (Diamante, 15 clientes) → Maria (Ouro, 12 clientes) → João (Bronze, 3 clientes)');
console.log('   João vai vender plano de R$ 299,90/mês\n');

// Limpar dados anteriores
console.log('🧹 Limpando dados anteriores...');
await supabase.from('comissoes').delete().neq('id', '00000000-0000-0000-0000-000000000000');
await supabase.from('pagamentos').delete().neq('id', '00000000-0000-0000-0000-000000000000');
await supabase.from('clientes').delete().like('email', '%@padaria-teste.com');
await supabase.from('rede_contadores').delete().or(`sponsor_id.in.(${CARLOS_ID},${MARIA_ID},${JOAO_ID}),child_id.in.(${CARLOS_ID},${MARIA_ID},${JOAO_ID})`);
await supabase.from('contadores').delete().in('user_id', [CARLOS_ID, MARIA_ID, JOAO_ID]);
console.log('✅ Dados limpos\n');

// Criar contadores (usando schema real: user_id, nivel, status, clientes_ativos, xp)
console.log('👥 Criando contadores...\n');

const contadores = [
  {
    user_id: CARLOS_ID,
    nivel: 'diamante',
    status: 'ativo',
    clientes_ativos: 15, // Diamante: 15+ clientes
    xp: 10000
  },
  {
    user_id: MARIA_ID,
    nivel: 'ouro',
    status: 'ativo',
    clientes_ativos: 12, // Ouro: 10-14 clientes
    xp: 3000
  },
  {
    user_id: JOAO_ID,
    nivel: 'bronze',
    status: 'ativo',
    clientes_ativos: 3, // Bronze: <5 clientes
    xp: 500
  }
];

for (const contador of contadores) {
  const { data, error } = await supabase
    .from('contadores')
    .upsert(contador, { onConflict: 'user_id' })
    .select()
    .single();

  if (error) {
    console.error(`   ❌ Erro ao criar contador:`, error.message);
  } else {
    console.log(`   ✅ ${contador.nivel.toUpperCase()}: ${data.id.substring(0, 8)}... (${contador.clientes_ativos} clientes ativos)`);
  }
}

console.log();

// Criar rede (usando schema real: sponsor_id, child_id, nivel_rede)
console.log('🕸️  Criando rede de 3 níveis...\n');

// Carlos → Maria (nível 1)
const { data: rede1, error: erro1 } = await supabase
  .from('rede_contadores')
  .insert({
    sponsor_id: CARLOS_ID,
    child_id: MARIA_ID,
    nivel_rede: 1
  })
  .select()
  .single();

if (erro1) {
  console.error('   ❌ Erro ao criar rede Carlos → Maria:', erro1.message);
} else {
  console.log('   ✅ Carlos (Diamante) → Maria (Ouro)');
}

// Maria → João (nível 2)
const { data: rede2, error: erro2 } = await supabase
  .from('rede_contadores')
  .insert({
    sponsor_id: MARIA_ID,
    child_id: JOAO_ID,
    nivel_rede: 2
  })
  .select()
  .single();

if (erro2) {
  console.error('   ❌ Erro ao criar rede Maria → João:', erro2.message);
} else {
  console.log('   ✅ Maria (Ouro) → João (Bronze)');
}

console.log();
console.log('═══════════════════════════════════════════════════════════════');
console.log('✅ BABY STEP 1 CONCLUÍDO!');
console.log('═══════════════════════════════════════════════════════════════');
console.log();
console.log('📊 ESTRUTURA CRIADA:');
console.log();
console.log('  Nível 1: Carlos (Diamante) - 15 clientes ativos');
console.log(`           ID: ${CARLOS_ID.substring(0, 8)}...`);
console.log('           Comissão direta: 20%');
console.log('           Override: 5%');
console.log();
console.log('  Nível 2: Maria (Ouro) - 12 clientes ativos');
console.log(`           ID: ${MARIA_ID.substring(0, 8)}...`);
console.log('           Comissão direta: 20%');
console.log('           Override: 5%');
console.log('           Indicada por: Carlos');
console.log();
console.log('  Nível 3: João (Bronze) - 3 clientes ativos');
console.log(`           ID: ${JOAO_ID.substring(0, 8)}...`);
console.log('           Comissão direta: 15%');
console.log('           Override: 3%');
console.log('           Indicado por: Maria');
console.log();
console.log('💰 PRÓXIMAS COMISSÕES ESPERADAS (venda de R$ 299,90):');
console.log();
console.log('  Primeiro Pagamento (100% do valor):');
console.log('  1. João (vendedor direto): R$ 299,90 (100%)');
console.log();
console.log('  Pagamentos Recorrentes:');
console.log('  1. João (vendedor Bronze): R$ 44,99 (15% de R$ 299,90)');
console.log('  2. Maria (sponsor Ouro): R$ 14,99 (5% override)');
console.log('  3. Carlos: R$ 0,00 (apenas 1 nível de override)');
console.log();
console.log('═══════════════════════════════════════════════════════════════');
console.log();
console.log('📝 PRÓXIMO PASSO:');
console.log('   Execute: node test-baby-step-2-create-customer-asaas.mjs');
console.log();
