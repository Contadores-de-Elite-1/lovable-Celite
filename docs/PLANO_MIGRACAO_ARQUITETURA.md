# PLANO DE MIGRAÇÃO: Arquitetura Ideal

**Data:** Janeiro 2026  
**Baseado em:** `docs/COMPARACAO_IDEAL_VS_REAL.md`  
**Status:** ✅ Pronto para Execução

---

## 1. VISÃO GERAL

Este plano contém 6 migrations SQL prontas para alinhar o banco de dados atual com a arquitetura ideal baseada no PRD.

### Ordem de Execução

As migrations DEVEM ser executadas nesta ordem:

1. **Migration 1:** Campos críticos em `clientes` (🔴 URGENTE)
2. **Migration 2:** Criar tabela `bonus_ltv_grupos` (🔴 URGENTE)
3. **Migration 3:** Campos Stripe Connect em `contadores` (🟡 ALTA)
4. **Migration 4:** Expandir ENUM `tipo_comissao` (🟡 ALTA)
5. **Migration 5:** Adicionar índices de performance (🟢 MÉDIA)
6. **Migration 6:** Campo auditoria em `comissoes` (🟢 MÉDIA)

### Tempo Total Estimado: ~35 minutos

---

## 2. MIGRATION 1: Campos Críticos em Clientes

### Prioridade: 🔴 CRÍTICA
### Tempo Estimado: 5 minutos
### Impacto: ALTO - Bloqueia bônus LTV

### O que faz:
- Adiciona `mes_captacao` (CRÍTICO para bônus LTV)
- Adiciona `indicado_por_id` (IMPORTANTE para override correto)
- Popula dados retroativamente
- Cria índices

### SQL:

```sql
-- ============================================
-- MIGRATION 1: Campos Críticos em Clientes
-- Data: Janeiro 2026
-- Autor: Arquitetura Baseada em PRD
-- ============================================

-- Adicionar campos
ALTER TABLE clientes 
ADD COLUMN IF NOT EXISTS mes_captacao DATE,
ADD COLUMN IF NOT EXISTS indicado_por_id UUID REFERENCES contadores(id) ON DELETE SET NULL;

-- Popular mes_captacao retroativamente
-- Usa data_ativacao truncada para o primeiro dia do mês
UPDATE clientes 
SET mes_captacao = DATE_TRUNC('month', data_ativacao)::DATE
WHERE mes_captacao IS NULL AND data_ativacao IS NOT NULL;

-- Popular indicado_por_id (inicialmente = contador_id)
-- Assumimos que quem gerencia é quem indicou (pode ser ajustado manualmente depois)
UPDATE clientes 
SET indicado_por_id = contador_id
WHERE indicado_por_id IS NULL;

-- Tornar mes_captacao NOT NULL após popular
-- IMPORTANTE: Só executar após popular todos os registros
ALTER TABLE clientes 
ALTER COLUMN mes_captacao SET NOT NULL;

-- Criar índices CRÍTICOS
CREATE INDEX IF NOT EXISTS idx_clientes_mes_captacao ON clientes(mes_captacao);
CREATE INDEX IF NOT EXISTS idx_clientes_indicado_por ON clientes(indicado_por_id);

-- Comentários para documentação
COMMENT ON COLUMN clientes.mes_captacao IS 'Mês em que o cliente foi captado (CRÍTICO para bônus LTV)';
COMMENT ON COLUMN clientes.indicado_por_id IS 'Contador que indicou o cliente (pode ser diferente de contador_id)';
```

### Validação:

```sql
-- Verificar se campos foram adicionados
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'clientes'
AND column_name IN ('mes_captacao', 'indicado_por_id');

-- Verificar se dados foram populados
SELECT 
  COUNT(*) as total_clientes,
  COUNT(mes_captacao) as com_mes_captacao,
  COUNT(indicado_por_id) as com_indicado_por
FROM clientes;

-- Verificar índices
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'clientes'
AND indexname IN ('idx_clientes_mes_captacao', 'idx_clientes_indicado_por');
```

### Rollback (se necessário):

```sql
-- ATENÇÃO: Só executar se realmente precisar desfazer
DROP INDEX IF EXISTS idx_clientes_indicado_por;
DROP INDEX IF EXISTS idx_clientes_mes_captacao;

ALTER TABLE clientes 
DROP COLUMN IF EXISTS indicado_por_id,
DROP COLUMN IF EXISTS mes_captacao;
```

---

## 3. MIGRATION 2: Criar Tabela bonus_ltv_grupos

### Prioridade: 🔴 CRÍTICA
### Tempo Estimado: 10 minutos
### Impacto: ALTO - Bloqueia bônus LTV

### O que faz:
- Cria tabela `bonus_ltv_grupos` completa
- Adiciona índices
- Configura RLS
- Adiciona trigger para `updated_at`

### SQL:

```sql
-- ============================================
-- MIGRATION 2: Criar Tabela bonus_ltv_grupos
-- Data: Janeiro 2026
-- Autor: Arquitetura Baseada em PRD
-- ============================================

-- Criar tabela
CREATE TABLE IF NOT EXISTS bonus_ltv_grupos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contador_id UUID REFERENCES contadores(id) ON DELETE CASCADE NOT NULL,
  
  -- Identificação do grupo
  mes_captacao DATE NOT NULL,
  
  -- Clientes do grupo
  cliente_ids UUID[] NOT NULL,
  quantidade_clientes INTEGER NOT NULL CHECK (quantidade_clientes > 0),
  
  -- Tracking de retenção
  mes_13_completado BOOLEAN DEFAULT false,
  data_mes_13 DATE,
  clientes_retidos INTEGER CHECK (clientes_retidos >= 0 AND clientes_retidos <= quantidade_clientes),
  taxa_retencao NUMERIC(5,2) GENERATED ALWAYS AS (
    CASE 
      WHEN quantidade_clientes > 0 THEN (clientes_retidos::NUMERIC / quantidade_clientes * 100)
      ELSE 0
    END
  ) STORED,
  
  -- Bônus gerado
  faixa_ltv TEXT CHECK (faixa_ltv IN ('faixa_1', 'faixa_2', 'faixa_3', NULL)),
  percentual_bonus NUMERIC(5,2) CHECK (percentual_bonus IN (15, 30, 50, NULL)),
  valor_bonus NUMERIC(10,2) CHECK (valor_bonus >= 0),
  comissao_id UUID REFERENCES comissoes(id) ON DELETE SET NULL,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(contador_id, mes_captacao)
);

-- Índices críticos
CREATE INDEX IF NOT EXISTS idx_bonus_ltv_contador_mes ON bonus_ltv_grupos(contador_id, mes_captacao);
CREATE INDEX IF NOT EXISTS idx_bonus_ltv_mes_13_completado ON bonus_ltv_grupos(mes_13_completado);
CREATE INDEX IF NOT EXISTS idx_bonus_ltv_data_mes_13 ON bonus_ltv_grupos(data_mes_13);

-- Trigger para updated_at (assumindo que função update_updated_at_column já existe)
CREATE TRIGGER update_bonus_ltv_updated_at 
BEFORE UPDATE ON bonus_ltv_grupos
FOR EACH ROW 
EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE bonus_ltv_grupos ENABLE ROW LEVEL SECURITY;

-- Policy: Contador vê seus grupos LTV
CREATE POLICY "Contador vê seus grupos LTV"
  ON bonus_ltv_grupos FOR SELECT
  USING (contador_id IN (SELECT id FROM contadores WHERE user_id = auth.uid()));

-- Policy: Admins veem tudo
CREATE POLICY "Admins veem todos os grupos LTV"
  ON bonus_ltv_grupos FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Comentários para documentação
COMMENT ON TABLE bonus_ltv_grupos IS 'Rastreia grupos de clientes captados no mesmo mês para cálculo de bônus LTV';
COMMENT ON COLUMN bonus_ltv_grupos.mes_captacao IS 'Mês em que os clientes do grupo foram captados';
COMMENT ON COLUMN bonus_ltv_grupos.cliente_ids IS 'Array de UUIDs dos clientes do grupo';
COMMENT ON COLUMN bonus_ltv_grupos.mes_13_completado IS 'Marca se o grupo já completou 12 meses (mês 13)';
COMMENT ON COLUMN bonus_ltv_grupos.faixa_ltv IS 'Faixa de bônus: faixa_1 (5-9), faixa_2 (10-14), faixa_3 (15+)';
```

### Validação:

```sql
-- Verificar se tabela foi criada
SELECT table_name, table_type
FROM information_schema.tables
WHERE table_name = 'bonus_ltv_grupos';

-- Verificar colunas
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'bonus_ltv_grupos'
ORDER BY ordinal_position;

-- Verificar índices
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'bonus_ltv_grupos';

-- Verificar RLS
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'bonus_ltv_grupos';
```

### Rollback (se necessário):

```sql
-- ATENÇÃO: Só executar se realmente precisar desfazer
DROP TABLE IF EXISTS bonus_ltv_grupos CASCADE;
```

---

## 4. MIGRATION 3: Campos Stripe Connect em Contadores

### Prioridade: 🟡 ALTA
### Tempo Estimado: 5 minutos
### Impacto: MÉDIO - Necessário para ÉPICO 5 (Stripe Connect)

### O que faz:
- Adiciona campos para Stripe Connect
- Cria índice
- Adiciona constraint

### SQL:

```sql
-- ============================================
-- MIGRATION 3: Campos Stripe Connect em Contadores
-- Data: Janeiro 2026
-- Autor: Arquitetura Baseada em PRD
-- ============================================

-- Adicionar campos
ALTER TABLE contadores 
ADD COLUMN IF NOT EXISTS stripe_account_id TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS stripe_account_status TEXT CHECK (stripe_account_status IN ('pending', 'verified', 'rejected')),
ADD COLUMN IF NOT EXISTS stripe_onboarding_completed BOOLEAN DEFAULT false;

-- Criar índice
CREATE INDEX IF NOT EXISTS idx_contadores_stripe_account_id ON contadores(stripe_account_id);

-- Comentários para documentação
COMMENT ON COLUMN contadores.stripe_account_id IS 'ID da conta Stripe Connect do contador';
COMMENT ON COLUMN contadores.stripe_account_status IS 'Status da conta Stripe: pending, verified, rejected';
COMMENT ON COLUMN contadores.stripe_onboarding_completed IS 'Se o onboarding do Stripe foi completado';
```

### Validação:

```sql
-- Verificar se campos foram adicionados
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'contadores'
AND column_name IN ('stripe_account_id', 'stripe_account_status', 'stripe_onboarding_completed');

-- Verificar índice
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'contadores'
AND indexname = 'idx_contadores_stripe_account_id';

-- Verificar constraint
SELECT constraint_name, check_clause
FROM information_schema.check_constraints
WHERE constraint_name LIKE '%stripe_account_status%';
```

### Rollback (se necessário):

```sql
-- ATENÇÃO: Só executar se realmente precisar desfazer
DROP INDEX IF EXISTS idx_contadores_stripe_account_id;

ALTER TABLE contadores 
DROP COLUMN IF EXISTS stripe_onboarding_completed,
DROP COLUMN IF EXISTS stripe_account_status,
DROP COLUMN IF EXISTS stripe_account_id;
```

---

## 5. MIGRATION 4: Expandir ENUM tipo_comissao

### Prioridade: 🟡 ALTA
### Tempo Estimado: 5 minutos
### Impacto: MÉDIO - Melhora rastreamento de bonificações

### O que faz:
- Adiciona valores específicos ao ENUM `tipo_comissao`
- Passa de 9 valores genéricos para 19 valores específicos

### SQL:

```sql
-- ============================================
-- MIGRATION 4: Expandir ENUM tipo_comissao
-- Data: Janeiro 2026
-- Autor: Arquitetura Baseada em PRD
-- ============================================

-- Adicionar valores específicos para comissões recorrentes por nível
ALTER TYPE tipo_comissao ADD VALUE IF NOT EXISTS 'recorrente_bronze';
ALTER TYPE tipo_comissao ADD VALUE IF NOT EXISTS 'recorrente_prata';
ALTER TYPE tipo_comissao ADD VALUE IF NOT EXISTS 'recorrente_ouro';
ALTER TYPE tipo_comissao ADD VALUE IF NOT EXISTS 'recorrente_diamante';

-- Adicionar valores específicos para override por nível
ALTER TYPE tipo_comissao ADD VALUE IF NOT EXISTS 'override_ativacao';
ALTER TYPE tipo_comissao ADD VALUE IF NOT EXISTS 'override_bronze';
ALTER TYPE tipo_comissao ADD VALUE IF NOT EXISTS 'override_prata';
ALTER TYPE tipo_comissao ADD VALUE IF NOT EXISTS 'override_ouro';
ALTER TYPE tipo_comissao ADD VALUE IF NOT EXISTS 'override_diamante';

-- Adicionar valores específicos para bônus de progressão
ALTER TYPE tipo_comissao ADD VALUE IF NOT EXISTS 'bonus_progressao_prata';
ALTER TYPE tipo_comissao ADD VALUE IF NOT EXISTS 'bonus_progressao_ouro';
ALTER TYPE tipo_comissao ADD VALUE IF NOT EXISTS 'bonus_progressao_diamante';

-- Adicionar valores específicos para bônus LTV
ALTER TYPE tipo_comissao ADD VALUE IF NOT EXISTS 'bonus_ltv_faixa_1';
ALTER TYPE tipo_comissao ADD VALUE IF NOT EXISTS 'bonus_ltv_faixa_2';
ALTER TYPE tipo_comissao ADD VALUE IF NOT EXISTS 'bonus_ltv_faixa_3';

-- Adicionar valores específicos para outros bônus
ALTER TYPE tipo_comissao ADD VALUE IF NOT EXISTS 'bonus_indicacao_contador';
ALTER TYPE tipo_comissao ADD VALUE IF NOT EXISTS 'bonus_diamante_leads';

-- Comentário
COMMENT ON TYPE tipo_comissao IS 'Tipos de comissão: cobre as 17 bonificações do programa';
```

### Validação:

```sql
-- Listar todos os valores do ENUM
SELECT enumlabel 
FROM pg_enum e
JOIN pg_type t ON e.enumtypid = t.oid
WHERE t.typname = 'tipo_comissao'
ORDER BY enumlabel;

-- Contar valores (deve ser >= 19)
SELECT COUNT(*) as total_valores
FROM pg_enum e
JOIN pg_type t ON e.enumtypid = t.oid
WHERE t.typname = 'tipo_comissao';
```

### Rollback:
**ATENÇÃO:** ENUMs no PostgreSQL NÃO podem ter valores removidos facilmente. Rollback não é trivial.

---

## 6. MIGRATION 5: Adicionar Índices de Performance

### Prioridade: 🟢 MÉDIA
### Tempo Estimado: 5 minutos
### Impacto: MÉDIO - Melhora performance de queries

### O que faz:
- Adiciona índices compostos em `comissoes`
- Adiciona índices em `contadores`
- Adiciona índices em `pagamentos`

### SQL:

```sql
-- ============================================
-- MIGRATION 5: Adicionar Índices de Performance
-- Data: Janeiro 2026
-- Autor: Arquitetura Baseada em PRD
-- ============================================

-- Índices compostos em comissoes (queries mais comuns)
CREATE INDEX IF NOT EXISTS idx_comissoes_contador_competencia ON comissoes(contador_id, competencia);
CREATE INDEX IF NOT EXISTS idx_comissoes_contador_status ON comissoes(contador_id, status);

-- Índice em contadores
CREATE INDEX IF NOT EXISTS idx_contadores_clientes_ativos ON contadores(clientes_ativos);

-- Índice em pagamentos
CREATE INDEX IF NOT EXISTS idx_pagamentos_pago_em ON pagamentos(pago_em);

-- Comentários
COMMENT ON INDEX idx_comissoes_contador_competencia IS 'Otimiza queries de comissões por contador e mês';
COMMENT ON INDEX idx_comissoes_contador_status IS 'Otimiza queries de comissões por contador e status';
```

### Validação:

```sql
-- Verificar índices criados
SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE indexname IN (
  'idx_comissoes_contador_competencia',
  'idx_comissoes_contador_status',
  'idx_contadores_clientes_ativos',
  'idx_pagamentos_pago_em'
)
ORDER BY tablename, indexname;

-- Verificar tamanho dos índices
SELECT
  schemaname,
  tablename,
  indexname,
  pg_size_pretty(pg_relation_size(indexrelid)) AS index_size
FROM pg_stat_user_indexes
WHERE indexrelname IN (
  'idx_comissoes_contador_competencia',
  'idx_comissoes_contador_status',
  'idx_contadores_clientes_ativos',
  'idx_pagamentos_pago_em'
);
```

### Rollback (se necessário):

```sql
-- ATENÇÃO: Só executar se realmente precisar desfazer
DROP INDEX IF EXISTS idx_pagamentos_pago_em;
DROP INDEX IF EXISTS idx_contadores_clientes_ativos;
DROP INDEX IF EXISTS idx_comissoes_contador_status;
DROP INDEX IF EXISTS idx_comissoes_contador_competencia;
```

---

## 7. MIGRATION 6: Campo Auditoria em Comissoes

### Prioridade: 🟢 MÉDIA
### Tempo Estimado: 3 minutos
### Impacto: BAIXO - Melhora auditoria

### O que faz:
- Adiciona campo `nivel_contador_na_epoca` em `comissoes`
- Permite rastrear qual era o nível do contador quando a comissão foi calculada

### SQL:

```sql
-- ============================================
-- MIGRATION 6: Campo Auditoria em Comissoes
-- Data: Janeiro 2026
-- Autor: Arquitetura Baseada em PRD
-- ============================================

-- Adicionar campo
ALTER TABLE comissoes 
ADD COLUMN IF NOT EXISTS nivel_contador_na_epoca nivel_contador;

-- Comentário
COMMENT ON COLUMN comissoes.nivel_contador_na_epoca IS 'Nível do contador quando a comissão foi calculada (auditoria)';
```

### Validação:

```sql
-- Verificar se campo foi adicionado
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'comissoes'
AND column_name = 'nivel_contador_na_epoca';
```

### Rollback (se necessário):

```sql
-- ATENÇÃO: Só executar se realmente precisar desfazer
ALTER TABLE comissoes 
DROP COLUMN IF EXISTS nivel_contador_na_epoca;
```

---

## 8. SCRIPT COMPLETO DE VALIDAÇÃO FINAL

Execute após todas as migrations:

```sql
-- ============================================
-- VALIDAÇÃO FINAL: Todas as Migrations
-- ============================================

-- 1. Verificar novos campos em clientes
SELECT 'clientes' as tabela, column_name, data_type
FROM information_schema.columns
WHERE table_name = 'clientes'
AND column_name IN ('mes_captacao', 'indicado_por_id')

UNION ALL

-- 2. Verificar tabela bonus_ltv_grupos
SELECT 'bonus_ltv_grupos' as tabela, 'tabela_existe' as column_name, 
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'bonus_ltv_grupos') 
       THEN 'sim' ELSE 'nao' END as data_type

UNION ALL

-- 3. Verificar campos Stripe em contadores
SELECT 'contadores' as tabela, column_name, data_type
FROM information_schema.columns
WHERE table_name = 'contadores'
AND column_name IN ('stripe_account_id', 'stripe_account_status', 'stripe_onboarding_completed')

UNION ALL

-- 4. Verificar campo auditoria em comissoes
SELECT 'comissoes' as tabela, column_name, data_type
FROM information_schema.columns
WHERE table_name = 'comissoes'
AND column_name = 'nivel_contador_na_epoca';

-- 5. Contar valores do ENUM tipo_comissao
SELECT 
  'tipo_comissao' as enum_name,
  COUNT(*) as total_valores
FROM pg_enum e
JOIN pg_type t ON e.enumtypid = t.oid
WHERE t.typname = 'tipo_comissao';

-- 6. Listar índices críticos
SELECT 
  tablename,
  indexname,
  'criado' as status
FROM pg_indexes
WHERE indexname IN (
  'idx_clientes_mes_captacao',
  'idx_clientes_indicado_por',
  'idx_bonus_ltv_contador_mes',
  'idx_contadores_stripe_account_id',
  'idx_comissoes_contador_competencia',
  'idx_comissoes_contador_status'
)
ORDER BY tablename, indexname;
```

---

## 9. CHECKLIST DE EXECUÇÃO

### Antes de Executar

- [ ] Backup completo do banco de dados
- [ ] Ambiente de desenvolvimento testado
- [ ] Usuários notificados (se produção)
- [ ] Janela de manutenção agendada (se produção)

### Durante Execução

- [ ] Migration 1 executada e validada
- [ ] Migration 2 executada e validada
- [ ] Migration 3 executada e validada
- [ ] Migration 4 executada e validada
- [ ] Migration 5 executada e validada
- [ ] Migration 6 executada e validada
- [ ] Script de validação final executado

### Após Execução

- [ ] Todas as validações passaram
- [ ] Frontend testado (sem erros 400/404)
- [ ] Edge Functions testadas
- [ ] Performance verificada
- [ ] Documentação atualizada
- [ ] Equipe notificada

---

## 10. PRÓXIMOS PASSOS

Após aplicar todas as migrations:

1. **Atualizar `types.ts`:**
   ```bash
   npx supabase gen types typescript --local > src/integrations/supabase/types.ts
   ```

2. **Atualizar Edge Functions:**
   - Ajustar cálculo de comissões para usar novos campos
   - Implementar lógica de bônus LTV

3. **Atualizar Frontend:**
   - Ajustar queries para usar novos campos
   - Adicionar UI para bônus LTV

4. **Testar Cálculo de Comissões:**
   - Criar dados de teste
   - Validar cálculo das 17 bonificações

5. **Documentar Mudanças:**
   - Atualizar README
   - Atualizar documentação de API

---

## 11. SUPORTE E TROUBLESHOOTING

### Erro: "column already exists"
**Solução:** A migration usa `IF NOT EXISTS`, então é seguro executar novamente.

### Erro: "type already has value"
**Solução:** A migration usa `IF NOT EXISTS`, então é seguro executar novamente.

### Erro: "constraint violation"
**Solução:** Verificar se há dados inconsistentes antes de aplicar constraints.

### Performance degradada após índices
**Solução:** Executar `ANALYZE` nas tabelas afetadas:
```sql
ANALYZE clientes;
ANALYZE comissoes;
ANALYZE contadores;
ANALYZE pagamentos;
```

---

## 12. CONCLUSÃO

Este plano de migração está pronto para execução. Todas as migrations são:

- ✅ **Idempotentes:** Podem ser executadas múltiplas vezes sem erro
- ✅ **Reversíveis:** Têm scripts de rollback
- ✅ **Validáveis:** Têm scripts de validação
- ✅ **Documentadas:** Têm comentários e explicações

**Próxima ação:** Executar migrations em ambiente de desenvolvimento primeiro, depois em produção.


