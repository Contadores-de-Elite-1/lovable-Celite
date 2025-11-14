#!/usr/bin/env node

/**
 * BABY STEP 1A: Criar Usuários de Teste via Admin API
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

console.log('🎯 BABY STEP 1A: Criar Usuários de Teste\n');

// IDs fixos para o cenário
const CARLOS_ID = '10000000-0000-0000-0000-000000000001';
const MARIA_ID = '10000000-0000-0000-0000-000000000002';
const JOAO_ID = '10000000-0000-0000-0000-000000000003';

const usuarios = [
  {
    id: CARLOS_ID,
    email: 'carlos.diamante@teste.com',
    password: 'senha123',
    user_metadata: { nome: 'Carlos Diamante' },
    email_confirm: true
  },
  {
    id: MARIA_ID,
    email: 'maria.ouro@teste.com',
    password: 'senha123',
    user_metadata: { nome: 'Maria Ouro' },
    email_confirm: true
  },
  {
    id: JOAO_ID,
    email: 'joao.bronze@teste.com',
    password: 'senha123',
    user_metadata: { nome: 'João Bronze' },
    email_confirm: true
  }
];

console.log('👤 Criando usuários no Auth...\n');

for (const usuario of usuarios) {
  // Tentar deletar primeiro (caso já exista)
  await supabase.auth.admin.deleteUser(usuario.id).catch(() => {});

  const { data, error } = await supabase.auth.admin.createUser({
    email: usuario.email,
    password: usuario.password,
    email_confirm: usuario.email_confirm,
    user_metadata: usuario.user_metadata
  });

  if (error) {
    console.error(`   ❌ Erro ao criar ${usuario.email}:`, error.message);
  } else {
    console.log(`   ✅ ${usuario.user_metadata.nome} (${data.user.email})`);
  }
}

console.log();
console.log('═══════════════════════════════════════════════════════════════');
console.log('✅ USUÁRIOS CRIADOS COM SUCESSO!');
console.log('═══════════════════════════════════════════════════════════════');
console.log();
console.log('📝 PRÓXIMO PASSO:');
console.log('   Execute: node test-baby-step-1-create-network.mjs');
console.log();
