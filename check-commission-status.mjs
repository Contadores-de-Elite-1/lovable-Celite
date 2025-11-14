#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://zytxwdgzjqrcmbnpgofj.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5dHh3ZGd6anFyY21ibnBnb2ZqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDk4NjY0MiwiZXhwIjoyMDc2NTYyNjQyfQ.uC4X8zC-XtPNfQC0m7aKEoYO8DtCtbT4kZ67QGI-1A4'
);

console.log('🔍 VERIFICANDO STATUS DE COMISSÕES\n');

// Check comissoes table
const { data: com, error: comError } = await supabase
  .from('comissoes')
  .select('*')
  .eq('cliente_id', '520ad2a9-5178-46ae-b492-8ff215c592dd');

console.log('📊 Comissões para este cliente:');
if (comError) {
  console.log('❌ Erro:', comError.message);
} else {
  console.log(`✅ Total: ${com.length} registros\n`);
  if (com.length > 0) {
    for (const c of com) {
      console.log(`- Tipo: ${c.tipo_comissao}, Valor: R$ ${c.valor}, Status: ${c.status}`);
    }
  } else {
    console.log('(nenhuma)');
  }
}

// Check audit logs for commission calculation
console.log('\n📋 Logs de auditoria (últimos 5):\n');
const { data: logs } = await supabase
  .from('audit_logs')
  .select('acao, created_at, payload')
  .like('acao', '%COMISSAO%')
  .order('created_at', { ascending: false })
  .limit(5);

if (logs && logs.length > 0) {
  for (const log of logs) {
    const hora = log.created_at.substring(11, 19);
    console.log(`${log.acao} - ${hora}`);
    if (log.payload && log.payload.error) {
      console.log(`  ❌ ERROR: ${log.payload.error}`);
    }
  }
} else {
  console.log('(nenhum log encontrado)');
}

// Check webhook logs
console.log('\n🔗 Eventos do webhook (últimos 5):\n');
const { data: webhookLogs } = await supabase
  .from('audit_logs')
  .select('acao, created_at, payload')
  .like('acao', '%WEBHOOK%')
  .order('created_at', { ascending: false })
  .limit(5);

if (webhookLogs && webhookLogs.length > 0) {
  for (const log of webhookLogs) {
    const hora = log.created_at.substring(11, 19);
    console.log(`${log.acao} - ${hora}`);
    if (log.payload && log.payload.error) {
      console.log(`  ❌ ERROR: ${log.payload.error}`);
    }
  }
} else {
  console.log('(nenhum log encontrado)');
}
