-- MILESTONE 5: Add Critical Approval Infrastructure
-- Creates missing tables and improves approval workflow tracking

-- 1. Create comissoes_calculo_log table (referenced in executar_calculo_comissoes RPC)
CREATE TABLE IF NOT EXISTS public.comissoes_calculo_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comissao_id UUID NOT NULL REFERENCES public.comissoes(id) ON DELETE CASCADE,
  regra_aplicada TEXT,
  valores_intermediarios JSONB,
  resultado_final NUMERIC(10, 2),
  calculado_em TIMESTAMPTZ DEFAULT now(),
  observacoes TEXT,

  -- Indexes for queries
  UNIQUE(comissao_id),
  CONSTRAINT valor_positivo CHECK (resultado_final > 0)
);

CREATE INDEX idx_comissoes_calculo_log_comissao_id ON public.comissoes_calculo_log(comissao_id);
CREATE INDEX idx_comissoes_calculo_log_calculado_em ON public.comissoes_calculo_log(calculado_em);

-- 2. Create approval_emails table (track email sends for approvals)
CREATE TABLE IF NOT EXISTS public.approval_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comissao_id UUID NOT NULL REFERENCES public.comissoes(id) ON DELETE CASCADE,
  contador_id UUID NOT NULL REFERENCES public.contadores(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('approval_pending', 'approved', 'rejected', 'payment_processed')),
  destinatario TEXT NOT NULL,
  enviado_em TIMESTAMPTZ DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'enviado' CHECK (status IN ('enviado', 'falhou', 'bounce')),
  erro TEXT,
  tentativas INTEGER DEFAULT 1,
  proxima_tentativa TIMESTAMPTZ,

  UNIQUE(comissao_id, tipo, destinatario)
);

CREATE INDEX idx_approval_emails_contador_id ON public.approval_emails(contador_id);
CREATE INDEX idx_approval_emails_status ON public.approval_emails(status);
CREATE INDEX idx_approval_emails_tipo ON public.approval_emails(tipo);
CREATE INDEX idx_approval_emails_enviado_em ON public.approval_emails(enviado_em);

-- 3. Create approval_comments table (track admin notes/comments)
CREATE TABLE IF NOT EXISTS public.approval_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comissao_id UUID NOT NULL REFERENCES public.comissoes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  comentario TEXT NOT NULL,
  visivel_para_contador BOOLEAN DEFAULT FALSE,
  criado_em TIMESTAMPTZ DEFAULT now(),
  atualizado_em TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_approval_comments_comissao_id ON public.approval_comments(comissao_id);
CREATE INDEX idx_approval_comments_user_id ON public.approval_comments(user_id);
CREATE INDEX idx_approval_comments_criado_em ON public.approval_comments(criado_em DESC);

-- 4. Enhance comissoes_status_historico with more fields (already exists, just adding constraints)
-- This is already created in earlier migrations, just ensure RLS is correct

-- 5. Create approval_rules table (for future auto-approval rules)
CREATE TABLE IF NOT EXISTS public.approval_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL UNIQUE,
  descricao TEXT,
  condicoes JSONB NOT NULL,
  acao TEXT NOT NULL CHECK (acao IN ('auto_approve', 'escalate', 'hold', 'rejeitar')),
  prioridade INTEGER DEFAULT 100,
  ativo BOOLEAN DEFAULT TRUE,
  criado_por UUID REFERENCES auth.users(id),
  criado_em TIMESTAMPTZ DEFAULT now(),
  atualizado_em TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_approval_rules_ativo ON public.approval_rules(ativo);
CREATE INDEX idx_approval_rules_prioridade ON public.approval_rules(prioridade DESC);

-- 6. RLS Policies

-- comissoes_calculo_log: Admins and own contadores can read
ALTER TABLE public.comissoes_calculo_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins_can_read_calculo_log" ON public.comissoes_calculo_log
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role = 'admin'
    )
  );

CREATE POLICY "contadores_can_read_own_calculo_log" ON public.comissoes_calculo_log
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.comissoes c
      WHERE c.id = comissao_id
      AND c.contador_id = auth.uid()
    )
  );

-- approval_emails: Only admins and service_role can write/read
ALTER TABLE public.approval_emails ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins_can_manage_approval_emails" ON public.approval_emails
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role = 'admin'
    )
  );

-- approval_comments: Admins can read all, contadores can read visible ones on own commissions
ALTER TABLE public.approval_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins_can_manage_approval_comments" ON public.approval_comments
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role = 'admin'
    )
  );

CREATE POLICY "contadores_can_read_visible_comments" ON public.approval_comments
  FOR SELECT
  USING (
    visivel_para_contador
    AND EXISTS (
      SELECT 1 FROM public.comissoes c
      WHERE c.id = comissao_id
      AND c.contador_id = auth.uid()
    )
  );

-- approval_rules: Only admins
ALTER TABLE public.approval_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "only_admins_can_manage_approval_rules" ON public.approval_rules
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role = 'admin'
    )
  );

-- 7. Create views for easier querying

-- View: Approval timeline for a commission
CREATE OR REPLACE VIEW vw_comissao_approval_timeline AS
SELECT
  c.id as comissao_id,
  c.contador_id,
  c.tipo_comissao,
  c.valor,
  c.status_comissao,
  c.competencia,
  csh.status_anterior,
  csh.status_novo,
  csh.alterado_por,
  csh.alterado_em,
  csh.motivo as rejection_reason,
  ac.comentario,
  ac.user_id as comentario_user_id
FROM public.comissoes c
LEFT JOIN public.comissoes_status_historico csh ON c.id = csh.comissao_id
LEFT JOIN public.approval_comments ac ON c.id = ac.comissao_id
ORDER BY csh.alterado_em DESC, ac.criado_em DESC;

-- View: Pending approvals with contador info
CREATE OR REPLACE VIEW vw_pending_approvals AS
SELECT
  c.id,
  c.contador_id,
  c.tipo_comissao,
  c.valor,
  c.competencia,
  c.cliente_id,
  c.created_at,
  c.updated_at,
  ct.nome as contador_nome,
  ct.email as contador_email,
  ct.nivel as contador_nivel,
  cl.nome as cliente_nome,
  DATE_TRUNC('day', NOW()) - DATE_TRUNC('day', c.created_at) as dias_aguardando,
  COUNT(ac.id) as total_comentarios
FROM public.comissoes c
JOIN public.contadores ct ON c.contador_id = ct.id
LEFT JOIN public.clientes cl ON c.cliente_id = cl.id
LEFT JOIN public.approval_comments ac ON c.id = ac.comissao_id
WHERE c.status_comissao = 'calculada'
GROUP BY c.id, ct.id, cl.id
ORDER BY c.created_at ASC;

-- View: Approval statistics
CREATE OR REPLACE VIEW vw_approval_stats AS
SELECT
  DATE_TRUNC('day', c.created_at)::date as data,
  c.status_comissao,
  COUNT(*) as total,
  SUM(c.valor) as valor_total,
  AVG(c.valor) as valor_medio
FROM public.comissoes c
WHERE c.created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE_TRUNC('day', c.created_at), c.status_comissao
ORDER BY data DESC, c.status_comissao;

-- 8. Create function to safely update commission status with audit
CREATE OR REPLACE FUNCTION public.fn_aprovar_comissao(
  p_comissao_id UUID,
  p_user_id UUID,
  p_observacao TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_comissao RECORD;
  v_result JSON;
BEGIN
  -- Verify user is admin
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = p_user_id AND role = 'admin'
  ) THEN
    RETURN JSON_BUILD_OBJECT(
      'success', FALSE,
      'error', 'Apenas admins podem aprovar comissões'
    );
  END IF;

  -- Get commission
  SELECT * INTO v_comissao FROM public.comissoes WHERE id = p_comissao_id;

  IF NOT FOUND THEN
    RETURN JSON_BUILD_OBJECT(
      'success', FALSE,
      'error', 'Comissão não encontrada'
    );
  END IF;

  -- Update commission status
  UPDATE public.comissoes
  SET status_comissao = 'aprovada'
  WHERE id = p_comissao_id;

  -- Record status change
  INSERT INTO public.comissoes_status_historico (
    comissao_id,
    status_anterior,
    status_novo,
    alterado_por,
    motivo
  ) VALUES (
    p_comissao_id,
    v_comissao.status_comissao,
    'aprovada',
    p_user_id,
    p_observacao
  );

  -- Log to audit
  INSERT INTO public.audit_logs (
    acao,
    tabela,
    registro_id,
    user_id,
    payload
  ) VALUES (
    'COMISSAO_APROVADA',
    'comissoes',
    p_comissao_id,
    p_user_id,
    JSON_BUILD_OBJECT(
      'status_anterior', v_comissao.status_comissao,
      'valor', v_comissao.valor,
      'contador_id', v_comissao.contador_id,
      'observacao', p_observacao
    )
  );

  v_result := JSON_BUILD_OBJECT(
    'success', TRUE,
    'message', 'Comissão aprovada com sucesso',
    'comissao_id', p_comissao_id,
    'valor', v_comissao.valor,
    'contador_id', v_comissao.contador_id
  );

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Similar function for rejection
CREATE OR REPLACE FUNCTION public.fn_rejeitar_comissao(
  p_comissao_id UUID,
  p_user_id UUID,
  p_motivo TEXT
)
RETURNS JSON AS $$
DECLARE
  v_comissao RECORD;
  v_result JSON;
BEGIN
  -- Verify user is admin
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = p_user_id AND role = 'admin'
  ) THEN
    RETURN JSON_BUILD_OBJECT(
      'success', FALSE,
      'error', 'Apenas admins podem rejeitar comissões'
    );
  END IF;

  -- Get commission
  SELECT * INTO v_comissao FROM public.comissoes WHERE id = p_comissao_id;

  IF NOT FOUND THEN
    RETURN JSON_BUILD_OBJECT(
      'success', FALSE,
      'error', 'Comissão não encontrada'
    );
  END IF;

  -- Update commission status
  UPDATE public.comissoes
  SET status_comissao = 'cancelada', observacao = p_motivo
  WHERE id = p_comissao_id;

  -- Record status change
  INSERT INTO public.comissoes_status_historico (
    comissao_id,
    status_anterior,
    status_novo,
    alterado_por,
    motivo
  ) VALUES (
    p_comissao_id,
    v_comissao.status_comissao,
    'cancelada',
    p_user_id,
    p_motivo
  );

  -- Log to audit
  INSERT INTO public.audit_logs (
    acao,
    tabela,
    registro_id,
    user_id,
    payload
  ) VALUES (
    'COMISSAO_REJEITADA',
    'comissoes',
    p_comissao_id,
    p_user_id,
    JSON_BUILD_OBJECT(
      'status_anterior', v_comissao.status_comissao,
      'valor', v_comissao.valor,
      'contador_id', v_comissao.contador_id,
      'motivo', p_motivo
    )
  );

  v_result := JSON_BUILD_OBJECT(
    'success', TRUE,
    'message', 'Comissão rejeitada com sucesso',
    'comissao_id', p_comissao_id,
    'valor', v_comissao.valor,
    'contador_id', v_comissao.contador_id
  );

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.fn_aprovar_comissao TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.fn_rejeitar_comissao TO authenticated, service_role;

-- 9. Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_comissoes_status ON public.comissoes(status_comissao);
CREATE INDEX IF NOT EXISTS idx_comissoes_competencia ON public.comissoes(competencia);
CREATE INDEX IF NOT EXISTS idx_comissoes_contador_status ON public.comissoes(contador_id, status_comissao);

-- 10. Add comment on migration
COMMENT ON TABLE public.comissoes_calculo_log IS 'MILESTONE 5: Tracks commission calculation details for audit and troubleshooting';
COMMENT ON TABLE public.approval_emails IS 'MILESTONE 5: Tracks email notifications sent for commission approvals';
COMMENT ON TABLE public.approval_comments IS 'MILESTONE 5: Stores admin comments on commissions for approval workflow';
COMMENT ON TABLE public.approval_rules IS 'MILESTONE 5: Auto-approval rules for future automation';
