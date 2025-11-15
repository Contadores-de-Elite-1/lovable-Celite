# 🛠️ Scripts de Deploy e Teste - Stripe Integration

Scripts auxiliares para facilitar o deploy, teste e validação da integração Stripe no **Contadores de Elite**.

## 📦 Arquivos

### 1. `deploy-stripe.sh` 🚀
**Deploy completo e automático da integração Stripe**

```bash
chmod +x deploy-stripe.sh
./deploy-stripe.sh
```

**O que faz:**
- ✅ Verifica instalação do Supabase CLI
- ✅ Valida login Supabase
- ✅ Executa migrations (pagamentos + clientes)
- ✅ Deploy das edge functions (create-checkout-session + webhook-stripe)
- ✅ Valida variáveis de ambiente
- ✅ Fornece instruções para configurar webhook no Stripe

**Pré-requisitos:**
- Supabase CLI instalado (`npm install -g supabase`)
- Login no Supabase (`supabase login`)
- Variáveis de ambiente configuradas no Supabase

---

### 2. `test-stripe-local.sh` 🧪
**Testes locais da integração Stripe**

```bash
chmod +x test-stripe-local.sh
./test-stripe-local.sh
```

**Testes executados:**
1. **Validação de Environment Variables**
   - Verifica se todas as env vars estão configuradas
   - Valida formato (sk_test_, whsec_, price_)
   - Testa conexão com Stripe API

2. **Verificação de Migrations**
   - Checa se as migrations foram aplicadas
   - Detecta migrations pendentes

3. **Teste de Create Checkout Session**
   - Cria uma sessão de checkout de teste
   - Retorna URL para testar no navegador
   - Valida resposta da edge function

4. **Teste de Webhook Endpoint**
   - Verifica se o webhook está protegido
   - Testa rejeição de requisições não assinadas

**Saída esperada:**
```
✓ Todas as variáveis configuradas corretamente!
✓ Migrations aplicadas
✓ Checkout session criada!
✓ Webhook está protegido
```

---

### 3. `verify-stripe-migrations.sql` 🔍
**SQL para verificar migrations no banco**

Execute no SQL Editor do Supabase:
https://supabase.com/dashboard/project/zytxwdgzjqrcmbnpgofj/sql/new

**O que verifica:**
1. ✅ Campos Stripe em `pagamentos`:
   - `stripe_payment_id`
   - `stripe_charge_id`
   - `moeda`
   - `metodo_pagamento`
   - `metadata`

2. ✅ Campos Stripe em `clientes`:
   - `stripe_customer_id`
   - `stripe_subscription_id`
   - `stripe_price_id`

3. ✅ Índices criados corretamente

4. ✅ Constraints UNIQUE

5. 📊 Estatísticas:
   - Clientes por gateway (Stripe/ASAAS/Ambos)
   - Pagamentos por gateway
   - Valores totais

**Resultado esperado:**
```
✅ Campos Stripe em pagamentos: OK
✅ Campos Stripe em clientes: OK
✅ Índices Stripe: OK
🎉 Se todos os checks estão OK, as migrations foram aplicadas corretamente!
```

---

## 🚀 Fluxo de Deploy Completo

### Passo 1: Configurar Variáveis de Ambiente

No Supabase Dashboard:
https://supabase.com/dashboard/project/zytxwdgzjqrcmbnpgofj/settings/functions

Adicionar:
```bash
STRIPE_SECRET_KEY=sk_test_...       # ou sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID=price_...
```

**Onde obter:**
- `STRIPE_SECRET_KEY`: https://dashboard.stripe.com/apikeys
- `STRIPE_WEBHOOK_SECRET`: https://dashboard.stripe.com/webhooks (após criar endpoint)
- `STRIPE_PRICE_ID`: https://dashboard.stripe.com/products (após criar produto)

---

### Passo 2: Executar Deploy

```bash
cd scripts
chmod +x deploy-stripe.sh
./deploy-stripe.sh
```

O script irá:
1. Validar instalação
2. Executar migrations
3. Deploy das functions
4. Verificar env vars
5. Fornecer instruções do webhook

---

### Passo 3: Configurar Webhook no Stripe

1. Abrir: https://dashboard.stripe.com/webhooks
2. Clicar "Add endpoint"
3. Endpoint URL:
   ```
   https://zytxwdgzjqrcmbnpgofj.supabase.co/functions/v1/webhook-stripe
   ```
4. Selecionar eventos:
   - ☑ `checkout.session.completed`
   - ☑ `customer.subscription.created`
   - ☑ `customer.subscription.updated`
   - ☑ `customer.subscription.deleted`
   - ☑ `invoice.payment_succeeded`
   - ☑ `invoice.payment_failed`

5. Copiar o "Signing secret" (whsec_...)
6. Adicionar como `STRIPE_WEBHOOK_SECRET`

---

### Passo 4: Testar

```bash
cd scripts
chmod +x test-stripe-local.sh
./test-stripe-local.sh
```

Verificar se todos os testes passam.

---

### Passo 5: Testar Fluxo End-to-End

1. Abrir o app: https://lovable-celite.com/pagamentos
2. Clicar em "Assinar com Stripe"
3. Usar cartão de teste:
   - Número: `4242 4242 4242 4242`
   - Validade: qualquer data futura
   - CVC: qualquer 3 dígitos

4. Completar checkout

5. Verificar logs:
   - Functions: https://supabase.com/dashboard/project/zytxwdgzjqrcmbnpgofj/functions
   - Stripe: https://dashboard.stripe.com/test/events

6. Verificar banco:
   ```sql
   -- Cliente criado?
   SELECT * FROM clientes
   WHERE stripe_customer_id IS NOT NULL
   ORDER BY created_at DESC LIMIT 1;

   -- Pagamento registrado?
   SELECT * FROM pagamentos
   WHERE stripe_payment_id IS NOT NULL
   ORDER BY created_at DESC LIMIT 1;

   -- Comissões calculadas?
   SELECT * FROM comissoes
   ORDER BY created_at DESC LIMIT 5;
   ```

---

## 🔧 Troubleshooting

### Erro: "Supabase CLI não encontrado"
```bash
npm install -g supabase
```

### Erro: "Not logged in"
```bash
supabase login
```

### Erro: "Environment variables missing"
Configure as variáveis no Supabase Dashboard:
https://supabase.com/dashboard/project/zytxwdgzjqrcmbnpgofj/settings/functions

### Erro: "Migration failed"
Execute manualmente via SQL Editor:
```bash
cat ../supabase/migrations/20251115070000_add_stripe_fields_to_clientes.sql
```
Cole no SQL Editor e execute.

### Erro: "Function deployment failed"
- Verifique se o código está correto
- Tente deploy via Dashboard manualmente
- Verifique logs: https://supabase.com/dashboard/project/zytxwdgzjqrcmbnpgofj/functions

### Webhook retorna 400/500
- Verifique `STRIPE_WEBHOOK_SECRET`
- Verifique se os 6 eventos estão selecionados no Stripe
- Veja logs da function `webhook-stripe`

---

## 📊 Comandos Úteis

### Ver logs das functions
```bash
supabase functions logs webhook-stripe --project-ref zytxwdgzjqrcmbnpgofj
supabase functions logs create-checkout-session --project-ref zytxwdgzjqrcmbnpgofj
```

### Testar webhook localmente com Stripe CLI
```bash
# Instalar Stripe CLI
# https://stripe.com/docs/stripe-cli

stripe login
stripe listen --forward-to https://zytxwdgzjqrcmbnpgofj.supabase.co/functions/v1/webhook-stripe

# Em outro terminal
stripe trigger checkout.session.completed
stripe trigger invoice.payment_succeeded
```

### Ver eventos no Stripe
```bash
stripe events list --limit 10
```

---

## ✅ Checklist de Produção

Antes de ativar em produção:

- [ ] **Variáveis de ambiente configuradas**
  - [ ] STRIPE_SECRET_KEY (sk_live_...)
  - [ ] STRIPE_WEBHOOK_SECRET
  - [ ] STRIPE_PRICE_ID

- [ ] **Migrations executadas**
  - [ ] add_stripe_fields_to_pagamentos
  - [ ] add_stripe_fields_to_clientes

- [ ] **Edge functions deployadas**
  - [ ] create-checkout-session
  - [ ] webhook-stripe
  - [ ] validate-stripe-env

- [ ] **Webhook configurado no Stripe**
  - [ ] URL correta
  - [ ] 6 eventos selecionados
  - [ ] Signing secret configurado

- [ ] **Testes realizados**
  - [ ] Checkout session criada
  - [ ] Pagamento processado
  - [ ] Cliente criado no banco
  - [ ] Pagamento registrado
  - [ ] Comissões calculadas

- [ ] **Monitoramento configurado**
  - [ ] Logs das functions
  - [ ] Alertas de erro
  - [ ] Métricas Stripe

---

## 📞 Suporte

**Logs:**
- Functions: https://supabase.com/dashboard/project/zytxwdgzjqrcmbnpgofj/functions
- Stripe Events: https://dashboard.stripe.com/events

**Documentação:**
- Stripe API: https://stripe.com/docs/api
- Supabase Edge Functions: https://supabase.com/docs/guides/functions
- Implementação completa: `../STRIPE-IMPLEMENTATION-COMPLETE.md`

---

**🎉 Boa sorte com o deploy! 🚀**
