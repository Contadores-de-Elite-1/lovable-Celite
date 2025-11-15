# ⚠️ VERIFICAR SE WEBHOOK ESTÁ CONFIGURADO NO ASAAS

**Possível causa:** Webhook não está configurado no ASAAS Sandbox

---

## 🔍 VERIFICAR NO ASAAS:

**1. No ASAAS Sandbox:** https://sandbox.asaas.com

**2. Menu → Configurações → Webhooks**

**3. Verificar se existe webhook com:**

```
URL: https://zytxwdgzjqrcmbnpgofj.supabase.co/functions/v1/webhook-asaas
```

**4. Eventos marcados devem incluir:**
- ✅ PAYMENT_RECEIVED
- ✅ PAYMENT_CONFIRMED
- ✅ PAYMENT_UPDATED

---

## ⚠️ SE NÃO EXISTIR:

**Criar webhook no ASAAS:**

**1. Configurações → Webhooks → Novo Webhook**

**2. Preencher:**

```
Nome: Webhook Supabase
URL: https://zytxwdgzjqrcmbnpgofj.supabase.co/functions/v1/webhook-asaas
Tipo de Autenticação: Sem autenticação (ou deixar em branco)
Eventos: Marcar todos de PAYMENT_*
Status: Ativo
```

**3. Salvar**

**4. Criar nova cobrança e testar novamente**

---

## 📊 OU VERIFICAR LOGS DE ENVIO:

**No ASAAS:**

**1. Configurações → Webhooks**

**2. Clicar no webhook (se existir)**

**3. Logs de envio → Procurar pela fatura 11967398**

**4. Ver:**
- Status HTTP retornado
- Resposta do webhook
- Se houve erro

---

**Me informe o que encontrou!** 🔍
