# 🧪 Teste - Fluxo de Cálculo de Comissões

## 📋 Checklist de Teste

Este documento descreve como testar o novo fluxo de cálculo de comissões ponta-a-ponta.

### ✅ Pré-requisitos

- [ ] Clone o repositório
- [ ] Branch: `claude/fix-database-types-and-rpc-011CV3XrXYKkYhhLFsYXfAZ1`
- [ ] Supabase CLI instalado
- [ ] PostgreSQL CLI (`psql`) instalado
- [ ] macOS ou Linux (Windows: use WSL)

---

## 🚀 TESTE 1: Executar Tudo em Um Comando (Recomendado)

### Passo 1.1: Run All (Start, Reset, Seed, Test)

```bash
bash supabase/scripts/run-all.sh
```

**Esperado:**
- ✅ Supabase inicia
- ✅ API pronta em `http://localhost:54321`
- ✅ Migrations aplicadas com sucesso
- ✅ Seed executado idempotente (2 contadores, 2 clientes, 2 pagamentos)
- ✅ 5 testes executados com sucesso
- ✅ Output colorido (GREEN para sucesso)

**Duração:** ~30-45 segundos

**Se falhar:**
```bash
# Ver logs
cat /tmp/supabase_start.log
cat /tmp/supabase_reset.log
cat /tmp/supabase_migrate.log
cat /tmp/seed.log
```

---

## 🔄 TESTE 2: Idempotência (Seed Roda N Vezes Sem Erro)

### Passo 2.1: Executar Seed 3 Vezes

```bash
psql -h localhost -U postgres -d postgres -f supabase/scripts/seed.sql
psql -h localhost -U postgres -d postgres -f supabase/scripts/seed.sql
psql -h localhost -U postgres -d postgres -f supabase/scripts/seed.sql
```

**Esperado:**
- ✅ Primeira execução: cria dados
- ✅ Segunda/Terceira: `ON CONFLICT` ignora duplicatas
- ✅ **Zero erros** em todas as execuções

**Validação:**
```sql
SELECT COUNT(*) FROM contadores;
-- Esperado: 2 (não 4, não 6)

SELECT COUNT(*) FROM clientes;
-- Esperado: 2 (não 4, não 6)
```

---

## 📡 TESTE 3: Teste Manual da Edge Function

### Passo 3.1: Obter ANON_KEY

```bash
supabase status
# Copiar "anon key: eyJ..."
export ANON_KEY="eyJ..."
```

### Passo 3.2: Rodar Teste Script

```bash
APP_URL=http://localhost:54321 ANON_KEY=$ANON_KEY bash supabase/scripts/test-calcular-comissoes.sh
```

**Esperado:**
```
[TEST 1] Request válido - esperado 201
Response HTTP 201:
{
  "success": true,
  "message": "Comissões e bônus calculados com sucesso",
  ...
}
✓ TEST 1 PASSED

[TEST 2] Idempotência - mesmo request deve retornar 200
Response HTTP 200:
{
  "success": true,
  "message": "Comissões já calculadas para este pagamento",
  "idempotent": true,
  ...
}
✓ TEST 2 PASSED

[TEST 3] JSON malformado deve retornar 400
Response HTTP 400:
{
  "error": "Payload inválido: esperado JSON válido"
}
✓ TEST 3 PASSED

[TEST 4] Campo obrigatório faltando deve retornar 400
Response HTTP 400:
{
  "error": "Campos obrigatórios faltando",
  "missing_fields": [...]
}
✓ TEST 4 PASSED

[TEST 5] Data inválida deve retornar 400
Response HTTP 400:
{
  "error": "Validação falhou",
  "details": "competencia deve estar em formato YYYY-MM-DD"
}
✓ TEST 5 PASSED
```

**Se falhar:**
- Teste 1 (201): Verificar se a RPC `executar_calculo_comissoes` foi criada
  ```sql
  \df executar_calculo_comissoes
  ```
- Teste 2 (200): Verificar se os índices UNIQUE foram criados
  ```sql
  SELECT * FROM pg_indexes WHERE indexname LIKE 'idx_comissao%' OR indexname LIKE 'idx_bonus%';
  ```

---

## 🔍 TESTE 4: Validar Comissões no Banco

### Passo 4.1: Consultar Comissões Criadas

```bash
psql -h localhost -U postgres -d postgres << 'SQL'
SELECT
  id,
  pagamento_id,
  contador_id,
  tipo,
  valor,
  status,
  created_at
FROM comissoes
WHERE pagamento_id = '550e8400-e29b-41d4-a716-446655440021'
ORDER BY created_at DESC
LIMIT 5;
SQL
```

**Esperado:**
```
                   id                   |              pagamento_id              |              contador_id               |   tipo    |  valor  |   status   |         created_at
----------------------------------------+----------------------------------------+----------------------------------------+-----------+---------+------------+----------------------------
 xxx-xxx-xxx                            | 550e8400-e29b-41d4-a716-446655440021 | 550e8400-e29b-41d4-a716-446655440001 | ativacao  | 1000.00 | calculada  | 2025-11-12 06:45:00+00
 xxx-xxx-xxx                            | 550e8400-e29b-41d4-a716-446655440021 | 550e8400-e29b-41d4-a716-446655440002 | override  |  50.00  | calculada  | 2025-11-12 06:45:00+00
```

**Validação:**
- ✅ `tipo` é um enum válido (ativacao, recorrente, override, bonus_*)
- ✅ `status` é um enum válido (calculada, aprovada, paga, cancelada)
- ✅ `valor` é numeric(10,2)
- ✅ Sem erros de tipo (nada de "42804 - invalid text representation")

### Passo 4.2: Validar Logs de Cálculo

```bash
psql -h localhost -U postgres -d postgres << 'SQL'
SELECT
  cl.id,
  c.pagamento_id,
  cl.regra_aplicada,
  cl.valores_intermediarios,
  cl.resultado_final
FROM comissoes_calculo_log cl
JOIN comissoes c ON cl.comissao_id = c.id
WHERE c.pagamento_id = '550e8400-e29b-41d4-a716-446655440021'
ORDER BY cl.calculado_em DESC;
SQL
```

**Esperado:**
- ✅ Logs com `regra_aplicada` (ex: "ATIVACAO_100", "RECORRENTE_BRONZE")
- ✅ `valores_intermediarios` é um JSONB válido
- ✅ `resultado_final` é numeric

---

## 🎯 TESTE 5: Validar Tipos e Enums (Sem Erro 42804)

### Passo 5.1: Verificar Enums Criados

```bash
psql -h localhost -U postgres -d postgres << 'SQL'
-- Verificar tipo_comissao
SELECT enum_range(NULL::tipo_comissao) AS tipos_comissao;

-- Verificar status_comissao
SELECT enum_range(NULL::status_comissao) AS status_comissao;
SQL
```

**Esperado:**
```
                                                tipos_comissao
{ativacao,recorrente,override,bonus_progressao,bonus_volume,bonus_ltv,bonus_contador}

          status_comissao
{calculada,aprovada,paga,cancelada}
```

### Passo 5.2: Verificar Função RPC (SECURITY DEFINER)

```bash
psql -h localhost -U postgres -d postgres << 'SQL'
SELECT
  proname,
  prosecdef,
  pg_get_function_identity_arguments(oid) as args
FROM pg_proc
WHERE proname = 'executar_calculo_comissoes';
SQL
```

**Esperado:**
```
         proname          | prosecdef |                                              args
--------------------------+-----------+------------------------------------------------------------------
 executar_calculo_comissoes |     t     | p_pagamento_id uuid, p_cliente_id uuid, p_contador_id uuid, ...
```

- ✅ `prosecdef = t` (SECURITY DEFINER ativado)
- ✅ Argumentos com tipos corretos (uuid, date, jsonb)

---

## 🧹 TESTE 6: Limpar e Resetar

### Passo 6.1: Parar Supabase e Limpar

```bash
supabase stop
```

### Passo 6.2: (Opcional) Resetar Banco Localmente

```bash
supabase db reset
supabase start
```

---

## 📊 RESUMO DE CRITÉRIOS DE ACEITE

| Critério | Status | Teste |
|----------|--------|-------|
| seed.sql roda N vezes sem erro | ✅ | TESTE 2 |
| test-calcular-comissoes.sh retorna 200/201 com JSON válido | ✅ | TESTE 3 |
| Rodar duas vezes não duplica (200 idempotente) | ✅ | TESTE 3 + TESTE 4 |
| run-all.sh funciona no macOS | ✅ | TESTE 1 |
| Logs sem erro 42804 (tipos corretos) | ✅ | TESTE 5 |
| RPC com SECURITY DEFINER, search_path, GRANT/REVOKE | ✅ | TESTE 5.2 |
| Índices UNIQUE em comissoes e bonus_historico | ✅ | TESTE 3.2 |

---

## 🐛 Troubleshooting

### "Erro 42804: invalid text representation of uuid"
- **Causa**: Cast de UUID não feito corretamente na RPC
- **Solução**: Verificar migration 20251112000200 - casts explícitos `::uuid`
- **Comando**:
  ```sql
  SELECT version();
  SELECT typname FROM pg_type WHERE typname ~ 'uuid';
  ```

### "API timeout ao esperar"
- **Causa**: Supabase não iniciou ou está demorando
- **Solução**: Aumentar `WAIT_TIMEOUT`
  ```bash
  WAIT_TIMEOUT=120 bash supabase/scripts/run-all.sh
  ```

### "ON CONFLICT não funciona"
- **Causa**: Índice UNIQUE não foi criado
- **Solução**: Verificar se migration 20251112000100 foi aplicada
  ```sql
  \di idx_comissao_unica
  \di idx_bonus_historico_unico
  ```

### "Seed criou dados duplicados"
- **Causa**: Seed sem `ON CONFLICT`
- **Solução**: Usar migration 20251112000300 ou script supabase/scripts/seed.sql

---

## ✨ Conclusão

Se todos os testes passarem, você está pronto para fazer merge! 🎉

- ✅ Tipos corretos (UUID, DATE, ENUM, NUMERIC)
- ✅ RPC segura e transacional
- ✅ Idempotência garantida
- ✅ Validação de payload
- ✅ Códigos HTTP corretos (400, 200, 201, 500)
- ✅ Logs detalhados
- ✅ Scripts de teste completos
