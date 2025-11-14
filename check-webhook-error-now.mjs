#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://zytxwdgzjqrcmbnpgofj.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5dHh3ZGd6anFyY21ibnBnb2ZqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDk4NjY0MiwiZXhwIjoyMDc2NTYyNjQyfQ.uC4X8zC-XtPNfQC0m7aKEoYO8DtCtbT4kZ67QGI-1A4'
);

console.log('🔍 VERIFICANDO ERRO DO WEBHOOK...\n');

// Ver últimos audit logs
const { data: logs, error } = await supabase
  .from('audit_logs')
  .select('*')
  .order('created_at', { ascending: false })
  .limit(5);

if (error) {
  console.error('❌ Erro ao buscar logs:', error);
  process.exit(1);
}

console.log(`📋 Últimos ${logs.length} audit logs:\n`);

for (const log of logs) {
  const time = new Date(log.created_at).toLocaleTimeString();
  console.log(`[${time}] ${log.acao}`);

  if (log.acao.includes('ERROR') || log.acao.includes('ERRO')) {
    console.log('   ❌ ERRO ENCONTRADO!');
    console.log('   Payload:', JSON.stringify(log.payload, null, 2));
    console.log();
  }
}

// Verificar se cliente existe
console.log('\n🔍 Verificando se cliente existe...\n');

const { data: cliente, error: clienteError } = await supabase
  .from('clientes')
  .select('*')
  .eq('asaas_customer_id', 'cus_000007222335')
  .maybeSingle();

if (clienteError) {
  console.error('❌ Erro ao buscar cliente:', clienteError);
} else if (!cliente) {
  console.log('❌ CLIENTE NÃO EXISTE!');
  console.log('   asaas_customer_id procurado: cus_000007222335');
  console.log('   Este é o problema! Webhook falha porque cliente não existe.\n');
  console.log('✅ SOLUÇÃO: Criar cliente primeiro!');
} else {
  console.log('✅ Cliente existe:', cliente.nome_empresa);
}

console.log('\n✅ Verificação completa!');
