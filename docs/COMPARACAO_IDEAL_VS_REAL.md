# COMPARAÇÃO: ARQUITETURA IDEAL vs BANCO ATUAL

**Data:** Janeiro 2026  
**Baseado em:**
- `docs/ARQUITETURA_BANCO_IDEAL.md` (o que DEVERIA ser)
- `src/integrations/supabase/types.ts` (o que É)
- `supabase/migrations/*.sql` (como foi construído)

---

## 1. RESUMO EXECUTIVO

### Status Geral: 🟡 **BOM, MAS PRECISA AJUSTES**

A estrutura atual do banco está **75% alinhada** com a arquitetura ideal. As tabelas principais existem e estão bem estruturadas, mas faltam alguns campos críticos e uma tabela essencial para bônus LTV.

### Prioridades de Correção

| Prioridade | Item | Impacto | Esforço |
|------------|------|---------|---------|
| 🔴 **CRÍTICA** | Adicionar `clientes.mes_captacao` | Bloqueia bônus LTV | Baixo |
| 🔴 **CRÍTICA** | Criar tabela `bonus_ltv_grupos` | Bloqueia bônus LTV | Médio |
| 🟡 **ALTA** | Adicionar `clientes.indicado_por_id` | Override incorreto | Baixo |
| 🟡 **ALTA** | Adicionar campos Stripe Connect em `contadores` | Bloqueia pagamentos diretos | Baixo |
| 🟡 **ALTA** | Expandir ENUM `tipo_comissao` | Dificulta rastreamento | Baixo |
| 🟢 **MÉDIA** | Atualizar `contador_performance_anual` | Porto seguro incompleto | Médio |
| 🟢 **BAIXA** | Adicionar índices faltantes | Performance | Baixo |

---

## 2. ANÁLISE POR DOMÍNIO

### DOMÍNIO 1: Autenticação e Usuários

#### ✅ auth.users (Supabase)
**Status:** OK - Gerenciado pelo Supabase

#### ✅ profiles
**Status:** OK - Estrutura correta

**Campos existentes:**
```typescript
{
  id: UUID
  nome: TEXT
  email: TEXT
  telefone: TEXT
  cpf: TEXT
  data_nascimento: DATE
  foto_url: TEXT
  aceite_termos: BOOLEAN
  aceite_notificacoes: BOOLEAN
  fcm_token: TEXT
  created_at: TIMESTAMPTZ
  updated_at: TIMESTAMPTZ
}
```

**Diferenças:** ✅ Nenhuma - Está perfeito!

---

#### ✅ user_roles
**Status:** OK - Estrutura correta

**Diferenças:** ✅ Nenhuma

---

### DOMÍNIO 2: Contadores e Rede MLM

#### 🟡 contadores
**Status:** BOM, mas falta Stripe Connect

**Campos existentes:**
```typescript
{
  id: UUID
  user_id: UUID
  sponsor_id: UUID  // ✅ OK
  nivel: nivel_contador
  status: status_contador
  clientes_ativos: INTEGER
  xp: INTEGER
  crc: TEXT
  chave_pix: TEXT
  link_rastreavel: TEXT
  primeiro_acesso: BOOLEAN
  data_ingresso: DATE
  ultima_ativacao: DATE
  created_at: TIMESTAMPTZ
  updated_at: TIMESTAMPTZ
}
```

**❌ Campos FALTANDO:**
```sql
-- Para Stripe Connect (pagamentos diretos)
stripe_account_id TEXT UNIQUE
stripe_account_status TEXT CHECK (stripe_account_status IN ('pending', 'verified', 'rejected'))
stripe_onboarding_completed BOOLEAN DEFAULT false
```

**Impacto:** Médio - Necessário para ÉPICO 5 (Stripe Connect), mas não bloqueia comissões.

**Migration necessária:**
```sql
ALTER TABLE contadores 
ADD COLUMN stripe_account_id TEXT UNIQUE,
ADD COLUMN stripe_account_status TEXT CHECK (stripe_account_status IN ('pending', 'verified', 'rejected')),
ADD COLUMN stripe_onboarding_completed BOOLEAN DEFAULT false;

CREATE INDEX idx_contadores_stripe_account_id ON contadores(stripe_account_id);
```

---

#### ✅ rede_contadores
**Status:** OK - Estrutura correta

**Observação:** Tabela existe e mapeia sponsor/child corretamente. Pode parecer redundante dado que `contadores.sponsor_id` já existe, mas é útil para queries recursivas.

---

#### 🟡 contador_performance_anual
**Status:** EXISTE, mas pode estar incompleta

**Campos existentes (do types.ts):**
```typescript
{
  id: UUID
  contador_id: UUID
  ano: INTEGER
  // ... outros campos ...
}
```

**⚠️ Precisa verificar se tem todos os campos:**
- `indicacoes_diretas`
- `retencao_percentual`
- `participacao_eventos_percentual`
- `tier_status`
- `comissao_percentual_aplicado`
- `porto_seguro_ativo`
- `porto_seguro_tipo`
- `porto_seguro_usado_em`
- `reativacao_plano`
- `reativacao_inicio`
- `reativacao_meta_clientes`
- `reativacao_progresso`

**Ação:** Ler migration que criou esta tabela para confirmar estrutura.

---

### DOMÍNIO 3: Clientes e Pagamentos

#### 🔴 clientes
**Status:** CRÍTICO - Faltam campos essenciais

**Campos existentes:**
```typescript
{
  id: UUID
  contador_id: UUID  // ✅ OK - quem gerencia
  nome_empresa: TEXT
  cnpj: TEXT
  contato_nome: TEXT
  contato_email: TEXT
  contato_telefone: TEXT
  plano: tipo_plano
  valor_mensal: NUMERIC
  status: status_cliente
  data_ativacao: DATE
  data_cancelamento: DATE
  stripe_customer_id: TEXT
  stripe_subscription_id: TEXT
  created_at: TIMESTAMPTZ
  updated_at: TIMESTAMPTZ
}
```

**🔴 Campos FALTANDO (CRÍTICOS):**
```sql
-- CRÍTICO para bônus LTV
mes_captacao DATE NOT NULL

-- IMPORTANTE para override correto
indicado_por_id UUID REFERENCES contadores(id)
```

**Impacto:** 
- **`mes_captacao`**: CRÍTICO - Sem ele, não conseguimos calcular bônus LTV (bonificações #16-18)
- **`indicado_por_id`**: ALTO - Sem ele, override de rede pode estar incorreto (bonificação #6)

**Migration necessária:**
```sql
-- Adicionar campos
ALTER TABLE clientes 
ADD COLUMN mes_captacao DATE,
ADD COLUMN indicado_por_id UUID REFERENCES contadores(id);

-- Popular mes_captacao retroativamente
UPDATE clientes 
SET mes_captacao = DATE_TRUNC('month', data_ativacao)::DATE
WHERE mes_captacao IS NULL AND data_ativacao IS NOT NULL;

-- Popular indicado_por_id (inicialmente = contador_id)
UPDATE clientes 
SET indicado_por_id = contador_id
WHERE indicado_por_id IS NULL;

-- Tornar mes_captacao NOT NULL após popular
ALTER TABLE clientes 
ALTER COLUMN mes_captacao SET NOT NULL;

-- Criar índice CRÍTICO
CREATE INDEX idx_clientes_mes_captacao ON clientes(mes_captacao);
CREATE INDEX idx_clientes_indicado_por ON clientes(indicado_por_id);
```

---

#### ✅ pagamentos
**Status:** OK - Estrutura correta

**Campos existem tes:**
```typescript
{
  id: UUID
  cliente_id: UUID
  tipo: tipo_pagamento  // ativacao, recorrente
  valor_bruto: NUMERIC
  valor_liquido: NUMERIC
  competencia: DATE
  status: status_pagamento
  pago_em: TIMESTAMPTZ
  stripe_payment_id: TEXT
  stripe_invoice_id: TEXT
  webhook_log_id: UUID
  processado: BOOLEAN
  created_at: TIMESTAMPTZ
}
```

**Diferenças:** ✅ Nenhuma - Está correto!

---

### DOMÍNIO 4: Comissões e Bonificações

#### 🟡 comissoes
**Status:** BOM, mas ENUM precisa expansão

**Campos existentes:**
```typescript
{
  id: UUID
  contador_id: UUID
  cliente_id: UUID
  pagamento_id: UUID
  tipo: tipo_comissao  // ⚠️ ENUM precisa expansão
  valor: NUMERIC
  percentual: NUMERIC
  competencia: DATE
  status: status_comissao
  aprovada_por: UUID
  aprovada_em: TIMESTAMPTZ
  pago_em: TIMESTAMPTZ
  created_at: TIMESTAMPTZ
  updated_at: TIMESTAMPTZ
}
```

**⚠️ ENUM `tipo_comissao` ATUAL:**
```sql
CREATE TYPE tipo_comissao AS ENUM (
  'ativacao',
  'recorrente',
  'override',
  'bonus_progressao',
  'bonus_ltv',
  'bonus_rede',
  'bonus_volume',
  'bonus_contador',
  'lead_diamante'
);
```

**✅ ENUM `tipo_comissao` IDEAL (19 valores):**
```sql
CREATE TYPE tipo_comissao AS ENUM (
  -- Comissões Diretas (5)
  'ativacao',
  'recorrente_bronze',
  'recorrente_prata',
  'recorrente_ouro',
  'recorrente_diamante',
  
  -- Override Rede (6)
  'override_ativacao',
  'override_bronze',
  'override_prata',
  'override_ouro',
  'override_diamante',
  
  -- Bônus de Progressão (4)
  'bonus_progressao_prata',
  'bonus_progressao_ouro',
  'bonus_progressao_diamante',
  'bonus_volume',
  
  -- Bônus LTV (3)
  'bonus_ltv_faixa_1',
  'bonus_ltv_faixa_2',
  'bonus_ltv_faixa_3',
  
  -- Outros Bônus (2)
  'bonus_indicacao_contador',
  'bonus_diamante_leads'
);
```

**Impacto:** MÉDIO - Dificulta rastreamento específico de cada bonificação, mas não bloqueia funcionalidade.

**Migration necessária:**
```sql
-- Adicionar valores específicos ao ENUM
ALTER TYPE tipo_comissao ADD VALUE IF NOT EXISTS 'recorrente_bronze';
ALTER TYPE tipo_comissao ADD VALUE IF NOT EXISTS 'recorrente_prata';
ALTER TYPE tipo_comissao ADD VALUE IF NOT EXISTS 'recorrente_ouro';
ALTER TYPE tipo_comissao ADD VALUE IF NOT EXISTS 'recorrente_diamante';

ALTER TYPE tipo_comissao ADD VALUE IF NOT EXISTS 'override_ativacao';
ALTER TYPE tipo_comissao ADD VALUE IF NOT EXISTS 'override_bronze';
ALTER TYPE tipo_comissao ADD VALUE IF NOT EXISTS 'override_prata';
ALTER TYPE tipo_comissao ADD VALUE IF NOT EXISTS 'override_ouro';
ALTER TYPE tipo_comissao ADD VALUE IF NOT EXISTS 'override_diamante';

ALTER TYPE tipo_comissao ADD VALUE IF NOT EXISTS 'bonus_progressao_prata';
ALTER TYPE tipo_comissao ADD VALUE IF NOT EXISTS 'bonus_progressao_ouro';
ALTER TYPE tipo_comissao ADD VALUE IF NOT EXISTS 'bonus_progressao_diamante';

ALTER TYPE tipo_comissao ADD VALUE IF NOT EXISTS 'bonus_ltv_faixa_1';
ALTER TYPE tipo_comissao ADD VALUE IF NOT EXISTS 'bonus_ltv_faixa_2';
ALTER TYPE tipo_comissao ADD VALUE IF NOT EXISTS 'bonus_ltv_faixa_3';

ALTER TYPE tipo_comissao ADD VALUE IF NOT EXISTS 'bonus_indicacao_contador';
ALTER TYPE tipo_comissao ADD VALUE IF NOT EXISTS 'bonus_diamante_leads';
```

**🔴 Campo FALTANDO (IMPORTANTE):**
```sql
-- Para auditoria de nível do contador na época do cálculo
nivel_contador_na_epoca nivel_contador
```

**Migration:**
```sql
ALTER TABLE comissoes 
ADD COLUMN nivel_contador_na_epoca nivel_contador;
```

---

#### ✅ comissoes_calculo_log
**Status:** OK - Estrutura correta (se existe)

**Verificar:** Esta tabela foi criada? Se não, é IMPORTANTE para auditoria.

---

#### ✅ bonus_historico
**Status:** OK - Estrutura correta

**Verificado:** Existe e tem estrutura adequada.

---

#### 🔴 bonus_ltv_grupos
**Status:** NÃO EXISTE - TABELA CRÍTICA FALTANDO

**⚠️ TABELA COMPLETAMENTE AUSENTE**

Esta é a tabela MAIS CRÍTICA que está faltando. Sem ela, é **IMPOSSÍVEL** calcular bônus LTV (bonificações #16-18).

**Estrutura necessária:**
```sql
CREATE TABLE bonus_ltv_grupos (
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
CREATE INDEX idx_bonus_ltv_contador_mes ON bonus_ltv_grupos(contador_id, mes_captacao);
CREATE INDEX idx_bonus_ltv_mes_13_completado ON bonus_ltv_grupos(mes_13_completado);
CREATE INDEX idx_bonus_ltv_data_mes_13 ON bonus_ltv_grupos(data_mes_13);

-- Trigger para updated_at
CREATE TRIGGER update_bonus_ltv_updated_at BEFORE UPDATE ON bonus_ltv_grupos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE bonus_ltv_grupos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Contador vê seus grupos LTV"
  ON bonus_ltv_grupos FOR SELECT
  USING (contador_id IN (SELECT id FROM contadores WHERE user_id = auth.uid()));
```

**Impacto:** CRÍTICO - Bloqueia totalmente bônus LTV.

---

### DOMÍNIO 5: Saques e Transferências

#### ✅ solicitacoes_saque
**Status:** OK - Criada recentemente (migration `20251115000000_add_solicitacoes_saque.sql`)

**Verificado:** Estrutura adequada.

---

### DOMÍNIO 6: Sistema de Indicações e Links

#### ✅ links
**Status:** OK - Estrutura correta

#### ✅ referral_tracking / click_logs
**Status:** OK - Sistema de tracking existe

---

### DOMÍNIO 7: Auditoria e Logs

#### ✅ audit_logs
**Status:** OK - Estrutura correta

#### ✅ webhook_logs
**Status:** OK - Estrutura correta

---

### DOMÍNIO 8: Aprovações

#### ✅ approval_comments
**Status:** OK - Criada recentemente (migration `20251114000000_add_approval_infrastructure.sql`)

---

## 3. TABELAS EXTRAS (Não previstas na arquitetura ideal)

### 🟢 Tabelas Adicionais que Existem

1. **assistente_logs** - Para logs de assistente virtual (OK)
2. **click_logs** - Para rastreamento de cliques em links (OK)
3. **courses / enrollments** - Para EAD (OK, feature adicional)
4. **eventos / evento_participantes** - Para gamificação (OK)
5. **conquistas / contador_conquistas** - Para gamificação (OK)
6. **lgpd_requests** - Para conformidade LGPD (OK)
7. **notificacoes** - Para sistema de notificações (OK)
8. **simulacoes** - Para simulador de ganhos (OK)
9. **invites** - Para sistema de convites (OK)
10. **indicacoes** - Para rastreamento de indicações (OK)

**Conclusão:** Estas tabelas são features adicionais válidas e não conflitam com a arquitetura ideal.

---

## 4. ÍNDICES FALTANTES

### Índices Críticos que PODEM estar faltando

Verificar se existem:

```sql
-- Em comissoes (CRÍTICOS para performance)
CREATE INDEX IF NOT EXISTS idx_comissoes_contador_competencia ON comissoes(contador_id, competencia);
CREATE INDEX IF NOT EXISTS idx_comissoes_contador_status ON comissoes(contador_id, status);

-- Em clientes (CRÍTICO para LTV)
CREATE INDEX IF NOT EXISTS idx_clientes_mes_captacao ON clientes(mes_captacao);
CREATE INDEX IF NOT EXISTS idx_clientes_indicado_por ON clientes(indicado_por_id);

-- Em contadores
CREATE INDEX IF NOT EXISTS idx_contadores_clientes_ativos ON contadores(clientes_ativos);

-- Em pagamentos
CREATE INDEX IF NOT EXISTS idx_pagamentos_pago_em ON pagamentos(pago_em);
```

---

## 5. PRIORIZAÇÃO DE MIGRATIONS

### 🔴 MIGRATION 1: Campos Críticos em Clientes (URGENTE)
```sql
-- Adicionar mes_captacao e indicado_por_id
-- Tempo estimado: 5 minutos
-- Impacto: ALTO - Bloqueia bônus LTV
```

### 🔴 MIGRATION 2: Criar bonus_ltv_grupos (URGENTE)
```sql
-- Criar tabela completa
-- Tempo estimado: 10 minutos
-- Impacto: ALTO - Bloqueia bônus LTV
```

### 🟡 MIGRATION 3: Campos Stripe Connect em Contadores (ALTA)
```sql
-- Adicionar stripe_account_id, stripe_account_status, stripe_onboarding_completed
-- Tempo estimado: 5 minutos
-- Impacto: MÉDIO - Necessário para ÉPICO 5
```

### 🟡 MIGRATION 4: Expandir ENUM tipo_comissao (ALTA)
```sql
-- Adicionar valores específicos (19 total)
-- Tempo estimado: 5 minutos
-- Impacto: MÉDIO - Melhora rastreamento
```

### 🟢 MIGRATION 5: Adicionar Índices Faltantes (MÉDIA)
```sql
-- Criar índices de performance
-- Tempo estimado: 5 minutos
-- Impacto: MÉDIO - Performance
```

### 🟢 MIGRATION 6: Campo nivel_contador_na_epoca em comissoes (MÉDIA)
```sql
-- Adicionar campo de auditoria
-- Tempo estimado: 3 minutos
-- Impacto: BAIXO - Melhora auditoria
```

---

## 6. CHECKLIST DE VALIDAÇÃO

### Antes de Aplicar Migrations

- [ ] Backup completo do banco de dados
- [ ] Testar migrations em ambiente de desenvolvimento
- [ ] Validar queries existentes não quebram
- [ ] Verificar RLS ainda funciona
- [ ] Testar Edge Functions não quebram

### Após Aplicar Migrations

- [ ] Executar query de validação (conferir tipos)
- [ ] Testar cálculo de comissões
- [ ] Testar páginas do frontend
- [ ] Verificar console sem erros 400/404
- [ ] Validar performance (número de queries)

---

## 7. CONCLUSÃO

### Alinhamento Geral: 75%

**✅ O QUE ESTÁ BOM:**
- Estrutura base de tabelas (16 de 18)
- ENUMs principais
- Relacionamentos (FKs)
- RLS configurado
- Sistema de auditoria

**🔴 O QUE ESTÁ FALTANDO:**
- 1 tabela crítica (`bonus_ltv_grupos`)
- 2 campos críticos em `clientes`
- 3 campos importantes em `contadores`
- ENUM `tipo_comissao` precisa valores específicos
- Alguns índices de performance

**🎯 PRÓXIMA AÇÃO:**
Prosseguir para FASE 4 - Criar migrations SQL prontas para aplicar.


