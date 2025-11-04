-- =====================================================
-- BACKEND COMPLETO PARA FRONTEND CONTADORES DE ELITE
-- =====================================================

-- 1. VIEWS PARA DASHBOARD E COMISSÕES
-- =====================================================

-- View: Dashboard do Contador (agregações pré-calculadas)
CREATE OR REPLACE VIEW vw_dashboard_contador AS
SELECT 
  c.id AS contador_id,
  c.user_id,
  c.nivel,
  c.xp,
  c.clientes_ativos,
  COALESCE(SUM(CASE WHEN com.status = 'paga' THEN com.valor ELSE 0 END), 0) AS total_comissoes_pagas,
  COALESCE(SUM(CASE WHEN com.status = 'calculada' THEN com.valor ELSE 0 END), 0) AS total_comissoes_provisionadas,
  COUNT(DISTINCT CASE WHEN com.tipo = 'recorrente' THEN com.id END) AS total_comissoes_diretas,
  COUNT(DISTINCT CASE WHEN com.tipo IN ('ativacao', 'bonus_rede') THEN com.id END) AS total_comissoes_indiretas,
  COUNT(DISTINCT l.id) AS total_links,
  COALESCE(SUM(l.cliques), 0) AS total_cliques,
  COALESCE(SUM(l.conversoes), 0) AS total_conversoes,
  COUNT(DISTINCT CASE WHEN cl.status = 'ativo' THEN cl.id END) AS clientes_ativos_count,
  COUNT(DISTINCT e.id) AS cursos_matriculados,
  COUNT(DISTINCT CASE WHEN e.status = 'concluido' THEN e.id END) AS cursos_concluidos
FROM contadores c
LEFT JOIN comissoes com ON com.contador_id = c.id
LEFT JOIN links l ON l.contador_id = c.id
LEFT JOIN clientes cl ON cl.contador_id = c.id
LEFT JOIN enrollments e ON e.contador_id = c.id
GROUP BY c.id, c.user_id, c.nivel, c.xp, c.clientes_ativos;

-- View: Comissões Detalhadas (com dados do cliente e pagamento)
CREATE OR REPLACE VIEW vw_comissoes_detalhadas AS
SELECT 
  com.id,
  com.tipo,
  com.contador_id,
  com.valor,
  com.percentual,
  com.competencia,
  com.status,
  com.pago_em,
  com.created_at,
  cl.id AS cliente_id,
  cl.nome_empresa AS cliente_nome,
  cl.cnpj AS cliente_cnpj,
  cl.plano AS cliente_plano,
  pag.id AS pagamento_id,
  pag.tipo AS pagamento_tipo,
  pag.valor_bruto AS pagamento_valor,
  pag.status AS pagamento_status,
  pag.competencia AS pagamento_competencia
FROM comissoes com
INNER JOIN clientes cl ON cl.id = com.cliente_id
INNER JOIN pagamentos pag ON pag.id = com.pagamento_id;

-- 2. RPCs (FUNÇÕES)
-- =====================================================

-- RPC: Salvar simulação
CREATE OR REPLACE FUNCTION salvar_simulacao(
  p_contador_id uuid,
  p_clientes_mes integer,
  p_contadores_mes integer,
  p_clientes_por_contador integer,
  p_valor_mensalidade numeric,
  p_resultado_conservador numeric,
  p_resultado_realista numeric,
  p_resultado_otimista numeric
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_simulacao_id uuid;
BEGIN
  INSERT INTO simulacoes(
    contador_id,
    clientes_mes,
    contadores_mes,
    clientes_por_contador,
    valor_mensalidade,
    resultado_conservador,
    resultado_realista,
    resultado_otimista
  )
  VALUES (
    p_contador_id,
    p_clientes_mes,
    p_contadores_mes,
    p_clientes_por_contador,
    p_valor_mensalidade,
    p_resultado_conservador,
    p_resultado_realista,
    p_resultado_otimista
  )
  RETURNING id INTO v_simulacao_id;
  
  RETURN v_simulacao_id;
END;
$$;

-- RPC: Iniciar curso (criar enrollment)
CREATE OR REPLACE FUNCTION iniciar_curso(
  p_course_id uuid,
  p_contador_id uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_enrollment_id uuid;
BEGIN
  -- Verificar se já está matriculado
  IF EXISTS (
    SELECT 1 FROM enrollments 
    WHERE course_id = p_course_id AND contador_id = p_contador_id
  ) THEN
    RAISE EXCEPTION 'Contador já está matriculado neste curso';
  END IF;
  
  -- Criar matrícula
  INSERT INTO enrollments(course_id, contador_id, progresso, status)
  VALUES (p_course_id, p_contador_id, 0, 'em_andamento')
  RETURNING id INTO v_enrollment_id;
  
  RETURN v_enrollment_id;
END;
$$;

-- RPC: Atualizar progresso do curso
CREATE OR REPLACE FUNCTION atualizar_progresso_curso(
  p_enrollment_id uuid,
  p_progresso integer
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_contador_id uuid;
  v_status text;
  v_xp_ganho integer := 0;
BEGIN
  -- Validar progresso
  IF p_progresso < 0 OR p_progresso > 100 THEN
    RAISE EXCEPTION 'Progresso inválido: deve estar entre 0 e 100';
  END IF;
  
  -- Atualizar progresso
  UPDATE enrollments
  SET progresso = p_progresso,
      status = CASE WHEN p_progresso = 100 THEN 'concluido' ELSE 'em_andamento' END
  WHERE id = p_enrollment_id
  RETURNING contador_id, status INTO v_contador_id, v_status;
  
  -- Se concluiu o curso, dar XP
  IF v_status = 'concluido' THEN
    v_xp_ganho := 100; -- XP fixo por curso concluído
    UPDATE contadores SET xp = xp + v_xp_ganho WHERE id = v_contador_id;
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'progresso', p_progresso,
    'status', v_status,
    'xp_ganho', v_xp_ganho
  );
END;
$$;

-- 3. TRIGGERS
-- =====================================================

-- Trigger: Notificar quando comissão for paga
CREATE OR REPLACE FUNCTION notificar_comissao_liberada()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Se status mudou para 'paga', criar notificação
  IF NEW.status = 'paga' AND (TG_OP = 'INSERT' OR OLD.status != 'paga') THEN
    INSERT INTO notificacoes(
      contador_id,
      tipo,
      titulo,
      mensagem,
      payload
    )
    VALUES (
      NEW.contador_id,
      'comissao_liberada',
      'Comissão Liberada!',
      format('Sua comissão de R$ %.2f referente à competência %s foi liberada.', NEW.valor, NEW.competencia),
      jsonb_build_object(
        'comissao_id', NEW.id,
        'valor', NEW.valor,
        'tipo', NEW.tipo,
        'competencia', NEW.competencia
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notificar_comissao ON comissoes;
CREATE TRIGGER trg_notificar_comissao
  AFTER INSERT OR UPDATE ON comissoes
  FOR EACH ROW
  EXECUTE FUNCTION notificar_comissao_liberada();

-- 4. ÍNDICES PARA PERFORMANCE
-- =====================================================

-- Índices em comissoes
CREATE INDEX IF NOT EXISTS idx_comissoes_contador_status ON comissoes(contador_id, status);
CREATE INDEX IF NOT EXISTS idx_comissoes_competencia ON comissoes(competencia);
CREATE INDEX IF NOT EXISTS idx_comissoes_tipo ON comissoes(tipo);

-- Índices em links
CREATE INDEX IF NOT EXISTS idx_links_token ON links(token);
CREATE INDEX IF NOT EXISTS idx_links_contador_tipo ON links(contador_id, tipo);

-- Índices em clientes
CREATE INDEX IF NOT EXISTS idx_clientes_contador_status ON clientes(contador_id, status);
CREATE INDEX IF NOT EXISTS idx_clientes_cnpj ON clientes(cnpj) WHERE cnpj IS NOT NULL;

-- Índices em materiais (GIN para tags)
CREATE INDEX IF NOT EXISTS idx_materiais_tags_gin ON materiais USING gin(tags);
CREATE INDEX IF NOT EXISTS idx_materiais_categoria ON materiais(categoria);

-- Índices em enrollments
CREATE INDEX IF NOT EXISTS idx_enrollments_contador_status ON enrollments(contador_id, status);
CREATE INDEX IF NOT EXISTS idx_enrollments_course ON enrollments(course_id);

-- Índices em click_logs
CREATE INDEX IF NOT EXISTS idx_click_logs_link ON click_logs(link_id);
CREATE INDEX IF NOT EXISTS idx_click_logs_created ON click_logs(created_at DESC);

-- 5. SEEDS INICIAIS
-- =====================================================

-- Cursos iniciais
INSERT INTO courses (titulo, duracao, nivel, ativo) VALUES
  ('Introdução à Contabilidade Digital', 120, 'Básico', true),
  ('Gestão de Clientes e Relacionamento', 180, 'Intermediário', true),
  ('Estratégias de Crescimento e Vendas', 240, 'Avançado', true),
  ('Legislação Tributária Atualizada', 300, 'Avançado', true),
  ('Marketing Digital para Contadores', 150, 'Intermediário', true)
ON CONFLICT DO NOTHING;

-- Materiais iniciais
INSERT INTO materiais (titulo, tipo, categoria, tags, publico) VALUES
  ('Guia de Boas-Vindas - Contadores de Elite', 'pdf', 'Onboarding', ARRAY['iniciante', 'guia'], true),
  ('Template de Proposta Comercial', 'docx', 'Vendas', ARRAY['template', 'vendas'], true),
  ('Planilha de Controle de Clientes', 'xlsx', 'Gestão', ARRAY['controle', 'gestao'], true),
  ('Apresentação Institucional', 'pptx', 'Marketing', ARRAY['apresentacao', 'institucional'], true),
  ('Checklist de Onboarding de Clientes', 'pdf', 'Processos', ARRAY['checklist', 'onboarding'], true)
ON CONFLICT DO NOTHING;