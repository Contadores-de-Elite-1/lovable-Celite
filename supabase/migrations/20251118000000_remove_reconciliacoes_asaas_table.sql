-- Migration: Remove tabela reconciliacoes (legacy Asaas)
-- Data: 18 de novembro de 2025
-- Motivo: Tabela usada apenas para reconciliação Asaas, não mais necessária após migração para Stripe

BEGIN;

-- Remover política RLS
DROP POLICY IF EXISTS reconciliacoes_admin ON reconciliacoes;

-- Remover índices
DROP INDEX IF EXISTS idx_reconciliacoes_competencia;
DROP INDEX IF EXISTS idx_reconciliacoes_status;

-- Remover tabela
DROP TABLE IF EXISTS reconciliacoes CASCADE;

-- Log da remoção
INSERT INTO audit_logs (acao, tabela, payload)
VALUES (
    'TABLE_REMOVED',
    'reconciliacoes',
    jsonb_build_object(
        'reason', 'Legacy Asaas table - no longer needed after Stripe migration',
        'migration', '20251118000000_remove_reconciliacoes_asaas_table',
        'timestamp', now()
    )
);

COMMIT;
