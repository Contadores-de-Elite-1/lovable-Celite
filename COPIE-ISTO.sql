-- ⚡⚡⚡ COPIE TUDO DAQUI ATÉ O FINAL E COLE NO SUPABASE ⚡⚡⚡
-- URL: https://supabase.com/dashboard/project/zytxwdgzjqrcmbnpgofj
-- SQL Editor → New Query → Colar → Run (botão verde)

INSERT INTO invites (tipo, emissor_id, token, expira_em, status)
SELECT 'cliente', id, 'TESTE2025A', NOW() + INTERVAL '30 days', 'ativo'
FROM contadores
ORDER BY created_at DESC
LIMIT 1
ON CONFLICT (token) DO UPDATE SET expira_em = NOW() + INTERVAL '30 days', status = 'ativo';

SELECT '✅ SUCESSO! Use isto na descrição da cobrança:' as resultado,
       'Mensalidade ref=TESTE2025A' as descricao_asaas,
       token, emissor_id as contador_id, status
FROM invites WHERE token = 'TESTE2025A';
