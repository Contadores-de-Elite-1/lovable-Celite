# ⚙️ US5.1 - SETUP STRIPE

**Status:** 🔄 EM PROGRESSO  
**Data:** 19/11/2025  
**Duração:** 2-3 dias

---

## 🎯 OBJETIVO

Preparar infraestrutura Stripe para receber pagamentos reais.

---

## ✅ CHECKLIST

### **PASSO 1: Criar conta Stripe**
- [ ] Acessar https://dashboard.stripe.com
- [ ] Criar conta (ou usar existente)
- [ ] Confirmar email
- [ ] Dados da empresa

### **PASSO 2: Gerar API Keys**
- [ ] Dashboard → Settings → API Keys
- [ ] Copiar Publishable Key (público)
- [ ] Copiar Secret Key (guardar seguro)
- [ ] Salvar em `.env.local`:
```
VITE_STRIPE_PUBLIC_KEY=pk_test_xxxxx
STRIPE_SECRET_KEY=sk_test_xxxxx
```

### **PASSO 3: Criar 3 Produtos**
- [ ] Pricing → Create Product
- [ ] **Produto 1: Plano PRO**
  - Nome: "Plano PRO"
  - Descrição: "Essencial"
  - Tipo: Recorrente (Subscription)
  - Preço: R$ 110/mês
  - Salvar Price ID: `price_pro_xxx`

- [ ] **Produto 2: Plano PREMIUM**
  - Nome: "Plano PREMIUM"
  - Descrição: "Recomendado"
  - Tipo: Recorrente
  - Preço: R$ 130/mês
  - Salvar Price ID: `price_premium_xxx`

- [ ] **Produto 3: Plano TOP**
  - Nome: "Plano TOP"
  - Descrição: "Premium"
  - Tipo: Recorrente
  - Preço: R$ 180/mês
  - Salvar Price ID: `price_top_xxx`

### **PASSO 4: Configurar Stripe Connect**
- [ ] Settings → Connect Settings
- [ ] Ativar Connect
- [ ] Tipo: Standard (contador controla própria conta)
- [ ] Application fee percent: 15%
- [ ] Copiar Client ID: `ca_test_xxxxx`
- [ ] Salvar em `.env.local`:
```
STRIPE_CONNECT_CLIENT_ID=ca_test_xxxxx
```

### **PASSO 5: Configurar Webhook**
- [ ] Developers → Webhooks → Add endpoint
- [ ] URL do webhook:
```
https://seu-supabase-project.supabase.co/functions/v1/webhook-stripe
```
- [ ] Eventos para escutar:
  - `invoice.payment_succeeded`
  - `checkout.session.completed`
- [ ] Copiar Signing Secret: `whsec_test_xxxxx`
- [ ] Salvar em `.env.local`:
```
STRIPE_WEBHOOK_SECRET=whsec_test_xxxxx
```

### **PASSO 6: Atualizar `.env.local`**
Seu arquivo deve conter:
```env
# STRIPE KEYS
VITE_STRIPE_PUBLIC_KEY=pk_test_xxxxx
STRIPE_SECRET_KEY=sk_test_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_test_xxxxx
STRIPE_CONNECT_CLIENT_ID=ca_test_xxxxx

# STRIPE PRICE IDs
STRIPE_PRICE_PRO=price_pro_xxx
STRIPE_PRICE_PREMIUM=price_premium_xxx
STRIPE_PRICE_TOP=price_top_xxx
```

### **PASSO 7: Configurar Supabase Secrets**
```bash
# CLI do Supabase
supabase secrets set STRIPE_SECRET_KEY=sk_test_xxxxx
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_test_xxxxx
supabase secrets set STRIPE_CONNECT_CLIENT_ID=ca_test_xxxxx
supabase secrets set STRIPE_PRICE_PRO=price_pro_xxx
supabase secrets set STRIPE_PRICE_PREMIUM=price_premium_xxx
supabase secrets set STRIPE_PRICE_TOP=price_top_xxx
```

### **PASSO 8: Instalar Stripe SDK (se necessário)**
```bash
pnpm add stripe
pnpm add @stripe/stripe-js
```

### **PASSO 9: Teste de Conexão**
- [ ] Acessar Stripe Dashboard
- [ ] Verificar se produtos aparecem
- [ ] Testar chamada API simples
- [ ] Confirmar webhooks estão configurados

---

## ✨ RESULTADO

Após completar todos os passos:
- ✅ Conta Stripe criada e configurada
- ✅ API keys geradas e armazenadas
- ✅ 3 produtos criados (PRO, PREMIUM, TOP)
- ✅ Stripe Connect ativado
- ✅ Webhook configurado
- ✅ Secrets em Supabase

---

## 🚀 PRÓXIMO PASSO

→ **US5.2**: Criar Edge Function `webhook-stripe`

---

## 📝 NOTAS

- Estamos usando **sandbox** (modo teste)
- Cartões de teste: `4242 4242 4242 4242`
- Production vem depois (sem mudança de código)
- Guardar secrets com segurança!

