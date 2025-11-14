#!/usr/bin/env node

import fs from 'fs/promises';

const WEBHOOK_URL = 'https://zytxwdgzjqrcmbnpgofj.supabase.co/functions/v1/webhook-asaas';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5dHh3ZGd6anFyY21ibnBnb2ZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5ODY2NDIsImV4cCI6MjA3NjU2MjY0Mn0.c4dWvVVvWpN2t2JBBwTm4lv_3mYy0uOTYPq9UKFgQlE';

const testData = JSON.parse(await fs.readFile('e2e-new-test.json', 'utf-8'));

const paymentId = testData.payment.id;
const customerId = testData.cliente.asaas_customer_id;

console.log('🚀 Disparando webhook manualmente\n');
console.log('═══════════════════════════════════════════════════════════════\n');
console.log(`💳 Payment ID: ${paymentId}`);
console.log(`👤 Customer ID: ${customerId}\n`);

// Construct the payload exactly as Asaas would send it
const payload = {
  event: 'PAYMENT_CONFIRMED',
  payment: {
    id: paymentId,
    customer: customerId,
    value: testData.payment.value,
    netValue: testData.payment.value - (testData.payment.value * 0.01), // minus 1% fee
    dateCreated: new Date().toISOString(),
    confirmedDate: new Date().toISOString(),
    status: 'RECEIVED',
    billingType: 'BOLETO'
  }
};

console.log('📤 Payload being sent:');
console.log(JSON.stringify(payload, null, 2));
console.log('\n');

try {
  console.log('⏳ Enviando para webhook...\n');

  const response = await fetch(WEBHOOK_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'x-asaas-webhook-signature': 'test-signature'
    },
    body: JSON.stringify(payload)
  });

  const result = await response.json();

  console.log(`📥 Webhook Response (HTTP ${response.status}):`);
  console.log(JSON.stringify(result, null, 2));
  console.log();

  if (response.ok) {
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('⏳ Aguardando 2 segundos para webhook processar...\n');

    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log('Verificando resultado no banco de dados...\n');

    // Import here to avoid top-level await issues in some setups
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      'https://zytxwdgzjqrcmbnpgofj.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5dHh3ZGd6anFyY21ibnBnb2ZqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDk4NjY0MiwiZXhwIjoyMDc2NTYyNjQyfQ.uC4X8zC-XtPNfQC0m7aKEoYO8DtCtbT4kZ67QGI-1A4'
    );

    const { data: pag, error: pagError } = await supabase
      .from('pagamentos')
      .select('*')
      .eq('asaas_payment_id', paymentId)
      .single();

    if (pagError) {
      console.log('⚠️  Payment not found yet:', pagError.message);
    } else if (pag) {
      console.log('✅ PAGAMENTO REGISTRADO NO BANCO!');
      console.log(`   ID: ${pag.id.substring(0, 13)}...`);
      console.log(`   Cliente ID: ${pag.cliente_id}`);
      console.log(`   Valor Bruto: R$ ${pag.valor_bruto}`);
      console.log(`   Valor Líquido: R$ ${pag.valor_liquido}`);
      console.log(`   Status: ${pag.status}`);
      console.log(`   Tipo: ${pag.tipo}`);
      console.log();

      const { data: com, error: comError } = await supabase
        .from('comissoes')
        .select('*,contadores(nivel,nome_empresa)')
        .eq('cliente_id', testData.cliente.id)
        .order('valor', { ascending: false });

      if (comError) {
        console.log('⚠️  Error fetching commissions:', comError.message);
      } else if (com && com.length > 0) {
        console.log(`✅ ${com.length} COMISSÃO(ÕES) CALCULADA(S)!\n`);
        let total = 0;
        for (const c of com) {
          console.log(`📊 ${c.contadores.nivel.toUpperCase()} - ${c.contadores.nome_empresa}`);
          console.log(`   Valor: R$ ${c.valor}`);
          console.log(`   Tipo: ${c.tipo_comissao}`);
          console.log(`   Status: ${c.status}\n`);
          total += parseFloat(c.valor);
        }
        console.log(`💰 TOTAL DE COMISSÕES: R$ ${total.toFixed(2)}`);
      } else {
        console.log('⚠️  Nenhuma comissão calculada ainda');
      }
    }
  }

} catch (error) {
  console.error('❌ Erro:', error.message);
  console.error(error.stack);
}
