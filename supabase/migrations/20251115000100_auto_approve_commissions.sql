-- MILESTONE 6: Auto-approve calculated commissions after 24 hours
-- Allows users to see commission balance immediately while awaiting admin review

-- 1. Add column to track auto-approval
ALTER TABLE public.comissoes
ADD COLUMN IF NOT EXISTS auto_aprovada_em TIMESTAMPTZ;

-- 2. Function to auto-approve old commissions
CREATE OR REPLACE FUNCTION public.auto_aprovar_comissoes()
RETURNS TABLE(contador_id UUID, total_aprovadas NUMERIC, comissoes_afetadas INT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_contador_id UUID;
  v_count INT;
  v_total NUMERIC;
BEGIN
  -- Auto-approve commissions older than 24 hours in 'calculada' status
  UPDATE public.comissoes
  SET
    status_comissao = 'aprovada',
    auto_aprovada_em = now()
  WHERE
    status_comissao = 'calculada'
    AND created_at < (now() - INTERVAL '1 day')
    AND auto_aprovada_em IS NULL;

  -- Return summary of what was approved
  FOR v_contador_id IN
    SELECT DISTINCT contador_id FROM public.comissoes
    WHERE auto_aprovada_em > (now() - INTERVAL '1 minute')
  LOOP
    SELECT
      COUNT(*),
      COALESCE(SUM(valor), 0)
    INTO v_count, v_total
    FROM public.comissoes
    WHERE contador_id = v_contador_id AND status_comissao = 'aprovada';

    RETURN QUERY SELECT v_contador_id, v_total, v_count;
  END LOOP;
END;
$$;

-- 3. Grant execute permission
GRANT EXECUTE ON FUNCTION public.auto_aprovar_comissoes TO authenticated, service_role;

-- 4. Create index for auto-approval query efficiency
CREATE INDEX IF NOT EXISTS idx_comissoes_auto_approve
ON public.comissoes(status_comissao, created_at)
WHERE status_comissao = 'calculada' AND auto_aprovada_em IS NULL;

-- 5. Comment for clarity
COMMENT ON FUNCTION public.auto_aprovar_comissoes IS 'Auto-approve commissions older than 24 hours to show user balance. Runs daily via cron.';
COMMENT ON COLUMN public.comissoes.auto_aprovada_em IS 'Timestamp when auto-approval was applied (NULL = manual approval or pending)';
