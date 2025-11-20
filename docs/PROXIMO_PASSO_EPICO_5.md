# 🚀 PRÓXIMO PASSO - ÉPICO 5: STRIPE CONNECT & PAGAMENTOS

**Data:** 19/11/2025  
**Status Anterior:** ✅ Épico 4 (App Onboarding) - 100% Concluído  
**Próximo:** 🔄 Épico 5 (Migração ASAAS → Stripe + Pagamentos)

---

## 📊 RESUMO DO STATUS ATUAL

### **Épicos Completos:**
- ✅ **Épico 0** - Fundamentos de Código
- ✅ **Épico 1** - Segurança e Validação
- ✅ **Épico 2** - Sistema de Comissões (17 bonificações)
- ✅ **Épico 3** - Frontend Portal (Dashboard, Comissões, Calculadora)
- ✅ **Épico 4** - App Onboarding (6 telas + Edge Functions)
- ✅ **BÔNUS** - Scroll to Top (12 páginas)

### **Próximo Épico:**
- ⏳ **Épico 5** - Stripe Connect & Pagamentos Automatizados

---

## 🎯 ÉPICO 5 - MIGRAÇÃO ASAAS → STRIPE

### **Objetivo Principal:**
Migrar completamente de ASAAS para Stripe como gateway de pagamento principal, implementando:
1. Stripe Connect Express para pagamentos a contadores
2. Webhook de pagamentos do Stripe
3. Integração com Edge Functions
4. Processamento automático de saques

---

## 📋 TAREFAS DO ÉPICO 5

### **US5.1 - Configuração Stripe Connect**
**Objetivo:** Preparar infraestrutura Stripe para pagamentos

- [ ] Criar conta Stripe Connect
- [ ] Gerar chaves API (public + secret)
- [ ] Configurar webhooks Stripe
- [ ] Criar produto no Stripe para cada plano:
  - Plano PRO (R$100)
  - Plano PREMIUM (R$130)
  - Plano TOP (R$180)
- [ ] Configurar impostos e taxas
- [ ] Testes em modo sandbox

**Estimativa:** 2-3 dias

---

### **US5.2 - Webhook Stripe (Pagamentos)**
**Objetivo:** Receber notificações de pagamentos do Stripe

**Arquivo:** `supabase/functions/webhook-stripe/index.ts`

**Eventos a processar:**
- `payment_intent.succeeded` → Confirmar pagamento
- `payment_intent.payment_failed` → Falha no pagamento
- `charge.refunded` → Reembolso
- `customer.subscription.updated` → Atualizar recorrência

**Ações:**
1. Validar assinatura webhook (segurança)
2. Atualizar status de pagamento em `pagamentos`
3. Gerar comissão (call `calcular-comissoes`)
4. Log em `audit_logs`
5. Tratamento de erros e retry

**Validações críticas:**
- ✅ Assinatura webhook válida
- ✅ Cliente existe no banco
- ✅ Plano corresponde ao contratado
- ✅ Idempotência (mesma transação não processa 2x)

**Estimativa:** 3-4 dias

---

### **US5.3 - Stripe Connect Express (Contadores)**
**Objetivo:** Permitir que contadores recebam pagamentos direto

**Fluxo:**
1. Contador acessa `/onboarding-contador` (já implementado)
2. Na tela "Conectar Stripe":
   - ✅ Verifica se já conectou
   - Gera link Stripe Connect Express
   - Contador clica e vai para Stripe
   - Stripe redireciona de volta com `stripe_account_id`
3. Salvar `stripe_account_id` em tabela `contadores`

**Banco de dados:**
```sql
ALTER TABLE contadores
ADD COLUMN stripe_account_id TEXT UNIQUE;
```

**Edge Function:** `supabase/functions/gerar-link-stripe-connect/index.ts`

**Estimativa:** 2-3 dias

---

### **US5.4 - Processamento de Saques (Stripe Transfers)**
**Objetivo:** Automatizar transferências de comissões

**Arquivo:** `supabase/functions/processar-pagamentos/index.ts` (JÁ EXISTE, melhorar)

**Lógica:**
1. Executar no dia 25 de cada mês (CRON)
2. Buscar comissões com status "aprovada"
3. Agrupar por contador
4. Aplicar mínimo: R$100
5. Criar Stripe Transfer para conta do contador
6. Atualizar status para "paga"
7. Log de auditoria

**Código (pseudocódigo):**
```typescript
// 1. Buscar comissões aprovadas
const comissoes = await supabase
  .from('comissoes')
  .select('*')
  .eq('status_comissao', 'aprovada')
  .gte('competencia', currentMonth);

// 2. Agrupar por contador
const porContador = agruparPor(comissoes, 'contador_id');

// 3. Para cada contador
for (const [contadorId, comms] of Object.entries(porContador)) {
  const total = comms.reduce((acc, c) => acc + c.valor, 0);
  
  // Validar mínimo
  if (total < 100) continue;
  
  // Buscar stripe_account_id
  const contador = await supabase
    .from('contadores')
    .select('stripe_account_id')
    .eq('id', contadorId);
  
  // Criar transfer
  const transfer = await stripe.transfers.create({
    amount: Math.floor(total * 100), // em cents
    currency: 'brl',
    destination: contador.stripe_account_id,
  });
  
  // Atualizar comissões para "paga"
  await supabase
    .from('comissoes')
    .update({ status_comissao: 'paga' })
    .in('id', comms.map(c => c.id));
}
```

**Estimativa:** 3-4 dias

---

### **US5.5 - Atualizar App Onboarding**
**Objetivo:** Integrar Stripe Checkout no fluxo

**Mudanças em Tela 5 (PaymentStripe):**
1. Remover simulação
2. Chamar Stripe Checkout real
3. Redirecionar para Stripe
4. Voltar com status (sucesso/erro)

**Componente:** `src/onboarding/pages/PaymentStripe.tsx`

**Estimativa:** 2-3 dias

---

### **US5.6 - Testes e Validação**
**Objetivo:** Garantir que tudo funciona

**Testes:**
- ✅ Teste webhook com evento simulado
- ✅ Teste conexão Stripe Connect
- ✅ Teste processamento de saques
- ✅ Teste fluxo completo (cliente → Stripe → comissão → saque)
- ✅ Teste idempotência
- ✅ Teste tratamento de erros

**Estimativa:** 2-3 dias

---

## 📊 CRONOGRAMA ÉPICO 5

| Semana | Tarefa | Status |
|--------|--------|--------|
| Semana 1 | US5.1 (Stripe Setup) + US5.2 (Webhook) | ⏳ Pendente |
| Semana 2 | US5.3 (Connect) + US5.4 (Saques) | ⏳ Pendente |
| Semana 3 | US5.5 (App Update) + US5.6 (Testes) | ⏳ Pendente |

**Duração total:** ~3 semanas

---

## 🔄 DEPENDÊNCIAS

### **Precisa estar pronto:**
- ✅ Épico 4 (App Onboarding) - ✅ PRONTO
- ✅ Edge Function `calcular-comissoes` - ✅ PRONTO
- ✅ Coluna `stripe_account_id` em `contadores` - ❌ TODO

### **Bloqueia:**
- Épico 6 (Testes Automatizados)
- Épico 7 (Melhorias Portal)

---

## ⚠️ PONTOS CRÍTICOS

### **1. Validação de Segurança**
```typescript
// Validar assinatura do webhook
const secret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
const signature = req.headers.get('stripe-signature');

const event = stripe.webhooks.constructEvent(
  body,
  signature,
  secret
);
```

### **2. Idempotência**
Mesmo webhook pode ser entregue múltiplas vezes. Solução:
- Armazenar `stripe_event_id` em `audit_logs`
- Verificar antes de processar

### **3. Taxas**
- Stripe cobra ~2.9% + R$0.30
- **CRÍTICO:** Comissão é sobre valor LÍQUIDO (não bruto)
- Fórmula: `comissao = (valor_bruto - taxa_stripe) * 15%`

### **4. Mínimo de Saque**
- R$100 mínimo
- Se < R$100, fica acumulando

### **5. Timing**
- Pagamentos processados DIA 25 de cada mês
- Não antes, não depois

---

## 🛠️ CHECKLIST PRÉ-ÉPICO 5

- [ ] Ler documentação `MIGRACAO_ASAAS_PARA_STRIPE.md`
- [ ] Ler documentação `FLUXO_FINANCEIRO_SIMPLES.md`
- [ ] Criar conta Stripe (se não tiver)
- [ ] Gerar chaves API Stripe
- [ ] Testar Stripe CLI localmente
- [ ] Revisar Edge Functions ASAAS (para aprender padrão)

---

## 📚 DOCUMENTOS REFERÊNCIA

1. **`MIGRACAO_ASAAS_PARA_STRIPE.md`** - Plano detalhado
2. **`FLUXO_FINANCEIRO_SIMPLES.md`** - Fluxo para leigos
3. **`MUDANCAS_CRITICAS_CALCULO_COMISSAO.md`** - Cálculo correto
4. **`PRD_LOVABLE_CELITE.md`** - Seção "APIs e Webhooks"

---

## 🎯 PRIORIDADES

### **🔴 CRÍTICA (Implementar PRIMEIRO):**
1. ✅ Stripe Setup (chaves, webhook URL)
2. ✅ Webhook Stripe básico
3. ✅ Edge Function `processar-pagamentos`

### **🟡 IMPORTANTE:**
1. ✅ Stripe Connect Express
2. ✅ Integração App Onboarding
3. ✅ Saques automatizados

### **🟢 NICE-TO-HAVE:**
1. ✅ Dashboard de pagamentos
2. ✅ Relatórios Stripe
3. ✅ Webhook retry logic avançada

---

## ✅ CONCLUSÃO

**Épico 5** é crítico para o projeto:
- ✅ Monetização real do app
- ✅ Pagamentos automatizados
- ✅ Experiência profissional

Recomendo **começar em paralelo com testes**, mas manter **segurança em primeiro lugar**.

---

## 🚀 PRÓXIMO PASSO

**Opção A:** Implementar Épico 5 sequencialmente (recomendado)

**Opção B:** Dividir em 2 agentes:
- Agente 1: US5.1-5.2 (Setup + Webhook)
- Agente 2: US5.3-5.4 (Connect + Saques)

**Minha recomendação:** ✅ **Comece com Opção A** (sequencial)

O Épico 5 é complexo demais para paralelizar sem riscos.

---

**Pronto para começar o Épico 5?** 🚀

Quer que eu:
1. Implemente o US5.1 (Stripe Setup)?
2. Crie um plano detalhado antes?
3. Revise documentação com você?

