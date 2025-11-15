# 🚨 VALORES CRÍTICOS DE ENUMS - NÃO MODIFICAR SEM ATUALIZAR EDGE FUNCTIONS

## ⚠️ AVISO EXTREMAMENTE IMPORTANTE

Este documento contém os valores exatos dos ENUMs do banco de dados que são **hardcoded** nas Edge Functions. 

**NUNCA ALTERE ESTES VALORES NO BANCO SEM ATUALIZAR AS EDGE FUNCTIONS CORRESPONDENTES.**

Caso contrário, o sistema de comissões **VAI QUEBRAR SILENCIOSAMENTE**, causando:
- ❌ Comissões não criadas
- ❌ Erros de validação
- ❌ Perda de dados financeiros
- ❌ **PROBLEMAS JURÍDICOS COM PARCEIROS**

---

## 📋 ENUM: `tipo_comissao`

**Tabela afetada:** `comissoes`

**Valores válidos (EXATO como no banco):**
```sql
CREATE TYPE tipo_comissao AS ENUM (
  'ativacao',      -- Primeira mensalidade (100%)
  'recorrente',    -- Mensalidades recorrentes (15-20%)
  'override',      -- Comissão de sponsor (5%)
  'bonus'          -- Bônus diversos
);
```

### 🔍 Onde são usados nas Edge Functions:

#### `supabase/functions/calcular-comissoes/index.ts`
- **Linha 61:** `let tipoComissao: 'ativacao' | 'recorrente' | 'override' | 'bonus' = 'ativacao';`
- **Linha 67:** `tipoComissao = 'ativacao';` (primeira mensalidade)
- **Linha 72:** `tipoComissao = 'recorrente';` (mensalidades recorrentes)
- **Linha 77:** Validação antes de INSERT
- **Linha 157:** `tipo: 'override'` (comissão de sponsor)
- **Linha 218:** `tipo: marco.tipo` (bônus de progressão)
- **Linha 260:** `tipo: 'bonus_volume'` (bônus de volume)
- **Linha 299:** `tipo: 'bonus_contador'` (bônus de contador)

**⚠️ AÇÃO NECESSÁRIA SE ALTERAR:**
1. Atualizar a interface `tipo_comissao` na linha 61
2. Atualizar array `tiposValidos` na validação (linha 77)
3. Atualizar todos os INSERTs que usam valores hardcoded
4. Testar fluxo completo de cálculo de comissões

---

## 📋 ENUM: `status_comissao`

**Tabela afetada:** `comissoes`

**Valores válidos (EXATO como no banco):**
```sql
CREATE TYPE status_comissao AS ENUM (
  'calculada',     -- Comissão calculada, aguardando aprovação
  'aprovada',      -- Aprovada, aguardando pagamento
  'paga',          -- Paga ao contador
  'cancelada'      -- Cancelada/estornada
);
```

### 🔍 Onde são usados nas Edge Functions:

#### `supabase/functions/calcular-comissoes/index.ts`
- **Linha 81:** Validação `statusValidos` antes de INSERT
- **Linha 89:** `status: statusInserir` (sempre 'calculada')

#### `supabase/functions/aprovar-comissoes/index.ts`
- **Linha 40:** `eq('status', 'calculada')` (busca comissões calculadas)
- **Linha 71:** Validação `statusValidos` antes de UPDATE
- **Linha 73:** `const novoStatus = 'aprovada';`
- **Linha 79:** `status: novoStatus` (atualiza para 'aprovada')

#### `supabase/functions/processar-pagamento-comissoes/index.ts`
- **Linha 34:** `eq('status', 'aprovada')` (busca comissões aprovadas)
- **Linha 82:** Validação `statusValidos` antes de UPDATE
- **Linha 84:** `const novoStatus = 'paga';`
- **Linha 90:** `status: novoStatus` (atualiza para 'paga')

**⚠️ AÇÃO NECESSÁRIA SE ALTERAR:**
1. Atualizar array `statusValidos` em TODAS as 3 Edge Functions
2. Atualizar queries `.eq('status', '...')` em TODAS as Edge Functions
3. Atualizar triggers SQL que validam status (`validate_comissao_status()`)
4. Testar fluxo completo: calcular → aprovar → pagar

---

## 🛡️ PROTEÇÕES IMPLEMENTADAS

### Database Level (PostgreSQL)
1. **Triggers de validação:**
   - `trigger_validate_comissao_tipo` → valida `tipo` antes de INSERT/UPDATE
   - `trigger_validate_comissao_status` → valida `status` antes de INSERT/UPDATE

2. **Índices únicos:**
   - `idx_comissao_unica` → previne duplicação de comissões
   - `idx_bonus_unico` → previne duplicação de bônus

### Edge Function Level (TypeScript)
1. **Validações explícitas:**
   - Arrays `tiposValidos` e `statusValidos` em todas as Edge Functions
   - Throw de exceção se valor inválido detectado ANTES de INSERT/UPDATE

### Auditoria
- Todos os INSERTs/UPDATEs são logados em `comissoes_calculo_log` e `audit_logs`
- Triggers `track_comissao_changes` e `track_commission_status_changes` registram mudanças

---

## 📝 PROCEDIMENTO DE MUDANÇA SEGURA

Se você **REALMENTE PRECISA** alterar um ENUM:

### Passo 1: Planejamento
1. ✅ Ler este documento completo
2. ✅ Identificar TODAS as Edge Functions afetadas
3. ✅ Identificar TODOS os triggers SQL afetados
4. ✅ Criar backup do banco de dados

### Passo 2: Atualização Edge Functions
1. ✅ Atualizar interfaces TypeScript (ex: `let tipoComissao: 'novo_valor' | ...`)
2. ✅ Atualizar arrays de validação (`tiposValidos`, `statusValidos`)
3. ✅ Atualizar todos os valores hardcoded em INSERTs/UPDATEs
4. ✅ Fazer deploy das Edge Functions atualizadas

### Passo 3: Atualização Database
1. ✅ Atualizar function SQL `validate_comissao_tipo()` ou `validate_comissao_status()`
2. ✅ Executar migration para alterar ENUM:
   ```sql
   ALTER TYPE tipo_comissao ADD VALUE 'novo_valor';
   -- ⚠️ ATENÇÃO: ENUMs em PostgreSQL não podem ter valores removidos!
   ```

### Passo 4: Testes
1. ✅ Simular webhook de pagamento
2. ✅ Verificar criação de comissão com novo tipo/status
3. ✅ Verificar logs em `comissoes_calculo_log`
4. ✅ Testar fluxo completo: calcular → aprovar → pagar

### Passo 5: Documentação
1. ✅ Atualizar este arquivo (`ENUM_CRITICAL_VALUES.md`)
2. ✅ Atualizar `FLUXO_COMISSOES.md` se necessário
3. ✅ Notificar equipe das mudanças

---

## 🆘 EM CASO DE EMERGÊNCIA

Se você detectou uma comissão com tipo/status inválido:

### Diagnóstico:
```sql
-- Buscar comissões com tipo inválido
SELECT id, tipo, status, created_at 
FROM comissoes 
WHERE tipo NOT IN ('ativacao', 'recorrente', 'override', 'bonus');

-- Buscar comissões com status inválido
SELECT id, tipo, status, created_at 
FROM comissoes 
WHERE status NOT IN ('calculada', 'aprovada', 'paga', 'cancelada');
```

### Correção:
```sql
-- ⚠️ EXECUTAR APENAS SE VOCÊ SABE O QUE ESTÁ FAZENDO
-- Corrigir tipo inválido (exemplo)
UPDATE comissoes 
SET tipo = 'ativacao' 
WHERE id = 'UUID_DA_COMISSAO';

-- Corrigir status inválido (exemplo)
UPDATE comissoes 
SET status = 'calculada' 
WHERE id = 'UUID_DA_COMISSAO';
```

### Prevenção:
- ✅ Os triggers SQL agora impedem INSERTs/UPDATEs com valores inválidos
- ✅ As Edge Functions validam antes de qualquer operação
- ✅ Este documento serve como fonte única de verdade

---

## 📊 ESTATÍSTICAS DE USO

Para verificar distribuição de valores em produção:

```sql
-- Contagem por tipo_comissao
SELECT tipo, COUNT(*) as quantidade, SUM(valor) as valor_total
FROM comissoes
GROUP BY tipo
ORDER BY quantidade DESC;

-- Contagem por status_comissao
SELECT status, COUNT(*) as quantidade, SUM(valor) as valor_total
FROM comissoes
GROUP BY status
ORDER BY quantidade DESC;

-- Comissões criadas nos últimos 30 dias
SELECT DATE(created_at) as data, tipo, COUNT(*) as quantidade
FROM comissoes
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at), tipo
ORDER BY data DESC, tipo;
```

---

## 🔗 REFERÊNCIAS

- **Fluxo de comissões:** `FLUXO_COMISSOES.md`
- **Testes manuais:** `GUIA_TESTE_COMISSOES.md`
- **Edge Functions:**
  - `supabase/functions/calcular-comissoes/index.ts`
  - `supabase/functions/aprovar-comissoes/index.ts`
  - `supabase/functions/processar-pagamento-comissoes/index.ts`
- **Database Triggers:** Ver migrations em `supabase/migrations/`

---

**Última atualização:** 2025-01-XX
**Responsável:** Sistema de Proteção Automática
**Versão:** 1.0 - Plano Mínimo Enxuto
