#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://zytxwdgzjqrcmbnpgofj.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5dHh3ZGd6anFyY21ibnBnb2ZqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDk4NjY0MiwiZXhwIjoyMDc2NTYyNjQyfQ.uC4X8zC-XtPNfQC0m7aKEoYO8DtCtbT4kZ67QGI-1A4'
);

console.log('🔍 DIAGNÓSTICO - VERIFICAÇÕES AUTOMÁTICAS\n');
console.log('═══════════════════════════════════════════════════════════════\n');

// 1. Cliente foi criado?
console.log('1️⃣ CLIENTE NO BANCO\n');

const { data: cliente } = await supabase
  .from('clientes')
  .select('*')
  .eq('asaas_customer_id', 'cus_000007222335')
  .single();

if (cliente) {
  console.log('✅ CLIENTE ENCONTRADO');
  console.log(`   ID: ${cliente.id}`);
  console.log(`   Nome: ${cliente.nome_empresa}`);
  console.log(`   Contador ID: ${cliente.contador_id}\n`);
} else {
  console.log('❌ CLIENTE NÃO ENCONTRADO\n');
}

// 2. Qual é o erro real?
console.log('2️⃣ ÚLTIMO ERRO DO WEBHOOK\n');

const { data: erros } = await supabase
  .from('audit_logs')
  .select('*')
  .eq('acao', 'WEBHOOK_ASAAS_ERROR')
  .order('created_at', { ascending: false })
  .limit(1);

if (erros && erros.length > 0) {
  const err = erros[0];
  console.log(`Hora: ${err.created_at}`);
  console.log(`Erro: ${err.payload.error}`);
  if (err.payload.stack) {
    console.log(`Stack: ${err.payload.stack}`);
  }
  console.log();
} else {
  console.log('Nenhum erro encontrado\n');
}

// 3. Qual é a estrutura do webhook?
console.log('3️⃣ ESTRUTURA DO WEBHOOK RECEBIDO\n');

const { data: todos } = await supabase
  .from('audit_logs')
  .select('payload,created_at')
  .like('acao', '%WEBHOOK%')
  .order('created_at', { ascending: false })
  .limit(1);

if (todos && todos.length > 0) {
  console.log('Último payload:');
  console.log(JSON.stringify(todos[0].payload, null, 2));
  console.log();
}

console.log('═══════════════════════════════════════════════════════════════');
