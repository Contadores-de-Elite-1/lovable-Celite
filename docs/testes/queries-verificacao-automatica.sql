-- ============================================
-- QUERIES DE VERIFICAÇÃO AUTOMÁTICA
-- Integração ASAAS → Webhook → Supabase
-- ============================================

-- ============================================
-- QUERY 1: ÚLTIMOS PAGAMENTOS (TOP 5)
-- ============================================
-- Mostra os 5 pagamentos mais recentes
-- ESPERA: Ver novo pagamento com asaas_payment_id = pay_xxx

SELECT
  id,
  cliente_id,
  tipo,
  competencia,
  valor_bruto,
  valor_liquido,
  status,
  asaas_payment_id,
  asaas_event_id,
  pago_em,
  created_at,
  -- Calcular idade do registro
  NOW() - created_at AS idade
FROM pagamentos
ORDER BY created_at DESC
LIMIT 5;

-- ============================================
-- QUERY 2: COMISSÕES GERADAS (TOP 10)
-- ============================================
-- Mostra as 10 comissões mais recentes
-- ESPERA: Ver múltiplas comissões com mesma competencia

SELECT
  c.id,
  c.tipo,
  c.valor,
  c.percentual,
  c.competencia,
  c.status,
  c.nivel_sponsor,
  -- JOIN com contador para ver nome
  p.nome AS contador_nome,
  p.email AS contador_email,
  -- JOIN com cliente
  cl.nome_empresa AS cliente_nome,
  c.created_at,
  NOW() - c.created_at AS idade
FROM comissoes c
LEFT JOIN contadores cnt ON c.contador_id = cnt.id
LEFT JOIN profiles p ON cnt.user_id = p.id
LEFT JOIN clientes cl ON c.cliente_id = cl.id
ORDER BY c.created_at DESC
LIMIT 10;

-- ============================================
-- QUERY 3: AUDIT LOGS DE WEBHOOK (TOP 5)
-- ============================================
-- Mostra os 5 logs de webhook mais recentes
-- ESPERA: Ver log com acao = 'WEBHOOK_ASAAS_PROCESSED'

SELECT
  id,
  acao,
  tabela,
  registro_id,
  payload->>'asaas_payment_id' AS asaas_payment_id,
  payload->>'event' AS event_type,
  payload->>'valor_bruto' AS valor,
  created_at,
  NOW() - created_at AS idade
FROM audit_logs
WHERE acao LIKE '%WEBHOOK%'
ORDER BY created_at DESC
LIMIT 5;

-- ============================================
-- QUERY 4: CLIENTE ESPECÍFICO
-- ============================================
-- Verifica se cliente cus_000007222099 existe
-- ESPERA: Ver 1 registro

SELECT
  id,
  contador_id,
  nome_empresa,
  cnpj,
  status,
  plano,
  valor_mensal,
  asaas_customer_id,
  asaas_subscription_id,
  data_ativacao,
  created_at
FROM clientes
WHERE asaas_customer_id = 'cus_000007222099';

-- ============================================
-- QUERY 5: PAGAMENTO POR ASAAS_PAYMENT_ID
-- ============================================
-- Busca pagamento específico pelo ID do ASAAS
-- SUBSTITUIR 'pay_xxx' pelo ID real da cobrança

-- EXEMPLO: SELECT * FROM pagamentos WHERE asaas_payment_id = 'pay_12345';
-- VOCÊ VAI EXECUTAR:
-- SELECT * FROM pagamentos WHERE asaas_payment_id = 'COLE_ID_AQUI';

SELECT
  p.id AS pagamento_id,
  p.tipo,
  p.valor_bruto,
  p.valor_liquido,
  p.status,
  p.competencia,
  p.asaas_payment_id,
  p.asaas_event_id,
  p.pago_em,
  p.created_at,
  -- JOIN com cliente
  c.nome_empresa AS cliente,
  c.asaas_customer_id,
  -- JOIN com contador
  cnt.id AS contador_id,
  prof.nome AS contador_nome
FROM pagamentos p
LEFT JOIN clientes c ON p.cliente_id = c.id
LEFT JOIN contadores cnt ON c.contador_id = cnt.id
LEFT JOIN profiles prof ON cnt.user_id = prof.id
WHERE p.asaas_payment_id = 'pay_SUBSTITUIR_AQUI';

-- ============================================
-- QUERY 6: COMISSÕES DO PAGAMENTO ESPECÍFICO
-- ============================================
-- Busca todas as comissões geradas por um pagamento

-- SUBSTITUIR 'uuid-do-pagamento' pelo ID retornado na Query 5

SELECT
  c.id,
  c.tipo,
  c.valor,
  c.percentual,
  c.competencia,
  c.status,
  c.nivel_sponsor,
  p.nome AS contador_nome,
  p.email AS contador_email,
  c.observacao,
  c.created_at
FROM comissoes c
LEFT JOIN contadores cnt ON c.contador_id = cnt.id
LEFT JOIN profiles p ON cnt.user_id = p.id
WHERE c.pagamento_id = 'uuid-do-pagamento-aqui'
ORDER BY c.created_at;

-- ============================================
-- QUERY 7: RESUMO COMPLETO DO TESTE
-- ============================================
-- Mostra tudo relacionado ao último pagamento

WITH ultimo_pagamento AS (
  SELECT id, created_at
  FROM pagamentos
  ORDER BY created_at DESC
  LIMIT 1
)
SELECT
  'PAGAMENTO' AS tipo,
  p.id::text AS id,
  p.tipo AS detalhe,
  p.valor_bruto::text AS valor,
  p.status AS status,
  p.created_at
FROM pagamentos p
WHERE p.id = (SELECT id FROM ultimo_pagamento)

UNION ALL

SELECT
  'COMISSAO' AS tipo,
  c.id::text AS id,
  c.tipo AS detalhe,
  c.valor::text AS valor,
  c.status AS status,
  c.created_at
FROM comissoes c
WHERE c.pagamento_id = (SELECT id FROM ultimo_pagamento)

UNION ALL

SELECT
  'AUDIT_LOG' AS tipo,
  a.id::text AS id,
  a.acao AS detalhe,
  (a.payload->>'valor_bruto')::text AS valor,
  'logged' AS status,
  a.created_at
FROM audit_logs a
WHERE a.registro_id = (SELECT id FROM ultimo_pagamento)
  AND a.acao = 'WEBHOOK_ASAAS_PROCESSED'

ORDER BY created_at DESC;

-- ============================================
-- QUERY 8: ESTATÍSTICAS GERAIS
-- ============================================
-- Mostra estatísticas gerais do sistema

SELECT
  'Total Pagamentos' AS metrica,
  COUNT(*)::text AS valor
FROM pagamentos

UNION ALL

SELECT
  'Pagamentos Últimas 24h' AS metrica,
  COUNT(*)::text AS valor
FROM pagamentos
WHERE created_at > NOW() - INTERVAL '24 hours'

UNION ALL

SELECT
  'Total Comissões' AS metrica,
  COUNT(*)::text AS valor
FROM comissoes

UNION ALL

SELECT
  'Comissões Últimas 24h' AS metrica,
  COUNT(*)::text AS valor
FROM comissoes
WHERE created_at > NOW() - INTERVAL '24 hours'

UNION ALL

SELECT
  'Webhooks Processados Últimas 24h' AS metrica,
  COUNT(*)::text AS valor
FROM audit_logs
WHERE acao = 'WEBHOOK_ASAAS_PROCESSED'
  AND created_at > NOW() - INTERVAL '24 hours';

-- ============================================
-- FIM DAS QUERIES
-- ============================================

/*
INSTRUÇÕES DE USO:

1. Execute Query 1, 2, 3, 4 para ver estado geral
2. Após criar cobrança no ASAAS, execute Query 5
   (substituindo pay_xxx pelo ID real)
3. Use o pagamento_id retornado na Query 6
4. Execute Query 7 para resumo completo
5. Execute Query 8 para estatísticas

*/
