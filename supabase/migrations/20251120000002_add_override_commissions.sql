-- Migration: Sistema de Comissões de Override (Segundo Nível)
-- Criada em: 2025-11-20
-- Descrição: Adiciona comissões de override para sponsors (segundo nível)

-- 1. Criar função para calcular comissões com override
CREATE OR REPLACE FUNCTION calcular_comissoes_com_override(
  cliente_id_param UUID,
  valor_mensalidade DECIMAL
)
RETURNS TABLE (
  contador_id UUID,
  tipo_comissao TEXT,
  percentual DECIMAL,
  valor DECIMAL
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_contador_direto_id UUID;
  v_sponsor_id UUID;
  v_valor_apos_stripe DECIMAL;
BEGIN
  -- Buscar contador direto do cliente
  SELECT contador_id INTO v_contador_direto_id
  FROM clientes
  WHERE id = cliente_id_param;
  
  IF v_contador_direto_id IS NULL THEN
    RAISE EXCEPTION 'Cliente não tem contador associado';
  END IF;
  
  -- Calcular valor após taxas do Stripe (3.79%)
  v_valor_apos_stripe := valor_mensalidade * 0.9621;
  
  -- 1. Comissão Direta (15% do valor após Stripe)
  RETURN QUERY
  SELECT 
    v_contador_direto_id AS contador_id,
    'direta'::TEXT AS tipo_comissao,
    0.15::DECIMAL AS percentual,
    (v_valor_apos_stripe * 0.15)::DECIMAL AS valor;
  
  -- 2. Buscar sponsor (se existir)
  SELECT sponsor_id INTO v_sponsor_id
  FROM contadores
  WHERE id = v_contador_direto_id;
  
  -- 3. Comissão de Override (5% do valor após Stripe) - apenas se tiver sponsor
  IF v_sponsor_id IS NOT NULL THEN
    RETURN QUERY
    SELECT 
      v_sponsor_id AS contador_id,
      'override'::TEXT AS tipo_comissao,
      0.05::DECIMAL AS percentual,
      (v_valor_apos_stripe * 0.05)::DECIMAL AS valor;
  END IF;
  
END;
$$;

COMMENT ON FUNCTION calcular_comissoes_com_override IS 'Calcula comissões diretas (15%) e override (5%) sobre o valor após taxas do Stripe';

-- 2. Adicionar coluna tipo na tabela comissoes (se não existir)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'comissoes' AND column_name = 'tipo_comissao'
  ) THEN
    ALTER TABLE comissoes 
    ADD COLUMN tipo_comissao TEXT CHECK (tipo_comissao IN ('direta', 'override')) DEFAULT 'direta';
    
    CREATE INDEX idx_comissoes_tipo ON comissoes(tipo_comissao);
  END IF;
END $$;

COMMENT ON COLUMN comissoes.tipo_comissao IS 'Tipo de comissão: direta (15%) ou override (5% do sponsor)';

-- 3. View para visualização de comissões com hierarquia
CREATE OR REPLACE VIEW v_comissoes_hierarquia AS
SELECT 
  com.id,
  com.contador_id,
  u.raw_user_meta_data->>'nome' AS contador_nome,
  com.cliente_id,
  cli.nome AS cliente_nome,
  com.tipo_comissao,
  com.valor,
  com.status_comissao,
  com.competencia,
  c.sponsor_id,
  us.raw_user_meta_data->>'nome' AS sponsor_nome,
  com.created_at
FROM comissoes com
INNER JOIN contadores c ON c.id = com.contador_id
INNER JOIN auth.users u ON u.id = c.user_id
LEFT JOIN clientes cli ON cli.id = com.cliente_id
LEFT JOIN contadores cs ON cs.id = c.sponsor_id
LEFT JOIN auth.users us ON us.id = cs.user_id;

COMMENT ON VIEW v_comissoes_hierarquia IS 'Visualização de comissões com informações de hierarquia (sponsor/indicado)';

-- 4. Função para processar pagamento de cliente com comissões automáticas
CREATE OR REPLACE FUNCTION processar_pagamento_cliente(
  p_cliente_id UUID,
  p_valor_mensalidade DECIMAL,
  p_competencia DATE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_comissao RECORD;
  v_total_comissoes DECIMAL := 0;
  v_resultado JSONB;
BEGIN
  -- Calcular e inserir comissões
  FOR v_comissao IN 
    SELECT * FROM calcular_comissoes_com_override(p_cliente_id, p_valor_mensalidade)
  LOOP
    INSERT INTO comissoes (
      contador_id,
      cliente_id,
      tipo_comissao,
      valor,
      competencia,
      status_comissao
    ) VALUES (
      v_comissao.contador_id,
      p_cliente_id,
      v_comissao.tipo_comissao,
      v_comissao.valor,
      p_competencia,
      'pendente'
    );
    
    v_total_comissoes := v_total_comissoes + v_comissao.valor;
  END LOOP;
  
  -- Retornar resultado
  v_resultado := jsonb_build_object(
    'success', true,
    'cliente_id', p_cliente_id,
    'valor_mensalidade', p_valor_mensalidade,
    'total_comissoes', v_total_comissoes,
    'margem_lovable', p_valor_mensalidade - v_total_comissoes
  );
  
  RETURN v_resultado;
END;
$$;

COMMENT ON FUNCTION processar_pagamento_cliente IS 'Processa pagamento de cliente e gera comissões automáticas (direta + override)';

-- 5. View para dashboard de rede (ver indicados e suas vendas)
CREATE OR REPLACE VIEW v_dashboard_rede AS
SELECT 
  c.id AS contador_id,
  c.user_id,
  u.raw_user_meta_data->>'nome' AS contador_nome,
  c.sponsor_id,
  -- Indicados diretos
  (
    SELECT COUNT(*)
    FROM contadores indicados
    WHERE indicados.sponsor_id = c.id
    AND indicados.status = 'ativo'
  ) AS total_indicados,
  -- Clientes diretos ativos
  c.clientes_ativos,
  -- Comissões diretas este mês
  (
    SELECT COALESCE(SUM(valor), 0)
    FROM comissoes
    WHERE contador_id = c.id
    AND tipo_comissao = 'direta'
    AND competencia >= date_trunc('month', CURRENT_DATE)
    AND status_comissao IN ('pendente', 'paga')
  ) AS comissoes_diretas_mes,
  -- Comissões override este mês
  (
    SELECT COALESCE(SUM(valor), 0)
    FROM comissoes
    WHERE contador_id = c.id
    AND tipo_comissao = 'override'
    AND competencia >= date_trunc('month', CURRENT_DATE)
    AND status_comissao IN ('pendente', 'paga')
  ) AS comissoes_override_mes
FROM contadores c
INNER JOIN auth.users u ON u.id = c.user_id
WHERE c.status = 'ativo';

COMMENT ON VIEW v_dashboard_rede IS 'Dashboard de rede para contadores: indicados, clientes e comissões (diretas + override)';

