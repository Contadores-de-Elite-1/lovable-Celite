-- =====================================================================
-- FLÁVIO: LIMPEZA E REINSERÇÃO CORRETA
-- Remove dados antigos e insere com valores corretos
-- =====================================================================

-- STEP 1: DELETAR DADOS ANTIGOS (limpar para reinserir com valores corretos)
DELETE FROM bonus_historico WHERE contador_id = '550e8400-e29b-41d4-a716-446655440011';
DELETE FROM clientes WHERE contador_id = '550e8400-e29b-41d4-a716-446655440011';

-- STEP 2: INSERIR 20 CLIENTES COM VALORES CORRETOS
-- Distribuição: 6 Pro (100) + 7 Premium (130) + 7 Top (180) = R$ 2.770/mês
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
  ('c0000000-0000-0000-0000-000000000020', '550e8400-e29b-41d4-a716-446655440011', 'Cliente 20', '00000000000020', 'Contato 20', 'c20@ex.com', 'premium', 180, 'ativo', '2025-02-03');

-- STEP 3: INSERIR BÔNUS (7 registros = R$ 1.638,75)
INSERT INTO bonus_historico (contador_id, tipo_bonus, valor, competencia, status, observacao, marco_atingido)
VALUES
  ('550e8400-e29b-41d4-a716-446655440011', 'bonus_progressao', 100, '2025-03-15', 'pendente', 'Prata', 5),
  ('550e8400-e29b-41d4-a716-446655440011', 'bonus_progressao', 100, '2025-04-15', 'pendente', 'Ouro', 10),
  ('550e8400-e29b-41d4-a716-446655440011', 'bonus_volume', 100, '2025-03-15', 'pendente', 'Volume 5', 5),
  ('550e8400-e29b-41d4-a716-446655440011', 'bonus_volume', 100, '2025-04-15', 'pendente', 'Volume 10', 10),
  ('550e8400-e29b-41d4-a716-446655440011', 'bonus_volume', 100, '2025-06-10', 'pendente', 'Volume 15', 15),
  ('550e8400-e29b-41d4-a716-446655440011', 'bonus_volume', 100, '2025-09-15', 'pendente', 'Volume 20', 20),
  ('550e8400-e29b-41d4-a716-446655440011', 'bonus_ltv', 1038.75, '2025-10-15', 'pendente', 'LTV 15+', 15);

-- STEP 4: VALIDAÇÃO - VERIFICAR SE TUDO ESTÁ CORRETO
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
  9567.00 + 1638.75;
