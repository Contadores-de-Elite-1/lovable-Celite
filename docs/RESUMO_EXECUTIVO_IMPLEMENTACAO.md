# RESUMO EXECUTIVO - PLANO DE IMPLEMENTACAO
## Lovable-Celite: 2 Apps em Paralelo

**Data**: Novembro 2025  
**LLM**: Claude Sonnet 4.5  
**Status**: Aguardando aprovacao

---

## DECISOES CONFIRMADAS

- ✅ **2 apps em paralelo** (DEV 1 + DEV 2)
- ✅ **MVP Robusto** (sem gambiarras, codigo limpo)
- ✅ **Stripe Connect** (split automatico de comissoes)
- ✅ **Migrar de ASAAS para Stripe**
- ✅ **Codigo em ingles, comentarios em portugues simples**
- ✅ **Zero erros tolerados** (risco judicial se comissoes falharem)

---

## OS 2 APLICATIVOS

### APP 1: Onboarding de Clientes (DEV 1)
**Objetivo**: Cliente indicado pelo contador se cadastra e paga

**Fluxo**:
```
Contador gera link → Cliente clica → Escolhe plano → Preenche dados →
Upload documentos → Assina contrato → Paga no Stripe →
Sistema calcula comissoes → Top Class assina contrato
```

**Tecnologias**:
- Frontend: React + Vite + TypeScript + Tailwind CSS
- Backend: Supabase Edge Functions
- Pagamento: Stripe Checkout
- Storage: Supabase Storage (documentos + contratos)
- PDF: PDFKit (geracao de contratos)

**Tempo estimado**: 3-4 semanas

**Documento principal**: `/docs/FLUXO_DEV1_ONBOARDING.md`

---

### APP 2: Portal dos Contadores (DEV 2)
**Objetivo**: Contador acompanha comissoes em tempo real

**Fluxo**:
```
Webhook Stripe → Edge Function → Calcula 17 bonificacoes →
Insere em 'comissoes' → Dashboard atualiza → Stripe Connect paga
```

**Tecnologias**:
- Frontend: React + Vite + TypeScript + Shadcn/UI
- Backend: Supabase Edge Functions + RLS
- Database: PostgreSQL (Supabase)
- Pagamento: Stripe Connect (split automatico)
- Monitoramento: Sentry + CRON jobs

**Tempo estimado**: 4 semanas (migracao ASAAS → Stripe + melhorias)

**Documentos principais**: 
- `/docs/PRD_LOVABLE_CELITE.md` (PRD completo)
- `/docs/MIGRACAO_ASAAS_PARA_STRIPE.md` (plano de migracao)

---

## CRONOGRAMA GERAL (8 SEMANAS)

### SEMANA 1-2: Setup Paralelo
**DEV 1** (App Onboarding):
- Setup repositorio + Vite + React + TypeScript
- Telas 1-3 (Landing, Planos, Dados)
- Edge Function: validate-referral-token
- Edge Function: gerar-contrato-preview

**DEV 2** (Portal):
- Criar conta Stripe + Produtos (Pro/Premium/Top)
- Configurar Stripe Connect
- Migration: adicionar campos Stripe no banco
- Edge Function: webhook-stripe (completa)
- Configurar webhook no Stripe Dashboard

---

### SEMANA 3-4: Features Principais
**DEV 1** (App Onboarding):
- Telas 4-5 (Upload documentos, Assinatura contrato)
- Configurar Supabase Storage + RLS
- Tela 6 (Pagamento Stripe Checkout)
- Edge Function: create-checkout-session

**DEV 2** (Portal):
- Migrar 1-2 contadores para Stripe Connect (piloto)
- Migrar 1-2 clientes para Stripe Subscriptions (piloto)
- Testar webhook Stripe (eventos reais)
- Validar comissoes calculadas (comparar ASAAS vs Stripe)

---

### SEMANA 5-6: Integracao + Testes
**DEV 1** (App Onboarding):
- Tela 7 (Sucesso)
- Edge Function: webhook-stripe-onboarding
- Integracao com Portal (cliente paga → comissoes calculadas)
- Testes end-to-end

**DEV 2** (Portal):
- Migrar TODOS os contadores para Stripe Connect
- Migrar TODOS os clientes para Stripe Subscriptions
- Pausar webhook ASAAS
- Monitorar comissoes por 7 dias

---

### SEMANA 7-8: Deploy + Monitoramento
**DEV 1** (App Onboarding):
- Configurar dominio: onboarding.topclass.com
- Deploy frontend (Vercel/Netlify)
- Deploy Edge Functions (Supabase)
- Teste com contador real (modo test Stripe)

**DEV 2** (Portal):
- Criar dashboard de monitoramento (ASAAS vs Stripe)
- CRON job: verificar comissoes nao calculadas (alerta critico)
- CRON job: reconciliacao diaria
- Documentar processo de rollback

---

## PONTOS CRITICOS (ZERO ERROS)

### 1. Idempotencia Total
```typescript
// Verificar se evento ja foi processado
const { data: existing } = await supabase
  .from('pagamentos')
  .select('id')
  .eq('stripe_event_id', event.id)
  .single();

if (existing) {
  return { message: 'Event already processed' };
}
```

### 2. Validacao de Dados
```typescript
// Validar TODOS os campos antes de calcular comissoes
if (!pagamento.valor || pagamento.valor <= 0) {
  throw new Error('Valor invalido');
}

if (!pagamento.plano || !['pro', 'premium', 'top'].includes(pagamento.plano)) {
  throw new Error('Plano invalido');
}
```

### 3. Calculo de Comissoes (CRITICO)
```typescript
// SEMPRE tratar erros de calculo
try {
  const { data: comissoes, error } = await supabase.rpc(
    'executar_calculo_comissoes',
    { p_pagamento_id: pagamento.id }
  );
  
  if (error) {
    // Alerta critico imediato
    await enviarAlertaCritico({
      tipo: 'ERRO_CALCULO_COMISSOES',
      pagamento_id: pagamento.id,
      error: error.message
    });
    throw error;
  }
  
} catch (error) {
  // NUNCA ignorar erro de comissoes
  console.error('[CRITICO] Erro ao calcular comissoes:', error);
  throw error;
}
```

### 4. Monitoramento em Tempo Real
```typescript
// Sentry captura TODOS os erros
import * as Sentry from '@sentry/deno';

Sentry.captureException(error, {
  tags: { 
    pagamento_id, 
    critical: true,
    gateway: 'stripe'
  },
  level: 'error'
});
```

### 5. Reconciliacao Diaria
```typescript
// CRON Job: Verifica se TODOS os pagamentos geraram comissoes
async function reconciliarDiariamente() {
  const pagamentos = await getPagamentosOntem();
  
  for (const pag of pagamentos) {
    const comissoes = await getComissoes(pag.id);
    
    if (comissoes.length === 0) {
      // Alerta critico
      await enviarAlertaCritico({
        mensagem: `Pagamento ${pag.id} nao gerou comissoes!`,
        pagamento: pag
      });
    }
  }
}
```

---

## DOCUMENTOS CRIADOS

### 1. Fluxo DEV1 (App Onboarding)
- **Arquivo**: `/docs/FLUXO_DEV1_ONBOARDING.md`
- **Linhas**: ~800
- **Conteudo**: Especificacao completa das 7 telas, Edge Functions, integracao Stripe

### 2. Migracao ASAAS → Stripe
- **Arquivo**: `/docs/MIGRACAO_ASAAS_PARA_STRIPE.md`
- **Linhas**: ~600
- **Conteudo**: Plano de migracao em 4 fases, sem downtime, com rollback plan

### 3. Base de Dados Atualizada
- **Arquivo**: `/docs/BASE_DADOS_CONSULTA.md`
- **Alteracao**: Adicionados os 2 novos documentos no indice

---

## PROXIMOS PASSOS IMEDIATOS

1. **Voce aprova este plano?**
   - Se SIM: DEV 1 e DEV 2 comecam implementacao
   - Se NAO: Quais modificacoes deseja?

2. **Criar PRD do App de Onboarding?**
   - Similar ao PRD do Portal (1.275 linhas)
   - Incluindo mockups ASCII, SQL completo, TypeScript pronto

3. **Alguma duvida sobre o fluxo ou a migracao?**
   - Posso detalhar qualquer parte
   - Posso ajustar prioridades
   - Posso criar scripts de teste

---

## GARANTIAS DE QUALIDADE

- ✅ **Codigo em ingles** (sem emojis, clean code)
- ✅ **Comentarios em portugues** (simples, direto, objetivo)
- ✅ **Idempotencia total** (nenhum evento processado 2x)
- ✅ **Validacao completa** (dados + assinaturas + valores)
- ✅ **Monitoramento 24/7** (Sentry + CRON jobs)
- ✅ **Alertas criticos** (Slack/Email se comissoes falharem)
- ✅ **Reconciliacao diaria** (verifica 100% dos pagamentos)
- ✅ **Rollback plan** (se algo der errado, volta para ASAAS)

---

## ESTIMATIVA DE CUSTOS

### Desenvolvimento
- DEV 1 (App Onboarding): 4 semanas × 40h = 160h
- DEV 2 (Portal + Migracao): 4 semanas × 40h = 160h
- **Total**: 320 horas de desenvolvimento

### Infraestrutura (mensal)
- Supabase Pro: ~R$ 120/mes
- Stripe: 3.99% + R$ 0.39 por transacao
- Vercel/Netlify: Gratuito (plano hobby)
- Sentry: Gratuito (ate 5k eventos/mes)
- **Total**: R$ 120/mes fixo + variavel por transacao

---

## PERGUNTAS PARA VOCE

1. **Aprova este plano de implementacao?**
2. **Quer que eu crie o PRD completo do App de Onboarding agora?**
3. **Alguma parte do fluxo ou da migracao precisa ser ajustada?**
4. **Quer que eu comece a implementar algo especifico primeiro?**

---

**Aguardando sua aprovacao para prosseguir!** 🚀

