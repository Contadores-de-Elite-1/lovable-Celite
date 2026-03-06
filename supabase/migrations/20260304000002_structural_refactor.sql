-- ============================================================
-- Migration: Refatoração Estrutural — Curto Prazo
-- Referência: supabase/SCHEMA_ANALYSIS.md — Seção "Curto prazo"
-- Data: Março 2026
-- ============================================================
-- Itens cobertos:
--   1. comissoes: eliminar duplicidade pago_em / data_pagamento
--   2. webhook_events + webhook_logs: unificar em webhook_logs (provider-agnostic)
--   3. invites.status: corrigir enum errado (status_indicacao → status_invite)
--   4. subscriptions.id: migrar PK de bigint para uuid
-- ============================================================

-- ============================================================
-- 1. comissoes — eliminar data_pagamento (duplicata de pago_em)
-- ============================================================
-- Contexto: ambos os campos representam "data em que a comissão foi paga".
-- Código ativo usa apenas pago_em. data_pagamento só aparece no backup inativo.
-- Estratégia: consolidar valores antes de remover.

UPDATE public.comissoes
SET pago_em = data_pagamento
WHERE pago_em IS NULL
  AND data_pagamento IS NOT NULL;

ALTER TABLE public.comissoes
  DROP COLUMN data_pagamento;

COMMENT ON COLUMN public.comissoes.pago_em IS
  'Data de pagamento da comissão. Campo único após remoção da coluna '
  'duplicata data_pagamento na migration 20260304000002_structural_refactor.';

-- ============================================================
-- 2. webhook_logs + webhook_events — unificar em webhook_logs
-- ============================================================
-- Contexto:
--   webhook_logs  → criado originalmente, tem UNIQUE em event_id, provider-agnostic
--   webhook_events → criado depois com constraint provider='asaas', agora obsoleto
--                   (projeto migrou para Stripe; nenhuma Edge Function escreve nela)
-- Estratégia:
--   a) Enriquecer webhook_logs com colunas ausentes de webhook_events
--   b) Migrar registros de webhook_events → webhook_logs
--   c) Remover webhook_events

-- 2a. Adicionar colunas ausentes em webhook_logs
ALTER TABLE public.webhook_logs
  ADD COLUMN IF NOT EXISTS provider  text,
  ADD COLUMN IF NOT EXISTS signature text,
  ADD COLUMN IF NOT EXISTS headers   jsonb,
  ADD COLUMN IF NOT EXISTS status    text;

-- 2b. Sincronizar status com o campo legado processado
UPDATE public.webhook_logs
SET status = CASE WHEN processado THEN 'processed' ELSE 'received' END
WHERE status IS NULL;

-- 2c. Definir provider = 'stripe' para registros existentes
--     (todos os registros anteriores eram do Stripe após a migração V5)
UPDATE public.webhook_logs
SET provider = 'stripe'
WHERE provider IS NULL;

-- 2d. Defaults para novos registros
ALTER TABLE public.webhook_logs
  ALTER COLUMN provider SET DEFAULT 'stripe',
  ALTER COLUMN status   SET DEFAULT 'received';

-- 2e. Migrar dados de webhook_events para webhook_logs
--     ON CONFLICT DO NOTHING protege o UNIQUE em event_id
INSERT INTO public.webhook_logs (
  event_id,
  event_type,
  payload,
  processado,
  provider,
  signature,
  headers,
  status,
  created_at,
  processed_at
)
SELECT
  we.event_id,
  we.event_type,
  we.payload,
  (we.status = 'processed')    AS processado,
  we.provider,
  we.signature,
  we.headers,
  we.status,
  we.received_at,
  we.processed_at
FROM public.webhook_events we
ON CONFLICT (event_id) DO NOTHING;

-- 2f. Remover tabela e índice legados
DROP INDEX  IF EXISTS public.idx_webhook_events_event_id_unique;
DROP TABLE  IF EXISTS public.webhook_events;

COMMENT ON TABLE public.webhook_logs IS
  'Log unificado de webhooks para todos os providers (stripe, etc.). '
  'Absorveu webhook_events na migration 20260304000002_structural_refactor. '
  'event_id tem UNIQUE — garante idempotência contra retries do provider.';

-- ============================================================
-- 3. invites.status — corrigir enum (status_indicacao → status_invite)
-- ============================================================
-- Contexto: o campo usava status_indicacao cujos valores (clique, cadastro, convertido,
-- expirado) descrevem progresso de indicação, não estado de um convite.
-- Valores corretos para convites: pendente | usado | expirado.
-- Mapeamento baseia-se nos dados reais:
--   usado_por IS NOT NULL  →  'usado'
--   expira_em < NOW()      →  'expirado'
--   demais casos           →  'pendente'

CREATE TYPE public.status_invite AS ENUM ('pendente', 'usado', 'expirado');

-- Remover DEFAULT antes de alterar o tipo (PostgreSQL exige isso para enums)
ALTER TABLE public.invites
  ALTER COLUMN status DROP DEFAULT;

ALTER TABLE public.invites
  ALTER COLUMN status TYPE public.status_invite
  USING (
    CASE
      WHEN usado_por IS NOT NULL THEN 'usado'::public.status_invite
      WHEN expira_em < NOW()     THEN 'expirado'::public.status_invite
      ELSE                            'pendente'::public.status_invite
    END
  );

ALTER TABLE public.invites
  ALTER COLUMN status SET DEFAULT 'pendente'::public.status_invite;

COMMENT ON COLUMN public.invites.status IS
  'Estado do convite. Usa o enum status_invite (pendente|usado|expirado) após '
  'correção da migration 20260304000002_structural_refactor. '
  'Anteriormente usava status_indicacao por engano.';

-- ============================================================
-- 4. subscriptions — migrar PK de bigint para uuid
-- ============================================================
-- Contexto: única tabela com PK bigint — todas as demais usam uuid.
-- Inconsistência dificulta joins e padrões de código.
-- Nenhuma outra tabela tem FK apontando para subscriptions.id,
-- portanto a mudança é segura sem cascata.

-- 4a. Adicionar coluna uuid já pré-populada
ALTER TABLE public.subscriptions
  ADD COLUMN uuid_id uuid NOT NULL DEFAULT gen_random_uuid();

-- 4b. Substituir a PK
ALTER TABLE public.subscriptions
  DROP CONSTRAINT subscriptions_pkey;

ALTER TABLE public.subscriptions
  ADD CONSTRAINT subscriptions_pkey PRIMARY KEY (uuid_id);

-- 4c. Remover coluna bigint legada e sua sequência
ALTER TABLE public.subscriptions
  DROP COLUMN id;

DROP SEQUENCE IF EXISTS public.subscriptions_id_seq;

-- 4d. Renomear para manter a convenção id em todo o schema
ALTER TABLE public.subscriptions
  RENAME COLUMN uuid_id TO id;

COMMENT ON COLUMN public.subscriptions.id IS
  'PK uuid — migrado de bigint na migration 20260304000002_structural_refactor '
  'para alinhar com o padrão uuid do restante do schema.';
