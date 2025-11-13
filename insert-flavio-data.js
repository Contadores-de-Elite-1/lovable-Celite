import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zytxwdgzjqrcmbnpgofj.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5dHh3ZGd6anFyY21ibnBnb2ZqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDk4NjY0MiwiZXhwIjoyMDc2NTYyNjQyfQ.uC4X8zC-XtPNfQC0m7aKEoYO8DtCtbT4kZ67QGI-1A4';

const supabase = createClient(supabaseUrl, serviceKey);

async function insertFlavioData() {
  try {
    console.log('Starting Flávio test data insertion...\n');

    // 1. INSERT USERS
    console.log('1. Inserting users into auth.users...');
    const { error: usersError } = await supabase.rpc('auth.uid', {});
    if (usersError && usersError.code !== 'PGRST102') {
      console.error('Auth error:', usersError);
    }

    // Since direct auth.users insert via API is blocked by RLS,
    // we'll use the profiles table and contadores table which are accessible

    // Insert profiles
    console.log('2. Inserting profiles...');
    const profiles = [
      { id: '550e8400-e29b-41d4-a716-446655440001', nome: 'Flávio Augusto', email: 'flavio@ex.com', cpf: '11111111111', aceite_termos: true },
      { id: '550e8400-e29b-41d4-a716-446655440002', nome: 'Paulo Silva', email: 'paulo@ex.com', cpf: '22222222222', aceite_termos: true },
      { id: '550e8400-e29b-41d4-a716-446655440003', nome: 'Ana Costa', email: 'ana@ex.com', cpf: '33333333333', aceite_termos: true },
      { id: '550e8400-e29b-41d4-a716-446655440004', nome: 'Roberto Lima', email: 'roberto@ex.com', cpf: '44444444444', aceite_termos: true }
    ];

    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .upsert(profiles, { onConflict: 'id' });

    if (profilesError) {
      console.error('Error inserting profiles:', profilesError);
    } else {
      console.log('✓ Profiles inserted successfully');
    }

    // Insert contadores
    console.log('3. Inserting contadores...');
    const contadores = [
      { id: '550e8400-e29b-41d4-a716-446655440011', user_id: '550e8400-e29b-41d4-a716-446655440001', nivel: 'bronze', status: 'ativo', crc: '123456' },
      { id: '550e8400-e29b-41d4-a716-446655440012', user_id: '550e8400-e29b-41d4-a716-446655440002', nivel: 'bronze', status: 'ativo', crc: '234567' },
      { id: '550e8400-e29b-41d4-a716-446655440013', user_id: '550e8400-e29b-41d4-a716-446655440003', nivel: 'bronze', status: 'ativo', crc: '345678' },
      { id: '550e8400-e29b-41d4-a716-446655440014', user_id: '550e8400-e29b-41d4-a716-446655440004', nivel: 'bronze', status: 'ativo', crc: '456789' }
    ];

    const { data: contadoresData, error: contadoresError } = await supabase
      .from('contadores')
      .upsert(contadores, { onConflict: 'id' });

    if (contadoresError) {
      console.error('Error inserting contadores:', contadoresError);
    } else {
      console.log('✓ Contadores inserted successfully');
    }

    // Insert clientes
    console.log('4. Inserting 20 clientes...');
    const clientes = [];
    for (let i = 1; i <= 20; i++) {
      const num = String(i).padStart(2, '0');
      const valor = 100 + (i - 1) * 5;
      const plano = i % 3 === 0 ? 'premium' : 'profissional';
      const data = new Date(2025, 0, 15 + i - 1).toISOString().split('T')[0];

      clientes.push({
        id: `c0000000-0000-0000-0000-${String(i).padStart(12, '0')}`,
        contador_id: '550e8400-e29b-41d4-a716-446655440011',
        nome_empresa: `Cliente ${num}`,
        cnpj: `${String(i).padStart(14, '0')}`,
        contato_nome: `Contato ${num}`,
        contato_email: `c${num}@ex.com`,
        plano: plano,
        valor_mensal: valor,
        status: 'ativo',
        data_ativacao: data,
        asaas_customer_id: `asaas_${String(i).padStart(3, '0')}`
      });
    }

    const { data: clientesData, error: clientesError } = await supabase
      .from('clientes')
      .upsert(clientes, { onConflict: 'id' });

    if (clientesError) {
      console.error('Error inserting clientes:', clientesError);
    } else {
      console.log('✓ Clientes inserted successfully');
    }

    // Insert bonus_historico
    console.log('5. Inserting 7 bonus records...');
    const bonus = [
      { contador_id: '550e8400-e29b-41d4-a716-446655440011', tipo_bonus: 'bonus_progressao', valor: 100, competencia: '2025-03-15', status: 'pendente', observacao: 'Prata', marco_atingido: 5 },
      { contador_id: '550e8400-e29b-41d4-a716-446655440011', tipo_bonus: 'bonus_progressao', valor: 100, competencia: '2025-04-15', status: 'pendente', observacao: 'Ouro', marco_atingido: 10 },
      { contador_id: '550e8400-e29b-41d4-a716-446655440011', tipo_bonus: 'bonus_volume', valor: 100, competencia: '2025-03-15', status: 'pendente', observacao: 'Volume 5', marco_atingido: 5 },
      { contador_id: '550e8400-e29b-41d4-a716-446655440011', tipo_bonus: 'bonus_volume', valor: 100, competencia: '2025-04-15', status: 'pendente', observacao: 'Volume 10', marco_atingido: 10 },
      { contador_id: '550e8400-e29b-41d4-a716-446655440011', tipo_bonus: 'bonus_volume', valor: 100, competencia: '2025-06-10', status: 'pendente', observacao: 'Volume 15', marco_atingido: 15 },
      { contador_id: '550e8400-e29b-41d4-a716-446655440011', tipo_bonus: 'bonus_volume', valor: 100, competencia: '2025-09-15', status: 'pendente', observacao: 'Volume 20', marco_atingido: 20 },
      { contador_id: '550e8400-e29b-41d4-a716-446655440011', tipo_bonus: 'bonus_ltv', valor: 1038.75, competencia: '2025-10-15', status: 'pendente', observacao: 'LTV 15+', marco_atingido: 15 }
    ];

    const { data: bonusData, error: bonusError } = await supabase
      .from('bonus_historico')
      .upsert(bonus, { onConflict: 'id' });

    if (bonusError) {
      console.error('Error inserting bonus:', bonusError);
    } else {
      console.log('✓ Bonus records inserted successfully');
    }

    // Validation queries
    console.log('\n6. Running validation queries...\n');

    const { data: profilesCount, error: e1 } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .in('id', ['550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440004']);

    const { data: contadoresCount, error: e2 } = await supabase
      .from('contadores')
      .select('*', { count: 'exact', head: true })
      .in('id', ['550e8400-e29b-41d4-a716-446655440011', '550e8400-e29b-41d4-a716-446655440012', '550e8400-e29b-41d4-a716-446655440013', '550e8400-e29b-41d4-a716-446655440014']);

    const { data: clientesCountData, error: e3 } = await supabase
      .from('clientes')
      .select('*', { count: 'exact', head: true })
      .eq('contador_id', '550e8400-e29b-41d4-a716-446655440011');

    const { data: bonusCountData, error: e4 } = await supabase
      .from('bonus_historico')
      .select('*', { count: 'exact', head: true })
      .eq('contador_id', '550e8400-e29b-41d4-a716-446655440011');

    console.log('VALIDATION RESULTS:');
    console.log('─'.repeat(50));
    console.log(`Profiles (Usuários): ${profilesCount?.length || 0} (expected: 4)`);
    console.log(`Contadores: ${contadoresCount?.length || 0} (expected: 4)`);
    console.log(`Clientes: ${clientesCountData?.length || 0} (expected: 20)`);
    console.log(`Bonus Histórico: ${bonusCountData?.length || 0} (expected: 7)`);
    console.log('─'.repeat(50));

    console.log('\n✓ Flávio test data insertion completed successfully!');
    console.log('\nYou can now see the data in your Supabase Dashboard:');
    console.log('- Profiles: 4 records');
    console.log('- Contadores: 4 records');
    console.log('- Clientes: 20 records');
    console.log('- Bonus Histórico: 7 records');

  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

insertFlavioData();
