# 📋 ANÁLISE COMPLETA: Webhook ASAAS - Diagnóstico e Solução Definitiva

**Data**: 14 de Novembro, 2025
**Status**: 🔴 CRÍTICO - Webhook não processando pagamentos
**Objetivo**: Resolver a integração ASAAS De Uma Vez Por Todas

---

## PARTE 1: VISÃO 360° DA ASAAS

### 1.1 O Que É a ASAAS?

**ASAAS** é uma plataforma de pagamentos brasileira (regulada pelo Banco Central) que:
- Processa pagamentos via PIX, Boleto, Cartão de Crédito, Transferência Bancária
- Fornece API REST para automação (criar clientes, cobrânças, assinaturas)
- **Envia webhooks** para notificar seu sistema quando pagamentos são confirmados

**Dados Críticos da ASAAS**:
- **URL da API**: `https://sandbox.asaas.com/api/v3` (sandbox) ou `https://api.asaas.com/v3` (produção)
- **Autenticação**: Header `access_token: <SUA_API_KEY>`
- **Webhook Callback**: Seu servidor recebe POST em URL configurada
- **Segurança**: Webhook assinado com `MD5(payload + secret)`

---

### 1.2 Fluxo Completo: Do Pagamento ao Saque

```
┌─────────────────────────────────────────────────────────────────────┐
│                        FLUXO ASAAS COMPLETO                         │
└─────────────────────────────────────────────────────────────────────┘

PASSO 1: Cliente é cadastrado
└─ Frontend → API Asaas: POST /v3/customers
   Input: { name, email, cpfCnpj, phone }
   Output: { id: "cus_123456", name, email, cpfCnpj }
   └─ Salvo em BD: clientes.asaas_customer_id = "cus_123456"

PASSO 2: Assinatura/Cobrança é criada
└─ Frontend → API Asaas: POST /v3/subscriptions ou /v3/payments
   Input: { customerId, billingType, value, dueDate, description }
   Output: { id: "pay_789012", customerId, value, status: "PENDING" }
   └─ Salvo em BD: pagamentos.asaas_payment_id = "pay_789012"

PASSO 3: Cliente paga (simulator no sandbox / real no prod)
└─ Asaas registra pagamento internamente
   └─ Status muda: PENDING → CONFIRMED → RECEIVED

PASSO 4: 🚨 WEBHOOK É DISPARADO 🚨 ← AQUI VOCÊ ENTRA
└─ Asaas envia HTTP POST para: https://your-domain.com/functions/v1/webhook-asaas
   Headers: { 'x-asaas-webhook-signature': '<MD5_SIGNATURE>' }
   Payload:
   {
     "event": "PAYMENT_RECEIVED",
     "payment": {
       "id": "pay_789012",
       "customer": "cus_123456",
       "value": 299.90,
       "netValue": 254.915,  ← ⚠️ Descontadas as taxas da ASAAS
       "dateCreated": "2025-11-14T10:30:00Z",
       "confirmedDate": "2025-11-14T10:35:00Z",
       "status": "RECEIVED",
       "billingType": "PIX"
     }
   }

PASSO 5: Seu webhook processa
└─ webhook-asaas/index.ts:
   1. Valida assinatura MD5
   2. Extrai dados do payment
   3. Busca cliente no BD
   4. Insere em pagamentos (idempotente)
   5. Chama calcular-comissoes
   6. Calcula override, bônus, etc
   7. RPC executa atomicamente (tudo ou nada)

PASSO 6: Comissões são calculadas
└─ Status: comissoes.status = 'calculada'
   └─ Admin aprova (manual, status = 'aprovada')

PASSO 7: CRON dia 25 processa pagamento
└─ Se total >= R$100: status = 'paga'
   └─ Contador recebe saque

PASSO 8: Contador recebe dinheiro
└─ Transferência de saque para conta bancária
```

---

### 1.3 Endpoints ASAAS Usados no Projeto

| Função | Endpoint | Método | Retorna | Usado em |
|--------|----------|--------|---------|----------|
| **Criar Cliente** | `/v3/customers` | POST | `{ id, name, email, cpfCnpj }` | asaas-client function |
| **Criar Assinatura** | `/v3/subscriptions` | POST | `{ id, customerId, value, status }` | asaas-client function |
| **Criar Pagamento** | `/v3/payments` | POST | `{ id, customerId, value, status }` | asaas-client function |
| **Consultar Pagamento** | `/v3/payments/{id}` | GET | `{ id, status, value, dueDate }` | Scripts teste |
| **Simular Pagamento** | `/v3/payments/{id}/receiveInCash` | POST | `{ id, status: "RECEIVED" }` | Scripts teste |
| **Listar Pagamentos** | `/v3/payments?customerId=X` | GET | `{ data: [...], total }` | asaas-client function |

**Autenticação**: Todos usam header `access_token: <API_KEY>`

---

## PARTE 2: ANÁLISE CRÍTICA DO CÓDIGO

### 2.1 WEBHOOK FUNCTION - Fluxo Implementado

**Arquivo**: `/lovable-Celite/supabase/functions/webhook-asaas/index.ts`

#### Fluxo Atual:

```
1. RECEBIMENTO (linha 110)
   └─ Verifica se é OPTIONS (CORS preflight)
   └─ Lê payload bruto como string
   └─ Parse JSON

2. VALIDAÇÃO DE ASSINATURA (linha 135-151) ⚠️ PROBLEMA 1
   └─ Extrai signature de: x-asaas-webhook-signature OU asaas-access-token OU x-asaas-signature
   └─ Chama validateAsaasSignature()
   │  ├─ Se secret = null: ✅ PERMITE (testing mode)
   │  ├─ Se signature = null: ✅ PERMITE (testing mode)
   │  ├─ Se erro MD5: ✅ PERMITE (testing mode, linha 66)
   │  └─ ❌ NUNCA rejeita! (sempre retorna true ou tenta validar)

3. ANÁLISE DO EVENTO (linha 155-177) ⚠️ PROBLEMA 2
   └─ Define eventosRelevantes = ['PAYMENT_CONFIRMED', 'PAYMENT_RECEIVED', ...]
   └─ Se payload.event NÃO está nesta lista:
      └─ Ignora APENAS se não tem payment
      └─ ⚠️ Se tem payment, CONTINUA PROCESSANDO!

4. VALIDAÇÃO DE ESTRUTURA (linha 192-198)
   └─ Checa: payment.id && payment.customer
   └─ Se faltar: retorna 404

5. VALIDAÇÃO DE VALORES (linha 200-207) ⚠️ PROBLEMA 3
   └─ validarValorMonetario(payment.value) - OK
   └─ validarValorMonetario(payment.netValue) - ⚠️ SE netValue = null, FALHA!
   └─ Checa: valor_liquido <= valor_bruto

6. LOOKUP DO CLIENTE (linha 211-227) ⚠️ PROBLEMA 4
   └─ SELECT clientes WHERE asaas_customer_id = payment.customer
   └─ Se não acha: retorna 404
   └─ ⚠️ SE cliente não foi criado, webhook FALHA!

7. IDEMPOTÊNCIA (linha 233-253)
   └─ SELECT pagamentos WHERE asaas_payment_id = payment.id
   └─ Se já existe: retorna 200 (sucesso idempotente)
   └─ ✅ OK - previne duplicação

8. INSERÇÃO DO PAGAMENTO (linha 265-284)
   └─ INSERT INTO pagamentos com status = 'pago'
   └─ Se erro BD: retorna 500

9. CHAMA CALCULAR-COMISSÕES (linha 290-328) ⚠️ PROBLEMA 5
   └─ supabase.functions.invoke('calcular-comissoes', {...})
   └─ Se erro: registra em audit_logs e retorna 500
   └─ ⚠️ Se calcular-comissões falhar, pagamento já foi inserido!

10. AUDIT LOG (linha 331-348)
    └─ Registra sucesso em audit_logs
    └─ Retorna 200 + {success: true, pagamento_id}

11. CATCH GLOBAL (linha 361-394) ⚠️ PROBLEMA 6
    └─ Se qualquer erro: registra em audit_logs
    └─ Retorna 500 com errorMessage
    └─ ⚠️ Mensagens genéricas, falta contexto!
```

---

### 2.2 Problemas Críticos Identificados

#### 🔴 CRÍTICO 1: Assinatura Nunca é Validada

**Arquivo**: `webhook-asaas/index.ts`, linhas 9-68

```typescript
async function validateAsaasSignature(...): Promise<boolean> {
  if (!secret) {
    console.warn('⚠️ ASAAS_WEBHOOK_SECRET not configured');
    return true;  // ← SEMPRE PERMITE!
  }

  if (!signature) {
    console.warn('⚠️ No signature in header');
    return true;  // ← SEMPRE PERMITE!
  }

  try {
    // Calcula MD5
    const expectedSignature = ...MD5 hash...;
    return expectedSignature === signature.toLowerCase();
  } catch (error) {
    return true;  // ← SEMPRE PERMITE mesmo se falhar!
  }
}

// Depois, linha 143-151:
if (!isValidSignature) {
  console.error('❌ Webhook signature validation FAILED');
  // return new Response(...401...); ← DESCOMENTADO!
  // For now, don't reject - just log the failure
}
// ✅ PERMITE mesmo com signature inválida!
```

**Risco Crítico**: Qualquer um pode enviar webhooks fake!

**Impacto**:
- Comissões calculadas por pessoas não autorizadas
- Pagamentos fictícios inseridos no BD
- Possível fraude no sistema

---

#### 🔴 CRÍTICO 2: Campo `netValue` Pode Ser Null

**Arquivo**: `webhook-asaas/index.ts`, linha 202

```typescript
valor_liquido: validarValorMonetario(payment.netValue, 'valor_liquido'),
```

**Problema**:
- Se ASAAS envia `netValue: null` OU `netValue: undefined`
- Função `validarValorMonetario()` vai falhar (linha 85-92)
- Erro é lançado genericamente: "Erro desconhecido"
- Webhook retorna 500 sem contexto

**Verificar**: Qual é o valor padrão se ASAAS não envia netValue?

---

#### 🔴 CRÍTICO 3: Evento "unknown" Não é Tratado

**Arquivo**: `webhook-asaas/index.ts`, linhas 155-177

```typescript
const eventosRelevantes = [
  'PAYMENT_CONFIRMED',
  'PAYMENT_RECEIVED',
  'PAYMENT_RECEIVED_IN_CASH',
  'SUBSCRIPTION_CREATED',
  'PAYMENT_AWAITING_RISK_ANALYSIS',
];

const evento = payload.event || 'PAYMENT_CONFIRMED';  // ← Assume CONFIRMED se vazio

if (!eventosRelevantes.includes(evento) && payload.event) {
  console.log('⚠️ Evento não reconhecido:', payload.event);
  if (!payload.payment) {
    return new Response(...200...);  // Ignora
  }
  console.log('   Mas tem dados de pagamento, tentando processar...');
}
```

**Problema**:
- Se `payload.event = "unknown"`: código NÃO reconhece
- Mas se tem `payment`, CONTINUA processando
- Sem saber se realmente é evento válido

**Diagnóstico do WEBHOOK_DIAGNOSTICO.md**:
- "event": "unknown" aparecia nos audit_logs!
- Significa ASAAS real envia eventos diferentes

---

#### 🔴 CRÍTICO 4: Validação MD5 Pode não Funcionar no Deno

**Arquivo**: `webhook-asaas/index.ts`, linha 49

```typescript
const hashBuffer = await crypto.subtle.digest('MD5', data);
```

**Problema**:
- `crypto.subtle.digest()` suporta apenas: SHA-1, SHA-256, SHA-384, SHA-512
- **MD5 NÃO é suportado**!
- Isso vai falhar com erro no Deno/WebCrypto
- Resultado: sempre retorna `true` no catch (linha 66)

**Solução**: Usar SHA-256 OU usar biblioteca Node.js crypto

---

#### 🔴 CRÍTICO 5: Cliente Pode não Existir

**Arquivo**: `webhook-asaas/index.ts`, linhas 211-227

```typescript
const { data: cliente, error: clienteError } = await supabase
  .from('clientes')
  .select('id, contador_id, data_ativacao')
  .eq('asaas_customer_id', payment.customer)
  .maybeSingle();

if (!cliente) {
  console.error('Cliente não encontrado:', payment.customer);
  return new Response(JSON.stringify({ error: 'Cliente não encontrado' }), {
    status: 404,
  });
}
```

**Problema**:
- Se cliente não foi criado ANTES do webhook
- Webhook falha com 404
- Pagamento não é registrado
- Comissões não são calculadas

**Causas Possíveis**:
- Cliente criado em staging, webhook em produção
- Asaas customer_id está incorreto
- Cliente foi deletado do BD

---

#### 🔴 CRÍTICO 6: Sem Logging Detalhado de Erros

**Arquivo**: `webhook-asaas/index.ts`, linha 362-394

```typescript
catch (error) {
  const errorMessage = error instanceof Error ? error.message : JSON.stringify(error);
  console.error('❌ ERRO NO WEBHOOK ASAAS');
  console.error('   Mensagem:', errorMessage);
  // ← Não diz QUAL validação falhou!

  try {
    await supabase.from('audit_logs').insert({
      acao: 'WEBHOOK_ASAAS_ERROR',
      payload: {
        error: errorMessage,  // ← Genérica!
        // Não inclui: tipo do erro, stack trace, estado das validações
      },
    });
  } catch (logErr) {
    console.error('Erro ao registrar erro no audit log:', logErr);
  }
}
```

**Impacto**:
- WEBHOOK_DIAGNOSTICO.md diz: "Não sabemos qual erro porque não está sendo logado"
- "Atirando no escuro"
- Impossível debugar sem tentar múltiplas vezes

---

#### 🟠 IMPORTANTE 7: Status de Comissão Nunca Muda "calculada" → "aprovada"

**Arquivo**: `calcular-comissoes/index.ts`, linha 119

```typescript
status: "calculada",  // ← Sempre "calculada", nunca "aprovada"
```

**Problema**:
- CRON processa APENAS comissões com `status = 'aprovada'` (Migration 20251113000100_setup_cron_payment_processing.sql, linha 44)
- Mas calcular-comissões cria com `status = 'calculada'`
- **Ninguém muda para "aprovada"!**

**Resultado**:
- Comissões ficam eternamente em "calculada"
- CRON nunca processa (nunca acha com status='aprovada')
- Contador nunca recebe saque

**Solução**:
- Edge function `aprovar-comissoes` deve ser chamada ANTES do CRON
- OU mudar CRON para processar "calculada" também

---

#### 🟠 IMPORTANTE 8: Campos API Key Hardcoded em Scripts

**Arquivo**: `simulate-payment.mjs`, linha 5

```javascript
const ASAAS_API_KEY = '$aact_hmlg_000MzkwODA2MWY2OGM3MWRlMDU2NWM3MzJlNzZmNGZhZGY6Ojg5NGI4NmYzLWQxYmUtNDkwYy05ZWMwLTM5ZTFhZGUwYWM2MDo6JGFhY2hfNDNkMWQ3N2YtNTEzOS00NmU3LWE4NzAtMzU0Y2Q1ZWEyYTA4';
```

**Risco de Segurança**: API Key expostos em repositório Git!

---

### 2.3 Calcular-Comissões Function - Lógica OK

**Arquivo**: `/lovable-Celite/supabase/functions/calcular-comissoes/index.ts`

**Status**: ✅ Implementação correta

Faz:
- Validação de input (400 se inválido)
- Verificação idempotência (retorna 200 se já existe)
- Busca dados do contador e sponsor
- Calcula: comissão direta, override, bônus (progressão, volume, contador)
- Chamada RPC transacional com `SECURITY DEFINER`

Problemas:
- Status sempre = "calculada" (ver IMPORTANTE 7 acima)

---

### 2.4 RPC: executar_calculo_comissoes - Implementação Sólida

**Arquivo**: `Migration 20251112000200_create_rpc_executar_calculo_comissoes.sql`

**Status**: ✅ Implementação robusta

Protege contra:
- Duplicação (UNIQUE constraint + ON CONFLICT DO NOTHING)
- Atomicidade (SECURITY DEFINER - tudo ou nada)
- Rastreabilidade (registra logs de cálculo)

---

### 2.5 CRON Job - Dia 25

**Arquivo**: `Migration 20251113000100_setup_cron_payment_processing.sql`

**Status**: ✅ Configurado, mas com BUG (ver IMPORTANTE 7)

**Lógica**:
- Dia 25 de cada mês, às 00:00 UTC
- Para cada contador com comissões status='aprovada'
- Se total >= R$100: marca como 'paga'
- Se total < R$100: acumula para próximo mês

**BUG**: Nunca achará comissões com status='aprovada' porque estão 'calculada'

---

## PARTE 3: FLUXO DE DADOS - WHAT's SUPPOSED TO HAPPEN

### 3.1 Happy Path (Tudo dá Certo)

```
1. USUÁRIO CRIA CLIENTE
   ├─ Frontend cria em Asaas: POST /customers
   ├─ Asaas retorna: asaas_customer_id = "cus_123"
   └─ BD insere: clientes { asaas_customer_id = "cus_123" }

2. USUÁRIO CRIA ASSINATURA/PAGAMENTO
   ├─ Frontend cria em Asaas: POST /subscriptions
   ├─ Asaas retorna: asaas_payment_id = "pay_456"
   └─ BD insere: pagamentos { asaas_payment_id = "pay_456" } (?)

3. CLIENTE PAGA (ou Admin simula pagamento)
   ├─ Asaas atualiza status: PENDING → RECEIVED
   └─ 🚀 Asaas envia webhook

4. WEBHOOK-ASAAS RECEBE
   ├─ Parse payload
   ├─ Valida assinatura (atualmente: sempre valida ⚠️)
   ├─ Checa evento
   ├─ Valida campos (value, netValue) - ⚠️ netValue pode ser null
   ├─ Busca cliente por asaas_customer_id
   ├─ Checa idempotência (asaas_payment_id)
   ├─ INSERT INTO pagamentos { status = 'pago' }
   └─ 📞 Chama calcular-comissoes

5. CALCULAR-COMISSOES RECEBE
   ├─ Valida input
   ├─ Checa idempotência
   ├─ Busca contador e nível
   ├─ Calcula: direta (100% ou %), override, bônus
   ├─ Chama RPC: executar_calculo_comissoes
   └─ RPC executa ATOMICAMENTE:
      ├─ INSERT comissoes { status = 'calculada' }
      ├─ INSERT bonus_historico
      └─ INSERT comissoes_calculo_log

6. ⏳ ADMIN APROVA (FALTANDO!)
   └─ UPDATE comissoes { status = 'aprovada' }

7. 📅 CRON DIA 25 EXECUTA
   ├─ SELECT comissoes WHERE status = 'aprovada' AND competencia IN [mes_anterior]
   ├─ GROUP BY contador_id
   ├─ IF total >= 100: UPDATE comissoes { status = 'paga' }
   └─ UPDATE bonus_historico { status = 'pago' }

8. ✅ RESULTADO
   └─ Contador vê comissões "pagas" na dashboard
   └─ Pode solicitar saque

---

### 3.2 Problema Atual - "Calculada" Nunca Vira "Aprovada"

```
WEBHOOK cria: comissoes { status = 'calculada' }
                              ↓
               ❌ Ninguém muda para 'aprovada'
                              ↓
         CRON procura: status = 'aprovada'
                              ↓
              ❌ Não encontra nada!
                              ↓
           Comissões PRESAS em 'calculada'
                              ↓
        Contador NUNCA recebe saque! 💸
```

---

## PARTE 4: PLANO DE AÇÃO - PASSO A PASSO

### 4.1 CORREÇÕES CRÍTICAS (Ordem de Prioridade)

#### ✅ CORREÇÃO 1: Habilitar Validação de Assinatura

**Arquivo**: `webhook-asaas/index.ts`, linhas 30-66

**Antes**:
```typescript
if (!secret) {
  console.warn('⚠️  ASAAS_WEBHOOK_SECRET not configured');
  return true;  // ❌ PERMITE
}

if (!signature) {
  console.warn('⚠️  No signature in header');
  return true;  // ❌ PERMITE
}

try {
  // ... MD5 validation ...
} catch (error) {
  console.warn('⚠️  Allowing webhook despite validation error (development)');
  return true;  // ❌ PERMITE
}
```

**Depois**:
```typescript
if (!secret) {
  console.error('🔒 ASAAS_WEBHOOK_SECRET não configurado!');
  console.error('   Configure em: Supabase > Settings > Edge Functions > asaas_webhook_secret');
  // ✅ REJEITA
  return false;
}

if (!signature) {
  console.error('🔒 Signature não encontrada no header!');
  console.error('   Headers esperados: x-asaas-webhook-signature');
  // ✅ REJEITA
  return false;
}

try {
  // ... MD5 validation ...
  const isValid = expectedSignature === signature.toLowerCase();

  if (!isValid) {
    console.error('🔒 Signature INVÁLIDA!');
    console.error(`   Esperada: ${expectedSignature}`);
    console.error(`   Recebida: ${signature.toLowerCase()}`);
  }

  return isValid;  // ✅ VALIDA CORRETAMENTE

} catch (error) {
  console.error('🔒 Erro ao validar signature:', error);
  // ✅ REJEITA se houver erro de cálculo
  return false;
}
```

---

#### ✅ CORREÇÃO 2: Usar SHA-256 em Vez de MD5

**Arquivo**: `webhook-asaas/index.ts`, linha 49

**Antes**:
```typescript
const hashBuffer = await crypto.subtle.digest('MD5', data);  // ❌ MD5 não suportado!
```

**Depois**:
```typescript
// Solução 1: Usar Node.js crypto (via Deno polyfill)
import { createHash } from 'node:crypto';

function validateAsaasSignature(...): boolean {
  const hash = createHash('md5');
  hash.update(payload + secret);
  const expectedSignature = hash.digest('hex');

  const isValid = expectedSignature === signature.toLowerCase();
  return isValid;
}

// OU

// Solução 2: Verificar com ASAAS qual algoritmo usar
// Contatar suporte: "Vocês usam MD5 ou outro hash para webhook signature?"
```

---

#### ✅ CORREÇÃO 3: Tratar netValue = null

**Arquivo**: `webhook-asaas/index.ts`, linha 202

**Antes**:
```typescript
valor_liquido: validarValorMonetario(payment.netValue, 'valor_liquido'),
```

**Depois**:
```typescript
// Se Asaas não envia netValue, usar value como fallback
const netValue = payment.netValue !== null && payment.netValue !== undefined
  ? payment.netValue
  : payment.value;  // ✅ Fallback para valor bruto

valor_liquido: validarValorMonetario(netValue, 'valor_liquido'),
```

---

#### ✅ CORREÇÃO 4: Adicionar Logging Detalhado

**Arquivo**: `webhook-asaas/index.ts`, linhas 179-210

**Adicionar antes de cada validação crítica**:

```typescript
console.log('[WEBHOOK PAYLOAD ANALYSIS]');
console.log('  event:', payload.event);
console.log('  payment.id:', payment?.id);
console.log('  payment.customer:', payment?.customer);
console.log('  payment.value:', payment?.value);
console.log('  payment.netValue:', payment?.netValue);
console.log('  payment fields:', Object.keys(payment || {}).join(', '));

if (!payment || !payment.id || !payment.customer) {
  const missing = [];
  if (!payment) missing.push('payment object');
  if (payment && !payment.id) missing.push('payment.id');
  if (payment && !payment.customer) missing.push('payment.customer');

  const errMsg = `Payload incompleto: faltam ${missing.join(', ')}`;
  console.error('[WEBHOOK ERROR]', errMsg);
  throw new Error(errMsg);
}

console.log('[VALUE VALIDATION]');
try {
  const valor_bruto = validarValorMonetario(payment.value, 'valor_bruto');
  console.log('  ✅ valor_bruto:', valor_bruto);
} catch (e) {
  console.error('  ❌ valor_bruto validation failed:', e.message);
  throw e;
}

try {
  const valor_liquido = validarValorMonetario(netValue, 'valor_liquido');
  console.log('  ✅ valor_liquido:', valor_liquido);
} catch (e) {
  console.error('  ❌ valor_liquido validation failed:', e.message);
  throw e;
}

console.log('[CLIENT LOOKUP]');
console.log('  Procurando cliente com asaas_customer_id:', payment.customer);
```

---

#### ✅ CORREÇÃO 5: Resolver "Calculada" → "Aprovada"

**Arquivo**: `calcular-comissoes/index.ts`, linhas 119, 136, 137

**Opção A: Criar comissões com status 'aprovada' diretamente**

```typescript
// Se é primeira_mensalidade, Auto-aprovado (ativação)
status: input.is_primeira_mensalidade ? 'aprovada' : 'calculada',

// Ou TUDO é auto-aprovado:
status: 'aprovada',  // ✅ CRON consegue processar no dia 25
```

**Opção B: Chamar função de aprovação automaticamente**

```typescript
// Após RPC bem-sucedido, chamar aprovação automática:
const { error: approvalError } = await supabase.rpc(
  'fn_aprovar_comissao',
  {
    p_comissao_id: comissoes[0].id,
    p_user_id: 'system',  // User ID do sistema
    p_observacao: 'Auto-aprovado via webhook'
  }
);

if (approvalError) {
  console.error('Erro ao auto-aprovar comissão:', approvalError);
}
```

**Opção C: Aguardar aprovação manual (mais seguro)**

- MANTER status = 'calculada'
- Criar view para admins verem comissões pendentes (já existe: `vw_pending_approvals`)
- Admin aprova manualmente em interface
- Depois CRON processa

**Recomendação**: Opção A (Auto-aprovação) para ativação, Opção C (Manual) para recorrentes

---

#### ✅ CORREÇÃO 6: Mover API Keys para Supabase Secrets

**Arquivo**: Todos os scripts .mjs

**Antes**:
```javascript
const ASAAS_API_KEY = '$aact_hmlg_000MzkwODA2MWY2OGM3MWRl...';  // ❌ Hardcoded!
```

**Depois**:
```javascript
// 1. Configurar em Supabase:
//    supabase secrets set ASAAS_API_KEY "seu_token_aqui"

// 2. Em scripts Node.js (usando supabase-cli):
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://zytxwdgzjqrcmbnpgofj.supabase.co',
  'eyJ...service_key...'
);

// 3. Ler secret via RPC ou função:
const { data: secrets, error } = await supabase.functions.invoke('get-asaas-config', {
  headers: { 'Authorization': `Bearer ${serviceKey}` }
});

const ASAAS_API_KEY = secrets.apiKey;
```

---

### 4.2 VERIFICAÇÕES NECESSÁRIAS

#### ✓ Verificação 1: Confirmar Assinatura MD5 com ASAAS

**Ação**: Contatar suporte ASAAS

**Pergunta**:
- "Como funciona a assinatura do webhook?"
- "Vocês usam MD5(payload + secret)?"
- "Qual é o payload exato? (JSON string inteiro ou sem espaços?)"
- "Qual é o header exato da assinatura? (x-asaas-webhook-signature?)"

---

#### ✓ Verificação 2: Confirmar Estrutura do Payload

**Ação**: Verificar webhook logs

**Script**:
```sql
SELECT
  id,
  payload->'event' as event,
  payload->'payment'->>'id' as payment_id,
  payload->'payment'->>'customer' as customer,
  payload->'payment'->>'value' as value,
  payload->'payment'->>'netValue' as netValue,
  created_at
FROM webhook_logs
ORDER BY created_at DESC
LIMIT 10;
```

**O que procurar**:
- Campo `netValue` é null?
- Campo `netValue` tem outro nome?
- Campo `event` é "unknown"?
- Quais campos aparecem no payload real?

---

#### ✓ Verificação 3: Confirmar Cliente Existe

**Script**:
```sql
SELECT
  id,
  nome,
  asaas_customer_id,
  contador_id,
  data_ativacao
FROM clientes
WHERE asaas_customer_id IS NOT NULL
LIMIT 5;
```

**Verificar**: Se clientes têm `asaas_customer_id` preenchido

---

#### ✓ Verificação 4: Status Atual do CRON

**Script**:
```sql
-- Ver últimas execuções do CRON
SELECT
  id,
  acao,
  payload,
  created_at
FROM audit_logs
WHERE acao LIKE 'CRON_PAYMENT%'
ORDER BY created_at DESC
LIMIT 10;

-- Ver comissões bloqueadas em "calculada"
SELECT
  id,
  contador_id,
  valor,
  status,
  competencia,
  created_at
FROM comissoes
WHERE status = 'calculada'
LIMIT 10;

-- Ver comissões em "aprovada" (deveria ter zero se CRON nunca rodou)
SELECT
  id,
  contador_id,
  valor,
  status,
  competencia
FROM comissoes
WHERE status = 'aprovada'
LIMIT 10;
```

---

## PARTE 5: CHECKLIST ANTES DE DEPLOYAR

- [ ] **Validação de Assinatura Habilitada**
  - [ ] Rejeita se secret não configurado
  - [ ] Rejeita se signature inválida
  - [ ] Usa Node.js crypto.createHash('md5'), não WebCrypto

- [ ] **Tratamento de netValue**
  - [ ] Se netValue é null, usa value como fallback
  - [ ] Valida ambos os campos

- [ ] **Logging Detalhado**
  - [ ] Cada validação log seu resultado
  - [ ] Erros incluem contexto (qual campo falhou?)
  - [ ] Audit logs registram detalhes, não só "Erro desconhecido"

- [ ] **Status de Comissão Resolvido**
  - [ ] Comissões criam com status 'aprovada' (se auto-aprovação)
  - [ ] OU não existe função/rota para aprovar manualmente

- [ ] **API Keys Seguras**
  - [ ] Removidas de scripts .mjs
  - [ ] Armazenadas em Supabase Secrets
  - [ ] Scripts leem via `Deno.env.get()` ou RPC

- [ ] **Testes Executados**
  - [ ] Simulate-payment.mjs funciona ponta-a-ponta
  - [ ] Webhook processa corretamente
  - [ ] Comissões calculadas com valores corretos
  - [ ] Status muda de "calculada" → "paga" no CRON

---

## PARTE 6: SEQUÊNCIA DE DEPLOYMENT

### Passo 1: Deploy com Validação Básica + Logging (SEM ativar rejeição)

```bash
supabase functions deploy webhook-asaas
```

Deixar rodar 1-2 dias para coletar logs detalhados.

### Passo 2: Analisar Logs

```sql
SELECT payload FROM audit_logs
WHERE acao = 'WEBHOOK_ASAAS_ERROR'
ORDER BY created_at DESC LIMIT 20;
```

Verificar: Qual é o erro real agora que temos logging?

### Passo 3: Correção Baseada em Erro Real

Se erro for X → corrigir X
Se erro for Y → corrigir Y

### Passo 4: Deploy com Validação Ativa

Rejeitar webhooks com assinatura inválida.

### Passo 5: Testar End-to-End

```bash
node test-baby-step-2-create-customer-asaas.mjs
node test-baby-step-3-create-payment.mjs
node simulate-payment.mjs
node test-baby-step-4-check-commissions.mjs
```

Verificar fluxo completo: Cliente → Pagamento → Comissão → Pago

---

## PARTE 7: RECURSOS

### Links ASAAS
- [Criar Webhook API](https://docs.asaas.com/docs/criar-novo-webhook-pela-api)
- [Criar Webhook Web](https://docs.asaas.com/docs/criar-novo-webhook-pela-aplicacao-web)
- [Visão Geral ASAAS](https://docs.asaas.com/docs/visao-geral)

### Status Page
- https://status.asaas.com/

### Desenvolvedor
- https://asaas.com/developers

### Suporte
- Discord: https://discord.gg/invite/X2kgZm69HV

---

## CONCLUSÃO

O webhook ASAAS está montado corretamente **arquiteturalmente**, mas tem **6 problemas críticos + 2 importantes** que impedem funcionamento:

1. ❌ Assinatura nunca é validada
2. ❌ netValue pode ser null sem tratamento
3. ❌ Eventos desconhecidos não são mapeados
4. ❌ MD5 não funciona em Deno WebCrypto
5. ❌ Cliente pode não existir
6. ❌ Sem logging detalhado

7. ⚠️ Comissões presas em "calculada"
8. ⚠️ API Keys hardcoded em scripts

**Solução**: Seguir o Plano de Ação (Parte 4) em ordem.

**Tempo Estimado**: 2-3 horas de desenvolvimento + 24-48h de testes

**Resultado**: ✅ Webhook 100% funcional, seguro e auditável

---

**Documento preparado por**: Claude Code
**Próxima ação**: Implementar CORREÇÃO 1
