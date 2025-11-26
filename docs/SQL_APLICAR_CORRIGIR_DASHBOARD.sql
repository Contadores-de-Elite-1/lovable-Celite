-- ============================================================
-- COPIE E COLE ESTE SQL NO SUPABASE SQL EDITOR
-- ============================================================
-- Migration: Corrigir função obter_dashboard_contador
-- Data: 2025-11-26
-- Descrição: Corrige busca de nome do contador
-- ============================================================

CREATE OR REPLACE FUNCTION obter_dashboard_contador(user_id_param UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  resultado JSON;
  contador_id_var UUID;
  contador_nome VARCHAR;
  contador_nivel VARCHAR;
  contador_clientes INT;
  total_ganho_var NUMERIC;
  a_receber_var NUMERIC;
  pago_var NUMERIC;
  mes_atual_var NUMERIC;
  mes_passado_var NUMERIC;
  crescimento_var NUMERIC;
  ultimas_comissoes_var JSON;
BEGIN
  -- Buscar contador com nome de auth.users
  SELECT 
    c.id, 
    c.nivel, 
    c.clientes_ativos,
    COALESCE(u.raw_user_meta_data->>'nome', p.nome, 'Usuário') AS nome
  INTO contador_id_var, contador_nivel, contador_clientes, contador_nome
  FROM contadores c
  LEFT JOIN auth.users u ON u.id = c.user_id
  LEFT JOIN profiles p ON p.id = c.user_id
  WHERE c.user_id = user_id_param
  LIMIT 1;

  -- Se contador não encontrado, retorna null
  IF contador_id_var IS NULL THEN
    RETURN NULL;
  END IF;

  -- Calcular total ganho (SUM no servidor)
  SELECT COALESCE(SUM(valor), 0)
  INTO total_ganho_var
  FROM comissoes
  WHERE contador_id = contador_id_var;

  -- Calcular a receber (SUM no servidor)
  SELECT COALESCE(SUM(valor), 0)
  INTO a_receber_var
  FROM comissoes
  WHERE contador_id = contador_id_var
    AND status IN ('calculada', 'aprovada');

  -- Calcular pago
  pago_var := total_ganho_var - a_receber_var;

  -- Calcular comissões do mês atual
  SELECT COALESCE(SUM(valor), 0)
  INTO mes_atual_var
  FROM comissoes
  WHERE contador_id = contador_id_var
    AND competencia >= DATE_TRUNC('month', CURRENT_DATE)::DATE;

  -- Calcular comissões do mês passado
  SELECT COALESCE(SUM(valor), 0)
  INTO mes_passado_var
  FROM comissoes
  WHERE contador_id = contador_id_var
    AND competencia >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')::DATE
    AND competencia < DATE_TRUNC('month', CURRENT_DATE)::DATE;

  -- Calcular crescimento percentual
  IF mes_passado_var > 0 THEN
    crescimento_var := ((mes_atual_var - mes_passado_var) / mes_passado_var) * 100;
  ELSE
    crescimento_var := 0;
  END IF;

  -- Buscar últimas 4 comissões (JSON agregado no servidor)
  SELECT JSON_AGG(
    JSON_BUILD_OBJECT(
      'tipo', tipo,
      'valor', valor,
      'status', status,
      'created_at', created_at
    )
  )
  INTO ultimas_comissoes_var
  FROM (
    SELECT tipo, valor, status, created_at
    FROM comissoes
    WHERE contador_id = contador_id_var
    ORDER BY created_at DESC
    LIMIT 4
  ) sub;

  -- Montar JSON final
  resultado := JSON_BUILD_OBJECT(
    'contador', JSON_BUILD_OBJECT(
      'id', contador_id_var,
      'nome', contador_nome,
      'nivel', contador_nivel,
      'clientes_ativos', contador_clientes
    ),
    'resumo', JSON_BUILD_OBJECT(
      'total_ganho', total_ganho_var,
      'a_receber', a_receber_var,
      'pago', pago_var,
      'mes_atual', mes_atual_var,
      'crescimento', ROUND(crescimento_var, 2)
    ),
    'ultimas_comissoes', COALESCE(ultimas_comissoes_var, '[]'::JSON)
  );

  RETURN resultado;
END;
$$;

-- Grant para usuários autenticados
GRANT EXECUTE ON FUNCTION obter_dashboard_contador(UUID) TO authenticated;

-- Comentário explicativo
COMMENT ON FUNCTION obter_dashboard_contador IS 
'RPC otimizada para Dashboard: retorna TODOS os dados em UMA query.
Busca nome do contador de auth.users ou profiles corretamente.
Calcula agregações no servidor (muito mais rápido que no cliente).';

-- ============================================================
-- VALIDAÇÃO: Execute esta query depois para confirmar
-- ============================================================
-- SELECT obter_dashboard_contador(auth.uid());
-- ============================================================

