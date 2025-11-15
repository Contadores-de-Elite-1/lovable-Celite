# Deploy Supabase - Cloud

Guia completo para deploy do backend Supabase em produção.

---

## 🎯 Overview

Deploy completo inclui:
1. **Database**: Migrations (schema + RLS)
2. **Edge Functions**: Serverless functions
3. **Secrets**: Chaves Stripe e webhooks
4. **Webhooks**: Configuração Stripe → Supabase

---

## 📋 Pré-requisitos

```bash
# 1. Supabase CLI instalado
npm install -g supabase

# 2. Projeto criado em cloud
# Acesse: https://supabase.com/dashboard

# 3. Git atualizado
git pull origin main
```

---

## 🚀 Deploy Step-by-Step

### Step 1: Link ao Projeto Cloud

```bash
# Link projeto local → cloud
supabase link --project-ref SEU_PROJECT_ID

# Verificar link
supabase status
```

**Onde encontrar PROJECT_ID:**
1. Acesse https://supabase.com/dashboard
2. Selecione seu projeto
3. Settings → General → Reference ID

---

### Step 2: Deploy Database Migrations

```bash
# Ver migrações pendentes
supabase db diff

# Push todas as migrações
supabase db push

# Verificar
supabase db pull
```

**O que será aplicado:**
- ✅ 20+ migrations (schema completo)
- ✅ Tabelas: profiles, contadores, clientes, comissoes, etc
- ✅ RLS policies (segurança)
- ✅ Triggers (auto-update, validations)
- ✅ Functions (calcular_comissoes, etc)
- ✅ Enums (nivel_contador, status_cliente, etc)

**Migr ações criadas:**
```
supabase/migrations/
├── 20240101000000_initial_schema.sql
├── 20240101000001_create_profiles.sql
├── 20240101000002_create_contadores.sql
├── ...
└── 20251115080000_remove_asaas_completely.sql
```

---

### Step 3: Deploy Edge Functions

```bash
# Deploy todas as functions
cd supabase/functions

# Deploy individual
supabase functions deploy stripe-webhook --no-verify-jwt
supabase functions deploy calcular-comissoes
supabase functions deploy processar-pagamento-comissoes
supabase functions deploy verificar-bonus-ltv
supabase functions deploy aprovar-comissoes

# Ou deploy tudo
for func in */; do
  supabase functions deploy ${func%/} --no-verify-jwt
done
```

**Functions deployadas:**
1. `stripe-webhook` - Recebe webhooks do Stripe
2. `calcular-comissoes` - Calcula comissões
3. `processar-pagamento-comissoes` - Processa pagamentos
4. `verificar-bonus-ltv` - Verifica bônus LTV
5. `aprovar-comissoes` - Aprova comissões

---

### Step 4: Configurar Secrets

```bash
# Stripe Keys (PRODUÇÃO)
supabase secrets set STRIPE_SECRET_KEY=sk_live_...
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...

# Verificar secrets
supabase secrets list
```

**Onde obter as chaves:**
1. Acesse https://dashboard.stripe.com
2. Developers → API keys
3. Copie "Secret key" (sk_live_...)
4. Webhooks → Add endpoint → Copie "Signing secret"

---

### Step 5: Configurar Stripe Webhook

**URL do webhook:**
```
https://SEU_PROJECT_REF.supabase.co/functions/v1/stripe-webhook
```

**Eventos para subscribe:**
- ✅ `checkout.session.completed`
- ✅ `customer.subscription.created`
- ✅ `customer.subscription.updated`
- ✅ `customer.subscription.deleted`
- ✅ `invoice.paid`
- ✅ `invoice.payment_failed`

**Steps:**
1. Acesse https://dashboard.stripe.com/webhooks
2. Click "Add endpoint"
3. Cole URL acima
4. Selecione eventos listados
5. Copie "Signing secret" (whsec_...)
6. Execute: `supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...`

---

### Step 6: Testar Edge Functions

```bash
# Testar localmente
supabase functions serve stripe-webhook

# Testar em produção
curl -X POST \
  https://SEU_PROJECT_REF.supabase.co/functions/v1/stripe-webhook \
  -H "Content-Type: application/json" \
  -d '{"test": true}'
```

---

## 🔍 Verificação Pós-Deploy

### 1. Database

```sql
-- Verificar tabelas
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public';

-- Verificar RLS
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE schemaname = 'public';

-- Verificar functions
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'public';
```

### 2. Edge Functions

```bash
# Ver logs das functions
supabase functions logs stripe-webhook --tail

# Status das functions
supabase functions list
```

### 3. Secrets

```bash
# Listar secrets (valores ocultos)
supabase secrets list
```

---

## 🔄 Atualizações Futuras

### Nova Migration

```bash
# 1. Criar migration local
supabase migration new nome_da_migration

# 2. Editar SQL
vim supabase/migrations/TIMESTAMP_nome_da_migration.sql

# 3. Testar local
supabase db reset

# 4. Push para cloud
supabase db push
```

### Atualizar Edge Function

```bash
# 1. Editar código
vim supabase/functions/nome-function/index.ts

# 2. Deploy
supabase functions deploy nome-function
```

### Atualizar Secrets

```bash
# Atualizar chave
supabase secrets set NOME_SECRET=novo_valor

# Remover secret
supabase secrets unset NOME_SECRET
```

---

## 🐛 Troubleshooting

### Migration falha

**Erro:** "relation already exists"

```sql
-- Usar IF NOT EXISTS
CREATE TABLE IF NOT EXISTS tabela_nome (...);
```

**Erro:** "RLS not enabled"

```bash
# Verificar RLS
supabase db pull

# Reaplicar
supabase db reset
supabase db push
```

### Function não responde

```bash
# Ver logs
supabase functions logs nome-function --tail

# Verificar secrets
supabase secrets list

# Redeploy
supabase functions deploy nome-function
```

### Webhook não chega

1. Verificar URL no Stripe dashboard
2. Verificar signing secret
3. Ver logs: `supabase functions logs stripe-webhook`
4. Testar com Stripe CLI: `stripe listen --forward-to URL`

---

## 📊 Monitoramento

### Database Performance

```sql
-- Queries lentas
SELECT query, calls, mean_exec_time
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;

-- Tamanho das tabelas
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### Function Metrics

Acesse Supabase Dashboard → Edge Functions → Metrics

- Invocations
- Errors
- Duration (p50, p95, p99)
- Memory usage

---

## 🔒 Segurança

### RLS Enabled

```sql
-- Verificar RLS em todas as tabelas
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';
```

Todas devem ter `rowsecurity = true`

### API Keys

- ✅ Use `anon` key no frontend
- ✅ Use `service_role` key APENAS em Edge Functions
- ✅ NUNCA exponha `service_role` key

### Secrets

- ✅ Armazene em Supabase Secrets
- ✅ NUNCA commite secrets no git
- ✅ Rotate secrets periodicamente

---

## 📝 Checklist Final

Deploy Supabase completo:

- [ ] Projeto linkado (`supabase link`)
- [ ] Migrations aplicadas (`supabase db push`)
- [ ] Edge Functions deployed
- [ ] Secrets configurados (Stripe)
- [ ] Webhook Stripe configurado
- [ ] RLS verificado
- [ ] Teste end-to-end (signup → checkout → webhook)
- [ ] Logs sem erros
- [ ] Monitoramento configurado

---

## 🚀 Quick Commands

```bash
# Deploy completo
supabase db push
supabase functions deploy stripe-webhook --no-verify-jwt
supabase secrets set STRIPE_SECRET_KEY=sk_live_...
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...

# Verificar
supabase status
supabase functions list
supabase secrets list

# Logs
supabase functions logs stripe-webhook --tail
```

---

## 📚 Recursos

- **Supabase Docs**: https://supabase.com/docs
- **CLI Reference**: https://supabase.com/docs/reference/cli
- **Edge Functions**: https://supabase.com/docs/guides/functions
- **Database**: https://supabase.com/docs/guides/database

---

**Deploy Supabase completo! ✅**

Próximo passo: Deploy do Frontend (ver DEPLOY-FRONTEND.md)
