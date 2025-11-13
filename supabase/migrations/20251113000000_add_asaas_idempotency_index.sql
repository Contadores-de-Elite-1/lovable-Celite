-- =============================================================================
-- MIGRATION: Add UNIQUE constraint for ASAAS idempotency
-- Garantir que um pagamento ASAAS nunca é processado duas vezes
-- =============================================================================

-- Verificar se a coluna asaas_payment_id existe
-- Se não existir, criar ela primeiro
ALTER TABLE public.pagamentos
  ADD COLUMN IF NOT EXISTS asaas_payment_id text,
  ADD COLUMN IF NOT EXISTS asaas_event_id text;

-- Criar UNIQUE index para asaas_payment_id (idempotência nível banco)
-- Se um webhook chegar 2x com mesmo payment.id, o segundo INSERT vai falhar
CREATE UNIQUE INDEX IF NOT EXISTS idx_pagamentos_asaas_payment_id_unique
  ON public.pagamentos(asaas_payment_id)
  WHERE asaas_payment_id IS NOT NULL;

-- Index para buscar rápido por asaas_payment_id
CREATE INDEX IF NOT EXISTS idx_pagamentos_asaas_payment_id
  ON public.pagamentos(asaas_payment_id);

-- Index para buscar rápido por asaas_event_id (debugging)
CREATE INDEX IF NOT EXISTS idx_pagamentos_asaas_event_id
  ON public.pagamentos(asaas_event_id);
