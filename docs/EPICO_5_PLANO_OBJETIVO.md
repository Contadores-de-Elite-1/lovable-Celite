# 🎯 ÉPICO 5: STRIPE CONNECT - PLANO OBJETIVO

**Status:** ⏳ Próximo épico  
**Duração:** ~3 semanas  
**Criticidade:** 🔴 CRÍTICA

---

## 📌 OBJETIVO PRINCIPAL

Migrar de ASAAS para Stripe e implementar **pagamentos automáticos para contadores**.

---

## ✅ TAREFAS

### **US5.1 - Setup Stripe** (2-3 dias)
- Criar conta Stripe
- Gerar API keys (public + secret)
- Criar 3 produtos (PRO R$110, PREMIUM R$130, TOP R$180)
- Configurar Stripe Connect
- Configurar webhook (`/webhook-stripe`)
- ✅ Resultado: Infraestrutura Stripe pronta

### **US5.2 - Webhook Stripe** (3-4 dias)
- Criar Edge Function `webhook-stripe/index.ts`
- Validar assinatura (segurança)
- Idempotência (não processar 2x)
- Criar registro em `pagamentos`
- Chamar RPC para calcular 17 bonificações
- ✅ Resultado: Pagamentos processados automaticamente

### **US5.3 - Stripe Connect** (2-3 dias)
- Adicionar coluna `stripe_connect_account_id` em `contadores`
- Implementar fluxo OAuth com Stripe
- Integrar em tela 3 de onboarding contador
- ✅ Resultado: Contador conecta conta bancária

### **US5.4 - Processar Saques** (3-4 dias)
- Edge Function `processar-pagamentos` (CRON dia 25)
- Buscar comissões "aprovada" do mês anterior
- Agrupar por contador + aplicar mínimo R$100
- Criar Stripe Transfer para cada contador
- Atualizar status para "paga"
- ✅ Resultado: Contador recebe automaticamente

### **US5.5 - App Onboarding** (2-3 dias)
- Tela 5: Remover simulação
- Integrar Stripe Checkout real
- Redirecionar para Stripe
- ✅ Resultado: Pagamento real no app

### **US5.6 - Testes** (2-3 dias)
- Teste webhook com Stripe CLI
- Teste idempotência
- Teste fluxo completo
- ✅ Resultado: Tudo funciona

---

## 🔄 FLUXO (RESUMIDO)

```
Cliente paga no app
     ↓
Stripe webhook → Edge Function
     ↓
Calcula comissões (17 bonificações)
     ↓
Dia 25: Processa saques
     ↓
Stripe Transfer → Conta do contador
     ↓
Contador recebe! ✅
```

---

## ⚠️ CRÍTICO

1. **Validação webhook** → Usar SDK Stripe (nativo)
2. **Idempotência** → Verificar `stripe_event_id` único
3. **Mínimo R$100** → Saques menores acumulam
4. **Dia 25** → Sempre neste dia (CRON job)
5. **Comissão = valor LÍQUIDO** (após taxas Stripe)

---

## 📊 DEPENDÊNCIAS

```
US5.1 (Setup)
    ↓
US5.2 (Webhook) + US5.3 (Connect)
    ↓
US5.4 (Saques)
    ↓
US5.5 (App) + US5.6 (Testes)
```

**→ SEQUENCIAL, não paralelo**

---

## 🎯 PRÓXIMO PASSO

Você quer que eu:
1. **Comece com US5.1** (Setup Stripe)?
2. **Revise algo antes**?
3. **Outra coisa**?

