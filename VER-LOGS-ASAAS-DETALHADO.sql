-- ============================================================================
-- VER LOGS DETALHADOS DO ASAAS - POR QUE NAO PROCESSOU?
-- ============================================================================

-- 1. VER TODOS OS AUDIT LOGS DE WEBHOOK ASAAS
SELECT
  '=== AUDIT LOGS ASAAS ===' as secao,
  acao,
  tabela,
  registro_id,
  payload,
  created_at
FROM audit_logs
WHERE acao LIKE '%ASAAS%'
ORDER BY created_at DESC
LIMIT 5;

-- 2. VER SE TEM PAGAMENTOS ASAAS
SELECT
  '=== PAGAMENTOS ASAAS ===' as secao,
  id,
  tipo,
  valor_bruto,
  status,
  asaas_payment_id,
  created_at
FROM pagamentos
WHERE asaas_payment_id IS NOT NULL
ORDER BY created_at DESC
LIMIT 5;

-- 3. VER SE TEM PAGAMENTOS STRIPE
SELECT
  '=== PAGAMENTOS STRIPE ===' as secao,
  id,
  tipo,
  valor_bruto,
  status,
  stripe_payment_id,
  order_id,
  created_at
FROM pagamentos
WHERE stripe_payment_id IS NOT NULL
ORDER BY created_at DESC
LIMIT 5;

-- 4. CONTAR TOTAIS
SELECT
  '=== TOTAIS ===' as secao,
  (SELECT COUNT(*) FROM pagamentos WHERE asaas_payment_id IS NOT NULL) as total_asaas,
  (SELECT COUNT(*) FROM pagamentos WHERE stripe_payment_id IS NOT NULL) as total_stripe,
  (SELECT COUNT(*) FROM pagamentos) as total_geral;

-- 5. VER CLIENTES CRIADOS
SELECT
  '=== CLIENTES CRIADOS ===' as secao,
  id,
  nome_empresa,
  asaas_customer_id,
  status,
  created_at
FROM clientes
ORDER BY created_at DESC
LIMIT 5;
