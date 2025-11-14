#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zytxwdgzjqrcmbnpgofj.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5dHh3ZGd6anFyY21ibnBnb2ZqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDk4NjY0MiwiZXhwIjoyMDc2NTYyNjQyfQ.uC4X8zC-XtPNfQC0m7aKEoYO8DtCtbT4kZ67QGI-1A4';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

console.log('🔍 DEBUG - Verificando tabelas\n');

// 1. Ver schema da tabela pagamentos
console.log('1️⃣ Schema da tabela PAGAMENTOS:\n');
const { data: pagSchema, error: pagSchemaErr } = await supabase
  .from('pagamentos')
  .select('*')
  .limit(1);

if (pagSchemaErr) {
  console.log('Erro:', pagSchemaErr);
} else {
  console.log('Colunas disponíveis:');
  if (pagSchema && pagSchema[0]) {
    Object.keys(pagSchema[0]).forEach(key => console.log(`   • ${key}`));
  }
  console.log();
}

// 2. Ver schema da tabela comissoes
console.log('2️⃣ Schema da tabela COMISSOES:\n');
const { data: comSchema, error: comSchemaErr } = await supabase
  .from('comissoes')
  .select('*')
  .limit(1);

if (comSchemaErr) {
  console.log('Erro:', comSchemaErr);
} else {
  console.log('Colunas disponíveis:');
  if (comSchema && comSchema[0]) {
    Object.keys(comSchema[0]).forEach(key => console.log(`   • ${key}`));
  }
  console.log();
}

// 3. Ver TODOS os pagamentos (sem filtro)
console.log('3️⃣ TODOS os pagamentos na tabela:\n');
const { data: allPagamentos, error: allPagErr } = await supabase
  .from('pagamentos')
  .select('*')
  .order('created_at', { ascending: false })
  .limit(5);

if (allPagErr) {
  console.log('Erro:', allPagErr.message);
} else {
  console.log(`Total encontrado: ${allPagamentos.length} pagamentos`);
  if (allPagamentos.length > 0) {
    console.log('\nÚltimos pagamentos:');
    for (const pag of allPagamentos) {
      console.log(`   • ${pag.id.substring(0, 13)}... (Asaas: ${pag.asaas_payment_id}) - Status: ${pag.status}`);
    }
  }
  console.log();
}

// 4. Ver TODAS as comissões
console.log('4️⃣ TODAS as comissões na tabela:\n');
const { data: allComissoes, error: allComErr } = await supabase
  .from('comissoes')
  .select('*')
  .order('created_at', { ascending: false })
  .limit(5);

if (allComErr) {
  console.log('Erro:', allComErr.message);
} else {
  console.log(`Total encontrado: ${allComissoes.length} comissões`);
  if (allComissoes.length > 0) {
    console.log('\nÚltimas comissões:');
    for (const com of allComissoes) {
      console.log(`   • ${com.id.substring(0, 13)}... - Tipo: ${com.tipo_comissao} - Valor: ${com.valor}`);
    }
  }
  console.log();
}

// 5. Verificar audit_logs
console.log('5️⃣ AUDIT LOGS (últimos eventos):\n');
const { data: auditLogs, error: auditErr } = await supabase
  .from('audit_logs')
  .select('*')
  .order('created_at', { ascending: false })
  .limit(10);

if (auditErr) {
  console.log('Erro:', auditErr.message);
} else {
  console.log(`Total encontrado: ${auditLogs.length} eventos`);
  if (auditLogs.length > 0) {
    console.log('\nÚltimos eventos:');
    for (const log of auditLogs) {
      console.log(`   • ${log.acao} - ${log.created_at}`);
    }
  }
  console.log();
}
