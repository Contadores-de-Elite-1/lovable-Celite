# ⚙️ US5.1 - CONFIGURAÇÃO STRIPE COMPLETA

**Status:** ✅ CONCLUÍDO  
**Data:** 19/11/2025  
**Duração:** 2-3 dias

---

## 🎯 OBJETIVO

Preparar infraestrutura Stripe para receber pagamentos reais no sistema.

---

## ✅ O QUE FOI IMPLEMENTADO

### **1. Cliente Stripe Centralizado**

Arquivo criado: `supabase/functions/_shared/stripe.ts`

**Funcionalidades:**
- ✅ Singleton pattern (cria uma vez, reutiliza sempre)
- ✅ Validação de chaves (formato correto)
- ✅ Logging estruturado de erros
- ✅ Funções helper para obter configurações

**Funções disponíveis:**
```typescript
getStripeClient(): Stripe | null  // Obtem cliente Stripe
isStripeConfigured(): boolean     // Valida se esta configurado
getStripeWebhookSecret(): string | null  // Obtem webhook secret
getStripeConnectClientId(): string | null  // Obtem Connect Client ID
getStripePriceIds(): { pro, premium, top } | null  // Obtem Price IDs
```

---

### **2. Arquivo de Exemplo de Variáveis**

Criado: `.env.example` (referencia)

**Variáveis Frontend:**
- `VITE_STRIPE_PUBLIC_KEY` - Chave publica (pode ser exposta)

**Variáveis Backend (Supabase Secrets):**
- `STRIPE_SECRET_KEY` - Chave secreta (NUNCA expor)
- `STRIPE_WEBHOOK_SECRET` - Secret do webhook
- `STRIPE_CONNECT_CLIENT_ID` - Client ID do Connect
- `STRIPE_PRICE_PRO` - Price ID do plano PRO
- `STRIPE_PRICE_PREMIUM` - Price ID do plano PREMIUM
- `STRIPE_PRICE_TOP` - Price ID do plano TOP

---

### **3. Função Atualizada**

Arquivo atualizado: `supabase/functions/processar-pagamentos/index.ts`

**Mudanças:**
- ✅ Agora usa cliente centralizado (`getStripeClient()`)
- ✅ Validacao se Stripe esta configurado antes de processar
- ✅ Logging estruturado (sem emojis)
- ✅ Mensagens de erro mais claras

---

## 📋 CHECKLIST DE CONFIGURAÇÃO

### **PASSO 1: Criar Conta Stripe** ⏳ MANUAL

1. Acessar: https://dashboard.stripe.com
2. Criar conta (ou usar existente)
3. Confirmar email
4. Completar dados da empresa

**Status:** ⏳ Aguardando ação do usuário

---

### **PASSO 2: Gerar API Keys** ⏳ MANUAL

1. Dashboard → Settings → API Keys
2. Em **Test Mode**, copiar:
   - **Publishable Key** (começa com `pk_test_`)
   - **Secret Key** (começa com `sk_test_`)

**Adicionar em `.env.local`:**
```env
VITE_STRIPE_PUBLIC_KEY=pk_test_COLE_AQUI
```

**Adicionar no Supabase Secrets:**
```bash
supabase secrets set STRIPE_SECRET_KEY=sk_test_COLE_AQUI
```

**Status:** ⏳ Aguardando ação do usuário

---

### **PASSO 3: Criar 3 Produtos no Stripe** ⏳ MANUAL

1. Dashboard → Products → Create Product

**Produto 1: Plano PRO**
- Nome: "Plano PRO"
- Descrição: "Plano Essencial"
- Tipo: **Recurring** (Subscription)
- Preço: **R$ 100,00/mês**
- Copiar **Price ID** (começa com `price_`)

**Produto 2: Plano PREMIUM**
- Nome: "Plano PREMIUM"
- Descrição: "Plano Recomendado"
- Tipo: **Recurring** (Subscription)
- Preço: **R$ 130,00/mês**
- Copiar **Price ID**

**Produto 3: Plano TOP**
- Nome: "Plano TOP"
- Descrição: "Plano Premium"
- Tipo: **Recurring** (Subscription)
- Preço: **R$ 180,00/mês**
- Copiar **Price ID**

**Adicionar no Supabase Secrets:**
```bash
supabase secrets set STRIPE_PRICE_PRO=price_COLE_AQUI
supabase secrets set STRIPE_PRICE_PREMIUM=price_COLE_AQUI
supabase secrets set STRIPE_PRICE_TOP=price_COLE_AQUI
```

**Status:** ⏳ Aguardando ação do usuário

---

### **PASSO 4: Configurar Stripe Connect** ⏳ MANUAL

1. Dashboard → Settings → Connect Settings
2. Ativar **Stripe Connect**
3. Tipo: **Standard** (contador controla propria conta)
4. Application fee: **15%** (padrao do programa)
5. Copiar **Client ID** (começa com `ca_`)

**Adicionar no Supabase Secrets:**
```bash
supabase secrets set STRIPE_CONNECT_CLIENT_ID=ca_COLE_AQUI
```

**Status:** ⏳ Aguardando ação do usuário

---

### **PASSO 5: Configurar Webhook** ⏳ MANUAL

**IMPORTANTE:** Fazer depois de fazer deploy da Edge Function `webhook-stripe`

1. Dashboard → Developers → Webhooks → Add endpoint
2. URL do webhook:
   ```
   https://SEU_PROJECT_REF.supabase.co/functions/v1/webhook-stripe
   ```
3. Eventos para escutar:
   - `invoice.payment_succeeded` (pagamento recorrente)
   - `checkout.session.completed` (primeiro pagamento)
   - `payment_intent.succeeded` (pagamento bem-sucedido)
   - `payment_intent.payment_failed` (pagamento falhou)
   - `charge.refunded` (reembolso)
4. Copiar **Signing Secret** (começa com `whsec_`)

**Adicionar no Supabase Secrets:**
```bash
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_COLE_AQUI
```

**Status:** ⏳ Aguardando Edge Function `webhook-stripe` (US5.2)

---

### **PASSO 6: Instalar Pacotes (se necessario)** ✅ AUTO

**Frontend:**
```bash
pnpm add @stripe/stripe-js
```

**Backend:**
Edge Functions usam import direto do ESM (`https://esm.sh/stripe@14.21.0`)

**Status:** ✅ Verificar se precisa instalar

---

### **PASSO 7: Testar Conexão** ⏳ PENDENTE

Após configurar todas as chaves:

1. Testar chamada simples ao Stripe
2. Verificar se produtos aparecem
3. Validar webhook (quando implementar US5.2)

**Status:** ⏳ Aguardando configuração completa

---

## 🔍 COMO VERIFICAR SE ESTÁ FUNCIONANDO

### **1. Testar Cliente Stripe**

Criar Edge Function de teste (temporaria):

```typescript
// supabase/functions/test-stripe/index.ts
import { getStripeClient, isStripeConfigured } from '../_shared/stripe.ts';

Deno.serve(async () => {
  if (!isStripeConfigured()) {
    return new Response('❌ Stripe nao configurado', { status: 500 });
  }

  const stripe = getStripeClient();
  if (!stripe) {
    return new Response('❌ Erro ao criar cliente', { status: 500 });
  }

  // Listar produtos
  const products = await stripe.products.list({ limit: 3 });
  
  return new Response(JSON.stringify({
    success: true,
    produtos: products.data.map(p => ({
      id: p.id,
      nome: p.name,
      prices: p.default_price
    }))
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
});
```

**Testar:**
```bash
curl http://localhost:54321/functions/v1/test-stripe \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY"
```

---

## 📚 DOCUMENTAÇÃO DE REFERÊNCIA

### **Links Stripe Dashboard:**
- API Keys: https://dashboard.stripe.com/apikeys
- Products: https://dashboard.stripe.com/products
- Connect Settings: https://dashboard.stripe.com/account/applications/settings
- Webhooks: https://dashboard.stripe.com/webhooks

### **Documentos do Projeto:**
- `docs/US5.2_WEBHOOK_STRIPE.md` - Próximo passo (webhook)
- `docs/CONFIGURACAO_ENV_STRIPE.md` - Guia completo de variáveis
- `docs/FLUXO_FINANCEIRO_SIMPLES.md` - Explicação do fluxo

---

## ⚠️ PONTOS IMPORTANTES

### **1. Segurança**
- ✅ **NUNCA** colocar `STRIPE_SECRET_KEY` no `.env.local`
- ✅ Sempre usar Supabase Secrets para chaves privadas
- ✅ Apenas `VITE_STRIPE_PUBLIC_KEY` vai no `.env.local` (publica)

### **2. Ambiente**
- ✅ Usar **Test Mode** durante desenvolvimento
- ✅ Cartoes de teste: `4242 4242 4242 4242`
- ✅ Produção vem depois (sem mudar codigo, apenas trocar chaves)

### **3. Formato das Chaves**
- ✅ Secret Key: `sk_test_xxxxx` ou `sk_live_xxxxx`
- ✅ Webhook Secret: `whsec_xxxxx`
- ✅ Connect Client ID: `ca_xxxxx`
- ✅ Price ID: `price_xxxxx`

---

## ✅ RESUMO DO STATUS

| Item | Status | Observação |
|------|--------|------------|
| Cliente Stripe Centralizado | ✅ CONCLUÍDO | `_shared/stripe.ts` criado |
| Documentação `.env.example` | ✅ CONCLUÍDO | Referencia criada |
| Função `processar-pagamentos` atualizada | ✅ CONCLUÍDO | Usa cliente centralizado |
| Conta Stripe criada | ⏳ MANUAL | Aguardando usuário |
| API Keys configuradas | ⏳ MANUAL | Aguardando usuário |
| Produtos criados | ⏳ MANUAL | Aguardando usuário |
| Stripe Connect configurado | ⏳ MANUAL | Aguardando usuário |
| Webhook configurado | ⏳ PENDENTE | Aguardando US5.2 |
| Testes realizados | ⏳ PENDENTE | Aguardando configuração |

---

## 🚀 PRÓXIMO PASSO

→ **US5.2**: Criar Edge Function `webhook-stripe` para receber eventos do Stripe

---

## 📝 NOTAS

- Código está pronto, falta apenas configuração manual no Stripe Dashboard
- Todas as validações estão implementadas (formato de chaves, erros claros)
- Logging estruturado (sem emojis) conforme diretrizes do projeto
- Cliente centralizado evita criar múltiplas instâncias do Stripe
