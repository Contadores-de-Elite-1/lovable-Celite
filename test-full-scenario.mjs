#!/usr/bin/env node

/**
 * TESTE CENÁRIO COMPLETO - Produção Simulada
 *
 * História: João (Bronze) indica cliente "Padaria do Bairro"
 * Rede: Carlos (Diamante) → Maria (Ouro) → João (Bronze)
 *
 * Fluxo completo end-to-end com todas as integrações
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const ASAAS_API_KEY = '$aact_hmlg_000MzkwODA2MWY2OGM3MWRlMDU2NWM3MzJlNzZmNGZhZGY6Ojg5NGI4NmYzLWQxYmUtNDkwYy05ZWMwLTM5ZTFhZGUwYWM2MDo6JGFhY2hfNDNkMWQ3N2YtNTEzOS00NmU3LWE4NzAtMzU0Y2Q1ZWEyYTA4';
const ASAAS_API_URL = 'https://sandbox.asaas.com/api/v3';

console.log('╔════════════════════════════════════════════════════════════════╗');
console.log('║                                                                ║');
console.log('║       🎬 CENÁRIO COMPLETO - SISTEMA CONTADORES DE ELITE       ║');
console.log('║                                                                ║');
console.log('╚════════════════════════════════════════════════════════════════╝');
console.log();

// IDs fixos para o cenário
const CARLOS_ID = '10000000-0000-0000-0000-000000000001'; // Diamante (topo)
const MARIA_ID = '10000000-0000-0000-0000-000000000002';  // Ouro (meio)
const JOAO_ID = '10000000-0000-0000-0000-000000000003';   // Bronze (vendedor)

console.log('📖 CENÁRIO:');
console.log('   Carlos (Diamante) → Maria (Ouro) → João (Bronze)');
console.log('   João consegue novo cliente: Padaria do Bairro Ltda');
console.log('   Plano: Pro (R$ 299,90/mês)');
console.log();
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log();

// ============================================================================
// PASSO 1: Criar estrutura de rede (3 níveis)
// ============================================================================

console.log('👥 PASSO 1: Criando rede de contadores...');

// Limpar dados anteriores
await supabase.from('comissoes').delete().neq('id', '00000000-0000-0000-0000-000000000000');
await supabase.from('pagamentos').delete().neq('id', '00000000-0000-0000-000000000000');
await supabase.from('clientes').delete().like('email', '%@padaria-teste.com');
await supabase.from('rede_contadores').delete().in('contador_id', [CARLOS_ID, MARIA_ID, JOAO_ID]);
await supabase.from('contadores').delete().in('user_id', [CARLOS_ID, MARIA_ID, JOAO_ID]);

// Criar contadores
const contadores = [
  {
    user_id: CARLOS_ID,
    nivel: 'diamante',
    status: 'ativo',
    taxa_comissao: 20.00,
    xp: 10000,
    clientes_ativos: 0
  },
  {
    user_id: MARIA_ID,
    nivel: 'ouro',
    status: 'ativo',
    taxa_comissao: 15.00,
    xp: 3000,
    clientes_ativos: 0
  },
  {
    user_id: JOAO_ID,
    nivel: 'bronze',
    status: 'ativo',
    taxa_comissao: 10.00,
    xp: 500,
    clientes_ativos: 0
  }
];

for (const contador of contadores) {
  const { error } = await supabase
    .from('contadores')
    .upsert(contador, { onConflict: 'user_id' });

  if (error) console.error(`   ❌ Erro ao criar contador:`, error.message);
}

console.log('   ✅ Carlos (Diamante) - Taxa: 20%');
console.log('   ✅ Maria (Ouro) - Taxa: 15%');
console.log('   ✅ João (Bronze) - Taxa: 10%');

// Criar rede
const rede = [
  { contador_id: CARLOS_ID, indicado_por_id: null, nivel: 1 },
  { contador_id: MARIA_ID, indicado_por_id: CARLOS_ID, nivel: 2 },
  { contador_id: JOAO_ID, indicado_por_id: MARIA_ID, nivel: 3 }
];

for (const r of rede) {
  await supabase.from('rede_contadores').upsert(r, { onConflict: 'contador_id' });
}

console.log('   ✅ Rede criada: Carlos → Maria → João');
console.log();

// ============================================================================
// PASSO 2: Criar cliente no Asaas
// ============================================================================

console.log('🏢 PASSO 2: Criando cliente "Padaria do Bairro" no Asaas...');

const customerResponse = await fetch(`${ASAAS_API_URL}/customers`, {
  method: 'POST',
  headers: {
    'accept': 'application/json',
    'content-type': 'application/json',
    'access_token': ASAAS_API_KEY
  },
  body: JSON.stringify({
    name: 'Padaria do Bairro Ltda',
    email: 'contato@padaria-teste.com',
    cpfCnpj: '07526672000140', // CNPJ válido
    phone: '11987654321',
    observation: 'Cliente indicado por João (Contador Bronze)'
  })
});

const asaasCustomer = await customerResponse.json();

if (asaasCustomer.errors) {
  console.error('   ❌ Erro:', asaasCustomer.errors);
  process.exit(1);
}

console.log(`   ✅ Cliente criado no Asaas`);
console.log(`      ID: ${asaasCustomer.id}`);
console.log(`      Nome: ${asaasCustomer.name}`);
console.log();

// ============================================================================
// PASSO 3: Registrar cliente no banco de dados
// ============================================================================

console.log('💾 PASSO 3: Registrando cliente no banco de dados...');

const { data: cliente, error: clienteError } = await supabase
  .from('clientes')
  .insert({
    contador_id: JOAO_ID, // Cliente de João
    nome_empresa: 'Padaria do Bairro Ltda',
    cnpj: '07526672000140',
    email: 'contato@padaria-teste.com',
    telefone: '11987654321',
    status: 'ativo', // Já ativo pois vai criar assinatura
    tipo_plano: 'pro',
    valor_mensalidade: 299.90,
    asaas_customer_id: asaasCustomer.id
  })
  .select()
  .single();

if (clienteError) {
  console.error('   ❌ Erro:', clienteError.message);
  process.exit(1);
}

console.log(`   ✅ Cliente registrado no banco`);
console.log(`      ID: ${cliente.id}`);
console.log(`      Contador: João (Bronze)`);
console.log(`      Plano: Pro (R$ ${cliente.valor_mensalidade})`);
console.log();

// Aguardar processamento
await new Promise(resolve => setTimeout(resolve, 2000));

// ============================================================================
// PASSO 4: Criar assinatura recorrente no Asaas
// ============================================================================

console.log('🔄 PASSO 4: Criando assinatura recorrente no Asaas...');

const subscriptionResponse = await fetch(`${ASAAS_API_URL}/subscriptions`, {
  method: 'POST',
  headers: {
    'accept': 'application/json',
    'content-type': 'application/json',
    'access_token': ASAAS_API_KEY
  },
  body: JSON.stringify({
    customer: asaasCustomer.id,
    billingType: 'BOLETO',
    value: 299.90,
    nextDueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    cycle: 'MONTHLY',
    description: 'Plano Pro - Contadores de Elite - Mensal'
  })
});

const subscription = await subscriptionResponse.json();

if (subscription.errors) {
  console.error('   ❌ Erro:', subscription.errors);
  process.exit(1);
}

console.log(`   ✅ Assinatura criada`);
console.log(`      ID: ${subscription.id}`);
console.log(`      Ciclo: Mensal`);
console.log(`      Próximo vencimento: ${subscription.nextDueDate}`);
console.log();

// Atualizar cliente com subscription ID
await supabase
  .from('clientes')
  .update({ asaas_subscription_id: subscription.id })
  .eq('id', cliente.id);

// ============================================================================
// PASSO 5: Criar primeira cobrança (pagamento)
// ============================================================================

console.log('💳 PASSO 5: Gerando primeira cobrança...');

const paymentResponse = await fetch(`${ASAAS_API_URL}/payments`, {
  method: 'POST',
  headers: {
    'accept': 'application/json',
    'content-type': 'application/json',
    'access_token': ASAAS_API_KEY
  },
  body: JSON.stringify({
    customer: asaasCustomer.id,
    billingType: 'BOLETO',
    value: 299.90,
    dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    description: 'Plano Pro - Contadores de Elite - Mês 1',
    subscription: subscription.id
  })
});

const payment = await paymentResponse.json();

if (payment.errors) {
  console.error('   ❌ Erro:', payment.errors);
  process.exit(1);
}

console.log(`   ✅ Cobrança gerada`);
console.log(`      ID: ${payment.id}`);
console.log(`      Valor: R$ ${payment.value}`);
console.log(`      Vencimento: ${payment.dueDate}`);
console.log(`      Link: ${payment.invoiceUrl}`);
console.log();

// ============================================================================
// PASSO 6: Registrar pagamento no banco
// ============================================================================

console.log('💾 PASSO 6: Registrando pagamento no banco...');

const { data: pagamento, error: pagamentoError } = await supabase
  .from('pagamentos')
  .insert({
    cliente_id: cliente.id,
    valor: 299.90,
    status: 'pending',
    data_vencimento: payment.dueDate,
    asaas_payment_id: payment.id,
    tipo_pagamento: 'boleto'
  })
  .select()
  .single();

if (pagamentoError) {
  console.error('   ❌ Erro:', pagamentoError.message);
} else {
  console.log(`   ✅ Pagamento registrado`);
  console.log(`      ID: ${pagamento.id}`);
}

console.log();

// ============================================================================
// RESUMO DO CENÁRIO
// ============================================================================

console.log('═══════════════════════════════════════════════════════════════');
console.log('✅ CENÁRIO CRIADO COM SUCESSO!');
console.log('═══════════════════════════════════════════════════════════════');
console.log();
console.log('📊 ESTRUTURA CRIADA:');
console.log();
console.log('  🌳 REDE DE CONTADORES:');
console.log(`     Nível 1: Carlos (Diamante) - ${CARLOS_ID.substring(0, 8)}...`);
console.log(`     Nível 2: Maria (Ouro) - ${MARIA_ID.substring(0, 8)}...`);
console.log(`     Nível 3: João (Bronze) - ${JOAO_ID.substring(0, 8)}...`);
console.log();
console.log('  🏢 CLIENTE:');
console.log(`     Nome: ${cliente.nome_empresa}`);
console.log(`     ID DB: ${cliente.id}`);
console.log(`     ID Asaas: ${asaasCustomer.id}`);
console.log(`     Plano: Pro (R$ ${cliente.valor_mensalidade}/mês)`);
console.log();
console.log('  💳 ASSINATURA:');
console.log(`     ID: ${subscription.id}`);
console.log(`     Ciclo: Mensal`);
console.log(`     Próximo vencimento: ${subscription.nextDueDate}`);
console.log();
console.log('  🧾 PRIMEIRA COBRANÇA:');
console.log(`     ID: ${payment.id}`);
console.log(`     Valor: R$ ${payment.value}`);
console.log(`     Status: ${payment.status}`);
console.log(`     Link: ${payment.invoiceUrl}`);
console.log();
console.log('═══════════════════════════════════════════════════════════════');
console.log();
console.log('💰 COMISSÕES ESPERADAS (após pagamento):');
console.log();
console.log('  1. João (Bronze - venda direta):');
console.log('     └─> R$ 29,99 (10% de R$ 299,90)');
console.log();
console.log('  2. Maria (Ouro - override nível 2):');
console.log('     └─> R$ 8,99 (3% override)');
console.log();
console.log('  3. Carlos (Diamante - bônus de rede):');
console.log('     └─> R$ 5,99 (2% bônus rede)');
console.log();
console.log('  💵 TOTAL DISTRIBUÍDO: R$ 44,97 (15%)');
console.log();
console.log('═══════════════════════════════════════════════════════════════');
console.log();
console.log('📝 PRÓXIMOS PASSOS - SIMULAÇÃO DE PAGAMENTO:');
console.log();
console.log('  OPÇÃO 1: Via Asaas Sandbox (RECOMENDADO)');
console.log('  ──────────────────────────────────────────');
console.log('  1. Acesse: https://sandbox.asaas.com/login');
console.log('  2. Vá em: Cobranças → Localizar');
console.log(`  3. ID: ${payment.id}`);
console.log('  4. Clique: "Simular Pagamento"');
console.log('  5. Webhook será enviado automaticamente');
console.log();
console.log('  OPÇÃO 2: Via Script (simula webhook)');
console.log('  ──────────────────────────────────────────');
console.log('  Execute: node test-simulate-webhook.mjs');
console.log();
console.log('═══════════════════════════════════════════════════════════════');
console.log();
console.log('🔍 VERIFICAR RESULTADOS:');
console.log();
console.log('  Frontend:');
console.log('  • Dashboard: http://localhost:8080/dashboard');
console.log('  • Comissões: http://localhost:8080/comissoes');
console.log('  • Admin Asaas: http://localhost:8080/admin/asaas');
console.log();
console.log('  Logs:');
console.log('  • Webhooks: supabase functions logs webhook-asaas');
console.log('  • Comissões: supabase functions logs calcular-comissoes');
console.log();
console.log('═══════════════════════════════════════════════════════════════');
console.log();
console.log('✨ Sistema pronto para teste end-to-end completo!');
console.log();

// Salvar dados para próximo script
const scenarioData = {
  contadores: { CARLOS_ID, MARIA_ID, JOAO_ID },
  cliente: cliente.id,
  asaas: {
    customer_id: asaasCustomer.id,
    subscription_id: subscription.id,
    payment_id: payment.id
  },
  pagamento: pagamento?.id
};

await Deno.writeTextFile(
  'scenario-data.json',
  JSON.stringify(scenarioData, null, 2)
);

console.log('💾 Dados salvos em: scenario-data.json');
console.log();
