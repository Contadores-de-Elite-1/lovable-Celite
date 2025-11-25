# 🔐 CONFIGURAÇÃO - VARIÁVEIS DE AMBIENTE STRIPE

Após completar **US5.1**, você precisa adicionar estas variáveis em `.env.local`:

---

## 📝 VARIÁVEIS NECESSÁRIAS

### **Frontend (.env.local)**
```env
VITE_STRIPE_PUBLIC_KEY=pk_test_xxxxx
```
- Origem: Stripe Dashboard → Settings → API Keys → Publishable Key
- Visibilidade: Pública (será vista no HTML)
- Uso: Inicializar Stripe.js no frontend

---

### **Backend (Secrets do Supabase)**
```
STRIPE_SECRET_KEY=sk_test_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_test_xxxxx
STRIPE_CONNECT_CLIENT_ID=ca_test_xxxxx
```
- Origem: Stripe Dashboard
- Visibilidade: Privada (guardar seguro!)
- Uso: Edge Functions
- Como adicionar:
```bash
supabase secrets set STRIPE_SECRET_KEY=sk_test_xxxxx
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_test_xxxxx
supabase secrets set STRIPE_CONNECT_CLIENT_ID=ca_test_xxxxx
```

---

### **Price IDs (Stripe Products)**
Adicionar em `.env.local`:
```env
STRIPE_PRICE_PRO=price_1PrXxXXXXXXXXXXX
STRIPE_PRICE_PREMIUM=price_1PrYyYyYyYyYyYyY
STRIPE_PRICE_TOP=price_1PrZzZzZzZzZzZzZ
```
- Origem: Stripe Dashboard → Pricing → Cada produto
- Clique no produto → Copiar Price ID
- Uso: Referenciar ao criar Checkout Session

---

## 🔍 ONDE ENCONTRAR CADA VALOR

### **1. Publishable Key & Secret Key**
1. Acessar: https://dashboard.stripe.com/apikeys
2. Environment: **Test Mode** (não Production!)
3. Copiar valores

### **2. Webhook Secret**
1. Acessar: https://dashboard.stripe.com/webhooks
2. Clique no endpoint `/webhook-stripe`
3. Clique em "Signing Secret"
4. Copiar (começará com `whsec_`)

### **3. Connect Client ID**
1. Acessar: https://dashboard.stripe.com/account/applications/settings
2. Procurar "OAuth" ou "Connect"
3. Copiar "Client ID"

### **4. Price IDs**
1. Acessar: https://dashboard.stripe.com/products
2. Clique em cada produto (PRO, PREMIUM, TOP)
3. Seção "Pricing" → Copiar Price ID

---

## ✅ VERIFICAR SE ESTÁ CORRETO

```bash
# 1. Testar se Stripe pode ser inicializado
npm run dev

# 2. Abrir DevTools (F12) → Console
# Deve aparecer sem erros

# 3. Testar secret key (em Edge Function)
# Se retornar erro, secret key está errado
```

---

## ⚠️ SEGURANÇA

- ❌ NUNCA commitar `.env.local`
- ✅ Usar `.gitignore` (já deve estar)
- ✅ Guardar secrets com segurança
- ✅ Se vazar, regenerar keys no Stripe

---

## 📋 CHECKLIST

- [ ] VITE_STRIPE_PUBLIC_KEY em `.env.local`
- [ ] STRIPE_SECRET_KEY em Supabase Secrets
- [ ] STRIPE_WEBHOOK_SECRET em Supabase Secrets
- [ ] STRIPE_CONNECT_CLIENT_ID em Supabase Secrets
- [ ] STRIPE_PRICE_PRO em `.env.local`
- [ ] STRIPE_PRICE_PREMIUM em `.env.local`
- [ ] STRIPE_PRICE_TOP em `.env.local`
- [ ] Testei e funcionou ✅

---

**Próximo:** US5.2 - Criar Edge Function `webhook-stripe`



