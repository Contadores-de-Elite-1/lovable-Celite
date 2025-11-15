## 🎯 Objetivo

Implementar fluxo ponta-a-ponta de cálculo de comissões com:
- RPC transacional (`executar_calculo_comissoes`) com SECURITY DEFINER, search_path, e casts de tipos corretos
- Índices UNIQUE para garantir idempotência
- Seed idempotente com UUIDs fixos
- Edge function com validação 400/500 e tratamento de erro limpo
- Scripts de teste automatizado e orquestração (macOS compatible)

Resolve:
- ❌ Erro 42804 (tipos JSONB sem cast para enum/uuid/date)
- ❌ RPC inexistente (`executar_calculo_comissoes`)
- ❌ Idempotência fraca (sem índices UNIQUE)
- ❌ Falta de validação na edge function
- ❌ Sem scripts de teste

---

## 📝 Mudanças

### 1️⃣ Commit: `feat(db): idempotence constraints`
**Arquivo**: `supabase/migrations/20251112000100_add_unique_indexes_idempotency.sql`

- ✅ Índice UNIQUE em `comissoes(pagamento_id, contador_id, tipo)`
- ✅ Índice UNIQUE em `bonus_historico(contador_id, tipo_bonus, competencia, marco_atingido)`
- ✅ Índices de suporte para performance

**Impacto**: Evita duplicação de comissões/bônus ao re-executar a RPC

---

### 2️⃣ Commit: `feat(db): transactional RPC executar_calculo_comissoes`
**Arquivo**: `supabase/migrations/20251112000200_create_rpc_executar_calculo_comissoes.sql` (179 linhas)

**Segurança:**
- ✅ `SECURITY DEFINER` + `SET search_path = 'public', 'extensions'`
- ✅ `REVOKE ALL FROM public` + `GRANT EXECUTE TO authenticated, service_role`

**Tipos & Casts:**
- ✅ `uuid::uuid` para pagamento_id, cliente_id, contador_id, origem_cliente_id
- ✅ `date::date` para competencia
- ✅ `tipo_comissao`, `status_comissao` (enums com cast)
- ✅ `numeric(10,2)`, `numeric(5,2)` para valores e percentuais

**Idempotência:**
- ✅ `ON CONFLICT (pagamento_id, contador_id, tipo) DO NOTHING`
- ✅ `ON CONFLICT (contador_id, tipo_bonus, competencia, marco_atingido) DO NOTHING`

**Auditoria & Erro:**
- ✅ Logs em `comissoes_calculo_log` com valores intermediários
- ✅ `EXCEPTION WHEN OTHERS` com mensagem limpa (sem expor detalhes internos)

---

### 3️⃣ Commit: `feat(seed): idempotent seed for local tests`
**Arquivos**:
- `supabase/migrations/20251112000300_seed_idempotent_fixtures.sql`
- `supabase/scripts/seed.sql`

**Dados de Teste** (UUIDs fixos para consistência):
- Contadores: `550e8400-e29b-41d4-a716-446655440001`, `446655440002`
- Clientes: `550e8400-e29b-41d4-a716-446655440011`, `446655440012`
- Pagamentos: `550e8400-e29b-41d4-a716-446655440021`, `446655440022`

**Idempotência:**
- ✅ Ambos rodam N vezes sem erro (ON CONFLICT DO NOTHING)
- ✅ Mantêm os mesmos UUIDs entre execuções
- ✅ Scripts prontos para dev local e CI/CD

---

### 4️⃣ Commit: `chore(fn+scripts): calcular-comissoes error handling + tests`
**Arquivos**:
- `supabase/functions/calcular-comissoes/index.ts` (refatorado)
- `supabase/scripts/test-calcular-comissoes.sh` (novo)
- `supabase/scripts/run-all.sh` (novo, macOS compatible)

**Edge Function - Validações (400 Bad Request):**
```javascript
• JSON malformado → 400 "Payload inválido"
• Campos obrigatórios faltando → 400 "Campos obrigatórios faltando"
• valor_liquido <= 0 → 400 "Validação falhou"
• competencia não YYYY-MM-DD → 400 "Validação falhou"
```

**Edge Function - Erros (500 Server Error):**
```javascript
• Falta de env vars → 500
• Erro BD/RPC → 500 "Falha ao salvar comissões"
• Erro inesperado → 500 "Erro interno do servidor"
```

**Edge Function - Sucesso:**
```javascript
• Comissões já existem → 200 OK (idempotente)
• Novas criadas → 201 Created
• Resposta com summary: comissoes_criadas, bonus_criados, logs_criados
```

**Logging:**
- ✅ `console.warn()` para validações
- ✅ `console.info()` para flow (payload, resultado RPC)
- ✅ `console.error()` para BD/RPC errors

**test-calcular-comissoes.sh:**
- ✅ 5 testes automatizados (valido, idempotência, JSON malformado, campos faltando, data inválida)
- ✅ Output colorido (GREEN/RED/YELLOW)
- ✅ Usa `APP_URL` e `ANON_KEY` por variáveis de ambiente
- ✅ Instruções de debugging incluídas

**run-all.sh (NEW):**
- ✅ Orquestra: Start → Wait (curl --connect-timeout, macOS) → Reset → Migrate → Seed → Test
- ✅ Sem `timeout` GNU (compatível com macOS)
- ✅ Output colorido com status em cada etapa
- ✅ Logs salvos em `/tmp/` para debugging

---

## ✅ Critérios de Aceite

- ✅ `seed.sql` roda N vezes sem erro
- ✅ `test-calcular-comissoes.sh` retorna 200/201 com JSON válido
- ✅ Rodar duas vezes não duplica (200 idempotente via índices UNIQUE)
- ✅ `run-all.sh` funciona no macOS com: `bash supabase/scripts/run-all.sh`
- ✅ Logs da função sem erro 42804 (tipos corretos com casts explícitos)
- ✅ RPC com SECURITY DEFINER, search_path, GRANT/REVOKE
- ✅ Validação de payload com códigos HTTP padronizados (400/500)

---

## 🧪 Como Testar

### Rápido (Recomendado - ~30s):
```bash
bash supabase/scripts/run-all.sh
```

### Manual (Detalhado):
Veja [TESTING.md](./TESTING.md) para guia completo com 6 testes.

---

## 📦 Arquivos Modificados

```
✅ supabase/migrations/20251112000100_add_unique_indexes_idempotency.sql (novo)
✅ supabase/migrations/20251112000200_create_rpc_executar_calculo_comissoes.sql (novo)
✅ supabase/migrations/20251112000300_seed_idempotent_fixtures.sql (novo)
✅ supabase/scripts/seed.sql (novo)
✅ supabase/scripts/test-calcular-comissoes.sh (novo, executável)
✅ supabase/scripts/run-all.sh (novo, executável, macOS)
✅ supabase/functions/calcular-comissoes/index.ts (refatorado: validações)
✅ TESTING.md (novo, guia de teste)
```

---

## 🔗 Links Úteis

- Documentação: [FLUXO_COMISSOES.md](./FLUXO_COMISSOES.md)
- Testes: [TESTING.md](./TESTING.md)
- ENUMs: [ENUM_CRITICAL_VALUES.md](./ENUM_CRITICAL_VALUES.md)

---

## 📋 Checklist para Reviewers

- [ ] Ler [TESTING.md](./TESTING.md)
- [ ] Rodar `bash supabase/scripts/run-all.sh` (deve passar em ~30s)
- [ ] Verificar seed idempotência: `psql -f supabase/scripts/seed.sql` (3 vezes)
- [ ] Validar tipos na RPC: `\df executar_calculo_comissoes` (SECURITY DEFINER = on)
- [ ] Testar validação: POST com JSON malformado → deve retornar 400
- [ ] Verificar idempotência: POST 2x com mesmo payload → deve retornar 200 na 2ª

---

## 🚀 Merge & Deploy

Após aprovação:
1. Merge na `main`
2. Migrations serão aplicadas automaticamente
3. RPC estará pronta para uso
4. Edge function com validação ativa
