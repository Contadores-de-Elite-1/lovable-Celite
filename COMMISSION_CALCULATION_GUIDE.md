# 💰 Commission Calculation Guide - Technical Deep Dive

**Status**: Production Implementation Guide
**Date**: Nov 14, 2025
**Applies to**: Contadores de Elite v1.0+

---

## 🎯 Overview

O sistema de comissões é **multi-camadas**, **automático**, e **auditado**.

```
Pagamento Asaas
    ↓
Webhook Recebido
    ↓
Validação de Assinatura (MD5)
    ↓
Pagamento Registrado
    ↓
Cálculo de Comissões (5 tipos)
    ↓
Auto-Aprovação (24h depois)
    ↓
Processamento (dia 25 do mês, se ≥ R$ 100)
```

---

## 📊 Tipos de Comissão

### 1️⃣ Comissão Recorrente (PRIMARY)

**Quando**: Todo mês, quando cliente paga subscription

**Cálculo**: Porcentagem baseada em nível

```
Nivel       | Taxa    | Exemplo (R$ 290 valor líquido)
------------|---------|-------------------------------
BRONZE      | 15%     | R$ 290 × 15% = R$ 43,50
PRATA       | 17%     | R$ 290 × 17% = R$ 49,30
OURO        | 19%     | R$ 290 × 19% = R$ 55,10
DIAMANTE    | 20%     | R$ 290 × 20% = R$ 58,00
```

**Código** (em webhook):
```javascript
const comissaoRecorrente = valor_liquido * (tasaPorNivel);
```

**Database**:
```sql
INSERT INTO comissoes (
  contador_id,
  pagamento_id,
  tipo_comissao,
  valor,
  status_comissao,
  competencia
) VALUES (
  contador_id,
  payment_id,
  'recorrente',
  43.50,
  'calculada',
  '2025-11-01'
);
```

---

### 2️⃣ Bônus de Progressão (PROGRESSION BONUS)

**Quando**: Cliente atinge milestone de ativações

**Milestones**:
- 5º cliente ativo: R$ 100
- 10º cliente ativo: R$ 100
- 15º cliente ativo: R$ 100

**Cálculo**:
```javascript
if (contador.clientes_ativos === 5) {
  comissao_bonus = 100.00;  // Trigger de progressão
}
if (contador.clientes_ativos === 10) {
  comissao_bonus = 100.00;
}
if (contador.clientes_ativos === 15) {
  comissao_bonus = 100.00;
}
```

**Exemplo**:
- Contador tem 4 clientes ativos
- 5º cliente paga primeira mensalidade
- Sistema detecta: `clientes_ativos` = 5
- **Cria comissão bônus**: R$ 100

---

### 3️⃣ Bônus de Volume (VOLUME BONUS)

**Quando**: Cliente atinge volume acumulado

**Condição**: Após 15 clientes, +R$ 100 a cada 5 clientes

```
15 clientes: Sem bônus (só progressão)
20 clientes: +R$ 100 (volume)
25 clientes: +R$ 200 (2×volume)
30 clientes: +R$ 300 (3×volume)
```

**Código**:
```javascript
if (contador.clientes_ativos > 15) {
  const bonus_layers = Math.floor((contador.clientes_ativos - 15) / 5);
  comissao_volume = bonus_layers * 100;
}
```

---

### 4️⃣ Comissão de Override (MANAGEMENT BONUS)

**Quando**: Seu patron/sponsor também ganha

**Condição**: Você tem downline que gera comissões

**Taxa**: 3-5% conforme nível do sponsor

```
Meu Nível   | Taxa do Meu Downline  | Exemplo
------------|----------------------|----------------------------
BRONZE      | 3%                   | R$ 43,50 × 3% = R$ 1,30
PRATA       | 4%                   | R$ 43,50 × 4% = R$ 1,74
OURO        | 5%                   | R$ 43,50 × 5% = R$ 2,17
DIAMANTE    | 5%                   | R$ 43,50 × 5% = R$ 2,17
```

**Exemplo**:
- Você é PRATA
- Seu downline (alguém que você recrutou) é BRONZE
- Downline ganha comissão de R$ 43,50
- Você ganha override: R$ 43,50 × 4% = R$ 1,74

---

### 5️⃣ Bônus Recrutamento (ACCOUNTANT REFERRAL)

**Quando**: Você recruta novo contador E ele consegue primeiro cliente

**Valor**: R$ 50 (one-time)

**Código**:
```javascript
if (
  novo_contador.primeiro_cliente_ativado === true &&
  novo_contador.indicado_por === seu_contador_id
) {
  comissao_referral = 50.00;  // One-time only
}
```

---

## 🧮 Exemplo Completo de Cálculo

### Cenário

```
Contador: "João Silva"
  - Nível: PRATA
  - Clientes ativos: 12 (acabou de virar)
  - Sponsor: "Pedro Costa" (OURO)

Pagamento recebido:
  - Cliente: "Empresa ABC"
  - Valor Bruto: R$ 500,00
  - Valor Líquido: R$ 480,00 (taxas Asaas)
  - Tipo: Subscription mensal
```

### Passo 1: Webhook Recebido

```json
{
  "event": "PAYMENT_CONFIRMED",
  "payment": {
    "id": "pay_123456",
    "customer": "cust_abc",
    "value": 500.00,
    "netValue": 480.00,
    "dateCreated": "2025-11-14T10:00:00Z",
    "status": "CONFIRMED"
  }
}
```

### Passo 2: Validação

```javascript
// 1. Validar assinatura MD5
const hash = MD5("payload" + WEBHOOK_SECRET);
if (hash !== payload.signature) throw "Invalid signature";

// 2. Validar montante
if (480.00 <= 0) throw "Invalid amount";

// 3. Verificar idempotência (não processar 2x)
const exists = await db.query(
  "SELECT * FROM pagamentos WHERE asaas_payment_id = ?",
  ["pay_123456"]
);
if (exists) return "Already processed (idempotent)";
```

### Passo 3: Registrar Pagamento

```sql
INSERT INTO pagamentos (
  cliente_id,
  contador_id,
  valor_bruto,
  valor_liquido,
  asaas_payment_id,
  status_pagamento,
  competencia
) VALUES (
  'cust_abc',
  'contador_joao_id',
  500.00,
  480.00,
  'pay_123456',
  'CONFIRMADO',
  '2025-11-14'
);
```

### Passo 4: Calcular Comissões

**4.1 Comissão Recorrente**
```
João é PRATA: taxa 17%
Valor líquido: R$ 480
Comissão: 480 × 0.17 = R$ 81,60

→ INSERT INTO comissoes (
    tipo_comissao='recorrente',
    valor=81.60,
    status='calculada'
  )
```

**4.2 Bônus de Progressão**
```
João tinha 11 clientes
Agora tem 12 (payment criou novo registro)

NÃO ativa bonus (só em 5, 10, 15)

→ Nada adicionado
```

**4.3 Bônus de Volume**
```
João tem 12 clientes (12 > 15? NÃO)

NÃO qualifica para volume bonus

→ Nada adicionado
```

**4.4 Override do Sponsor**
```
João ganhou R$ 81,60
Sponsor Pedro é OURO: taxa 5%

Pedro ganha: 81.60 × 0.05 = R$ 4,08

→ INSERT INTO comissoes (
    contador_id='pedro_id',
    tipo_comissao='override',
    valor=4.08,
    status='calculada'
  )
```

### Resultado Final

```
Para João:
  - Comissão Recorrente: R$ 81,60
  - Total: R$ 81,60 (status: calculada)

Para Pedro (Sponsor):
  - Override (5% de comissão de João): R$ 4,08
  - Total: R$ 4,08 (status: calculada)
```

---

## 📋 Status Workflow

```
calculada (criada após webhook)
    ↓
    ├─ Auto-aprovação após 24h
    ├─ Ou aprovação manual por admin
    ↓
aprovada (pronta para payout)
    ↓
    ├─ CRON dia 25
    ├─ Se valor ≥ R$ 100
    ├─ Se contador tem conta bancária/PIX configurado
    ↓
paga (transferência realizada)
```

### Status Values

```sql
SELECT DISTINCT status_comissao FROM comissoes;

Resultados:
- 'calculada'      -- Waiting approval (or 24h for auto-approve)
- 'aprovada'       -- Approved, waiting payout day 25
- 'paga'           -- Transferred to accountant
- 'rejeitada'      -- Rejected by admin (reason in notes)
- 'cancelada'      -- Cancelled (customer refund, etc)
```

---

## 🔄 Auto-Approval Process

### Function
```sql
CREATE FUNCTION auto_aprovar_comissoes()
RETURNS TABLE(contador_id UUID, total_aprovadas NUMERIC, comissoes_afetadas INT)
LANGUAGE plpgsql
AS $$
BEGIN
  -- Auto-approve commissions older than 24h
  UPDATE comissoes
  SET status_comissao = 'aprovada',
      auto_aprovada_em = now()
  WHERE status_comissao = 'calculada'
    AND created_at < (now() - INTERVAL '1 day')
    AND auto_aprovada_em IS NULL;

  -- Return summary
  RETURN QUERY
  SELECT contador_id,
         SUM(valor),
         COUNT(*)
  FROM comissoes
  WHERE auto_aprovada_em > (now() - INTERVAL '1 minute');
END;
$$;
```

### Schedule (CRON)

**Option 1: Supabase CRON**
```sql
SELECT cron.schedule(
  'auto_approve_commissions_daily',
  '0 3 * * *',  -- 3 AM every day
  $$SELECT auto_aprovar_comissoes();$$
);
```

**Option 2: GitHub Actions**
```yaml
name: Daily Auto-Approve Commissions
on:
  schedule:
    - cron: '0 3 * * *'  # 3 AM UTC

jobs:
  auto-approve:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger auto-approval
        run: |
          curl -X POST ${SUPABASE_URL}/functions/v1/cron-auto-approve \
            -H "Authorization: Bearer ${SERVICE_KEY}"
```

---

## 💳 Payout Process (Day 25)

### CRON Job Runs

```javascript
// pseudocode
async function processarPagamentosComissoes() {
  // 1. Get all approved commissions
  const comissoes = await db.query(`
    SELECT contador_id, SUM(valor) as total
    FROM comissoes
    WHERE status_comissao = 'aprovada'
      AND competencia <= '2025-11-25'
    GROUP BY contador_id
    HAVING SUM(valor) >= 100
  `);

  // 2. For each contador
  for (const comissao of comissoes) {
    // 3. Validate payment method (PIX or bank account)
    const contador = await db.query(
      `SELECT chave_pix, banco FROM contadores WHERE id = ?`,
      [comissao.contador_id]
    );

    if (!contador.chave_pix && !contador.banco) {
      console.log(`Skip: ${comissao.contador_id} - No payment method`);
      continue;
    }

    // 4. Create Asaas transfer
    const transfer = await asaas.createTransfer({
      accountId: contador.asaas_customer_id,
      amount: comissao.total,
      method: contador.chave_pix ? 'PIX' : 'BANK_ACCOUNT',
    });

    // 5. Mark as paid
    await db.update('comissoes', {
      status_comissao: 'paga',
      data_pagamento: new Date(),
      asaas_transfer_id: transfer.id,
    });
  }
}
```

---

## 🔍 Validação e Auditoria

### Audit Trail

```sql
-- Ver todas as comissões de um contador
SELECT
  created_at,
  tipo_comissao,
  valor,
  status_comissao,
  pagamento_id,
  competencia
FROM comissoes
WHERE contador_id = 'uuid-here'
ORDER BY created_at DESC;

-- Ver comissões por status
SELECT
  status_comissao,
  COUNT(*) as qtd,
  SUM(valor) as total
FROM comissoes
GROUP BY status_comissao;

-- Ver rejeições
SELECT
  contador_id,
  tipo_comissao,
  valor,
  motivo_rejeicao
FROM comissoes
WHERE status_comissao = 'rejeitada'
ORDER BY created_at DESC;
```

### Idempotency Check

```sql
-- Garantir que não processamos 2x o mesmo pagamento
SELECT
  asaas_payment_id,
  COUNT(*) as ocorrencias
FROM comissoes
WHERE asaas_payment_id IS NOT NULL
GROUP BY asaas_payment_id
HAVING COUNT(*) > 1;

-- Esperado: 0 linhas (nenhuma duplicata)
```

---

## 📊 SQL Queries para Monitoring

### Performance

```sql
-- Comissões por contador (ranking)
SELECT
  c.name as contador,
  COUNT(com.id) as total_commissions,
  SUM(com.valor) as total_value,
  SUM(CASE WHEN com.status_comissao = 'paga' THEN com.valor ELSE 0 END) as paid,
  SUM(CASE WHEN com.status_comissao = 'calculada' THEN com.valor ELSE 0 END) as pending
FROM contadores c
LEFT JOIN comissoes com ON com.contador_id = c.id
GROUP BY c.id, c.name
ORDER BY total_value DESC;
```

### Problemas

```sql
-- Comissões "presas" (oldest waiting approval)
SELECT
  contador_id,
  tipo_comissao,
  valor,
  created_at,
  status_comissao
FROM comissoes
WHERE status_comissao = 'calculada'
  AND created_at < now() - INTERVAL '30 days'
ORDER BY created_at ASC;

-- Contadores sem dados bancários (impossível pagar)
SELECT
  c.id,
  c.nome,
  COUNT(com.id) as comissoes_pendentes,
  SUM(com.valor) as valor_total
FROM contadores c
LEFT JOIN comissoes com ON com.contador_id = c.id
WHERE c.chave_pix IS NULL
  AND c.banco IS NULL
  AND com.status_comissao IN ('aprovada', 'calculada')
GROUP BY c.id, c.nome
HAVING COUNT(com.id) > 0;
```

---

## 🧪 Testing Commissions Locally

### 1. Create Test Data

```sql
-- Insert test contador
INSERT INTO contadores (id, user_id, nome, email, nivel, status, clientes_ativos, xp)
VALUES (
  gen_random_uuid(),
  'test-user-id',
  'Contador Teste',
  'teste@contadores.com',
  'PRATA',  -- 17% commission
  'ativo',
  12,
  0
);

-- Insert test cliente
INSERT INTO clientes (
  id,
  contador_id,
  nome,
  email,
  asaas_customer_id,
  status
) VALUES (
  gen_random_uuid(),
  'contador-id-acima',
  'Empresa Teste',
  'empresa@teste.com',
  'cust_sandbox_123',
  'ativo'
);

-- Insert test pagamento
INSERT INTO pagamentos (
  id,
  cliente_id,
  contador_id,
  valor_bruto,
  valor_liquido,
  asaas_payment_id,
  status_pagamento,
  competencia
) VALUES (
  gen_random_uuid(),
  'cliente-id-acima',
  'contador-id-acima',
  500.00,
  480.00,
  'pay_test_123',
  'CONFIRMADO',
  '2025-11-14'
);
```

### 2. Manually Calculate Commissions

```javascript
// In browser console
const valorLiquido = 480;
const taxaComissao = 0.17;  // PRATA
const comissaoRecorrente = valorLiquido * taxaComissao;
console.log(`Expected commission: R$ ${comissaoRecorrente.toFixed(2)}`);
// Expected commission: R$ 81.60
```

### 3. Verify in Database

```sql
SELECT *
FROM comissoes
WHERE asaas_payment_id = 'pay_test_123'
ORDER BY created_at DESC;

-- Should show commission with valor = 81.60
```

---

## 🚨 Error Cases

### Case 1: Webhook Secret Wrong

```
Symptom: "Invalid webhook signature"
Solution:
  1. Check Asaas Dashboard → Integrações → Webhooks
  2. Copy ASAAS_WEBHOOK_SECRET
  3. Update in supabase: supabase secrets set ASAAS_WEBHOOK_SECRET "..."
```

### Case 2: Customer Not Found

```
Symptom: "Cliente não encontrado" in webhook_logs
Solution:
  1. Verify asaas_customer_id is saved in clientes table
  2. Check that webhook has correct customer ID
  3. Manually add if missing: UPDATE clientes SET asaas_customer_id = '...' WHERE id = '...'
```

### Case 3: Duplicate Payment

```
Symptom: Same payment creates 2 commissions
Solution:
  1. This shouldn't happen (unique constraint on asaas_payment_id)
  2. If it does, check index:
     SELECT * FROM pg_indexes WHERE indexname = 'idx_pagamentos_asaas_payment_id';
  3. Manually delete duplicate commission (keep one)
```

### Case 4: Commission Not Approved After 24h

```
Symptom: Comissão com status 'calculada' depois de 24h
Solution:
  1. Check if CRON job is running: SELECT * FROM cron.job;
  2. Check logs: SELECT * FROM cron.job_run_details ORDER BY start_time DESC;
  3. Manually approve: UPDATE comissoes SET status_comissao = 'aprovada' WHERE id = '...';
```

---

## ✅ Checklist para Produção

- [ ] ASAAS_API_KEY configurada
- [ ] ASAAS_WEBHOOK_SECRET configurada e igual em Asaas
- [ ] Webhook URL apontando para prod: `https://seu-domain/functions/v1/webhook-asaas`
- [ ] CRON job configurado para rodar dia 25
- [ ] Auto-aprovação CRON rodando 1x/dia
- [ ] Todos os contadores têm PIX ou dados bancários salvos
- [ ] Testes de comissão passaram em staging
- [ ] Comissões testadas com valores reais
- [ ] Pagamentos testados no Asaas sandbox
- [ ] Webhook logs monitorados

---

**Documento Final**: 🟢 PRODUCTION READY
