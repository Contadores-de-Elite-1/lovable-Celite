-- =============================================================================
-- V5.0 Migration 4/4: Criar tabelas do Marketplace e receita da plataforma
-- Data: 2026-03-01
-- Descrição:
--   Cria as 3 tabelas que sustentam o modelo de receita transacional V5.0:
--
--   1. `indicacoes_coworking`  — Fluxo 1: Contador → MPE → Coworking
--      Taxa: 20% sobre comissão do Contador. Funil: pendente→convertida→paga
--
--   2. `mensalidades_coworking` — Fluxo 2: MPE paga mensalidade ao Coworking
--      Taxa: 10% retida pela plataforma. Processada via Webhook Stripe.
--
--   3. `transacoes_plataforma` — Receita consolidada da plataforma
--      Alimentada por Fluxo 1, Fluxo 2, vendas de cursos e mentorias.
--
-- PRÉ-REQUISITO: Migrations 1, 2 e 3 já aplicadas.
-- =============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- Tabela: indicacoes_coworking
-- Fluxo 1 — Indicação de MPE para Coworking pelo Contador
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS indicacoes_coworking (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Atores envolvidos
  contador_id             UUID NOT NULL REFERENCES contadores(id)  ON DELETE RESTRICT,
  mpe_id                  UUID NOT NULL REFERENCES mpes(id)        ON DELETE RESTRICT,
  coworking_id            UUID NOT NULL REFERENCES coworkings(id)  ON DELETE RESTRICT,

  -- Funil de status
  -- pendente → em_negociacao → convertida → paga
  --                         ↘ recusada
  --                         ↘ sem_resposta (após 15 dias sem ação do Coworking)
  status                  VARCHAR(30) NOT NULL DEFAULT 'pendente',
  CONSTRAINT chk_indicacao_status CHECK (
    status IN ('pendente', 'em_negociacao', 'convertida', 'paga', 'recusada', 'sem_resposta')
  ),

  -- Timestamps do funil
  data_indicacao          TIMESTAMPTZ DEFAULT NOW(),
  data_conversao          TIMESTAMPTZ,         -- preenchido quando status = 'convertida'
  data_pagamento          TIMESTAMPTZ,         -- preenchido quando status = 'paga'

  -- Financeiro — Fluxo 1
  -- valor_comissao_bruta: definido pelo Coworking ao confirmar conversão
  valor_comissao_bruta    NUMERIC(12,2),
  taxa_plataforma_pct     NUMERIC(5,2)  DEFAULT 20.00,  -- 20% retido pela plataforma
  taxa_plataforma_valor   NUMERIC(12,2),                -- calculado: bruta × 20%
  valor_contador_liquido  NUMERIC(12,2),                -- calculado: bruta × 80%

  -- Mensagem e motivo
  mensagem_contador       TEXT,        -- mensagem opcional do Contador ao criar indicação
  motivo_recusa           TEXT,        -- preenchido pelo Coworking ao recusar

  -- Metadados
  created_at              TIMESTAMPTZ DEFAULT NOW(),
  updated_at              TIMESTAMPTZ DEFAULT NOW()
);

-- Constraint de integridade financeira:
-- Os valores financeiros só podem ser preenchidos quando a indicação está convertida/paga
ALTER TABLE indicacoes_coworking
  ADD CONSTRAINT chk_valores_apenas_convertida CHECK (
    (status IN ('convertida', 'paga') AND valor_comissao_bruta IS NOT NULL)
    OR (status NOT IN ('convertida', 'paga'))
  );

COMMENT ON TABLE indicacoes_coworking IS
  'V5.0 Marketplace - Fluxo 1. Contador indica MPE a Coworking.
   Quando convertida: plataforma retém 20% do valor bruto, Contador recebe 80%.
   Funil: pendente → em_negociacao → convertida → paga | recusada | sem_resposta.';

COMMENT ON COLUMN indicacoes_coworking.taxa_plataforma_pct IS
  'Percentual retido pela plataforma sobre a comissão do Contador. Padrão: 20%.';

COMMENT ON COLUMN indicacoes_coworking.valor_contador_liquido IS
  'Valor líquido para o Contador após taxa da plataforma (80% do bruto).
   Este valor é registrado em comissoes.valor com tipo=indicacao_coworking.';

-- ─────────────────────────────────────────────────────────────────────────────
-- Tabela: mensalidades_coworking
-- Fluxo 2 — MPE paga mensalidade ao Coworking via Stripe
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS mensalidades_coworking (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Atores envolvidos
  mpe_id                   UUID NOT NULL REFERENCES mpes(id)       ON DELETE RESTRICT,
  coworking_id             UUID NOT NULL REFERENCES coworkings(id) ON DELETE RESTRICT,
  contador_id              UUID REFERENCES contadores(id)          ON DELETE SET NULL,
  -- ^ Contador que originou a indicação. Mantido para rastreabilidade após eventual desativação.

  -- Financeiro — Fluxo 2
  valor_mensalidade        NUMERIC(12,2) NOT NULL CHECK (valor_mensalidade > 0),
  taxa_plataforma_pct      NUMERIC(5,2)  DEFAULT 10.00,  -- 10% retido pela plataforma
  taxa_plataforma_valor    NUMERIC(12,2),                -- calculado: mensalidade × 10%
  valor_coworking_liquido  NUMERIC(12,2),                -- calculado: mensalidade × 90%

  -- Competência e status
  competencia              DATE NOT NULL,                -- YYYY-MM-01 do mês de referência
  status                   VARCHAR(20) DEFAULT 'pendente',
  CONSTRAINT chk_mensalidade_status CHECK (
    status IN ('pendente', 'paga', 'atrasada', 'cancelada')
  ),

  -- Pagamento
  data_pagamento           TIMESTAMPTZ,     -- preenchido pelo webhook Stripe
  stripe_payment_id        VARCHAR(255) UNIQUE, -- idempotência por ID do Stripe

  -- Metadados
  created_at               TIMESTAMPTZ DEFAULT NOW(),
  updated_at               TIMESTAMPTZ DEFAULT NOW(),

  -- Uma MPE só pode ter 1 registro de mensalidade por coworking por mês
  UNIQUE (mpe_id, coworking_id, competencia)
);

COMMENT ON TABLE mensalidades_coworking IS
  'V5.0 Marketplace - Fluxo 2. MPE paga mensalidade ao Coworking via Stripe.
   Webhook Stripe processa: plataforma retém 10%, Coworking recebe 90%.
   Idempotência garantida por stripe_payment_id UNIQUE.';

COMMENT ON COLUMN mensalidades_coworking.competencia IS
  'Mês de referência da mensalidade no formato YYYY-MM-01 (ex: 2026-03-01).';

COMMENT ON COLUMN mensalidades_coworking.contador_id IS
  'Contador que originou a indicação desta MPE. Para rastreabilidade e relatórios.
   NULL se o contador for desativado (ON DELETE SET NULL).';

-- ─────────────────────────────────────────────────────────────────────────────
-- Tabela: transacoes_plataforma
-- Receita consolidada da plataforma (Fluxos 1, 2 + conteúdo pago futuro)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS transacoes_plataforma (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Tipo de receita
  tipo             VARCHAR(30) NOT NULL,
  CONSTRAINT chk_tipo_transacao CHECK (
    tipo IN ('taxa_indicacao', 'taxa_mensalidade', 'venda_curso', 'venda_mentoria')
  ),

  -- Origem (apenas um campo preenchido por vez, conforme tipo)
  indicacao_id     UUID REFERENCES indicacoes_coworking(id)  ON DELETE SET NULL,
  mensalidade_id   UUID REFERENCES mensalidades_coworking(id) ON DELETE SET NULL,
  -- matricula_id e mentoria_id serão adicionados na Fase 4 (Área de Membros)

  -- Valores
  valor_bruto      NUMERIC(12,2) NOT NULL CHECK (valor_bruto > 0),
  taxa_pct         NUMERIC(5,2),          -- percentual aplicado (10% ou 20%)
  valor_plataforma NUMERIC(12,2) NOT NULL CHECK (valor_plataforma > 0),

  -- Competência
  competencia      DATE NOT NULL,         -- YYYY-MM-01

  -- Metadados
  created_at       TIMESTAMPTZ DEFAULT NOW()
  -- Sem updated_at: transações financeiras são imutáveis após criação
);

COMMENT ON TABLE transacoes_plataforma IS
  'V5.0 - Receita consolidada da plataforma.
   taxa_indicacao: 20% sobre Fluxo 1 (indicacao_coworking).
   taxa_mensalidade: 10% sobre Fluxo 2 (mensalidades_coworking).
   venda_curso / venda_mentoria: Área de Membros (Fase 4).
   Registros são IMUTÁVEIS (sem updated_at) para integridade financeira.';

-- ─────────────────────────────────────────────────────────────────────────────
-- Índices de performance
-- ─────────────────────────────────────────────────────────────────────────────

-- indicacoes_coworking
CREATE INDEX IF NOT EXISTS idx_indicacoes_cw_contador
  ON indicacoes_coworking(contador_id);
CREATE INDEX IF NOT EXISTS idx_indicacoes_cw_mpe
  ON indicacoes_coworking(mpe_id);
CREATE INDEX IF NOT EXISTS idx_indicacoes_cw_coworking
  ON indicacoes_coworking(coworking_id);
CREATE INDEX IF NOT EXISTS idx_indicacoes_cw_status
  ON indicacoes_coworking(status);
CREATE INDEX IF NOT EXISTS idx_indicacoes_cw_data_indicacao
  ON indicacoes_coworking(data_indicacao DESC);

-- Índice parcial de unicidade:
-- Evita duplicar indicações ativas para o mesmo par mpe+coworking.
-- Indicações recusadas e pagas são permitidas duplicar (histórico).
CREATE UNIQUE INDEX IF NOT EXISTS idx_indicacoes_cw_active_unique
  ON indicacoes_coworking(mpe_id, coworking_id)
  WHERE status NOT IN ('recusada', 'paga', 'sem_resposta');

-- mensalidades_coworking
CREATE INDEX IF NOT EXISTS idx_mensalidades_cw_mpe
  ON mensalidades_coworking(mpe_id);
CREATE INDEX IF NOT EXISTS idx_mensalidades_cw_coworking
  ON mensalidades_coworking(coworking_id);
CREATE INDEX IF NOT EXISTS idx_mensalidades_cw_contador
  ON mensalidades_coworking(contador_id);
CREATE INDEX IF NOT EXISTS idx_mensalidades_cw_status
  ON mensalidades_coworking(status);
CREATE INDEX IF NOT EXISTS idx_mensalidades_cw_competencia
  ON mensalidades_coworking(competencia DESC);

-- transacoes_plataforma
CREATE INDEX IF NOT EXISTS idx_transacoes_plat_tipo
  ON transacoes_plataforma(tipo);
CREATE INDEX IF NOT EXISTS idx_transacoes_plat_competencia
  ON transacoes_plataforma(competencia DESC);
CREATE INDEX IF NOT EXISTS idx_transacoes_plat_indicacao
  ON transacoes_plataforma(indicacao_id)
  WHERE indicacao_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_transacoes_plat_mensalidade
  ON transacoes_plataforma(mensalidade_id)
  WHERE mensalidade_id IS NOT NULL;

-- ─────────────────────────────────────────────────────────────────────────────
-- Triggers de updated_at
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TRIGGER update_indicacoes_cw_updated_at
  BEFORE UPDATE ON indicacoes_coworking
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_mensalidades_cw_updated_at
  BEFORE UPDATE ON mensalidades_coworking
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- transacoes_plataforma: sem trigger de updated_at (registros imutáveis)

-- ─────────────────────────────────────────────────────────────────────────────
-- Row Level Security
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE indicacoes_coworking   ENABLE ROW LEVEL SECURITY;
ALTER TABLE mensalidades_coworking ENABLE ROW LEVEL SECURITY;
ALTER TABLE transacoes_plataforma  ENABLE ROW LEVEL SECURITY;

-- ── indicacoes_coworking ──────────────────────────────────────────────────────

-- Contador vê suas próprias indicações; Coworking vê indicações recebidas
CREATE POLICY "indicacoes_cw_select" ON indicacoes_coworking
  FOR SELECT
  USING (
    contador_id  = get_contador_id(auth.uid())
    OR coworking_id = get_coworking_id(auth.uid())
    OR has_role(auth.uid(), 'admin')
  );

-- Apenas o Contador pode criar indicações
CREATE POLICY "indicacoes_cw_insert" ON indicacoes_coworking
  FOR INSERT
  WITH CHECK (
    contador_id = get_contador_id(auth.uid())
    OR has_role(auth.uid(), 'admin')
  );

-- Coworking atualiza status (confirmar/recusar); Admin atualiza tudo
CREATE POLICY "indicacoes_cw_update" ON indicacoes_coworking
  FOR UPDATE
  USING (
    coworking_id = get_coworking_id(auth.uid())
    OR has_role(auth.uid(), 'admin')
  );

-- ── mensalidades_coworking ───────────────────────────────────────────────────

-- MPE vê suas mensalidades; Coworking vê mensalidades do seu espaço;
-- Contador vê mensalidades das MPEs que indicou
CREATE POLICY "mensalidades_cw_select" ON mensalidades_coworking
  FOR SELECT
  USING (
    mpe_id       = get_mpe_id(auth.uid())
    OR coworking_id = get_coworking_id(auth.uid())
    OR contador_id  = get_contador_id(auth.uid())
    OR has_role(auth.uid(), 'admin')
  );

-- MPE pode criar/registrar sua mensalidade (ou service_role via webhook)
CREATE POLICY "mensalidades_cw_insert" ON mensalidades_coworking
  FOR INSERT
  WITH CHECK (
    mpe_id = get_mpe_id(auth.uid())
    OR has_role(auth.uid(), 'admin')
  );

-- Apenas admin ou service_role atualiza (processado via webhook Stripe)
CREATE POLICY "mensalidades_cw_update" ON mensalidades_coworking
  FOR UPDATE
  USING (has_role(auth.uid(), 'admin'));

-- ── transacoes_plataforma ────────────────────────────────────────────────────

-- Apenas admin visualiza receita da plataforma
CREATE POLICY "transacoes_plat_admin_only" ON transacoes_plataforma
  FOR ALL
  USING (has_role(auth.uid(), 'admin'));

-- ─────────────────────────────────────────────────────────────────────────────
-- View: resumo de receita da plataforma por mês (para painel admin)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW vw_receita_plataforma_mensal AS
SELECT
  competencia,
  tipo,
  COUNT(*)                                AS total_transacoes,
  SUM(valor_bruto)                        AS total_bruto,
  SUM(valor_plataforma)                   AS total_plataforma,
  ROUND(AVG(taxa_pct), 2)                 AS taxa_media_pct
FROM transacoes_plataforma
GROUP BY competencia, tipo
ORDER BY competencia DESC, tipo;

COMMENT ON VIEW vw_receita_plataforma_mensal IS
  'V5.0 - Resumo mensal de receita da plataforma por tipo de transação.
   Uso exclusivo do painel admin.';

-- ─────────────────────────────────────────────────────────────────────────────
-- View: dashboard do Contador com KPIs de Marketplace (V5.0)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW vw_marketplace_contador AS
SELECT
  ic.contador_id,
  COUNT(*)                                                  AS total_indicacoes,
  COUNT(*) FILTER (WHERE ic.status = 'pendente')            AS indicacoes_pendentes,
  COUNT(*) FILTER (WHERE ic.status = 'convertida')          AS indicacoes_convertidas,
  COUNT(*) FILTER (WHERE ic.status = 'paga')                AS indicacoes_pagas,
  COALESCE(SUM(ic.valor_contador_liquido)
    FILTER (WHERE ic.status IN ('convertida', 'paga')), 0)  AS total_comissoes_indicacao,
  -- MPEs ativas no coworking originadas por este Contador
  COUNT(DISTINCT m.id) FILTER (
    WHERE m.contador_responsavel_id = ic.contador_id
    AND m.ativo = TRUE
  )                                                         AS mpes_ativas_coworking
FROM indicacoes_coworking ic
LEFT JOIN mpes m ON m.id = ic.mpe_id
GROUP BY ic.contador_id;

COMMENT ON VIEW vw_marketplace_contador IS
  'V5.0 - KPIs de Marketplace por Contador: total de indicações, conversões e comissões.
   Usado no Dashboard do Contador (bloco de KPIs V5.0).';

-- ─────────────────────────────────────────────────────────────────────────────
-- Log de migração
-- ─────────────────────────────────────────────────────────────────────────────
DO $$
BEGIN
  RAISE NOTICE '[V5.0 Migration 4/4] Tabelas do Marketplace criadas com sucesso:
    - indicacoes_coworking     (Fluxo 1: taxa 20%%)
    - mensalidades_coworking   (Fluxo 2: taxa 10%%)
    - transacoes_plataforma    (receita consolidada)
    Views criadas:
    - vw_receita_plataforma_mensal
    - vw_marketplace_contador
    FASE 1 CONCLUÍDA! Próximos passos:
    - Atualizar Edge Function webhook-stripe
    - Criar Edge Functions indicacao-coworking e confirmar-conversao
    - Atualizar Auth page para seleção de perfil
    - Atualizar ProtectedRoute e AppSidebar';
END $$;
