-- 🔍 ANÁLISE DE DADOS ASAAS - Verificar antes de remover
-- Execute este SQL no Supabase para verificar se é seguro remover ASAAS
-- Data: 15 de novembro de 2025

-- ═══════════════════════════════════════════════════════════════
-- 1. RESUMO EXECUTIVO - Quanto de dados ASAAS existe?
-- ═══════════════════════════════════════════════════════════════

SELECT
  '📊 RESUMO DE DADOS ASAAS' AS secao,
  '' AS detalhe;

-- Clientes com ASAAS
SELECT
  'Clientes ASAAS' AS tipo,
  COUNT(*) AS total,
  COUNT(*) FILTER (WHERE stripe_customer_id IS NOT NULL) AS tambem_tem_stripe,
  COUNT(*) FILTER (WHERE stripe_customer_id IS NULL) AS apenas_asaas
FROM clientes
WHERE asaas_customer_id IS NOT NULL;

-- Pagamentos ASAAS
SELECT
  'Pagamentos ASAAS' AS tipo,
  COUNT(*) AS total_pagamentos,
  COALESCE(SUM(valor_bruto), 0) AS valor_total_bruto,
  COALESCE(SUM(valor_liquido), 0) AS valor_total_liquido
FROM pagamentos
WHERE asaas_payment_id IS NOT NULL;

-- Comissões originadas de ASAAS
SELECT
  'Comissões (ASAAS origin)' AS tipo,
  COUNT(*) AS total_comissoes,
  COALESCE(SUM(valor), 0) AS valor_total_comissoes
FROM comissoes c
JOIN pagamentos p ON c.pagamento_id = p.id
WHERE p.asaas_payment_id IS NOT NULL;

-- ═══════════════════════════════════════════════════════════════
-- 2. ANÁLISE TEMPORAL - Quando foi o último uso de ASAAS?
-- ═══════════════════════════════════════════════════════════════

SELECT
  '📅 ÚLTIMO USO ASAAS' AS secao,
  '' AS detalhe;

-- Último cliente criado com ASAAS
SELECT
  'Último cliente ASAAS' AS evento,
  MAX(created_at) AS data_ultima_ocorrencia,
  EXTRACT(DAY FROM NOW() - MAX(created_at)) AS dias_atras
FROM clientes
WHERE asaas_customer_id IS NOT NULL;

-- Último pagamento ASAAS
SELECT
  'Último pagamento ASAAS' AS evento,
  MAX(created_at) AS data_ultima_ocorrencia,
  EXTRACT(DAY FROM NOW() - MAX(created_at)) AS dias_atras
FROM pagamentos
WHERE asaas_payment_id IS NOT NULL;

-- ═══════════════════════════════════════════════════════════════
-- 3. CLIENTES MISTOS - Têm tanto ASAAS quanto Stripe?
-- ═══════════════════════════════════════════════════════════════

SELECT
  '🔀 CLIENTES MISTOS (ASAAS + STRIPE)' AS secao,
  '' AS detalhe;

SELECT
  id AS cliente_id,
  nome,
  email,
  asaas_customer_id,
  stripe_customer_id,
  status,
  created_at,
  updated_at
FROM clientes
WHERE asaas_customer_id IS NOT NULL
  AND stripe_customer_id IS NOT NULL
ORDER BY updated_at DESC;

-- ═══════════════════════════════════════════════════════════════
-- 4. PAGAMENTOS ATIVOS ASAAS - Há pagamentos recentes?
-- ═══════════════════════════════════════════════════════════════

SELECT
  '⚠️ PAGAMENTOS ASAAS RECENTES (últimos 90 dias)' AS secao,
  '' AS detalhe;

SELECT
  p.id,
  p.asaas_payment_id,
  c.nome AS cliente_nome,
  p.valor_bruto,
  p.status,
  p.competencia,
  p.created_at
FROM pagamentos p
LEFT JOIN clientes c ON p.cliente_id = c.id
WHERE p.asaas_payment_id IS NOT NULL
  AND p.created_at >= NOW() - INTERVAL '90 days'
ORDER BY p.created_at DESC
LIMIT 20;

-- ═══════════════════════════════════════════════════════════════
-- 5. MIGRAÇÃO ASAAS → STRIPE - Quantos já migraram?
-- ═══════════════════════════════════════════════════════════════

SELECT
  '📈 STATUS DE MIGRAÇÃO ASAAS → STRIPE' AS secao,
  '' AS detalhe;

SELECT
  CASE
    WHEN asaas_customer_id IS NOT NULL AND stripe_customer_id IS NULL THEN 'Apenas ASAAS (não migrado)'
    WHEN asaas_customer_id IS NULL AND stripe_customer_id IS NOT NULL THEN 'Apenas Stripe (sem histórico ASAAS)'
    WHEN asaas_customer_id IS NOT NULL AND stripe_customer_id IS NOT NULL THEN 'ASAAS + Stripe (migrado)'
    ELSE 'Sem nenhum'
  END AS status_migracao,
  COUNT(*) AS total_clientes,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) AS percentual
FROM clientes
GROUP BY
  CASE
    WHEN asaas_customer_id IS NOT NULL AND stripe_customer_id IS NULL THEN 'Apenas ASAAS (não migrado)'
    WHEN asaas_customer_id IS NULL AND stripe_customer_id IS NOT NULL THEN 'Apenas Stripe (sem histórico ASAAS)'
    WHEN asaas_customer_id IS NOT NULL AND stripe_customer_id IS NOT NULL THEN 'ASAAS + Stripe (migrado)'
    ELSE 'Sem nenhum'
  END
ORDER BY total_clientes DESC;

-- ═══════════════════════════════════════════════════════════════
-- 6. DECISÃO: É SEGURO REMOVER ASAAS?
-- ═══════════════════════════════════════════════════════════════

SELECT
  '✅ DECISÃO FINAL' AS secao,
  '' AS detalhe;

WITH asaas_stats AS (
  SELECT
    COUNT(*) FILTER (WHERE asaas_customer_id IS NOT NULL) AS clientes_asaas,
    COUNT(*) FILTER (WHERE asaas_customer_id IS NOT NULL AND stripe_customer_id IS NULL) AS clientes_apenas_asaas,
    (SELECT COUNT(*) FROM pagamentos WHERE asaas_payment_id IS NOT NULL AND created_at >= NOW() - INTERVAL '30 days') AS pagamentos_recentes_asaas,
    (SELECT COUNT(*) FROM pagamentos WHERE stripe_payment_id IS NOT NULL) AS pagamentos_stripe
  FROM clientes
)
SELECT
  CASE
    WHEN clientes_apenas_asaas > 0 THEN '❌ NÃO REMOVA ASAAS - Existem clientes apenas com ASAAS'
    WHEN pagamentos_recentes_asaas > 0 THEN '⚠️ CUIDADO - Pagamentos ASAAS nos últimos 30 dias'
    WHEN clientes_asaas > 0 AND pagamentos_stripe = 0 THEN '❌ NÃO REMOVA - Nenhum pagamento Stripe ainda'
    WHEN clientes_asaas = 0 THEN '✅ SEGURO - Nenhum dado ASAAS encontrado'
    ELSE '✅ SEGURO - Todos migraram para Stripe'
  END AS recomendacao,
  clientes_asaas AS total_clientes_com_historico_asaas,
  clientes_apenas_asaas AS clientes_nao_migrados,
  pagamentos_recentes_asaas AS pagamentos_asaas_ultimos_30_dias,
  pagamentos_stripe AS pagamentos_stripe_total
FROM asaas_stats;

-- ═══════════════════════════════════════════════════════════════
-- 7. AÇÕES RECOMENDADAS
-- ═══════════════════════════════════════════════════════════════

SELECT
  '📋 PRÓXIMAS AÇÕES' AS secao,
  '' AS detalhe;

WITH asaas_stats AS (
  SELECT
    COUNT(*) FILTER (WHERE asaas_customer_id IS NOT NULL AND stripe_customer_id IS NULL) AS apenas_asaas
  FROM clientes
)
SELECT
  CASE
    WHEN apenas_asaas > 0 THEN
      '1. Migrar ' || apenas_asaas || ' cliente(s) para Stripe antes de remover ASAAS'
    ELSE
      '1. ✅ Todos os clientes ativos estão no Stripe'
  END AS acao_1,
  CASE
    WHEN apenas_asaas > 0 THEN
      '2. Criar script de migração automática ASAAS → Stripe'
    ELSE
      '2. ✅ Fazer backup dos dados ASAAS (opcional, para histórico)'
  END AS acao_2,
  CASE
    WHEN apenas_asaas > 0 THEN
      '3. Testar migração em ambiente de desenvolvimento'
    ELSE
      '3. ✅ Campos ASAAS podem ser mantidos ou removidos'
  END AS acao_3,
  CASE
    WHEN apenas_asaas > 0 THEN
      '4. NÃO remover campos ASAAS ainda'
    ELSE
      '4. ✅ Frontend já está Stripe-only'
  END AS acao_4
FROM asaas_stats;

-- ═══════════════════════════════════════════════════════════════
-- 8. BACKUP RECOMENDADO (se for remover)
-- ═══════════════════════════════════════════════════════════════

-- NÃO EXECUTE AINDA - Apenas documentação!
/*
-- Criar tabelas de backup antes de remover campos
CREATE TABLE IF NOT EXISTS asaas_backup_clientes AS
SELECT
  id,
  nome,
  email,
  asaas_customer_id,
  asaas_subscription_id,
  created_at,
  updated_at
FROM clientes
WHERE asaas_customer_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS asaas_backup_pagamentos AS
SELECT
  id,
  cliente_id,
  asaas_payment_id,
  asaas_event_id,
  asaas_subscription_id,
  valor_bruto,
  valor_liquido,
  status,
  competencia,
  created_at
FROM pagamentos
WHERE asaas_payment_id IS NOT NULL;

-- Verificar backups
SELECT 'Backup Clientes', COUNT(*) FROM asaas_backup_clientes;
SELECT 'Backup Pagamentos', COUNT(*) FROM asaas_backup_pagamentos;
*/

-- ═══════════════════════════════════════════════════════════════
-- FIM DA ANÁLISE
-- ═══════════════════════════════════════════════════════════════

SELECT
  '🎉 ANÁLISE COMPLETA!' AS conclusao,
  'Revise os resultados acima antes de tomar qualquer ação' AS proximos_passos;
