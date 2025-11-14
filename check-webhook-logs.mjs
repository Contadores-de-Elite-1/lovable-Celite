#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://zytxwdgzjqrcmbnpgofj.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5dHh3ZGd6anFyY21ibnBnb2ZqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDk4NjY0MiwiZXhwIjoyMDc2NTYyNjQyfQ.uC4X8zC-XtPNfQC0m7aKEoYO8DtCtbT4kZ67QGI-1A4'
);

console.log('🔍 Verificando audit logs da função webhook\n');

const { data: logs } = await supabase
  .from('audit_logs')
  .select('*')
  .like('acao', '%WEBHOOK%')
  .order('created_at', { ascending: false })
  .limit(20);

if (logs && logs.length > 0) {
  console.log(`✅ ${logs.length} eventos encontrados:\n`);
  for (const log of logs) {
    console.log(`• ${log.acao} - ${log.created_at}`);
    if (log.payload) {
      console.log(`  Detalhe: ${JSON.stringify(log.payload).substring(0, 80)}...`);
    }
  }
} else {
  console.log('❌ Nenhum evento webhook encontrado!');
  console.log('   O webhook pode não ter sido disparado pelo Asaas.\n');
}

console.log('\n🔍 Verificando últimos eventos de audit:\n');

const { data: allLogs } = await supabase
  .from('audit_logs')
  .select('acao, created_at')
  .order('created_at', { ascending: false })
  .limit(10);

if (allLogs) {
  for (const log of allLogs) {
    console.log(`• ${log.acao} - ${log.created_at.substring(11, 19)}`);
  }
}
