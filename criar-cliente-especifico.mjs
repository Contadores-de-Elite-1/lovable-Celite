#!/usr/bin/env node

/**
 * Criar cliente com ID específico do ASAAS
 * Este script busca ou cria cliente com customer ID que você já tem
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://zytxwdgzjqrcmbnpgofj.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5dHh3ZGd6anFyY21ibnBnb2ZqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDk4NjY0MiwiZXhwIjoyMDc2NTYyNjQyfQ.uC4X8zC-XtPNfQC0m7aKEoYO8DtCtbT4kZ67QGI-1A4';
const ASAAS_CUSTOMER_ID = 'cus_000007222335'; // ID que você está usando nos testes

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

console.log('🚀 CRIANDO/BUSCANDO CLIENTE NO SUPABASE...\n');
console.log(`   ASAAS Customer ID: ${ASAAS_CUSTOMER_ID}\n`);

// 1. Verificar se cliente já existe
console.log('🔍 Verificando se cliente já existe...\n');

const { data: clienteExistente } = await supabase
  .from('clientes')
  .select('*')
  .eq('asaas_customer_id', ASAAS_CUSTOMER_ID)
  .maybeSingle();

if (clienteExistente) {
  console.log('✅ Cliente JÁ EXISTE no banco!');
  console.log();
  console.log('📊 DADOS DO CLIENTE:');
  console.log(`   ID: ${clienteExistente.id}`);
  console.log(`   Nome: ${clienteExistente.nome_empresa}`);
  console.log(`   ASAAS ID: ${clienteExistente.asaas_customer_id}`);
  console.log(`   Status: ${clienteExistente.status}`);
  console.log(`   Contador ID: ${clienteExistente.contador_id}`);
  console.log();
  console.log('════════════════════════════════════════════════════════════════');
  console.log('✅ PRONTO PARA TESTAR!');
  console.log('════════════════════════════════════════════════════════════════');
  console.log();
  console.log('Teste novamente:');
  console.log(`curl -X POST https://zytxwdgzjqrcmbnpgofj.supabase.co/functions/v1/webhook-asaas \\`);
  console.log(`  -H "Content-Type: application/json" \\`);
  console.log(`  -d '{"id": "evt_test_$(date +%s)", "event": "PAYMENT_RECEIVED", "payment": {"id": "pay_test_$(date +%s)", "customer": "${ASAAS_CUSTOMER_ID}", "value": 199.90, "netValue": 197.90, "dateCreated": "$(date -u +%Y-%m-%dT%H:%M:%S.000Z)", "status": "RECEIVED", "billingType": "PIX"}}'`);
  console.log();
  process.exit(0);
}

console.log('ℹ️  Cliente NÃO existe. Criando...\n');

// 2. Buscar contador
let { data: contadores } = await supabase
  .from('contadores')
  .select('id, user_id')
  .limit(1);

let contador;

if (!contadores || contadores.length === 0) {
  console.log('⚠️  Nenhum contador encontrado. Criando contador de teste...\n');

  const { data: users } = await supabase.auth.admin.listUsers();

  if (!users || users.users.length === 0) {
    console.error('❌ Nenhum usuário encontrado!');
    process.exit(1);
  }

  const user = users.users[0];
  console.log(`   📝 Usando usuário: ${user.email}\n`);

  const { data: novoContador, error: criarError } = await supabase
    .from('contadores')
    .insert({
      user_id: user.id,
      nivel: 'bronze',
      status: 'ativo',
      xp: 0,
      clientes_ativos: 0
    })
    .select()
    .single();

  if (criarError) {
    console.error('❌ Erro ao criar contador:', criarError.message);
    process.exit(1);
  }

  contador = novoContador;
  console.log(`   ✅ Contador criado: ${contador.id.substring(0, 8)}...\n`);
} else {
  contador = contadores[0];
  console.log(`   ✅ Contador encontrado: ${contador.id.substring(0, 8)}...\n`);
}

// 3. Criar cliente no banco
console.log('💾 Criando cliente no Supabase...\n');

const { data: novoCliente, error: clienteError } = await supabase
  .from('clientes')
  .insert({
    contador_id: contador.id,
    nome_empresa: 'Cliente Teste Webhook',
    cnpj: '00000000000000',
    contato_email: 'teste@webhook.com',
    contato_telefone: '11999999999',
    status: 'ativo',  // Já ativo para testes
    plano: 'profissional',
    valor_mensal: 199.90,
    asaas_customer_id: ASAAS_CUSTOMER_ID,
    data_ativacao: new Date().toISOString()
  })
  .select()
  .single();

if (clienteError) {
  console.error('❌ Erro ao criar cliente:', clienteError.message);
  process.exit(1);
}

console.log('════════════════════════════════════════════════════════════════');
console.log('✅ CLIENTE CRIADO COM SUCESSO!');
console.log('════════════════════════════════════════════════════════════════');
console.log();
console.log('📊 DADOS DO CLIENTE:');
console.log();
console.log(`  ID: ${novoCliente.id}`);
console.log(`  Nome: ${novoCliente.nome_empresa}`);
console.log(`  ASAAS Customer ID: ${novoCliente.asaas_customer_id}`);
console.log(`  Status: ${novoCliente.status}`);
console.log(`  Valor: R$ ${novoCliente.valor_mensal}`);
console.log(`  Contador: ${contador.id.substring(0, 8)}...`);
console.log();
console.log('════════════════════════════════════════════════════════════════');
console.log();
console.log('🎯 TESTE O WEBHOOK AGORA:');
console.log();
console.log(`curl -X POST https://zytxwdgzjqrcmbnpgofj.supabase.co/functions/v1/webhook-asaas \\`);
console.log(`  -H "Content-Type: application/json" \\`);
console.log(`  -d '{"id": "evt_test_$(date +%s)", "event": "PAYMENT_RECEIVED", "payment": {"id": "pay_test_$(date +%s)", "customer": "${ASAAS_CUSTOMER_ID}", "value": 199.90, "netValue": 197.90, "dateCreated": "$(date -u +%Y-%m-%dT%H:%M:%S.000Z)", "status": "RECEIVED", "billingType": "PIX"}}'`);
console.log();
