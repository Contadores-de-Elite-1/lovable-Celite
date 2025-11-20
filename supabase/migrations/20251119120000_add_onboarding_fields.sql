-- Adicionar campos para onboarding de contadores

-- Coluna para link único rastreável
ALTER TABLE contadores
ADD COLUMN IF NOT EXISTS link_rastreavel TEXT UNIQUE;

-- Coluna para controle de primeiro acesso
ALTER TABLE contadores
ADD COLUMN IF NOT EXISTS primeiro_acesso BOOLEAN DEFAULT true;

-- Comentários
COMMENT ON COLUMN contadores.link_rastreavel IS 'Link único e permanente do contador para indicação de clientes';
COMMENT ON COLUMN contadores.primeiro_acesso IS 'Indica se o contador ainda não completou o onboarding inicial';

-- Índice para busca rápida por link
CREATE INDEX IF NOT EXISTS idx_contadores_link_rastreavel 
ON contadores(link_rastreavel) 
WHERE link_rastreavel IS NOT NULL;

