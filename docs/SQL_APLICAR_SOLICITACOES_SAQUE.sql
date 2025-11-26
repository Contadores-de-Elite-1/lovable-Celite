-- Migration: Adicionar sistema de saques
-- Data: 2025-11-26

-- 1. Criar tabela solicitacoes_saque
CREATE TABLE IF NOT EXISTS public.solicitacoes_saque (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contador_id UUID NOT NULL REFERENCES public.contadores(id) ON DELETE CASCADE,
  valor_solicitado NUMERIC(10, 2) NOT NULL CHECK (valor_solicitado >= 100),
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'processada', 'rejeitada')),
  comissoes_ids UUID[] NOT NULL,
  metodo_pagamento TEXT NOT NULL CHECK (metodo_pagamento IN ('pix', 'transferencia')),
  dados_bancarios JSONB NOT NULL,
  solicitado_em TIMESTAMPTZ DEFAULT now(),
  processada_em TIMESTAMPTZ,
  processada_por UUID REFERENCES auth.users(id),
  observacao TEXT,
  comprovante_url TEXT,

  UNIQUE(id)
);

-- 2. Indices para consultas
CREATE INDEX IF NOT EXISTS idx_solicitacoes_saque_contador ON public.solicitacoes_saque(contador_id);
CREATE INDEX IF NOT EXISTS idx_solicitacoes_saque_status ON public.solicitacoes_saque(status);
CREATE INDEX IF NOT EXISTS idx_solicitacoes_saque_solicitado_em ON public.solicitacoes_saque(solicitado_em DESC);
CREATE INDEX IF NOT EXISTS idx_solicitacoes_saque_contador_status ON public.solicitacoes_saque(contador_id, status);

-- 3. Policies RLS

ALTER TABLE public.solicitacoes_saque ENABLE ROW LEVEL SECURITY;

-- Remover policies existentes se houver
DROP POLICY IF EXISTS "contadores_can_create_request" ON public.solicitacoes_saque;
DROP POLICY IF EXISTS "contadores_can_view_own_requests" ON public.solicitacoes_saque;
DROP POLICY IF EXISTS "admins_can_manage_requests" ON public.solicitacoes_saque;

-- Contadores podem visualizar/criar suas proprias solicitacoes
CREATE POLICY "contadores_can_create_request" ON public.solicitacoes_saque
  FOR INSERT
  WITH CHECK (contador_id = auth.uid());

CREATE POLICY "contadores_can_view_own_requests" ON public.solicitacoes_saque
  FOR SELECT
  USING (contador_id = auth.uid());

-- Admins podem visualizar todas e atualizar status
CREATE POLICY "admins_can_manage_requests" ON public.solicitacoes_saque
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role = 'admin'
    )
  );

-- 4. Funcao para processar solicitacao de saque
CREATE OR REPLACE FUNCTION public.fn_processar_solicitacao_saque(
  p_solicitacao_id UUID,
  p_user_id UUID,
  p_comprovante_url TEXT DEFAULT NULL,
  p_observacao TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_solicitacao RECORD;
  v_result JSON;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = p_user_id AND role = 'admin'
  ) THEN
    RETURN JSON_BUILD_OBJECT(
      'success', FALSE,
      'error', 'Apenas admins podem processar saques'
    );
  END IF;

  SELECT * INTO v_solicitacao FROM public.solicitacoes_saque
  WHERE id = p_solicitacao_id;

  IF NOT FOUND THEN
    RETURN JSON_BUILD_OBJECT(
      'success', FALSE,
      'error', 'Solicitação de saque não encontrada'
    );
  END IF;

  UPDATE public.solicitacoes_saque
  SET
    status = 'processada',
    processada_em = now(),
    processada_por = p_user_id,
    comprovante_url = p_comprovante_url,
    observacao = COALESCE(p_observacao, observacao)
  WHERE id = p_solicitacao_id;

  v_result := JSON_BUILD_OBJECT(
    'success', TRUE,
    'message', 'Saque processado com sucesso',
    'solicitacao_id', p_solicitacao_id,
    'valor', v_solicitacao.valor_solicitado,
    'contador_id', v_solicitacao.contador_id,
    'comissoes_atualizadas', array_length(v_solicitacao.comissoes_ids, 1)
  );

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.fn_processar_solicitacao_saque TO authenticated, service_role;

-- 5. View para saques pendentes (dashboard admin)
CREATE OR REPLACE VIEW vw_solicitacoes_saque_pendentes AS
SELECT
  s.id,
  s.contador_id,
  s.valor_solicitado,
  s.status,
  s.metodo_pagamento,
  s.solicitado_em,
  s.dados_bancarios->>'chave_pix' as chave_pix,
  s.dados_bancarios->>'titular_conta' as titular_conta,
  s.dados_bancarios->>'banco' as banco,
  s.dados_bancarios->>'agencia' as agencia,
  s.dados_bancarios->>'conta' as conta,
  u.raw_user_meta_data->>'nome' as contador_nome,
  u.email as contador_email,
  ct.nivel as contador_nivel,
  array_length(s.comissoes_ids, 1) as qtd_comissoes,
  DATE_TRUNC('day', NOW()) - DATE_TRUNC('day', s.solicitado_em) as dias_aguardando
FROM public.solicitacoes_saque s
JOIN public.contadores ct ON s.contador_id = ct.id
INNER JOIN auth.users u ON u.id = ct.user_id
WHERE s.status = 'pendente'
ORDER BY s.solicitado_em ASC;

-- 6. View para historico de saques (dashboard contador)
CREATE OR REPLACE VIEW vw_meus_saques AS
SELECT
  id,
  valor_solicitado,
  status,
  metodo_pagamento,
  solicitado_em,
  processada_em,
  observacao,
  CASE
    WHEN status = 'pendente' THEN 'Em Processamento'
    WHEN status = 'processada' THEN 'Transferido'
    WHEN status = 'rejeitada' THEN 'Rejeitado'
  END as status_label,
  ROUND(EXTRACT(EPOCH FROM (COALESCE(processada_em, NOW()) - solicitado_em)) / 86400)::INT as dias_decorridos
FROM public.solicitacoes_saque
ORDER BY solicitado_em DESC;

-- 7. Adicionar comentarios
COMMENT ON TABLE public.solicitacoes_saque IS 'Sistema de solicitacoes de saque para contadores';
COMMENT ON FUNCTION public.fn_processar_solicitacao_saque IS 'Processa solicitacao de saque e atualiza status das comissoes';

-- Validacao: Execute depois para confirmar
-- SELECT EXISTS (
--   SELECT FROM information_schema.tables 
--   WHERE table_schema = 'public' 
--   AND table_name = 'solicitacoes_saque'
-- );

