-- ============================================================================
-- SEED IDEMPOTENTE PARA DESENVOLVIMENTO LOCAL
-- ============================================================================
-- Execute isto após as migrations serem aplicadas
-- Comando: psql -h localhost -U postgres -d postgres -f supabase/scripts/seed.sql

-- IDs fixos para testes (mantém-se consistente entre execuções)
\set contador_id_1 '550e8400-e29b-41d4-a716-446655440001'
\set contador_id_2 '550e8400-e29b-41d4-a716-446655440002'
\set cliente_id_1 '550e8400-e29b-41d4-a716-446655440011'
\set cliente_id_2 '550e8400-e29b-41d4-a716-446655440012'
\set pagamento_id_1 '550e8400-e29b-41d4-a716-446655440021'
\set pagamento_id_2 '550e8400-e29b-41d4-a716-446655440022'
\set user_id_1 '550e8400-e29b-41d4-a716-446655440101'
\set user_id_2 '550e8400-e29b-41d4-a716-446655440102'

-- 1. Criar profiles
INSERT INTO public.profiles (
  id, nome, email, created_at, updated_at
) VALUES (
  :user_id_1,
  'Contador Teste 1',
  'contador1@test.local',
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.profiles (
  id, nome, email, created_at, updated_at
) VALUES (
  :user_id_2,
  'Contador Teste 2',
  'contador2@test.local',
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- 2. Criar contadores
INSERT INTO public.contadores (
  id, user_id, nome, email, nivel, status, clientes_ativos, xp, created_at, updated_at
) VALUES (
  :contador_id_1,
  :user_id_1,
  'Contador Teste 1',
  'contador1@test.local',
  'bronze',
  'ativo',
  1,
  0,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.contadores (
  id, user_id, nome, email, nivel, status, clientes_ativos, xp, created_at, updated_at
) VALUES (
  :contador_id_2,
  :user_id_2,
  'Contador Teste 2',
  'contador2@test.local',
  'prata',
  'ativo',
  5,
  0,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- 3. Criar clientes
INSERT INTO public.clientes (
  id, contador_id, nome, cnpj, email, status, plano, created_at, updated_at
) VALUES (
  :cliente_id_1,
  :contador_id_1,
  'Cliente Teste 1',
  '12345678000100',
  'cliente1@test.local',
  'ativo',
  'standard',
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.clientes (
  id, contador_id, nome, cnpj, email, status, plano, created_at, updated_at
) VALUES (
  :cliente_id_2,
  :contador_id_2,
  'Cliente Teste 2',
  '12345678000102',
  'cliente2@test.local',
  'ativo',
  'standard',
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- 4. Criar pagamentos de teste
INSERT INTO public.pagamentos (
  id, cliente_id, valor, tipo, status, competencia, created_at, updated_at
) VALUES (
  :pagamento_id_1,
  :cliente_id_1,
  1000.00,
  'ativacao',
  'pago',
  '2025-11-01'::date,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.pagamentos (
  id, cliente_id, valor, tipo, status, competencia, created_at, updated_at
) VALUES (
  :pagamento_id_2,
  :cliente_id_2,
  1000.00,
  'ativacao',
  'pago',
  '2025-11-01'::date,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

\echo '✓ Seed idempotente aplicado com sucesso!'
\echo 'Contadores: 550e8400-e29b-41d4-a716-446655440001 e 550e8400-e29b-41d4-a716-446655440002'
\echo 'Clientes: 550e8400-e29b-41d4-a716-446655440011 e 550e8400-e29b-41d4-a716-446655440012'
\echo 'Pagamentos: 550e8400-e29b-41d4-a716-446655440021 e 550e8400-e29b-41d4-a716-446655440022'
