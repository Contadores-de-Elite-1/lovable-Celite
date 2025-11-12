-- =============================================================================
-- MIGRATION: Setup CRON job for payment processing on day 25
-- Executa processar-pagamento-comissoes automaticamente no dia 25 de cada mês
-- =============================================================================

-- Verificar se pg_cron extension existe
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Função SQL que executa processamento de pagamentos com lógica de limiar
CREATE OR REPLACE FUNCTION public.cron_processar_pagamento_comissoes()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public', 'extensions'
AS $$
DECLARE
  v_mes_anterior text;
  v_inicio_mes date;
  v_fim_mes date;
  v_contador_id uuid;
  v_total numeric;
  v_count_processados integer := 0;
  v_count_acumulados integer := 0;
  v_valor_total_pago numeric := 0;
BEGIN
  v_mes_anterior := (NOW() - INTERVAL '1 month')::text;
  v_inicio_mes := DATE_TRUNC('month', NOW() - INTERVAL '1 month')::date;
  v_fim_mes := DATE_TRUNC('month', NOW())::date;

  INSERT INTO public.audit_logs (acao, tabela, payload)
  VALUES (
    'CRON_PAYMENT_PROCESSING_START',
    'comissoes',
    jsonb_build_object(
      'timestamp', NOW(),
      'periodo_inicio', v_inicio_mes,
      'periodo_fim', v_fim_mes
    )
  );

  -- Processar cada contador com comissões aprovadas neste período
  FOR v_contador_id IN
    SELECT DISTINCT contador_id FROM public.comissoes
    WHERE status = 'aprovada'
      AND competencia >= v_inicio_mes
      AND competencia < v_fim_mes
  LOOP
    SELECT COALESCE(SUM(valor), 0) INTO v_total
    FROM public.comissoes
    WHERE contador_id = v_contador_id
      AND status = 'aprovada'
      AND competencia >= v_inicio_mes
      AND competencia < v_fim_mes;

    IF v_total >= 100 THEN
      -- PAGAR: Total >= R$100
      UPDATE public.comissoes
      SET status = 'paga', pago_em = NOW(), updated_at = NOW()
      WHERE contador_id = v_contador_id
        AND status = 'aprovada'
        AND competencia >= v_inicio_mes
        AND competencia < v_fim_mes;

      -- Atualizar bonus relacionados
      UPDATE public.bonus_historico
      SET status = 'pago', pago_em = NOW()
      WHERE contador_id = v_contador_id
        AND status = 'aprovado'
        AND competencia >= v_inicio_mes
        AND competencia < v_fim_mes;

      -- Notificação (sem falhar se erro)
      BEGIN
        INSERT INTO public.notificacoes (contador_id, tipo, titulo, mensagem, payload)
        VALUES (
          v_contador_id,
          'comissao_liberada',
          'Comissoes Liberadas',
          'Suas comissoes foram liberadas: R$ ' || v_total::text,
          jsonb_build_object('valor', v_total, 'data', NOW())
        );
      EXCEPTION WHEN OTHERS THEN
        NULL; -- Ignora erro em notificação
      END;

      v_count_processados := v_count_processados + 1;
      v_valor_total_pago := v_valor_total_pago + v_total;
    ELSE
      -- ACUMULAR: Total < R$100
      v_count_acumulados := v_count_acumulados + 1;
    END IF;
  END LOOP;

  -- Log de sucesso
  INSERT INTO public.audit_logs (acao, tabela, payload)
  VALUES (
    'CRON_PAYMENT_PROCESSING_END',
    'comissoes',
    jsonb_build_object(
      'timestamp', NOW(),
      'processados', v_count_processados,
      'acumulados', v_count_acumulados,
      'valor_total_pago', v_valor_total_pago
    )
  );

EXCEPTION WHEN OTHERS THEN
  INSERT INTO public.audit_logs (acao, tabela, payload)
  VALUES (
    'CRON_PAYMENT_PROCESSING_ERROR',
    'comissoes',
    jsonb_build_object(
      'timestamp', NOW(),
      'error_message', SQLERRM,
      'error_sqlstate', SQLSTATE
    )
  );
END;
$$;

-- Schedule: Dia 25 de cada mês, às 00:00 UTC
-- Sintaxe: minute hour day month day_of_week
SELECT cron.schedule('payment-processing-day-25', '0 0 25 * *', 'SELECT public.cron_processar_pagamento_comissoes()');

-- Confirmar que o job foi agendado
-- Verificar com: SELECT * FROM cron.job;
