#!/usr/bin/env node

/**
 * GERENCIAR WEBHOOKS DO ASAAS
 * Script para listar, visualizar e deletar webhooks
 *
 * Uso:
 *   node gerenciar-webhooks-asaas.mjs list
 *   node gerenciar-webhooks-asaas.mjs view WEBHOOK_ID
 *   node gerenciar-webhooks-asaas.mjs delete WEBHOOK_ID
 */

const ASAAS_API_KEY = '$aact_hmlg_000MzkwODA2MWY2OGM3MWRlMDU2NWM3MzJlNzZmNGZhZGY6Ojg5NGI4NmYzLWQxYmUtNDkwYy05ZWMwLTM5ZTFhZGUwYWM2MDo6JGFhY2hfNDNkMWQ3N2YtNTEzOS00NmU3LWE4NzAtMzU0Y2Q1ZWEyYTA4';
const ASAAS_API_URL = 'https://api-sandbox.asaas.com/v3';

const comando = process.argv[2];
const webhookId = process.argv[3];

if (!comando || !['list', 'view', 'delete'].includes(comando)) {
  console.log('❌ Uso incorreto!\n');
  console.log('Comandos disponíveis:');
  console.log('  node gerenciar-webhooks-asaas.mjs list');
  console.log('  node gerenciar-webhooks-asaas.mjs view WEBHOOK_ID');
  console.log('  node gerenciar-webhooks-asaas.mjs delete WEBHOOK_ID');
  process.exit(1);
}

// LISTAR TODOS OS WEBHOOKS
if (comando === 'list') {
  console.log('📋 LISTANDO WEBHOOKS...\n');

  const response = await fetch(`${ASAAS_API_URL}/webhooks`, {
    method: 'GET',
    headers: {
      'accept': 'application/json',
      'access_token': ASAAS_API_KEY
    }
  });

  const result = await response.json();

  if (result.errors) {
    console.error('❌ Erro ao listar webhooks:');
    console.error(JSON.stringify(result.errors, null, 2));
    process.exit(1);
  }

  if (!result.data || result.data.length === 0) {
    console.log('ℹ️  Nenhum webhook configurado.\n');
    console.log('💡 Para criar um webhook, execute:');
    console.log('   node configurar-webhook-asaas.mjs\n');
    process.exit(0);
  }

  console.log(`✅ Encontrados ${result.data.length} webhook(s):\n`);
  console.log('═══════════════════════════════════════════════════════════════');

  for (const webhook of result.data) {
    console.log();
    console.log(`📍 Webhook: ${webhook.name}`);
    console.log(`   ID: ${webhook.id}`);
    console.log(`   URL: ${webhook.url}`);
    console.log(`   Email: ${webhook.email}`);
    console.log(`   Status: ${webhook.enabled ? '✅ Ativo' : '❌ Inativo'}`);
    console.log(`   Fila: ${webhook.interrupted ? '⚠️ Interrompida' : '✅ Funcionando'}`);
    console.log(`   API Version: ${webhook.apiVersion}`);
    console.log(`   Send Type: ${webhook.sendType}`);
    console.log(`   Eventos: ${webhook.events?.length || 0}`);

    if (webhook.interrupted) {
      console.log('\n   ⚠️  ATENÇÃO: Fila de sincronização está INTERROMPIDA!');
      console.log('   Acesse: Minha Conta → Integração → Webhooks para reativar');
    }
  }

  console.log();
  console.log('═══════════════════════════════════════════════════════════════');
  console.log();
  console.log('💡 Para ver detalhes de um webhook:');
  console.log(`   node gerenciar-webhooks-asaas.mjs view ${result.data[0].id}`);
  console.log();
}

// VISUALIZAR WEBHOOK ESPECÍFICO
else if (comando === 'view') {
  if (!webhookId) {
    console.error('❌ Informe o ID do webhook!');
    console.error('   Uso: node gerenciar-webhooks-asaas.mjs view WEBHOOK_ID\n');
    process.exit(1);
  }

  console.log(`🔍 VISUALIZANDO WEBHOOK ${webhookId}...\n`);

  const response = await fetch(`${ASAAS_API_URL}/webhooks/${webhookId}`, {
    method: 'GET',
    headers: {
      'accept': 'application/json',
      'access_token': ASAAS_API_KEY
    }
  });

  const webhook = await response.json();

  if (webhook.errors) {
    console.error('❌ Erro ao visualizar webhook:');
    console.error(JSON.stringify(webhook.errors, null, 2));
    process.exit(1);
  }

  console.log('═══════════════════════════════════════════════════════════════');
  console.log('📊 DETALHES DO WEBHOOK');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log();
  console.log(`Nome: ${webhook.name}`);
  console.log(`ID: ${webhook.id}`);
  console.log(`URL: ${webhook.url}`);
  console.log(`Email: ${webhook.email}`);
  console.log(`Status: ${webhook.enabled ? '✅ Ativo' : '❌ Inativo'}`);
  console.log(`Fila: ${webhook.interrupted ? '⚠️ Interrompida' : '✅ Funcionando'}`);
  console.log(`API Version: ${webhook.apiVersion}`);
  console.log(`Auth Token: ${webhook.authToken ? '🔐 Configurado' : '❌ Não configurado'}`);
  console.log(`Send Type: ${webhook.sendType}`);
  console.log();
  console.log(`📋 Eventos Configurados (${webhook.events?.length || 0}):`);
  console.log();

  if (webhook.events && webhook.events.length > 0) {
    webhook.events.forEach((event, index) => {
      console.log(`   ${index + 1}. ${event}`);
    });
  }

  console.log();
  console.log('═══════════════════════════════════════════════════════════════');

  if (webhook.interrupted) {
    console.log();
    console.log('⚠️  ATENÇÃO: FILA DE SINCRONIZAÇÃO INTERROMPIDA!');
    console.log();
    console.log('Isso significa que:');
    console.log('  • Eventos estão sendo gerados mas NÃO enviados');
    console.log('  • Você tem 14 dias antes de perder eventos');
    console.log('  • Corrija o endpoint e reative a fila');
    console.log();
    console.log('Como resolver:');
    console.log('  1. Acesse: Minha Conta → Integração → Webhooks');
    console.log('  2. Reative a fila de sincronização');
    console.log('  3. Eventos pendentes serão enviados em ordem');
    console.log();
  }

  console.log();
}

// DELETAR WEBHOOK
else if (comando === 'delete') {
  if (!webhookId) {
    console.error('❌ Informe o ID do webhook!');
    console.error('   Uso: node gerenciar-webhooks-asaas.mjs delete WEBHOOK_ID\n');
    process.exit(1);
  }

  console.log(`🗑️  DELETANDO WEBHOOK ${webhookId}...\n`);
  console.log('⚠️  Esta ação é PERMANENTE!\n');

  const response = await fetch(`${ASAAS_API_URL}/webhooks/${webhookId}`, {
    method: 'DELETE',
    headers: {
      'accept': 'application/json',
      'access_token': ASAAS_API_KEY
    }
  });

  if (response.status === 200 || response.status === 204) {
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('✅ WEBHOOK DELETADO COM SUCESSO!');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log();
    console.log(`Webhook ${webhookId} foi removido permanentemente.`);
    console.log();
    console.log('💡 Para criar um novo webhook:');
    console.log('   node configurar-webhook-asaas.mjs');
    console.log();
  } else {
    const result = await response.json();
    console.error('❌ Erro ao deletar webhook:');
    console.error(JSON.stringify(result, null, 2));
    process.exit(1);
  }
}
