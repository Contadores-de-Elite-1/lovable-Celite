-- =============================================================================
-- V5.0 Migration 3/4: Criar tabelas mpes e coworkings (novos atores V5.0)
-- Data: 2026-03-01
-- Descrição:
--   Cria os dois novos atores do ecossistema tripartite:
--   - `coworkings`: parceiros de espaço (criado antes de mpes por dependência de FK)
--   - `mpes`: micro e pequenas empresas com conta própria na plataforma
--
--   Inclui:
--   - Helper functions para RLS (get_mpe_id, get_coworking_id)
--   - Triggers de updated_at
--   - RLS com isolamento por perfil
--   - Índices de performance
-- =============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- Tabela: coworkings
-- Criada ANTES das funções helper e de mpes porque mpes tem FK para coworkings
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS coworkings (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome_fantasia         VARCHAR(255) NOT NULL,
  razao_social          VARCHAR(255),
  cnpj                  VARCHAR(20) UNIQUE NOT NULL,
  telefone              VARCHAR(20),
  email_comercial       VARCHAR(255),
  endereco_completo     TEXT,
  cidade                VARCHAR(100) NOT NULL,
  estado                VARCHAR(2) NOT NULL,
  capacidade_mpes       INTEGER,
  -- Controle de onboarding
  onboarding_concluido  BOOLEAN DEFAULT FALSE,
  -- Metadados
  ativo                 BOOLEAN DEFAULT TRUE,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE coworkings IS
  'V5.0 - Parceiros de espaço de trabalho. Recebem MPEs indicadas por Contadores.
   Cada coworking tem user_id próprio (login na plataforma). Cadastro gratuito.';

-- ─────────────────────────────────────────────────────────────────────────────
-- Tabela: mpes (criada depois de coworkings por causa da FK coworking_ativo_id)
-- ─────────────────────────────────────────────────────────────────────────────
-- Perfil completo da Micro/Pequena Empresa com conta própria
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS mpes (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                  UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome_empresa             VARCHAR(255) NOT NULL,
  cnpj                     VARCHAR(20) UNIQUE NOT NULL,
  segmento                 VARCHAR(100),
  porte                    VARCHAR(20) DEFAULT 'micro'
                             CHECK (porte IN ('micro', 'pequena')),
  telefone                 VARCHAR(20),
  email_comercial          VARCHAR(255),
  cidade                   VARCHAR(100),
  estado                   VARCHAR(2),
  -- Vínculos no ecossistema tripartite
  contador_responsavel_id  UUID REFERENCES contadores(id) ON DELETE SET NULL,
  coworking_ativo_id       UUID REFERENCES coworkings(id) ON DELETE SET NULL,
  -- Controle de onboarding
  onboarding_concluido     BOOLEAN DEFAULT FALSE,
  -- Metadados
  ativo                    BOOLEAN DEFAULT TRUE,
  created_at               TIMESTAMPTZ DEFAULT NOW(),
  updated_at               TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE mpes IS
  'V5.0 - Micro e Pequenas Empresas com conta própria na plataforma.
   São indicadas por Contadores a Coworkings (Marketplace).
   Acessam Área de Membros, pagam mensalidade do Coworking via Stripe.';

COMMENT ON COLUMN mpes.contador_responsavel_id IS
  'Contador que indicou esta MPE. Recebe comissões sobre os pagamentos desta MPE.';

COMMENT ON COLUMN mpes.coworking_ativo_id IS
  'Coworking onde esta MPE está atualmente ativa. Atualizado quando indicação é convertida.';

-- ─────────────────────────────────────────────────────────────────────────────
-- Helper Functions
-- Criadas DEPOIS das tabelas para que o PostgreSQL valide as referências
-- ─────────────────────────────────────────────────────────────────────────────

-- Retorna o UUID do registro `coworkings` para o user_id informado
-- Retorna NULL se o usuário não for um coworking (seguro para RLS)
CREATE OR REPLACE FUNCTION get_coworking_id(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.coworkings WHERE user_id = _user_id LIMIT 1
$$;

-- Retorna o UUID do registro `mpes` para o user_id informado
-- Retorna NULL se o usuário não for uma MPE (seguro para RLS)
CREATE OR REPLACE FUNCTION get_mpe_id(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.mpes WHERE user_id = _user_id LIMIT 1
$$;

COMMENT ON FUNCTION get_coworking_id(UUID) IS
  'Retorna coworking_id pelo user_id. Retorna NULL se não for coworking. Usado em RLS. V5.0';

COMMENT ON FUNCTION get_mpe_id(UUID) IS
  'Retorna mpe_id pelo user_id. Retorna NULL se não for MPE. Usado em RLS. V5.0';

-- ─────────────────────────────────────────────────────────────────────────────
-- Índices de performance
-- ─────────────────────────────────────────────────────────────────────────────

-- coworkings
CREATE INDEX IF NOT EXISTS idx_coworkings_user_id     ON coworkings(user_id);
CREATE INDEX IF NOT EXISTS idx_coworkings_cnpj         ON coworkings(cnpj);
CREATE INDEX IF NOT EXISTS idx_coworkings_ativo        ON coworkings(ativo) WHERE ativo = TRUE;
CREATE INDEX IF NOT EXISTS idx_coworkings_cidade       ON coworkings(cidade);

-- mpes
CREATE INDEX IF NOT EXISTS idx_mpes_user_id            ON mpes(user_id);
CREATE INDEX IF NOT EXISTS idx_mpes_cnpj               ON mpes(cnpj);
CREATE INDEX IF NOT EXISTS idx_mpes_contador_id        ON mpes(contador_responsavel_id);
CREATE INDEX IF NOT EXISTS idx_mpes_coworking_id       ON mpes(coworking_ativo_id);
CREATE INDEX IF NOT EXISTS idx_mpes_ativo              ON mpes(ativo) WHERE ativo = TRUE;

-- ─────────────────────────────────────────────────────────────────────────────
-- Triggers de updated_at
-- Reutiliza a função update_updated_at_column() criada na migration inicial
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TRIGGER update_coworkings_updated_at
  BEFORE UPDATE ON coworkings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_mpes_updated_at
  BEFORE UPDATE ON mpes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ─────────────────────────────────────────────────────────────────────────────
-- Row Level Security
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE coworkings ENABLE ROW LEVEL SECURITY;
ALTER TABLE mpes       ENABLE ROW LEVEL SECURITY;

-- ── coworkings ────────────────────────────────────────────────────────────────

-- Coworking vê e edita apenas seus próprios dados
CREATE POLICY "coworkings_owner_select" ON coworkings
  FOR SELECT
  USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin'));

CREATE POLICY "coworkings_owner_insert" ON coworkings
  FOR INSERT
  WITH CHECK (user_id = auth.uid() OR has_role(auth.uid(), 'admin'));

CREATE POLICY "coworkings_owner_update" ON coworkings
  FOR UPDATE
  USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin'));

-- Contadores podem VER coworkings ativos (para criar indicações)
CREATE POLICY "coworkings_contador_select_ativos" ON coworkings
  FOR SELECT
  USING (ativo = TRUE AND has_role(auth.uid(), 'contador'));

-- ── mpes ──────────────────────────────────────────────────────────────────────

-- MPE vê e edita apenas seus próprios dados
CREATE POLICY "mpes_owner_select" ON mpes
  FOR SELECT
  USING (
    user_id = auth.uid()
    -- O contador responsável vê as MPEs da sua carteira
    OR contador_responsavel_id = get_contador_id(auth.uid())
    -- O coworking vê as MPEs ativas no seu espaço
    OR coworking_ativo_id = get_coworking_id(auth.uid())
    OR has_role(auth.uid(), 'admin')
  );

CREATE POLICY "mpes_owner_insert" ON mpes
  FOR INSERT
  WITH CHECK (user_id = auth.uid() OR has_role(auth.uid(), 'admin'));

CREATE POLICY "mpes_owner_update" ON mpes
  FOR UPDATE
  USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin'));

-- ─────────────────────────────────────────────────────────────────────────────
-- Grants para autenticados e service_role
-- ─────────────────────────────────────────────────────────────────────────────

GRANT EXECUTE ON FUNCTION get_coworking_id(UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION get_mpe_id(UUID)        TO authenticated, service_role;

-- ─────────────────────────────────────────────────────────────────────────────
-- Log de migração
-- ─────────────────────────────────────────────────────────────────────────────
DO $$
BEGIN
  RAISE NOTICE '[V5.0 Migration 3/4] Tabelas mpes e coworkings criadas com sucesso.
    Funções helper: get_coworking_id(), get_mpe_id()
    RLS: habilitado com isolamento por perfil
    PRÓXIMO PASSO: Migration 4 - criar tabelas do Marketplace.';
END $$;
