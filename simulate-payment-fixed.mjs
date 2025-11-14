#!/usr/bin/env node

import fs from 'fs/promises';
import { createClient } from '@supabase/supabase-js';

const ASAAS_API_KEY = '$aact_hmlg_000MzkwODA2MWY2OGM3MWRlMDU2NWM3MzJlNzZmNGZhZGY6Ojg5NGI4NmYzLWQxYmUtNDkwYy05ZWMwLTM5ZTFhZGUwYWM2MDo6JGFhY2hfNDNkMWQ3N2YtNTEzOS00NmU3LWE4NzAtMzU0Y2Q1ZWEyYTA4';
const ASAAS_API_URL = 'https://sandbox.asaas.com/api/v3';

console.log('🎯 Simulando pagamento no Asaas\n');
console.log('═══════════════════════════════════════════════════════════════\n');

const testData = JSON.parse(await fs.readFile('e2e-new-test.json', 'utf-8'));
const paymentId = testData.payment.id;

console.log(`💳 Payment ID: ${paymentId}\n`);

try {
  const getResponse = await fetch(`${ASAAS_API_URL}/payments/${paymentId}`, {
    method: 'GET',
    headers: {
      'accept': 'application/json',
      'access_token': ASAAS_API_KEY
    }
  });

  const payment = await getResponse.json();

  if (getResponse.status !== 200) {
    console.error('❌ Erro:', payment.errors);
    process.exit(1);
  }

  console.log(`✅ Status atual: ${payment.status}`);
  console.log(`   Valor: R$ ${payment.value}\n`);

  console.log('⏳ Simulando confirmação...\n');

  const simulateResponse = await fetch(`${ASAAS_API_URL}/payments/${paymentId}/receiveInCash`, {
    method: 'POST',
    headers: {
      'accept': 'application/json',
      'access_token': ASAAS_API_KEY
    }
  });

  const result = await simulateResponse.json();

  if (simulateResponse.status === 200) {
    console.log('✅ Simulado com sucesso!');
    console.log(`   Novo status: ${result.status}\n`);
  } else {
    console.error('❌ Erro:', result.errors || result);
    process.exit(1);
  }

} catch (error) {
  console.error('❌ Erro:', error.message);
}
