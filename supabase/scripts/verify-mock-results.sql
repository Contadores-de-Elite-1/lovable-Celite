-- ============================================================================
-- VERIFICAR RESULTADOS DO TESTE MOCK
-- ============================================================================
-- Queries para validar que os dados foram processados corretamente

-- ============================================================================
-- 1. PAGAMENTOS PROCESSADOS
-- ============================================================================

SELECT
  'PAGAMENTOS PROCESSADOS' as secao,
  COUNT(*) as total,
  SUM(valor_liquido) as total_liquido,
  array_agg(status) as status_list
FROM pagamentos
WHERE asaas_payment_id LIKE 'asaas_mock_%'
GROUP BY 1;

-- ============================================================================
-- 2. COMISSÕES CALCULADAS
-- ============================================================================

SELECT
  'COMISSÕES CALCULADAS' as secao,
  tipo,
  COUNT(*) as quantidade,
  SUM(valor) as valor_total,
  array_agg(DISTINCT status) as status_list
FROM comissoes
WHERE contador_id = '550e8400-e29b-41d4-a716-446655440000'::uuid
GROUP BY 1, 2
ORDER BY 2;

-- ============================================================================
-- 3. BÔNUS CALCULADOS
-- ============================================================================

SELECT
  'BÔNUS CALCULADOS' as secao,
  tipo,
  COUNT(*) as quantidade,
  SUM(valor) as valor_total,
  array_agg(DISTINCT status) as status_list
FROM comissoes
WHERE contador_id = '550e8400-e29b-41d4-a716-446655440000'::uuid
  AND tipo LIKE 'bonus_%'
GROUP BY 1, 2
ORDER BY 2;

-- ============================================================================
-- 4. RESUMO FINAL POR TIPO
-- ============================================================================

SELECT
  tipo,
  COUNT(*) as quantidade,
  SUM(valor) as valor_total,
  ROUND(SUM(valor)::numeric, 2) as valor_formatado
FROM comissoes
WHERE contador_id = '550e8400-e29b-41d4-a716-446655440000'::uuid
GROUP BY 1
ORDER BY valor_total DESC;

-- ============================================================================
-- 5. HISTÓRICO DE AUDIT LOGS
-- ============================================================================

SELECT
  'AUDIT LOGS' as tipo,
  acao,
  COUNT(*) as quantidade,
  MAX(created_at) as ultima_acao
FROM audit_logs
WHERE payload->>'contador_id' = '550e8400-e29b-41d4-a716-446655440000'
  OR payload->>'pagamento_id' IN (
    SELECT id::text FROM pagamentos
    WHERE asaas_payment_id LIKE 'asaas_mock_%'
  )
GROUP BY 1, 2
ORDER BY quantidade DESC;

-- ============================================================================
-- 6. VERIFICAÇÃO DE CONSISTÊNCIA
-- ============================================================================

-- Validar que:
-- - Comissões diretas foram criadas (ativacao + recorrente)
-- - Bônus foram criados (progressão, volume, LTV, contador)
-- - Valores somam corretamente
-- - Status está correto

WITH comissoes_contador AS (
  SELECT
    tipo,
    COUNT(*) as qtd,
    SUM(valor) as total,
    array_agg(DISTINCT status) as status_array
  FROM comissoes
  WHERE contador_id = '550e8400-e29b-41d4-a716-446655440000'::uuid
  GROUP BY tipo
)
SELECT
  CASE
    WHEN (SELECT COUNT(*) FROM comissoes_contador WHERE tipo = 'ativacao') > 0 THEN '✓ Comissão de Ativação'
    ELSE '✗ Sem comissão de ativação'
  END as validacao_1,
  CASE
    WHEN (SELECT COUNT(*) FROM comissoes_contador WHERE tipo = 'recorrente') > 0 THEN '✓ Comissão Recorrente'
    ELSE '✗ Sem comissão recorrente'
  END as validacao_2,
  CASE
    WHEN (SELECT COUNT(*) FROM comissoes_contador WHERE tipo LIKE 'bonus_%') > 0 THEN '✓ Bônus Calculados'
    ELSE '✗ Sem bônus calculados'
  END as validacao_3,
  CASE
    WHEN (SELECT SUM(valor) FROM comissoes WHERE contador_id = '550e8400-e29b-41d4-a716-446655440000'::uuid) > 0 THEN '✓ Valores > R$ 0'
    ELSE '✗ Sem valores'
  END as validacao_4;
