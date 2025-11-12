-- ============================================================================
-- MOCK DATA SETUP - Teste completo de jornada de contador
-- ============================================================================
-- Este script cria:
-- 1. Usuário fictício (será o contador)
-- 2. Contador fictício
-- 3. 2 Clientes fictícios
-- 4. Pagamentos fictícios para testar bônus

-- NOTE: Este script usa dados fictícios. Em produção, crie via interface.

-- ============================================================================
-- 1. INSERIR CONTADOR FICTÍCIO
-- ============================================================================

-- Assumindo que já existe user_id via auth
-- Vamos inserir apenas o contador com user_id fictício

INSERT INTO contadores (
  id,
  user_id,
  nivel,
  status,
  crc,
  data_ingresso,
  clientes_ativos,
  xp
) VALUES (
  '550e8400-e29b-41d4-a716-446655440000'::uuid,
  '550e8400-e29b-41d4-a716-446655440001'::uuid,
  'bronze',
  'ativo',
  'CRC123456',
  '2025-10-01',
  2,
  0
) ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 2. INSERIR CLIENTES FICTÍCIOS
-- ============================================================================

INSERT INTO clientes (
  id,
  contador_id,
  nome_empresa,
  cnpj,
  asaas_customer_id,
  data_ativacao,
  status
) VALUES
(
  '650e8400-e29b-41d4-a716-446655440000'::uuid,
  '550e8400-e29b-41d4-a716-446655440000'::uuid,
  'Empresa Teste 1 LTDA',
  '12345678000100',
  'cust_mock_001',
  '2025-10-01',
  'ativo'
),
(
  '650e8400-e29b-41d4-a716-446655440001'::uuid,
  '550e8400-e29b-41d4-a716-446655440000'::uuid,
  'Empresa Teste 2 LTDA',
  '12345678000101',
  'cust_mock_002',
  '2025-10-15',
  'ativo'
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 3. INSERIR PAGAMENTOS FICTÍCIOS (simula ASAAS)
-- ============================================================================

INSERT INTO pagamentos (
  id,
  cliente_id,
  tipo,
  valor_bruto,
  valor_liquido,
  competencia,
  status,
  asaas_payment_id,
  asaas_event_id,
  pago_em
) VALUES
(
  '750e8400-e29b-41d4-a716-446655440000'::uuid,
  '650e8400-e29b-41d4-a716-446655440000'::uuid,
  'ativacao',
  1000.00,
  950.00,
  '2025-10-01',
  'confirmed',
  'asaas_mock_001',
  'PAYMENT_CONFIRMED',
  now()
),
(
  '750e8400-e29b-41d4-a716-446655440001'::uuid,
  '650e8400-e29b-41d4-a716-446655440000'::uuid,
  'mensalidade',
  500.00,
  475.00,
  '2025-11-01',
  'confirmed',
  'asaas_mock_002',
  'PAYMENT_CONFIRMED',
  now()
),
(
  '750e8400-e29b-41d4-a716-446655440002'::uuid,
  '650e8400-e29b-41d4-a716-446655440001'::uuid,
  'ativacao',
  800.00,
  760.00,
  '2025-10-15',
  'confirmed',
  'asaas_mock_003',
  'PAYMENT_CONFIRMED',
  now()
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- RESULTADO
-- ============================================================================

SELECT
  'Dados fictícios inseridos com sucesso!' as status,
  (SELECT COUNT(*) FROM contadores WHERE id = '550e8400-e29b-41d4-a716-446655440000'::uuid) as contadores_criados,
  (SELECT COUNT(*) FROM clientes WHERE contador_id = '550e8400-e29b-41d4-a716-446655440000'::uuid) as clientes_criados,
  (SELECT COUNT(*) FROM pagamentos WHERE asaas_payment_id LIKE 'asaas_mock_%') as pagamentos_criados;
