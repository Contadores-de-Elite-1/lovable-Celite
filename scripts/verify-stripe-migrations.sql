-- 🔍 VERIFICAÇÃO DE MIGRATIONS STRIPE
-- Execute este SQL no Supabase para verificar se as migrations foram aplicadas corretamente
-- Data: 15 de novembro de 2025

-- ═══════════════════════════════════════════════════════════════
-- 1. VERIFICAR CAMPOS STRIPE NA TABELA PAGAMENTOS
-- ═══════════════════════════════════════════════════════════════

SELECT
  '✅ Migration: add_stripe_fields_to_pagamentos' AS status,
  COUNT(*) AS total_columns
FROM information_schema.columns
WHERE table_name = 'pagamentos'
  AND column_name IN (
    'stripe_payment_id',
    'stripe_charge_id',
    'moeda',
    'metodo_pagamento',
    'metadata'
  );

-- Esperado: 5 colunas

-- Detalhes das colunas
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'pagamentos'
  AND column_name LIKE 'stripe_%'
ORDER BY column_name;

-- ═══════════════════════════════════════════════════════════════
-- 2. VERIFICAR CAMPOS STRIPE NA TABELA CLIENTES
-- ═══════════════════════════════════════════════════════════════

SELECT
  '✅ Migration: add_stripe_fields_to_clientes' AS status,
  COUNT(*) AS total_columns
FROM information_schema.columns
WHERE table_name = 'clientes'
  AND column_name IN (
    'stripe_customer_id',
    'stripe_subscription_id',
    'stripe_price_id'
  );

-- Esperado: 3 colunas

-- Detalhes das colunas
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'clientes'
  AND column_name LIKE 'stripe_%'
ORDER BY column_name;

-- ═══════════════════════════════════════════════════════════════
-- 3. VERIFICAR ÍNDICES STRIPE
-- ═══════════════════════════════════════════════════════════════

-- Índices em pagamentos
SELECT
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'pagamentos'
  AND indexname LIKE '%stripe%'
ORDER BY indexname;

-- Índices em clientes
SELECT
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'clientes'
  AND indexname LIKE '%stripe%'
ORDER BY indexname;

-- ═══════════════════════════════════════════════════════════════
-- 4. VERIFICAR CONSTRAINTS UNIQUE
-- ═══════════════════════════════════════════════════════════════

SELECT
  tc.constraint_name,
  tc.table_name,
  kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name
WHERE tc.constraint_type = 'UNIQUE'
  AND kcu.column_name LIKE 'stripe_%'
ORDER BY tc.table_name, kcu.column_name;

-- Esperado:
-- - pagamentos.stripe_payment_id (UNIQUE)
-- - clientes.stripe_customer_id (UNIQUE)

-- ═══════════════════════════════════════════════════════════════
-- 5. TESTAR INSERÇÃO DE DADOS STRIPE
-- ═══════════════════════════════════════════════════════════════

-- Este teste verifica se podemos inserir dados com campos Stripe
-- NÃO execute em produção sem ajustar os IDs

-- EXEMPLO (NÃO EXECUTAR):
/*
INSERT INTO pagamentos (
  cliente_id,
  tipo,
  valor_bruto,
  valor_liquido,
  competencia,
  status,
  stripe_payment_id,
  stripe_charge_id,
  moeda,
  metodo_pagamento,
  metadata
) VALUES (
  'UUID_DO_CLIENTE_AQUI',  -- Substitua
  'recorrente',
  100.00,
  95.00,
  CURRENT_DATE,
  'confirmado',
  'pi_test_123456789',      -- ID do PaymentIntent
  'ch_test_123456789',      -- ID do Charge
  'BRL',
  'card',
  '{"test": true, "source": "stripe"}'::jsonb
);
*/

-- ═══════════════════════════════════════════════════════════════
-- 6. VERIFICAR DADOS EXISTENTES STRIPE
-- ═══════════════════════════════════════════════════════════════

-- Contar clientes com Stripe
SELECT
  'Clientes Stripe' AS tipo,
  COUNT(*) AS total
FROM clientes
WHERE stripe_customer_id IS NOT NULL;

-- Contar pagamentos Stripe
SELECT
  'Pagamentos Stripe' AS tipo,
  COUNT(*) AS total
FROM pagamentos
WHERE stripe_payment_id IS NOT NULL;

-- ═══════════════════════════════════════════════════════════════
-- 7. VERIFICAR DUAL GATEWAY (ASAAS + STRIPE)
-- ═══════════════════════════════════════════════════════════════

-- Clientes por gateway
SELECT
  CASE
    WHEN stripe_customer_id IS NOT NULL AND asaas_customer_id IS NOT NULL THEN 'AMBOS'
    WHEN stripe_customer_id IS NOT NULL THEN 'STRIPE'
    WHEN asaas_customer_id IS NOT NULL THEN 'ASAAS'
    ELSE 'NENHUM'
  END AS gateway,
  COUNT(*) AS total_clientes
FROM clientes
GROUP BY
  CASE
    WHEN stripe_customer_id IS NOT NULL AND asaas_customer_id IS NOT NULL THEN 'AMBOS'
    WHEN stripe_customer_id IS NOT NULL THEN 'STRIPE'
    WHEN asaas_customer_id IS NOT NULL THEN 'ASAAS'
    ELSE 'NENHUM'
  END
ORDER BY total_clientes DESC;

-- Pagamentos por gateway
SELECT
  CASE
    WHEN stripe_payment_id IS NOT NULL THEN 'STRIPE'
    WHEN asaas_payment_id IS NOT NULL THEN 'ASAAS'
    ELSE 'DESCONHECIDO'
  END AS gateway,
  COUNT(*) AS total_pagamentos,
  SUM(valor_bruto) AS valor_total
FROM pagamentos
GROUP BY
  CASE
    WHEN stripe_payment_id IS NOT NULL THEN 'STRIPE'
    WHEN asaas_payment_id IS NOT NULL THEN 'ASAAS'
    ELSE 'DESCONHECIDO'
  END
ORDER BY total_pagamentos DESC;

-- ═══════════════════════════════════════════════════════════════
-- 8. RESULTADO FINAL - CHECKLIST
-- ═══════════════════════════════════════════════════════════════

SELECT
  '✅ CHECKLIST DE MIGRATIONS STRIPE' AS titulo,
  '' AS linha1,
  CASE
    WHEN (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'pagamentos' AND column_name LIKE 'stripe_%') >= 2
    THEN '✅ Campos Stripe em pagamentos: OK'
    ELSE '❌ Campos Stripe em pagamentos: FALTANDO'
  END AS check1,
  CASE
    WHEN (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'clientes' AND column_name LIKE 'stripe_%') >= 3
    THEN '✅ Campos Stripe em clientes: OK'
    ELSE '❌ Campos Stripe em clientes: FALTANDO'
  END AS check2,
  CASE
    WHEN (SELECT COUNT(*) FROM pg_indexes WHERE tablename IN ('pagamentos', 'clientes') AND indexname LIKE '%stripe%') >= 3
    THEN '✅ Índices Stripe: OK'
    ELSE '⚠️ Índices Stripe: Verificar'
  END AS check3,
  '' AS linha2,
  '🎉 Se todos os checks estão OK, as migrations foram aplicadas corretamente!' AS conclusao;
