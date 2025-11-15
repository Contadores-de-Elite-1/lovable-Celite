-- ============================================================================
-- VERIFICACAO RAPIDA - EXECUTAR AGORA
-- ============================================================================

-- RESUMO ULTIMOS 5 MINUTOS
SELECT
  'RESUMO' as tipo,
  (SELECT COUNT(*) FROM audit_logs
   WHERE acao LIKE '%WEBHOOK%'
   AND created_at > NOW() - INTERVAL '5 minutes') as webhooks,

  (SELECT COUNT(*) FROM clientes
   WHERE created_at > NOW() - INTERVAL '5 minutes') as clientes,

  (SELECT COUNT(*) FROM pagamentos
   WHERE created_at > NOW() - INTERVAL '5 minutes') as pagamentos,

  (SELECT COUNT(*) FROM comissoes
   WHERE created_at > NOW() - INTERVAL '5 minutes') as comissoes;

-- ULTIMO WEBHOOK PROCESSADO
SELECT
  'ULTIMO WEBHOOK' as tipo,
  acao,
  payload->>'event' as evento,
  payload->>'asaas_payment_id' as payment_id,
  payload->>'valor_bruto' as valor,
  payload->>'commissions_calculated' as comissoes_ok,
  created_at
FROM audit_logs
WHERE acao LIKE '%WEBHOOK%'
ORDER BY created_at DESC
LIMIT 1;

-- ULTIMO CLIENTE CRIADO
SELECT
  'ULTIMO CLIENTE' as tipo,
  nome_empresa,
  asaas_customer_id,
  contador_id,
  status,
  created_at
FROM clientes
ORDER BY created_at DESC
LIMIT 1;

-- ULTIMO PAGAMENTO
SELECT
  'ULTIMO PAGAMENTO' as tipo,
  tipo,
  valor_bruto,
  status,
  asaas_payment_id,
  created_at
FROM pagamentos
ORDER BY created_at DESC
LIMIT 1;

-- ULTIMAS COMISSOES
SELECT
  'COMISSOES' as tipo,
  tipo,
  valor,
  status,
  created_at
FROM comissoes
ORDER BY created_at DESC
LIMIT 3;

-- ERROS (se houver)
SELECT
  'ERROS' as tipo,
  acao,
  payload->>'error' as erro,
  created_at
FROM audit_logs
WHERE acao = 'WEBHOOK_ASAAS_ERROR'
  AND created_at > NOW() - INTERVAL '5 minutes'
ORDER BY created_at DESC
LIMIT 1;
