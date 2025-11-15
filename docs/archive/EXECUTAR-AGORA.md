# 🚀 EXECUTAR AGORA - Cliente Faltante

**Data:** 2025-01-14
**Status:** Webhook funcionando ✅ | Cliente faltando ❌
**Ação:** Criar cliente `cus_000007222099`

---

## ✅ SITUAÇÃO ATUAL

**O QUE ESTÁ FUNCIONANDO:**
- ✅ Webhook deployed no Supabase
- ✅ ASAAS enviando eventos com sucesso
- ✅ Supabase recebendo webhooks
- ✅ Código do webhook corrigido (idempotência, eventos)

**O QUE FALTA:**
- ❌ Cliente `cus_000007222099` não existe no banco
- ❌ Logs mostram: "Cliente não encontrado: cus_000007222099"

**SOLUÇÃO:** Criar este cliente no banco de dados.

---

## 🎯 OPÇÃO 1: SQL DIRETO (RECOMENDADO - 2 minutos)

### Passo 1: Acesse o Supabase SQL Editor

```
https://supabase.com/dashboard/project/zytxwdgzjqrcmbnpgofj/editor
```

### Passo 2: Execute este SQL

```sql
-- 1️⃣ VERIFICAR SE JÁ TEM CONTADOR
SELECT id, nivel, status FROM contadores LIMIT 1;
```

**Se retornar um contador:**
- Copie o `id` do contador
- Pule para o Passo 3

**Se NÃO retornar nada (vazio):**
```sql
-- 1.1) Pegar um user_id
SELECT id, email FROM auth.users LIMIT 1;

-- 1.2) Criar contador (SUBSTITUIR o USER_ID abaixo)
INSERT INTO contadores (user_id, nivel, status, xp, clientes_ativos)
VALUES ('COLE_O_USER_ID_AQUI', 'bronze', 'ativo', 0, 0)
RETURNING id;

-- Copie o `id` retornado
```

### Passo 3: Criar o cliente

```sql
-- 2️⃣ CRIAR CLIENTE (SUBSTITUIR o CONTADOR_ID)
INSERT INTO clientes (
  contador_id,
  nome_empresa,
  cnpj,
  contato_email,
  status,
  plano,
  valor_mensal,
  asaas_customer_id,
  data_ativacao
) VALUES (
  'COLE_O_CONTADOR_ID_AQUI',
  'Cliente Teste Real',
  '00000000000000',
  'teste@real.com',
  'ativo',
  'profissional',
  199.90,
  'cus_000007222099',
  NOW()
) RETURNING id, asaas_customer_id;
```

### Passo 4: Verificar

```sql
-- 3️⃣ CONFIRMAR QUE FOI CRIADO
SELECT
  id,
  nome_empresa,
  asaas_customer_id,
  status,
  contador_id
FROM clientes
WHERE asaas_customer_id = 'cus_000007222099';
```

**Resultado esperado:**
- 1 linha retornada
- `asaas_customer_id` = `cus_000007222099`
- `status` = `ativo`

---

## 🎯 OPÇÃO 2: SCRIPT NODE.JS (Alternativa - 5 minutos)

Se preferir usar script:

```bash
# 1. Certifique-se de estar no diretório do projeto
cd /home/user/lovable-Celite

# 2. Execute o script
node criar-cliente-especifico.mjs
```

**O script:**
- ✅ Verifica se cliente já existe
- ✅ Cria contador se necessário
- ✅ Cria cliente com ID correto
- ✅ Retorna dados do cliente criado

---

## ✅ VALIDAÇÃO

Após criar o cliente, **TESTE O WEBHOOK:**

### Opção A: Via ASAAS Dashboard

1. Acesse https://sandbox.asaas.com
2. Vá em: Integrações → Webhooks
3. Clique em "Testar webhook"
4. Envie um evento de teste

### Opção B: Simular pagamento real

```bash
# Criar cobrança no ASAAS (substitua o token)
curl -X POST https://api-sandbox.asaas.com/v3/payments \
  -H "access_token: $aact_hmlg_000MzkwODA2MWY2OGM3MWRlMDU2NWM3MzJlNzZtNGZhZGY6Ojg5NGI4NmYzLWQxYmUtNDkwYy05ZWMwLTM5ZTFhZGUwYWM2MDo6JGFhY2hfNDNkMWQ3N2YtNTEzOS00NmU3LWE4NzAtMzU0Y2Q1ZWEyYTA4" \
  -H "content-type: application/json" \
  -d '{
    "customer": "cus_000007222099",
    "billingType": "PIX",
    "value": 199.90,
    "dueDate": "2025-01-15"
  }'

# Simular recebimento (substitua PAYMENT_ID e token)
curl -X POST https://api-sandbox.asaas.com/v3/payments/PAYMENT_ID/receiveInCash \
  -H "access_token: SEU_TOKEN_AQUI" \
  -H "content-type: application/json" \
  -d '{
    "paymentDate": "2025-01-14",
    "value": 199.90
  }'
```

### Verificar nos logs do Supabase

```
https://supabase.com/dashboard/project/zytxwdgzjqrcmbnpgofj/logs/edge-functions
```

**Procure por:**
- ✅ "Cliente encontrado" (não mais "Cliente não encontrado")
- ✅ "Pagamento criado"
- ✅ "Comissões calculadas"

---

## 📊 QUERIES DE VERIFICAÇÃO

### Verificar pagamentos criados

```sql
SELECT
  id,
  asaas_payment_id,
  asaas_customer_id,
  valor,
  status,
  created_at
FROM pagamentos
WHERE asaas_customer_id = 'cus_000007222099'
ORDER BY created_at DESC
LIMIT 5;
```

### Verificar comissões calculadas

```sql
SELECT
  c.id,
  c.tipo,
  c.valor,
  c.status,
  ct.nivel as contador_nivel,
  c.created_at
FROM comissoes c
JOIN contadores ct ON c.contador_id = ct.id
WHERE c.cliente_id = (
  SELECT id FROM clientes
  WHERE asaas_customer_id = 'cus_000007222099'
)
ORDER BY c.created_at DESC
LIMIT 10;
```

### Verificar audit logs

```sql
SELECT
  evento,
  detalhes,
  created_at
FROM audit_logs
WHERE detalhes::text LIKE '%cus_000007222099%'
ORDER BY created_at DESC
LIMIT 10;
```

---

## 🎯 CRITÉRIO DE SUCESSO

**✅ MVP VALIDADO SE:**

1. ✅ Cliente existe no banco com `asaas_customer_id = 'cus_000007222099'`
2. ✅ Webhook recebe evento do ASAAS sem erro "Cliente não encontrado"
3. ✅ Pagamento é criado na tabela `pagamentos`
4. ✅ Comissões são calculadas na tabela `comissoes`
5. ✅ Logs do Supabase mostram sucesso (200 OK)

---

## 🚨 SE DER ERRO

### Erro: "violates foreign key constraint"
**Causa:** `contador_id` não existe
**Solução:** Execute o Passo 1.2 para criar um contador primeiro

### Erro: "duplicate key value violates unique constraint"
**Causa:** Cliente já existe
**Solução:** Execute a query de verificação do Passo 4

### Erro: "permission denied"
**Causa:** RLS bloqueando
**Solução:** Use o SQL Editor como admin (já tem permissões)

---

## 📝 PRÓXIMOS PASSOS (APÓS VALIDAR)

1. ✅ Testar com múltiplos pagamentos
2. ✅ Validar cálculo de comissões multi-nível
3. ✅ Testar idempotência (webhook duplicado)
4. ✅ Documentar testes realizados
5. ✅ Preparar para produção

---

**TEMPO ESTIMADO: 2-5 minutos**
**COMPLEXIDADE: Baixa**
**RISCO: Zero (ambiente de teste)**

---

**EXECUTE AGORA E REPORTE O RESULTADO!** 🚀
