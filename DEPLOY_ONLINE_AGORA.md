# 🚀 DEPLOY ONLINE AGORA - 3 MINUTOS

## MÉTODO 1: Dashboard Supabase (MAIS RÁPIDO - 2 MIN)

### PASSO 1: Abra o link
```
https://supabase.com/dashboard/project/zytxwdgzjqrcmbnpgofj/functions/webhook-asaas
```

### PASSO 2: Click "Deploy a new version"

### PASSO 3: Cole o código corrigido

- Copie TODO o conteúdo do arquivo: `supabase/functions/webhook-asaas/index.ts`
- Cole no editor do Supabase
- Click "Deploy"

✅ **PRONTO!** Webhook atualizado em produção!

---

## MÉTODO 2: Via GitHub (SE INTEGRADO - 30 SEG)

### PASSO 1: Vá para Edge Functions
```
https://supabase.com/dashboard/project/zytxwdgzjqrcmbnpgofj/functions
```

### PASSO 2: Selecione webhook-asaas

### PASSO 3: Deploy from GitHub
- Branch: `claude/auto-mode-mobile-first-011Qqu5wN96UmLxdioNTka61`
- Click "Deploy"

✅ **PRONTO!** Deploy automático do GitHub!

---

## VERIFICAR DEPLOY

### Ver logs em tempo real:
```
https://supabase.com/dashboard/project/zytxwdgzjqrcmbnpgofj/logs/edge-logs
```

### Filtrar por:
- Function: `webhook-asaas`
- Buscar: `[WEBHOOK]` ou `[CLIENT LOOKUP]`

---

## TESTAR WEBHOOK ONLINE

### Opção 1: Via ASAAS Sandbox

1. Acesse: https://sandbox.asaas.com/
2. Vá em: **Cobranças → Localizar**
3. Procure uma cobrança existente
4. Click: **"Simular Pagamento"**
5. ASAAS envia webhook automaticamente para:
   ```
   https://zytxwdgzjqrcmbnpgofj.supabase.co/functions/v1/webhook-asaas
   ```

### Opção 2: Via CURL (Teste Manual)

```bash
curl -X POST https://zytxwdgzjqrcmbnpgofj.supabase.co/functions/v1/webhook-asaas \
  -H "Content-Type: application/json" \
  -d '{
    "event": "PAYMENT_RECEIVED",
    "payment": {
      "id": "pay_test_'$(date +%s)'",
      "customer": "SEU_CUSTOMER_ID_AQUI",
      "value": 199.90,
      "netValue": 197.90,
      "dateCreated": "'$(date -u +%Y-%m-%dT%H:%M:%S.000Z)'",
      "status": "RECEIVED",
      "billingType": "PIX"
    }
  }'
```

**IMPORTANTE**: Substitua `SEU_CUSTOMER_ID_AQUI` por um `asaas_customer_id` que EXISTE no banco!

---

## VERIFICAR SUCESSO

### Logs devem mostrar:

```
✅ [WEBHOOK] Raw payload received...
✅ [WEBHOOK] Parsed payload: { event: "PAYMENT_RECEIVED", ... }
✅ [VALIDATION] Values received: value: 199.90, netValue: 197.90
✅ [CLIENT LOOKUP] Searching for customer: cus_xxx
✅ [CLIENT LOOKUP] ✅ Cliente encontrado: abc123...
✅ Pagamento registrado: xyz789...
✅ Comissoes calculadas com sucesso
```

### Banco deve ter:

```sql
-- Ver pagamento criado
SELECT * FROM pagamentos ORDER BY created_at DESC LIMIT 1;

-- Ver comissões criadas
SELECT * FROM comissoes WHERE status = 'aprovada' ORDER BY created_at DESC LIMIT 5;
```

---

## SE DER ERRO

### Ver erro específico nos logs:
```
https://supabase.com/dashboard/project/zytxwdgzjqrcmbnpgofj/logs/edge-logs
```

### Buscar por:
- `❌ ERRO NO WEBHOOK ASAAS`
- `[CLIENT LOOKUP] Cliente NÃO encontrado`
- `error_message`

### Copiar erro completo e me enviar!

---

## CÓDIGO COMPLETO PRONTO

O código está em: `supabase/functions/webhook-asaas/index.ts`

**O que foi corrigido:**
1. ✅ netValue null → fallback para value
2. ✅ Logging detalhado em cada passo
3. ✅ Cliente não encontrado → mensagem clara
4. ✅ Erros específicos → rastreabilidade total

---

## VELOCIDADE MÁXIMA 🚀

**Tempo estimado:**
- Deploy via Dashboard: 2 min
- Deploy via GitHub: 30 seg
- Teste via ASAAS: 1 min
- **TOTAL: 3 minutos para funcionar ONLINE!**

---

**AGORA SIM: ONLINE = ONLINE!** ✅
