#!/usr/bin/env node

/**
 * CLOUD TEST - STEP 1: Create Users in PRODUCTION Supabase
 */

import { createClient } from '@supabase/supabase-js';

// CLOUD URLs (not local!)
const supabaseUrl = 'https://zytxwdgzjqrcmbnpgofj.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5dHh3ZGd6anFyY21ibnBnb2ZqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDk4NjY0MiwiZXhwIjoyMDc2NTYyNjQyfQ.uC4X8zC-XtPNfQC0m7aKEoYO8DtCtbT4kZ67QGI-1A4';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

console.log('🌐 CLOUD TEST - STEP 1: Create Users in PRODUCTION\n');
console.log('🔗 Supabase URL:', supabaseUrl);
console.log();

const usuarios = [
  {
    email: 'carlos.diamante@teste.cloud',
    password: 'senha123teste',
    user_metadata: { nome: 'Carlos Diamante' },
    email_confirm: true
  },
  {
    email: 'maria.ouro@teste.cloud',
    password: 'senha123teste',
    user_metadata: { nome: 'Maria Ouro' },
    email_confirm: true
  },
  {
    email: 'joao.bronze@teste.cloud',
    password: 'senha123teste',
    user_metadata: { nome: 'João Bronze' },
    email_confirm: true
  }
];

console.log('👤 Creating users in CLOUD Supabase Auth...\n');

const createdUsers = [];

for (const usuario of usuarios) {
  const { data, error } = await supabase.auth.admin.createUser({
    email: usuario.email,
    password: usuario.password,
    email_confirm: usuario.email_confirm,
    user_metadata: usuario.user_metadata
  });

  if (error) {
    // Se já existe, buscar o usuário
    if (error.message.includes('already registered')) {
      console.log(`   ⚠️  ${usuario.email} já existe, buscando...`);

      const { data: users } = await supabase.auth.admin.listUsers();
      const existingUser = users.users.find(u => u.email === usuario.email);

      if (existingUser) {
        createdUsers.push(existingUser);
        console.log(`   ✅ ${usuario.user_metadata.nome} (${existingUser.email})`);
      }
    } else {
      console.error(`   ❌ Erro ao criar ${usuario.email}:`, error.message);
    }
  } else {
    createdUsers.push(data.user);
    console.log(`   ✅ ${usuario.user_metadata.nome} (${data.user.email})`);
  }
}

console.log();
console.log('═══════════════════════════════════════════════════════════════');
console.log('✅ STEP 1 COMPLETE - USERS IN CLOUD!');
console.log('═══════════════════════════════════════════════════════════════');
console.log();
console.log('📊 CREATED USERS IN PRODUCTION:');
console.log();

for (const user of createdUsers) {
  console.log(`  📧 ${user.email}`);
  console.log(`     ID: ${user.id}`);
  console.log(`     Nome: ${user.user_metadata.nome}`);
  console.log();
}

console.log('═══════════════════════════════════════════════════════════════');
console.log();
console.log('📝 NEXT STEP:');
console.log('   Execute: node test-cloud-step-2-create-network.mjs');
console.log();

// Save IDs for next script
import fs from 'fs/promises';
await fs.writeFile('cloud-scenario-data.json', JSON.stringify({
  users: createdUsers.map(u => ({
    id: u.id,
    email: u.email,
    nome: u.user_metadata.nome
  }))
}, null, 2));

console.log('💾 User IDs saved to: cloud-scenario-data.json');
console.log();
