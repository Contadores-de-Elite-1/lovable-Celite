# 🎯 COMO EXECUTAR QUERIES NO SUPABASE (BABY STEPS)

**Objetivo:** Verificar se webhook processou pagamento e comissões

---

## 📍 PASSO 1: Abrir SQL Editor

**1.** Acesse: https://supabase.com/dashboard/project/zytxwdgzjqrcmbnpgofj

**2.** Menu lateral ESQUERDO → **SQL Editor** (ícone de código)

**3.** Clique em **"New query"** (botão superior direito)

---

## 📍 PASSO 2: Executar Query Rápida (Estado Geral)

**1.** Cole esta query na área de texto:

```sql
-- Ver últimos 3 pagamentos
SELECT
  id,
  tipo,
  valor_bruto,
  status,
  asaas_payment_id,
  created_at,
  NOW() - created_at AS idade
FROM pagamentos
ORDER BY created_at DESC
LIMIT 3;
```

**2.** Clique em **"Run"** (botão verde, canto inferior direito)

**3.** **COPIE o resultado** e me mande (ou tire screenshot)

---

## 📍 PASSO 3: Executar Query de Comissões

**1.** Apague a query anterior

**2.** Cole esta query:

```sql
-- Ver últimas 5 comissões
SELECT
  id,
  tipo,
  valor,
  competencia,
  status,
  created_at,
  NOW() - created_at AS idade
FROM comissoes
ORDER BY created_at DESC
LIMIT 5;
```

**3.** Clique em **"Run"**

**4.** **COPIE o resultado** e me mande

---

## 📍 PASSO 4: Executar Query de Audit Logs

**1.** Apague a query anterior

**2.** Cole esta query:

```sql
-- Ver últimos 3 webhooks processados
SELECT
  id,
  acao,
  payload->>'asaas_payment_id' AS payment_id,
  payload->>'event' AS evento,
  created_at,
  NOW() - created_at AS idade
FROM audit_logs
WHERE acao LIKE '%WEBHOOK%'
ORDER BY created_at DESC
LIMIT 3;
```

**3.** Clique em **"Run"**

**4.** **COPIE o resultado** e me mande

---

## 📍 PASSO 5: Verificar Cliente Específico

**1.** Apague a query anterior

**2.** Cole esta query:

```sql
-- Verificar se cliente cus_000007222099 existe
SELECT
  id,
  nome_empresa,
  status,
  asaas_customer_id,
  data_ativacao,
  created_at
FROM clientes
WHERE asaas_customer_id = 'cus_000007222099';
```

**3.** Clique em **"Run"**

**4.** **RESULTADO ESPERADO:**
```
1 linha retornada mostrando o cliente
```

---

## 🎯 FORMATO DE RESPOSTA

**ME MANDE ASSIM:**

```
=== QUERY 1: PAGAMENTOS ===
Quantidade de linhas: ___
Último pagamento:
  - ID: ___
  - Tipo: ___
  - Valor: R$ ___
  - Status: ___
  - ASAAS ID: ___
  - Idade: ___ (ex: "2 hours")

=== QUERY 2: COMISSÕES ===
Quantidade de linhas: ___
Última comissão:
  - ID: ___
  - Tipo: ___
  - Valor: R$ ___
  - Status: ___
  - Idade: ___

=== QUERY 3: AUDIT LOGS ===
Quantidade de linhas: ___
Último webhook:
  - Ação: ___
  - Payment ID: ___
  - Evento: ___
  - Idade: ___

=== QUERY 4: CLIENTE ===
Cliente encontrado? [ ] Sim [ ] Não
Se SIM:
  - Nome empresa: ___
  - Status: ___
  - Data ativação: ___
```

---

## ⚡ ATALHOS

### Se não quiser copiar linha por linha:

**OPÇÃO RÁPIDA:** Tire screenshot de cada resultado e me mande!

**OPÇÃO SUPER RÁPIDA:** Execute só a Query 8 (Estatísticas):

```sql
SELECT
  'Total Pagamentos' AS metrica,
  COUNT(*)::text AS valor
FROM pagamentos

UNION ALL

SELECT
  'Pagamentos Últimas 24h' AS metrica,
  COUNT(*)::text AS valor
FROM pagamentos
WHERE created_at > NOW() - INTERVAL '24 hours'

UNION ALL

SELECT
  'Total Comissões' AS metrica,
  COUNT(*)::text AS valor
FROM comissoes

UNION ALL

SELECT
  'Comissões Últimas 24h' AS metrica,
  COUNT(*)::text AS valor
FROM comissoes
WHERE created_at > NOW() - INTERVAL '24 hours';
```

**Resultado exemplo:**
```
metrica                          | valor
---------------------------------|------
Total Pagamentos                 | 10
Pagamentos Últimas 24h           | 2
Total Comissões                  | 25
Comissões Últimas 24h            | 8
```

---

## 🚀 AGORA É COM VOCÊ!

**EXECUTE as 4 queries** e me mande os resultados!

Ou tire screenshots e mande!

**EU analiso e digo se está tudo funcionando!** 🤖

---

**Tempo estimado:** 3 minutos

**Arquivo com queries completas:** `queries-verificacao-automatica.sql`
