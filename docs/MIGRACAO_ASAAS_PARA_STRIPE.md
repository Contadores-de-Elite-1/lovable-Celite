# MIGRACAO: ASAAS → STRIPE
## Portal dos Contadores - Sistema de Comissoes MLM/MMN

**Versao**: 1.0  
**Data**: Novembro 2025  
**Responsavel**: DEV 2  
**Criticidade**: ALTA (afeta calculo de comissoes)

---

## RESUMO EXECUTIVO

**Por que migrar?**
- Stripe tem melhor suporte para Stripe Connect (split automatico de comissoes)
- Stripe e mais robusto para operacoes internacionais
- Stripe tem melhor documentacao e SDKs
- Stripe permite automacao completa de payouts

**O que muda?**
- Webhook ASAAS → Webhook Stripe
- Validacao MD5 (ASAAS) → Validacao Stripe Signature
- Campos `asaas_payment_id` → `stripe_payment_intent_id`
- Edge Function `webhook-asaas` → `webhook-stripe`

**Impacto**:
- ⚠️ CRITICO: Nao pode haver perda de dados ou comissoes nao calculadas
- ⚠️ CRITICO: Durante migracao, manter AMBOS webhooks ativos
- ✅ Vantagem: Automacao completa via Stripe Connect

---

## ARQUITETURA ATUAL (ASAAS)

```
Cliente paga no ASAAS
         ↓
ASAAS envia webhook → Edge Function (webhook-asaas)
         ↓
Valida MD5 signature
         ↓
Cria registro em 'pagamentos' (asaas_payment_id)
         ↓
Chama RPC 'executar_calculo_comissoes'
         ↓
Calcula 17 bonificacoes
         ↓
Insere em 'comissoes'
         ↓
Dashboard do contador atualiza
```

### Problemas identificados no codigo atual:

1. **Validacao MD5 incompleta**:
```typescript
// supabase/functions/webhook-asaas/index.ts (LINHA 45-50)
function validateAsaasSignature(payload: string, signature: string): boolean {
  // TODO: Implementar validacao real
  return true; // ⚠️ SEMPRE RETORNA TRUE (INSEGURO!)
}
```

2. **Constraint UNIQUE incorreto**:
```sql
-- Migration anterior tinha:
ALTER TABLE pagamentos ADD CONSTRAINT pagamentos_asaas_event_id_key UNIQUE (asaas_event_id);
-- Problema: Re-entrega de webhook falhava (violacao de UNIQUE)
```

3. **Idempotencia parcial**:
```typescript
// Verifica por asaas_payment_id, mas nao por asaas_event_id
const { data: existing } = await supabase
  .from('pagamentos')
  .select('id')
  .eq('asaas_payment_id', payment.id)
  .single();
```

---

## ARQUITETURA NOVA (STRIPE)

```
Cliente paga no Stripe Checkout
         ↓
Stripe envia webhook → Edge Function (webhook-stripe)
         ↓
Valida Stripe Signature (construirEvent)
         ↓
Processa evento 'invoice.payment_succeeded'
         ↓
Cria registro em 'pagamentos' (stripe_payment_intent_id)
         ↓
Chama RPC 'executar_calculo_comissoes'
         ↓
Calcula 17 bonificacoes
         ↓
Insere em 'comissoes'
         ↓
Stripe Connect transfere comissoes automaticamente
         ↓
Dashboard atualiza
```

### Vantagens:

1. **Validacao nativa do Stripe SDK**:
```typescript
const event = stripe.webhooks.constructEvent(
  body,
  signature,
  webhookSecret
);
// Se assinatura for invalida, lanca excecao automaticamente
```

2. **Stripe Connect (split automatico)**:
```typescript
// No Checkout Session:
subscription_data: {
  application_fee_percent: 15,
  transfer_data: {
    destination: contador.stripe_connect_account_id
  }
}
// Stripe transfere 15% automaticamente para o contador
```

3. **Idempotencia nativa**:
```typescript
// Stripe envia header 'Stripe-Event-Id' (unico por evento)
// Se processar 2x o mesmo evento, detectamos via:
const { data: existing } = await supabase
  .from('pagamentos')
  .select('id')
  .eq('stripe_event_id', event.id)
  .single();

if (existing) {
  return { message: 'Event already processed' };
}
```

---

## PLANO DE MIGRACAO (SEM DOWNTIME)

### FASE 1: Preparacao (Semana 1)

#### 1.1. Criar conta Stripe + Configurar produtos

```bash
# 1. Acessar: https://dashboard.stripe.com
# 2. Criar 3 Products:
#    - Pro: R$ 100/mes (recorrente)
#    - Premium: R$ 130/mes (recorrente)
#    - Top: R$ 180/mes (recorrente)
# 3. Anotar Price IDs:
#    - price_xxx (Pro)
#    - price_yyy (Premium)
#    - price_zzz (Top)
```

#### 1.2. Configurar Stripe Connect

```bash
# 1. Ativar Stripe Connect no Dashboard
# 2. Escolher tipo: "Standard" (contador controla propria conta)
# 3. Configurar OAuth flow para contadores se conectarem
# 4. Definir application_fee_percent (padrao: 15% recorrente)
```

#### 1.3. Adicionar campos no banco de dados

```sql
-- supabase/migrations/20251119003000_add_stripe_fields.sql

-- Adiciona campos Stripe na tabela pagamentos
ALTER TABLE pagamentos
ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_invoice_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_event_id TEXT UNIQUE;

-- Adiciona campos Stripe na tabela contadores
ALTER TABLE contadores
ADD COLUMN IF NOT EXISTS stripe_connect_account_id TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS stripe_connect_onboarded BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS stripe_connect_onboarded_at TIMESTAMPTZ;

-- Indices para performance
CREATE INDEX idx_pagamentos_stripe_payment_intent ON pagamentos(stripe_payment_intent_id);
CREATE INDEX idx_pagamentos_stripe_event ON pagamentos(stripe_event_id);
CREATE INDEX idx_contadores_stripe_connect ON contadores(stripe_connect_account_id);

-- IMPORTANTE: Mantem campos ASAAS (para periodo de transicao)
-- Nao remover: asaas_payment_id, asaas_event_id
```

#### 1.4. Criar Edge Function do webhook Stripe

```typescript
// supabase/functions/webhook-stripe/index.ts

import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2024-11-20.acacia'
});

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

interface StripeWebhookEvent {
  id: string;
  type: string;
  data: {
    object: any;
  };
}

async function processarPagamentoStripe(event: StripeWebhookEvent) {
  console.log('[Stripe Webhook] Tipo de evento:', event.type);
  
  // Eventos suportados:
  // - invoice.payment_succeeded (recorrente mensal)
  // - checkout.session.completed (primeiro pagamento - ja processado no onboarding)
  
  if (event.type === 'invoice.payment_succeeded') {
    const invoice = event.data.object as Stripe.Invoice;
    
    // Busca subscription metadata (contador_id, plano)
    const subscription = await stripe.subscriptions.retrieve(
      invoice.subscription as string
    );
    
    const { contador_id, plano } = subscription.metadata;
    
    if (!contador_id || !plano) {
      throw new Error('Metadata incompleto na subscription');
    }
    
    // Busca cliente_id pelo stripe_subscription_id
    const { data: cliente, error: clienteError } = await supabase
      .from('clientes')
      .select('id, nome, email')
      .eq('stripe_subscription_id', subscription.id)
      .single();
    
    if (clienteError || !cliente) {
      throw new Error(`Cliente nao encontrado para subscription ${subscription.id}`);
    }
    
    // Verifica idempotencia (evento ja foi processado?)
    const { data: existingPayment } = await supabase
      .from('pagamentos')
      .select('id')
      .eq('stripe_event_id', event.id)
      .single();
    
    if (existingPayment) {
      console.log('[Stripe Webhook] Evento ja processado:', event.id);
      return { message: 'Event already processed', payment_id: existingPayment.id };
    }
    
    // Valida valor (deve ser > 0)
    const valorCentavos = invoice.amount_paid;
    const valorReais = valorCentavos / 100;
    
    if (valorReais <= 0) {
      throw new Error(`Valor invalido: ${valorReais}`);
    }
    
    // Cria registro do pagamento
    const { data: pagamento, error: pagamentoError } = await supabase
      .from('pagamentos')
      .insert({
        cliente_id: cliente.id,
        contador_id: contador_id,
        valor: valorReais,
        plano: plano,
        status: 'aprovado',
        stripe_payment_intent_id: invoice.payment_intent as string,
        stripe_invoice_id: invoice.id,
        stripe_subscription_id: subscription.id,
        stripe_event_id: event.id,
        tipo_pagamento: 'recorrente',
        pago_em: new Date(invoice.created * 1000).toISOString()
      })
      .select()
      .single();
    
    if (pagamentoError) {
      console.error('[Stripe Webhook] Erro ao criar pagamento:', pagamentoError);
      throw pagamentoError;
    }
    
    console.log('[Stripe Webhook] Pagamento criado:', pagamento.id);
    
    // CRITICO: Calcula comissoes
    try {
      const { data: comissoes, error: comissoesError } = await supabase.rpc(
        'executar_calculo_comissoes',
        { p_pagamento_id: pagamento.id }
      );
      
      if (comissoesError) {
        console.error('[Stripe Webhook] ERRO CRITICO ao calcular comissoes:', comissoesError);
        
        // Alerta critico via Slack/Email
        await fetch(Deno.env.get('WEBHOOK_ALERTA_CRITICO')!, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tipo: 'ERRO_CALCULO_COMISSOES',
            gateway: 'stripe',
            pagamento_id: pagamento.id,
            cliente_id: cliente.id,
            valor: valorReais,
            error: comissoesError.message,
            timestamp: new Date().toISOString()
          })
        });
        
        throw comissoesError;
      }
      
      console.log('[Stripe Webhook] Comissoes calculadas:', comissoes?.length || 0);
      
    } catch (error) {
      console.error('[Stripe Webhook] Excecao ao calcular comissoes:', error);
      throw error;
    }
    
    // Log de auditoria
    await supabase.from('audit_logs').insert({
      action: 'PAGAMENTO_PROCESSADO',
      user_id: contador_id,
      resource_type: 'pagamentos',
      resource_id: pagamento.id,
      details: {
        gateway: 'stripe',
        valor: valorReais,
        plano: plano,
        stripe_invoice_id: invoice.id,
        cliente_nome: cliente.nome
      }
    });
    
    return { success: true, payment_id: pagamento.id };
  }
  
  // Outros eventos (ignorar por enquanto)
  console.log('[Stripe Webhook] Evento ignorado:', event.type);
  return { message: 'Event type not handled' };
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }
  
  const signature = req.headers.get('stripe-signature');
  if (!signature) {
    console.error('[Stripe Webhook] Header stripe-signature ausente');
    return new Response('Missing stripe-signature header', { status: 400 });
  }
  
  const body = await req.text();
  
  // Valida assinatura do Stripe
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      Deno.env.get('STRIPE_WEBHOOK_SECRET')!
    );
  } catch (err) {
    console.error('[Stripe Webhook] Validacao de assinatura falhou:', err.message);
    return new Response(`Webhook signature verification failed: ${err.message}`, {
      status: 400
    });
  }
  
  console.log('[Stripe Webhook] Assinatura valida. Processando evento:', event.id);
  
  // Processa evento
  try {
    const result = await processarPagamentoStripe(event);
    
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('[Stripe Webhook] Erro ao processar:', error);
    
    return new Response(JSON.stringify({
      error: error.message,
      event_id: event.id
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});
```

#### 1.5. Configurar webhook no Stripe Dashboard

```bash
# 1. Acessar: https://dashboard.stripe.com/webhooks
# 2. Clicar em "Add endpoint"
# 3. URL: https://xxx.supabase.co/functions/v1/webhook-stripe
# 4. Selecionar eventos:
#    - invoice.payment_succeeded
#    - customer.subscription.deleted (para cancelamentos)
# 5. Copiar "Signing secret": whsec_xxx
# 6. Adicionar em .env: STRIPE_WEBHOOK_SECRET=whsec_xxx
```

---

### FASE 2: Testes em Paralelo (Semana 2)

#### 2.1. Manter AMBOS webhooks ativos

```
ASAAS webhook → webhook-asaas → [continua funcionando]
                                        ↓
                                 Calcula comissoes

STRIPE webhook → webhook-stripe → [em teste]
                                        ↓
                                 Calcula comissoes
```

#### 2.2. Criar script de teste

```typescript
// supabase/scripts/test-webhook-stripe.sh

#!/bin/bash

# Envia evento de teste para webhook Stripe
stripe trigger invoice.payment_succeeded \
  --add invoice:metadata[contador_id]=UUID_DO_CONTADOR_TESTE \
  --add invoice:metadata[plano]=premium \
  --add invoice:amount_paid=13000

# Verifica se comissoes foram criadas
echo "Verificando comissoes calculadas..."
```

#### 2.3. Comparar resultados (ASAAS vs Stripe)

```sql
-- Query de validacao
SELECT
  p.id,
  p.valor,
  p.plano,
  p.asaas_payment_id,
  p.stripe_payment_intent_id,
  COUNT(c.id) AS total_comissoes,
  SUM(c.valor) AS soma_comissoes
FROM pagamentos p
LEFT JOIN comissoes c ON c.pagamento_id = p.id
WHERE p.criado_em > now() - interval '7 days'
GROUP BY p.id
ORDER BY p.criado_em DESC;

-- Esperado: total_comissoes = 17 (ou mais, se houver override/bonus progressao)
-- Esperado: soma_comissoes = valor esperado baseado no plano e nivel
```

---

### FASE 3: Cutover (Semana 3)

#### 3.1. Pausar webhook ASAAS

```bash
# No dashboard ASAAS, desabilitar webhook temporariamente
# Ou comentar codigo da Edge Function webhook-asaas
```

#### 3.2. Migrar contadores existentes para Stripe Connect

```typescript
// supabase/functions/migrar-contadores-stripe/index.ts

async function migrarContador(contadorId: string) {
  const { data: contador } = await supabase
    .from('contadores')
    .select('*')
    .eq('id', contadorId)
    .single();
  
  if (contador.stripe_connect_account_id) {
    console.log('Contador ja possui Stripe Connect');
    return;
  }
  
  // Cria Express Account no Stripe
  const account = await stripe.accounts.create({
    type: 'express',
    country: 'BR',
    email: contador.email,
    capabilities: {
      transfers: { requested: true }
    },
    business_profile: {
      name: contador.nome,
      url: 'https://topclass.com'
    }
  });
  
  // Atualiza contador
  await supabase
    .from('contadores')
    .update({
      stripe_connect_account_id: account.id,
      stripe_connect_onboarded: false
    })
    .eq('id', contadorId);
  
  // Gera link de onboarding
  const accountLink = await stripe.accountLinks.create({
    account: account.id,
    refresh_url: `https://portal.topclass.com/stripe/reauth`,
    return_url: `https://portal.topclass.com/stripe/success`,
    type: 'account_onboarding'
  });
  
  // Envia email para contador com link de onboarding
  await enviarEmailOnboardingStripe({
    contador_email: contador.email,
    contador_nome: contador.nome,
    onboarding_url: accountLink.url
  });
  
  return accountLink.url;
}
```

#### 3.3. Migrar clientes existentes para Stripe Subscriptions

```typescript
// supabase/functions/migrar-clientes-stripe/index.ts

async function migrarCliente(clienteId: string) {
  const { data: cliente } = await supabase
    .from('clientes')
    .select('*, contadores(*)')
    .eq('id', clienteId)
    .single();
  
  if (cliente.stripe_subscription_id) {
    console.log('Cliente ja possui Stripe Subscription');
    return;
  }
  
  // Cria Customer no Stripe
  const customer = await stripe.customers.create({
    email: cliente.email,
    name: cliente.nome,
    metadata: {
      cliente_id: cliente.id,
      contador_id: cliente.contador_id
    }
  });
  
  // Cria Subscription
  const priceIds = {
    pro: Deno.env.get('STRIPE_PRICE_PRO')!,
    premium: Deno.env.get('STRIPE_PRICE_PREMIUM')!,
    top: Deno.env.get('STRIPE_PRICE_TOP')!
  };
  
  const subscription = await stripe.subscriptions.create({
    customer: customer.id,
    items: [
      { price: priceIds[cliente.plano] }
    ],
    metadata: {
      contador_id: cliente.contador_id,
      plano: cliente.plano
    },
    // Transfere comissoes para contador via Stripe Connect
    application_fee_percent: 15,
    transfer_data: {
      destination: cliente.contadores.stripe_connect_account_id
    }
  });
  
  // Atualiza cliente
  await supabase
    .from('clientes')
    .update({
      stripe_customer_id: customer.id,
      stripe_subscription_id: subscription.id
    })
    .eq('id', clienteId);
  
  console.log(`Cliente ${clienteId} migrado para Stripe Subscription ${subscription.id}`);
}
```

#### 3.4. Ativar webhook Stripe em producao

```bash
# 1. Deploy da Edge Function webhook-stripe
supabase functions deploy webhook-stripe

# 2. Verificar no Stripe Dashboard que webhook esta ativo
# 3. Testar com evento real (pagamento de teste)
```

---

### FASE 4: Monitoramento (Semana 4)

#### 4.1. Criar dashboard de monitoramento

```sql
-- View: Comparacao ASAAS vs Stripe
CREATE OR REPLACE VIEW v_pagamentos_gateway AS
SELECT
  date_trunc('day', pago_em) AS data,
  CASE
    WHEN stripe_payment_intent_id IS NOT NULL THEN 'stripe'
    WHEN asaas_payment_id IS NOT NULL THEN 'asaas'
    ELSE 'desconhecido'
  END AS gateway,
  COUNT(*) AS total_pagamentos,
  SUM(valor) AS soma_valor,
  COUNT(DISTINCT cliente_id) AS total_clientes
FROM pagamentos
WHERE pago_em > now() - interval '30 days'
GROUP BY data, gateway
ORDER BY data DESC, gateway;
```

#### 4.2. Alerta de comissoes nao calculadas

```typescript
// supabase/functions/cron-verificar-comissoes/index.ts

async function verificarComissoesNaoCalculadas() {
  // Busca pagamentos das ultimas 24h sem comissoes
  const { data: pagamentosSemComissoes } = await supabase
    .from('pagamentos')
    .select('id, valor, plano, cliente_id, pago_em')
    .gte('pago_em', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
    .is('comissoes_calculadas', false);
  
  if (pagamentosSemComissoes && pagamentosSemComissoes.length > 0) {
    // Alerta critico
    await fetch(Deno.env.get('WEBHOOK_ALERTA_CRITICO')!, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tipo: 'COMISSOES_NAO_CALCULADAS',
        quantidade: pagamentosSemComissoes.length,
        pagamentos: pagamentosSemComissoes.map(p => p.id),
        timestamp: new Date().toISOString()
      })
    });
  }
}

// Executar a cada 1 hora via CRON
Deno.cron('verificar-comissoes', '0 * * * *', verificarComissoesNaoCalculadas);
```

---

## ROLLBACK PLAN (SE ALGO DER ERRADO)

### Cenario 1: Webhook Stripe falha

```bash
# 1. Reativar webhook ASAAS imediatamente
# 2. Pausar webhook Stripe no dashboard
# 3. Investigar logs:
supabase functions logs webhook-stripe --tail

# 4. Corrigir problema
# 5. Re-testar em ambiente de staging
```

### Cenario 2: Comissoes calculadas incorretamente

```sql
-- 1. Identificar pagamentos afetados
SELECT id, valor, plano, stripe_payment_intent_id
FROM pagamentos
WHERE pago_em > '2025-11-19' -- Data da migracao
  AND stripe_payment_intent_id IS NOT NULL;

-- 2. Deletar comissoes incorretas
DELETE FROM comissoes
WHERE pagamento_id IN (SELECT id FROM pagamentos WHERE stripe_payment_intent_id IS NOT NULL);

-- 3. Recalcular manualmente
SELECT executar_calculo_comissoes(p.id)
FROM pagamentos p
WHERE p.stripe_payment_intent_id IS NOT NULL;
```

### Cenario 3: Stripe Connect nao esta transferindo comissoes

```bash
# 1. Verificar no Stripe Dashboard: Transfers
# 2. Verificar se contador completou onboarding:
stripe accounts retrieve acc_xxx

# 3. Se account.capabilities.transfers = "inactive":
#    Contador precisa completar onboarding
```

---

## CHECKLIST DE MIGRACAO

### Pre-Migracao
- [ ] Criar conta Stripe + Produtos (Pro/Premium/Top)
- [ ] Configurar Stripe Connect
- [ ] Criar migration: adicionar campos Stripe
- [ ] Criar Edge Function: webhook-stripe
- [ ] Configurar webhook no Stripe Dashboard
- [ ] Testar webhook Stripe em ambiente local
- [ ] Testar calculo de comissoes com dados Stripe

### Migracao
- [ ] Deploy Edge Function webhook-stripe (producao)
- [ ] Manter webhook ASAAS ativo (parallel testing)
- [ ] Migrar 1-2 contadores para Stripe Connect (piloto)
- [ ] Migrar 1-2 clientes para Stripe Subscriptions (piloto)
- [ ] Validar comissoes calculadas corretamente (comparar ASAAS vs Stripe)
- [ ] Migrar todos os contadores para Stripe Connect
- [ ] Migrar todos os clientes para Stripe Subscriptions
- [ ] Pausar webhook ASAAS
- [ ] Monitorar por 7 dias

### Pos-Migracao
- [ ] Criar dashboard de monitoramento (ASAAS vs Stripe)
- [ ] Configurar alertas de comissoes nao calculadas
- [ ] Criar CRON job de reconciliacao diaria
- [ ] Documentar processo de rollback
- [ ] Remover codigo ASAAS apos 30 dias de estabilidade

---

## VARIAVEIS DE AMBIENTE (ADICIONAR)

```bash
# .env (Edge Functions)

# Stripe
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
STRIPE_PRICE_PRO=price_xxx
STRIPE_PRICE_PREMIUM=price_xxx
STRIPE_PRICE_TOP=price_xxx

# Webhook Alerta Critico (Slack/Discord/Email)
WEBHOOK_ALERTA_CRITICO=https://hooks.slack.com/services/xxx
```

---

## PROXIMOS PASSOS

1. **Aprovar este plano de migracao**
2. **DEV 2 executa Fase 1** (Preparacao)
3. **Testes em paralelo** (Semana 2)
4. **Cutover** (Semana 3)
5. **Monitoramento** (Semana 4+)

---

## DUVIDAS? PONTOS DE ATENCAO?

Alguma parte da migracao nao ficou clara ou voce gostaria de modificar algo?

