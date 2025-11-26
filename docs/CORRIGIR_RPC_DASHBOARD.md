# Correção: Função RPC obter_dashboard_contador

**Data:** 26 de Novembro de 2025  
**Status:** ✅ CORREÇÃO CRIADA

## Problema Identificado

A função RPC `obter_dashboard_contador` estava retornando erro **404 (Not Found)** porque tentava buscar uma coluna `nome` que não existe na tabela `contadores`.

## Erro

```
POST /rest/v1/rpc/obter_dashboard_contador
404 (Not Found)
```

**Causa:** A migration `20251119000001_create_rpc_dashboard.sql` tentava fazer:
```sql
SELECT id, nome, nivel, clientes_ativos
FROM contadores
WHERE user_id = user_id_param
```

Mas a tabela `contadores` **não tem coluna `nome`**.

## Solução

Criada nova migration `20251126000001_fix_obter_dashboard_contador.sql` que:

1. **Busca o nome corretamente:**
   - Primeiro tenta de `auth.users.raw_user_meta_data->>'nome'`
   - Se não encontrar, tenta de `profiles.nome`
   - Fallback para 'Usuário'

2. **Corrige outros problemas:**
   - Corrige cálculo de crescimento (estava incompleto)
   - Corrige uso de `DATE_TRUNC` para comparar meses

## Como Aplicar

### Opção 1: Via Supabase SQL Editor (Recomendado)

1. Abra o Supabase Dashboard
2. Vá em **SQL Editor**
3. Copie o conteúdo de `supabase/migrations/20251126000001_fix_obter_dashboard_contador.sql`
4. Cole e execute

### Opção 2: Via Supabase CLI

```bash
supabase db push
```

## Validação

Após aplicar, teste:

1. Faça login no app
2. Acesse o Dashboard
3. Não deve mais aparecer erro 404 no console
4. Os dados do dashboard devem carregar corretamente

## Arquivos Criados

- ✅ `supabase/migrations/20251126000001_fix_obter_dashboard_contador.sql`
- ✅ `docs/CORRIGIR_RPC_DASHBOARD.md` (este documento)

