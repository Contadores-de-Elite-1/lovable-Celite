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

-- 1. Criar profiles (required para auth.users)
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

-- 2. Criar contadores (AJUSTADO: sem nome/email, apenas colunas reais)
-- Colunas: id, user_id, nivel, status, clientes_ativos, xp, created_at, updated_at
INSERT INTO public.contadores (
  id, user_id, nivel, status, clientes_ativos, xp, created_at, updated_at
) VALUES (
  :contador_id_1,
  :user_id_1,
  'bronze'::nivel_contador,
  'ativo'::status_contador,
  1,
  0,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.contadores (
  id, user_id, nivel, status, clientes_ativos, xp, created_at, updated_at
) VALUES (
  :contador_id_2,
  :user_id_2,
  'prata'::nivel_contador,
  'ativo'::status_contador,
  5,
  0,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- 3. Criar clientes (AJUSTADO: usar colunas reais + asaas_customer_id para webhooks)
-- Colunas: id, contador_id, nome_empresa, cnpj, contato_nome, contato_email, plano, valor_mensal, status, asaas_customer_id
INSERT INTO public.clientes (
  id, contador_id, nome_empresa, cnpj, contato_nome, contato_email, plano, valor_mensal, status, asaas_customer_id, data_ativacao, created_at, updated_at
) VALUES (
  :cliente_id_1,
  :contador_id_1,
  'Empresa Teste 1',
  '12345678000100',
  'Contato 1',
  'contato1@test.local',
  'profissional'::tipo_plano,
  1000.00,
  'ativo'::status_cliente,
  'cust_test_001',
  '2025-10-01',
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.clientes (
  id, contador_id, nome_empresa, cnpj, contato_nome, contato_email, plano, valor_mensal, status, asaas_customer_id, data_ativacao, created_at, updated_at
) VALUES (
  :cliente_id_2,
  :contador_id_2,
  'Empresa Teste 2',
  '12345678000102',
  'Contato 2',
  'contato2@test.local',
  'profissional'::tipo_plano,
  1000.00,
  'ativo'::status_cliente,
  'cust_test_002',
  '2025-10-01',
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- 4. Criar pagamentos de teste (AJUSTADO: usar colunas reais)
-- Colunas: id, cliente_id, tipo, competencia, valor_bruto, valor_liquido, status
INSERT INTO public.pagamentos (
  id, cliente_id, tipo, competencia, valor_bruto, valor_liquido, status, created_at, updated_at
) VALUES (
  :pagamento_id_1,
  :cliente_id_1,
  'ativacao'::tipo_pagamento,
  '2025-11-01'::date,
  1000.00,
  1000.00,
  'pago'::status_pagamento,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.pagamentos (
  id, cliente_id, tipo, competencia, valor_bruto, valor_liquido, status, created_at, updated_at
) VALUES (
  :pagamento_id_2,
  :cliente_id_2,
  'ativacao'::tipo_pagamento,
  '2025-11-01'::date,
  1000.00,
  1000.00,
  'pago'::status_pagamento,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

\echo '✓ Seed idempotente aplicado com sucesso!'
\echo 'Contadores: 550e8400-e29b-41d4-a716-446655440001 e 550e8400-e29b-41d4-a716-446655440002'
\echo 'Clientes: 550e8400-e29b-41d4-a716-446655440011 e 550e8400-e29b-41d4-a716-446655440012'
\echo 'Pagamentos: 550e8400-e29b-41d4-a716-446655440021 e 550e8400-e29b-41d4-a716-446655440022'
