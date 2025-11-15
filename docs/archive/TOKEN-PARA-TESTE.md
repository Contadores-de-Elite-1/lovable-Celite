# 🎫 TOKEN PARA TESTE - USE ESTE!

**Data:** 2025-11-15

---

## ✅ TOKEN GERADO PARA VOCÊ:

```
TESTE2025A
```

---

## 📋 COPIE E COLE NA DESCRIÇÃO DA COBRANÇA ASAAS:

```
Mensalidade ref=TESTE2025A
```

**OU qualquer um desses formatos (todos funcionam):**
- `Mensalidade ref=TESTE2025A`
- `Pagamento ref=TESTE2025A`
- `Teste webhook ref=TESTE2025A`
- `ref=TESTE2025A`
- `token=TESTE2025A`

---

## ⚠️ IMPORTANTE: CRIAR CONVITE NO BANCO PRIMEIRO

**Antes de criar a cobrança no ASAAS**, você precisa criar o convite no banco!

### 📍 OPÇÃO 1: SQL Editor (RECOMENDADO)

1. **Acesse:** https://supabase.com/dashboard/project/zytxwdgzjqrcmbnpgofj

2. **Menu lateral → SQL Editor → New query**

3. **Primeiro, pegue um contador_id válido:**

```sql
-- Buscar contador ativo
SELECT
  c.id as contador_id,
  p.nome as contador_nome,
  p.email
FROM contadores c
LEFT JOIN profiles p ON c.user_id = p.id
WHERE c.status = 'ativo'
ORDER BY c.created_at DESC
LIMIT 1;
```

4. **Copie o `contador_id` retornado** (ex: `123e4567-e89b-12d3-a456-426614174000`)

5. **Execute esta query (SUBSTITUA o contador_id):**

```sql
-- Criar convite
INSERT INTO invites (
  tipo,
  emissor_id,
  token,
  expira_em,
  status
)
VALUES (
  'cliente',
  'COLE_CONTADOR_ID_AQUI',  -- ← SUBSTITUA AQUI!
  'TESTE2025A',
  NOW() + INTERVAL '30 days',
  'ativo'
)
RETURNING id, token, emissor_id;
```

6. **Clique em "Run"**

7. **Deve retornar:** 1 linha criada com o token `TESTE2025A`

---

### 📍 OPÇÃO 2: Se Já Souber o Contador ID

Se você já tiver um contador_id específico, use direto:

```sql
INSERT INTO invites (tipo, emissor_id, token, expira_em, status)
VALUES (
  'cliente',
  'SEU_CONTADOR_ID_AQUI',
  'TESTE2025A',
  NOW() + INTERVAL '30 days',
  'ativo'
);
```

---

## 🎯 FLUXO COMPLETO DO TESTE

```
┌─────────────────────────────────────────┐
│ 1. CRIAR CONVITE NO SUPABASE            │
│    • SQL Editor                         │
│    • INSERT INTO invites                │
│    • token = TESTE2025A                 │
│    • emissor_id = contador_id           │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│ 2. CRIAR COBRANÇA NO ASAAS              │
│    • Cliente: dados reais (sua esposa)  │
│    • Valor: R$ 199,90                   │
│    • Descrição: "Mensalidade ref=TESTE2025A" │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│ 3. MARCAR COMO RECEBIDA                 │
│    • ASAAS → Confirmar recebimento      │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│ 4. WEBHOOK PROCESSA (AUTOMÁTICO)        │
│    • ASAAS envia webhook → Supabase     │
│    • Webhook lê: "ref=TESTE2025A"       │
│    • Busca token na tabela invites      │
│    • Encontra contador_id               │
│    • Cria cliente vinculado             │
│    • Calcula comissões                  │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│ 5. VERIFICAR RESULTADO                  │
│    • node scripts/verificar-resultado.js│
│    • Confirma cliente criado            │
│    • Confirma vinculo ao contador       │
│    • Confirma comissões calculadas      │
└─────────────────────────────────────────┘
```

---

## ✅ EXEMPLO REAL DE COMO VAI FICAR:

### No ASAAS (tela de criar cobrança):

```
┌─────────────────────────────────────────┐
│ NOVA COBRANÇA                           │
├─────────────────────────────────────────┤
│ Cliente:                                │
│ [Katiucha Costa              ] 🔍       │
│                                         │
│ Valor:                                  │
│ R$ [199,90]                             │
│                                         │
│ Vencimento:                             │
│ [15/11/2025] 📅                         │
│                                         │
│ Forma de pagamento:                     │
│ (•) PIX                                 │
│                                         │
│ Descrição:                              │
│ [Mensalidade ref=TESTE2025A]  ← AQUI!  │
│                                         │
│         [Cancelar]    [Criar]           │
└─────────────────────────────────────────┘
```

---

## 🔍 COMO O WEBHOOK VAI PROCESSAR:

Quando marcar como recebida, o webhook V3.0 vai fazer:

```javascript
// 1. ASAAS envia webhook com dados:
{
  payment: {
    customer: "cus_987654321",
    value: 199.90,
    description: "Mensalidade ref=TESTE2025A"  // ← Aqui!
  }
}

// 2. Webhook extrai token da description
const token = "TESTE2025A"  // Extraído via regex

// 3. Busca token na tabela invites
SELECT emissor_id FROM invites WHERE token = 'TESTE2025A'
// Retorna: contador_id do convite

// 4. Busca dados do customer no ASAAS
GET /api/v3/customers/cus_987654321
// Retorna: { name: "Katiucha Costa", cpfCnpj: "...", email: "..." }

// 5. Cria cliente no Supabase
INSERT INTO clientes (
  contador_id,      // ← Do convite!
  asaas_customer_id,
  nome_empresa,     // "Katiucha Costa"
  cnpj,
  contato_email,
  status,           // "ativo"
  valor_mensal      // 199.90
)

// 6. Registra pagamento

// 7. Calcula comissões para o contador do convite

// 8. Retorna HTTP 200
```

---

## 📊 DADOS DO TESTE:

| Campo | Valor |
|-------|-------|
| **Token** | `TESTE2025A` |
| **Formato na descrição** | `Mensalidade ref=TESTE2025A` |
| **Validade** | 30 dias |
| **Tipo** | cliente |
| **Status** | ativo |

---

## 💡 TROUBLESHOOTING

### "Token não encontrado"

**Causa:** Convite não foi criado no banco

**Solução:** Execute a query SQL acima para criar o convite

---

### "Contador não encontrado"

**Causa:** contador_id inválido no convite

**Solução:** Use a query para buscar um contador_id válido

---

### "Webhook não vinculou contador"

**Causa:** Description não tem o formato correto

**Solução:** Certifique-se que tem `ref=TESTE2025A` ou `token=TESTE2025A`

---

## 🚀 CHECKLIST RÁPIDO

- [ ] Executei SQL para buscar contador_id
- [ ] Copiei o contador_id
- [ ] Executei SQL para criar convite com token TESTE2025A
- [ ] Confirmei que convite foi criado (1 row returned)
- [ ] Criei cobrança no ASAAS
- [ ] Na descrição, coloquei: "Mensalidade ref=TESTE2025A"
- [ ] Marquei como recebida
- [ ] Aguardei 15 segundos
- [ ] Executei verificação (script ou query SQL)

---

## 📞 DEPOIS DO TESTE

**Me passe:**
1. Payment ID criado
2. Contador ID usado no convite
3. Resultado da verificação

**Eu confirmo:**
- ✅ Cliente criado automaticamente
- ✅ Cliente vinculado ao contador correto
- ✅ Comissões calculadas
- ✅ Webhook V3.0 funcionando!

---

**🎯 USE O TOKEN: `TESTE2025A`**

**📋 DESCRIÇÃO: `Mensalidade ref=TESTE2025A`**

**✅ SISTEMA PRONTO!**
