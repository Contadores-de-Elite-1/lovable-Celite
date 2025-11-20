-- Migration: Criar RPC otimizada para Dashboard
-- Autor: Claude Sonnet 4.5
-- Data: 2025-11-19
-- Descricao: RPC que retorna TODOS os dados do dashboard em UMA query
-- Objetivo: Melhorar drasticamente a performance em mobile

-- IMPORTANTE: Esta funcao agrega dados no servidor (muito mais rapido)

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
  -- Buscar contador
  SELECT id, nome, nivel, clientes_ativos
  INTO contador_id_var, contador_nome, contador_nivel, contador_clientes
  FROM contadores
  WHERE user_id = user_id_param
  LIMIT 1;

  -- Se contador nao encontrado, retorna null
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

  -- Calcular comissoes do mes atual
  SELECT COALESCE(SUM(valor), 0)
  INTO mes_atual_var
  FROM comissoes
  WHERE contador_id = contador_id_var
    AND competencia >= TO_CHAR(CURRENT_DATE, 'YYYY-MM-01');

  -- Calcular comissoes do mes passado
  SELECT COALESCE(SUM(valor), 0)
  INTO mes_passado_var
  FROM comissoes
  WHERE contador_id = contador_id_var
    AND competencia >= TO_CHAR(CURRENT_DATE - INTERVAL '1 month', 'YYYY-MM-01')
    AND competencia < TO_CHAR(CURRENT_DATE, 'YYYY-MM-01');

  -- Calcular crescimento percentual
  IF mes_passado_var > 0 THEN
    crescimento_var := ((mes_atual_var - mes_passado_var) / mes_passado_var) * 100;
  ELSE
    crescimento_var := 0;
  END IF;

  -- Buscar ultimas 4 comissoes (JSON agregado no servidor)
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

-- Grant para usuarios autenticados
GRANT EXECUTE ON FUNCTION obter_dashboard_contador(UUID) TO authenticated;

-- Comentario explicativo
COMMENT ON FUNCTION obter_dashboard_contador IS 
'RPC otimizada para Dashboard: retorna TODOS os dados em UMA query.
Calcula agregacoes no servidor (muito mais rapido que no cliente).
Usado para melhorar performance em mobile.';

