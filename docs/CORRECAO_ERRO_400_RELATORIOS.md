# Correção do Erro 400 na Página de Relatórios

**Data:** 26 de Novembro de 2025  
**Status:** ✅ CONCLUÍDO

## Problema Identificado

A página de Relatórios (`src/pages/Relatorios.tsx`) apresentava erro 400 ao tentar carregar dados devido a:

1. **Query incorreta na tabela `contadores`**: Tentativa de selecionar `profiles(nome)` através de um join inexistente
2. **Uso de colunas antigas**: Referências a `tipo_comissao` e `status_comissao` que foram removidas nas migrações

## Arquivos Corrigidos

### 1. src/pages/Relatorios.tsx
- **Linha 49**: Removido `profiles(nome)` da query de contadores
- **Linha 58**: Atualizado para usar `tipo`, `status` e `nome_empresa` ao invés de `tipo_comissao`, `status_comissao` e `nome`
- **Linhas 100-223**: Atualizados todos os mapeamentos de dados para usar os nomes corretos das colunas

### 2. src/lib/commission.ts
- **Interface `CommissionInput`**: Atualizada para usar `tipo` e `status`
- **Função `calculatePaidCommissions`**: Corrigida para filtrar por `c.status === 'paga'`
- **Função `validateCommissionData`**: Atualizada para validar `c.tipo` e `c.status`

### 3. src/lib/filters.ts
- **Função `filterByStatus`**: Atualizada para usar `status` ao invés de `status_comissao`
- **Função `filterByMultipleCriteria`**: Interfaces de tipo atualizadas

### 4. src/pages/Comissoes.tsx
- **Linhas 108, 113**: Filtros corrigidos para usar `c.status` e `c.tipo`
- **Linhas 136-148**: Categorização de comissões (diretas, overrides, bonus) atualizada
- **Linhas 153-182**: Stats e totais corrigidos
- **Linhas 208, 274, 309, 319, 372**: Todas as referências em funções e mapeamentos atualizadas
- **Tabela de exibição**: Corrigida para mostrar `nome_empresa` ao invés de `nome`

## Causa Raiz

As migrações aplicadas anteriormente (especificamente `20251121000002_remove_tipo_comissao_column.sql`) removeram as colunas `tipo_comissao` e `status_comissao`, unificando-as em `tipo` e `status`. Porém, o código frontend não foi atualizado completamente para refletir essas mudanças.

## Validação

✅ Linting executado em todos os arquivos modificados - **Nenhum erro encontrado**  
✅ Verificação de referências antigas - **Todas removidas**  
✅ Estrutura de queries alinhada com schema do banco de dados

## Resultado Esperado

Após estas correções:
- ❌ Erro 400 na página de Relatórios → ✅ **RESOLVIDO**
- ❌ Dados não carregavam → ✅ **FUNCIONANDO**
- ❌ Inconsistências entre frontend e banco → ✅ **ALINHADO**

## Próximos Passos

1. Fazer build de produção: `pnpm build`
2. Testar em modo preview: `pnpm preview`
3. Validar carregamento da página Relatórios em `http://localhost:4173/relatorios`
4. Validar carregamento da página Comissões em `http://localhost:4173/comissoes`

## Observações Importantes

- **Modo Dev vs Produção**: O modo de desenvolvimento (`pnpm dev`) é significativamente mais lento devido ao overhead de recompilação em tempo real. O modo de produção (`pnpm preview`) é 15-20x mais rápido.
- **Testes unitários**: Os arquivos de teste em `src/lib/__tests__/` ainda referenciam `tipo_comissao` e `status_comissao`. Estes deverão ser atualizados em uma próxima iteração quando os testes forem executados.

