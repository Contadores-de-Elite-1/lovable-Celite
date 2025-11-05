-- =====================================================
-- PLANO MÍNIMO ENXUTO - CORREÇÕES CRÍTICAS (CORRIGIDO)
-- =====================================================

-- ============================================================
-- FASE 1.1: VALIDAÇÕES DE DUPLICIDADE
-- ============================================================

CREATE UNIQUE INDEX IF NOT EXISTS idx_comissao_unica 
ON comissoes(pagamento_id, contador_id, tipo)
WHERE pagamento_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_bonus_unico 
ON bonus_historico(contador_id, tipo_bonus, competencia);

-- ============================================================
-- FASE 1.2: VALIDAÇÕES DE ENUM (CORRIGIDO COM VALORES REAIS)
-- ============================================================

-- Function para validar tipo_comissao (valores CORRETOS do ENUM)
CREATE OR REPLACE FUNCTION validate_comissao_tipo()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Tipos válidos conforme ENUM tipo_comissao real:
  -- 'ativacao', 'recorrente', 'override', 'bonus'
  IF NEW.tipo NOT IN ('ativacao', 'recorrente', 'override', 'bonus') THEN
    RAISE EXCEPTION 'Tipo de comissão inválido: %. Tipos válidos: ativacao, recorrente, override, bonus', NEW.tipo;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_validate_comissao_tipo ON comissoes;
CREATE TRIGGER trigger_validate_comissao_tipo
  BEFORE INSERT OR UPDATE OF tipo
  ON comissoes
  FOR EACH ROW
  EXECUTE FUNCTION validate_comissao_tipo();

-- Function para validar status_comissao (valores CORRETOS do ENUM)
CREATE OR REPLACE FUNCTION validate_comissao_status()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Status válidos conforme ENUM status_comissao real:
  -- 'calculada', 'aprovada', 'paga', 'cancelada'
  IF NEW.status NOT IN ('calculada', 'aprovada', 'paga', 'cancelada') THEN
    RAISE EXCEPTION 'Status de comissão inválido: %. Status válidos: calculada, aprovada, paga, cancelada', NEW.status;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_validate_comissao_status ON comissoes;
CREATE TRIGGER trigger_validate_comissao_status
  BEFORE INSERT OR UPDATE OF status
  ON comissoes
  FOR EACH ROW
  EXECUTE FUNCTION validate_comissao_status();

-- ============================================================
-- FASE 1.3: CORRIGIR VIEWS SEM SECURITY DEFINER
-- ============================================================

DROP VIEW IF EXISTS cursos_edu;
CREATE VIEW cursos_edu AS
SELECT 
  c.id,
  c.titulo,
  c.nivel,
  c.duracao,
  e.contador_id,
  e.progresso,
  e.status,
  e.certificado_url
FROM courses c
LEFT JOIN enrollments e ON c.id = e.course_id;

DROP VIEW IF EXISTS vw_comissoes_detalhadas;
CREATE VIEW vw_comissoes_detalhadas AS
SELECT 
  c.id,
  c.contador_id,
  c.tipo,
  c.valor,
  c.percentual,
  c.competencia,
  c.status,
  c.pago_em,
  c.created_at,
  c.pagamento_id,
  cli.id AS cliente_id,
  cli.nome_empresa AS cliente_nome,
  cli.cnpj AS cliente_cnpj,
  cli.plano AS cliente_plano,
  p.valor_bruto AS pagamento_valor,
  p.tipo AS pagamento_tipo,
  p.status AS pagamento_status,
  p.competencia AS pagamento_competencia
FROM comissoes c
LEFT JOIN clientes cli ON c.cliente_id = cli.id
LEFT JOIN pagamentos p ON c.pagamento_id = p.id;

DROP VIEW IF EXISTS vw_dashboard_contador;
CREATE VIEW vw_dashboard_contador AS
SELECT 
  cnt.id AS contador_id,
  cnt.user_id,
  cnt.nivel,
  cnt.xp,
  cnt.clientes_ativos,
  COALESCE(SUM(CASE WHEN com.status = 'calculada' THEN com.valor ELSE 0 END), 0) AS total_comissoes_provisionadas,
  COUNT(DISTINCT CASE WHEN com.tipo IN ('ativacao', 'recorrente') THEN com.id END) AS total_comissoes_diretas,
  COUNT(DISTINCT CASE WHEN com.tipo = 'override' THEN com.id END) AS total_comissoes_indiretas,
  COALESCE(SUM(CASE WHEN com.status = 'paga' THEN com.valor ELSE 0 END), 0) AS total_comissoes_pagas,
  COUNT(DISTINCT l.id) AS total_links,
  COALESCE(SUM(l.cliques), 0) AS total_cliques,
  COALESCE(SUM(l.conversoes), 0) AS total_conversoes,
  COUNT(DISTINCT cli.id) FILTER (WHERE cli.status = 'ativo') AS clientes_ativos_count,
  COUNT(DISTINCT e.id) AS cursos_matriculados,
  COUNT(DISTINCT e.id) FILTER (WHERE e.status = 'concluido') AS cursos_concluidos
FROM contadores cnt
LEFT JOIN comissoes com ON cnt.id = com.contador_id
LEFT JOIN links l ON cnt.id = l.contador_id
LEFT JOIN clientes cli ON cnt.id = cli.contador_id
LEFT JOIN enrollments e ON cnt.id = e.contador_id
GROUP BY cnt.id, cnt.user_id, cnt.nivel, cnt.xp, cnt.clientes_ativos;

DROP VIEW IF EXISTS vw_links_desempenho;
CREATE VIEW vw_links_desempenho AS
SELECT 
  l.id,
  l.contador_id,
  l.token,
  l.tipo,
  l.canal,
  l.cliques,
  l.conversoes,
  l.created_at,
  CASE 
    WHEN l.cliques > 0 THEN ROUND((l.conversoes::numeric / l.cliques::numeric) * 100, 2)
    ELSE 0 
  END AS taxa
FROM links l;

-- ============================================================
-- FASE 2.1: ADICIONAR search_path EM FUNCTIONS
-- ============================================================

CREATE OR REPLACE FUNCTION public.protect_confirmed_payments()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  IF OLD.status IN ('confirmed','refunded') AND NEW.status != OLD.status THEN
    RAISE EXCEPTION 'Pagamentos confirmados/estornados são imutáveis. Use estorno formal.';
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.protect_paid_commissions()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.track_commission_status_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.track_comissao_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_logs (
      acao, tabela, registro_id, user_id, payload
    ) VALUES (
      'INSERT', 'comissoes', NEW.id, auth.uid(),
      jsonb_build_object(
        'tipo', NEW.tipo,
        'valor', NEW.valor,
        'contador_id', NEW.contador_id,
        'status', NEW.status
      )
    );
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status IS DISTINCT FROM NEW.status OR OLD.valor IS DISTINCT FROM NEW.valor THEN
      INSERT INTO public.audit_logs (
        acao, tabela, registro_id, user_id, payload
      ) VALUES (
        'UPDATE', 'comissoes', NEW.id, auth.uid(),
        jsonb_build_object(
          'old_status', OLD.status,
          'new_status', NEW.status,
          'old_valor', OLD.valor,
          'new_valor', NEW.valor
        )
      );
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.audit_logs (
      acao, tabela, registro_id, user_id, payload
    ) VALUES (
      'DELETE', 'comissoes', OLD.id, auth.uid(),
      jsonb_build_object(
        'tipo', OLD.tipo,
        'valor', OLD.valor,
        'status', OLD.status
      )
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$function$;

CREATE OR REPLACE FUNCTION public.notificar_comissao_liberada()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
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
$function$;