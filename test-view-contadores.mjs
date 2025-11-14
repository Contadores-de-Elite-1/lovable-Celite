#!/usr/bin/env node

/**
 * Visualizar Contadores Criados
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

console.log('👥 CONTADORES CRIADOS NO SISTEMA\n');
console.log('═══════════════════════════════════════════════════════════════\n');

// Buscar contadores
const { data: contadores, error: contError } = await supabase
  .from('contadores')
  .select('*')
  .in('user_id', [
    '564a43c6-5e2e-4a62-baec-5a3e8ff21838', // Carlos
    '4eb81cf5-7f35-4a58-ba0d-aab10eb9a7f4', // Maria
    'a7db1b59-1b4e-42f9-9ddc-aed0ecbccd87'  // João
  ])
  .order('clientes_ativos', { ascending: false });

if (contError) {
  console.error('❌ Erro:', contError.message);
  process.exit(1);
}

// Buscar dados dos usuários
const { data: users } = await supabase.auth.admin.listUsers();

for (const contador of contadores) {
  const user = users.users.find(u => u.id === contador.user_id);
  const nome = user?.user_metadata?.nome || user?.email || 'Desconhecido';

  console.log(`📊 ${nome.toUpperCase()}`);
  console.log(`   Email: ${user?.email || 'N/A'}`);
  console.log(`   Nível: ${contador.nivel.toUpperCase()}`);
  console.log(`   Clientes Ativos: ${contador.clientes_ativos}`);
  console.log(`   XP: ${contador.xp}`);
  console.log(`   Status: ${contador.status}`);
  console.log(`   ID Contador: ${contador.id.substring(0, 13)}...`);
  console.log(`   ID User: ${contador.user_id.substring(0, 13)}...`);
  console.log();
}

// Buscar rede
console.log('═══════════════════════════════════════════════════════════════\n');
console.log('🕸️  ESTRUTURA DA REDE\n');

const { data: rede, error: redeError } = await supabase
  .from('rede_contadores')
  .select(`
    *,
    sponsor:sponsor_id (id, nivel, user_id),
    child:child_id (id, nivel, user_id)
  `)
  .order('nivel_rede', { ascending: true });

if (redeError) {
  console.error('❌ Erro ao buscar rede:', redeError.message);
} else {
  for (const rel of rede) {
    const sponsorUser = users.users.find(u => u.id === rel.sponsor.user_id);
    const childUser = users.users.find(u => u.id === rel.child.user_id);

    const sponsorNome = sponsorUser?.user_metadata?.nome || sponsorUser?.email;
    const childNome = childUser?.user_metadata?.nome || childUser?.email;

    console.log(`   ${sponsorNome} (${rel.sponsor.nivel}) → ${childNome} (${rel.child.nivel})`);
    console.log(`   └─ Nível: ${rel.nivel_rede}`);
    console.log();
  }
}

console.log('═══════════════════════════════════════════════════════════════\n');
console.log('💰 COMISSÕES ESPERADAS (baseado no código real):\n');
console.log('   Primeiro Pagamento (ativação):');
console.log('   • João (Bronze, vendedor direto): R$ 299,90 (100%)\n');
console.log('   Pagamentos Recorrentes:');
console.log('   • João (Bronze, 3 clientes): R$ 44,99 (15% de R$ 299,90)');
console.log('   • Maria (Ouro, sponsor): R$ 14,99 (5% override)');
console.log('   • Carlos: R$ 0,00 (apenas 1 nível de override)\n');
console.log('═══════════════════════════════════════════════════════════════\n');
