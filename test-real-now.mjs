#!/usr/bin/env node

/**
 * TESTE REAL COMPLETO - DO ZERO
 * Cria tudo e testa webhook AGORA
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zytxwdgzjqrcmbnpgofj.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5dHh3ZGd6anFyY21ibnBnb2ZqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDk4NjY0MiwiZXhwIjoyMDc2NTYyNjQyfQ.uC4X8zC-XtPNfQC0m7aKEoYO8DtCtbT4kZ67QGI-1A4';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const ASAAS_API_KEY = '$aact_hmlg_000MzkwODA2MWY2OGM3MWRlMDU2NWM3MzJlNzZmNGZhZGY6Ojg5NGI4NmYzLWQxYmUtNDkwYy05ZWMwLTM5ZTFhZGUwYWM2MDo6JGFhY2hfNDNkMWQ3N2YtNTEzOS00NmU3LWE4NzAtMzU0Y2Q1ZWEyYTA4';
const ASAAS_API_URL = 'https://sandbox.asaas.com/api/v3';

console.log('🤖 TESTE REAL COMPLETO - MODO ROBÔ NÍVEL 4\n');
console.log('═══════════════════════════════════════════════════════════════\n');

// STEP 1: Criar contador
console.log('👤 STEP 1: Criando contador...\n');

const timestamp = Date.now();
const email = `contador.teste.${timestamp}@teste.com`;

const { data: user, error: userError } = await supabase.auth.admin.createUser({
  email: email,
  email_confirm: true,
  user_metadata: {
    nome: 'Teste Contador',
    cpf: '12345678901'
  }
});

if (userError) {
  console.error('❌ Erro ao criar usuário:', userError.message);
  process.exit(1);
}

console.log(`✅ Usuário criado: ${user.user.id.substring(0, 13)}...`);

const { data: contador, error: contadorError } = await supabase
  .from('contadores')
  .insert({
    user_id: user.user.id,
    nivel: 'bronze',
    status: 'ativo',
    clientes_ativos: 0,
    xp: 0
  })
  .select()
  .single();

if (contadorError) {
  console.error('❌ Erro ao criar contador:', contadorError.message);
  process.exit(1);
}

console.log(`✅ Contador criado: ${contador.id.substring(0, 13)}...\n`);

// STEP 2: Criar cliente no ASAAS
console.log('🏢 STEP 2: Criando cliente no ASAAS...\n');

const customerResponse = await fetch(`${ASAAS_API_URL}/customers`, {
  method: 'POST',
  headers: {
    'accept': 'application/json',
    'content-type': 'application/json',
    'access_token': ASAAS_API_KEY
  },
  body: JSON.stringify({
    name: `Empresa Teste Real ${timestamp}`,
    email: `empresa${timestamp}@teste.com`,
    cpfCnpj: '34028316000103',
    phone: '11987654321'
  })
});

const asaasCustomer = await customerResponse.json();

if (asaasCustomer.errors) {
  console.error('❌ Erro ASAAS:', asaasCustomer.errors);
  process.exit(1);
}

console.log(`✅ Cliente ASAAS criado: ${asaasCustomer.id}\n`);

// STEP 3: Criar cliente no banco
console.log('💾 STEP 3: Criando cliente no banco...\n');

const { data: cliente, error: clienteError } = await supabase
  .from('clientes')
  .insert({
    contador_id: contador.id,
    nome_empresa: `Empresa Teste Real ${timestamp}`,
    cnpj: '34028316000103',
    contato_email: `empresa${timestamp}@teste.com`,
    contato_telefone: '11987654321',
    status: 'lead',
    plano: 'profissional',
    valor_mensal: 199.90,
    asaas_customer_id: asaasCustomer.id
  })
  .select()
  .single();

if (clienteError) {
  console.error('❌ Erro ao criar cliente:', clienteError.message);
  process.exit(1);
}

console.log(`✅ Cliente criado: ${cliente.id.substring(0, 13)}...\n`);

// STEP 4: Simular webhook
console.log('📤 STEP 4: Simulando webhook ASAAS...\n');

const paymentId = `pay_test_${timestamp}`;
const eventId = `evt_test_${timestamp}`;

const payload = {
  event: 'PAYMENT_RECEIVED',
  payment: {
    id: paymentId,
    customer: asaasCustomer.id,
    value: 199.90,
    netValue: 197.90,
    dateCreated: new Date().toISOString(),
    confirmedDate: new Date().toISOString(),
    status: 'RECEIVED',
    billingType: 'PIX'
  }
};

console.log(`   Payment ID: ${paymentId}`);
console.log(`   Customer ID: ${asaasCustomer.id}`);
console.log(`   Valor: R$ 199.90\n`);

const webhookUrl = 'https://zytxwdgzjqrcmbnpgofj.supabase.co/functions/v1/webhook-asaas';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5dHh3ZGd6anFyY21ibnBnb2ZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5ODY2NDIsImV4cCI6MjA3NjU2MjY0Mn0.c4dWvVVvWpN2t2JBBwTm4lv_3mYy0uOTYPq9UKFgQlE';

console.log('🚀 Enviando webhook...\n');

try {
  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${anonKey}`
    },
    body: JSON.stringify(payload)
  });

  const result = await response.json();

  console.log(`📊 Resposta HTTP: ${response.status}\n`);

  if (response.ok) {
    console.log('✅ WEBHOOK PROCESSADO COM SUCESSO!\n');
    console.log(JSON.stringify(result, null, 2));
    console.log();

    // Aguardar processamento
    console.log('⏳ Aguardando 3 segundos...\n');
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Verificar pagamento
    const { data: pag } = await supabase
      .from('pagamentos')
      .select('*')
      .eq('asaas_payment_id', paymentId)
      .single();

    if (pag) {
      console.log('✅ PAGAMENTO REGISTRADO NO BANCO!');
      console.log(`   ID: ${pag.id.substring(0, 13)}...`);
      console.log(`   Valor Bruto: R$ ${pag.valor_bruto}`);
      console.log(`   Valor Líquido: R$ ${pag.valor_liquido}`);
      console.log(`   Status: ${pag.status}`);
      console.log(`   Tipo: ${pag.tipo}\n`);
    } else {
      console.log('❌ PAGAMENTO NÃO FOI REGISTRADO\n');
    }

    // Verificar comissões
    const { data: comissoes } = await supabase
      .from('comissoes')
      .select('*')
      .eq('cliente_id', cliente.id);

    if (comissoes && comissoes.length > 0) {
      console.log(`✅ ${comissoes.length} COMISSÃO(ÕES) CALCULADA(S)!\n`);
      let total = 0;
      for (const c of comissoes) {
        console.log(`📊 ${c.tipo_comissao.toUpperCase()}`);
        console.log(`   Contador: ${c.contador_id.substring(0, 13)}...`);
        console.log(`   Valor: R$ ${c.valor}`);
        console.log(`   Status: ${c.status}`);
        console.log(`   Aprovada? ${c.status === 'aprovada' ? '✅ SIM' : '❌ NÃO'}\n`);
        total += parseFloat(c.valor);
      }
      console.log(`💰 TOTAL COMISSÕES: R$ ${total.toFixed(2)}\n`);
    } else {
      console.log('❌ NENHUMA COMISSÃO FOI CALCULADA\n');
    }

    // Verificar audit logs
    const { data: logs } = await supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    if (logs && logs.length > 0) {
      console.log('📋 ÚLTIMOS 5 AUDIT LOGS:\n');
      for (const log of logs) {
        const timestamp = new Date(log.created_at).toLocaleTimeString();
        console.log(`   [${timestamp}] ${log.acao}`);
      }
      console.log();
    }

  } else {
    console.log('❌ WEBHOOK FALHOU!\n');
    console.log(JSON.stringify(result, null, 2));
    console.log();
  }

} catch (error) {
  console.error('❌ ERRO AO CHAMAR WEBHOOK:', error.message);
  console.error(error.stack);
}

console.log('═══════════════════════════════════════════════════════════════');
console.log('✅ TESTE COMPLETO FINALIZADO');
console.log('═══════════════════════════════════════════════════════════════');
