import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://zytxwdgzjqrcmbnpgofj.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5dHh3ZGd6anFyY21ibnBnb2ZqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDk4NjY0MiwiZXhwIjoyMDc2NTYyNjQyfQ.uC4X8zC-XtPNfQC0m7aKEoYO8DtCtbT4kZ67QGI-1A4'
);

console.log('🔍 TODOS OS EVENTOS WEBHOOK\n');

const { data } = await supabase
  .from('audit_logs')
  .select('acao, created_at, payload')
  .like('acao', '%WEBHOOK%')
  .order('created_at', { ascending: false })
  .limit(10);

if (data) {
  for (const log of data) {
    const hora = log.created_at.substring(11, 19);
    console.log(`${log.acao} - ${hora}`);
    if (log.payload.error) {
      console.log(`  ERROR: ${log.payload.error}`);
    }
    console.log();
  }
}
