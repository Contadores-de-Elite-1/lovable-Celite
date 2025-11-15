# 🎯 PLANO DE MIGRAÇÃO COMPLETA: ASAAS → STRIPE

**Data:** 15 de novembro de 2025
**Objetivo:** Migração total do gateway de pagamentos ASAAS para STRIPE
**Tipo:** Migração completa (não é remendo!)

---

## 📊 ANÁLISE COMPLETA REALIZADA

**Total de arquivos com referências ASAAS:** **175 arquivos**

### Distribuição:
- **Código crítico:** 9 arquivos
- **Testes e scripts:** 50+ arquivos
- **Documentação:** 60+ arquivos
- **Workflows CI/CD:** 6 arquivos
- **Outros:** 50+ arquivos

---

## 🎯 ESTRATÉGIA DE MIGRAÇÃO

### FASE 1: CÓDIGO CRÍTICO (PRIORIDADE MÁXIMA)
**Tempo estimado:** 2-3 horas

#### 1.1 Edge Functions (3 arquivos)
**A REMOVER:**
- ❌ `supabase/functions/webhook-asaas/index.ts`
- ❌ `supabase/functions/webhook-asaas/index.production.ts`
- ❌ `supabase/functions/asaas-client/index.ts`

**A MANTER:**
- ✅ `supabase/functions/webhook-stripe/index.ts` (JÁ EXISTE)

**AÇÃO:**
- Deletar pastas completas
- Remover de `supabase/config.toml`

#### 1.2 Frontend (3 arquivos)
**A REMOVER:**
- ❌ `src/lib/asaas-client.ts` (123 linhas)

**A MODIFICAR:**
- 🔄 `src/pages/Pagamentos.tsx` (remover imports e lógica ASAAS)
- 🔄 `src/components/PaymentHistory.tsx` (remover referências asaas_payment_id)

**AÇÃO:**
- Criar `src/lib/stripe-client.ts` (novo)
- Atualizar páginas para usar Stripe
- Remover imports do asaas-client

#### 1.3 Banco de Dados (4 migrations)
**CAMPOS A DEPRECAR (não deletar ainda):**
- `clientes.asaas_customer_id`
- `clientes.asaas_subscription_id`
- `pagamentos.asaas_payment_id`
- `pagamentos.asaas_event_id`

**AÇÃO:**
- Criar migration que comenta campos como obsoletos
- Adicionar comentário: "DEPRECATED - Migrado para Stripe"
- Não deletar dados (pode ter histórico)

---

### FASE 2: IMPLEMENTAÇÃO STRIPE (PRIORIDADE ALTA)
**Tempo estimado:** 3-4 horas

#### 2.1 Variáveis de Ambiente
**CRIAR NO SUPABASE:**
```bash
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID=price_...  # ID do plano mensal
STRIPE_SUCCESS_URL=https://...
STRIPE_CANCEL_URL=https://...
```

#### 2.2 Novos Eventos Stripe (webhook)
**EXPANDIR webhook-stripe/index.ts para tratar:**
- ✅ `payment_intent.succeeded` (JÁ IMPLEMENTADO)
- 🆕 `checkout.session.completed`
- 🆕 `customer.subscription.created`
- 🆕 `customer.subscription.updated`
- 🆕 `customer.subscription.deleted`
- 🆕 `invoice.payment_succeeded`
- 🆕 `invoice.payment_failed`

#### 2.3 Criar Checkout Session
**NOVO ARQUIVO:** `supabase/functions/create-checkout-session/index.ts`

**Funcionalidade:**
- Recebe: `contador_id`, `price_id`, `success_url`, `cancel_url`
- Cria sessão de checkout no Stripe
- Salva metadata: `contador_id`, `order_id`
- Retorna: `sessionId` e `url` do checkout

#### 2.4 Adaptar Cálculo de Comissões
**MODIFICAR:** `supabase/functions/calcular-comissoes/index.ts`

**Mudanças:**
- Aceitar payload do Stripe (não ASAAS)
- Ler campos `stripe_*` do banco
- Disparar no evento `invoice.payment_succeeded`

---

### FASE 3: LIMPEZA MASSIVA (PRIORIDADE MÉDIA)
**Tempo estimado:** 1-2 horas

#### 3.1 Deletar Testes ASAAS (50+ arquivos)
**ARQUIVOS A DELETAR:**
```bash
test-baby-step-*.mjs
test-cloud-*.mjs
test-e2e-*.mjs
test-full-scenario.mjs
test-manual-webhook.mjs
test-real-now.mjs
test-webhook-*.mjs
simulate-payment*.mjs
auto-simulate.mjs
create-cliente-cloud.mjs
configurar-webhook-asaas.mjs
gerenciar-webhooks-asaas.mjs
fresh-payment-test.mjs
verify-*.mjs
check-*.mjs
diagnostico.mjs
verificar-sistema-completo.mjs
scripts/teste-automatico-completo.*
scripts/testar-webhook-manual.sh
scripts/setup-teste-completo.js
docs/testes/criar-cobranca-asaas.html
docs/testes/*.mjs
```

**AÇÃO:** Deletar todos de uma vez

#### 3.2 Deletar Documentação ASAAS (60+ arquivos)
**ARQUIVOS A DELETAR:**
```bash
ASAAS_WEBHOOK_DOCUMENTATION.md
WEBHOOK-ASAAS-GUIA.md
VERIFICAR-WEBHOOK-ASAAS.md
ANALISE_COMPLETA_WEBHOOK_ASAAS_DIAGNOSTICO.md
VER-LOGS-ASAAS-DETALHADO.sql
docs/testes/INSTRUCOES-MANUAIS-ASAAS.md
docs/testes/TESTE-FINAL-ASAAS.md
docs/testes/RESUMO-*.md
docs/testes/RELATORIO-*.md
docs/testes/SOLUCOES-ALTERNATIVAS-403.md
docs/testes/DIAGNOSTICO-*.md
docs/testes/ATUALIZACAO-*.md
docs/testes/GUIA-DASHBOARD-PASSO-A-PASSO.md
docs/testes/testes-integracao.md
docs/testes/verificar-e-criar-cliente.mjs
DEPLOY-WEBHOOK-V3.md
DEPLOY-MANUAL-URGENTE.md
DEPLOY-NOW.md
DEPLOY_ONLINE_AGORA.md
DEPLOY-AUTOMATICO-STATUS.md
DIAGNOSTICO-*.sql
DEBUG-*.sql
SQL-VERIFICAR-*.sql
VERIFICAR-*.sql
VERIFICAR-*.md
WEBHOOK_DIAGNOSTICO.md
WEBHOOK_FIX_SUMMARY.md
RESUMO-FINAL-WEBHOOKS.md
RECONHECIMENTO-BRUTAL.md
FERRAMENTAS-WEBHOOK-README.md
PLANO-VALIDACAO-EXECUCAO.md
SOLUCAO-DEFINITIVA.md
SECRETS-NECESSARIOS.md
STATUS-*.md
EXECUTAR-*.md
EXECUTE-*.md
EXECUTAR-ISTO.sql
COMECE-AQUI.md
CRIAR-CLIENTE-AGORA.md
PRONTO_PARA_USAR.md
O-QUE-FAZER-AGORA.md
ANALISE-TECNICA-COMPLETA.md
GUIA_PRATICO_CORRECAO_WEBHOOK.md
INSTRUCOES_FINAIS.md
webhook-config.json
cliente-payload.json
scenario-data.json
cloud-scenario-data.json
e2e-new-test.json
```

**AÇÃO:** Criar script bash para deletar todos

#### 3.3 Limpar Scripts Bash (10+ arquivos)
**ARQUIVOS A DELETAR:**
```bash
test-local-simples.sh
TESTE-WEBHOOK-MANUAL.sh
deploy-tudo-automatico.sh
verificar-e-continuar.sh
validate-backend.sh
scripts/auto-run-e2e-tests.sh
supabase/scripts/diagnose-and-start.sh
supabase/scripts/run-e2e-local.sh
supabase/scripts/run-mock-test-complete.sh
supabase/scripts/test-17-bonus-journey.sh
supabase/scripts/test-e2e-complete.sh
supabase/scripts/test-mock-webhook.sh
```

#### 3.4 Revisar Workflows GitHub
**ARQUIVOS A REVISAR:**
```bash
.github/workflows/deploy-simples.yml
.github/workflows/deploy-webhook-only.yml
.github/workflows/test-simple.yml
.github/workflows/deploy-to-cloud.yml
.github/workflows/e2e-cloud-tests.yml
.github/workflows/e2e-tests.yml
```

**AÇÃO:**
- Remover workflows relacionados ao ASAAS
- Manter apenas workflows genéricos

---

### FASE 4: DOCUMENTAÇÃO (PRIORIDADE MÉDIA)
**Tempo estimado:** 1 hora

#### 4.1 Atualizar CLAUDE.md
**REMOVER:**
- Toda seção "Asaas Integration"
- Referências a asaas_customer_id, asaas_payment_id
- Variáveis de ambiente ASAAS

**ADICIONAR:**
- Seção "Stripe Integration"
- Documentar eventos Stripe
- Documentar checkout flow
- Documentar webhook Stripe

#### 4.2 Criar STRIPE-INTEGRATION-GUIDE.md
**CONTEÚDO:**
- Configuração completa do Stripe
- Fluxo de checkout
- Eventos e webhooks
- Cálculo de comissões
- Testes

#### 4.3 Atualizar README.md
**REMOVER:** Menções ao ASAAS
**ADICIONAR:** Stripe como gateway oficial

---

### FASE 5: FRONTEND COMPLETO (PRIORIDADE ALTA)
**Tempo estimado:** 2-3 horas

#### 5.1 Criar stripe-client.ts
**ARQUIVO:** `src/lib/stripe-client.ts`

**Funcionalidades:**
- `createCheckoutSession(contadorId, priceId)` → URL do checkout
- `getCustomerPortalUrl(customerId)` → URL do portal
- `getSubscriptionStatus(subscriptionId)` → Status da assinatura

#### 5.2 Atualizar Pagamentos.tsx
**MUDANÇAS:**
- Remover import de `asaas-client`
- Importar `stripe-client`
- Botão "Assinar" → redireciona para Stripe Checkout
- Mostrar status da assinatura Stripe
- Remover todas referências a ASAAS

#### 5.3 Atualizar PaymentHistory.tsx
**MUDANÇAS:**
- Substituir `asaas_payment_id` por `stripe_payment_id`
- Link para dashboard do Stripe (se necessário)
- Remover referências a ASAAS

#### 5.4 Criar componente StripeCheckout
**NOVO:** `src/components/StripeCheckout.tsx`

**Funcionalidade:**
- Botão para iniciar checkout
- Loading state
- Redirecionamento automático

---

### FASE 6: TESTES E VALIDAÇÃO (PRIORIDADE MÁXIMA)
**Tempo estimado:** 2 horas

#### 6.1 Teste Manual Completo
**CHECKLIST:**
- [ ] Criar checkout session
- [ ] Completar pagamento no Stripe (test mode)
- [ ] Webhook processa evento
- [ ] Cliente criado/atualizado no banco
- [ ] Assinatura registrada
- [ ] Pagamento registrado
- [ ] Comissões calculadas
- [ ] Dashboard mostra dados corretos

#### 6.2 Teste de Eventos
**VERIFICAR:**
- [ ] checkout.session.completed
- [ ] customer.subscription.created
- [ ] invoice.payment_succeeded
- [ ] customer.subscription.updated
- [ ] customer.subscription.deleted
- [ ] invoice.payment_failed

#### 6.3 Teste de Edge Cases
**CENÁRIOS:**
- [ ] Pagamento duplicado (idempotência)
- [ ] Webhook falha e retenta
- [ ] Assinatura cancelada
- [ ] Pagamento falha
- [ ] Upgrade/downgrade de plano

---

## 📋 ORDEM DE EXECUÇÃO

### DIA 1 - CÓDIGO CRÍTICO (4-5 horas)
1. ✅ Deletar edge functions ASAAS
2. ✅ Criar stripe-client.ts
3. ✅ Atualizar Pagamentos.tsx
4. ✅ Atualizar PaymentHistory.tsx
5. ✅ Criar migration deprecando campos ASAAS
6. ✅ Expandir webhook Stripe com todos eventos
7. ✅ Criar create-checkout-session function
8. ✅ Adaptar calcular-comissoes para Stripe

### DIA 2 - LIMPEZA E TESTES (3-4 horas)
1. ✅ Deletar testes ASAAS (50+ arquivos)
2. ✅ Deletar documentação ASAAS (60+ arquivos)
3. ✅ Deletar scripts bash ASAAS
4. ✅ Atualizar CLAUDE.md
5. ✅ Criar STRIPE-INTEGRATION-GUIDE.md
6. ✅ Testar fluxo completo end-to-end

---

## ⚠️ PRECAUÇÕES

### O QUE NÃO FAZER:
- ❌ Não deletar campos `asaas_*` do banco (pode ter dados históricos)
- ❌ Não deletar migrations antigas (preservar histórico)
- ❌ Não fazer deploy antes de testar TUDO
- ❌ Não remover variáveis de ambiente antes de confirmar que não são usadas

### O QUE FAZER:
- ✅ Fazer backup do banco antes de migration
- ✅ Testar em ambiente de desenvolvimento primeiro
- ✅ Documentar cada mudança
- ✅ Fazer commits pequenos e frequentes
- ✅ Testar CADA evento do Stripe isoladamente

---

## 🎯 CRITÉRIOS DE SUCESSO

### CÓDIGO:
- [ ] Zero referências a "asaas" no código ativo
- [ ] Todos imports do asaas-client removidos
- [ ] Todas edge functions ASAAS deletadas
- [ ] Frontend usa apenas Stripe

### BANCO:
- [ ] Campos `stripe_*` funcionando
- [ ] Campos `asaas_*` marcados como deprecated
- [ ] Sem erros em queries

### FUNCIONALIDADE:
- [ ] Checkout funciona end-to-end
- [ ] Webhook processa todos eventos
- [ ] Comissões calculam corretamente
- [ ] Dashboard mostra dados corretos

### LIMPEZA:
- [ ] Testes ASAAS deletados
- [ ] Documentação ASAAS deletada
- [ ] Scripts ASAAS deletados
- [ ] CLAUDE.md atualizado

---

## 📊 PROGRESSO ATUAL

### FASE 1: CÓDIGO CRÍTICO
- [ ] Edge functions removidas (0/3)
- [ ] Frontend atualizado (0/3)
- [ ] Migration criada (0/1)

### FASE 2: STRIPE
- [x] Webhook Stripe básico (1/1) ✅
- [ ] Todos eventos implementados (0/7)
- [ ] Checkout session (0/1)
- [ ] Comissões adaptadas (0/1)

### FASE 3: LIMPEZA
- [ ] Testes deletados (0/50+)
- [ ] Docs deletados (0/60+)
- [ ] Scripts deletados (0/10+)

### FASE 4: DOCUMENTAÇÃO
- [ ] CLAUDE.md atualizado (0/1)
- [ ] Guia Stripe criado (0/1)

### FASE 5: FRONTEND
- [ ] stripe-client.ts (0/1)
- [ ] Páginas atualizadas (0/2)
- [ ] Componente checkout (0/1)

### FASE 6: TESTES
- [ ] Teste manual (0/1)
- [ ] Teste eventos (0/6)
- [ ] Teste edge cases (0/5)

---

## 🚀 PRÓXIMOS PASSOS IMEDIATOS

1. **AGORA:** Deletar edge functions ASAAS
2. **DEPOIS:** Criar stripe-client.ts
3. **DEPOIS:** Expandir webhook Stripe
4. **DEPOIS:** Atualizar frontend
5. **DEPOIS:** Testar tudo

**VAMOS COMEÇAR!** 🎯
