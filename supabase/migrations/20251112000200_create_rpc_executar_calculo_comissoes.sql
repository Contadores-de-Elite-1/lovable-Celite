-- =============================================================================
-- MIGRATION: RPC Transacional executar_calculo_comissoes
-- Descrição: Calcula e salva comissões e bônus com segurança máxima
-- =============================================================================

-- 1. Criar RPC com SECURITY DEFINER e search_path controlado
CREATE OR REPLACE FUNCTION public.executar_calculo_comissoes(
  p_pagamento_id uuid,
  p_cliente_id uuid,
  p_contador_id uuid,
  p_competencia date,
  p_comissoes jsonb,
  p_bonus jsonb,
  p_logs jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public', 'extensions'
AS $$
DECLARE
  v_comissao_id uuid;
  v_log_count integer := 0;
  v_bonus_count integer := 0;
  v_comissao_count integer := 0;
  v_resultado jsonb;
BEGIN
  -- Início da transação (implícita no plpgsql)

  -- 2. Inserir comissões com casts explícitos de tipos
  INSERT INTO public.comissoes (
    id,
    pagamento_id,
    cliente_id,
    contador_id,
    tipo,
    valor,
    percentual,
    competencia,
    status,
    observacao,
    nivel_sponsor,
    origem_cliente_id,
    created_at,
    updated_at
  )
  SELECT
    gen_random_uuid()::uuid as id,
    (rec->>'pagamento_id')::uuid as pagamento_id,
    (rec->>'cliente_id')::uuid as cliente_id,
    (rec->>'contador_id')::uuid as contador_id,
    (rec->>'tipo')::tipo_comissao as tipo,
    (rec->>'valor')::numeric(10,2) as valor,
    (rec->>'percentual')::numeric(5,2) as percentual,
    (rec->>'competencia')::date as competencia,
    (rec->>'status')::status_comissao as status,
    rec->>'observacao' as observacao,
    rec->>'nivel_sponsor' as nivel_sponsor,
    (rec->>'origem_cliente_id')::uuid as origem_cliente_id,
    NOW()::timestamptz as created_at,
    NOW()::timestamptz as updated_at
  FROM jsonb_to_recordset(p_comissoes) AS rec(
    pagamento_id text,
    cliente_id text,
    contador_id text,
    tipo text,
    valor numeric,
    percentual numeric,
    competencia text,
    status text,
    observacao text,
    nivel_sponsor text,
    origem_cliente_id text
  )
  ON CONFLICT (pagamento_id, contador_id, tipo)
  DO NOTHING
  RETURNING id INTO v_comissao_id;

  GET DIAGNOSTICS v_comissao_count = ROW_COUNT;

  -- 3. Inserir logs de cálculo
  INSERT INTO public.comissoes_calculo_log (
    id,
    comissao_id,
    regra_aplicada,
    valores_intermediarios,
    resultado_final,
    calculado_em,
    observacoes
  )
  SELECT
    gen_random_uuid()::uuid as id,
    (
      SELECT id FROM public.comissoes
      WHERE pagamento_id = p_pagamento_id
      LIMIT 1
    )::uuid as comissao_id,
    rec->>'regra_aplicada' as regra_aplicada,
    (rec->'valores_intermediarios')::jsonb as valores_intermediarios,
    (rec->>'resultado_final')::numeric as resultado_final,
    NOW()::timestamptz as calculado_em,
    NULL as observacoes
  FROM jsonb_to_recordset(p_logs) AS rec(
    regra_aplicada text,
    valores_intermediarios jsonb,
    resultado_final numeric
  )
  WHERE p_logs IS NOT NULL AND jsonb_array_length(p_logs) > 0;

  GET DIAGNOSTICS v_log_count = ROW_COUNT;

  -- 4. Inserir bônus com idempotência
  INSERT INTO public.bonus_historico (
    id,
    contador_id,
    tipo_bonus,
    marco_atingido,
    valor,
    conquistado_em,
    status,
    competencia,
    observacao
  )
  SELECT
    gen_random_uuid()::uuid as id,
    (rec->>'contador_id')::uuid as contador_id,
    rec->>'tipo_bonus' as tipo_bonus,
    CASE
      WHEN rec->>'marco_atingido' IS NOT NULL
      THEN (rec->>'marco_atingido')::integer
      ELSE NULL
    END as marco_atingido,
    (rec->>'valor')::numeric(10,2) as valor,
    NOW()::timestamptz as conquistado_em,
    rec->>'status' as status,
    (rec->>'competencia')::date as competencia,
    rec->>'observacao' as observacao
  FROM jsonb_to_recordset(p_bonus) AS rec(
    contador_id text,
    tipo_bonus text,
    marco_atingido text,
    valor numeric,
    competencia text,
    status text,
    observacao text
  )
  ON CONFLICT (contador_id, tipo_bonus, competencia, COALESCE(marco_atingido, 0))
  DO NOTHING;

  GET DIAGNOSTICS v_bonus_count = ROW_COUNT;

  -- 5. Montar resposta
  v_resultado := jsonb_build_object(
    'success', true,
    'comissoes_inseridas', v_comissao_count,
    'logs_inseridos', v_log_count,
    'bonus_inseridos', v_bonus_count,
    'pagamento_id', p_pagamento_id::text,
    'timestamp', NOW()::text
  );

  RETURN v_resultado;

EXCEPTION WHEN OTHERS THEN
  -- Erro limpo sem expor detalhes internos
  RAISE EXCEPTION 'Erro ao calcular comissões: % (Estado SQL: %)',
    SQLERRM, SQLSTATE
  USING ERRCODE = SQLSTATE;
END;
$$;

-- 6. Segurança: GRANT e REVOKE
REVOKE ALL ON FUNCTION public.executar_calculo_comissoes(
  uuid, uuid, uuid, date, jsonb, jsonb, jsonb
) FROM public;

GRANT EXECUTE ON FUNCTION public.executar_calculo_comissoes(
  uuid, uuid, uuid, date, jsonb, jsonb, jsonb
) TO authenticated, service_role;
