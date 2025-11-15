-- ============================================================================
-- DEBUG: POR QUE WEBHOOK 200 NAO CRIOU REGISTROS?
-- ============================================================================

-- 1. VER TODOS OS AUDIT LOGS DO WEBHOOK (últimos 30 min)
SELECT
  '=== TODOS AUDIT LOGS WEBHOOK ===' as secao,
  acao,
  tabela,
  payload,
  created_at
FROM audit_logs
WHERE acao LIKE '%WEBHOOK%'
  AND created_at > NOW() - INTERVAL '30 minutes'
ORDER BY created_at DESC;

-- 2. VER SE TEM WEBHOOK_LOGS (tabela específica)
SELECT
  '=== WEBHOOK_LOGS (se existir) ===' as secao,
  *
FROM webhook_logs
WHERE created_at > NOW() - INTERVAL '30 minutes'
ORDER BY created_at DESC;

-- 3. VER TODOS OS CLIENTES (ver se algum foi criado)
SELECT
  '=== TODOS OS CLIENTES ===' as secao,
  id,
  nome_empresa,
  asaas_customer_id,
  status,
  created_at
FROM clientes
ORDER BY created_at DESC
LIMIT 10;

-- 4. VER TODOS OS PAGAMENTOS (ver se algum foi criado)
SELECT
  '=== TODOS OS PAGAMENTOS ===' as secao,
  id,
  tipo,
  valor_bruto,
  status,
  asaas_payment_id,
  stripe_payment_id,
  created_at
FROM pagamentos
ORDER BY created_at DESC
LIMIT 10;

-- 5. CONTAR POR TIPO
SELECT
  '=== CONTAGEM POR TIPO ===' as secao,
  COUNT(*) FILTER (WHERE asaas_payment_id IS NOT NULL) as pagamentos_asaas,
  COUNT(*) FILTER (WHERE stripe_payment_id IS NOT NULL) as pagamentos_stripe,
  COUNT(*) as total_pagamentos
FROM pagamentos;
