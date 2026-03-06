-- ============================================================
-- Migration: Backlog — Limpeza e Padronização de Tipos
-- Referência: supabase/SCHEMA_ANALYSIS.md — Seção "Backlog"
-- Data: Março 2026
-- ============================================================
-- Itens cobertos:
--   1. materiais.tags       — confirmar tipo text[] explícito (já era text[] no banco)
--   2. bonus_historico      — enums para tipo_bonus e status
--   3. coworkings.estado    — CHAR(2) para sigla UF
--   4. mpes.estado          — varchar(2) para consistência com coworkings
--   5. reconciliacoes.diferenca — coluna gerada (GENERATED ALWAYS AS)
-- ============================================================

-- ============================================================
-- 1. materiais.tags — garantir tipo text[] explícito
-- ============================================================
-- O pg_typeof() já retorna text[] (o banco já inferiu corretamente),
-- mas o schema.sql exibia apenas ARRAY sem tipo base.
-- Esta instrução é idempotente e formaliza o tipo no catálogo.

ALTER TABLE public.materiais
  ALTER COLUMN tags TYPE text[]
  USING tags::text[];

COMMENT ON COLUMN public.materiais.tags IS
  'Array de tags de texto para categorização e busca dos materiais. '
  'Tipo formalizado como text[] na migration 20260304000003_backlog_cleanup.';

-- ============================================================
-- 2. bonus_historico — enums para tipo_bonus e status
-- ============================================================
-- Contexto: ambas as colunas eram text livre sem validação.
-- Valores existentes no banco para tipo_bonus: bonus_ltv, bonus_progressao, bonus_volume
-- Valores existentes no banco para status: pendente

-- 2a. Enum para tipo de bônus histórico
--     Cobre os valores do banco + tipos do PRD ainda não utilizados
CREATE TYPE public.tipo_bonus_historico AS ENUM (
  'bonus_progressao',   -- bônus por progressão de nível (Bronze→Prata→Ouro→Diamante)
  'bonus_ltv',          -- bônus de lifetime value (fidelidade de clientes)
  'bonus_volume',       -- bônus por volume de clientes ativos
  'bonus_rede',         -- bônus por performance da rede (override multinível)
  'lead_diamante',      -- bônus por indicação de lead Diamante
  'override'            -- bônus de override de gerente sobre downline
);

-- 2b. Migrar tipo_bonus: remover DEFAULT (não existe, mas precaução) e alterar tipo
ALTER TABLE public.bonus_historico
  ALTER COLUMN tipo_bonus TYPE public.tipo_bonus_historico
  USING tipo_bonus::public.tipo_bonus_historico;

COMMENT ON COLUMN public.bonus_historico.tipo_bonus IS
  'Tipo de bônus registrado. Usa o enum tipo_bonus_historico para validação. '
  'Tipificado na migration 20260304000003_backlog_cleanup.';

-- 2c. Enum para status do bônus
CREATE TYPE public.status_bonus AS ENUM (
  'pendente',    -- calculado, aguardando aprovação/pagamento
  'pago',        -- transferência realizada ao contador
  'cancelado'    -- cancelado (ex: estorno, auditoria)
);

-- 2d. Alterar status: remover DEFAULT antes de trocar o tipo
ALTER TABLE public.bonus_historico
  ALTER COLUMN status DROP DEFAULT;

ALTER TABLE public.bonus_historico
  ALTER COLUMN status TYPE public.status_bonus
  USING (
    CASE status
      WHEN 'pendente'  THEN 'pendente'::public.status_bonus
      WHEN 'pago'      THEN 'pago'::public.status_bonus
      WHEN 'cancelado' THEN 'cancelado'::public.status_bonus
      ELSE                  'pendente'::public.status_bonus
    END
  );

ALTER TABLE public.bonus_historico
  ALTER COLUMN status SET DEFAULT 'pendente'::public.status_bonus;

COMMENT ON COLUMN public.bonus_historico.status IS
  'Status do bônus. Usa o enum status_bonus para validação. '
  'Tipificado na migration 20260304000003_backlog_cleanup.';

-- ============================================================
-- 3. coworkings.estado — CHAR(2) para sigla UF
-- ============================================================
-- Valores válidos: SP, RJ, MG, RS, etc. (2 chars obrigatórios)
-- Tabela está vazia → ALTER sem risco de truncamento

ALTER TABLE public.coworkings
  ALTER COLUMN estado TYPE CHAR(2)
  USING UPPER(TRIM(estado))::CHAR(2);

COMMENT ON COLUMN public.coworkings.estado IS
  'Sigla do estado (UF) com 2 caracteres. Ex: SP, RJ, MG. '
  'Alterado de character varying para CHAR(2) na migration 20260304000003_backlog_cleanup.';

-- ============================================================
-- 4. mpes.estado — varchar(2) para consistência com coworkings
-- ============================================================
-- Mantém nullable (coworkings é NOT NULL, mpes é nullable por projeto)
-- mas limita a 2 chars para forçar sigla UF correta

ALTER TABLE public.mpes
  ALTER COLUMN estado TYPE varchar(2)
  USING UPPER(TRIM(estado))::varchar(2);

COMMENT ON COLUMN public.mpes.estado IS
  'Sigla do estado (UF) com no máximo 2 caracteres. Nullable — pode ser '
  'preenchido no onboarding. Limitado a varchar(2) na migration 20260304000003_backlog_cleanup.';

-- ============================================================
-- 5. reconciliacoes.diferenca — coluna gerada (GENERATED ALWAYS AS)
-- ============================================================
-- Contexto: campo com DEFAULT (total_stripe - total_banco) só avalia na inserção.
-- Se total_stripe ou total_banco forem atualizados depois, diferenca fica desatualizada.
-- Solução: GENERATED ALWAYS AS STORED recalcula automaticamente em qualquer UPDATE.
-- Tabela está vazia → DROP + ADD seguro.

ALTER TABLE public.reconciliacoes
  DROP COLUMN diferenca;

ALTER TABLE public.reconciliacoes
  ADD COLUMN diferenca numeric
    GENERATED ALWAYS AS (total_stripe - total_banco) STORED;

COMMENT ON COLUMN public.reconciliacoes.diferenca IS
  'Diferença calculada automaticamente (total_stripe - total_banco). '
  'Coluna gerada (GENERATED ALWAYS AS STORED) — atualizada a cada INSERT/UPDATE. '
  'Convertida de DEFAULT estático na migration 20260304000003_backlog_cleanup.';
