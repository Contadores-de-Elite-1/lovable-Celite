#!/usr/bin/env node

/**
 * Visualizar TODOS os Contadores
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

console.log('👥 TODOS OS CONTADORES NO SISTEMA\n');
console.log('═══════════════════════════════════════════════════════════════\n');

// Buscar TODOS os contadores
const { data: contadores, error: contError } = await supabase
  .from('contadores')
  .select('*')
  .order('clientes_ativos', { ascending: false });

if (contError) {
  console.error('❌ Erro:', contError.message);
  process.exit(1);
}

if (!contadores || contadores.length === 0) {
  console.log('⚠️  Nenhum contador encontrado no banco de dados.\n');
  process.exit(0);
}

// Buscar usuários
const { data: usersData } = await supabase.auth.admin.listUsers();
const users = usersData?.users || [];

for (const contador of contadores) {
  const user = users.find(u => u.id === contador.user_id);
  const nome = user?.user_metadata?.nome || user?.email || 'Desconhecido';

  console.log(`📊 ${nome.toUpperCase()}`);
  console.log(`   Email: ${user?.email || 'N/A'}`);
  console.log(`   Nível: ${contador.nivel.toUpperCase()}`);
  console.log(`   Clientes Ativos: ${contador.clientes_ativos}`);
  console.log(`   XP: ${contador.xp}`);
  console.log(`   Status: ${contador.status}`);
  console.log(`   ID Contador: ${contador.id}`);
  console.log(`   ID User: ${contador.user_id}`);
  console.log();
}

// Buscar rede
console.log('═══════════════════════════════════════════════════════════════\n');
console.log('🕸️  ESTRUTURA DA REDE\n');

const { data: rede, error: redeError } = await supabase
  .from('rede_contadores')
  .select('*')
  .order('nivel_rede', { ascending: true });

if (redeError) {
  console.error('❌ Erro ao buscar rede:', redeError.message);
} else if (!rede || rede.length === 0) {
  console.log('⚠️  Nenhuma relação de rede encontrada.\n');
} else {
  for (const rel of rede) {
    const sponsorCont = contadores.find(c => c.id === rel.sponsor_id);
    const childCont = contadores.find(c => c.id === rel.child_id);

    const sponsorUser = users.find(u => u.id === sponsorCont?.user_id);
    const childUser = users.find(u => u.id === childCont?.user_id);

    const sponsorNome = sponsorUser?.user_metadata?.nome || sponsorUser?.email || 'Desconhecido';
    const childNome = childUser?.user_metadata?.nome || childUser?.email || 'Desconhecido';

    console.log(`   ${sponsorNome} (${sponsorCont?.nivel || '?'}) → ${childNome} (${childCont?.nivel || '?'})`);
    console.log(`   └─ Nível da rede: ${rel.nivel_rede}`);
    console.log();
  }
}

// Buscar cliente
console.log('═══════════════════════════════════════════════════════════════\n');
console.log('🏢 CLIENTES CADASTRADOS\n');

const { data: clientes, error: clienteError } = await supabase
  .from('clientes')
  .select('*')
  .order('created_at', { ascending: false });

if (clienteError) {
  console.error('❌ Erro ao buscar clientes:', clienteError.message);
} else if (!clientes || clientes.length === 0) {
  console.log('⚠️  Nenhum cliente encontrado.\n');
} else {
  for (const cliente of clientes) {
    const contadorCli = contadores.find(c => c.id === cliente.contador_id);
    const userCli = users.find(u => u.id === contadorCli?.user_id);
    const nomeContador = userCli?.user_metadata?.nome || userCli?.email || 'Desconhecido';

    console.log(`   🏢 ${cliente.nome_empresa}`);
    console.log(`      Contador: ${nomeContador} (${contadorCli?.nivel || '?'})`);
    console.log(`      Plano: ${cliente.plano}`);
    console.log(`      Valor: R$ ${cliente.valor_mensal}`);
    console.log(`      Status: ${cliente.status}`);
    console.log(`      Asaas Customer ID: ${cliente.asaas_customer_id || 'N/A'}`);
    console.log();
  }
}

console.log('═══════════════════════════════════════════════════════════════\n');
