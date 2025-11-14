#!/usr/bin/env node

/**
 * BABY STEP 2: Criar Cliente no Asaas Sandbox
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs/promises';

const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const ASAAS_API_KEY = '$aact_hmlg_000MzkwODA2MWY2OGM3MWRlMDU2NWM3MzJlNzZmNGZhZGY6Ojg5NGI4NmYzLWQxYmUtNDkwYy05ZWMwLTM5ZTFhZGUwYWM2MDo6JGFhY2hfNDNkMWQ3N2YtNTEzOS00NmU3LWE4NzAtMzU0Y2Q1ZWEyYTA4';
const ASAAS_API_URL = 'https://sandbox.asaas.com/api/v3';

console.log('🎯 BABY STEP 2: Criar Cliente no Asaas Sandbox\n');

// Carregar IDs do cenário anterior
let scenarioData;
try {
  const data = await fs.readFile('scenario-data.json', 'utf-8');
  scenarioData = JSON.parse(data);
} catch (err) {
  console.error('❌ Erro ao carregar scenario-data.json');
  console.error('   Execute primeiro: node test-baby-step-1b-create-network-real.mjs');
  process.exit(1);
}

const joaoContadorId = scenarioData.contadores.joao.contador_id;

console.log('📖 Cliente a ser criado:');
console.log('   Nome: Padaria do Bairro Ltda');
console.log('   CNPJ: 34.028.316/0001-03 (válido para teste)');
console.log('   Plano: Pro - R$ 299,90/mês');
console.log(`   Contador: João (${joaoContadorId.substring(0, 8)}...)`);
console.log();

// Criar cliente no Asaas
console.log('🏢 Criando cliente no Asaas Sandbox...\n');

const customerResponse = await fetch(`${ASAAS_API_URL}/customers`, {
  method: 'POST',
  headers: {
    'accept': 'application/json',
    'content-type': 'application/json',
    'access_token': ASAAS_API_KEY
  },
  body: JSON.stringify({
    name: 'Padaria do Bairro Ltda',
    email: 'contato@padaria-teste.com',
    cpfCnpj: '34028316000103',
    phone: '11987654321',
    observation: 'Cliente indicado por João (Contador Bronze) - Teste E2E'
  })
});

const asaasCustomer = await customerResponse.json();

if (asaasCustomer.errors) {
  console.error('❌ Erro ao criar cliente no Asaas:', asaasCustomer.errors);
  process.exit(1);
}

console.log('   ✅ Cliente criado no Asaas!');
console.log(`      ID Asaas: ${asaasCustomer.id}`);
console.log(`      Nome: ${asaasCustomer.name}`);
console.log(`      CNPJ: ${asaasCustomer.cpfCnpj}`);
console.log();

// Registrar cliente no banco de dados
console.log('💾 Registrando cliente no banco de dados...\n');

const { data: cliente, error: clienteError } = await supabase
  .from('clientes')
  .insert({
    contador_id: joaoContadorId,
    nome_empresa: 'Padaria do Bairro Ltda',
    cnpj: '34028316000103',
    contato_email: 'contato@padaria-teste.com',
    contato_telefone: '11987654321',
    status: 'lead', // Ainda não ativou
    plano: 'profissional',
    valor_mensal: 299.90,
    asaas_customer_id: asaasCustomer.id
  })
  .select()
  .single();

if (clienteError) {
  console.error('❌ Erro ao registrar cliente no banco:', clienteError.message);
  process.exit(1);
}

console.log('   ✅ Cliente registrado no banco!');
console.log(`      ID Database: ${cliente.id}`);
console.log(`      Status: ${cliente.status}`);
console.log(`      Plano: ${cliente.plano}`);
console.log(`      Valor: R$ ${cliente.valor_mensal}`);
console.log();

// Atualizar scenario-data.json
scenarioData.cliente = {
  id: cliente.id,
  asaas_customer_id: asaasCustomer.id,
  nome: cliente.nome_empresa,
  valor: cliente.valor_mensal
};

await fs.writeFile('scenario-data.json', JSON.stringify(scenarioData, null, 2));

console.log('═══════════════════════════════════════════════════════════════');
console.log('✅ BABY STEP 2 CONCLUÍDO!');
console.log('═══════════════════════════════════════════════════════════════');
console.log();
console.log('📊 DADOS DO CLIENTE:');
console.log();
console.log(`  Nome: ${cliente.nome_empresa}`);
console.log(`  ID Database: ${cliente.id.substring(0, 8)}...`);
console.log(`  ID Asaas: ${asaasCustomer.id}`);
console.log(`  Valor Mensalidade: R$ ${cliente.valor_mensal}`);
console.log(`  Contador: João (Bronze)`);
console.log();
console.log('═══════════════════════════════════════════════════════════════');
console.log();
console.log('📝 PRÓXIMO PASSO:');
console.log('   Execute: node test-baby-step-3-create-payment.mjs');
console.log();
console.log('💾 Dados salvos em: scenario-data.json');
console.log();
