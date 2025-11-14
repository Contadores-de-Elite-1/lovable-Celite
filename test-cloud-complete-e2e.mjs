#!/usr/bin/env node

/**
 * CLOUD E2E COMPLETE TEST
 * Steps 2-4: Network + Client + Payment (ALL IN ONE)
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs/promises';

// CLOUD credentials
const supabaseUrl = 'https://zytxwdgzjqrcmbnpgofj.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5dHh3ZGd6anFyY21ibnBnb2ZqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDk4NjY0MiwiZXhwIjoyMDc2NTYyNjQyfQ.uC4X8zC-XtPNfQC0m7aKEoYO8DtCtbT4kZ67QGI-1A4';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const ASAAS_API_KEY = '$aact_hmlg_000MzkwODA2MWY2OGM3MWRlMDU2NWM3MzJlNzZmNGZhZGY6Ojg5NGI4NmYzLWQxYmUtNDkwYy05ZWMwLTM5ZTFhZGUwYWM2MDo6JGFhY2hfNDNkMWQ3N2YtNTEzOS00NmU3LWE4NzAtMzU0Y2Q1ZWEyYTA4';
const ASAAS_API_URL = 'https://sandbox.asaas.com/api/v3';

console.log('🌐 CLOUD E2E TEST - Complete Scenario\n');
console.log('═══════════════════════════════════════════════════════════════\n');

// Load user IDs
const scenarioData = JSON.parse(await fs.readFile('cloud-scenario-data.json', 'utf-8'));
const carlos = scenarioData.users.find(u => u.nome === 'Carlos Diamante');
const maria = scenarioData.users.find(u => u.nome === 'Maria Ouro');
const joao = scenarioData.users.find(u => u.nome === 'João Bronze');

console.log('✅ Users loaded:');
console.log(`   Carlos: ${carlos.id.substring(0, 13)}...`);
console.log(`   Maria:  ${maria.id.substring(0, 13)}...`);
console.log(`   João:   ${joao.id.substring(0, 13)}...`);
console.log();

// =============================================================================
// STEP 2: Create Contadores in CLOUD
// =============================================================================

console.log('👥 STEP 2: Creating contadores in CLOUD...\n');

const contadores = [
  { user_id: carlos.id, nivel: 'diamante', status: 'ativo', clientes_ativos: 15, xp: 10000 },
  { user_id: maria.id, nivel: 'ouro', status: 'ativo', clientes_ativos: 12, xp: 3000 },
  { user_id: joao.id, nivel: 'bronze', status: 'ativo', clientes_ativos: 3, xp: 500 }
];

const contadoresIds = {};

for (const contador of contadores) {
  const { data, error } = await supabase
    .from('contadores')
    .upsert(contador, { onConflict: 'user_id' })
    .select()
    .single();

  if (error) {
    console.error(`   ❌ Error:`, error.message);
    process.exit(1);
  }

  contadoresIds[contador.user_id] = data.id;
  console.log(`   ✅ ${contador.nivel.toUpperCase()}: ${data.id.substring(0, 13)}...`);
}

console.log();

// Create network
console.log('🕸️  Creating 3-level network...\n');

const carlosContadorId = contadoresIds[carlos.id];
const mariaContadorId = contadoresIds[maria.id];
const joaoContadorId = contadoresIds[joao.id];

// Carlos → Maria
await supabase.from('rede_contadores').upsert({
  sponsor_id: carlosContadorId,
  child_id: mariaContadorId,
  nivel_rede: 1
}, { onConflict: 'sponsor_id,child_id' });

console.log('   ✅ Carlos → Maria');

// Maria → João
await supabase.from('rede_contadores').upsert({
  sponsor_id: mariaContadorId,
  child_id: joaoContadorId,
  nivel_rede: 2
}, { onConflict: 'sponsor_id,child_id' });

console.log('   ✅ Maria → João');
console.log();

// =============================================================================
// STEP 3: Create Customer in Asaas
// =============================================================================

console.log('🏢 STEP 3: Creating customer in Asaas...\n');

const customerResponse = await fetch(`${ASAAS_API_URL}/customers`, {
  method: 'POST',
  headers: {
    'accept': 'application/json',
    'content-type': 'application/json',
    'access_token': ASAAS_API_KEY
  },
  body: JSON.stringify({
    name: 'Padaria Cloud Test Ltda',
    email: 'padaria.cloud@teste.com',
    cpfCnpj: '34028316000103',
    phone: '11987654321',
    observation: 'Cliente CLOUD - João Bronze - E2E Test'
  })
});

const asaasCustomer = await customerResponse.json();

if (asaasCustomer.errors) {
  console.error('   ❌ Error:', asaasCustomer.errors);
  process.exit(1);
}

console.log(`   ✅ Customer created: ${asaasCustomer.id}`);
console.log();

// Register client in CLOUD database
console.log('💾 Registering client in CLOUD database...\n');

const { data: cliente, error: clienteError } = await supabase
  .from('clientes')
  .insert({
    contador_id: joaoContadorId,
    nome_empresa: 'Padaria Cloud Test Ltda',
    cnpj: '34028316000103',
    contato_email: 'padaria.cloud@teste.com',
    contato_telefone: '11987654321',
    status: 'lead',
    plano: 'profissional',
    valor_mensal: 299.90,
    asaas_customer_id: asaasCustomer.id
  })
  .select()
  .single();

if (clienteError) {
  console.error('   ❌ Error:', clienteError.message);
  process.exit(1);
}

console.log(`   ✅ Client registered: ${cliente.id.substring(0, 13)}...`);
console.log();

// =============================================================================
// STEP 4: Create Payment in Asaas
// =============================================================================

console.log('💳 STEP 4: Creating payment in Asaas...\n');

const dueDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

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
    dueDate: dueDate,
    description: 'Plano Pro - CLOUD TEST - Primeira Mensalidade'
  })
});

const payment = await paymentResponse.json();

if (payment.errors) {
  console.error('   ❌ Error:', payment.errors);
  process.exit(1);
}

console.log(`   ✅ Payment created: ${payment.id}`);
console.log(`      Value: R$ ${payment.value}`);
console.log(`      Due: ${payment.dueDate}`);
console.log();

// Save complete scenario data
await fs.writeFile('cloud-scenario-data.json', JSON.stringify({
  users: scenarioData.users,
  contadores: {
    carlos: { user_id: carlos.id, contador_id: carlosContadorId },
    maria: { user_id: maria.id, contador_id: mariaContadorId },
    joao: { user_id: joao.id, contador_id: joaoContadorId }
  },
  cliente: {
    id: cliente.id,
    asaas_customer_id: asaasCustomer.id,
    nome: cliente.nome_empresa
  },
  payment: {
    id: payment.id,
    value: payment.value,
    status: payment.status,
    dueDate: payment.dueDate
  }
}, null, 2));

console.log('═══════════════════════════════════════════════════════════════');
console.log('✅ CLOUD E2E SETUP COMPLETE!');
console.log('═══════════════════════════════════════════════════════════════');
console.log();
console.log('📊 CREATED IN CLOUD:');
console.log();
console.log('  🌳 Network: Carlos (Diamante) → Maria (Ouro) → João (Bronze)');
console.log(`  🏢 Client: Padaria Cloud Test Ltda`);
console.log(`  💳 Payment: ${payment.id}`);
console.log(`  💰 Value: R$ 299.90`);
console.log();
console.log('═══════════════════════════════════════════════════════════════');
console.log();
console.log('📝 NEXT: SIMULATE PAYMENT IN ASAAS SANDBOX');
console.log();
console.log('  1. Go to: https://sandbox.asaas.com/login');
console.log('  2. Navigate: Cobranças → Localizar');
console.log(`  3. Search: ${payment.id}`);
console.log('  4. Click: "Simular Pagamento"');
console.log('  5. Webhook will be sent to CLOUD automatically!');
console.log();
console.log('  ⚡ Webhook URL: https://zytxwdgzjqrcmbnpgofj.supabase.co/functions/v1/webhook-asaas');
console.log();
console.log('═══════════════════════════════════════════════════════════════');
console.log();
console.log('🔍 After simulating payment, check commissions:');
console.log('   • Supabase Dashboard: https://supabase.com/dashboard/project/zytxwdgzjqrcmbnpgofj/editor');
console.log('   • Table: comissoes');
console.log('   • Table: pagamentos');
console.log();
console.log('💾 All data saved to: cloud-scenario-data.json');
console.log();
