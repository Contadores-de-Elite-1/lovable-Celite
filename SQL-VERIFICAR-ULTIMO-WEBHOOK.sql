-- ============================================================================
-- VERIFICAR SE WEBHOOK PROCESSOU A COBRANCA QUE VOCE CRIOU
-- ============================================================================

-- 1. ULTIMO WEBHOOK RECEBIDO (audit_logs)
SELECT
  '=== ULTIMO WEBHOOK RECEBIDO ===' as secao,
  acao,
  payload->>'event' as evento_asaas,
  payload->>'asaas_payment_id' as payment_id,
  payload->>'cliente_id' as cliente_id,
  payload->>'valor_bruto' as valor,
  payload->>'tipo' as tipo_pagamento,
  payload->>'commissions_calculated' as comissoes_ok,
  created_at as quando
FROM audit_logs
WHERE acao IN ('WEBHOOK_ASAAS_PROCESSED', 'WEBHOOK_ASAAS_ERROR', 'WEBHOOK_COMMISSION_ERROR')
ORDER BY created_at DESC
LIMIT 1;

-- 2. CLIENTE CRIADO MAIS RECENTE
SELECT
  '=== ULTIMO CLIENTE CRIADO ===' as secao,
  id,
  nome_empresa,
  asaas_customer_id,
  contador_id,
  status,
  plano,
  valor_mensal,
  created_at as quando
FROM clientes
ORDER BY created_at DESC
LIMIT 1;

-- 3. PAGAMENTO REGISTRADO MAIS RECENTE
SELECT
  '=== ULTIMO PAGAMENTO REGISTRADO ===' as secao,
  id,
  cliente_id,
  tipo,
  valor_bruto,
  valor_liquido,
  status,
  asaas_payment_id,
  asaas_event_id,
  competencia,
  created_at as quando
FROM pagamentos
ORDER BY created_at DESC
LIMIT 1;

-- 4. COMISSOES CALCULADAS MAIS RECENTES
SELECT
  '=== ULTIMAS COMISSOES ===' as secao,
  id,
  pagamento_id,
  contador_id,
  tipo,
  valor,
  percentual,
  status,
  observacao,
  created_at as quando
FROM comissoes
ORDER BY created_at DESC
LIMIT 3;

-- 5. ERROS DE WEBHOOK (se houver)
SELECT
  '=== ERROS DE WEBHOOK (se houver) ===' as secao,
  acao,
  payload->>'error' as erro,
  payload->>'stack' as stack_trace,
  created_at as quando
FROM audit_logs
WHERE acao = 'WEBHOOK_ASAAS_ERROR'
ORDER BY created_at DESC
LIMIT 1;

-- 6. RESUMO - Quantos registros nos ultimos 10 minutos
SELECT
  '=== RESUMO - ULTIMOS 10 MINUTOS ===' as secao,
  (SELECT COUNT(*) FROM clientes WHERE created_at > NOW() - INTERVAL '10 minutes') as clientes_criados,
  (SELECT COUNT(*) FROM pagamentos WHERE created_at > NOW() - INTERVAL '10 minutes') as pagamentos_registrados,
  (SELECT COUNT(*) FROM comissoes WHERE created_at > NOW() - INTERVAL '10 minutes') as comissoes_calculadas,
  (SELECT COUNT(*) FROM audit_logs WHERE acao LIKE '%WEBHOOK%' AND created_at > NOW() - INTERVAL '10 minutes') as webhooks_recebidos;
