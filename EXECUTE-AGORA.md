# ⚡ EXECUTE AGORA - 3 COMANDOS

## 1️⃣ FAZER PULL (atualizar código)

```bash
git pull origin claude/auto-mode-mobile-first-011Qqu5wN96UmLxdioNTka61
```

## 2️⃣ CRIAR CLIENTE

```bash
node criar-cliente-especifico.mjs
```

**Este script:**
- ✅ Cria cliente com ID `cus_000007222335`
- ✅ Vincula a um contador automaticamente
- ✅ Status 'ativo' pronto para testes
- ✅ Mostra comando curl para testar

## 3️⃣ TESTAR WEBHOOK

O script vai mostrar o comando curl exato. Será algo assim:

```bash
curl -X POST https://zytxwdgzjqrcmbnpgofj.supabase.co/functions/v1/webhook-asaas \
  -H "Content-Type: application/json" \
  -d '{"id": "evt_test_123456", "event": "PAYMENT_RECEIVED", "payment": {...}}'
```

---

## ✅ RESULTADO ESPERADO:

```json
{
  "success": true,
  "pagamento_id": "uuid...",
  "comissoes_criadas": 2
}
```

---

## 🎯 SE FUNCIONAR:

Sistema 100% operacional! Próximos passos:

1. **Configurar webhook no ASAAS**:
   ```bash
   node configurar-webhook-asaas.mjs
   ```

2. **Testar com pagamento real do ASAAS Sandbox**

3. **Verificar comissões**:
   ```bash
   node test-baby-step-4-check-commissions.mjs
   ```

---

**MODO ROBÔ: TUDO PRONTO EM 3 COMANDOS!** 🤖
