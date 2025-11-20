# 📋 REVISÃO DETALHADA - ÉPICO 5: STRIPE CONNECT & PAGAMENTOS

**Data:** 19/11/2025  
**Objetivo:** Analisar e validar o plano de Épico 5 antes de implementação  
**Status:** 🔍 EM REVISÃO

---

## 🎯 CONTEXTO

Após 4 épicos completos, estamos prontos para implementar a **monetização real** do projeto:
- ✅ Épico 4 criou o app de onboarding (6 telas, mas com simulação de Stripe)
- ⏳ Épico 5 vai tornar isso REAL com Stripe Connect

---

## 📊 VISÃO GERAL DO ÉPICO 5

### **Por que migrar de ASAAS para Stripe?**

| Aspecto | ASAAS | Stripe |
|--------|-------|--------|
| **Webhook** | MD5 manual | SDK nativo (seguro) |
| **Connect** | ❌ Não tem | ✅ Stripe Connect Express |
| **Split de comissão** | Manual (nós calculamos) | Automático (platform fee) |
| **Segurança** | Mais frágil | Muito mais robusta |
| **Internacionalização** | ❌ BR apenas | ✅ Suporta vários países |
| **Documentação** | Razoável | Excelente |
| **SDK TypeScript** | Básico | Muito completo |

**Conclusão:** Stripe é CLARAMENTE superior para este projeto.

---

## 🔄 FLUXO ATUAL (ASAAS) vs NOVO (STRIPE)

### **ASAAS (Atual - Limitado)**
```
Cliente no app → ASAAS Checkout → Webhook ASAAS
                                     ↓
                            Edge Function valida MD5
                                     ↓
                            Calcula comissões (nós)
                                     ↓
                        Contador quer sacar → ASAAS API
                                     ↓
                          ASAAS transfere (manual)
```

**Problema:** 
- Contador recebe via ASAAS (plataforma BR)
- Muitos passos manuais
- Difícil rastrear

---

### **STRIPE (Novo - Automático)**
```
Cliente no app → Stripe Checkout → Stripe cobra cliente
                                        ↓
                      Stripe envia webhook (assinado)
                                        ↓
                    Edge Function valida + calcula comissões
                                        ↓
                   Stripe conecta conta do contador
                                        ↓
                    Dia 25: Stripe transfere comissões
                                        ↓
                     Contador recebe direto na conta! ✅
```

**Vantagem:**
- Totalmente automático
- Sem intermediários
- Mais profissional

---

## ⚙️ ARQUITETURA TÉCNICA

### **US5.1 - Stripe Setup (2-3 dias)**

#### **O que fazer:**

1. **Criar conta Stripe** (se não tiver)
   ```
   https://dashboard.stripe.com → Sign up
   ```

2. **Gerar chaves API**
   ```
   Settings → API Keys
   - Publishable Key (frontend)
   - Secret Key (backend) ⚠️ GUARDAR SEGURO
   ```

3. **Criar 3 produtos**
   ```
   Pricing → Create Product
   - Plano PRO: R$ 100/mês
   - Plano PREMIUM: R$ 130/mês
   - Plano TOP: R$ 180/mês
   
   ⚠️ IMPORTANTE: Deve ser RECORRENTE (subscription)
   ```

4. **Copiar Price IDs**
   ```
   price_1Abc123XXX (PRO)
   price_2Def456YYY (PREMIUM)
   price_3Ghi789ZZZ (TOP)
   
   → Salvar em .env como:
   STRIPE_PRICE_PRO=price_1Abc123XXX
   STRIPE_PRICE_PREMIUM=price_2Def456YYY
   STRIPE_PRICE_TOP=price_3Ghi789ZZZ
   ```

5. **Configurar Stripe Connect**
   ```
   Settings → Connect Settings
   - Tipo: "Standard" (contador controla própria conta)
   - Application fee: 15% (padrão do programa)
   ```

6. **Configurar Webhook**
   ```
   Webhooks → Add endpoint
   - URL: https://supabase-project.supabase.co/functions/v1/webhook-stripe
   - Eventos: 
     * invoice.payment_succeeded (recorrente)
     * checkout.session.completed (primeiro pagamento)
   - Copiar Signing Secret → STRIPE_WEBHOOK_SECRET
   ```

---

### **US5.2 - Webhook Stripe (3-4 dias)**

#### **O que é:**
Quando cliente paga, Stripe envia dados para nossa Edge Function:

```typescript
// Webhook dispara
POST /webhook-stripe
{
  type: "invoice.payment_succeeded",
  id: "evt_1Abc123XXX",
  data: {
    object: {
      id: "in_1Abc123YYY",
      amount_paid: 13000, // R$ 130 em centavos
      subscription: "sub_1Abc123ZZZ",
      payment_intent: "pi_1Abc123AAA"
    }
  }
}
```

#### **O que a Edge Function faz:**

1. **Valida assinatura** (segurança - previne fraude)
   ```typescript
   const event = stripe.webhooks.constructEvent(
     body,
     req.headers.get('stripe-signature'),
     webhookSecret
   );
   // Se inválido, lança erro → não processa
   ```

2. **Verifica idempotência** (mesmo evento não processa 2x)
   ```typescript
   const existing = await supabase
     .from('pagamentos')
     .select('id')
     .eq('stripe_event_id', event.id)
     .single();
   
   if (existing) return; // Já processamos este evento
   ```

3. **Extrai dados**
   ```typescript
   const invoice = event.data.object;
   const valor = invoice.amount_paid / 100; // em reais
   const subscription_id = invoice.subscription;
   const payment_intent_id = invoice.payment_intent;
   ```

4. **Busca dados do cliente**
   ```typescript
   // A subscription tem metadata com contador_id
   const subscription = await stripe.subscriptions.retrieve(subscription_id);
   const { contador_id } = subscription.metadata;
   
   // Busca cliente pelo subscription_id
   const cliente = await supabase
     .from('clientes')
     .select('*')
     .eq('stripe_subscription_id', subscription_id)
     .single();
   ```

5. **Cria registro em 'pagamentos'**
   ```typescript
   await supabase.from('pagamentos').insert({
     cliente_id: cliente.id,
     contador_id: contador_id,
     valor: valor,
     plano: subscription.metadata.plano,
     status: 'aprovado',
     stripe_event_id: event.id,
     stripe_payment_intent_id: payment_intent_id,
     stripe_subscription_id: subscription_id,
     tipo_pagamento: 'recorrente'
   });
   ```

6. **Calcula comissões** (RPC existente)
   ```typescript
   await supabase.rpc('executar_calculo_comissoes', {
     p_pagamento_id: pagamento.id
   });
   // Isso gera as 17 bonificações
   ```

7. **Log de auditoria**
   ```typescript
   await supabase.from('audit_logs').insert({
     action: 'PAGAMENTO_PROCESSADO',
     gateway: 'stripe',
     valor: valor,
     // ... mais dados
   });
   ```

#### **Erros críticos a tratar:**

```typescript
// Erro 1: Assinatura inválida
try {
  const event = stripe.webhooks.constructEvent(...);
} catch (error) {
  // ⚠️ Retornar 401 Unauthorized
  return new Response('Unauthorized', { status: 401 });
}

// Erro 2: Cliente não encontrado
if (!cliente) {
  // Alerta crítico (Slack/Email)
  await alertarErroCritico({
    tipo: 'CLIENTE_NAO_ENCONTRADO',
    subscription_id,
    valor
  });
  // Retornar 500 para Stripe tentar novamente
  return new Response('Error', { status: 500 });
}

// Erro 3: Falha ao calcular comissões
if (comissoesError) {
  // Alerta crítico
  await alertarErroCritico({
    tipo: 'ERRO_CALCULO_COMISSOES',
    pagamento_id,
    error: comissoesError
  });
  // Retornar 500 para retry
  return new Response('Error', { status: 500 });
}
```

---

### **US5.3 - Stripe Connect Express (2-3 dias)**

#### **Conceito:**
Permitir que contador receba dinheiro direto na conta bancária dele.

#### **Como funciona:**

1. **Contador começa onboarding**
   ```
   /onboarding-contador (já existe)
   Tela 1: Boas-vindas
   Tela 2: Como receber?
   Tela 3: Conectar Stripe ← AQUI
   ```

2. **Tela 3 verifica se já conectou**
   ```typescript
   const { data: contador } = await supabase
     .from('contadores')
     .select('stripe_connect_account_id')
     .eq('id', contadorId)
     .single();
   
   if (contador.stripe_connect_account_id) {
     // Já conectou, mostrar confirmação
     return <div>Conectado como: {last4}</div>;
   }
   ```

3. **Se não conectou, gera link Stripe Connect**
   ```typescript
   // Edge Function: gerar-link-stripe-connect
   async function gerarLinkStripeConnect(contadorId) {
     const stripeAccount = await stripe.oauth.authorize({
       client_id: Deno.env.get('STRIPE_CONNECT_CLIENT_ID'),
       code: authCode, // Recebido do Stripe após autorização
       grant_type: 'authorization_code'
     });
     
     // stripeAccount.stripe_user_id = conta do contador
     
     // Salvar no banco
     await supabase
       .from('contadores')
       .update({
         stripe_connect_account_id: stripeAccount.stripe_user_id,
         stripe_connect_onboarded: true,
         stripe_connect_onboarded_at: new Date()
       })
       .eq('id', contadorId);
     
     return { success: true };
   }
   ```

4. **No frontend: gerar URL para Stripe**
   ```typescript
   const stripeOAuthUrl = `https://connect.stripe.com/oauth/authorize?response_type=code&client_id=${STRIPE_CONNECT_CLIENT_ID}&scope=read_write&redirect_uri=${REDIRECT_URI}`;
   
   // Usuário clica no link
   window.location.href = stripeOAuthUrl;
   // → Stripe redireciona de volta com ?code=...
   // → Chamamos Edge Function com o code
   ```

5. **Banco de dados**
   ```sql
   ALTER TABLE contadores
   ADD COLUMN stripe_connect_account_id TEXT UNIQUE;
   ADD COLUMN stripe_connect_onboarded BOOLEAN DEFAULT false;
   ADD COLUMN stripe_connect_onboarded_at TIMESTAMPTZ;
   ```

#### **Segurança:**
```
⚠️ IMPORTANTE:
- stripe_connect_account_id é a "chave" para transferências
- Nunca expor em frontend
- Validar no backend que contador_id bate com sessão
```

---

### **US5.4 - Processamento de Saques (3-4 dias)**

#### **Quando:** Dia 25 de cada mês (CRON job)

#### **Fluxo:**

```
Dia 25, 03:00 → CRON dispara
       ↓
Edge Function: processar-pagamentos
       ↓
1. Busca comissões status "aprovada" do mês anterior
2. Valida cada uma
3. Agrupa por contador
4. Aplica mínimo R$100
5. Cria Stripe Transfer para conta do contador
6. Atualiza status para "paga"
7. Log de auditoria
       ↓
Contador recebe! ✅
```

#### **Código (pseudocódigo):**

```typescript
// supabase/functions/processar-pagamentos/index.ts

export async function processarPagamentos() {
  // 1. Buscar comissões aprovadas do mês anterior
  const competenciaAnterior = getCompetenciaAnterior(); // ex: "2025-10"
  
  const { data: comissoes } = await supabase
    .from('comissoes')
    .select('*')
    .eq('status_comissao', 'aprovada')
    .startsWith('competencia', competenciaAnterior);
  
  console.log(`Processando ${comissoes.length} comissões`);
  
  // 2. Agrupar por contador
  const porContador = {};
  for (const comissao of comissoes) {
    if (!porContador[comissao.contador_id]) {
      porContador[comissao.contador_id] = [];
    }
    porContador[comissao.contador_id].push(comissao);
  }
  
  // 3. Para cada contador
  for (const [contadorId, comms] of Object.entries(porContador)) {
    // Calcular total
    const total = comms.reduce((acc, c) => acc + c.valor, 0);
    console.log(`Contador ${contadorId}: R$ ${total}`);
    
    // Validar mínimo
    if (total < 100) {
      console.log(`❌ Abaixo do mínimo (R$100). Pulando.`);
      continue;
    }
    
    // Buscar conta Stripe do contador
    const { data: contador } = await supabase
      .from('contadores')
      .select('stripe_connect_account_id, email')
      .eq('id', contadorId)
      .single();
    
    if (!contador?.stripe_connect_account_id) {
      console.error(`❌ Contador sem Stripe Connect!`);
      // TODO: Alerta + fila de espera
      continue;
    }
    
    try {
      // Criar transfer via Stripe
      const transfer = await stripe.transfers.create({
        amount: Math.floor(total * 100), // em centavos
        currency: 'brl',
        destination: contador.stripe_connect_account_id,
        description: `Comissões ${competenciaAnterior} - Lovable-Celite`,
        metadata: {
          contador_id: contadorId,
          competencia: competenciaAnterior
        }
      });
      
      console.log(`✅ Transfer criado: ${transfer.id}`);
      
      // Atualizar status de todas as comissões
      const idsComissoes = comms.map(c => c.id);
      await supabase
        .from('comissoes')
        .update({
          status_comissao: 'paga',
          stripe_transfer_id: transfer.id,
          paga_em: new Date().toISOString()
        })
        .in('id', idsComissoes);
      
      // Log de auditoria
      await supabase.from('audit_logs').insert({
        action: 'SAQUE_PROCESSADO',
        user_id: contadorId,
        resource_type: 'comissoes',
        valor: total,
        stripe_transfer_id: transfer.id,
        timestamp: new Date().toISOString()
      });
      
      // Email de confirmação
      await enviarEmail({
        to: contador.email,
        template: 'saque_processado',
        data: {
          valor: total,
          data_saque: new Date()
        }
      });
      
    } catch (error) {
      console.error(`❌ Erro ao processar saque: ${error.message}`);
      
      // Alerta crítico
      await alertarErro({
        tipo: 'ERRO_STRIPE_TRANSFER',
        contador_id: contadorId,
        valor: total,
        error: error.message
      });
      
      // Marcar como "erro_processamento" para revisão manual
      await supabase
        .from('comissoes')
        .update({
          status_comissao: 'erro_processamento',
          erro_detalhes: error.message
        })
        .in('id', idsComissoes);
    }
  }
  
  console.log('✅ Processamento de saques concluído');
}

// Configurar CRON
// supabase/config.toml:
// [functions.processar-pagamentos]
// schedule = "0 3 25 * *"  # Dia 25, 03:00
```

---

### **US5.5 - App Onboarding (2-3 dias)**

#### **Mudança principal:** Tela 5 (Payment)

**Antes (simulado):**
```typescript
const handlePayment = async () => {
  setProcessing(true);
  await new Promise(r => setTimeout(r, 2000)); // Simulação
  // → Success
};
```

**Depois (real):**
```typescript
const handlePayment = async () => {
  setProcessing(true);
  
  try {
    // Criar Session Stripe
    const response = await fetch('/api/criar-checkout-session', {
      method: 'POST',
      body: JSON.stringify({
        plano: selectedPlan,
        cliente_id: clienteId,
        contador_id: contadorId,
        valor: planosPrecos[selectedPlan]
      })
    });
    
    const { sessionId } = await response.json();
    
    // Redirecionar para Stripe Checkout
    await stripe.redirectToCheckout({ sessionId });
    
  } catch (error) {
    toast.error('Erro ao processar pagamento');
  } finally {
    setProcessing(false);
  }
};
```

---

### **US5.6 - Testes (2-3 dias)**

#### **Testes em sandbox:**

1. **Teste de pagamento**
   ```bash
   # Usar cartão de teste do Stripe
   Número: 4242 4242 4242 4242
   Data: 12/34
   CVC: 567
   
   # Resultado: Pagamento aceito
   # Webhook disparará automaticamente
   ```

2. **Teste de webhook**
   ```bash
   # Usar Stripe CLI
   stripe listen --forward-to localhost:3000/webhook-stripe
   
   # Simular evento
   stripe trigger invoice.payment_succeeded
   
   # Verificar se Edge Function processou
   ```

3. **Teste end-to-end**
   ```
   1. Cliente clica "Pagar"
   2. Redireciona para Stripe Checkout
   3. Cliente preenche cartão (teste)
   4. Webhook dispara
   5. Comissões são calculadas
   6. Contador vê comissão no Dashboard
   ```

---

## 🎯 MAPEAMENTO DE DEPENDÊNCIAS

```
US5.1 (Setup Stripe)
    ↓
US5.2 (Webhook) ← Depende de US5.1
    ↓
US5.3 (Connect) ← Depende de US5.1
    ↓
US5.4 (Saques) ← Depende de US5.3 + US5.2
    ↓
US5.5 (App) ← Depende de US5.1 + US5.2
    ↓
US5.6 (Testes) ← Depende de tudo
```

**Conclusão:** Deve ser SEQUENCIAL, não paralelo.

---

## ⚠️ RISCOS IDENTIFICADOS

### **🔴 CRÍTICOS**

1. **Validação de webhook falha**
   - Risco: Fraudes processadas como comissões reais
   - Mitigação: Usar SDK Stripe nativo (não manual)
   - Teste: Simular assinatura inválida

2. **Idempotência falha**
   - Risco: Mesmo pagamento = 2x comissões
   - Mitigação: Verificar stripe_event_id UNICO
   - Teste: Reenviar webhook 2x

3. **Stripe Connect não funciona**
   - Risco: Contadores não recebem dinheiro
   - Mitigação: Testar com conta de teste
   - Teste: Verificar stripe_connect_account_id está preenchido

4. **Erro no cálculo de comissões**
   - Risco: Comissão errada = cliente reclama
   - Mitigação: RPC já testado em Épico 2
   - Teste: Validar com 17 bonificações

### **🟡 IMPORTANTES**

1. **Webhook demora a chegar**
   - Risco: Cliente não vê comissão imediatamente
   - Mitigação: Webhook pode demorar 2-5 min
   - Comunicação: Explicar no app

2. **Banda limitada Stripe**
   - Risco: Muitas requisições = rate limit
   - Mitigação: Batching de transfers

3. **Limite de saque (mínimo R$100)**
   - Risco: Contador fica esperando acumular
   - Mitigação: Transparente no app

---

## 🧪 PLANO DE TESTE

### **Fase 1: Sandbox (1 dia)**
- [ ] Setup Stripe (sandbox)
- [ ] Teste webhook com Stripe CLI
- [ ] Teste idempotência
- [ ] Teste cartão inválido → error handling

### **Fase 2: Staging (1 dia)**
- [ ] Deploy no staging
- [ ] Teste end-to-end completo
- [ ] Teste com contador real (conta de teste)
- [ ] Verificar audit logs

### **Fase 3: Production (1 dia)**
- [ ] Deploy em prod
- [ ] Webhooks configuradas
- [ ] Teste com 1º pagamento real (se possível com mock)
- [ ] Monitoramento ativo

---

## 💡 SUGESTÕES DE MELHORIA

1. **Dashboard de Pagamentos**
   - Mostrar histórico de Stripe Transfers
   - Status de cada saque

2. **Notificações**
   - Email quando saque é processado
   - Notificação push se implementar

3. **Retry Logic**
   - Se Transfer falhar, tentar novamente
   - Máximo X tentativas antes de alerta humano

4. **Reconciliação Diária**
   - Sincronizar dados Stripe com banco
   - Alertar inconsistências

---

## ✅ CHECKLIST PRÉ-COMEÇAR

- [ ] Li documento `MIGRACAO_ASAAS_PARA_STRIPE.md`
- [ ] Li documentação PRD sobre webhooks
- [ ] Criei conta Stripe (sandbox)
- [ ] Gerei chaves API Stripe
- [ ] Entendo conceitos: webhook, idempotência, Connect
- [ ] Pronto para começar!

---

## 🎓 REFERÊNCIAS IMPORTANTES

1. **Stripe Docs:** https://stripe.com/docs
2. **Stripe Connect:** https://stripe.com/docs/connect
3. **Webhooks:** https://stripe.com/docs/webhooks
4. **TypeScript SDK:** https://github.com/stripe/stripe-node

---

## 📝 CONCLUSÃO

**Épico 5 é complexo mas CRÍTICO para monetização real.**

Pontos-chave:
- ✅ Webhook = coração do sistema
- ✅ Idempotência = evita duplicação
- ✅ Stripe Connect = contador recebe direto
- ✅ Processamento de saques = automático
- ✅ Testes = essencial

**Recomendação:** Começar sequencialmente, começando por US5.1.

---

**Pronto para revisar qualquer dúvida antes de implementar?** 🚀

