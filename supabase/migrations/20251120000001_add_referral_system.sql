-- Migration: Sistema Universal de Referral e Rede de Contadores
-- Criada em: 2025-11-20
-- Descrição: Adiciona sistema de indicação multinível para contadores e clientes

-- 1. Adicionar campo sponsor_id na tabela contadores
ALTER TABLE contadores 
ADD COLUMN IF NOT EXISTS sponsor_id UUID REFERENCES contadores(id) ON DELETE SET NULL;

-- Índice para melhorar performance de consultas de rede
CREATE INDEX IF NOT EXISTS idx_contadores_sponsor_id ON contadores(sponsor_id);

-- Comentário explicativo
COMMENT ON COLUMN contadores.sponsor_id IS 'ID do contador que indicou este contador (upline/sponsor). Usado para comissões de override (segundo nível).';

-- 2. Criar tabela de rastreamento de referrals (analytics)
CREATE TABLE IF NOT EXISTS referral_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Token de referral usado
  referral_token TEXT NOT NULL,
  
  -- Dados do hit
  visited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ip_address TEXT,
  user_agent TEXT,
  page_url TEXT,
  
  -- Conversão (preenchido quando usuário se cadastra)
  converted BOOLEAN DEFAULT FALSE,
  converted_at TIMESTAMP WITH TIME ZONE,
  converted_user_id UUID REFERENCES auth.users(id),
  converted_type TEXT CHECK (converted_type IN ('cliente', 'contador')),
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para analytics
CREATE INDEX IF NOT EXISTS idx_referral_tracking_token ON referral_tracking(referral_token);
CREATE INDEX IF NOT EXISTS idx_referral_tracking_converted ON referral_tracking(converted);
CREATE INDEX IF NOT EXISTS idx_referral_tracking_visited_at ON referral_tracking(visited_at);

-- Comentários
COMMENT ON TABLE referral_tracking IS 'Rastreamento de hits em links de referral para analytics e conversões';
COMMENT ON COLUMN referral_tracking.referral_token IS 'Token único do contador (link_rastreavel)';
COMMENT ON COLUMN referral_tracking.converted_type IS 'Tipo de conversão: cliente ou contador';

-- 3. Função para buscar contador pelo token de referral
CREATE OR REPLACE FUNCTION get_contador_by_referral_token(token TEXT)
RETURNS TABLE (
  contador_id UUID,
  contador_user_id UUID,
  contador_nome TEXT,
  contador_nivel TEXT,
  contador_status TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.user_id,
    u.raw_user_meta_data->>'nome' AS nome,
    c.nivel::TEXT,
    c.status::TEXT
  FROM contadores c
  INNER JOIN auth.users u ON u.id = c.user_id
  WHERE c.link_rastreavel = token
  AND c.status = 'ativo';
END;
$$;

COMMENT ON FUNCTION get_contador_by_referral_token(TEXT) IS 'Busca contador pelo token de referral e retorna dados para conversão';

-- 4. View para análise de rede de contadores
CREATE OR REPLACE VIEW v_rede_contadores AS
SELECT 
  c.id AS contador_id,
  c.user_id,
  u.raw_user_meta_data->>'nome' AS contador_nome,
  c.nivel,
  c.status,
  c.clientes_ativos,
  c.sponsor_id,
  s.user_id AS sponsor_user_id,
  us.raw_user_meta_data->>'nome' AS sponsor_nome,
  (
    SELECT COUNT(*)
    FROM contadores indicados
    WHERE indicados.sponsor_id = c.id
  ) AS total_indicados,
  c.created_at
FROM contadores c
LEFT JOIN contadores s ON s.id = c.sponsor_id
LEFT JOIN auth.users u ON u.id = c.user_id
LEFT JOIN auth.users us ON us.id = s.user_id;

COMMENT ON VIEW v_rede_contadores IS 'Visualização da rede de contadores com informações de sponsor e indicados';

-- 5. Função para calcular profundidade da rede
CREATE OR REPLACE FUNCTION get_network_depth(contador_id_param UUID)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  depth INTEGER := 0;
  current_sponsor_id UUID;
BEGIN
  current_sponsor_id := (SELECT sponsor_id FROM contadores WHERE id = contador_id_param);
  
  WHILE current_sponsor_id IS NOT NULL LOOP
    depth := depth + 1;
    current_sponsor_id := (SELECT sponsor_id FROM contadores WHERE id = current_sponsor_id);
    
    -- Prevenir loop infinito
    IF depth > 10 THEN
      EXIT;
    END IF;
  END LOOP;
  
  RETURN depth;
END;
$$;

COMMENT ON FUNCTION get_network_depth(UUID) IS 'Calcula a profundidade (níveis acima) de um contador na rede';

