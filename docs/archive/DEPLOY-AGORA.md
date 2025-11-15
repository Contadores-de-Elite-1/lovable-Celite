# ⚡ DEPLOY STRIPE AGORA - 3 COMANDOS

**Status:** ✅ TUDO PRONTO
**Branch:** `claude/auto-mode-mobile-first-011Qqu5wN96UmLxdioNTka61`

---

## 1️⃣ CONFIGURAR (1 minuto)

Abrir: https://supabase.com/dashboard/project/zytxwdgzjqrcmbnpgofj/settings/functions

Adicionar 3 variáveis:

```bash
STRIPE_SECRET_KEY=sk_test_...  # https://dashboard.stripe.com/apikeys
STRIPE_WEBHOOK_SECRET=whsec_... # (obter depois do passo 2)
STRIPE_PRICE_ID=price_...       # https://dashboard.stripe.com/products
```

---

## 2️⃣ DEPLOY (1 comando)

```bash
cd /home/user/lovable-Celite
./scripts/deploy-stripe.sh
```

**Isso faz TUDO:**
- ✅ Executa migrations (Stripe + remove ASAAS 100%)
- ✅ Deploy de 3 edge functions
- ✅ Valida configuração
- ✅ Mostra próximos passos

---

## 3️⃣ WEBHOOK STRIPE (1 minuto)

1. https://dashboard.stripe.com/webhooks → "Add endpoint"

2. URL:
```
https://zytxwdgzjqrcmbnpgofj.supabase.co/functions/v1/webhook-stripe
```

3. Eventos (marcar 6):
```
☑ checkout.session.completed
☑ customer.subscription.created
☑ customer.subscription.updated
☑ customer.subscription.deleted
☑ invoice.payment_succeeded
☑ invoice.payment_failed
```

4. Copiar "Signing secret" → Voltar no passo 1 → Adicionar `STRIPE_WEBHOOK_SECRET`

---

## ✅ PRONTO!

Testar:
```bash
./scripts/test-stripe-local.sh
```

Acessar:
```
https://seu-app.com/pagamentos
```

---

**🚀 DEPLOY EM 3 MINUTOS! GO!**
