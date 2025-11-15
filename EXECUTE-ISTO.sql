-- ⚡ COPIE E COLE ISTO NO SQL EDITOR DO SUPABASE ⚡
-- URL: https://supabase.com/dashboard/project/zytxwdgzjqrcmbnpgofj

-- 1️⃣ CRIAR CONVITE (EXECUTE ISTO PRIMEIRO)
INSERT INTO invites (tipo, emissor_id, token, expira_em, status)
SELECT
  'cliente',
  (SELECT id FROM contadores ORDER BY created_at DESC LIMIT 1),
  'TESTE2025A',
  NOW() + INTERVAL '30 days',
  'ativo'
ON CONFLICT (token) DO UPDATE
SET expira_em = NOW() + INTERVAL '30 days', status = 'ativo';

-- 2️⃣ VERIFICAR SE CRIOU (DEVE RETORNAR 1 LINHA)
SELECT
  '✅ CONVITE CRIADO!' as status,
  token,
  emissor_id as contador_id,
  expira_em
FROM invites
WHERE token = 'TESTE2025A';

-- ═══════════════════════════════════════════════════════════
-- ✅ SE RETORNOU 1 LINHA = SUCESSO!
-- ═══════════════════════════════════════════════════════════
--
-- 📋 AGORA USE NA DESCRIÇÃO DA COBRANÇA ASAAS:
--
--    Mensalidade ref=TESTE2025A
--
-- ═══════════════════════════════════════════════════════════
