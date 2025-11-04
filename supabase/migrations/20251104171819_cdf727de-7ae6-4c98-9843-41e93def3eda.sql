-- FASE 0: FUNDAÇÃO SÓLIDA - Schema Completo

-- 1. Corrigir enum tipo_comissao (adicionar valores faltantes)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tipo_comissao') THEN
    CREATE TYPE tipo_comissao AS ENUM ('ativacao', 'recorrente', 'bonus_rede');
  END IF;
END $$;

ALTER TYPE tipo_comissao ADD VALUE IF NOT EXISTS 'override';
ALTER TYPE tipo_comissao ADD VALUE IF NOT EXISTS 'bonus_progressao';
ALTER TYPE tipo_comissao ADD VALUE IF NOT EXISTS 'bonus_volume';
ALTER TYPE tipo_comissao ADD VALUE IF NOT EXISTS 'bonus_ltv';
ALTER TYPE tipo_comissao ADD VALUE IF NOT EXISTS 'bonus_contador';

-- 2. Criar tabela de auditoria de cálculos
CREATE TABLE IF NOT EXISTS public.comissoes_calculo_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comissao_id UUID REFERENCES public.comissoes(id) ON DELETE CASCADE,
  regra_aplicada TEXT NOT NULL,
  valores_intermediarios JSONB,
  resultado_final NUMERIC,
  calculado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  calculado_por UUID,
  observacoes TEXT
);

-- 3. Criar tabela de histórico de bônus
CREATE TABLE IF NOT EXISTS public.bonus_historico (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contador_id UUID NOT NULL REFERENCES public.contadores(id) ON DELETE CASCADE,
  tipo_bonus TEXT NOT NULL,
  marco_atingido INTEGER,
  valor NUMERIC NOT NULL,
  conquistado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  pago_em TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'pendente',
  competencia DATE NOT NULL,
  observacao TEXT
);

-- 4. Criar tabela de performance anual (vitaliciedade)
CREATE TABLE IF NOT EXISTS public.contador_performance_anual (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contador_id UUID NOT NULL REFERENCES public.contadores(id) ON DELETE CASCADE,
  ano INTEGER NOT NULL,
  indicacoes_diretas INTEGER DEFAULT 0,
  retencao_percentual NUMERIC DEFAULT 100,
  participacao_eventos INTEGER DEFAULT 0,
  total_eventos_ano INTEGER DEFAULT 0,
  status_vitaliciedade TEXT DEFAULT 'ativo',
  ultima_atualizacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(contador_id, ano)
);

-- 5. Adicionar campos de controle em comissoes
ALTER TABLE public.comissoes ADD COLUMN IF NOT EXISTS nivel_sponsor TEXT;
ALTER TABLE public.comissoes ADD COLUMN IF NOT EXISTS referencia_mes DATE;
ALTER TABLE public.comissoes ADD COLUMN IF NOT EXISTS auditado BOOLEAN DEFAULT FALSE;
ALTER TABLE public.comissoes ADD COLUMN IF NOT EXISTS origem_cliente_id UUID REFERENCES public.clientes(id);

-- 6. Função para rastrear mudanças em comissoes
CREATE OR REPLACE FUNCTION public.track_comissao_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

-- 7. Criar trigger de auditoria
DROP TRIGGER IF EXISTS audit_comissao_changes ON public.comissoes;
CREATE TRIGGER audit_comissao_changes
AFTER INSERT OR UPDATE OR DELETE ON public.comissoes
FOR EACH ROW EXECUTE FUNCTION public.track_comissao_changes();

-- 8. Função para atualizar performance do contador
CREATE OR REPLACE FUNCTION public.atualizar_performance_contador()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ano INTEGER;
BEGIN
  v_ano := EXTRACT(YEAR FROM NEW.data_ativacao);
  
  -- Inserir ou atualizar registro de performance
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
$$;

-- 9. Criar trigger para atualizar performance quando cliente é ativado
DROP TRIGGER IF EXISTS update_contador_performance ON public.clientes;
CREATE TRIGGER update_contador_performance
AFTER INSERT ON public.clientes
FOR EACH ROW 
WHEN (NEW.status = 'ativo')
EXECUTE FUNCTION public.atualizar_performance_contador();

-- 10. RLS Policies para novas tabelas

-- comissoes_calculo_log
ALTER TABLE public.comissoes_calculo_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view all calculo logs"
ON public.comissoes_calculo_log
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Contadores view own calculo logs"
ON public.comissoes_calculo_log
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.comissoes c
    WHERE c.id = comissoes_calculo_log.comissao_id
    AND c.contador_id = get_contador_id(auth.uid())
  )
);

-- bonus_historico
ALTER TABLE public.bonus_historico ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Contadores view own bonus"
ON public.bonus_historico
FOR SELECT
USING (
  contador_id = get_contador_id(auth.uid())
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- contador_performance_anual
ALTER TABLE public.contador_performance_anual ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Contadores view own performance"
ON public.contador_performance_anual
FOR SELECT
USING (
  contador_id = get_contador_id(auth.uid())
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- 11. Índices para performance
CREATE INDEX IF NOT EXISTS idx_comissoes_calculo_log_comissao ON public.comissoes_calculo_log(comissao_id);
CREATE INDEX IF NOT EXISTS idx_bonus_historico_contador ON public.bonus_historico(contador_id, competencia);
CREATE INDEX IF NOT EXISTS idx_performance_contador_ano ON public.contador_performance_anual(contador_id, ano);
CREATE INDEX IF NOT EXISTS idx_comissoes_tipo_status ON public.comissoes(tipo, status, competencia);
CREATE INDEX IF NOT EXISTS idx_comissoes_contador_competencia ON public.comissoes(contador_id, competencia);