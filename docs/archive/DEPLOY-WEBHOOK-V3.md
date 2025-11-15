# 🚀 DEPLOY WEBHOOK V3.0 - PASSO A PASSO

**PROBLEMA:** O código V3.0 está no GitHub mas NÃO está deployado no Supabase!

**Versão atual rodando:** ANTIGA (retorna 404)
**Versão que precisa rodar:** V3.0 (auto-cria clientes)

---

## ✅ **OPÇÃO 1: DEPLOY AUTOMÁTICO VIA GITHUB ACTIONS**

**Se GitHub Actions estiver configurado:**

1. **Ir para GitHub:**
   https://github.com/Contadores-de-Elite-1/lovable-Celite/actions

2. **Procurar workflow:** "Deploy Functions" ou similar

3. **Clicar:** "Run workflow" → Selecionar branch → Run

4. **Aguardar:** ~2 minutos

5. **Confirmar:** Logs devem mostrar "webhook-asaas deployed successfully"

---

## ✅ **OPÇÃO 2: CRIAR NOVO DEPLOYMENT MANUAL**

**Se não tiver GitHub Actions:**

1. **Abrir arquivo:**
   `/home/user/lovable-Celite/supabase/functions/webhook-asaas/index.ts`

2. **Copiar TODO o conteúdo** (636 linhas)

3. **Supabase Dashboard:**
   - Edge Functions → webhook-asaas → Edit Function
   - **SUBSTITUIR** todo o código pelo novo (V3.0)
   - Save → Deploy

---

## ✅ **OPÇÃO 3: TRIGGER REDEPLOY**

**Mais simples:**

1. **Supabase Dashboard** → Edge Functions

2. **Clicar** em `webhook-asaas`

3. **Procurar botão:** "Redeploy" ou "Deploy"

4. **Confirmar**

**Isso vai pegar o código do GitHub e deployar!**

---

## 🔍 **COMO CONFIRMAR QUE DEPLOYOU V3.0:**

**Após deploy, verificar:**

1. **Supabase Dashboard** → Edge Functions → webhook-asaas → Logs

2. **Fazer teste manual:**
```bash
curl -X POST "https://zytxwdgzjqrcmbnpgofj.supabase.co/functions/v1/webhook-asaas" \
  -H "Content-Type: application/json" \
  -d '{
    "event": "PAYMENT_RECEIVED",
    "payment": {
      "id": "test123",
      "customer": "test_customer",
      "value": 199.90,
      "netValue": 189.90,
      "dateCreated": "2025-11-15T00:00:00Z",
      "status": "RECEIVED",
      "billingType": "PIX",
      "description": "Teste ref=TESTE2025A"
    }
  }'
```

3. **Ver logs em tempo real:**
   - Deve aparecer: `[FIND CONTADOR]` (isso é do V3.0!)
   - **SE aparecer:** `Cliente não encontrado` = AINDA É VERSÃO ANTIGA!

---

## 📊 **DIFERENÇAS ENTRE VERSÕES:**

### **VERSÃO ANTIGA (atual):**
```typescript
if (!cliente) {
  return new Response(JSON.stringify({
    error: 'Cliente não encontrado'
  }), { status: 404 });
}
```

### **VERSÃO V3.0 (correta):**
```typescript
// Encontra contador via 3 formas
const contadorId = await encontrarContador(payload, supabase);

// Auto-cria cliente
const cliente = await buscarOuCriarCliente(
  payment.customer,
  contadorId,
  payment,
  supabase
);
```

---

## 🎯 **APÓS DEPLOY:**

1. **Criar nova cobrança no ASAAS**
2. **Marcar como recebida**
3. **Ver logs do webhook**
4. **DEVE FUNCIONAR!**

---

**Escolha OPÇÃO 1, 2 ou 3 e execute!**

**Me diga qual opção você vai usar!** 🚀
