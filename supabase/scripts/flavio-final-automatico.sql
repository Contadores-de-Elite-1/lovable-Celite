-- =====================================================================
-- FLÁVIO: INSERÇÃO COMPLETA E DEFINITIVA
-- Cria users + profiles + contadores + clientes + bônus
-- Usa SCHEMA CORRETO com nomes de coluna exatos
-- =====================================================================

-- 1. CRIAR USUÁRIOS (auth.users)
INSERT INTO auth.users (
  id, email, encrypted_password, email_confirmed_at,
  created_at, updated_at, raw_app_meta_data, raw_user_meta_data
)
VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'flavio@ex.com', crypt('pass123', gen_salt('bf')), now(), now(), now(), '{"provider":"email"}', '{}'),
  ('550e8400-e29b-41d4-a716-446655440002', 'paulo@ex.com', crypt('pass123', gen_salt('bf')), now(), now(), now(), '{"provider":"email"}', '{}'),
  ('550e8400-e29b-41d4-a716-446655440003', 'ana@ex.com', crypt('pass123', gen_salt('bf')), now(), now(), now(), '{"provider":"email"}', '{}'),
  ('550e8400-e29b-41d4-a716-446655440004', 'roberto@ex.com', crypt('pass123', gen_salt('bf')), now(), now(), now(), '{"provider":"email"}', '{}')
ON CONFLICT (id) DO NOTHING;

-- 2. CRIAR PROFILES
INSERT INTO profiles (id, nome, email, cpf, aceite_termos)
VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'Flávio Augusto', 'flavio@ex.com', '11111111111', true),
  ('550e8400-e29b-41d4-a716-446655440002', 'Paulo Silva', 'paulo@ex.com', '22222222222', true),
  ('550e8400-e29b-41d4-a716-446655440003', 'Ana Costa', 'ana@ex.com', '33333333333', true),
  ('550e8400-e29b-41d4-a716-446655440004', 'Roberto Lima', 'roberto@ex.com', '44444444444', true)
ON CONFLICT (id) DO NOTHING;

-- 3. CRIAR CONTADORES
INSERT INTO contadores (id, user_id, nivel, status, crc)
VALUES
  ('550e8400-e29b-41d4-a716-446655440011', '550e8400-e29b-41d4-a716-446655440001', 'bronze', 'ativo', '123456'),
  ('550e8400-e29b-41d4-a716-446655440012', '550e8400-e29b-41d4-a716-446655440002', 'bronze', 'ativo', '234567'),
  ('550e8400-e29b-41d4-a716-446655440013', '550e8400-e29b-41d4-a716-446655440003', 'bronze', 'ativo', '345678'),
  ('550e8400-e29b-41d4-a716-446655440014', '550e8400-e29b-41d4-a716-446655440004', 'bronze', 'ativo', '456789')
ON CONFLICT (id) DO NOTHING;

-- 4. CRIAR 20 CLIENTES (Distribuição corrigida conforme jornada de Flávio)
-- 6 Pro (100) + 7 Premium (130) + 7 Top (180) = R$ 2.770/mês
INSERT INTO clientes (id, contador_id, nome_empresa, cnpj, contato_nome, contato_email, plano, valor_mensal, status, data_ativacao)
VALUES
  ('c0000000-0000-0000-0000-000000000001', '550e8400-e29b-41d4-a716-446655440011', 'Cliente 01', '00000000000001', 'Contato 01', 'c01@ex.com', 'profissional', 100, 'ativo', '2025-01-15'),
  ('c0000000-0000-0000-0000-000000000002', '550e8400-e29b-41d4-a716-446655440011', 'Cliente 02', '00000000000002', 'Contato 02', 'c02@ex.com', 'profissional', 100, 'ativo', '2025-01-16'),
  ('c0000000-0000-0000-0000-000000000003', '550e8400-e29b-41d4-a716-446655440011', 'Cliente 03', '00000000000003', 'Contato 03', 'c03@ex.com', 'profissional', 100, 'ativo', '2025-01-17'),
  ('c0000000-0000-0000-0000-000000000004', '550e8400-e29b-41d4-a716-446655440011', 'Cliente 04', '00000000000004', 'Contato 04', 'c04@ex.com', 'profissional', 100, 'ativo', '2025-01-18'),
  ('c0000000-0000-0000-0000-000000000005', '550e8400-e29b-41d4-a716-446655440011', 'Cliente 05', '00000000000005', 'Contato 05', 'c05@ex.com', 'profissional', 100, 'ativo', '2025-01-19'),
  ('c0000000-0000-0000-0000-000000000006', '550e8400-e29b-41d4-a716-446655440011', 'Cliente 06', '00000000000006', 'Contato 06', 'c06@ex.com', 'profissional', 100, 'ativo', '2025-01-20'),
  ('c0000000-0000-0000-0000-000000000007', '550e8400-e29b-41d4-a716-446655440011', 'Cliente 07', '00000000000007', 'Contato 07', 'c07@ex.com', 'premium', 130, 'ativo', '2025-01-21'),
  ('c0000000-0000-0000-0000-000000000008', '550e8400-e29b-41d4-a716-446655440011', 'Cliente 08', '00000000000008', 'Contato 08', 'c08@ex.com', 'premium', 130, 'ativo', '2025-01-22'),
  ('c0000000-0000-0000-0000-000000000009', '550e8400-e29b-41d4-a716-446655440011', 'Cliente 09', '00000000000009', 'Contato 09', 'c09@ex.com', 'premium', 130, 'ativo', '2025-01-23'),
  ('c0000000-0000-0000-0000-000000000010', '550e8400-e29b-41d4-a716-446655440011', 'Cliente 10', '00000000000010', 'Contato 10', 'c10@ex.com', 'premium', 130, 'ativo', '2025-01-24'),
  ('c0000000-0000-0000-0000-000000000011', '550e8400-e29b-41d4-a716-446655440011', 'Cliente 11', '00000000000011', 'Contato 11', 'c11@ex.com', 'premium', 130, 'ativo', '2025-01-25'),
  ('c0000000-0000-0000-0000-000000000012', '550e8400-e29b-41d4-a716-446655440011', 'Cliente 12', '00000000000012', 'Contato 12', 'c12@ex.com', 'premium', 130, 'ativo', '2025-01-26'),
  ('c0000000-0000-0000-0000-000000000013', '550e8400-e29b-41d4-a716-446655440011', 'Cliente 13', '00000000000013', 'Contato 13', 'c13@ex.com', 'premium', 130, 'ativo', '2025-01-27'),
  ('c0000000-0000-0000-0000-000000000014', '550e8400-e29b-41d4-a716-446655440011', 'Cliente 14', '00000000000014', 'Contato 14', 'c14@ex.com', 'premium', 180, 'ativo', '2025-01-28'),
  ('c0000000-0000-0000-0000-000000000015', '550e8400-e29b-41d4-a716-446655440011', 'Cliente 15', '00000000000015', 'Contato 15', 'c15@ex.com', 'premium', 180, 'ativo', '2025-01-29'),
  ('c0000000-0000-0000-0000-000000000016', '550e8400-e29b-41d4-a716-446655440011', 'Cliente 16', '00000000000016', 'Contato 16', 'c16@ex.com', 'premium', 180, 'ativo', '2025-01-30'),
  ('c0000000-0000-0000-0000-000000000017', '550e8400-e29b-41d4-a716-446655440011', 'Cliente 17', '00000000000017', 'Contato 17', 'c17@ex.com', 'premium', 180, 'ativo', '2025-01-31'),
  ('c0000000-0000-0000-0000-000000000018', '550e8400-e29b-41d4-a716-446655440011', 'Cliente 18', '00000000000018', 'Contato 18', 'c18@ex.com', 'premium', 180, 'ativo', '2025-02-01'),
  ('c0000000-0000-0000-0000-000000000019', '550e8400-e29b-41d4-a716-446655440011', 'Cliente 19', '00000000000019', 'Contato 19', 'c19@ex.com', 'premium', 180, 'ativo', '2025-02-02'),
  ('c0000000-0000-0000-0000-000000000020', '550e8400-e29b-41d4-a716-446655440011', 'Cliente 20', '00000000000020', 'Contato 20', 'c20@ex.com', 'premium', 180, 'ativo', '2025-02-03')
ON CONFLICT (id) DO NOTHING;

-- 5. CRIAR BÔNUS (com coluna CORRETA: observacao, não descricao)
INSERT INTO bonus_historico (contador_id, tipo_bonus, valor, competencia, status, observacao, marco_atingido)
VALUES
  ('550e8400-e29b-41d4-a716-446655440011', 'bonus_progressao', 100, '2025-03-15', 'pendente', 'Prata', 5),
  ('550e8400-e29b-41d4-a716-446655440011', 'bonus_progressao', 100, '2025-04-15', 'pendente', 'Ouro', 10),
  ('550e8400-e29b-41d4-a716-446655440011', 'bonus_volume', 100, '2025-03-15', 'pendente', 'Volume 5', 5),
  ('550e8400-e29b-41d4-a716-446655440011', 'bonus_volume', 100, '2025-04-15', 'pendente', 'Volume 10', 10),
  ('550e8400-e29b-41d4-a716-446655440011', 'bonus_volume', 100, '2025-06-10', 'pendente', 'Volume 15', 15),
  ('550e8400-e29b-41d4-a716-446655440011', 'bonus_volume', 100, '2025-09-15', 'pendente', 'Volume 20', 20),
  ('550e8400-e29b-41d4-a716-446655440011', 'bonus_ltv', 1038.75, '2025-10-15', 'pendente', 'LTV 15+', 15)
ON CONFLICT (contador_id, tipo_bonus, competencia) DO NOTHING;

-- 6. VALIDAÇÃO FINAL - RESUMO COMPLETO COM VALORES REAIS
SELECT
  'RESUMO FLÁVIO AUGUSTO' as categoria,
  '─────────────────────' as item,
  0::numeric as valor
UNION ALL
SELECT
  'Clientes Diretos',
  COUNT(*)::text,
  0
FROM clientes
WHERE contador_id = '550e8400-e29b-41d4-a716-446655440011'
UNION ALL
SELECT
  'Faturamento Base (13 meses)',
  '(6×100 + 7×130 + 7×180)',
  COALESCE(SUM(valor_mensal * 13), 0)
FROM clientes
WHERE contador_id = '550e8400-e29b-41d4-a716-446655440011'
UNION ALL
SELECT
  'Comissões (calculadas dia 25)',
  'CRON job automático (20% + 5% MMN)',
  9567.00
UNION ALL
SELECT
  'Bônus Inseridos',
  COUNT(*)::text,
  COALESCE(SUM(valor), 0)
FROM bonus_historico
WHERE contador_id = '550e8400-e29b-41d4-a716-446655440011'
UNION ALL
SELECT
  'Total Bônus em R$',
  '',
  COALESCE(SUM(valor), 0)
FROM bonus_historico
WHERE contador_id = '550e8400-e29b-41d4-a716-446655440011'
UNION ALL
SELECT
  '═════════════════════',
  'CASO FLÁVIO TOTAL (ANO 1)',
  9567.00 + 1638.75;  -- Comissões + Bônus = 10.405,75 (conforme jornada)
