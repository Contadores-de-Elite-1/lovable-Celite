#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://zytxwdgzjqrcmbnpgofj.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5dHh3ZGd6anFyY21ibnBnb2ZqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDk4NjY0MiwiZXhwIjoyMDc2NTYyNjQyfQ.uC4X8zC-XtPNfQC0m7aKEoYO8DtCtbT4kZ67QGI-1A4'
);

console.log('🔍 Últimos eventos webhook:\n');

const { data: logs } = await supabase
  .from('audit_logs')
  .select('*')
  .like('acao', '%WEBHOOK%')
  .order('created_at', { ascending: false })
  .limit(3);

if (logs) {
  for (const log of logs) {
    console.log(`📋 ${log.acao}`);
    console.log(`   Hora: ${log.created_at.substring(11, 19)}`);
    console.log(`   Payload:`, JSON.stringify(log.payload, null, 2));
    console.log();
  }
}
