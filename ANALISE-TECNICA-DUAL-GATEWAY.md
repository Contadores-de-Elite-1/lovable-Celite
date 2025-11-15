# 📊 ANÁLISE TÉCNICA: DUAL GATEWAY (ASAAS + STRIPE)

**Data:** 15 de novembro de 2025
**Objetivo:** Avaliar riscos e viabilidade de manter ASAAS e Stripe simultaneamente
**Arquitetura:** Supabase + Edge Functions + React Frontend

---

## 🎯 RESUMO EXECUTIVO

**CONCLUSÃO:** É SEGURO e RECOMENDADO manter ambos gateways temporariamente, COM RESSALVAS.

**Pontos-chave:**
- ✅ Arquitetura atual **JÁ SUPORTA** dual gateway
- ⚠️ Faltam **GUARDRAILS** para evitar conflitos
- 🔧 Requer **AJUSTES ESPECÍFICOS** antes de ativar Stripe em produção
- ✅ Migração incremental é **MAIS SEGURA** que Big Bang

---

## 📐 ARQUITETURA ATUAL (ANÁLISE)

### 1. BANCO DE DADOS

#### ✅ Tabela `pagamentos` - **PREPARADA PARA DUAL GATEWAY**

```sql
-- Campos ASAAS
asaas_payment_id TEXT UNIQUE
asaas_event_id TEXT UNIQUE

-- Campos Stripe (JÁ ADICIONADOS)
stripe_payment_id TEXT UNIQUE
stripe_charge_id TEXT
moeda TEXT DEFAULT 'BRL'
metodo_pagamento TEXT
card_brand TEXT
card_last4 TEXT
customer_id TEXT
order_id TEXT
metadata JSONB
```

**Status:** ✅ **BOA ARQUITETURA**
- Campos separados por gateway
- Constraints UNIQUE em IDs de ambos gateways
- Permite pagamentos de ambas fontes

**Problema identificado:**
- ❌ **Falta campo `payment_provider`** (ASAAS | STRIPE)
- ❌ **Sem CHECK constraint** garantindo exclusividade
- ❌ **customer_id ambíguo** (ASAAS ou Stripe?)

#### ⚠️ Tabela `clientes` - **APENAS ASAAS**

```sql
asaas_customer_id TEXT UNIQUE
asaas_subscription_id TEXT
-- SEM CAMPOS STRIPE!
```

**Status:** ⚠️ **INCOMPLETA**
- Faltam campos para Stripe customer/subscription
- Impossível rastrear assinaturas Stripe
- Cliente não sabe de qual gateway veio

**Problema crítico:**
- ❌ **Sem `payment_provider`** na tabela clientes
- ❌ **Sem campos Stripe** (stripe_customer_id, stripe_subscription_id)
- ❌ **Impossível migrar clientes** de ASAAS → Stripe

---

### 2. WEBHOOKS (Edge Functions)

#### Webhooks SEPARADOS ✅

```
/functions/v1/webhook-asaas  → Handler ASAAS
/functions/v1/webhook-stripe → Handler Stripe
```

**Status:** ✅ **EXCELENTE**
- Endpoints completamente separados
- Zero risco de cruzamento
- Cada um processa seu próprio gateway

**Idempotência:**
- ✅ ASAAS: `asaas_payment_id` UNIQUE
- ✅ Stripe: `stripe_payment_id` UNIQUE
- ✅ Webhooks retriam não causam duplicatas

---

### 3. LÓGICA DE NEGÓCIOS

#### ❌ Função `calcular-comissoes` - **NÃO PREPARADA**

```typescript
// Atual: assume que veio do ASAAS
function calcularComissoes(pagamento_id) {
  // Lê pagamento
  // Assume campos ASAAS
  // Calcula comissões
}
```

**Problema:**
- ❌ Não sabe de qual gateway veio o pagamento
- ❌ Pode tentar ler campos ASAAS em pagamento Stripe
- ❌ Lógica não é agnóstica ao gateway

**Solução necessária:**
```typescript
function calcularComissoes(pagamento_id, payment_provider) {
  if (payment_provider === 'ASAAS') {
    // Lógica ASAAS
  } else if (payment_provider === 'STRIPE') {
    // Lógica Stripe
  }
}
```

---

## ⚠️ RISCOS IDENTIFICADOS

### RISCO 1: DADOS DUPLICADOS ⚠️ MÉDIO

**Cenário:**
Cliente faz pagamento no ASAAS E no Stripe

**Consequência:**
- Dois registros na tabela `pagamentos`
- Comissões calculadas DUAS VEZES
- Contador recebe dobrado

**Probabilidade:** BAIXA (requer ação do usuário)

**Mitigação:**
```sql
-- Adicionar CHECK constraint
ALTER TABLE pagamentos
ADD CONSTRAINT chk_single_gateway CHECK (
  (asaas_payment_id IS NOT NULL AND stripe_payment_id IS NULL) OR
  (asaas_payment_id IS NULL AND stripe_payment_id IS NOT NULL)
);
```

---

### RISCO 2: ASSINATURAS DESSINC ⚠️ ALTO

**Cenário:**
Cliente migra de ASAAS → Stripe mas:
- Assinatura ASAAS continua ativa
- Assinatura Stripe é criada
- Cliente tem duas assinaturas

**Consequência:**
- Cobrado duas vezes
- Comissões duplicadas
- Dados inconsistentes

**Probabilidade:** ALTA (sem gestão ativa)

**Mitigação:**
```typescript
// Ao criar assinatura Stripe:
// 1. Verificar se cliente já tem assinatura ASAAS ativa
// 2. Cancelar assinatura ASAAS automaticamente
// 3. Registrar migração em audit_logs
```

---

### RISCO 3: FONTE DA VERDADE AMBÍGUA ⚠️ ALTO

**Cenário:**
Dashboard mostra status de assinatura, mas:
- ASAAS diz "ativo"
- Stripe diz "cancelado"
- Sistema não sabe qual usar

**Consequência:**
- UI mostra dados errados
- Lógica de negócio quebra
- Suporte não sabe qual é a verdade

**Probabilidade:** MUITO ALTA

**Mitigação:**
```sql
-- Adicionar campo de controle
ALTER TABLE clientes
ADD COLUMN payment_provider TEXT CHECK (payment_provider IN ('ASAAS', 'STRIPE'));

-- Dashboard sempre usa o provider ativo
```

---

### RISCO 4: WEBHOOKS CRUZADOS ✅ BAIXO

**Cenário:**
Webhook ASAAS tenta processar payload Stripe

**Consequência:**
- Erro de parsing
- Webhook falha
- Retry infinito

**Probabilidade:** ZERO (endpoints separados)

**Status:** ✅ **JÁ MITIGADO** (arquitetura correta)

---

### RISCO 5: COMISSÕES DUPLICADAS ⚠️ CRÍTICO

**Cenário:**
Cliente paga no ASAAS, depois migra e paga no Stripe

**Consequência:**
- Dois pagamentos registrados
- Comissões calculadas duas vezes
- **PERDA FINANCEIRA DIRETA**

**Probabilidade:** MÉDIA

**Mitigação:**
```typescript
// Ao calcular comissões:
// 1. Verificar se já existe comissão para este cliente/competência
// 2. Cancelar comissão ASAAS se migrou para Stripe
// 3. Registrar motivo em observacao
```

---

## ✅ BOAS PRÁTICAS RECOMENDADAS

### 1. CAMPO `payment_provider` OBRIGATÓRIO

**Implementação:**

```sql
-- Migration obrigatória
ALTER TABLE clientes
ADD COLUMN payment_provider TEXT NOT NULL DEFAULT 'ASAAS'
  CHECK (payment_provider IN ('ASAAS', 'STRIPE'));

ALTER TABLE pagamentos
ADD COLUMN payment_provider TEXT NOT NULL DEFAULT 'ASAAS'
  CHECK (payment_provider IN ('ASAAS', 'STRIPE'));

-- Índices
CREATE INDEX idx_clientes_provider ON clientes(payment_provider);
CREATE INDEX idx_pagamentos_provider ON pagamentos(payment_provider);
```

**Benefícios:**
- ✅ Fonte da verdade clara
- ✅ Queries agnósticas ao gateway
- ✅ Dashboard sabe qual gateway usar
- ✅ Migrações rastreáveis

---

### 2. CAMPOS STRIPE EM `clientes`

**Implementação:**

```sql
ALTER TABLE clientes
ADD COLUMN stripe_customer_id TEXT UNIQUE,
ADD COLUMN stripe_subscription_id TEXT,
ADD COLUMN stripe_price_id TEXT;

-- Índices
CREATE INDEX idx_clientes_stripe_customer ON clientes(stripe_customer_id);
CREATE INDEX idx_clientes_stripe_subscription ON clientes(stripe_subscription_id);
```

**Benefícios:**
- ✅ Rastrear assinaturas Stripe
- ✅ Migração de clientes ASAAS → Stripe
- ✅ Cancelar assinatura antiga ao migrar

---

### 3. CONSTRAINT DE EXCLUSIVIDADE

**Implementação:**

```sql
-- Garantir que pagamento pertence a apenas 1 gateway
ALTER TABLE pagamentos
ADD CONSTRAINT chk_single_payment_gateway CHECK (
  (asaas_payment_id IS NOT NULL AND stripe_payment_id IS NULL) OR
  (asaas_payment_id IS NULL AND stripe_payment_id IS NOT NULL)
);

-- Garantir que cliente tem apenas 1 customer_id ativo
ALTER TABLE clientes
ADD CONSTRAINT chk_single_customer_gateway CHECK (
  (payment_provider = 'ASAAS' AND asaas_customer_id IS NOT NULL AND stripe_customer_id IS NULL) OR
  (payment_provider = 'STRIPE' AND stripe_customer_id IS NOT NULL AND asaas_customer_id IS NULL) OR
  (payment_provider = 'ASAAS' AND asaas_customer_id IS NOT NULL AND stripe_customer_id IS NOT NULL) -- Migração
);
```

**Benefícios:**
- ✅ **Impossível** ter pagamento duplicado
- ✅ **Impossível** ter ambiguidade
- ✅ Banco garante integridade

---

### 4. LÓGICA AGNÓSTICA AO GATEWAY

**Implementação:**

```typescript
// Função genérica de cálculo
async function calcularComissoes(pagamento_id: string) {
  // Buscar pagamento COM provider
  const { data: pagamento } = await supabase
    .from('pagamentos')
    .select('*, payment_provider')
    .eq('id', pagamento_id)
    .single();

  // Delegar para função específica
  if (pagamento.payment_provider === 'ASAAS') {
    return calcularComissoesASAAS(pagamento);
  } else if (pagamento.payment_provider === 'STRIPE') {
    return calcularComissoesStripe(pagamento);
  }

  throw new Error(`Unknown provider: ${pagamento.payment_provider}`);
}
```

**Benefícios:**
- ✅ Código limpo e modular
- ✅ Fácil adicionar novos gateways
- ✅ Testes isolados por gateway

---

### 5. MIGRAÇÃO CONTROLADA

**Implementação:**

```typescript
// Função de migração ASAAS → Stripe
async function migrarClienteParaStripe(cliente_id: string) {
  const { data: cliente } = await supabase
    .from('clientes')
    .select('*')
    .eq('id', cliente_id)
    .single();

  // 1. Criar customer no Stripe
  const stripeCustomer = await stripe.customers.create({
    email: cliente.contato_email,
    name: cliente.nome_empresa,
    metadata: { cliente_id: cliente.id },
  });

  // 2. Criar subscription no Stripe
  const subscription = await stripe.subscriptions.create({
    customer: stripeCustomer.id,
    items: [{ price: STRIPE_PRICE_ID }],
    metadata: { cliente_id: cliente.id },
  });

  // 3. Cancelar assinatura ASAAS
  await cancelarAssinaturaASAAS(cliente.asaas_subscription_id);

  // 4. Atualizar banco de dados
  await supabase
    .from('clientes')
    .update({
      payment_provider: 'STRIPE',
      stripe_customer_id: stripeCustomer.id,
      stripe_subscription_id: subscription.id,
      // NÃO deletar asaas_* (manter histórico)
    })
    .eq('id', cliente_id);

  // 5. Registrar migração
  await supabase.from('audit_logs').insert({
    acao: 'CLIENTE_MIGRADO_ASAAS_STRIPE',
    tabela: 'clientes',
    registro_id: cliente_id,
    payload: {
      asaas_customer_id: cliente.asaas_customer_id,
      stripe_customer_id: stripeCustomer.id,
      timestamp: new Date().toISOString(),
    },
  });
}
```

**Benefícios:**
- ✅ Migração rastreável
- ✅ Histórico preservado
- ✅ Reversível (se necessário)
- ✅ Auditável

---

### 6. DASHBOARD INTELIGENTE

**Implementação:**

```typescript
// Componente de pagamento
function PaymentSection({ cliente }) {
  // Detectar qual gateway o cliente usa
  const provider = cliente.payment_provider;

  if (provider === 'ASAAS') {
    return <AsaasPaymentUI cliente={cliente} />;
  } else if (provider === 'STRIPE') {
    return <StripePaymentUI cliente={cliente} />;
  }

  // Sem provider = novo cliente, mostrar ambos
  return (
    <>
      <button onClick={() => iniciarCheckoutStripe()}>
        Pagar com Stripe
      </button>
      <button onClick={() => iniciarCheckoutASAAS()}>
        Pagar com ASAAS (legado)
      </button>
    </>
  );
}
```

**Benefícios:**
- ✅ UI adaptativa
- ✅ Sem confusão para o usuário
- ✅ Migração transparente

---

## 🎯 ARQUITETURA IDEAL PARA DUAL GATEWAY

### DIAGRAMA

```
┌─────────────────────────────────────────────────────────┐
│                      FRONTEND                           │
│  ┌──────────────┐              ┌──────────────┐        │
│  │  ASAAS UI    │              │  Stripe UI   │        │
│  │ (legacy)     │              │  (novo)      │        │
│  └──────┬───────┘              └──────┬───────┘        │
│         │                             │                 │
└─────────┼─────────────────────────────┼─────────────────┘
          │                             │
          ▼                             ▼
┌─────────────────────────────────────────────────────────┐
│                   SUPABASE EDGE                         │
│  ┌──────────────┐              ┌──────────────┐        │
│  │webhook-asaas │              │webhook-stripe│        │
│  └──────┬───────┘              └──────┬───────┘        │
│         │                             │                 │
│         │      ┌──────────────┐      │                 │
│         └─────►│calcular-     │◄─────┘                 │
│                │comissoes     │                         │
│                └──────┬───────┘                         │
└───────────────────────┼─────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────┐
│                    SUPABASE DB                          │
│                                                          │
│  ┌─────────────────────────────────────────────────┐   │
│  │              clientes                            │   │
│  │  - payment_provider (ASAAS | STRIPE) ◄─ CHAVE   │   │
│  │  - asaas_customer_id                            │   │
│  │  - stripe_customer_id                           │   │
│  └─────────────────────────────────────────────────┘   │
│                                                          │
│  ┌─────────────────────────────────────────────────┐   │
│  │              pagamentos                          │   │
│  │  - payment_provider (ASAAS | STRIPE) ◄─ CHAVE   │   │
│  │  - asaas_payment_id (UNIQUE)                    │   │
│  │  - stripe_payment_id (UNIQUE)                   │   │
│  │  + CHECK: apenas 1 pode estar preenchido        │   │
│  └─────────────────────────────────────────────────┘   │
│                                                          │
│  ┌─────────────────────────────────────────────────┐   │
│  │              comissoes                           │   │
│  │  - valor                                         │   │
│  │  - pagamento_id → payment_provider (herdado)    │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

---

## 📋 CHECKLIST DE SEGURANÇA

### ANTES DE ATIVAR STRIPE EM PRODUÇÃO:

- [ ] **Adicionar campo `payment_provider`** em `clientes` e `pagamentos`
- [ ] **Adicionar campos Stripe** em `clientes` (customer_id, subscription_id)
- [ ] **Criar constraint de exclusividade** (CHECK em pagamentos)
- [ ] **Atualizar função `calcular-comissoes`** (agnóstica ao gateway)
- [ ] **Criar função de migração** ASAAS → Stripe
- [ ] **Atualizar dashboard** para mostrar provider ativo
- [ ] **Testar cenário de migração** em staging
- [ ] **Testar cenário de duplicação** (deve falhar)
- [ ] **Documentar processo de migração**
- [ ] **Treinar equipe** sobre dual gateway

---

## 🚦 CONCLUSÃO E RECOMENDAÇÃO

### ✅ É SEGURO MANTER AMBOS GATEWAYS?

**SIM**, com as seguintes condições:

1. **Adicionar campo `payment_provider`** (OBRIGATÓRIO)
2. **Adicionar campos Stripe em `clientes`** (OBRIGATÓRIO)
3. **Implementar constraints de exclusividade** (OBRIGATÓRIO)
4. **Adaptar lógica de comissões** (OBRIGATÓRIO)
5. **Dashboard mostrar provider ativo** (RECOMENDADO)

### ⚠️ Em quais condições é aceitável?

**Aceitável durante:**
- Migração incremental de clientes
- Testes A/B de gateways
- Suporte a clientes legados
- Período de transição (3-6 meses)

**NÃO aceitável para:**
- Novos clientes (devem ir direto para Stripe)
- Produção sem guardrails (alto risco)
- Longo prazo (manter indefinidamente)

### 🎯 Recomendação Final

**ESTRATÉGIA RECOMENDADA:**

```
FASE 1 (AGORA - 1 semana):
└─ Implementar guardrails (provider, constraints)
└─ Adicionar campos Stripe em clientes
└─ Atualizar lógica de comissões
└─ Testar em staging

FASE 2 (2-4 semanas):
└─ Ativar Stripe para NOVOS clientes
└─ ASAAS apenas para clientes EXISTENTES
└─ Migração controlada (opt-in)

FASE 3 (2-3 meses):
└─ Migração em lote dos clientes ASAAS
└─ Cancelar assinaturas ASAAS antigas
└─ Monitorar comissões

FASE 4 (após 6 meses):
└─ Deprecar ASAAS completamente
└─ Remover código ASAAS
└─ Manter campos no banco (histórico)
```

---

## 📊 ESTIMATIVA DE ESFORÇO

### GUARDRAILS (OBRIGATÓRIO)
**Tempo:** 4-6 horas
**Complexidade:** Média
**Risco:** Baixo

**Tarefas:**
1. Migration: adicionar `payment_provider` + campos Stripe
2. Constraint: exclusividade de gateway
3. Atualizar `calcular-comissoes`
4. Testes unitários

### MIGRAÇÃO COMPLETA
**Tempo:** 40-60 horas
**Complexidade:** Alta
**Risco:** Médio

**Tarefas:**
1. Criar função de migração
2. Migrar clientes em lote
3. Atualizar dashboard
4. Testes end-to-end
5. Monitoramento

### LIMPEZA FINAL
**Tempo:** 8-12 horas
**Complexidade:** Baixa
**Risco:** Baixo

**Tarefas:**
1. Deletar código ASAAS
2. Deprecar edge functions
3. Atualizar documentação

---

## 🎯 RESPOSTA DIRETA ÀS SUAS PERGUNTAS

### 1. Riscos de confusão e conflitos?

**⚠️ ALTO** sem guardrails, **✅ BAIXO** com implementação correta.

**Mitigação:**
- Campo `payment_provider` resolve 90% dos problemas
- Constraints garantem exclusividade
- Dashboard mostra fonte ativa

### 2. Riscos de quebra de código/sistema?

**✅ BAIXO** - arquitetura atual já separa bem os gateways.

**Pontos de atenção:**
- Função `calcular-comissoes` precisa ser adaptada
- Dashboard precisa detectar provider
- Queries precisam filtrar por provider

### 3. Boas práticas recomendadas?

**✅ IMPLEMENTAR TODAS** listadas na seção "Boas Práticas".

**Prioridade 1 (OBRIGATÓRIO):**
- Campo `payment_provider`
- Constraints de exclusividade
- Campos Stripe em `clientes`

**Prioridade 2 (RECOMENDADO):**
- Função de migração
- Dashboard adaptativo
- Audit trail

### 4. É seguro manter os dois?

**✅ SIM**, com as condições listadas.

**Recomendação:** Implementar guardrails ANTES de ativar Stripe em produção.

**Prazo sugerido:** 3-6 meses de dual gateway, depois deprecar ASAAS.

---

## 📝 PRÓXIMOS PASSOS IMEDIATOS

### 1. IMPLEMENTAR GUARDRAILS (4-6 horas)

```bash
# Priority 1
1. Criar migration: add payment_provider + campos Stripe
2. Atualizar calcular-comissoes (agnóstico)
3. Testar em staging
4. Deploy em produção
```

### 2. ATIVAR STRIPE GRADUALMENTE (2-4 semanas)

```bash
# Priority 2
1. Stripe para novos clientes APENAS
2. ASAAS mantido para clientes existentes
3. Migração opt-in
4. Monitorar comissões
```

### 3. MIGRAÇÃO EM LOTE (2-3 meses)

```bash
# Priority 3
1. Criar função de migração
2. Testar com 10 clientes
3. Expandir gradualmente
4. Cancelar ASAAS após 100% migrado
```

---

**CONCLUSÃO:** Dual gateway é **SEGURO e RECOMENDADO** como estratégia de migração, desde que implementados os guardrails **ANTES** de ativar Stripe em produção.

**Próxima ação:** Implementar migration com `payment_provider` + campos Stripe.
