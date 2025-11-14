#!/usr/bin/env node

/**
 * CONFIGURAR WEBHOOK DO ASAAS
 * Script para criar/atualizar webhook via API
 *
 * Baseado em: https://docs.asaas.com/docs/criar-novo-webhook-pela-api
 */

const ASAAS_API_KEY = '$aact_hmlg_000MzkwODA2MWY2OGM3MWRlMDU2NWM3MzJlNzZmNGZhZGY6Ojg5NGI4NmYzLWQxYmUtNDkwYy05ZWMwLTM5ZTFhZGUwYWM2MDo6JGFhY2hfNDNkMWQ3N2YtNTEzOS00NmU3LWE4NzAtMzU0Y2Q1ZWEyYTA4';
const ASAAS_API_URL = 'https://sandbox.asaas.com/api/v3';

console.log('🔗 CONFIGURANDO WEBHOOK DO ASAAS...\n');

// 1. Listar webhooks existentes
console.log('📋 Verificando webhooks existentes...\n');

const listResponse = await fetch(`${ASAAS_API_URL}/webhooks`, {
  method: 'GET',
  headers: {
    'accept': 'application/json',
    'access_token': ASAAS_API_KEY
  }
});

const existingWebhooks = await listResponse.json();

if (existingWebhooks.data && existingWebhooks.data.length > 0) {
  console.log(`   ℹ️  Encontrados ${existingWebhooks.data.length} webhook(s) existente(s):\n`);

  for (const webhook of existingWebhooks.data) {
    console.log(`   - ID: ${webhook.id}`);
    console.log(`     URL: ${webhook.url}`);
    console.log(`     Status: ${webhook.enabled ? '✅ Ativo' : '❌ Inativo'}`);
    console.log(`     Eventos: ${webhook.events?.length || 0}`);
    console.log();
  }
} else {
  console.log('   ℹ️  Nenhum webhook configurado ainda.\n');
}

// 2. Criar novo webhook
console.log('🆕 Criando novo webhook...\n');

const webhookConfig = {
  name: 'Webhook Contadores de Elite - Sandbox',
  url: 'https://zytxwdgzjqrcmbnpgofj.supabase.co/functions/v1/webhook-asaas',
  email: 'dev@contadoresdeelite.com',
  apiVersion: 3,
  enabled: true,
  interrupted: false,
  // Eventos de pagamento (principais para o sistema de comissões)
  events: [
    'PAYMENT_CREATED',           // Nova cobrança gerada
    'PAYMENT_UPDATED',           // Alteração em vencimento/valor
    'PAYMENT_CONFIRMED',         // Pagamento confirmado ⭐ PRINCIPAL
    'PAYMENT_RECEIVED',          // Pagamento recebido ⭐ PRINCIPAL
    'PAYMENT_OVERDUE',           // Pagamento vencido
    'PAYMENT_DELETED',           // Cobrança removida
    'PAYMENT_RESTORED',          // Cobrança restaurada
    'PAYMENT_REFUNDED',          // Pagamento estornado
    'PAYMENT_RECEIVED_IN_CASH_UNDONE', // Confirmação desfeita
    'PAYMENT_CHARGEBACK_REQUESTED',    // Chargeback solicitado
    'PAYMENT_CHARGEBACK_DISPUTE',      // Contestação de chargeback
    'PAYMENT_AWAITING_CHARGEBACK_REVERSAL', // Aguardando reversão
    'PAYMENT_DUNNING_RECEIVED',   // Pagamento de negativação recebido
    'PAYMENT_DUNNING_REQUESTED',  // Negativação solicitada
    'PAYMENT_BANK_SLIP_VIEWED',   // Boleto visualizado
    'PAYMENT_CHECKOUT_VIEWED'     // Checkout visualizado
  ],
  sendType: 'SEQUENTIALLY'  // Enviar eventos sequencialmente
};

console.log('   Configuração:');
console.log(`   - URL: ${webhookConfig.url}`);
console.log(`   - Eventos: ${webhookConfig.events.length}`);
console.log(`   - API Version: ${webhookConfig.apiVersion}`);
console.log();

const createResponse = await fetch(`${ASAAS_API_URL}/webhooks`, {
  method: 'POST',
  headers: {
    'accept': 'application/json',
    'content-type': 'application/json',
    'access_token': ASAAS_API_KEY
  },
  body: JSON.stringify(webhookConfig)
});

const newWebhook = await createResponse.json();

if (newWebhook.errors) {
  console.error('❌ Erro ao criar webhook:');
  console.error(JSON.stringify(newWebhook.errors, null, 2));

  // Se erro for "já existe", mostrar como atualizar
  if (JSON.stringify(newWebhook.errors).includes('já existe') ||
      JSON.stringify(newWebhook.errors).includes('already exists')) {
    console.log('\n💡 SOLUÇÃO: Webhook já existe!');
    console.log('   Para atualizar, use o ID do webhook existente:');
    if (existingWebhooks.data && existingWebhooks.data.length > 0) {
      const webhookId = existingWebhooks.data[0].id;
      console.log(`\n   curl -X PUT ${ASAAS_API_URL}/webhooks/${webhookId} \\`);
      console.log(`     -H "access_token: SEU_TOKEN" \\`);
      console.log(`     -H "content-type: application/json" \\`);
      console.log(`     -d @webhook-config.json`);
    }
  }

  process.exit(1);
}

console.log('═══════════════════════════════════════════════════════════════');
console.log('✅ WEBHOOK CONFIGURADO COM SUCESSO!');
console.log('═══════════════════════════════════════════════════════════════');
console.log();
console.log('📊 DADOS DO WEBHOOK:');
console.log();
console.log(`  ID: ${newWebhook.id}`);
console.log(`  URL: ${newWebhook.url}`);
console.log(`  Status: ${newWebhook.enabled ? '✅ Ativo' : '❌ Inativo'}`);
console.log(`  API Version: ${newWebhook.apiVersion}`);
console.log(`  Eventos: ${newWebhook.events?.length || 0}`);
console.log();
console.log('═══════════════════════════════════════════════════════════════');
console.log();
console.log('🎯 PRÓXIMOS PASSOS:');
console.log();
console.log('1. Teste o webhook criando um pagamento:');
console.log('   node test-baby-step-3-create-payment.mjs');
console.log();
console.log('2. Monitore os logs no Supabase:');
console.log('   Tabela: audit_logs');
console.log('   Filtro: acao LIKE \'%WEBHOOK%\'');
console.log();
console.log('3. Verifique comissões calculadas:');
console.log('   node test-baby-step-4-check-commissions.mjs');
console.log();
