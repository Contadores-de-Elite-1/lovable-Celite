#!/usr/bin/env node

/**
 * CRIAR CLIENTE NO ASAAS E SUPABASE CLOUD
 * Script para resolver erro do webhook
 */

import { createClient } from '@supabase/supabase-js';

// Credenciais do Cloud (de .env.claude)
const SUPABASE_URL = 'https://zytxwdgzjqrcmbnpgofj.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5dHh3ZGd6anFyY21ibnBnb2ZqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDk4NjY0MiwiZXhwIjoyMDc2NTYyNjQyfQ.uC4X8zC-XtPNfQC0m7aKEoYO8DtCtbT4kZ67QGI-1A4';
const ASAAS_API_KEY = '$aact_hmlg_000MzkwODA2MWY2OGM3MWRlMDU2NWM3MzJlNzZmNGZhZGY6Ojg5NGI4NmYzLWQxYmUtNDkwYy05ZWMwLTM5ZTFhZGUwYWM2MDo6JGFhY2hfNDNkMWQ3N2YtNTEzOS00NmU3LWE4NzAtMzU0Y2Q1ZWEyYTA4';
const ASAAS_API_URL = 'https://sandbox.asaas.com/api/v3';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

console.log('🚀 CRIANDO CLIENTE NO CLOUD...\n');

// 1. Buscar ou criar um contador para vincular o cliente
console.log('🔍 Buscando contador para vincular cliente...\n');

let { data: contadores, error: contadorError } = await supabase
  .from('contadores')
  .select('id, user_id')
  .limit(1);

let contador;

if (contadorError || !contadores || contadores.length === 0) {
  console.log('   ⚠️  Nenhum contador encontrado. Criando contador de teste...\n');

  // Buscar um usuário existente
  const { data: users, error: userError } = await supabase.auth.admin.listUsers();

  if (userError || !users || users.users.length === 0) {
    console.error('❌ Nenhum usuário encontrado!');
    console.error('   Não é possível criar contador sem usuário.');
    process.exit(1);
  }

  const user = users.users[0];
  console.log(`   📝 Usando usuário: ${user.email}\n`);

  // Criar contador
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

// 2. Criar cliente no ASAAS
console.log('🏢 Criando cliente no ASAAS Sandbox...\n');

const customerResponse = await fetch(`${ASAAS_API_URL}/customers`, {
  method: 'POST',
  headers: {
    'accept': 'application/json',
    'content-type': 'application/json',
    'access_token': ASAAS_API_KEY
  },
  body: JSON.stringify({
    name: 'Empresa Teste Webhook',
    email: 'teste-webhook@empresa.com',
    cpfCnpj: '12345678000199',
    phone: '11999999999',
    observation: 'Cliente criado para teste de webhook'
  })
});

const asaasCustomer = await customerResponse.json();

if (asaasCustomer.errors) {
  console.error('❌ Erro ao criar cliente no ASAAS:');
  console.error(JSON.stringify(asaasCustomer.errors, null, 2));
  process.exit(1);
}

console.log('   ✅ Cliente criado no ASAAS!');
console.log(`      ID: ${asaasCustomer.id}`);
console.log(`      Nome: ${asaasCustomer.name}\n`);

// 3. Registrar cliente no Supabase
console.log('💾 Registrando cliente no Supabase Cloud...\n');

const { data: cliente, error: clienteError } = await supabase
  .from('clientes')
  .insert({
    contador_id: contador.id,
    nome_empresa: 'Empresa Teste Webhook',
    cnpj: '12345678000199',
    contato_email: 'teste-webhook@empresa.com',
    contato_telefone: '11999999999',
    status: 'lead',
    plano: 'profissional',
    valor_mensal: 299.90,
    asaas_customer_id: asaasCustomer.id
  })
  .select()
  .single();

if (clienteError) {
  console.error('❌ Erro ao registrar cliente no Supabase:');
  console.error(clienteError.message);
  process.exit(1);
}

console.log('   ✅ Cliente registrado no Supabase!');
console.log(`      ID Database: ${cliente.id}`);
console.log(`      ASAAS Customer ID: ${cliente.asaas_customer_id}`);
console.log(`      Status: ${cliente.status}`);
console.log(`      Valor: R$ ${cliente.valor_mensal}\n`);

console.log('═══════════════════════════════════════════════════════════════');
console.log('✅ CLIENTE CRIADO COM SUCESSO!');
console.log('═══════════════════════════════════════════════════════════════');
console.log();
console.log('📊 DADOS PARA TESTE:');
console.log();
console.log(`  ASAAS Customer ID: ${asaasCustomer.id}`);
console.log(`  Database ID: ${cliente.id}`);
console.log('  Nome: Empresa Teste Webhook');
console.log('  Valor: R$ 299,90');
console.log();
console.log('🎯 Agora você pode testar o webhook com este cliente!');
console.log();
