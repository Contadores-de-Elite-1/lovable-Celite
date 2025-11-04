-- ============================================================================
-- CONTADORES DE ELITE - BACKEND AUDITADO - COMPLEMENTAR
-- ============================================================================

-- Criar tipos ENUM (sem duplicar se já existem)
DO $$ BEGIN
  CREATE TYPE payment_status AS ENUM ('pending','confirmed','failed','refunded','chargeback');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE payment_type AS ENUM ('ativacao','recorrente');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE commission_status AS ENUM ('calculada','aprovada','paga','estornada','cancelada');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE commission_type AS ENUM ('direta','indireta_n1','indireta_n2','bonus');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE cliente_status AS ENUM ('lead','ativo','inativo','cancelado');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE link_type AS ENUM ('cliente','contador');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE link_channel AS ENUM ('whatsapp','email','linkedin','outros');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE material_tipo AS ENUM ('pdf','xlsx','pptx','mp4','docx');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Extensões
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================================
-- NOVAS TABELAS
-- ============================================================================

-- Histórico de Status de Comissões (Transparência)
CREATE TABLE IF NOT EXISTS comissoes_status_historico (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comissao_id UUID NOT NULL REFERENCES comissoes(id) ON DELETE CASCADE,
  status_anterior TEXT,
  status_novo TEXT NOT NULL,
  alterado_por UUID REFERENCES auth.users(id),
  alterado_em TIMESTAMPTZ DEFAULT now(),
  motivo TEXT NOT NULL,
  ip_address INET,
  user_agent TEXT
);

CREATE INDEX IF NOT EXISTS idx_comissao_hist_comissao ON comissoes_status_historico(comissao_id);
CREATE INDEX IF NOT EXISTS idx_comissao_hist_data ON comissoes_status_historico(alterado_em);

-- Reconciliação Financeira
CREATE TABLE IF NOT EXISTS reconciliacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competencia DATE NOT NULL UNIQUE,
  total_asaas NUMERIC(12,2) NOT NULL,
  total_banco NUMERIC(12,2) NOT NULL,
  diferenca NUMERIC(12,2) GENERATED ALWAYS AS (total_asaas - total_banco) STORED,
  status TEXT DEFAULT 'pendente',
  reconciliado_por UUID REFERENCES auth.users(id),
  reconciliado_em TIMESTAMPTZ,
  observacoes TEXT,
  payload_asaas JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reconciliacoes_competencia ON reconciliacoes(competencia);
CREATE INDEX IF NOT EXISTS idx_reconciliacoes_status ON reconciliacoes(status);

-- Notificações
CREATE TABLE IF NOT EXISTS notificacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contador_id UUID NOT NULL REFERENCES contadores(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL,
  titulo TEXT NOT NULL,
  mensagem TEXT NOT NULL,
  lida BOOLEAN DEFAULT false,
  lida_em TIMESTAMPTZ,
  payload JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notif_contador_nao_lida ON notificacoes(contador_id, lida, created_at) WHERE lida = false;

-- Links
CREATE TABLE IF NOT EXISTS links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contador_id UUID NOT NULL REFERENCES contadores(id) ON DELETE CASCADE,
  tipo link_type NOT NULL,
  canal link_channel NOT NULL DEFAULT 'outros',
  token TEXT NOT NULL UNIQUE,
  target_url TEXT,
  cliques INT NOT NULL DEFAULT 0,
  conversoes INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_links_contador ON links(contador_id);
CREATE INDEX IF NOT EXISTS idx_links_tipo ON links(tipo);
CREATE INDEX IF NOT EXISTS idx_links_token ON links(token);

-- Logs de Clique
CREATE TABLE IF NOT EXISTS click_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  link_id UUID NOT NULL REFERENCES links(id) ON DELETE CASCADE,
  contador_id UUID NOT NULL REFERENCES contadores(id) ON DELETE CASCADE,
  ip INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_click_logs_link ON click_logs(link_id);

-- Simulações
CREATE TABLE IF NOT EXISTS simulacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contador_id UUID NOT NULL REFERENCES contadores(id) ON DELETE CASCADE,
  clientes_mes INT NOT NULL DEFAULT 0,
  contadores_mes INT NOT NULL DEFAULT 0,
  clientes_por_contador INT NOT NULL DEFAULT 0,
  valor_mensalidade NUMERIC(12,2) NOT NULL DEFAULT 0,
  resultado_conservador NUMERIC(12,2) NOT NULL DEFAULT 0,
  resultado_realista NUMERIC(12,2) NOT NULL DEFAULT 0,
  resultado_otimista NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_simulacoes_contador ON simulacoes(contador_id);

-- Cursos EAD
CREATE TABLE IF NOT EXISTS courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  duracao INT,
  nivel TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Matrículas EAD
CREATE TABLE IF NOT EXISTS enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contador_id UUID NOT NULL REFERENCES contadores(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  progresso INT NOT NULL DEFAULT 0 CHECK (progresso BETWEEN 0 AND 100),
  status TEXT NOT NULL DEFAULT 'em_andamento',
  certificado_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (contador_id, course_id)
);

CREATE INDEX IF NOT EXISTS idx_enrollments_contador ON enrollments(contador_id);

-- Materiais
CREATE TABLE IF NOT EXISTS materiais (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  tipo material_tipo NOT NULL,
  categoria TEXT,
  tags TEXT[],
  downloads INT NOT NULL DEFAULT 0,
  owner_id UUID REFERENCES contadores(id) ON DELETE SET NULL,
  publico BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_materiais_tags ON materiais USING gin (tags);
CREATE INDEX IF NOT EXISTS idx_materiais_tipo ON materiais(tipo);

-- Assistente Logs
CREATE TABLE IF NOT EXISTS assistente_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contador_id UUID REFERENCES contadores(id) ON DELETE SET NULL,
  mensagem_usuario TEXT NOT NULL,
  resposta_assistente TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_assistente_contador ON assistente_logs(contador_id);

-- ============================================================================
-- TRIGGERS DE PROTEÇÃO (IMUTABILIDADE FINANCEIRA)
-- ============================================================================

-- Proteger pagamentos confirmados
CREATE OR REPLACE FUNCTION protect_confirmed_payments()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IN ('confirmed','refunded') AND NEW.status != OLD.status THEN
    RAISE EXCEPTION 'Pagamentos confirmados/estornados são imutáveis. Use estorno formal.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS payments_immutability ON pagamentos;
CREATE TRIGGER payments_immutability
  BEFORE UPDATE ON pagamentos
  FOR EACH ROW EXECUTE FUNCTION protect_confirmed_payments();

-- Proteger comissões pagas
CREATE OR REPLACE FUNCTION protect_paid_commissions()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' AND OLD.status = 'paga' THEN
    RAISE EXCEPTION 'Comissões pagas não podem ser deletadas. ID: %', OLD.id;
  END IF;
  
  IF TG_OP = 'UPDATE' AND OLD.status = 'paga' THEN
    IF NEW.valor != OLD.valor OR NEW.status != OLD.status THEN
      RAISE EXCEPTION 'Comissões pagas são imutáveis. Use estorno formal. ID: %', OLD.id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS commissions_immutability ON comissoes;
CREATE TRIGGER commissions_immutability
  BEFORE UPDATE OR DELETE ON comissoes
  FOR EACH ROW EXECUTE FUNCTION protect_paid_commissions();

-- Rastrear mudanças de status automaticamente
CREATE OR REPLACE FUNCTION track_commission_status_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO comissoes_status_historico (
      comissao_id, status_anterior, status_novo, alterado_por, motivo
    ) VALUES (
      NEW.id, OLD.status::text, NEW.status::text, auth.uid(), 
      COALESCE(NEW.observacao, 'Mudança automática de status')
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS track_commission_status ON comissoes;
CREATE TRIGGER track_commission_status
  AFTER UPDATE ON comissoes
  FOR EACH ROW EXECUTE FUNCTION track_commission_status_changes();

-- ============================================================================
-- FUNÇÕES UTILITÁRIAS E RPCS
-- ============================================================================

CREATE OR REPLACE FUNCTION sanitize_audit_payload(raw_payload JSONB)
RETURNS JSONB AS $$
  SELECT jsonb_strip_nulls(jsonb_build_object(
    'action', raw_payload->>'action',
    'affected_count', raw_payload->>'affected_count',
    'metadata', raw_payload->'metadata'
  ));
$$ LANGUAGE sql IMMUTABLE;

CREATE OR REPLACE FUNCTION encrypt_sensitive(data TEXT)
RETURNS TEXT AS $$
  SELECT encode(pgp_sym_encrypt(data, COALESCE(current_setting('app.encryption_key', true), 'default-key-change-me')), 'base64');
$$ LANGUAGE sql IMMUTABLE;

CREATE OR REPLACE FUNCTION decrypt_sensitive(encrypted TEXT)
RETURNS TEXT AS $$
  SELECT pgp_sym_decrypt(decode(encrypted, 'base64'), COALESCE(current_setting('app.encryption_key', true), 'default-key-change-me'));
$$ LANGUAGE sql IMMUTABLE;

CREATE OR REPLACE FUNCTION registrar_clique(p_token TEXT)
RETURNS TABLE (link_id UUID, contador_id UUID, tipo link_type, redirect TEXT)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_link links;
BEGIN
  SELECT * INTO v_link FROM links WHERE token = p_token;
  IF NOT FOUND THEN RAISE EXCEPTION 'Link não encontrado'; END IF;
  INSERT INTO click_logs(link_id, contador_id) VALUES (v_link.id, v_link.contador_id);
  UPDATE links SET cliques = cliques + 1 WHERE id = v_link.id;
  RETURN QUERY SELECT v_link.id, v_link.contador_id, v_link.tipo, COALESCE(v_link.target_url, '');
END;
$$;

GRANT EXECUTE ON FUNCTION registrar_clique(TEXT) TO anon, authenticated;

-- ============================================================================
-- VIEWS
-- ============================================================================

CREATE OR REPLACE VIEW vw_links_desempenho AS
SELECT l.id, l.contador_id, l.tipo, l.canal, l.token, l.cliques, l.conversoes,
  CASE WHEN l.cliques > 0 THEN ROUND((l.conversoes::numeric / l.cliques::numeric)*100, 2) ELSE 0 END as taxa,
  l.created_at
FROM links l;

CREATE OR REPLACE VIEW cursos_edu AS
SELECT e.id, c.titulo, c.duracao, c.nivel, e.progresso, e.status, e.certificado_url, e.contador_id
FROM enrollments e JOIN courses c ON c.id = e.course_id;

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

ALTER TABLE comissoes_status_historico ENABLE ROW LEVEL SECURITY;
ALTER TABLE reconciliacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE notificacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE links ENABLE ROW LEVEL SECURITY;
ALTER TABLE click_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE simulacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE materiais ENABLE ROW LEVEL SECURITY;
ALTER TABLE assistente_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "historico_select_own" ON comissoes_status_historico FOR SELECT USING (
  has_role(auth.uid(), 'admin') OR EXISTS (
    SELECT 1 FROM comissoes c WHERE c.id = comissoes_status_historico.comissao_id 
    AND c.contador_id = get_contador_id(auth.uid())
  )
);

CREATE POLICY "reconciliacoes_admin" ON reconciliacoes FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "notificacoes_all_own" ON notificacoes FOR ALL USING (has_role(auth.uid(), 'admin') OR contador_id = get_contador_id(auth.uid()));
CREATE POLICY "links_all_own" ON links FOR ALL USING (has_role(auth.uid(), 'admin') OR contador_id = get_contador_id(auth.uid()));
CREATE POLICY "click_logs_select_own" ON click_logs FOR SELECT USING (has_role(auth.uid(), 'admin') OR contador_id = get_contador_id(auth.uid()));
CREATE POLICY "simulacoes_all_own" ON simulacoes FOR ALL USING (has_role(auth.uid(), 'admin') OR contador_id = get_contador_id(auth.uid()));
CREATE POLICY "courses_select_all" ON courses FOR SELECT USING (true);
CREATE POLICY "enrollments_all_own" ON enrollments FOR ALL USING (has_role(auth.uid(), 'admin') OR contador_id = get_contador_id(auth.uid()));
CREATE POLICY "materiais_select" ON materiais FOR SELECT USING (publico = true OR has_role(auth.uid(), 'admin') OR owner_id = get_contador_id(auth.uid()));
CREATE POLICY "materiais_insert" ON materiais FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin') OR owner_id = get_contador_id(auth.uid()));
CREATE POLICY "materiais_update" ON materiais FOR UPDATE USING (has_role(auth.uid(), 'admin') OR owner_id = get_contador_id(auth.uid()));
CREATE POLICY "assistente_all_own" ON assistente_logs FOR ALL USING (has_role(auth.uid(), 'admin') OR contador_id = get_contador_id(auth.uid()));