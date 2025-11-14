#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://zytxwdgzjqrcmbnpgofj.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5dHh3ZGd6anFyY21ibnBnb2ZqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDk4NjY0MiwiZXhwIjoyMDc2NTYyNjQyfQ.uC4X8zC-XtPNfQC0m7aKEoYO8DtCtbT4kZ67QGI-1A4'
);

console.log('✅ Verificando pagamentos recentes\n');

const { data: pagamentos } = await supabase
  .from('pagamentos')
  .select('*')
  .eq('cliente_id', '520ad2a9-5178-46ae-b492-8ff215c592dd')
  .order('created_at', { ascending: false })
  .limit(3);

if (pagamentos) {
  console.log(`📊 Total: ${pagamentos.length} pagamentos\n`);
  for (const p of pagamentos) {
    const hora = p.created_at.substring(11, 19);
    console.log(`💰 ${hora} - R$ ${p.valor_liquido} (${p.tipo})`);
    console.log(`   ID: ${p.id.substring(0, 13)}...`);
    console.log(`   Status: ${p.status}`);
    console.log(`   Asaas Payment: ${p.asaas_payment_id}\n`);
  }
}
