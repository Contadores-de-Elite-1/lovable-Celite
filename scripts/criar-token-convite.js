#!/usr/bin/env node

/**
 * 🎫 CRIAR TOKEN DE CONVITE
 *
 * Busca um contador ativo e cria um token de convite
 * para usar na description da cobrança ASAAS
 */

const SUPABASE_URL = 'https://zytxwdgzjqrcmbnpgofj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5dHh3ZGd6anFyY21ibnBnb2ZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ0ODEyNzAsImV4cCI6MjA1MDA1NzI3MH0.qtxJYIxLGAVlv4YH8rRv7hqYLe7ZTBQxELGEkMv0hSM';

function gerarTokenAleatorio() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let token = 'TEST';
  for (let i = 0; i < 6; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

async function main() {
  console.log('\n🎫 CRIANDO TOKEN DE CONVITE PARA TESTE\n');
  console.log('═'.repeat(60));

  try {
    // 1. Buscar contador ativo
    console.log('\n🔍 Buscando contador ativo...');

    const responseContador = await fetch(
      `${SUPABASE_URL}/rest/v1/contadores?select=id,status,profiles!inner(nome,email)&status=eq.ativo&limit=1`,
      {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Content-Type': 'application/json'
        }
      }
    );

    const contadores = await responseContador.json();

    if (!contadores || contadores.length === 0) {
      console.log('⚠️  Nenhum contador ativo encontrado!');
      console.log('\n📝 SOLUÇÃO: Use este contador_id manualmente:');
      console.log('   (Você vai precisar criar na tabela invites via SQL Editor)');
      process.exit(1);
    }

    const contador = contadores[0];
    const contadorId = contador.id;
    const contadorNome = contador.profiles?.nome || 'N/A';
    const contadorEmail = contador.profiles?.email || 'N/A';

    console.log('✅ Contador encontrado!');
    console.log(`   ID: ${contadorId}`);
    console.log(`   Nome: ${contadorNome}`);
    console.log(`   Email: ${contadorEmail}`);

    // 2. Gerar token único
    const token = gerarTokenAleatorio();
    console.log(`\n🎲 Token gerado: ${token}`);

    // 3. Criar convite (pode falhar se RLS bloquear)
    console.log('\n💾 Tentando criar convite na tabela invites...');

    const dataExpiracao = new Date();
    dataExpiracao.setDate(dataExpiracao.getDate() + 30); // 30 dias

    const responseInvite = await fetch(
      `${SUPABASE_URL}/rest/v1/invites`,
      {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({
          tipo: 'cliente',
          emissor_id: contadorId,
          token: token,
          expira_em: dataExpiracao.toISOString(),
          status: 'ativo'
        })
      }
    );

    if (responseInvite.ok) {
      const invite = await responseInvite.json();
      console.log('✅ Convite criado com sucesso!');
      console.log(`   ID: ${invite[0]?.id}`);
      console.log(`   Expira em: ${dataExpiracao.toLocaleDateString('pt-BR')}`);
    } else {
      const error = await responseInvite.json();
      console.log('⚠️  Não foi possível criar convite automaticamente (RLS)');
      console.log('   Erro:', error.message || JSON.stringify(error));
      console.log('\n📝 SOLUÇÃO: Criar manualmente via SQL Editor (instruções abaixo)');
    }

    // 4. Instruções finais
    console.log('\n═'.repeat(60));
    console.log('\n✅ PRONTO PARA USAR!\n');
    console.log('📋 COPIE E COLE NA DESCRIÇÃO DA COBRANÇA ASAAS:\n');
    console.log(`   Mensalidade ref=${token}\n`);
    console.log('═'.repeat(60));
    console.log('\n📝 ALTERNATIVAS DE FORMATO (qualquer uma funciona):\n');
    console.log(`   • Mensalidade ref=${token}`);
    console.log(`   • Pagamento ref=${token}`);
    console.log(`   • Teste ref=${token}`);
    console.log(`   • ref=${token}`);
    console.log(`   • token=${token}`);
    console.log('\n═'.repeat(60));
    console.log('\n🔍 DADOS DO TESTE:\n');
    console.log(`   Contador ID: ${contadorId}`);
    console.log(`   Contador Nome: ${contadorNome}`);
    console.log(`   Token: ${token}`);
    console.log(`   Formato: ref=${token}`);
    console.log('\n═'.repeat(60));

    // 5. SQL alternativo (caso RLS tenha bloqueado)
    if (!responseInvite.ok) {
      console.log('\n🛠️  CRIAR CONVITE MANUALMENTE (SQL Editor):\n');
      console.log('1. Acesse: https://supabase.com/dashboard/project/zytxwdgzjqrcmbnpgofj');
      console.log('2. SQL Editor → New query');
      console.log('3. Cole e execute:\n');
      console.log('```sql');
      console.log(`INSERT INTO invites (tipo, emissor_id, token, expira_em, status)`);
      console.log(`VALUES (`);
      console.log(`  'cliente',`);
      console.log(`  '${contadorId}',`);
      console.log(`  '${token}',`);
      console.log(`  NOW() + INTERVAL '30 days',`);
      console.log(`  'ativo'`);
      console.log(`);`);
      console.log('```\n');
      console.log('4. Clique em "Run"');
      console.log('5. Use o token na descrição da cobrança');
      console.log('\n═'.repeat(60));
    }

    console.log('\n💡 PRÓXIMOS PASSOS:\n');
    console.log('1. Vá para ASAAS Sandbox');
    console.log('2. Criar nova cobrança');
    console.log(`3. Na DESCRIÇÃO, cole: Mensalidade ref=${token}`);
    console.log('4. Marcar como recebida');
    console.log('5. Webhook vai vincular automaticamente ao contador!');
    console.log('\n═'.repeat(60));
    console.log('\n✅ WEBHOOK VAI PROCESSAR ASSIM:\n');
    console.log('1. ASAAS envia webhook com payment');
    console.log(`2. Webhook lê description: "Mensalidade ref=${token}"`);
    console.log(`3. Webhook busca token ${token} na tabela invites`);
    console.log(`4. Encontra contador_id: ${contadorId}`);
    console.log('5. Cria cliente vinculado a esse contador');
    console.log('6. Calcula comissões para esse contador');
    console.log('7. Retorna HTTP 200');
    console.log('\n═'.repeat(60));
    console.log('\n🎯 TUDO PRONTO! Use o token acima! 🚀\n');

  } catch (error) {
    console.error('\n❌ ERRO:', error.message);
    console.error(error);
    process.exit(1);
  }
}

main();
