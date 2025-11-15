# 🛠️ GUIA PRÁTICO: Corrigindo o Webhook ASAAS

**Este é o guia passo-a-passo para IMPLEMENTAR as correções**

---

## PASSO 1: Entender o Estado Atual

### 1.1 Ler arquivo de diagnóstico

```bash
cat ANALISE_COMPLETA_WEBHOOK_ASAAS_DIAGNOSTICO.md
```

### 1.2 Ver logs de erro

```bash
# Conectar ao Supabase
supabase start

# Verificar audit logs
psql "postgresql://postgres:postgres@localhost:54321/postgres" -c "
  SELECT
    acao,
    payload->>'error' as error,
    created_at
  FROM audit_logs
  WHERE acao LIKE '%WEBHOOK%'
  ORDER BY created_at DESC
  LIMIT 10;
"
```

---

## PASSO 2: Preparar Ambiente

### 2.1 Clonar webhook atual

```bash
cp lovable-Celite/supabase/functions/webhook-asaas/index.ts \
   lovable-Celite/supabase/functions/webhook-asaas/index.ts.backup

echo "✅ Backup criado: index.ts.backup"
```

### 2.2 Ter Node.js crypto disponível

```bash
# Verificar se está disponível
node -e "const crypto = require('crypto'); console.log('✅ crypto disponível')"
```

---

## PASSO 3: Correção 1 - Validação de Assinatura (CRÍTICO)

**Arquivo**: `lovable-Celite/supabase/functions/webhook-asaas/index.ts`

### 3.1 Importar Node.js crypto

**Linha 1-2, ADICIONAR:**

```typescript
import { createHash } from "https://deno.land/std@0.208.0/node/crypto.ts";
```

### 3.2 Reescrever função validateAsaasSignature

**Linhas 9-68, SUBSTITUIR POR:**

```typescript
async function validateAsaasSignature(
  payload: string,
  signature: string | null,
  secret: string | null,
  headers: Headers
): Promise<boolean> {
  // Log all relevant headers for debugging
  console.log('[WEBHOOK DEBUG] ═══════════════════════════════════════');
  console.log('[WEBHOOK DEBUG] Received webhook - analyzing...');
  console.log(`[WEBHOOK DEBUG] Payload size: ${payload.length} bytes`);
  console.log(`[WEBHOOK DEBUG] Signature provided: ${signature ? 'YES' : 'NO'}`);
  console.log(`[WEBHOOK DEBUG] Secret configured: ${secret ? 'YES' : 'NO'}`);

  // Log all headers that might contain signature
  console.log('[WEBHOOK DEBUG] Headers with "signature", "token", or "asaas":');
  for (const [key, value] of headers.entries()) {
    if (
      key.toLowerCase().includes('signature') ||
      key.toLowerCase().includes('token') ||
      key.toLowerCase().includes('asaas')
    ) {
      console.log(`   ${key}: ${value.substring(0, 30)}...`);
    }
  }

  // ✅ REJEITA se secret não está configurado
  if (!secret) {
    console.error('🔒 ERRO CRÍTICO: ASAAS_WEBHOOK_SECRET não configurado!');
    console.error('   Configure em Supabase > Settings > Secrets > ASAAS_WEBHOOK_SECRET');
    console.log('[WEBHOOK DEBUG] ═══════════════════════════════════════\n');
    return false; // ← REJEITA!
  }

  // ✅ REJEITA se signature não veio no header
  if (!signature) {
    console.error('🔒 ERRO CRÍTICO: Signature não encontrada no header!');
    console.error('   Headers esperados: x-asaas-webhook-signature');
    console.error('   Headers recebidos:', Array.from(headers.keys()).join(', '));
    console.log('[WEBHOOK DEBUG] ═══════════════════════════════════════\n');
    return false; // ← REJEITA!
  }

  // ✅ VALIDA MD5
  try {
    // Usar Node.js crypto (via Deno polyfill)
    const hash = createHash('md5');
    hash.update(payload + secret);
    const expectedSignature = hash.digest('hex');

    console.log(`[SIGNATURE DEBUG]`);
    console.log(`  Received: ${signature}`);
    console.log(`  Expected: ${expectedSignature}`);
    const isMatch = expectedSignature === signature.toLowerCase();
    console.log(`  Match: ${isMatch ? 'YES ✅' : 'NO ❌'}`);

    if (!isMatch) {
      console.error('🔒 ERRO: Assinatura INVÁLIDA!');
      console.error(`   Esperada: ${expectedSignature}`);
      console.error(`   Recebida: ${signature.toLowerCase()}`);
    }

    console.log('[WEBHOOK DEBUG] ═══════════════════════════════════════\n');
    return isMatch;

  } catch (error) {
    console.error('[WEBHOOK ERROR] Erro ao calcular MD5:', error);
    console.log('[WEBHOOK DEBUG] ═══════════════════════════════════════\n');
    return false; // ← REJEITA se houver erro!
  }
}
```

### 3.3 Habilitar rejeição no main handler

**Linhas 143-151, SUBSTITUIR POR:**

```typescript
if (!isValidSignature) {
  console.error('❌ Webhook signature validation FAILED');
  return new Response(
    JSON.stringify({ error: 'Webhook signature inválida' }),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 401,
    }
  );
}
```

---

## PASSO 4: Correção 2 - Tratamento de netValue (CRÍTICO)

**Arquivo**: `lovable-Celite/supabase/functions/webhook-asaas/index.ts`

**Linhas 200-207, SUBSTITUIR POR:**

```typescript
// Se Asaas não envia netValue, usar value como fallback
const netValue =
  payment.netValue !== null && payment.netValue !== undefined
    ? payment.netValue
    : payment.value; // ✅ Fallback

const valoresValidados = {
  valor_bruto: validarValorMonetario(payment.value, 'valor_bruto'),
  valor_liquido: validarValorMonetario(netValue, 'valor_liquido'),
};
```

---

## PASSO 5: Correção 3 - Adicionar Logging Detalhado (CRÍTICO)

**Arquivo**: `lovable-Celite/supabase/functions/webhook-asaas/index.ts`

**ANTES de linha 179 (validação de campos), ADICIONAR:**

```typescript
console.log('[PAYLOAD STRUCTURE ANALYSIS] ═══════════════════════════');
console.log('Payload received:');
console.log(JSON.stringify(payload, null, 2));
console.log('[PAYLOAD STRUCTURE ANALYSIS] ═══════════════════════════\n');

if (payment) {
  console.log('[PAYMENT ANALYSIS]');
  console.log('  event:', payload.event);
  console.log('  payment.id:', payment.id);
  console.log('  payment.customer:', payment.customer);
  console.log('  payment.value:', payment.value);
  console.log('  payment.netValue:', payment.netValue);
  console.log('  payment.dateCreated:', payment.dateCreated);
  console.log('  payment.confirmedDate:', payment.confirmedDate);
  console.log('  payment.status:', payment.status);
  console.log('  payment.billingType:', payment.billingType);
  console.log('  Available fields:', Object.keys(payment).join(', '));
  console.log('[PAYMENT ANALYSIS] ═══════════════════════════\n');
}
```

**ANTES de linha 192 (validação de estrutura), SUBSTITUIR POR:**

```typescript
console.log('[VALIDATION] Checking required fields...');
const missingFields = [];
if (!payment) missingFields.push('payment object');
if (payment && !payment.id) missingFields.push('payment.id');
if (payment && !payment.customer) missingFields.push('payment.customer');

if (missingFields.length > 0) {
  const errMsg = `Payload incompleto: faltam ${missingFields.join(', ')}`;
  console.error('[VALIDATION ERROR]', errMsg);
  throw new Error(errMsg);
}
console.log('[VALIDATION] ✅ Required fields OK\n');
```

**ANTES de linha 200 (validação de valores), SUBSTITUIR POR:**

```typescript
console.log('[VALUE VALIDATION]');
try {
  console.log(`  Validating valor_bruto: ${payment.value}`);
  const valor_bruto = validarValorMonetario(payment.value, 'valor_bruto');
  console.log(`  ✅ valor_bruto validated: ${valor_bruto}`);
} catch (e) {
  const err = e instanceof Error ? e.message : String(e);
  console.error(`  ❌ valor_bruto validation FAILED: ${err}`);
  throw e;
}

try {
  console.log(`  Validating valor_liquido: ${netValue}`);
  const valor_liquido = validarValorMonetario(netValue, 'valor_liquido');
  console.log(`  ✅ valor_liquido validated: ${valor_liquido}`);
} catch (e) {
  const err = e instanceof Error ? e.message : String(e);
  console.error(`  ❌ valor_liquido validation FAILED: ${err}`);
  throw e;
}

console.log('[VALUE VALIDATION] ═══════════════════════════\n');
```

**ANTES de linha 211 (lookup cliente), ADICIONAR:**

```typescript
console.log('[CLIENT LOOKUP] Searching for client...');
console.log(`  Query: asaas_customer_id = "${payment.customer}"`);
```

**DEPOIS de buscar cliente (linha 227), ADICIONAR:**

```typescript
if (cliente) {
  console.log('[CLIENT LOOKUP] ✅ Found:');
  console.log(`  ID: ${cliente.id.substring(0, 13)}...`);
  console.log(`  Contador ID: ${cliente.contador_id}`);
  console.log(`  Data Ativação: ${cliente.data_ativacao}`);
} else {
  console.error('[CLIENT LOOKUP] ❌ Client NOT FOUND!');
  console.error(`  asaas_customer_id "${payment.customer}" does not exist in BD`);
}
console.log('[CLIENT LOOKUP] ═══════════════════════════\n');
```

---

## PASSO 6: Correção 4 - Melhorar Tratamento de Erros (IMPORTANTE)

**Arquivo**: `lovable-Celite/supabase/functions/webhook-asaas/index.ts`

**Linhas 361-394, SUBSTITUIR POR:**

```typescript
catch (error) {
  const errorMessage =
    error instanceof Error ? error.message : JSON.stringify(error);
  const errorStack = error instanceof Error ? error.stack : '';

  console.error('═══════════════════════════════════════════════════════');
  console.error('❌ ERRO NO WEBHOOK ASAAS');
  console.error('═══════════════════════════════════════════════════════');
  console.error('Mensagem:', errorMessage);
  console.error('Stack Trace:', errorStack);
  console.error('Error Type:', typeof error);
  console.error('Full Error:', JSON.stringify(error, null, 2));
  console.error('═══════════════════════════════════════════════════════\n');

  try {
    await supabase.from('audit_logs').insert({
      acao: 'WEBHOOK_ASAAS_ERROR',
      tabela: 'pagamentos',
      payload: {
        error: errorMessage,
        stack: errorStack.substring(0, 1000),
        event: (error as { event?: string })?.event || 'unknown',
        timestamp: new Date().toISOString(),
        errorType: typeof error,
        fullError: JSON.stringify(error),
      },
    });
  } catch (logErr) {
    console.error('Erro ao registrar erro no audit log:', logErr);
  }

  return new Response(JSON.stringify({ error: errorMessage }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status: 500,
  });
}
```

---

## PASSO 7: Correção 5 - Status de Comissão (IMPORTANTE)

**Arquivo**: `lovable-Celite/supabase/functions/calcular-comissoes/index.ts`

### 7.1 Opção A: Auto-aprovação (RECOMENDADO)

**Linhas 119, 136, SUBSTITUIR:**

```typescript
// Antes:
status: "calculada",

// Depois:
status: "aprovada",  // ✅ Auto-aprovado, CRON consegue processar
```

**Fazer em 4 lugares**:
1. Linha 119 (comissão direta - ativação)
2. Linha 136 (comissão recorrente)
3. Linha 180 (override)
4. (Bônus: já está "pendente", manter assim - o CRON atualiza depois)

### 7.2 Opção B: Aprovação Manual (mais seguro)

Manter status = "calculada", criar interface no admin para aprovação manual.

---

## PASSO 8: Verificar Importações

**Arquivo**: `lovable-Celite/supabase/functions/webhook-asaas/index.ts`

**Linha 1-2, Verificar:**

```typescript
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.47.10';
import { createHash } from 'https://deno.land/std@0.208.0/node/crypto.ts';  // ← ADICIONAR

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
```

---

## PASSO 9: Deploy Local para Testar

### 9.1 Iniciar Supabase local

```bash
cd lovable-Celite
supabase start
```

### 9.2 Verificar secret configurado

```bash
supabase secrets list

# Se não tiver ASAAS_WEBHOOK_SECRET, adicionar:
supabase secrets set ASAAS_WEBHOOK_SECRET "test-secret-for-webhook"
```

### 9.3 Deploy da função

```bash
supabase functions deploy webhook-asaas
```

### 9.4 Ver logs

```bash
supabase functions logs webhook-asaas --tail
```

### 9.5 Testar webhook

```bash
# Em outro terminal
node test-webhook-manual-trigger.mjs

# Ou usar curl
curl -X POST http://localhost:54321/functions/v1/webhook-asaas \
  -H "Content-Type: application/json" \
  -H "x-asaas-webhook-signature: test-signature" \
  -d '{
    "event": "PAYMENT_RECEIVED",
    "payment": {
      "id": "pay_test_123",
      "customer": "cus_test_456",
      "value": 100,
      "netValue": 85,
      "dateCreated": "2025-11-14T10:00:00Z",
      "confirmedDate": "2025-11-14T10:05:00Z",
      "status": "RECEIVED",
      "billingType": "PIX"
    }
  }'
```

---

## PASSO 10: Verificar Logs

### 10.1 Logs da função

```bash
supabase functions logs webhook-asaas

# Procura por:
# - [WEBHOOK DEBUG]
# - [SIGNATURE DEBUG]
# - [PAYMENT ANALYSIS]
# - [VALUE VALIDATION]
# - [CLIENT LOOKUP]
# - [VALIDATION ERROR] (se houver)
```

### 10.2 Logs do BD

```bash
psql "postgresql://postgres:postgres@localhost:54321/postgres" << EOF

SELECT
  id,
  acao,
  payload->>'event' as event,
  payload->>'error' as error,
  created_at
FROM audit_logs
WHERE acao LIKE 'WEBHOOK%'
ORDER BY created_at DESC
LIMIT 10;

EOF
```

---

## PASSO 11: Teste End-to-End

### 11.1 Criar contador de teste

```bash
node test-baby-step-1a-create-users.mjs
```

### 11.2 Criar cliente no Asaas

```bash
node test-baby-step-2-create-customer-asaas.mjs
```

### 11.3 Criar pagamento

```bash
node test-baby-step-3-create-payment.mjs
```

### 11.4 Simular pagamento (dispara webhook)

```bash
node simulate-payment.mjs
```

### 11.5 Verificar comissões

```bash
node test-baby-step-4-check-commissions.mjs
```

**Resultado esperado**:
- ✅ Pagamento inserido em `pagamentos` (status = 'pago')
- ✅ Comissões inseridas em `comissoes` (status = 'aprovada')
- ✅ Bônus inseridos em `bonus_historico`
- ✅ Audit logs mostram sucesso

---

## PASSO 12: Deploy em Produção

### 12.1 Verificar ambiente

```bash
# Confirmar secret configurado em produção
supabase secrets list --project-ref zytxwdgzjqrcmbnpgofj

# Se faltando:
supabase secrets set ASAAS_WEBHOOK_SECRET "seu_secret_real_aqui" \
  --project-ref zytxwdgzjqrcmbnpgofj
```

### 12.2 Deploy

```bash
supabase functions deploy webhook-asaas --project-ref zytxwdgzjqrcmbnpgofj
```

### 12.3 Verificar em produção

```bash
supabase functions logs webhook-asaas --project-ref zytxwdgzjqrcmbnpgofj --tail
```

---

## PASSO 13: Configurar Webhook em ASAAS

### 13.1 Acessar Asaas Dashboard

URL: https://app.asaas.com (sandbox: https://sandbox.asaas.com)

### 13.2 Navegar para Webhooks

Menu > Integrações > Webhooks

### 13.3 Criar Novo Webhook

**Dados**:
- **Nome**: "Contadores de Elite - Webhooks"
- **URL**: `https://zytxwdgzjqrcmbnpgofj.supabase.co/functions/v1/webhook-asaas`
- **Versão da API**: v3
- **Token de Autenticação**: (deixar em branco ou configurar em header)
- **Email para Erros**: seu_email@example.com
- **Tipo de Envio**: SEQUENTIALLY
- **Ativo**: SIM

### 13.4 Selecionar Eventos

Habilitar:
- [ ] PAYMENT_CONFIRMED
- [ ] PAYMENT_RECEIVED
- [ ] PAYMENT_RECEIVED_IN_CASH
- [ ] SUBSCRIPTION_CREATED
- [ ] PAYMENT_AWAITING_RISK_ANALYSIS

### 13.5 Salvar

---

## PASSO 14: Testar em Produção

### 14.1 Simular pagamento em Asaas Sandbox

```bash
node simulate-payment-fixed.mjs
```

### 14.2 Verificar logs

```bash
supabase functions logs webhook-asaas --project-ref zytxwdgzjqrcmbnpgofj --tail

# Esperar por:
# - [WEBHOOK DEBUG] Received webhook
# - [SIGNATURE DEBUG] Match: YES
# - [PAYMENT ANALYSIS] All fields OK
# - [CLIENT LOOKUP] Found
# - ✅ Webhook Asaas recebido
# - Pagamento registrado
# - Comissoes calculadas com sucesso
```

### 14.3 Verificar BD

```bash
supabase db execute --project-ref zytxwdgzjqrcmbnpgofj << EOF

-- Ver último pagamento
SELECT * FROM pagamentos ORDER BY created_at DESC LIMIT 1;

-- Ver comissões associadas
SELECT * FROM comissoes ORDER BY created_at DESC LIMIT 10;

-- Ver audit logs
SELECT acao, created_at FROM audit_logs
WHERE acao LIKE 'WEBHOOK%'
ORDER BY created_at DESC LIMIT 10;

EOF
```

---

## TROUBLESHOOTING

### Problema: "Signature INVÁLIDA"

**Causa 1**: Secret está errado

```bash
# Confirmar secret
supabase secrets list

# Atualizar se necessário
supabase secrets set ASAAS_WEBHOOK_SECRET "novo_secret"
```

**Causa 2**: Asaas envia signature diferente

```bash
# Verificar logs para ver signature que Asaas enviou
supabase functions logs webhook-asaas --tail

# Procurar por: [SIGNATURE DEBUG] Received: ...
# Se não aparecer, header não veio

# Contatar suporte Asaas: qual é o header exato?
```

---

### Problema: "Cliente não encontrado"

**Causa**: Cliente não foi criado em Asaas antes do webhook

**Solução**:
```bash
# 1. Verificar se cliente existe
supabase db execute << EOF
SELECT * FROM clientes WHERE asaas_customer_id = 'cus_123';
EOF

# 2. Se não existir, criar manualmente
# Ou re-executar test-baby-step-2-create-customer-asaas.mjs
```

---

### Problema: "netValue inválido"

**Causa**: Asaas envia netValue = null

**Solução**: Usar fallback (já implementado em Correção 2)

```bash
# Verificar se está funcionando
supabase functions logs webhook-asaas --tail
# Procurar por: Fallback para valor bruto
```

---

### Problema: "Erro desconhecido" (genérico)

**Solução**: Ativar logging detalhado (Correção 3)

```bash
# Agora vê erro específico em logs
supabase functions logs webhook-asaas --tail

# Procurar por: [VALIDATION ERROR] ou [PAYMENT ANALYSIS]
```

---

## CHECKLIST FINAL

- [ ] Validação de assinatura implementada (Passo 3)
- [ ] netValue tratado (Passo 4)
- [ ] Logging detalhado adicionado (Passo 5)
- [ ] Tratamento de erros melhorado (Passo 6)
- [ ] Status de comissão resolvido (Passo 7)
- [ ] Importações verificadas (Passo 8)
- [ ] Testado localmente (Passo 9-10)
- [ ] Teste E2E passou (Passo 11)
- [ ] Deployado em produção (Passo 12)
- [ ] Webhook configurado em Asaas (Passo 13)
- [ ] Testado em produção (Passo 14)

---

**Quando TUDO estiver verde**: ✅ Webhook 100% funcional!

**Próxima ação**: Começar pelo Passo 1.
