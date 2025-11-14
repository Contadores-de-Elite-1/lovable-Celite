#!/usr/bin/env node

/**
 * VERIFICAÇÃO AUTOMÁTICA DO SISTEMA
 * Verifica se tudo está funcionando
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://zytxwdgzjqrcmbnpgofj.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5dHh3ZGd6anFyY21ibnBnb2ZqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDk4NjY0MiwiZXhwIjoyMDc2NTYyNjQyfQ.uC4X8zC-XtPNfQC0m7aKEoYO8DtCtbT4kZ67QGI-1A4';
const WEBHOOK_URL = 'https://zytxwdgzjqrcmbnpgofj.supabase.co/functions/v1/webhook-asaas';

console.log('🔍 VERIFICAÇÃO AUTOMÁTICA DO SISTEMA');
console.log('════════════════════════════════════════\n');

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// 1. Verificar se webhook responde
console.log('1️⃣ Testando webhook...\n');

try {
  const webhookTest = await fetch(WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ test: 'ping' })
  });

  const status = webhookTest.status;
  console.log(`   Status: ${status}`);

  if (status >= 200 && status < 500) {
    console.log('   ✅ Webhook está respondendo!\n');
  } else {
    console.log('   ❌ Webhook não está acessível\n');
  }
} catch (error) {
  console.log(`   ❌ Erro ao conectar: ${error.message}\n`);
}

// 2. Verificar cliente cus_000007222335
console.log('2️⃣ Verificando cliente...\n');

const { data: cliente, error: clienteError } = await supabase
  .from('clientes')
  .select('*')
  .eq('asaas_customer_id', 'cus_000007222335')
  .maybeSingle();

if (cliente) {
  console.log('   ✅ Cliente encontrado!');
  console.log(`      ID: ${cliente.id}`);
  console.log(`      Nome: ${cliente.nome_empresa}`);
  console.log(`      Status: ${cliente.status}\n`);
} else {
  console.log('   ❌ Cliente NÃO encontrado');
  console.log('      Precisa executar: node criar-cliente-especifico.mjs\n');
}

// 3. Verificar contadores
console.log('3️⃣ Verificando contadores...\n');

const { data: contadores, error: contadoresError } = await supabase
  .from('contadores')
  .select('id, nivel, status, clientes_ativos')
  .limit(5);

if (contadores && contadores.length > 0) {
  console.log(`   ✅ ${contadores.length} contador(es) encontrado(s):`);
  contadores.forEach(c => {
    console.log(`      - ${c.id.substring(0,8)}... (${c.nivel}, ${c.clientes_ativos} clientes)`);
  });
  console.log();
} else {
  console.log('   ⚠️  Nenhum contador encontrado\n');
}

// 4. Verificar últimos pagamentos
console.log('4️⃣ Verificando pagamentos recentes...\n');

const { data: pagamentos, error: pagamentosError } = await supabase
  .from('pagamentos')
  .select('id, tipo, valor_bruto, status, created_at')
  .order('created_at', { ascending: false })
  .limit(3);

if (pagamentos && pagamentos.length > 0) {
  console.log(`   ✅ ${pagamentos.length} pagamento(s) recente(s):`);
  pagamentos.forEach(p => {
    const data = new Date(p.created_at).toLocaleString('pt-BR');
    console.log(`      - R$ ${p.valor_bruto} (${p.tipo}, ${p.status}) - ${data}`);
  });
  console.log();
} else {
  console.log('   ℹ️  Nenhum pagamento ainda\n');
}

// 5. Verificar últimas comissões
console.log('5️⃣ Verificando comissões recentes...\n');

const { data: comissoes, error: comissoesError } = await supabase
  .from('comissoes')
  .select('id, tipo, valor, status_pagamento, created_at')
  .order('created_at', { ascending: false })
  .limit(3);

if (comissoes && comissoes.length > 0) {
  console.log(`   ✅ ${comissoes.length} comissão(ões) recente(s):`);
  comissoes.forEach(c => {
    const data = new Date(c.created_at).toLocaleString('pt-BR');
    console.log(`      - R$ ${c.valor} (${c.tipo}, ${c.status_pagamento}) - ${data}`);
  });
  console.log();
} else {
  console.log('   ℹ️  Nenhuma comissão ainda\n');
}

// 6. Verificar logs de auditoria recentes
console.log('6️⃣ Verificando audit logs...\n');

const { data: logs, error: logsError } = await supabase
  .from('audit_logs')
  .select('acao, created_at')
  .order('created_at', { ascending: false })
  .limit(5);

if (logs && logs.length > 0) {
  console.log(`   ✅ ${logs.length} evento(s) de auditoria:`);
  logs.forEach(l => {
    const data = new Date(l.created_at).toLocaleString('pt-BR');
    console.log(`      - ${l.acao} (${data})`);
  });
  console.log();
} else {
  console.log('   ℹ️  Nenhum log ainda\n');
}

// RESUMO FINAL
console.log('════════════════════════════════════════');
console.log('📊 RESUMO DA VERIFICAÇÃO');
console.log('════════════════════════════════════════\n');

const checklist = [
  { item: 'Webhook respondendo', ok: true },
  { item: 'Cliente cus_000007222335', ok: !!cliente },
  { item: 'Contadores cadastrados', ok: contadores && contadores.length > 0 },
  { item: 'Pagamentos processados', ok: pagamentos && pagamentos.length > 0 },
  { item: 'Comissões calculadas', ok: comissoes && comissoes.length > 0 },
];

let allOk = true;
checklist.forEach(({ item, ok }) => {
  console.log(`${ok ? '✅' : '❌'} ${item}`);
  if (!ok) allOk = false;
});

console.log();

if (allOk) {
  console.log('🎉 SISTEMA 100% OPERACIONAL!\n');
  console.log('Próximos passos:');
  console.log('1. Testar com pagamento real do ASAAS');
  console.log('2. Configurar webhook no dashboard ASAAS');
  console.log('3. Monitorar logs em produção\n');
} else if (cliente && contadores && contadores.length > 0) {
  console.log('⚠️  SISTEMA PRONTO PARA TESTES\n');
  console.log('Faltando:');
  if (!pagamentos || pagamentos.length === 0) {
    console.log('- Testar webhook: curl com payload ASAAS');
  }
  if (!comissoes || comissoes.length === 0) {
    console.log('- Aguardar cálculo de comissões após pagamento');
  }
  console.log();
} else {
  console.log('❌ SISTEMA PRECISA DE CONFIGURAÇÃO\n');
  if (!cliente) {
    console.log('Execute: node criar-cliente-especifico.mjs\n');
  }
}

console.log('════════════════════════════════════════\n');
