-- SQL DIRETO NO SUPABASE
-- Execute no SQL Editor do Supabase Dashboard

-- 1. Verificar se já tem contador
SELECT id, nivel, status FROM contadores LIMIT 1;

-- Se NÃO tem contador, primeiro criar um:
-- (Pegar um user_id da tabela auth.users)
SELECT id FROM auth.users LIMIT 1;

-- Criar contador (substituir USER_ID)
INSERT INTO contadores (user_id, nivel, status, xp, clientes_ativos)
VALUES ('SUBSTITUIR_USER_ID_AQUI', 'bronze', 'ativo', 0, 0)
RETURNING id;

-- 2. Criar o cliente que está faltando
-- (Substituir CONTADOR_ID pelo id retornado acima)
INSERT INTO clientes (
  contador_id,
  nome_empresa,
  cnpj,
  contato_email,
  status,
  plano,
  valor_mensal,
  asaas_customer_id,
  data_ativacao
) VALUES (
  'SUBSTITUIR_CONTADOR_ID_AQUI',
  'Cliente Teste Real',
  '00000000000000',
  'teste@real.com',
  'ativo',
  'profissional',
  199.90,
  'cus_000007222099',  -- ← Cliente que ASAAS está enviando
  NOW()
) RETURNING id, asaas_customer_id;

-- 3. Verificar se foi criado
SELECT * FROM clientes WHERE asaas_customer_id = 'cus_000007222099';
