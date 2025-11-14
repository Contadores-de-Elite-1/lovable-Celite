#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://zytxwdgzjqrcmbnpgofj.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5dHh3ZGd6anFyY21ibnBnb2ZqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDk4NjY0MiwiZXhwIjoyMDc2NTYyNjQyfQ.uC4X8zC-XtPNfQC0m7aKEoYO8DtCtbT4kZ67QGI-1A4'
);

console.log('🔍 VERIFICANDO ÚLTIMO ERRO\n');

const { data: erros } = await supabase
  .from('audit_logs')
  .select('acao, created_at, payload')
  .like('acao', '%CALCULO_COMISSOES_ERRO%')
  .order('created_at', { ascending: false })
  .limit(1);

if (erros && erros.length > 0) {
  const err = erros[0];
  console.log(`❌ ${err.acao}`);
  console.log(`   Hora: ${err.created_at}`);
  console.log(`   Erro: ${err.payload.error}`);
  console.log(`   Pagamento: ${err.payload.pagamento_id}`);
} else {
  console.log('Nenhum erro de cálculo encontrado');
}

console.log('\n');

const { data: webhookErros } = await supabase
  .from('audit_logs')
  .select('acao, created_at, payload')
  .eq('acao', 'WEBHOOK_ASAAS_ERROR')
  .order('created_at', { ascending: false })
  .limit(1);

if (webhookErros && webhookErros.length > 0) {
  const err = webhookErros[0];
  console.log(`❌ ${err.acao}`);
  console.log(`   Hora: ${err.created_at}`);
  console.log(`   Erro: ${err.payload.error}`);
  if (err.payload.fullError) {
    console.log(`   Full Error:`);
    console.log(`   ${err.payload.fullError.substring(0, 300)}`);
  }
}
