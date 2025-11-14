#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://zytxwdgzjqrcmbnpgofj.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5dHh3ZGd6anFyY21ibnBnb2ZqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDk4NjY0MiwiZXhwIjoyMDc2NTYyNjQyfQ.uC4X8zC-XtPNfQC0m7aKEoYO8DtCtbT4kZ67QGI-1A4'
);

console.log('🎯 TESTE WEBHOOK COM NOVO PAGAMENTO\n');
console.log('═══════════════════════════════════════════════════════════════\n');

// Get the existing client from the test data
const { data: cliente } = await supabase
  .from('clientes')
  .select('*')
  .eq('asaas_customer_id', 'cus_000007222335')
  .single();

if (!cliente) {
  console.log('❌ Cliente não encontrado');
  process.exit(1);
}

console.log(`✅ Cliente encontrado: ${cliente.nome_empresa}`);
console.log(`   ID: ${cliente.id}`);
console.log(`   Contador: ${cliente.contador_id}\n`);

// Simulate a webhook call with a fresh payment ID
const freshPaymentId = `pay_fresh_${Date.now()}`;
const freshEventId = `event_fresh_${Date.now()}`;

console.log(`📤 Disparando webhook com novo pagamento\n`);
console.log(`   Payment ID: ${freshPaymentId}`);
console.log(`   Event ID: ${freshEventId}`);
console.log(`   Customer ID: cus_000007222335\n`);

const payload = {
  event: freshEventId,
  payment: {
    id: freshPaymentId,
    customer: 'cus_000007222335',
    value: 199.9,
    netValue: 197.9,
    dateCreated: new Date().toISOString(),
    confirmedDate: new Date().toISOString(),
    status: 'RECEIVED',
    billingType: 'BOLETO'
  }
};

const webhookUrl = 'https://zytxwdgzjqrcmbnpgofj.supabase.co/functions/v1/webhook-asaas';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5dHh3ZGd6anFyY21ibnBnb2ZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5ODY2NDIsImV4cCI6MjA3NjU2MjY0Mn0.c4dWvVVvWpN2t2JBBwTm4lv_3mYy0uOTYPq9UKFgQlE';

try {
  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${anonKey}`,
      'x-asaas-webhook-signature': 'test'
    },
    body: JSON.stringify(payload)
  });

  const result = await response.json();

  if (response.ok && result.success) {
    console.log(`✅ Webhook disparado com sucesso`);
    console.log(`   Pagamento ID retornado: ${result.pagamento_id}\n`);

    console.log('⏳ Aguardando 2 segundos para comissões calcularem...\n');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Check if payment was registered
    const { data: pag } = await supabase
      .from('pagamentos')
      .select('*')
      .eq('asaas_payment_id', freshPaymentId)
      .single();

    if (pag) {
      console.log('✅ PAGAMENTO REGISTRADO!');
      console.log(`   ID: ${pag.id.substring(0, 13)}...`);
      console.log(`   Valor Bruto: R$ ${pag.valor_bruto}`);
      console.log(`   Valor Líquido: R$ ${pag.valor_liquido}`);
      console.log(`   Status: ${pag.status}`);
      console.log(`   Tipo: ${pag.tipo}\n`);

      // Check commissions
      const { data: com } = await supabase
        .from('comissoes')
        .select('*')
        .eq('cliente_id', cliente.id)
        .order('created_at', { ascending: false });

      if (com && com.length > 0) {
        console.log(`✅ ${com.length} COMISSÃO(ÕES) REGISTRADA(S)!\n`);
        let total = 0;
        for (const c of com) {
          console.log(`📊 ${c.tipo_comissao.toUpperCase()}`);
          console.log(`   Valor: R$ ${c.valor}`);
          console.log(`   Status: ${c.status}\n`);
          total += parseFloat(c.valor);
        }
        console.log(`💰 TOTAL: R$ ${total.toFixed(2)}`);
      } else {
        console.log('⚠️  Nenhuma comissão calculada');
      }
    } else {
      console.log('⚠️  Pagamento não foi registrado no banco');
    }
  } else {
    console.log('❌ Webhook retornou erro:');
    console.log(JSON.stringify(result, null, 2));
  }
} catch (error) {
  console.error('❌ Erro:', error.message);
}
