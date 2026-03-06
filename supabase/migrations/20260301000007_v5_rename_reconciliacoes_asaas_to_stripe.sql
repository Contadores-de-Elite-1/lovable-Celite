-- =============================================================================
-- V5.0 Migration 7: Renomear colunas Asaas → Stripe na tabela reconciliacoes
-- Data: 2026-03-01
-- Descrição:
--   A tabela reconciliacoes (criada em 20251104) continha colunas nomeadas
--   com "asaas" (total_asaas, payload_asaas). Esta migration finaliza a
--   remoção completa das referências Asaas do sistema.
-- =============================================================================

DO $$
BEGIN
  -- Renomear total_asaas → total_stripe (se existir)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'reconciliacoes'
      AND column_name  = 'total_asaas'
  ) THEN
    ALTER TABLE public.reconciliacoes
      RENAME COLUMN total_asaas TO total_stripe;
    RAISE NOTICE 'Coluna total_asaas renomeada para total_stripe';
  ELSE
    RAISE NOTICE 'Coluna total_asaas não encontrada — nada a fazer';
  END IF;

  -- Renomear payload_asaas → payload_stripe (se existir)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'reconciliacoes'
      AND column_name  = 'payload_asaas'
  ) THEN
    ALTER TABLE public.reconciliacoes
      RENAME COLUMN payload_asaas TO payload_stripe;
    RAISE NOTICE 'Coluna payload_asaas renomeada para payload_stripe';
  ELSE
    RAISE NOTICE 'Coluna payload_asaas não encontrada — nada a fazer';
  END IF;
END $$;

-- Log de migração
DO $$
BEGIN
  RAISE NOTICE '[V5.0 Migration 7] Remoção completa de Asaas: colunas reconciliacoes atualizadas para Stripe.';
END $$;
