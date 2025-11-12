# 🧪 Testing Guide - Seed Schema Fix

## 📋 O Que Mudou

### Problema Original
A migration `20251112000300_seed_idempotent_fixtures.sql` usava colunas que não existem no schema real:
- ❌ `contadores.nome` e `contadores.email` (não existem)
- ❌ `clientes.nome`, `clientes.email` (names incorretos)
- ❌ `pagamentos.valor` (é `valor_bruto` + `valor_liquido`)
- ❌ `pagamentos.status = 'pago'` (enum é `status_pagamento`)

### Solução Aplicada
1. **Desabilitada**: Migration inline (`.DISABLED`) para evitar erro ao fazer reset
2. **Ajustada**: `supabase/scripts/seed.sql` com colunas **reais** do schema

### Colunas Ajustadas

**contadores (antes → depois):**
```
❌ id, user_id, nome, email, nivel, status, clientes_ativos, xp
✅ id, user_id, nivel, status, clientes_ativos, xp
   (nome/email vêm do profiles, não de contadores)
```

**clientes (antes → depois):**
```
❌ id, contador_id, nome, cnpj, email, status, plano
✅ id, contador_id, nome_empresa, cnpj, contato_nome, contato_email,
   plano::tipo_plano, valor_mensal, status::status_cliente
```

**pagamentos (antes → depois):**
```
❌ id, cliente_id, valor, tipo, status, competencia
✅ id, cliente_id, valor_bruto, valor_liquido, tipo::tipo_pagamento,
   status::status_pagamento, competencia
```

---

## 🧪 Como Testar Localmente

### Pré-requisitos
- Supabase CLI instalado
- PostgreSQL CLI (`psql`)
- Node.js 16+

### Teste 1: Reset + Migration + Seed (Full Cycle)

```bash
# 1. Ir para raiz do projeto
cd /path/to/lovable-Celite

# 2. Resetar banco (AVISO: apaga dados!)
supabase db reset --yes

# 3. Aplicar todas as migrations (exceto .DISABLED)
supabase migration up

# 4. Rodar seed standalone (idempotent, roda N vezes sem erro)
psql -h localhost -U postgres -d postgres -f supabase/scripts/seed.sql

# 5. Verificar dados foram criados
psql -h localhost -U postgres -d postgres << 'SQL'
SELECT COUNT(*) FROM contadores;
SELECT COUNT(*) FROM clientes;
SELECT COUNT(*) FROM pagamentos;
SQL
```

**Esperado:**
```
count
-----
  2    (2 contadores)

count
-----
  2    (2 clientes)

count
-----
  2    (2 pagamentos)
```

---

### Teste 2: Seed Idempotência (Roda N Vezes)

```bash
# Executar 3 vezes
psql -h localhost -U postgres -d postgres -f supabase/scripts/seed.sql
psql -h localhost -U postgres -d postgres -f supabase/scripts/seed.sql
psql -h localhost -U postgres -d postgres -f supabase/scripts/seed.sql

# Verificar contagem (deve ainda ser 2, não 4 ou 6)
psql -h localhost -U postgres -d postgres << 'SQL'
SELECT COUNT(*) FROM contadores;
-- Esperado: 2
SQL
```

**Esperado:** Zero erros, contagem continua 2 (ON CONFLICT ignora duplicatas)

---

### Teste 3: Validar Enums e Tipos

```bash
psql -h localhost -U postgres -d postgres << 'SQL'
-- Verificar níveis dos contadores (bronze, prata)
SELECT id, nivel FROM contadores ORDER BY created_at;

-- Verificar planos dos clientes (profissional)
SELECT id, plano FROM clientes ORDER BY created_at;

-- Verificar status dos pagamentos (pago)
SELECT id, status FROM pagamentos ORDER BY created_at;

-- Verificar enum range
SELECT enum_range(NULL::nivel_contador) AS niveis;
SELECT enum_range(NULL::tipo_plano) AS planos;
SELECT enum_range(NULL::status_pagamento) AS status_pag;
SQL
```

**Esperado:**
```
        nivel
-------------------
 bronze
 prata

       plano
-------------------
 profissional
 profissional

   status
-------------------
 pago
 pago

        niveis
-------------------
 {bronze,prata,ouro,diamante}

        planos
-------------------
 {basico,profissional,premium,enterprise}

        status_pag
-------------------
 {pendente,pago,cancelado,estornado}
```

---

### Teste 4: Run Calcular-Comissões

```bash
# 1. Obter ANON_KEY
ANON_KEY=$(supabase status | grep "anon key:" | awk '{print $NF}')

# 2. Rodar teste script
APP_URL=http://localhost:54321 ANON_KEY=$ANON_KEY \
  bash supabase/scripts/test-calcular-comissoes.sh

# 3. Verificar comissões criadas
psql -h localhost -U postgres -d postgres << 'SQL'
SELECT
  id, pagamento_id, contador_id, tipo, valor, status, created_at
FROM comissoes
WHERE pagamento_id = '550e8400-e29b-41d4-a716-446655440021'
ORDER BY created_at DESC;
SQL
```

**Esperado:**
```
✅ TEST 1 PASSED (201 Created)
✅ TEST 2 PASSED (200 Idempotent)
✅ TEST 3 PASSED (400 JSON error)
✅ TEST 4 PASSED (400 Missing fields)
✅ TEST 5 PASSED (400 Invalid date)

Resultado da query:
- 2 comissões criadas com status='calculada'
```

---

### Teste 5: Full Automation (run-all.sh)

```bash
# Se preferir tudo em um comando:
bash supabase/scripts/run-all.sh

# Esperado: GREEN ✓ para todos os passos
```

---

## 📊 Checklist de Teste

- [ ] `supabase db reset --yes` sem erros
- [ ] `supabase migration up` sem erros
- [ ] `psql -f supabase/scripts/seed.sql` sem erros (1ª vez)
- [ ] `psql -f supabase/scripts/seed.sql` sem erros (2ª vez)
- [ ] Contadores: 2 registros
- [ ] Clientes: 2 registros
- [ ] Pagamentos: 2 registros
- [ ] Enums corretos (nivel_contador, tipo_plano, status_pagamento)
- [ ] test-calcular-comissoes.sh: todos os 5 testes passam
- [ ] Comissões criadas com status='calculada'

---

## 🆘 Troubleshooting

### Erro: "column \"nome\" does not exist"
**Causa:** Migration ainda está tentando usar coluna que não existe
**Solução:**
```bash
# Verificar se .DISABLED foi aplicado
ls -la supabase/migrations/ | grep 20251112000300
# Deve mostrar: 20251112000300_seed_idempotent_fixtures.sql.DISABLED

# Fazer reset novo
supabase db reset --yes
supabase migration up
```

### Erro: "invalid input syntax for type nivel_contador"
**Causa:** Valor de enum não está entre os válidos
**Solução:** Verificar seed.sql linha 45/58 - deve ser 'bronze' ou 'prata'

### Erro: "column \"valor_bruto\" does not exist"
**Causa:** Migração de tabelas ainda referencia nome antigo
**Solução:** Rodar `supabase migration up` após checkout do código fixo

### Seed não roda idempotente (erro em 2ª execução)
**Causa:** Falta `ON CONFLICT DO NOTHING`
**Verificação:**
```bash
grep -n "ON CONFLICT" supabase/scripts/seed.sql
# Deve aparecer 8 vezes (2 profiles + 2 contadores + 2 clientes + 2 pagamentos)
```

---

## 📝 Arquivos Alterados Neste Fix

```
Modified:  supabase/scripts/seed.sql (37 linhas ajustadas)
Renamed:   supabase/migrations/20251112000300_seed_idempotent_fixtures.sql
           → supabase/migrations/20251112000300_seed_idempotent_fixtures.sql.DISABLED
```

---

## ✅ Resumo

| Item | Status |
|------|--------|
| Migration desabilitada | ✅ |
| Seed aligned to schema | ✅ |
| UUIDs mantidos fixos | ✅ |
| Idempotência | ✅ ON CONFLICT |
| Enums com cast correto | ✅ |
| Documentação | ✅ |

Pronto para testar! 🎉
