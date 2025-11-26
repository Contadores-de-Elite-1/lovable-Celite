# 🎯 PLANO COMPLETO: Correção de Todos os Erros

**Data:** 26 de Novembro de 2025  
**Status Atual:** Múltiplos erros 400/404 identificados  
**Meta:** Corrigir todos os erros em 3 fases estruturadas

---

## 📊 Diagnóstico Geral

### ✅ JÁ CORRIGIDO
- **Dashboard (404)**: Função `obter_dashboard_contador` corrigida ✅

### 🔴 ERROS ATIVOS

| Página | Erro | Causa | Prioridade |
|--------|------|-------|------------|
| Comissões | 400 Bad Request | Query com campos inexistentes | 🔴 ALTA |
| Saques | 404 Not Found | Tabela `solicitacoes_saque` não aplicada | 🔴 ALTA |
| Links | 404 Not Found | Mesma tabela `solicitacoes_saque` | 🔴 ALTA |
| Aprovações | 400/406 | Queries com `profiles(nome)` incorreto | 🔴 ALTA |
| Relatórios | 400 Bad Request | Queries com campos inexistentes | 🔴 ALTA |

### ⚠️ AVISOS (Podem Ignorar)
- DialogContent warnings (acessibilidade)
- LastPass errors (extensão do navegador)

---

## 🚀 FASE 1: Migrations SQL (Banco de Dados)

### 1.1 ✅ Aplicar Migration de Saques (JÁ EXISTE)

A tabela `solicitacoes_saque` já está definida na migration `20251115000000_add_solicitacoes_saque.sql`, mas **não foi aplicada no banco de produção**.

**Ação:** Aplicar a migration existente.

**Arquivo:** `supabase/migrations/20251115000000_add_solicitacoes_saque.sql`

**Como aplicar:**
1. Abra Supabase Dashboard
2. Vá em **SQL Editor**
3. Copie **TODO** o conteúdo da migration
4. Execute

**Validação:**
```sql
-- Verificar se tabela existe
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'solicitacoes_saque'
);
```

---

### 1.2 ✅ Função Dashboard (JÁ APLICADA)

**Status:** Aplicada com sucesso  
**Resultado:** `Success. No rows returned`

Nenhuma ação necessária.

---

## 🚀 FASE 2: Correções Frontend (Queries)

### 2.1 🔴 Comissões Page (400 Bad Request)

**Arquivo:** `src/pages/Comissoes.tsx`

**Problema:** Query está selecionando campos bancários de `profiles` que não existem:
```typescript
profiles?select=banco,agencia,conta,tipo_conta,titular_conta,chave_pix
```

**Solução:** Esses campos foram removidos em migrations anteriores. Remover essa query ou buscar de outro local.

**Mudança necessária:** Remover seleção de campos bancários inexistentes.

---

### 2.2 🔴 Saques Page (404 Not Found)

**Arquivo:** `src/pages/Saques.tsx` (linha 47)

**Problema:** Query para `solicitacoes_saque` retorna 404 porque a migration não foi aplicada.

**Código atual:**
```typescript
const { data } = await supabase
  .from('solicitacoes_saque')
  .select('*')
  .eq('contador_id', contador.id)
```

**Solução:** Aplicar a migration da Fase 1.1 primeiro.

**Nenhuma mudança de código necessária** - O código está correto.

---

### 2.3 🔴 Aprovações Admin (400/406 Bad Request)

**Arquivo:** `src/pages/AdminApprovalsPage.tsx` (linhas 93-96, 110-116)

**Problema:** Query está tentando fazer JOIN com `profiles(nome)` através de `contadores`, mas essa estrutura não existe.

**Código atual (INCORRETO):**
```typescript
.select(`
  *,
  contadores (user_id, profiles (nome))
`)
```

**Problema:** A tabela `profiles` não está diretamente acessível através de `contadores`.

**Solução:** Remover `profiles(nome)` e usar apenas `contadores(user_id)`.

**Código correto:**
```typescript
.select(`
  *,
  contadores!inner (user_id)
`)
```

**Mudanças:**
- Linha 93-96: Remover `profiles(nome)`
- Linha 110-116: Remover `profiles(nome)`

---

### 2.4 🔴 Relatórios Page (400 Bad Request)

**Arquivo:** `src/pages/Relatorios.tsx`

**Problema:** Múltiplas queries com erros 400, provavelmente tentando acessar campos que não existem.

**Ação:** Verificar queries que selecionam campos de `profiles` ou `contadores`.

**Solução:** Simplificar queries para usar apenas campos existentes.

---

## 🚀 FASE 3: Validação e Testes

### 3.1 Checklist de Validação

Após aplicar todas as correções:

| Página | Teste | Status |
|--------|-------|--------|
| Dashboard | Carregar sem erro 404 | ⏳ Pendente |
| Comissões | Carregar sem erro 400 | ⏳ Pendente |
| Saques | Carregar sem erro 404 | ⏳ Pendente |
| Links | Carregar sem erro 404 | ⏳ Pendente |
| Aprovações | Carregar sem erro 400/406 | ⏳ Pendente |
| Relatórios | Carregar sem erro 400 | ⏳ Pendente |

### 3.2 Como Testar

1. Aplicar migration de saques
2. Aplicar correções de frontend
3. Rebuild: `pnpm build`
4. Preview: `pnpm preview`
5. Testar cada página
6. Verificar console (F12)
7. Confirmar ausência de erros 400/404

---

## 📦 RESUMO DE ARQUIVOS A MODIFICAR

### SQL (Supabase)
1. ✅ `supabase/migrations/20251126000001_fix_obter_dashboard_contador.sql` - APLICADA
2. 🔴 `supabase/migrations/20251115000000_add_solicitacoes_saque.sql` - APLICAR

### TypeScript (Frontend)
1. 🔴 `src/pages/Comissoes.tsx` - Remover query de campos bancários
2. ✅ `src/pages/Saques.tsx` - Nenhuma mudança (aguarda migration)
3. 🔴 `src/pages/AdminApprovalsPage.tsx` - Remover `profiles(nome)` (2 locais)
4. 🔴 `src/pages/Relatorios.tsx` - Simplificar queries

---

## 🎯 PRÓXIMOS PASSOS (EM ORDEM)

### PASSO 1: Aplicar Migration de Saques

1. Abra Supabase Dashboard
2. SQL Editor > New Query
3. Copie o arquivo: `supabase/migrations/20251115000000_add_solicitacoes_saque.sql`
4. Execute
5. Aguarde "Success"

### PASSO 2: Corrigir Frontend

1. Corrigir `AdminApprovalsPage.tsx` (remover `profiles(nome)`)
2. Verificar `Comissoes.tsx` (remover campos bancários)
3. Verificar `Relatorios.tsx` (simplificar queries)

### PASSO 3: Rebuild e Testar

1. `pnpm build`
2. `pnpm preview`
3. Testar todas as páginas
4. Verificar console

---

## ✅ CRITÉRIOS DE SUCESSO

- [ ] Nenhum erro 404 no console
- [ ] Nenhum erro 400 no console
- [ ] Dashboard carrega dados
- [ ] Comissões lista registros (ou vazio)
- [ ] Saques página abre sem erro
- [ ] Links página abre sem erro
- [ ] Aprovações carrega para admin
- [ ] Relatórios carrega sem erros

---

**Preparado para executar?** Confirme e sigo com as correções passo a passo!

