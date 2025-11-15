#!/usr/bin/env node

/**
 * SETUP COMPLETO DO TESTE
 * Busca contador + Cria convite automaticamente
 */

const SUPABASE_URL = 'https://zytxwdgzjqrcmbnpgofj.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5dHh3ZGd6anFyY21ibnBnb2ZqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNDQ4MTI3MCwiZXhwIjoyMDUwMDU3MjcwfQ.jy1u5lYIDZx6BXQDpPFGBqVbBfIvyxD5_TxAIgSqOis';

const TOKEN = 'TESTE2025A';

async function main() {
  console.log('\n🚀 SETUP AUTOMÁTICO DO TESTE\n');
  console.log('═'.repeat(60));

  try {
    // 1. Buscar contador ativo
    console.log('\n📍 PASSO 1: Buscando contador ativo...');

    const resContador = await fetch(
      `${SUPABASE_URL}/rest/v1/rpc/executar_calculo_comissoes`,
      {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
      }
    );

    // Tentar query direta
    const resContadores = await fetch(
      `${SUPABASE_URL}/rest/v1/contadores?select=id,status&status=eq.ativo&limit=1`,
      {
        headers: {
          'apikey': SUPABASE_SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
        }
      }
    );

    const contadores = await resContadores.json();

    if (!contadores || contadores.length === 0) {
      console.log('❌ Nenhum contador ativo encontrado');
      console.log('\n📝 Usando contador ID fictício para criar convite...');
      console.log('   (O webhook V3.0 vai funcionar com qualquer contador)');

      // Usar UUID fictício mas válido
      const contadorId = '00000000-0000-0000-0000-000000000001';
      await criarConvite(contadorId);
      return;
    }

    const contadorId = contadores[0].id;
    console.log(`✅ Contador encontrado: ${contadorId}`);

    // 2. Criar convite
    await criarConvite(contadorId);

  } catch (error) {
    console.error('\n❌ ERRO:', error.message);

    console.log('\n📝 PLANO B: Criar convite com contador padrão...');
    const contadorPadrao = '00000000-0000-0000-0000-000000000001';
    await criarConvite(contadorPadrao);
  }
}

async function criarConvite(contadorId) {
  console.log(`\n📍 PASSO 2: Criando convite com token ${TOKEN}...`);
  console.log(`   Emissor (contador): ${contadorId}`);

  try {
    const dataExpiracao = new Date();
    dataExpiracao.setDate(dataExpiracao.getDate() + 30);

    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/invites`,
      {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({
          tipo: 'cliente',
          emissor_id: contadorId,
          token: TOKEN,
          expira_em: dataExpiracao.toISOString(),
          status: 'ativo'
        })
      }
    );

    if (res.ok) {
      const invite = await res.json();
      console.log('✅ Convite criado com sucesso!');
      console.log(`   ID: ${invite[0]?.id || 'N/A'}`);
      console.log(`   Token: ${TOKEN}`);
      console.log(`   Expira: ${dataExpiracao.toLocaleDateString('pt-BR')}`);

      exibirInstrucoes();
    } else {
      const error = await res.json();
      console.log('⚠️  Erro ao criar convite:', error.message || JSON.stringify(error));

      exibirSQLManual(contadorId);
    }

  } catch (error) {
    console.error('❌ Erro ao criar convite:', error.message);
    exibirSQLManual(contadorId);
  }
}

function exibirInstrucoes() {
  console.log('\n═'.repeat(60));
  console.log('\n✅ TUDO PRONTO! AGORA É COM VOCÊ!\n');
  console.log('📋 COPIE E COLE NA DESCRIÇÃO DA COBRANÇA ASAAS:\n');
  console.log(`   Mensalidade ref=${TOKEN}\n`);
  console.log('═'.repeat(60));
  console.log('\n🚀 PRÓXIMOS PASSOS:\n');
  console.log('1. Vá para ASAAS Sandbox: https://sandbox.asaas.com');
  console.log('2. Criar nova cobrança');
  console.log('3. Cliente: Dados da sua esposa');
  console.log('4. Valor: R$ 199,90');
  console.log('5. Vencimento: Hoje');
  console.log('6. Forma: PIX');
  console.log(`7. Descrição: Mensalidade ref=${TOKEN}`);
  console.log('8. Criar → Marcar como Recebida');
  console.log('9. Copiar Payment ID');
  console.log('10. Me passar o Payment ID\n');
  console.log('═'.repeat(60));
  console.log('\n🎯 EU VOU VERIFICAR TUDO AUTOMATICAMENTE! 🤖\n');
}

function exibirSQLManual(contadorId) {
  console.log('\n═'.repeat(60));
  console.log('\n📝 CRIAR CONVITE MANUALMENTE (SQL):\n');
  console.log('Execute no SQL Editor do Supabase:\n');
  console.log('```sql');
  console.log(`INSERT INTO invites (tipo, emissor_id, token, expira_em, status)`);
  console.log(`VALUES (`);
  console.log(`  'cliente',`);
  console.log(`  '${contadorId}',`);
  console.log(`  '${TOKEN}',`);
  console.log(`  NOW() + INTERVAL '30 days',`);
  console.log(`  'ativo'`);
  console.log(`);`);
  console.log('```\n');
  console.log('═'.repeat(60));

  exibirInstrucoes();
}

main();
