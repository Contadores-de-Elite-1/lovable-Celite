#!/usr/bin/env node

/**
 * BABY STEP 3: Criar Cobrança (Pagamento) no Asaas Sandbox
 */

import fs from 'fs/promises';

const ASAAS_API_KEY = '$aact_hmlg_000MzkwODA2MWY2OGM3MWRlMDU2NWM3MzJlNzZmNGZhZGY6Ojg5NGI4NmYzLWQxYmUtNDkwYy05ZWMwLTM5ZTFhZGUwYWM2MDo6JGFhY2hfNDNkMWQ3N2YtNTEzOS00NmU3LWE4NzAtMzU0Y2Q1ZWEyYTA4';
const ASAAS_API_URL = 'https://sandbox.asaas.com/api/v3';

console.log('🎯 BABY STEP 3: Criar Cobrança no Asaas Sandbox\n');

// Carregar IDs do cenário anterior
let scenarioData;
try {
  const data = await fs.readFile('scenario-data.json', 'utf-8');
  scenarioData = JSON.parse(data);
} catch (err) {
  console.error('❌ Erro ao carregar scenario-data.json');
  console.error('   Execute primeiro: node test-baby-step-2-create-customer-asaas.mjs');
  process.exit(1);
}

const asaasCustomerId = scenarioData.cliente.asaas_customer_id;
const valorMensal = scenarioData.cliente.valor;

console.log('📖 Cobrança a ser criada:');
console.log(`   Cliente Asaas: ${asaasCustomerId}`);
console.log(`   Valor: R$ ${valorMensal}`);
console.log('   Tipo: BOLETO (sandbox)');
console.log('   Vencimento: Daqui 3 dias');
console.log();

// Calcular data de vencimento (3 dias a partir de hoje)
const dataVencimento = new Date();
dataVencimento.setDate(dataVencimento.getDate() + 3);
const dueDate = dataVencimento.toISOString().split('T')[0];

console.log('💳 Criando cobrança no Asaas...\n');

const paymentResponse = await fetch(`${ASAAS_API_URL}/payments`, {
  method: 'POST',
  headers: {
    'accept': 'application/json',
    'content-type': 'application/json',
    'access_token': ASAAS_API_KEY
  },
  body: JSON.stringify({
    customer: asaasCustomerId,
    billingType: 'BOLETO',
    value: valorMensal,
    dueDate: dueDate,
    description: 'Plano Profissional - Contadores de Elite - Primeira Mensalidade'
  })
});

const payment = await paymentResponse.json();

if (payment.errors) {
  console.error('❌ Erro ao criar cobrança:', payment.errors);
  process.exit(1);
}

console.log('   ✅ Cobrança criada com sucesso!');
console.log(`      Payment ID: ${payment.id}`);
console.log(`      Valor: R$ ${payment.value}`);
console.log(`      Status: ${payment.status}`);
console.log(`      Vencimento: ${payment.dueDate}`);

if (payment.bankSlipUrl) {
  console.log(`      Link Boleto: ${payment.bankSlipUrl}`);
}
if (payment.invoiceUrl) {
  console.log(`      Link Fatura: ${payment.invoiceUrl}`);
}

console.log();

// Atualizar scenario-data.json
scenarioData.payment = {
  id: payment.id,
  value: payment.value,
  status: payment.status,
  dueDate: payment.dueDate,
  bankSlipUrl: payment.bankSlipUrl,
  invoiceUrl: payment.invoiceUrl
};

await fs.writeFile('scenario-data.json', JSON.stringify(scenarioData, null, 2));

console.log('═══════════════════════════════════════════════════════════════');
console.log('✅ BABY STEP 3 CONCLUÍDO!');
console.log('═══════════════════════════════════════════════════════════════');
console.log();
console.log('📊 COBRANÇA CRIADA:');
console.log();
console.log(`  Payment ID: ${payment.id}`);
console.log(`  Valor: R$ ${payment.value}`);
console.log(`  Status: ${payment.status}`);
console.log(`  Vencimento: ${payment.dueDate}`);
console.log();
console.log('═══════════════════════════════════════════════════════════════');
console.log();
console.log('📝 PRÓXIMO PASSO - SIMULAR PAGAMENTO NO ASAAS:');
console.log();
console.log('  1. Acesse: https://sandbox.asaas.com/login');
console.log('  2. Vá em: Cobranças → Localizar cobrança');
console.log(`  3. Busque pelo ID: ${payment.id}`);
console.log('  4. Clique em: "Simular Pagamento"');
console.log('  5. Confirme a simulação');
console.log();
console.log('  ⚡ O Asaas vai enviar um webhook automaticamente para:');
console.log('     https://zytxwdgzjqrcmbnpgofj.supabase.co/functions/v1/webhook-asaas');
console.log();
console.log('  ⏱️  Aguarde 5-10 segundos após simular o pagamento');
console.log();
console.log('═══════════════════════════════════════════════════════════════');
console.log();
console.log('💾 Dados salvos em: scenario-data.json');
console.log();
console.log('🔍 Para verificar se o webhook funcionou, execute:');
console.log('   node test-baby-step-4-check-commissions.mjs');
console.log();
