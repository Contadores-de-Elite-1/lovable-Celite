-- ============================================================================
-- VERIFICAR SE WEBHOOK V3.0 FUNCIONOU
-- ============================================================================

-- 1. AUDIT LOGS - Ver se webhook foi processado
SELECT
  '=== AUDIT LOGS (ultimos 5) ===' as info,
  acao,
  tabela,
  registro_id,
  payload,
  created_at
FROM audit_logs
ORDER BY created_at DESC
LIMIT 5;

-- 2. CLIENTES - Ver se cliente foi auto-criado
SELECT
  '=== CLIENTES CRIADOS RECENTEMENTE ===' as info,
  id,
  nome_empresa,
  asaas_customer_id,
  contador_id,
  status,
  plano,
  valor_mensal,
  created_at
FROM clientes
ORDER BY created_at DESC
LIMIT 3;

-- 3. PAGAMENTOS - Ver se pagamento foi registrado
SELECT
  '=== PAGAMENTOS REGISTRADOS RECENTEMENTE ===' as info,
  id,
  cliente_id,
  tipo,
  valor_bruto,
  valor_liquido,
  competencia,
  status,
  asaas_payment_id,
  asaas_event_id,
  pago_em,
  created_at
FROM pagamentos
ORDER BY created_at DESC
LIMIT 3;

-- 4. COMISSOES - Ver se comissões foram calculadas
SELECT
  '=== COMISSOES CALCULADAS RECENTEMENTE ===' as info,
  id,
  pagamento_id,
  contador_id,
  tipo,
  valor,
  percentual,
  status,
  competencia,
  observacao,
  created_at
FROM comissoes
ORDER BY created_at DESC
LIMIT 5;

-- 5. INVITES - Verificar se token TESTE2025A existe
SELECT
  '=== INVITE TOKEN TESTE2025A ===' as info,
  id,
  token,
  emissor_id,
  tipo,
  status,
  usado_por,
  usado_em,
  expira_em,
  created_at
FROM invites
WHERE token = 'TESTE2025A';

-- 6. WEBHOOK LOGS - Ver últimos webhooks recebidos
SELECT
  '=== WEBHOOK LOGS (ultimos 3) ===' as info,
  id,
  evento,
  payload,
  status_code,
  response,
  processado_em,
  created_at
FROM webhook_logs
ORDER BY created_at DESC
LIMIT 3;

-- 7. RESUMO - Contar registros de hoje
SELECT
  '=== RESUMO DO DIA ===' as info,
  (SELECT COUNT(*) FROM clientes WHERE created_at::date = CURRENT_DATE) as clientes_criados_hoje,
  (SELECT COUNT(*) FROM pagamentos WHERE created_at::date = CURRENT_DATE) as pagamentos_hoje,
  (SELECT COUNT(*) FROM comissoes WHERE created_at::date = CURRENT_DATE) as comissoes_hoje,
  (SELECT COUNT(*) FROM audit_logs WHERE created_at::date = CURRENT_DATE AND acao LIKE '%WEBHOOK%') as webhooks_hoje;
