-- Migration: Add Stripe fields to clientes table
-- Permite que clientes usem Stripe além de ASAAS

-- Adicionar colunas Stripe
ALTER TABLE clientes
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_price_id TEXT;

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_clientes_stripe_customer ON clientes(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_clientes_stripe_subscription ON clientes(stripe_subscription_id);

-- Adicionar comentários
COMMENT ON COLUMN clientes.stripe_customer_id IS 'ID do Customer no Stripe (cus_xxx)';
COMMENT ON COLUMN clientes.stripe_subscription_id IS 'ID da Subscription no Stripe (sub_xxx)';
COMMENT ON COLUMN clientes.stripe_price_id IS 'ID do Price/Plan no Stripe (price_xxx)';
COMMENT ON COLUMN clientes.asaas_customer_id IS 'ID do Customer no ASAAS (legado)';
COMMENT ON COLUMN clientes.asaas_subscription_id IS 'ID da Subscription no ASAAS (legado)';
