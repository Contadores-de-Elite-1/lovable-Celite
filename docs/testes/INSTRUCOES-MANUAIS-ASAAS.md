# 🎯 INSTRUÇÕES MANUAIS - CRIAR COBRANÇA ASAAS

**Tempo:** 3 minutos | **Dificuldade:** Fácil

---

## 📍 PASSO 1: Login no ASAAS Sandbox

1. Acesse: https://sandbox.asaas.com
2. Faça login com suas credenciais

---

## 📍 PASSO 2: Criar Cobrança

1. **No menu lateral esquerdo**, clique em **"Cobranças"**

2. Clique no botão **"Nova Cobrança"** (canto superior direito)

3. **Preencha o formulário:**

```
┌─────────────────────────────────────────┐
│ DADOS DA COBRANÇA                       │
├─────────────────────────────────────────┤
│                                         │
│ Cliente *                               │
│ [cus_000007222099          ] 🔍         │
│                                         │
│ (Se não aparecer, clique no campo      │
│  e digite o ID)                         │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│ Valor da cobrança *                     │
│ R$ [199,90]                             │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│ Data de vencimento *                    │
│ [15/11/2025] 📅                         │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│ Forma de pagamento *                    │
│ ( ) Boleto bancário                     │
│ (•) PIX  ← SELECIONE                    │
│ ( ) Cartão de crédito                   │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│ Descrição (opcional)                    │
│ [Teste webhook V3.0 Supabase]           │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│         [Cancelar]    [Criar]           │
│                                         │
└─────────────────────────────────────────┘
```

4. Clique em **"Criar"**

---

## 📍 PASSO 3: Marcar como Recebida

Após criar, você verá a tela de detalhes da cobrança:

1. **Procure pelo botão** (pode ter nomes diferentes):
   - "Confirmar Recebimento" OU
   - "Recebido" OU
   - "Marcar como Pago" OU
   - Menu de ações (⋮) → "Confirmar recebimento"

2. **Clique no botão**

3. **Confirme** o recebimento (se pedir confirmação)

---

## 📍 PASSO 4: Copiar Payment ID

1. **Na tela de detalhes da cobrança**, procure pelo **ID da cobrança**

2. O ID tem formato: `pay_000123456789` ou similar

3. **COPIE este ID!** Você vai precisar dele!

**Exemplo:**
```
ID da Cobrança: pay_000123456789
             ou: 11967250
```

---

## 📍 PASSO 5: Aguardar Webhook

**⏳ Aguarde 10-15 segundos**

O ASAAS vai enviar automaticamente o webhook para o Supabase!

---

## 📍 PASSO 6: Verificar Resultado

**Opção 1: Script Automático (RECOMENDADO)**

No terminal, execute:

```bash
cd /home/user/lovable-Celite
node scripts/verificar-resultado.js pay_000123456789
```

*(Substitua `pay_000123456789` pelo ID real que você copiou)*

---

**Opção 2: Queries SQL Manuais**

1. Acesse: https://supabase.com/dashboard/project/zytxwdgzjqrcmbnpgofj

2. Menu lateral → **SQL Editor**

3. Clique em **"New query"**

4. Cole esta query:

```sql
-- Buscar pagamento pelo ID do ASAAS
SELECT
  p.id AS pagamento_id,
  p.tipo,
  p.valor_bruto,
  p.status,
  p.created_at,
  c.nome_empresa AS cliente
FROM pagamentos p
LEFT JOIN clientes c ON p.cliente_id = c.id
WHERE p.asaas_payment_id = 'pay_000123456789'  -- SUBSTITUA AQUI!
ORDER BY p.created_at DESC;
```

5. **IMPORTANTE:** Substitua `pay_000123456789` pelo ID real!

6. Clique em **"Run"** (botão verde)

---

## ✅ RESULTADO ESPERADO

### Se o Webhook V3.0 funcionou:

**Query deve retornar:**
```
1 linha encontrada

Campos:
• pagamento_id: uuid-xxx-xxx
• tipo: ativacao
• valor_bruto: 199.90
• status: confirmado
• created_at: 2025-11-15 XX:XX:XX
• cliente: (nome do cliente)
```

### Se não encontrou:

**Possíveis causas:**
1. ⏳ Webhook ainda não processou (aguarde mais 10 segundos)
2. ❌ Erro no webhook (verificar logs)
3. ❌ Payment ID incorreto
4. ❌ Variável `ASAAS_API_KEY` não configurada na Edge Function

**Verificar logs:**
https://supabase.com/dashboard/project/zytxwdgzjqrcmbnpgofj/functions/webhook-asaas/logs

---

## 📊 QUERY ADICIONAL: Ver Comissões

Depois de confirmar que o pagamento existe, veja as comissões geradas:

```sql
-- Buscar comissões do pagamento
SELECT
  c.tipo,
  c.valor,
  c.percentual,
  c.status,
  c.nivel_sponsor
FROM comissoes c
JOIN pagamentos p ON c.pagamento_id = p.id
WHERE p.asaas_payment_id = 'pay_000123456789'  -- SUBSTITUA AQUI!
ORDER BY c.created_at;
```

**Deve retornar:** Múltiplas comissões (ativação + overrides)

---

## 🔍 TROUBLESHOOTING

### "Cliente não encontrado"

**Solução:** O cliente `cus_000007222099` pode não existir no ASAAS Sandbox.

**Opção 1:** Criar cliente primeiro no ASAAS:
1. ASAAS → Clientes → Nova Cliente
2. Preencher dados básicos
3. Copiar ID gerado
4. Usar esse ID na cobrança

**Opção 2:** Usar qualquer cliente existente na sua conta ASAAS

---

### "Webhook não processou"

**Verificações:**

1. **Webhook está configurado no ASAAS?**
   - ASAAS → Configurações → Webhooks
   - URL: `https://zytxwdgzjqrcmbnpgofj.supabase.co/functions/v1/webhook-asaas`
   - Eventos marcados: `PAYMENT_RECEIVED`, `PAYMENT_CONFIRMED`

2. **Variável `ASAAS_API_KEY` está configurada?**
   - Supabase Dashboard → Edge Functions → webhook-asaas → Secrets
   - Deve ter: `ASAAS_API_KEY` com valor da chave

3. **Logs da Edge Function:**
   - https://supabase.com/dashboard/project/zytxwdgzjqrcmbnpgofj/functions/webhook-asaas/logs
   - Procurar por erros recentes

---

## 📝 CHECKLIST RÁPIDO

- [ ] Acessei ASAAS Sandbox
- [ ] Criei nova cobrança
- [ ] Cliente: `cus_000007222099` (ou outro)
- [ ] Valor: R$ 199,90
- [ ] Vencimento: Hoje
- [ ] Forma: PIX
- [ ] Marquei como recebida
- [ ] Copiei Payment ID
- [ ] Aguardei 15 segundos
- [ ] Executei verificação (script ou SQL)
- [ ] Confirmei pagamento criado
- [ ] Confirmei comissões calculadas

---

## 🆘 PRECISA DE AJUDA?

**Me passe:**
1. Payment ID que você criou
2. Screenshot da tela do ASAAS (cobrança criada)
3. Resultado da query SQL (se executou)

**Eu vou:**
- ✅ Investigar o que aconteceu
- ✅ Verificar logs do webhook
- ✅ Identificar o problema
- ✅ Fornecer solução

---

**Data:** 2025-11-15
**Versão:** Webhook V3.0
**Documentação:** docs/WEBHOOK-V3-CHANGELOG.md
