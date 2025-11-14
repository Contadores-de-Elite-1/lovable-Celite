#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://zytxwdgzjqrcmbnpgofj.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5dHh3ZGd6anFyY21ibnBnb2ZqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDk4NjY0MiwiZXhwIjoyMDc2NTYyNjQyfQ.uC4X8zC-XtPNfQC0m7aKEoYO8DtCtbT4kZ67QGI-1A4'
);

console.log('🔍 Verificando detalhes dos erros do webhook\n');

const { data: logs } = await supabase
  .from('audit_logs')
  .select('*')
  .like('acao', '%WEBHOOK_ASAAS_ERROR%')
  .order('created_at', { ascending: false })
  .limit(5);

if (logs && logs.length > 0) {
  for (const log of logs) {
    console.log(`\n📋 Erro: ${log.created_at}`);
    console.log(`Payload completo:`, JSON.stringify(log.payload, null, 2));
  }
}
