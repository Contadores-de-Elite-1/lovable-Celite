#!/usr/bin/env node

import fs from 'fs/promises';
import { createClient } from '@supabase/supabase-js';

const ASAAS_API_KEY = '$aact_hmlg_000MzkwODA2MWY2OGM3MWRlMDU2NWM3MzJlNzZmNGZhZGY6Ojg5NGI4NmYzLWQxYmUtNDkwYy05ZWMwLTM5ZTFhZGUwYWM2MDo6JGFhY2hfNDNkMWQ3N2YtNTEzOS00NmU3LWE4NzAtMzU0Y2Q1ZWEyYTA4';
const ASAAS_API_URL = 'https://sandbox.asaas.com/api/v3';

console.log('🚀 Simulando pagamento automaticamente\n');
console.log('═══════════════════════════════════════════════════════════════\n');

const testData = JSON.parse(await fs.readFile('e2e-new-test.json', 'utf-8'));
const paymentId = testData.payment.id;

console.log(`💳 Payment ID: ${paymentId}\n`);

try {
  console.log('⏳ Simulando recebimento em dinheiro...\n');

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
    console.log('⏳ Aguardando 2 segundos para webhook processar...\n');

    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log('Verificando resultado...\n');

    const supabase = createClient(
      'https://zytxwdgzjqrcmbnpgofj.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5dHh3ZGd6anFyY21ibnBnb2ZqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDk4NjY0MiwiZXhwIjoyMDc2NTYyNjQyfQ.uC4X8zC-XtPNfQC0m7aKEoYO8DtCtbT4kZ67QGI-1A4'
    );

    const { data: pag } = await supabase
      .from('pagamentos')
      .select('*')
      .eq('asaas_payment_id', paymentId)
      .single();

    if (pag) {
      console.log('✅ PAGAMENTO REGISTRADO NO BANCO!');
      console.log(`   ID: ${pag.id.substring(0, 13)}...`);
      console.log(`   Valor Líquido: R$ ${pag.valor_liquido}`);
      console.log(`   Status: ${pag.status}`);
      console.log();

      const { data: com } = await supabase
        .from('comissoes')
        .select('*,contadores(nivel)')
        .eq('cliente_id', testData.cliente.id)
        .order('valor', { ascending: false });

      if (com && com.length > 0) {
        console.log(`✅ ${com.length} COMISSÃO(ÕES) CALCULADA(S)!\n`);
        let total = 0;
        for (const c of com) {
          console.log(`📊 ${c.contadores.nivel.toUpperCase()}`);
          console.log(`   Valor: R$ ${c.valor}`);
          console.log(`   Tipo: ${c.tipo_comissao}\n`);
          total += parseFloat(c.valor);
        }
        console.log(`💰 TOTAL: R$ ${total.toFixed(2)}`);
      } else {
        console.log('⚠️  Nenhuma comissão calculada ainda');
      }
    } else {
      console.log('⚠️  Pagamento não registrado ainda');
    }

  } else {
    console.error('❌ Erro:', result.errors || result);
  }

} catch (error) {
  console.error('❌ Erro:', error.message);
}
