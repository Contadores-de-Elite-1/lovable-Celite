# 🔐 SECRETS NECESSÁRIOS - Edge Functions

**Data:** 2025-01-14
**Contexto:** Webhook ASAAS precisa validar assinaturas

---

## ✅ SECRETS AUTOMÁTICOS (Já configurados)

Estes são fornecidos automaticamente pelo Supabase:

1. **SUPABASE_URL**
   - Valor: `https://zytxwdgzjqrcmbnpgofj.supabase.co`
   - Status: ✅ Automático
   - Usado para: Conexão com banco de dados

2. **SUPABASE_SERVICE_ROLE_KEY**
   - Valor: Gerado pelo Supabase
   - Status: ✅ Automático
   - Usado para: Operações administrativas (bypass RLS)

---

## ⚠️ SECRET MANUAL (Opcional, mas recomendado)

Este precisa ser configurado manualmente:

### 3. ASAAS_WEBHOOK_SECRET

**O que é:**
- Secret compartilhado entre ASAAS e Supabase
- Usado para validar assinatura MD5 dos webhooks
- Garante que webhooks são realmente do ASAAS

**Status atual:**
- ⚠️ Provavelmente NÃO configurado
- ✅ Webhook funciona SEM este secret (modo development)
- ⚠️ Mas é menos seguro

**Onde configurar:**

1. **No ASAAS (obter o secret):**
   - Acesse: https://sandbox.asaas.com
   - Menu: Integrações → Webhooks
   - Copie o "Token de assinatura" ou "Webhook Secret"

2. **No Supabase (configurar o secret):**
   - Acesse: https://supabase.com/dashboard/project/zytxwdgzjqrcmbnpgofj/settings/functions
   - Ou: Settings → Edge Functions → Environment Variables
   - Adicione:
     - Nome: `ASAAS_WEBHOOK_SECRET`
     - Valor: (cole o token do ASAAS)

**Como funciona a validação:**

```typescript
// No webhook ASAAS
const signature = headers.get('x-asaas-webhook-signature');
const expectedSignature = MD5(payload + secret);

if (signature === expectedSignature) {
  // ✅ Webhook autêntico do ASAAS
} else {
  // ❌ Webhook suspeito (pode ser ataque)
}
```

**Código atual (permite sem secret):**

```typescript
if (!secret) {
  console.warn('⚠️ ASAAS_WEBHOOK_SECRET not configured');
  console.log('[WEBHOOK DEBUG] Allowing webhook due to missing secret (development)');
  return true; // ✅ Permite mesmo sem secret
}
```

---

## 🎯 QUANDO CONFIGURAR?

### Agora (Sandbox/Desenvolvimento):
- ❌ Não é crítico
- ✅ Webhook funciona sem o secret
- ⚠️ Mas qualquer requisição pode chamar o webhook

### Produção (Obrigatório):
- ✅ DEVE configurar
- ✅ Aumenta segurança
- ✅ Valida origem dos webhooks
- ✅ Previne ataques/spam

---

## 📋 CHECKLIST DE SECRETS

### Desenvolvimento (agora):
- ✅ SUPABASE_URL (automático)
- ✅ SUPABASE_SERVICE_ROLE_KEY (automático)
- ⚠️ ASAAS_WEBHOOK_SECRET (opcional)

### Produção (futuro):
- ✅ SUPABASE_URL (automático)
- ✅ SUPABASE_SERVICE_ROLE_KEY (automático)
- ✅ ASAAS_WEBHOOK_SECRET (obrigatório)
- ✅ ASAAS_API_KEY (para criar cobranças)
- ✅ Outros secrets conforme necessário

---

## 🚀 COMO CONFIGURAR ASAAS_WEBHOOK_SECRET (5 minutos)

### Passo 1: Obter secret do ASAAS

1. Login: https://sandbox.asaas.com
2. Menu: Integrações → Webhooks
3. Procure por "Token de assinatura" ou similar
4. Copie o valor (ex: `abcd1234efgh5678`)

**Se não encontrar:**
- Pode estar na configuração do webhook
- Pode ser gerado ao criar o webhook
- Ou pode ser a própria API Key

**Alternativa:** Use a ASAAS API Key como secret por enquanto.

### Passo 2: Configurar no Supabase

**Opção A - Via Dashboard:**

1. Acesse: https://supabase.com/dashboard/project/zytxwdgzjqrcmbnpgofj/settings/functions
2. Procure por "Environment Variables" ou "Secrets"
3. Clique "Add new variable"
4. Nome: `ASAAS_WEBHOOK_SECRET`
5. Valor: (cole o token)
6. Salvar

**Opção B - Via CLI (se disponível):**

```bash
supabase secrets set ASAAS_WEBHOOK_SECRET=seu_token_aqui \
  --project-ref zytxwdgzjqrcmbnpgofj
```

### Passo 3: Verificar

```bash
# Teste o webhook novamente
# Se configurado corretamente, logs mostrarão:
# [SIGNATURE DEBUG] Match: YES ✅
```

---

## ⚠️ IMPORTANTE

**Não é bloqueador para MVP:**
- Sistema funciona SEM o secret
- Webhook permite requisições mesmo sem assinatura válida
- Logs indicam quando secret está faltando

**Configure quando:**
1. Testar validação de assinatura
2. Preparar para produção
3. Aumentar segurança
4. Prevenir abusos

---

## 📝 REFERÊNCIAS

**Documentação ASAAS:**
- https://docs.asaas.com/docs/webhook-para-cobrancas
- Procure por: "Validação de assinatura" ou "Webhook signature"

**Código do webhook:**
- `supabase/functions/webhook-asaas/index.ts`
- Linhas 15-74: Função `validateAsaasSignature()`

**Logs úteis:**
- Supabase Edge Functions: https://supabase.com/dashboard/project/zytxwdgzjqrcmbnpgofj/logs/edge-functions
- Procure por: `[SIGNATURE DEBUG]` ou `ASAAS_WEBHOOK_SECRET not configured`

---

## ✅ STATUS ATUAL

**Secrets configurados:**
- ✅ SUPABASE_URL
- ✅ SUPABASE_SERVICE_ROLE_KEY

**Secrets faltando:**
- ⚠️ ASAAS_WEBHOOK_SECRET (opcional para MVP)

**Sistema funciona?**
- ✅ SIM, funciona sem o secret
- ⚠️ Mas com segurança reduzida

**Próxima ação:**
- Continue com criação do cliente
- Configure secret depois (não bloqueia)

---

**RESUMO: Webhook funciona SEM secret. Configure depois para produção.** ✅
