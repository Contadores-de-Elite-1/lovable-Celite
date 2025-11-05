-- ============================================================
-- CORREÇÃO FINAL: Adicionar search_path nas 7 functions pendentes
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, nome, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', 'Usuário'),
    NEW.email
  );
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.atualizar_clientes_ativos()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status = 'ativo' THEN
    UPDATE contadores
    SET clientes_ativos = clientes_ativos + 1,
        ultima_ativacao = CURRENT_DATE
    WHERE id = NEW.contador_id;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status != 'ativo' AND NEW.status = 'ativo' THEN
      UPDATE contadores SET clientes_ativos = clientes_ativos + 1 WHERE id = NEW.contador_id;
    ELSIF OLD.status = 'ativo' AND NEW.status != 'ativo' THEN
      UPDATE contadores SET clientes_ativos = clientes_ativos - 1 WHERE id = NEW.contador_id;
    END IF;
  ELSIF TG_OP = 'DELETE' AND OLD.status = 'ativo' THEN
    UPDATE contadores SET clientes_ativos = clientes_ativos - 1 WHERE id = OLD.contador_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$function$;

CREATE OR REPLACE FUNCTION public.registrar_clique(p_token text)
RETURNS TABLE(link_id uuid, contador_id uuid, tipo link_type, redirect text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE v_link links;
BEGIN
  SELECT * INTO v_link FROM links WHERE token = p_token;
  IF NOT FOUND THEN RAISE EXCEPTION 'Link não encontrado'; END IF;
  INSERT INTO click_logs(link_id, contador_id) VALUES (v_link.id, v_link.contador_id);
  UPDATE links SET cliques = cliques + 1 WHERE id = v_link.id;
  RETURN QUERY SELECT v_link.id, v_link.contador_id, v_link.tipo, COALESCE(v_link.target_url, '');
END;
$function$;

CREATE OR REPLACE FUNCTION public.salvar_simulacao(
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
SET search_path TO 'public'
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.iniciar_curso(p_course_id uuid, p_contador_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_enrollment_id uuid;
BEGIN
  IF EXISTS (
    SELECT 1 FROM enrollments 
    WHERE course_id = p_course_id AND contador_id = p_contador_id
  ) THEN
    RAISE EXCEPTION 'Contador já está matriculado neste curso';
  END IF;
  
  INSERT INTO enrollments(course_id, contador_id, progresso, status)
  VALUES (p_course_id, p_contador_id, 0, 'em_andamento')
  RETURNING id INTO v_enrollment_id;
  
  RETURN v_enrollment_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.atualizar_progresso_curso(p_enrollment_id uuid, p_progresso integer)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_contador_id uuid;
  v_status text;
  v_xp_ganho integer := 0;
BEGIN
  IF p_progresso < 0 OR p_progresso > 100 THEN
    RAISE EXCEPTION 'Progresso inválido: deve estar entre 0 e 100';
  END IF;
  
  UPDATE enrollments
  SET progresso = p_progresso,
      status = CASE WHEN p_progresso = 100 THEN 'concluido' ELSE 'em_andamento' END
  WHERE id = p_enrollment_id
  RETURNING contador_id, status INTO v_contador_id, v_status;
  
  IF v_status = 'concluido' THEN
    v_xp_ganho := 100;
    UPDATE contadores SET xp = xp + v_xp_ganho WHERE id = v_contador_id;
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'progresso', p_progresso,
    'status', v_status,
    'xp_ganho', v_xp_ganho
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.atualizar_performance_contador()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_ano INTEGER;
BEGIN
  v_ano := EXTRACT(YEAR FROM NEW.data_ativacao);
  
  INSERT INTO public.contador_performance_anual (
    contador_id, ano, indicacoes_diretas, ultima_atualizacao
  ) VALUES (
    NEW.contador_id, v_ano, 1, NOW()
  )
  ON CONFLICT (contador_id, ano) 
  DO UPDATE SET 
    indicacoes_diretas = contador_performance_anual.indicacoes_diretas + 1,
    ultima_atualizacao = NOW();
  
  RETURN NEW;
END;
$function$;