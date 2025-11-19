-- Migration: Corrigir ENUM tipo_plano para refletir valores reais do negócio
-- Autor: Claude Sonnet 4.5
-- Data: 2025-11-19
-- Descrição: Substitui ENUMs incorretos ('basico', 'profissional', 'premium', 'enterprise')
--            pelos valores corretos ('pro', 'premium', 'top')

-- IMPORTANTE: Esta migration altera o ENUM tipo_plano
-- Certifique-se de que não há dados em produção antes de executar
-- Se houver dados, será necessário migrar os valores existentes

-- Passo 1: Criar novo ENUM com valores corretos
CREATE TYPE tipo_plano_new AS ENUM ('pro', 'premium', 'top');

-- Passo 2: Adicionar coluna temporária na tabela clientes
ALTER TABLE clientes 
ADD COLUMN plano_new tipo_plano_new;

-- Passo 3: Migrar dados existentes (se houver)
-- Mapeamento:
--   'basico' → 'pro'
--   'profissional' → 'premium'
--   'premium' → 'premium' (sem mudança)
--   'enterprise' → 'top'
UPDATE clientes
SET plano_new = CASE
  WHEN plano = 'basico' THEN 'pro'::tipo_plano_new
  WHEN plano = 'profissional' THEN 'premium'::tipo_plano_new
  WHEN plano = 'premium' THEN 'premium'::tipo_plano_new
  WHEN plano = 'enterprise' THEN 'top'::tipo_plano_new
  ELSE 'pro'::tipo_plano_new -- Fallback para casos não mapeados
END;

-- Passo 4: Remover coluna antiga
ALTER TABLE clientes DROP COLUMN plano;

-- Passo 5: Renomear coluna nova para nome original
ALTER TABLE clientes RENAME COLUMN plano_new TO plano;

-- Passo 6: Adicionar constraint NOT NULL (se aplicável)
ALTER TABLE clientes ALTER COLUMN plano SET NOT NULL;

-- Passo 7: Remover ENUM antigo
DROP TYPE tipo_plano;

-- Passo 8: Renomear novo ENUM para nome original
ALTER TYPE tipo_plano_new RENAME TO tipo_plano;

-- Passo 9: Criar índice (opcional, para performance)
CREATE INDEX idx_clientes_plano ON clientes(plano);

-- Passo 10: Comentário de documentação
COMMENT ON TYPE tipo_plano IS 'Planos disponíveis: Pro (R$100), Premium (R$130), Top (R$180)';

-- Verificação: Query para confirmar migração
-- SELECT plano, COUNT(*) as total FROM clientes GROUP BY plano;

