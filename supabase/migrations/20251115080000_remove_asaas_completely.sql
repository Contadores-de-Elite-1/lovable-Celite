-- ⚠️ REMOÇÃO COMPLETA ASAAS - IRREVERSÍVEL!
-- Migration: Remove ASAAS fields completely from database
-- Data: 15 de novembro de 2025
-- Status: PRODUCTION READY

-- ═══════════════════════════════════════════════════════════════
-- ⚠️⚠️⚠️ ATENÇÃO: ESTA MIGRATION É IRREVERSÍVEL! ⚠️⚠️⚠️
-- ═══════════════════════════════════════════════════════════════
--
-- Esta migration remove COMPLETAMENTE todos os campos ASAAS do banco.
-- Uma vez executada, NÃO HÁ COMO VOLTAR ATRÁS!
--
-- Certifique-se de:
-- 1. ✅ Todos os clientes migraram para Stripe
-- 2. ✅ Não há pagamentos ASAAS pendentes
-- 3. ✅ Você tem backup completo do banco
-- 4. ✅ Frontend já está usando apenas Stripe
--
-- ═══════════════════════════════════════════════════════════════

BEGIN;

-- ═══════════════════════════════════════════════════════════════
-- 1. BACKUP AUTOMÁTICO (antes de remover)
-- ═══════════════════════════════════════════════════════════════

-- Criar tabelas de backup com timestamp
DO $$
DECLARE
    backup_suffix TEXT := to_char(now(), 'YYYYMMDD_HH24MISS');
BEGIN
    -- Backup de clientes com dados ASAAS
    EXECUTE format('CREATE TABLE IF NOT EXISTS asaas_backup_clientes_%s AS
        SELECT
            id,
            nome,
            email,
            asaas_customer_id,
            created_at,
            updated_at
        FROM clientes
        WHERE asaas_customer_id IS NOT NULL', backup_suffix);

    -- Backup de pagamentos ASAAS
    EXECUTE format('CREATE TABLE IF NOT EXISTS asaas_backup_pagamentos_%s AS
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
        WHERE asaas_payment_id IS NOT NULL', backup_suffix);

    RAISE NOTICE 'Backup criado com sucesso: asaas_backup_*_%', backup_suffix;
END $$;

-- ═══════════════════════════════════════════════════════════════
-- 2. REMOVER ÍNDICES ASAAS
-- ═══════════════════════════════════════════════════════════════

-- Índices em clientes
DROP INDEX IF EXISTS idx_clientes_asaas_customer CASCADE;
DROP INDEX IF EXISTS idx_clientes_asaas_subscription CASCADE;

-- Índices em pagamentos
DROP INDEX IF EXISTS idx_pagamentos_asaas_payment CASCADE;
DROP INDEX IF EXISTS idx_pagamentos_asaas_event CASCADE;
DROP INDEX IF EXISTS idx_pagamentos_asaas_subscription CASCADE;

-- ═══════════════════════════════════════════════════════════════
-- 3. REMOVER CONSTRAINTS ASAAS
-- ═══════════════════════════════════════════════════════════════

-- Remover constraint UNIQUE de asaas_customer_id (se existir)
ALTER TABLE clientes
DROP CONSTRAINT IF EXISTS clientes_asaas_customer_id_key CASCADE;

-- Remover constraint UNIQUE de asaas_payment_id (se existir)
ALTER TABLE pagamentos
DROP CONSTRAINT IF EXISTS pagamentos_asaas_payment_id_key CASCADE;

-- Remover constraint UNIQUE de asaas_event_id (se existir)
ALTER TABLE pagamentos
DROP CONSTRAINT IF EXISTS pagamentos_asaas_event_id_key CASCADE;

-- ═══════════════════════════════════════════════════════════════
-- 4. REMOVER CAMPOS ASAAS DA TABELA CLIENTES
-- ═══════════════════════════════════════════════════════════════

ALTER TABLE clientes
DROP COLUMN IF EXISTS asaas_customer_id CASCADE,
DROP COLUMN IF EXISTS asaas_subscription_id CASCADE;

-- ═══════════════════════════════════════════════════════════════
-- 5. REMOVER CAMPOS ASAAS DA TABELA PAGAMENTOS
-- ═══════════════════════════════════════════════════════════════

ALTER TABLE pagamentos
DROP COLUMN IF EXISTS asaas_payment_id CASCADE,
DROP COLUMN IF EXISTS asaas_event_id CASCADE,
DROP COLUMN IF EXISTS asaas_subscription_id CASCADE;

-- ═══════════════════════════════════════════════════════════════
-- 6. REMOVER CAMPOS ASAAS DA TABELA CONTADORES (se existirem)
-- ═══════════════════════════════════════════════════════════════

ALTER TABLE contadores
DROP COLUMN IF EXISTS asaas_customer_id CASCADE;

-- ═══════════════════════════════════════════════════════════════
-- 7. VERIFICAÇÃO PÓS-REMOÇÃO
-- ═══════════════════════════════════════════════════════════════

DO $$
DECLARE
    asaas_columns_count INTEGER;
BEGIN
    -- Contar colunas ASAAS restantes
    SELECT COUNT(*)
    INTO asaas_columns_count
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND column_name LIKE 'asaas_%';

    IF asaas_columns_count > 0 THEN
        RAISE WARNING 'ATENÇÃO: Ainda existem % colunas ASAAS no banco!', asaas_columns_count;
    ELSE
        RAISE NOTICE '✅ Todas as colunas ASAAS foram removidas com sucesso!';
    END IF;
END $$;

-- ═══════════════════════════════════════════════════════════════
-- 8. ADICIONAR COMENTÁRIOS AUDIT
-- ═══════════════════════════════════════════════════════════════

-- Registrar remoção no audit_logs
INSERT INTO audit_logs (
    user_id,
    acao,
    tabela,
    registro_id,
    detalhes,
    ip_address,
    user_agent
) VALUES (
    NULL, -- Sistema
    'ASAAS_COMPLETE_REMOVAL',
    'clientes, pagamentos',
    NULL,
    jsonb_build_object(
        'migration', '20251115080000_remove_asaas_completely',
        'timestamp', NOW(),
        'backup_created', true,
        'fields_removed', ARRAY[
            'clientes.asaas_customer_id',
            'clientes.asaas_subscription_id',
            'pagamentos.asaas_payment_id',
            'pagamentos.asaas_event_id',
            'pagamentos.asaas_subscription_id'
        ],
        'reason', 'Migration to Stripe-only architecture'
    ),
    '127.0.0.1',
    'Supabase Migration'
);

COMMIT;

-- ═══════════════════════════════════════════════════════════════
-- ✅ MIGRATION COMPLETA!
-- ═══════════════════════════════════════════════════════════════

-- Para verificar se a migration foi bem-sucedida:
--
-- SELECT column_name, table_name
-- FROM information_schema.columns
-- WHERE column_name LIKE 'asaas_%'
--   AND table_schema = 'public';
--
-- Deve retornar 0 linhas!
--
-- Para ver os backups criados:
--
-- SELECT table_name
-- FROM information_schema.tables
-- WHERE table_name LIKE 'asaas_backup_%'
-- ORDER BY table_name DESC;
--
-- ═══════════════════════════════════════════════════════════════
