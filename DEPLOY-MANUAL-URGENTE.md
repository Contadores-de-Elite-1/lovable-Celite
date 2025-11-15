# DEPLOY MANUAL URGENTE - WEBHOOK V3.0

## PROBLEMA IDENTIFICADO:

**ASAAS recebendo 404** = Versão ANTIGA ainda rodando!

GitHub Actions deployou mas versão antiga ainda está ativa.

---

## DEPLOY MANUAL - PASSO A PASSO

### OPCAO 1: Copiar Codigo Manualmente (MAIS RAPIDO)

**1. Abrir o codigo no GitHub:**
https://github.com/Contadores-de-Elite-1/lovable-Celite/blob/claude/auto-mode-mobile-first-011Qqu5wN96UmLxdioNTka61/supabase/functions/webhook-asaas/index.ts

**2. Clicar em "Raw"**

**3. Selecionar TODO o codigo (Ctrl+A) e copiar (Ctrl+C)**

**4. Abrir Supabase Edge Functions:**
https://supabase.com/dashboard/project/zytxwdgzjqrcmbnpgofj/functions/webhook-asaas

**5. Clicar no botao "..." (tres pontinhos) → "Edit Function"**

**6. DELETAR todo o codigo antigo**

**7. COLAR o codigo novo (Ctrl+V)**

**8. Clicar em "Deploy"**

**9. Aguardar 30 segundos**

---

### OPCAO 2: Redeploy via Dashboard

**1. Abrir:**
https://supabase.com/dashboard/project/zytxwdgzjqrcmbnpgofj/functions/webhook-asaas

**2. Procurar botao "Redeploy" ou "Deploy"**

**3. Se tiver opcao "Deploy from GitHub":**
   - Selecionar branch: `claude/auto-mode-mobile-first-011Qqu5wN96UmLxdioNTka61`
   - Confirmar

**4. Aguardar 1-2 minutos**

---

### OPCAO 3: Via Supabase CLI (Terminal)

```bash
# Instalar CLI
npm install -g supabase

# Login
supabase login

# Link project
supabase link --project-ref zytxwdgzjqrcmbnpgofj

# Deploy
cd /home/user/lovable-Celite
supabase functions deploy webhook-asaas --project-ref zytxwdgzjqrcmbnpgofj
```

---

## COMO CONFIRMAR QUE DEPLOYOU V3.0

**Apos deploy, ver codigo deployado:**

1. Abrir: https://supabase.com/dashboard/project/zytxwdgzjqrcmbnpgofj/functions/webhook-asaas

2. Clicar em "Code" ou "View Code"

3. **Procurar por estas funcoes no codigo:**
   - `findContadorId`
   - `findOrCreateClient`
   - `fetchAsaasCustomer`

4. **Se encontrar = V3.0 deployada! ✅**

5. **Se NAO encontrar = Ainda versao antiga ❌**

---

## APOS DEPLOY MANUAL:

**Criar nova cobranca no ASAAS** (a anterior foi penalizada)

1. Nova cobranca
2. Descricao: **"Mensalidade ref=TESTE2025A"**
3. Marcar como recebida
4. Ver logs do Supabase (NAO mais 404!)

---

## ESCOLHA OPCAO 1 (MAIS RAPIDO) E EXECUTE AGORA!

Me avise quando deployar manualmente!
