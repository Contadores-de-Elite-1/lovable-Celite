#!/usr/bin/env node

import fs from 'fs/promises';

const ASAAS_API_KEY = '$aact_hmlg_000MzkwODA2MWY2OGM3MWRlMDU2NWM3MzJlNzZmNGZhZGY6Ojg5NGI4NmYzLWQxYmUtNDkwYy05ZWMwLTM5ZTFhZGUwYWM2MDo6JGFhY2hfNDNkMWQ3N2YtNTEzOS00NmU3LWE4NzAtMzU0Y2Q1ZWEyYTA4';
const ASAAS_API_URL = 'https://sandbox.asaas.com/api/v3';

console.log('🎯 Simulando pagamento no Asaas\n');
console.log('═══════════════════════════════════════════════════════════════\n');

const testData = JSON.parse(await fs.readFile('e2e-new-test.json', 'utf-8'));
const paymentId = testData.payment.id;

console.log(`💳 Payment ID: ${paymentId}\n`);

try {
  // Get payment details first
  console.log('📋 Obtendo detalhes do pagamento...\n');
  
  const getResponse = await fetch(`${ASAAS_API_URL}/payments/${paymentId}`, {
    method: 'GET',
    headers: {
      'accept': 'application/json',
      'access_token': ASAAS_API_KEY
    }
  });

  const payment = await getResponse.json();

  if (getResponse.status !== 200) {
    console.error('❌ Erro ao obter pagamento:', payment.errors);
    process.exit(1);
  }

  console.log(`✅ Pagamento encontrado`);
  console.log(`   Status: ${payment.status}`);
  console.log(`   Valor: R$ ${payment.value}`);
  console.log();

  // Simulate payment
  console.log('⏳ Simulando pagamento confirmado...\n');

  const simulateResponse = await fetch(`${ASAAS_API_URL}/payments/${paymentId}/receiveInCash`, {
    method: 'POST',
    headers: {
      'accept': 'application/json',
      'access_token': ASAAS_API_KEY
    }
  });

  const result = await simulateResponse.json();

  if (simulateResponse.status === 200) {
    console.log('✅ Pagamento simulado com sucesso!');
    console.log(`   Novo status: ${result.status}`);
    console.log();

    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('📝 WEBHOOK DISPARADO AUTOMATICAMENTE!\n');
    console.log('Aguarde alguns segundos para a função processar...\n');

    // Wait and check
    console.log('⏳ Aguardando 3 segundos...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    console.log('Verificando resultado...\n');

    import { createClient } from '@supabase/supabase-js';
    const supabase = createClient(
      'https://zytxwdgzjqrcmbnpgofj.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5dHh3ZGd6anFyY21ibnBnb2ZqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDk4NjY0MiwiZXhwIjoyMDc2NTYyNjQyfQ.uC4X8zC-XtPNfQC0m7aKEoYO8DtCtbT4kZ67QGI-1A4'
    );

    const { data: pagamentos } = await supabase
      .from('pagamentos')
      .select('*')
      .eq('asaas_payment_id', paymentId);

    if (pagamentos && pagamentos.length > 0) {
      console.log('✅ Pagamento registrado no banco!');
      console.log(`   ID: ${pagamentos[0].id.substring(0, 13)}...`);
      console.log(`   Status: ${pagamentos[0].status}`);
      console.log(`   Valor Líquido: R$ ${pagamentos[0].valor_liquido}`);
    } else {
      console.log('⚠️  Pagamento não apareceu no banco ainda');
      console.log('   Tente: node verify-new-payment.mjs');
    }

  } else {
    console.error('❌ Erro ao simular:', result.errors || result);
  }

} catch (error) {
  console.error('❌ Erro:', error.message);
}
