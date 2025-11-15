-- Migration: Add Stripe fields to pagamentos table
-- Permite que a tabela pagamentos suporte tanto ASAAS quanto Stripe

-- Adicionar colunas para Stripe
ALTER TABLE pagamentos
ADD COLUMN IF NOT EXISTS stripe_payment_id TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS stripe_charge_id TEXT,
ADD COLUMN IF NOT EXISTS moeda TEXT DEFAULT 'BRL',
ADD COLUMN IF NOT EXISTS metodo_pagamento TEXT,
ADD COLUMN IF NOT EXISTS card_brand TEXT,
ADD COLUMN IF NOT EXISTS card_last4 TEXT,
ADD COLUMN IF NOT EXISTS customer_id TEXT,
ADD COLUMN IF NOT EXISTS order_id TEXT,
ADD COLUMN IF NOT EXISTS metadata JSONB;

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_pagamentos_stripe_payment_id ON pagamentos(stripe_payment_id);
CREATE INDEX IF NOT EXISTS idx_pagamentos_order_id ON pagamentos(order_id);
CREATE INDEX IF NOT EXISTS idx_pagamentos_customer_id ON pagamentos(customer_id);

-- Adicionar comentários
COMMENT ON COLUMN pagamentos.stripe_payment_id IS 'ID do PaymentIntent do Stripe (ex: pi_xxx)';
COMMENT ON COLUMN pagamentos.stripe_charge_id IS 'ID do Charge do Stripe (ex: ch_xxx)';
COMMENT ON COLUMN pagamentos.asaas_payment_id IS 'ID do Payment do ASAAS';
COMMENT ON COLUMN pagamentos.moeda IS 'Moeda do pagamento (BRL, USD, EUR, etc)';
COMMENT ON COLUMN pagamentos.metodo_pagamento IS 'Método de pagamento (card, pix, boleto, etc)';
COMMENT ON COLUMN pagamentos.card_brand IS 'Bandeira do cartão (visa, mastercard, etc)';
COMMENT ON COLUMN pagamentos.card_last4 IS 'Últimos 4 dígitos do cartão';
COMMENT ON COLUMN pagamentos.customer_id IS 'ID do cliente no gateway (ASAAS ou Stripe)';
COMMENT ON COLUMN pagamentos.order_id IS 'ID do pedido/order no sistema';
COMMENT ON COLUMN pagamentos.metadata IS 'Metadados adicionais do pagamento (JSON)';
