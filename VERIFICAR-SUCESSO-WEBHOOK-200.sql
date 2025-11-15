-- ============================================================================
-- VERIFICAR SUCESSO COMPLETO - WEBHOOK 200!
-- ============================================================================
-- Webhook retornou 200 às 04:33:25
-- Verificar se cliente, pagamento e comissões foram criados

-- 1. AUDIT LOG - Confirmar processamento
SELECT
  '=== WEBHOOK PROCESSADO ===' as secao,
  acao,
  payload->>'event' as evento,
  payload->>'asaas_payment_id' as payment_id,
  payload->>'cliente_id' as cliente_id,
  payload->>'valor_bruto' as valor,
  payload->>'commissions_calculated' as comissoes_ok,
  created_at
FROM audit_logs
WHERE acao = 'WEBHOOK_ASAAS_PROCESSED'
  AND created_at > NOW() - INTERVAL '10 minutes'
ORDER BY created_at DESC
LIMIT 1;

-- 2. CLIENTE CRIADO
SELECT
  '=== CLIENTE CRIADO ===' as secao,
  id,
  nome_empresa,
  asaas_customer_id,
  contador_id,
  status,
  plano,
  valor_mensal,
  created_at
FROM clientes
WHERE created_at > NOW() - INTERVAL '10 minutes'
ORDER BY created_at DESC
LIMIT 1;

-- 3. PAGAMENTO REGISTRADO
SELECT
  '=== PAGAMENTO REGISTRADO ===' as secao,
  id,
  cliente_id,
  tipo,
  valor_bruto,
  valor_liquido,
  status,
  asaas_payment_id,
  competencia,
  created_at
FROM pagamentos
WHERE created_at > NOW() - INTERVAL '10 minutes'
ORDER BY created_at DESC
LIMIT 1;

-- 4. COMISSOES CALCULADAS
SELECT
  '=== COMISSOES CALCULADAS ===' as secao,
  id,
  pagamento_id,
  contador_id,
  tipo,
  valor,
  percentual,
  status,
  observacao,
  created_at
FROM comissoes
WHERE created_at > NOW() - INTERVAL '10 minutes'
ORDER BY created_at DESC
LIMIT 5;

-- 5. RESUMO FINAL
SELECT
  '=== RESUMO - ULTIMOS 10 MINUTOS ===' as secao,
  (SELECT COUNT(*) FROM audit_logs
   WHERE acao = 'WEBHOOK_ASAAS_PROCESSED'
   AND created_at > NOW() - INTERVAL '10 minutes') as webhooks_processados,

  (SELECT COUNT(*) FROM clientes
   WHERE created_at > NOW() - INTERVAL '10 minutes') as clientes_criados,

  (SELECT COUNT(*) FROM pagamentos
   WHERE created_at > NOW() - INTERVAL '10 minutes') as pagamentos_registrados,

  (SELECT COUNT(*) FROM comissoes
   WHERE created_at > NOW() - INTERVAL '10 minutes') as comissoes_calculadas;

-- 6. VERIFICAR SE TEM ERRO
SELECT
  '=== ERROS (se houver) ===' as secao,
  acao,
  payload->>'error' as erro,
  created_at
FROM audit_logs
WHERE acao IN ('WEBHOOK_ASAAS_ERROR', 'WEBHOOK_COMMISSION_ERROR')
  AND created_at > NOW() - INTERVAL '10 minutes'
ORDER BY created_at DESC
LIMIT 1;
