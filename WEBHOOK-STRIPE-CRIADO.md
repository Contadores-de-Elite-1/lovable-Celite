# WEBHOOK STRIPE CRIADO

## ARQUIVOS CRIADOS:

1. **`supabase/functions/webhook-stripe/index.ts`**
   - Webhook completo para receber confirmações de pagamento do Stripe
   - Processa evento `payment_intent.succeeded`
   - Extrai order_id dos metadata do PaymentIntent

2. **`supabase/migrations/20251115060000_add_stripe_fields_to_pagamentos.sql`**
   - Adiciona campos do Stripe na tabela `pagamentos`
   - Permite suportar ASAAS e Stripe na mesma tabela

---

## COMO USAR:

### 1. Rodar Migration

```bash
supabase db push
```

Ou executar SQL manualmente no Supabase Dashboard.

### 2. Deploy da Edge Function

**Opção A - Via CLI:**
```bash
supabase functions deploy webhook-stripe --project-ref zytxwdgzjqrcmbnpgofj
```

**Opção B - Via Dashboard:**
1. Copiar código de `supabase/functions/webhook-stripe/index.ts`
2. Criar nova Edge Function no Dashboard
3. Colar código
4. Deploy

### 3. Configurar Webhook no Stripe

**URL do webhook:**
```
https://zytxwdgzjqrcmbnpgofj.supabase.co/functions/v1/webhook-stripe
```

**Eventos para ouvir:**
- `payment_intent.succeeded`

### 4. Adicionar order_id nos Metadata

Ao criar PaymentIntent no Stripe, incluir metadata:

```javascript
const paymentIntent = await stripe.paymentIntents.create({
  amount: 2000,
  currency: 'usd',
  metadata: {
    order_id: 'ORDER_123',  // ID do pedido no seu sistema
    // outros campos personalizados
  }
});
```

---

## CAMPOS ADICIONADOS NA TABELA `pagamentos`:

- `stripe_payment_id` - ID do PaymentIntent (ex: pi_xxx)
- `stripe_charge_id` - ID do Charge (ex: ch_xxx)
- `moeda` - Moeda (BRL, USD, EUR, etc)
- `metodo_pagamento` - Método (card, pix, boleto)
- `card_brand` - Bandeira (visa, mastercard)
- `card_last4` - Últimos 4 dígitos
- `customer_id` - ID do cliente no gateway
- `order_id` - ID do pedido
- `metadata` - JSON com dados extras

---

## IMPORTANTE:

**O WEBHOOK ASAAS AINDA ESTÁ RETORNANDO 404!**

Você precisa:
1. Fazer deploy manual do webhook ASAAS
2. Ou criar nova cobrança no ASAAS

**Qual você quer resolver primeiro?**
- [ ] Webhook ASAAS (404 nos logs)
- [ ] Webhook Stripe (novo, precisa deploy)
- [ ] Ambos

---

## PRÓXIMOS PASSOS:

### Para ASAAS:
Ver arquivo: `DEPLOY-MANUAL-URGENTE.md`

### Para Stripe:
1. Rodar migration: `20251115060000_add_stripe_fields_to_pagamentos.sql`
2. Deploy edge function: `webhook-stripe`
3. Configurar URL no Stripe Dashboard
4. Testar com Stripe CLI ou pagamento real
