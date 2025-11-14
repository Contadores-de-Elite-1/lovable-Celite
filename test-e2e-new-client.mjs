#!/usr/bin/env node

/**
 * E2E TEST - Create NEW client and payment for fresh webhook test
 * Creates: Customer in Asaas + Client in Supabase + Payment in Asaas
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs/promises';

const supabaseUrl = 'https://zytxwdgzjqrcmbnpgofj.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5dHh3ZGd6anFyY21ibnBnb2ZqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDk4NjY0MiwiZXhwIjoyMDc2NTYyNjQyfQ.uC4X8zC-XtPNfQC0m7aKEoYO8DtCtbT4kZ67QGI-1A4';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const ASAAS_API_KEY = '$aact_hmlg_000MzkwODA2MWY2OGM3MWRlMDU2NWM3MzJlNzZmNGZhZGY6Ojg5NGI4NmYzLWQxYmUtNDkwYy05ZWMwLTM5ZTFhZGUwYWM2MDo6JGFhY2hfNDNkMWQ3N2YtNTEzOS00NmU3LWE4NzAtMzU0Y2Q1ZWEyYTA4';
const ASAAS_API_URL = 'https://sandbox.asaas.com/api/v3';

console.log('🆕 E2E TEST - Create NEW Client + Payment\n');
console.log('═══════════════════════════════════════════════════════════════\n');

try {
  // Load existing users and contadores
  const scenarioData = JSON.parse(await fs.readFile('cloud-scenario-data.json', 'utf-8'));
  const joao = scenarioData.contadores.joao;

  console.log('📋 STEP 1: Creating NEW customer in Asaas\n');

  const timestamp = Date.now();
  const customerResponse = await fetch(`${ASAAS_API_URL}/customers`, {
    method: 'POST',
    headers: {
      'accept': 'application/json',
      'content-type': 'application/json',
      'access_token': ASAAS_API_KEY
    },
    body: JSON.stringify({
      name: `Restaurante Test ${timestamp}`,
      email: `restaurante-${timestamp}@teste.com`,
      cpfCnpj: '11222333000181',
      phone: '21987654321',
      observation: `Cliente E2E - João Bronze - Timestamp: ${timestamp}`
    })
  });

  const asaasCustomer = await customerResponse.json();

  if (asaasCustomer.errors) {
    console.error('❌ Error creating customer:', asaasCustomer.errors);
    process.exit(1);
  }

  console.log(`✅ Customer created: ${asaasCustomer.id}`);
  console.log(`   Name: ${asaasCustomer.name}`);
  console.log(`   Email: ${asaasCustomer.email}\n`);

  // Register in Supabase
  console.log('💾 STEP 2: Registering client in Supabase database\n');

  const { data: cliente, error: clienteError } = await supabase
    .from('clientes')
    .insert({
      contador_id: joao.contador_id,
      nome_empresa: asaasCustomer.name,
      cnpj: '11222333000181',
      contato_email: asaasCustomer.email,
      contato_telefone: '21987654321',
      status: 'lead',
      plano: 'profissional',
      valor_mensal: 299.90,
      asaas_customer_id: asaasCustomer.id
    })
    .select()
    .single();

  if (clienteError) {
    console.error('❌ Error registering client:', clienteError.message);
    process.exit(1);
  }

  console.log(`✅ Client registered: ${cliente.id.substring(0, 13)}...`);
  console.log(`   Contador: João Bronze\n`);

  // Create payment
  console.log('💳 STEP 3: Creating payment in Asaas\n');

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
      description: `E2E Test - Restaurante - ${timestamp}`
    })
  });

  const payment = await paymentResponse.json();

  if (payment.errors) {
    console.error('❌ Error creating payment:', payment.errors);
    process.exit(1);
  }

  console.log(`✅ Payment created: ${payment.id}`);
  console.log(`   Value: R$ ${payment.value}`);
  console.log(`   Due: ${payment.dueDate}\n`);

  // Save new scenario
  const newScenario = {
    timestamp,
    cliente: {
      id: cliente.id,
      asaas_customer_id: asaasCustomer.id,
      nome: asaasCustomer.name,
      email: asaasCustomer.email
    },
    payment: {
      id: payment.id,
      value: payment.value,
      status: payment.status,
      dueDate: payment.dueDate
    },
    contador: {
      id: joao.contador_id,
      nome: 'João Bronze'
    }
  };

  await fs.writeFile('e2e-new-test.json', JSON.stringify(newScenario, null, 2));

  console.log('═══════════════════════════════════════════════════════════════');
  console.log('✅ E2E TEST SETUP COMPLETE!\n');
  console.log('📊 NEW TEST DATA:\n');
  console.log(`  🏢 Customer: ${asaasCustomer.name}`);
  console.log(`  💰 Payment: ${payment.id}`);
  console.log(`  💵 Value: R$ ${payment.value}`);
  console.log(`  📧 Email: ${asaasCustomer.email}\n`);
  console.log('═══════════════════════════════════════════════════════════════\n');
  console.log('📝 NEXT STEPS:\n');
  console.log('1. Go to Asaas Sandbox: https://sandbox.asaas.com/login');
  console.log('2. Navigate: Cobranças → Localizar');
  console.log(`3. Search: ${payment.id}`);
  console.log('4. Click: "Simular Pagamento"');
  console.log('5. Webhook will process automatically!\n');
  console.log('🔍 Then verify results:');
  console.log('   node test-cloud-verify-results.mjs\n');
  console.log('💾 Saved to: e2e-new-test.json\n');

} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}
