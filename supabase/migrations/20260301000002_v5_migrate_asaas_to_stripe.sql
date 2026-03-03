-- =============================================================================
-- V5.0 Migration 2/4: Migração total Asaas → Stripe
-- Data: 2026-03-01
-- Descrição:
--   Renomeia os campos de integração Asaas para Stripe nas tabelas
--   `clientes` e `pagamentos`. Atualiza indexes correspondentes.
--
-- PRÉ-REQUISITO: Dados de teste apenas. Nenhum dado de produção é afetado.
--
-- IMPACTO NAS EDGE FUNCTIONS:
--   - webhook-asaas/    → desativar após esta migration
--   - webhook-stripe/   → atualizar para usar stripe_payment_id / stripe_event_id
--   - calcular-comissoes/ → atualizar referência de pagamento_id
--
-- SEGURANÇA: RENAME COLUMN preserva dados, constraints e atualiza índices
--            existentes automaticamente no PostgreSQL.
-- =============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- Tabela: clientes
-- ─────────────────────────────────────────────────────────────────────────────

-- asaas_customer_id → stripe_customer_id
-- (a constraint UNIQUE existente é preservada automaticamente pelo rename)
ALTER TABLE clientes
  RENAME COLUMN asaas_customer_id TO stripe_customer_id;

-- asaas_subscription_id → stripe_subscription_id
ALTER TABLE clientes
  RENAME COLUMN asaas_subscription_id TO stripe_subscription_id;

-- Atualizar comentários
COMMENT ON COLUMN clientes.stripe_customer_id IS
  'ID do cliente no Stripe (ex: cus_xxxx). Usado para pagamentos recorrentes via Stripe. V5.0';

COMMENT ON COLUMN clientes.stripe_subscription_id IS
  'ID da assinatura no Stripe (ex: sub_xxxx). Vinculada ao plano do cliente. V5.0';

-- ─────────────────────────────────────────────────────────────────────────────
-- Tabela: pagamentos
-- ─────────────────────────────────────────────────────────────────────────────

-- asaas_payment_id → stripe_payment_id
ALTER TABLE pagamentos
  RENAME COLUMN asaas_payment_id TO stripe_payment_id;

-- asaas_event_id → stripe_event_id
ALTER TABLE pagamentos
  RENAME COLUMN asaas_event_id TO stripe_event_id;

-- Atualizar comentários
COMMENT ON COLUMN pagamentos.stripe_payment_id IS
  'ID do pagamento no Stripe (ex: pi_xxxx ou in_xxxx). Constraint UNIQUE garante idempotência. V5.0';

COMMENT ON COLUMN pagamentos.stripe_event_id IS
  'ID do evento Stripe (ex: evt_xxxx). Constraint UNIQUE garante que webhooks não são processados 2x. V5.0';

-- ─────────────────────────────────────────────────────────────────────────────
-- Atualizar índices: renomear para refletir o novo nome (drop + create)
-- PostgreSQL não tem RENAME INDEX direto em todos os contextos, então
-- usamos DROP + CREATE IF NOT EXISTS para ser idempotente.
-- ─────────────────────────────────────────────────────────────────────────────

-- Remover índice antigo (asaas) se existir
DROP INDEX IF EXISTS idx_pagamentos_asaas_event;
DROP INDEX IF EXISTS idx_pagamentos_asaas_payment;

-- Criar índices com nomes atualizados para Stripe
CREATE INDEX IF NOT EXISTS idx_pagamentos_stripe_event
  ON pagamentos(stripe_event_id)
  WHERE stripe_event_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_pagamentos_stripe_payment
  ON pagamentos(stripe_payment_id)
  WHERE stripe_payment_id IS NOT NULL;

-- ─────────────────────────────────────────────────────────────────────────────
-- Atualizar índice de idempotência do webhook (era asaas, agora stripe)
-- ─────────────────────────────────────────────────────────────────────────────
DROP INDEX IF EXISTS idx_pagamentos_asaas_idempotency;
DROP INDEX IF EXISTS idx_asaas_idempotency;

-- O índice de idempotência principal agora usa stripe_event_id
-- (já criado acima como idx_pagamentos_stripe_event)

-- ─────────────────────────────────────────────────────────────────────────────
-- Log de migração
-- ─────────────────────────────────────────────────────────────────────────────
DO $$
BEGIN
  RAISE NOTICE '[V5.0 Migration 2/4] Migração Asaas → Stripe concluída:
    - clientes.asaas_customer_id     → stripe_customer_id
    - clientes.asaas_subscription_id → stripe_subscription_id
    - pagamentos.asaas_payment_id    → stripe_payment_id
    - pagamentos.asaas_event_id      → stripe_event_id
    PRÓXIMO PASSO: Atualizar Edge Functions webhook-asaas e calcular-comissoes.';
END $$;
