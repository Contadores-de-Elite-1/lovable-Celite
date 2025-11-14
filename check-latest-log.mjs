import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://zytxwdgzjqrcmbnpgofj.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5dHh3ZGd6anFyY21ibnBnb2ZqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDk4NjY0MiwiZXhwIjoyMDc2NTYyNjQyfQ.uC4X8zC-XtPNfQC0m7aKEoYO8DtCtbT4kZ67QGI-1A4'
);

const { data: logs } = await supabase
  .from('audit_logs')
  .select('*')
  .like('acao', '%WEBHOOK%')
  .order('created_at', { ascending: false })
  .limit(1);

if (logs && logs[0]) {
  console.log('Último evento webhook:');
  console.log('Ação:', logs[0].acao);
  console.log('Hora:', logs[0].created_at);
  console.log('Payload:', JSON.stringify(logs[0].payload, null, 2));
}
