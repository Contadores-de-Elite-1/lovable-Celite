-- ⚡ DIAGNÓSTICO RÁPIDO - COPIE E EXECUTE NO SUPABASE ⚡
-- https://supabase.com/dashboard/project/zytxwdgzjqrcmbnpgofj

-- 1️⃣ VER ÚLTIMOS PAGAMENTOS (últimos 5)
SELECT
  id,
  asaas_payment_id,
  valor_bruto,
  tipo,
  status,
  created_at,
  NOW() - created_at as idade
FROM pagamentos
ORDER BY created_at DESC
LIMIT 5;

-- 2️⃣ VER ÚLTIMOS CLIENTES CRIADOS (últimos 3)
SELECT
  id,
  nome_empresa,
  asaas_customer_id,
  contador_id,
  status,
  created_at,
  NOW() - created_at as idade
FROM clientes
ORDER BY created_at DESC
LIMIT 3;

-- 3️⃣ VER ÚLTIMOS AUDIT LOGS DE WEBHOOK (últimos 5)
SELECT
  id,
  acao,
  payload->>'asaas_payment_id' as payment_id,
  payload->>'event' as event_type,
  payload->>'error' as erro,
  created_at,
  NOW() - created_at as idade
FROM audit_logs
WHERE acao LIKE '%WEBHOOK%'
ORDER BY created_at DESC
LIMIT 5;

-- 4️⃣ VERIFICAR SE CONVITE EXISTE
SELECT
  token,
  emissor_id as contador_id,
  status,
  expira_em
FROM invites
WHERE token = 'TESTE2025A';

-- ════════════════════════════════════════════════════════
-- EXECUTE TODAS AS QUERIES ACIMA ↑
-- Me passe os resultados (pode tirar screenshot)
-- ════════════════════════════════════════════════════════
