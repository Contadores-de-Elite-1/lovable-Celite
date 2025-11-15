# DEPLOY WEBHOOK V3.0 - EXECUTE AGORA

**STATUS:** Codigo deployado para GitHub com sucesso!
**BRANCH:** `claude/auto-mode-mobile-first-011Qqu5wN96UmLxdioNTka61`
**COMMIT:** 27487af

---

## CODIGO JA ESTA NO GITHUB

O webhook V3.0 de producao foi:
- Substituido em `supabase/functions/webhook-asaas/index.ts`
- Commitado com mensagem completa
- Pushed para branch `claude/auto-mode-mobile-first-011Qqu5wN96UmLxdioNTka61`

---

## PROXIMO PASSO: DEPLOY PARA SUPABASE

Escolha UMA opcao abaixo:

### OPCAO 1: Deploy via Supabase Dashboard (MAIS RAPIDO)

1. Abrir: https://supabase.com/dashboard/project/zytxwdgzjqrcmbnpgofj/functions

2. Clicar em `webhook-asaas`

3. Procurar botao: **"Deploy"** ou **"Redeploy"**

4. Confirmar

5. Aguardar 1-2 minutos

### OPCAO 2: Deploy via GitHub Integration

Se Supabase estiver integrado com GitHub:

1. Dashboard → Edge Functions → webhook-asaas

2. Procurar opcao: **"Deploy from GitHub"**

3. Selecionar branch: `claude/auto-mode-mobile-first-011Qqu5wN96UmLxdioNTka61`

4. Confirmar

### OPCAO 3: Deploy via Supabase CLI (Manual)

```bash
# Instalar CLI (se nao tiver)
npm install -g supabase

# Login
supabase login

# Link project
supabase link --project-ref zytxwdgzjqrcmbnpgofj

# Deploy function
supabase functions deploy webhook-asaas
```

---

## COMO CONFIRMAR QUE DEPLOYOU VERSAO V3.0

Apos deploy, testar com:

```bash
curl -X POST "https://zytxwdgzjqrcmbnpgofj.supabase.co/functions/v1/webhook-asaas" \
  -H "Content-Type: application/json" \
  -d '{
    "event": "PAYMENT_RECEIVED",
    "id": "evt_test_deploy_v3",
    "payment": {
      "id": "pay_test_deploy",
      "customer": "cus_test_new_customer",
      "value": 199.90,
      "netValue": 189.90,
      "dateCreated": "2025-11-15T12:00:00Z",
      "status": "RECEIVED",
      "billingType": "PIX",
      "description": "Teste deploy V3.0 ref=TESTE2025A"
    }
  }'
```

**Logs esperados da V3.0:**
```
[WEBHOOK] ========================================
[WEBHOOK] New webhook received from ASAAS
[FIND_CONTADOR] Starting contador lookup
[FIND_CONTADOR] Method 1: Checking invite token in description
[FIND_CONTADOR] Token found in description: TESTE2025A
[CLIENT] Starting client lookup/creation
[CLIENT] Client not found - AUTO-CREATING
[ASAAS_API] Fetching customer: cus_test_new_customer
```

**Se aparecer:**
- `[FIND_CONTADOR]` = V3.0 DEPLOYADA! ✅
- `Cliente nao encontrado` (sem outros logs) = AINDA VERSAO ANTIGA ❌

---

## TESTE REAL APOS DEPLOY

1. Criar nova cobranca no ASAAS:
   - Nome: Cliente Teste V3
   - Valor: R$ 130,00
   - Descricao: **"Mensalidade ref=TESTE2025A"**
   - Forma: Boleto ou PIX

2. Marcar como recebida

3. Ver logs em tempo real no Dashboard:
   - Edge Functions → webhook-asaas → Logs

4. Verificar se apareceu em:
   - Tabela `clientes` (novo cliente criado automaticamente)
   - Tabela `pagamentos` (pagamento registrado)
   - Tabela `comissoes` (comissoes calculadas)

---

## DIFERENCAS ENTRE VERSOES

### VERSAO ANTIGA (problema):
```typescript
const { data: cliente } = await supabase
  .from('clientes')
  .eq('asaas_customer_id', payment.customer)
  .maybeSingle();

if (!cliente) {
  return new Response(JSON.stringify({
    error: 'Cliente nao encontrado'
  }), { status: 404 });
}
```

### VERSAO V3.0 (correta):
```typescript
// Encontra contador via 3 formas
const contadorId = await findContadorId(payload, supabase);

// Auto-cria cliente
const cliente = await findOrCreateClient(
  payment.customer,
  contadorId,
  payment,
  supabase
);
```

---

## ESCOLHA OPCAO 1, 2 OU 3 E EXECUTE!

Depois me avise quando deployar para eu acompanhar os logs com voce.
