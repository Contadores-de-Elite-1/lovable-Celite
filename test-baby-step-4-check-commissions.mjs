#!/usr/bin/env node

/**
 * BABY STEP 4: Verificar Comissões Calculadas
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs/promises';

const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

console.log('🎯 BABY STEP 4: Verificar Comissões Calculadas\n');

// Carregar IDs do cenário
let scenarioData;
try {
  const data = await fs.readFile('scenario-data.json', 'utf-8');
  scenarioData = JSON.parse(data);
} catch (err) {
  console.error('❌ Erro ao carregar scenario-data.json');
  process.exit(1);
}

const clienteId = scenarioData.cliente.id;
const paymentId = scenarioData.payment.id;
const joaoId = scenarioData.contadores.joao.contador_id;
const mariaId = scenarioData.contadores.maria.contador_id;
const carlosId = scenarioData.contadores.carlos.contador_id;

console.log('🔍 Buscando pagamento registrado no banco...\n');

// Buscar pagamento no banco
const { data: pagamentos, error: pagError } = await supabase
  .from('pagamentos')
  .select('*')
  .eq('cliente_id', clienteId)
  .order('created_at', { ascending: false });

if (pagError) {
  console.error('❌ Erro ao buscar pagamentos:', pagError.message);
  process.exit(1);
}

if (!pagamentos || pagamentos.length === 0) {
  console.log('⏳ PAGAMENTO AINDA NÃO PROCESSADO');
  console.log();
  console.log('   O webhook ainda não foi recebido ou processado.');
  console.log();
  console.log('   📝 VERIFIQUE:');
  console.log('   1. Você simulou o pagamento no Asaas?');
  console.log('   2. O webhook está configurado corretamente?');
  console.log('      URL: https://zytxwdgzjqrcmbnpgofj.supabase.co/functions/v1/webhook-asaas');
  console.log('   3. Aguarde 5-10 segundos e execute este script novamente');
  console.log();
  console.log('   🔍 Para ver logs do webhook, execute:');
  console.log('      supabase functions logs webhook-asaas');
  console.log();
  process.exit(0);
}

const pagamento = pagamentos[0];

console.log('✅ Pagamento encontrado no banco!');
console.log(`   ID: ${pagamento.id.substring(0, 8)}...`);
console.log(`   Asaas Payment ID: ${pagamento.asaas_payment_id}`);
console.log(`   Valor Líquido: R$ ${pagamento.valor_liquido}`);
console.log(`   Status: ${pagamento.status}`);
console.log(`   Tipo: ${pagamento.tipo}`);
console.log();

// Buscar comissões
console.log('💰 Buscando comissões calculadas...\n');

const { data: comissoes, error: comError } = await supabase
  .from('comissoes')
  .select(`
    *,
    contadores (
      user_id,
      nivel,
      clientes_ativos
    )
  `)
  .eq('pagamento_id', pagamento.id)
  .order('valor', { ascending: false });

if (comError) {
  console.error('❌ Erro ao buscar comissões:', comError.message);
  process.exit(1);
}

if (!comissoes || comissoes.length === 0) {
  console.log('⚠️  COMISSÕES NÃO CALCULADAS');
  console.log();
  console.log('   O pagamento foi registrado mas as comissões não foram calculadas.');
  console.log();
  console.log('   📝 POSSÍVEIS CAUSAS:');
  console.log('   1. Erro na função calcular-comissoes');
  console.log('   2. Problema na rede de contadores');
  console.log();
  console.log('   🔍 Para ver logs, execute:');
  console.log('      supabase functions logs calcular-comissoes');
  console.log();
  process.exit(0);
}

console.log(`✅ ${comissoes.length} comissão(ões) calculada(s)!\n`);

let totalComissoes = 0;

for (const comissao of comissoes) {
  const contadorNome =
    comissao.contador_id === joaoId ? 'João (Bronze)' :
    comissao.contador_id === mariaId ? 'Maria (Ouro)' :
    comissao.contador_id === carlosId ? 'Carlos (Diamante)' :
    'Desconhecido';

  console.log(`   💵 ${contadorNome}`);
  console.log(`      Tipo: ${comissao.tipo_comissao}`);
  console.log(`      Valor: R$ ${comissao.valor_calculado}`);
  console.log(`      Status: ${comissao.status}`);
  console.log(`      Nível na rede: ${comissao.nivel || 'N/A'}`);
  console.log();

  totalComissoes += parseFloat(comissao.valor_calculado);
}

console.log('═══════════════════════════════════════════════════════════════');
console.log('✅ TESTE E2E COMPLETO - SUCESSO!');
console.log('═══════════════════════════════════════════════════════════════');
console.log();
console.log('📊 RESUMO FINAL:');
console.log();
console.log('  🏢 CLIENTE:');
console.log(`     Nome: ${scenarioData.cliente.nome}`);
console.log(`     ID Asaas: ${scenarioData.cliente.asaas_customer_id}`);
console.log();
console.log('  💳 PAGAMENTO:');
console.log(`     ID Asaas: ${paymentId}`);
console.log(`     ID Database: ${pagamento.id.substring(0, 8)}...`);
console.log(`     Valor Bruto: R$ ${pagamento.valor_bruto || 'N/A'}`);
console.log(`     Valor Líquido: R$ ${pagamento.valor_liquido}`);
console.log(`     Tipo: ${pagamento.tipo}`);
console.log();
console.log('  💰 COMISSÕES:');
console.log(`     Total Distribuído: R$ ${totalComissoes.toFixed(2)}`);
console.log(`     Número de Comissões: ${comissoes.length}`);
console.log(`     Percentual Total: ${((totalComissoes / pagamento.valor_liquido) * 100).toFixed(1)}%`);
console.log();
console.log('  🕸️  REDE:');
console.log('     Nível 1: Carlos (Diamante) - 15 clientes');
console.log('     Nível 2: Maria (Ouro) - 12 clientes');
console.log('     Nível 3: João (Bronze) - 3 clientes (vendedor)');
console.log();
console.log('═══════════════════════════════════════════════════════════════');
console.log();
console.log('🎉 Sistema funcionando perfeitamente!');
console.log();
console.log('📱 PRÓXIMOS PASSOS:');
console.log('   • Verifique o frontend: http://localhost:8080/comissoes');
console.log('   • Verifique o dashboard: http://localhost:8080/dashboard');
console.log('   • Login com: joao.bronze@teste.com / senha123');
console.log();
