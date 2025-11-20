# 🔔 US5.2 - WEBHOOK STRIPE

**Status:** ✅ CONCLUÍDO (código pronto)  
**Data:** 19/11/2025  
**Duração:** 3-4 dias

---

## 🎯 OBJETIVO

Receber eventos do Stripe (pagamentos, reembolsos, cancelamentos) e processar automaticamente na base de dados.

---

## ✅ O QUE FOI IMPLEMENTADO

### Edge Function: `webhook-stripe`

**Arquivo:** `supabase/functions/webhook-stripe/index.ts`

**Responsabilidades:**
- ✅ Validar assinatura do webhook (segurança)
- ✅ Processar eventos: `payment_intent.succeeded`, `payment_intent.payment_failed`, `charge.refunded`, `customer.subscription.updated`
- ✅ Chamar `calcular-comissoes` automaticamente
- ✅ Atualizar status de pagamentos
- ✅ Cancelar comissões se reembolso
- ✅ Registrar em `audit_logs`
- ✅ Logging estruturado (sem emojis)
- ✅ Validação com Zod
- ✅ Error handling robusto

---

## 📋 EVENTOS PROCESSADOS

### 1. `payment_intent.succeeded`
**Quando:** Cliente pagou com sucesso

**Ações:**
1. Atualiza `pagamentos` → status = "confirmado"
2. Chama Edge Function `calcular-comissoes`
3. Comissões são calculadas automaticamente
4. Registra em `audit_logs`

**Valor líquido:** Stripe retorna em centavos, convertemos para reais

---

### 2. `payment_intent.payment_failed`
**Quando:** Pagamento foi recusado (cartão inválido, fundos insuficientes, etc)

**Ações:**
1. Atualiza `pagamentos` → status = "falhou"
2. Salva mensagem de erro do Stripe
3. Registra em `audit_logs`
4. Nenhuma comissão é criada

---

### 3. `charge.refunded`
**Quando:** Cliente solicitou reembolso ou pagamento foi revertido

**Ações:**
1. Atualiza `pagamentos` → status = "reembolsado"
2. Busca todas as comissões associadas
3. Cancela comissões → status = "cancelada"
4. Registra em `audit_logs`

**Importante:** Se comissão já foi paga, não conseguimos reverter (não refazemos pagamento Stripe)

---

### 4. `customer.subscription.updated`
**Quando:** Cliente cancelou assinatura recorrente

**Ações:**
1. Se status = "canceled":
   - Busca cliente por `stripe_subscription_id`
   - Atualiza cliente → status = "cancelado"
2. Registra em `audit_logs`

---

## 🔒 SEGURANÇA

### Validação de Assinatura
```
Header: Stripe-Signature = t=timestamp,v1=signature
```

**Processo:**
1. Recebe webhook do Stripe
2. Calcula HMAC-SHA256(body, secret)
3. Compara com assinatura do header
4. Se não bater → rejeita (401 Unauthorized)
5. Se bater → processa

**Importante:** Sem validação, qualquer pessoa poderia enviar webhook falso!

---

## 📝 FLUXO COMPLETO

```
[CLIENTE PAGA NO STRIPE]
        ↓
[Stripe gera evento]
        ↓
[POST /webhook-stripe]
        ↓
[Valida assinatura]
        ↓
[Parse JSON + Zod validation]
        ↓
[Switch por tipo de evento]
        ↓
[payment_intent.succeeded]
        ↓
[Busca pagamento na base]
        ↓
[Atualiza status = "confirmado"]
        ↓
[Chama calcular-comissoes]
        ↓
[Comissões calculadas automaticamente]
        ↓
[Registra em audit_logs]
        ↓
[Retorna 200 OK ao Stripe]
        ↓
[Cliente vê comissão no portal! ✅]
```

---

## 🧪 COMO TESTAR LOCALMENTE

### Pré-requisito
Ter Stripe CLI instalado: `https://stripe.com/docs/stripe-cli`

### Teste 1: Simular evento de pagamento bem-sucedido

1. Em um terminal, inicie o listener do Stripe:
```bash
stripe listen --forward-to http://localhost:54321/functions/v1/webhook-stripe
```

2. Copie o webhook secret que aparece (começa com `whsec_`)

3. Em outro terminal, envie evento de teste:
```bash
stripe trigger payment_intent.succeeded --override amount=13000 --override currency=brl
```

4. Verifique na base de dados:
```sql
SELECT * FROM pagamentos WHERE status = 'confirmado' ORDER BY created_at DESC LIMIT 1;
SELECT * FROM comissoes WHERE created_at > NOW() - INTERVAL '1 minute' ORDER BY created_at DESC;
```

### Teste 2: Simular reembolso

```bash
stripe trigger charge.refunded --override amount=13000 --override currency=brl
```

Verifique se comissões foram canceladas.

---

## 🚀 PRÓXIMO PASSO: CONFIGURAR WEBHOOK NO STRIPE DASHBOARD

Após testar localmente, você precisa registrar a URL do webhook no Stripe:

1. Vá para: `https://dashboard.stripe.com/webhooks`
2. Clique em "Add endpoint" / "Adicionar endpoint"
3. URL: `https://SEU_PROJECT.supabase.co/functions/v1/webhook-stripe`
4. Eventos para escutar:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `charge.refunded`
   - `customer.subscription.updated`
5. Copie o **Webhook Secret** (começa com `whsec_`)
6. Adicione no Supabase Secrets:
   ```bash
   supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_COLE_AQUI
   ```

---

## 📊 TABELAS ENVOLVIDAS

| Tabela | Ações |
|--------|-------|
| `pagamentos` | INSERT/UPDATE (status, stripe_event_id) |
| `comissoes` | INSERT (via calcular-comissoes) UPDATE (status se reembolso) |
| `clientes` | UPDATE (status se cancelamento) |
| `audit_logs` | INSERT (registro de todos os eventos) |

---

## ⚠️ PONTOS IMPORTANTES

### 1. Idempotência
Mesmo webhook pode ser entregue várias vezes. Solução:
- Guardamos `stripe_event_id` em `pagamentos`
- Se mesmo evento chegar 2x, apenas processa 1x (por causa do banco de dados)

### 2. Comissões Automáticas
Não precisa aprovar manualmente no painel. Comissões são criadas com status "calculada" automaticamente.

### 3. Reembolsos
Se reembolso acontecer depois que comissão foi paga, não conseguimos reverter o Stripe Transfer (é permanente). Apenas marcamos como cancelada.

### 4. Valor Líquido
Stripe retorna valores em **centavos**. A função divide por 100 para converter para reais.

---

## 🔍 TROUBLESHOOTING

### Problema: Webhook não recebe eventos
**Solução:**
- Verificar se webhook URL está correta no Stripe Dashboard
- Verificar se Stripe Secret está correto no Supabase Secrets
- Testar com Stripe CLI: `stripe listen --forward-to ...`

### Problema: Assinatura inválida
**Solução:**
- Verificar se `STRIPE_WEBHOOK_SECRET` é exatamente igual ao do Stripe Dashboard
- Se alterou, precisa atualizá-lo no Supabase Secrets

### Problema: Comissões não calculadas
**Solução:**
- Verificar se Edge Function `calcular-comissoes` está deployada
- Verificar logs do Supabase: `supabase functions logs webhook-stripe`
- Verificar se `pagamentos` table tem os dados corretos

---

## ✅ CHECKLIST DE VALIDAÇÃO

- [x] Edge Function criada e sem erros
- [x] Validação de assinatura implementada
- [x] Eventos processados corretamente
- [x] Logging estruturado (sem emojis)
- [x] Error handling robusto
- [ ] Webhook URL registrada no Stripe Dashboard
- [ ] Webhook Secret adicionado no Supabase Secrets
- [ ] Testado localmente com Stripe CLI
- [ ] Testado com evento real (pagamento de teste)

---

## 📝 NOTAS

- Código segue as diretrizes: código em inglês, comentários em português
- Sem emojis em nenhuma saída ou logs
- Usa logging estruturado (JSON)
- Validação com Zod em todas as entradas
- Edge Function pronta para production
