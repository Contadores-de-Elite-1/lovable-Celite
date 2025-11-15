-- ============================================
-- SETUP TESTE WEBHOOK V3.0 - EXECUTAR ISTO!
-- ============================================
-- Data: 2025-11-15
-- Objetivo: Criar convite para vincular contador
-- ============================================

-- PASSO 1: Buscar contador ativo e criar convite
-- (Se der erro, use PASSO 2 abaixo)

DO $$
DECLARE
  v_contador_id UUID;
  v_token TEXT := 'TESTE2025A';
BEGIN
  -- Buscar primeiro contador ativo
  SELECT id INTO v_contador_id
  FROM contadores
  WHERE status = 'ativo'
  ORDER BY created_at DESC
  LIMIT 1;

  -- Se não encontrou, criar com primeiro user
  IF v_contador_id IS NULL THEN
    SELECT id INTO v_contador_id
    FROM contadores
    LIMIT 1;
  END IF;

  -- Se ainda não tem, usar UUID padrão
  IF v_contador_id IS NULL THEN
    v_contador_id := '00000000-0000-0000-0000-000000000001';
  END IF;

  -- Criar convite
  INSERT INTO invites (
    tipo,
    emissor_id,
    token,
    expira_em,
    status
  )
  VALUES (
    'cliente',
    v_contador_id,
    v_token,
    NOW() + INTERVAL '30 days',
    'ativo'
  )
  ON CONFLICT (token) DO UPDATE
  SET
    emissor_id = EXCLUDED.emissor_id,
    expira_em = EXCLUDED.expira_em,
    status = 'ativo',
    updated_at = NOW();

  -- Exibir resultado
  RAISE NOTICE '✅ Convite criado com sucesso!';
  RAISE NOTICE 'Token: %', v_token;
  RAISE NOTICE 'Contador ID: %', v_contador_id;
  RAISE NOTICE '';
  RAISE NOTICE '📋 USE NA DESCRIÇÃO DA COBRANÇA:';
  RAISE NOTICE 'Mensalidade ref=%', v_token;
END $$;

-- Verificar se foi criado
SELECT
  id,
  tipo,
  token,
  emissor_id as contador_id,
  expira_em,
  status,
  created_at
FROM invites
WHERE token = 'TESTE2025A';


-- ============================================
-- PASSO 2: SE DER ERRO ACIMA, USE ISTO:
-- ============================================
-- (Descomente removendo os -- no início)

-- INSERT INTO invites (tipo, emissor_id, token, expira_em, status)
-- SELECT
--   'cliente',
--   (SELECT id FROM contadores ORDER BY created_at DESC LIMIT 1),
--   'TESTE2025A',
--   NOW() + INTERVAL '30 days',
--   'ativo'
-- WHERE NOT EXISTS (
--   SELECT 1 FROM invites WHERE token = 'TESTE2025A'
-- );


-- ============================================
-- VERIFICAÇÃO: VER CONVITE CRIADO
-- ============================================

SELECT
  i.id,
  i.token,
  i.tipo,
  i.status,
  i.emissor_id as contador_id,
  p.nome as contador_nome,
  p.email as contador_email,
  i.expira_em,
  i.created_at
FROM invites i
LEFT JOIN contadores c ON i.emissor_id = c.id
LEFT JOIN profiles p ON c.user_id = p.id
WHERE i.token = 'TESTE2025A';


-- ============================================
-- RESULTADO ESPERADO:
-- ============================================
-- 1 linha retornada mostrando:
-- • token: TESTE2025A
-- • status: ativo
-- • contador_id: (UUID do contador)
-- • expira_em: 2025-12-15 (30 dias)
--
-- ✅ SE APARECER 1 LINHA = SUCESSO!
-- ❌ SE APARECER 0 LINHAS = Execute PASSO 2 acima
-- ============================================


-- ============================================
-- INSTRUÇÕES PARA O TESTE:
-- ============================================
-- Após executar este SQL e confirmar que o convite
-- foi criado, vá para o ASAAS Sandbox e:
--
-- 1. Criar nova cobrança
-- 2. Cliente: Dados reais (sua esposa)
-- 3. Valor: R$ 199,90
-- 4. Vencimento: Hoje
-- 5. Forma: PIX
-- 6. Descrição: Mensalidade ref=TESTE2025A
-- 7. Criar e marcar como recebida
-- 8. Copiar Payment ID
-- 9. Passar o ID para verificação automática
-- ============================================
