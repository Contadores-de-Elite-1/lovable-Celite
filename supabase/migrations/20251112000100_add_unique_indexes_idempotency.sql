-- =============================================================================
-- MIGRATION: Adicionar Índices Únicos para Idempotência
-- Descrição: Define constraints únicos que garantem idempotência de cálculos
-- =============================================================================

-- 1. Índice único em comissoes: (pagamento_id, contador_id, tipo)
-- Evita duplicação de comissões para o mesmo pagamento
DROP INDEX IF EXISTS public.idx_comissao_unica;
CREATE UNIQUE INDEX idx_comissao_unica
ON public.comissoes (pagamento_id, contador_id, tipo)
WHERE pagamento_id IS NOT NULL;

-- 2. Índice único em bonus_historico: (contador_id, tipo_bonus, competencia, marco_atingido)
-- Evita bônus duplicado para a mesma competência
DROP INDEX IF EXISTS public.idx_bonus_historico_unico;
CREATE UNIQUE INDEX idx_bonus_historico_unico
ON public.bonus_historico (contador_id, tipo_bonus, competencia, COALESCE(marco_atingido, 0));

-- 3. Índices de suporte (se não existirem)
CREATE INDEX IF NOT EXISTS idx_comissoes_pagamento_id ON public.comissoes(pagamento_id);
CREATE INDEX IF NOT EXISTS idx_comissoes_contador_tipo ON public.comissoes(contador_id, tipo);
CREATE INDEX IF NOT EXISTS idx_bonus_historico_contador_tipo ON public.bonus_historico(contador_id, tipo_bonus);
