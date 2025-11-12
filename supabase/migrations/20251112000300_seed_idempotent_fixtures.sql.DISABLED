-- =============================================================================
-- MIGRATION: Seed Idempotente com UUIDs Fixos
-- Descrição: Insere dados mínimos para testes com idempotência garantida
-- =============================================================================

-- IDs fixos para testes (NUNCA ALTERAR)
-- Estes UUIDs são usados nos testes de integração
DO $$
DECLARE
  v_contador_id_1 CONSTANT uuid := '550e8400-e29b-41d4-a716-446655440001'::uuid;
  v_contador_id_2 CONSTANT uuid := '550e8400-e29b-41d4-a716-446655440002'::uuid;
  v_cliente_id_1 CONSTANT uuid := '550e8400-e29b-41d4-a716-446655440011'::uuid;
  v_cliente_id_2 CONSTANT uuid := '550e8400-e29b-41d4-a716-446655440012'::uuid;
  v_pagamento_id_1 CONSTANT uuid := '550e8400-e29b-41d4-a716-446655440021'::uuid;
  v_pagamento_id_2 CONSTANT uuid := '550e8400-e29b-41d4-a716-446655440022'::uuid;
  v_user_id_1 CONSTANT uuid := '550e8400-e29b-41d4-a716-446655440101'::uuid;
  v_user_id_2 CONSTANT uuid := '550e8400-e29b-41d4-a716-446655440102'::uuid;
BEGIN

  -- 1. Criar usuários no auth.users se não existirem
  INSERT INTO auth.users (
    id,
    email,
    email_confirmed_at,
    raw_user_meta_data,
    created_at,
    updated_at
  ) VALUES (
    v_user_id_1,
    'contador1@test.local',
    NOW(),
    jsonb_build_object('nome', 'Contador Teste 1', 'role', 'contador'),
    NOW(),
    NOW()
  ) ON CONFLICT (id) DO NOTHING;

  INSERT INTO auth.users (
    id,
    email,
    email_confirmed_at,
    raw_user_meta_data,
    created_at,
    updated_at
  ) VALUES (
    v_user_id_2,
    'contador2@test.local',
    NOW(),
    jsonb_build_object('nome', 'Contador Teste 2', 'role', 'contador'),
    NOW(),
    NOW()
  ) ON CONFLICT (id) DO NOTHING;

  -- 2. Criar profiles
  INSERT INTO public.profiles (
    id,
    nome,
    email,
    created_at,
    updated_at
  ) VALUES (
    v_user_id_1,
    'Contador Teste 1',
    'contador1@test.local',
    NOW(),
    NOW()
  ) ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.profiles (
    id,
    nome,
    email,
    created_at,
    updated_at
  ) VALUES (
    v_user_id_2,
    'Contador Teste 2',
    'contador2@test.local',
    NOW(),
    NOW()
  ) ON CONFLICT (id) DO NOTHING;

  -- 3. Criar contadores
  INSERT INTO public.contadores (
    id,
    user_id,
    nome,
    email,
    nivel,
    status,
    clientes_ativos,
    xp,
    created_at,
    updated_at
  ) VALUES (
    v_contador_id_1,
    v_user_id_1,
    'Contador Teste 1',
    'contador1@test.local',
    'bronze',
    'ativo',
    0,
    0,
    NOW(),
    NOW()
  ) ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.contadores (
    id,
    user_id,
    nome,
    email,
    nivel,
    status,
    clientes_ativos,
    xp,
    created_at,
    updated_at
  ) VALUES (
    v_contador_id_2,
    v_user_id_2,
    'Contador Teste 2',
    'contador2@test.local',
    'bronze',
    'ativo',
    0,
    0,
    NOW(),
    NOW()
  ) ON CONFLICT (id) DO NOTHING;

  -- 4. Criar clientes
  INSERT INTO public.clientes (
    id,
    contador_id,
    nome,
    cnpj,
    email,
    status,
    plano,
    created_at,
    updated_at
  ) VALUES (
    v_cliente_id_1,
    v_contador_id_1,
    'Cliente Teste 1',
    '12345678000100',
    'cliente1@test.local',
    'ativo',
    'standard',
    NOW(),
    NOW()
  ) ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.clientes (
    id,
    contador_id,
    nome,
    cnpj,
    email,
    status,
    plano,
    created_at,
    updated_at
  ) VALUES (
    v_cliente_id_2,
    v_contador_id_2,
    'Cliente Teste 2',
    '12345678000102',
    'cliente2@test.local',
    'ativo',
    'standard',
    NOW(),
    NOW()
  ) ON CONFLICT (id) DO NOTHING;

  -- 5. Criar pagamentos de teste
  INSERT INTO public.pagamentos (
    id,
    cliente_id,
    valor,
    tipo,
    status,
    competencia,
    created_at,
    updated_at
  ) VALUES (
    v_pagamento_id_1,
    v_cliente_id_1,
    1000.00,
    'ativacao',
    'pago',
    '2025-11-01'::date,
    NOW(),
    NOW()
  ) ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.pagamentos (
    id,
    cliente_id,
    valor,
    tipo,
    status,
    competencia,
    created_at,
    updated_at
  ) VALUES (
    v_pagamento_id_2,
    v_cliente_id_2,
    1000.00,
    'ativacao',
    'pago',
    '2025-11-01'::date,
    NOW(),
    NOW()
  ) ON CONFLICT (id) DO NOTHING;

END $$;

-- 6. Log de sucesso
DO $$
BEGIN
  RAISE NOTICE 'Seed idempotente concluído: contadores, clientes e pagamentos de teste criados/atualizados';
END $$;
