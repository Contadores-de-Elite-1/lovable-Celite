-- ============================================================================
-- DIAGNOSTICO: WEBHOOK NAO PROCESSOU (0 registros)
-- ============================================================================

-- 1. TODOS OS AUDIT LOGS (últimas 24h) - Ver se webhook foi chamado
SELECT
  '=== TODOS AUDIT LOGS (24h) ===' as secao,
  acao,
  tabela,
  registro_id,
  payload,
  created_at
FROM audit_logs
WHERE created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;

-- 2. WEBHOOK LOGS (se existir tabela) - Ver tentativas de webhook
SELECT
  '=== WEBHOOK LOGS (se houver) ===' as secao,
  id,
  evento,
  payload,
  status_code,
  response,
  erro,
  created_at
FROM webhook_logs
WHERE created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC
LIMIT 10;

-- 3. TODOS OS CLIENTES - Ver último cliente criado
SELECT
  '=== TODOS OS CLIENTES (últimos 5) ===' as secao,
  id,
  nome_empresa,
  asaas_customer_id,
  contador_id,
  status,
  created_at
FROM clientes
ORDER BY created_at DESC
LIMIT 5;

-- 4. TODOS OS PAGAMENTOS - Ver último pagamento
SELECT
  '=== TODOS OS PAGAMENTOS (últimos 5) ===' as secao,
  id,
  cliente_id,
  tipo,
  valor_bruto,
  status,
  asaas_payment_id,
  created_at
FROM pagamentos
ORDER BY created_at DESC
LIMIT 5;

-- 5. INVITES - Ver se token TESTE2025A existe
SELECT
  '=== INVITE TOKEN TESTE2025A ===' as secao,
  id,
  token,
  emissor_id,
  tipo,
  status,
  usado_por,
  created_at
FROM invites
WHERE token = 'TESTE2025A';

-- 6. CONTADORES - Ver se tem contador ativo
SELECT
  '=== CONTADORES ATIVOS ===' as secao,
  id,
  user_id,
  nivel,
  status,
  clientes_ativos,
  created_at
FROM contadores
WHERE status = 'ativo'
ORDER BY created_at DESC
LIMIT 3;
