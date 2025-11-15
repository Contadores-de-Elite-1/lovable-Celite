#!/usr/bin/env node

/**
 * TESTE #1 - Verificar e criar cliente automaticamente
 * Parte da Ordem de Serviço de Integração ASAAS x SUPABASE
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://zytxwdgzjqrcmbnpgofj.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5dHh3ZGd6anFyY21ibnBnb2ZqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDk4NjY0MiwiZXhwIjoyMDc2NTYyNjQyfQ.uC4X8zC-XtPNfQC0m7aKEoYO8DtCtbT4kZ67QGI-1A4';
const ASAAS_CUSTOMER_ID = 'cus_000007222099';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

console.log('═══════════════════════════════════════════════════════════');
console.log('TESTE #1 - VERIFICAÇÃO E CRIAÇÃO DE CLIENTE');
console.log('Data/Hora:', new Date().toISOString());
console.log('═══════════════════════════════════════════════════════════\n');

console.log(`🔍 Verificando se cliente existe: ${ASAAS_CUSTOMER_ID}\n`);

// 1. Verificar se cliente já existe
const { data: clienteExistente, error: erroConsulta } = await supabase
  .from('clientes')
  .select('id, contador_id, nome_empresa, asaas_customer_id, status, plano, valor_mensal, created_at')
  .eq('asaas_customer_id', ASAAS_CUSTOMER_ID)
  .maybeSingle();

if (erroConsulta) {
  console.error('❌ ERRO ao consultar cliente:', erroConsulta.message);
  console.log('\nDiagnóstico: Erro de acesso ao banco de dados');
  process.exit(1);
}

if (clienteExistente) {
  console.log('✅ CLIENTE JÁ EXISTE no banco!\n');
  console.log('📊 DADOS DO CLIENTE:');
  console.log(`   ID: ${clienteExistente.id}`);
  console.log(`   Nome: ${clienteExistente.nome_empresa}`);
  console.log(`   ASAAS ID: ${clienteExistente.asaas_customer_id}`);
  console.log(`   Status: ${clienteExistente.status}`);
  console.log(`   Plano: ${clienteExistente.plano}`);
  console.log(`   Valor Mensal: R$ ${clienteExistente.valor_mensal}`);
  console.log(`   Contador ID: ${clienteExistente.contador_id}`);
  console.log(`   Criado em: ${clienteExistente.created_at}`);
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('✅ TESTE #1 CONCLUÍDO - CLIENTE EXISTE');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('\nPróxima ação automática: TESTE #2 - Testar webhook com cliente válido\n');

  // Retornar JSON para parsing
  console.log('\n__JSON_RESULT__');
  console.log(JSON.stringify({
    success: true,
    clienteExiste: true,
    cliente: clienteExistente,
    mensagem: 'Cliente já existe, pronto para testes'
  }));

  process.exit(0);
}

console.log('⚠️  Cliente NÃO existe. Criando automaticamente...\n');

// 2. Buscar ou criar contador
console.log('🔍 Buscando contador disponível...\n');

let { data: contadores, error: erroContador } = await supabase
  .from('contadores')
  .select('id, user_id, nivel, status, clientes_ativos')
  .eq('status', 'ativo')
  .limit(1);

let contador;

if (!contadores || contadores.length === 0) {
  console.log('⚠️  Nenhum contador ativo encontrado. Criando contador de teste...\n');

  // Buscar primeiro usuário
  const { data: { users }, error: userError } = await supabase.auth.admin.listUsers();

  if (userError || !users || users.length === 0) {
    console.error('❌ Não foi possível encontrar usuários para criar contador');
    console.log('\nDiagnóstico: Sistema precisa de ao menos 1 usuário cadastrado');
    console.log('Ação necessária: Criar usuário manualmente via Supabase Dashboard\n');

    console.log('\n__JSON_RESULT__');
    console.log(JSON.stringify({
      success: false,
      erro: 'Nenhum usuário encontrado',
      mensagem: 'Necessário criar usuário via Dashboard'
    }));

    process.exit(1);
  }

  const user = users[0];
  console.log(`   ✓ Usando usuário: ${user.email || user.id}\n`);

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
    console.log('\nDiagnóstico: Falha ao inserir contador no banco');

    console.log('\n__JSON_RESULT__');
    console.log(JSON.stringify({
      success: false,
      erro: criarError.message,
      mensagem: 'Falha ao criar contador'
    }));

    process.exit(1);
  }

  contador = novoContador;
  console.log(`   ✅ Contador criado: ${contador.id}\n`);
} else {
  contador = contadores[0];
  console.log(`   ✅ Contador encontrado: ${contador.id}\n`);
}

// 3. Criar cliente no banco
console.log('💾 Criando cliente no Supabase...\n');

const { data: novoCliente, error: clienteError } = await supabase
  .from('clientes')
  .insert({
    contador_id: contador.id,
    nome_empresa: 'Cliente Teste Webhook ASAAS',
    cnpj: '00000000000000',
    contato_email: 'teste@webhook-asaas.com',
    contato_telefone: '11999999999',
    status: 'ativo',
    plano: 'profissional',
    valor_mensal: 199.90,
    asaas_customer_id: ASAAS_CUSTOMER_ID,
    data_ativacao: new Date().toISOString()
  })
  .select()
  .single();

if (clienteError) {
  console.error('❌ Erro ao criar cliente:', clienteError.message);
  console.log('\nDiagnóstico: Falha ao inserir cliente no banco');
  console.log('Detalhes:', clienteError);

  console.log('\n__JSON_RESULT__');
  console.log(JSON.stringify({
    success: false,
    erro: clienteError.message,
    mensagem: 'Falha ao criar cliente'
  }));

  process.exit(1);
}

console.log('═══════════════════════════════════════════════════════════');
console.log('✅ CLIENTE CRIADO COM SUCESSO!');
console.log('═══════════════════════════════════════════════════════════\n');
console.log('📊 DADOS DO CLIENTE CRIADO:\n');
console.log(`  ID: ${novoCliente.id}`);
console.log(`  Nome: ${novoCliente.nome_empresa}`);
console.log(`  ASAAS Customer ID: ${novoCliente.asaas_customer_id}`);
console.log(`  Status: ${novoCliente.status}`);
console.log(`  Plano: ${novoCliente.plano}`);
console.log(`  Valor Mensal: R$ ${novoCliente.valor_mensal}`);
console.log(`  Contador: ${contador.id}`);
console.log(`  Criado em: ${novoCliente.created_at}`);
console.log('\n═══════════════════════════════════════════════════════════');
console.log('✅ TESTE #1 CONCLUÍDO - CLIENTE CRIADO');
console.log('═══════════════════════════════════════════════════════════');
console.log('\nPróxima ação automática: TESTE #2 - Testar webhook com cliente válido\n');

// Retornar JSON para parsing
console.log('\n__JSON_RESULT__');
console.log(JSON.stringify({
  success: true,
  clienteCriado: true,
  cliente: novoCliente,
  contador: { id: contador.id, nivel: contador.nivel },
  mensagem: 'Cliente criado com sucesso, pronto para testes'
}));

process.exit(0);
