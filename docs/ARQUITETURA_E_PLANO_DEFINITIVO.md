# Arquitetura e Plano Definitivo do App

**Data:** 26 de Novembro de 2025  
**Objetivo:** Entender a arquitetura, fazer um plano claro, executar de forma assertiva.

---

## 1. O QUE JÁ EXISTE NO APP

### 1.1 Banco de Dados (Supabase)
- **Tabelas principais:** `contadores`, `comissoes`, `clientes`, `pagamentos`, `solicitacoes_saque`
- **Migrations:** 10+ migrations que criaram a estrutura
- **RPC Functions:** `obter_dashboard_contador`, `aprovar_comissoes`, `fn_processar_solicitacao_saque`
- **Status:** Alguns erros de consistência (ENUMs duplicados, constraints incorretos) - JÁ FORAM CORRIGIDOS

### 1.2 Frontend (Vite/React)
- **Autenticação:** Supabase Auth (signup/login/password reset)
- **Páginas:** Dashboard, Comissões, Saques, Links, Rede, Relatórios, Aprovações, etc.
- **Componentes:** UI genéricos (Shadcn), gráficos (Recharts), formulários
- **Estado:** React Query para cache/sincronização

### 1.3 Backend (Supabase Edge Functions)
- `calcular-comissoes`: Calcula comissões automáticas
- `processar-pagamentos`: Processa pagamentos via Stripe
- `test-processar-pagamentos`: Teste manual
- `send-approval-email`: Envia emails de aprovação
- `aprovar-comissoes`: RPC para aprovar comissões

---

## 2. FLUXOS PRINCIPAIS DO APP

### 2.1 Fluxo de Autenticação
```
User (signup/login) → Supabase Auth → Redirect to Dashboard/Onboarding
```

### 2.2 Fluxo de Comissão
```
Payment (via Stripe) → Webhook → calcular-comissoes → DB update
  ↓
Admin approves → aprovar-comissoes → fn_processar_solicitacao_saque
  ↓
Transfer to contador via Stripe Connect
```

### 2.3 Fluxo de Saque
```
Contador solicita saque → solicitacoes_saque table → Admin dashboard
  ↓
Admin processa → fn_processar_solicitacao_saque
  ↓
Transfer via Stripe/PIX
```

---

## 3. STATUS ATUAL DOS ERROS

### ✅ CORRIGIDO
- [x] Migration de saques aplicada (solicitacoes_saque)
- [x] Função obter_dashboard_contador corrigida
- [x] AdminApprovalsPage queries corrigidas (removido profiles(nome))
- [x] Build de produção funcional

### 🔴 AINDA HÁ PROBLEMAS
- Dashboard retorna 404 na query de comissões (fallback não verificado)
- AdminWithdrawals tenta buscar contadores.nome e contadores.email (não existem)
- Comissões.tsx query tenta buscar campos inexistentes

---

## 4. RAIZ DO PROBLEMA

**Problema Central:** Quando o app foi criado pelo Lovable, o esquema do banco tinha colunas que depois foram removidas:
- `contadores.nome` (deveria ser em `auth.users` ou `profiles`)
- `contadores.email` (deveria ser em `auth.users`)

**Consequência:** Várias pages/queries ainda tentam buscar esses campos e recebem 400/404.

---

## 5. SOLUÇÃO ESTRUTURADA

### FASE A: Audit Completo (30 min)
Mapear TODAS as queries que acessam `contadores`:
1. Quais colunas cada query busca?
2. Quais existem realmente no banco?
3. Quais precisam fazer JOIN com auth.users ou profiles?

### FASE B: Padronizar Pattern (1h)
Criar um padrão consistente:
```typescript
// PATTERN CORRETO:
const { data } = await supabase
  .from('contadores')
  .select('id, nivel, clientes_ativos, user_id') // Apenas campos que EXISTEM
  .eq('user_id', user?.id)
  .single();

// SE PRECISAR DO NOME:
// Fazer JOIN com auth.users
// Usar: u.raw_user_meta_data->>'nome'
```

### FASE C: Aplicar Padrão (2h)
Corrigir cada página:
- Dashboard.tsx
- AdminWithdrawals.tsx
- Comissões.tsx
- LinksIndicacao.tsx
- E outras que precisem

### FASE D: Testar (30 min)
- Cada página deve carregar sem 400/404
- Console deve estar limpo
- Dashboard deve mostrar dados

---

## 6. PLANO DE AÇÃO (AMANHÃ)

### Segunda (horário sugerido)
**Manhã (9h - 11h):**
1. Você: Audita TODAS as queries → lista em documento
2. Eu: Analisa padrão de erro
3. Nós: Decidimos o plano exato

**Meio-dia (11h - 13h):**
1. Eu: Crio migrations se necessário
2. Eu: Corrige páginas em lote
3. Você: Valida mudanças

**Tarde (14h - 16h):**
1. Testes completos
2. Ajustes finais
3. Deploy de produção

---

## 7. REGRAS PARA NÃO VOLTAR A ISSO

### RULE 1: Audit antes de corrigir
- Problema estranho? Antes de qualquer coisa, entender A RAIZ.
- Não tentar "jeitinhos" temporários.

### RULE 2: Padrão único
- Uma forma correta de fazer queries a contadores.
- Documentar em comentário no código.

### RULE 3: Validar sempre
- Ao corrigir, testar em dev mode ANTES de merging.
- Checar console: deve estar limpo.

### RULE 4: Documentar schema
- Manter documento atualizado com:
  - Quais colunas cada tabela realmente tem
  - Qual o padrão de acesso
  - Exemplos corretos

---

## 8. PRÓXIMO PASSO

**Ação agora:**
1. Você descansa (dormir!!)
2. Amanhã: Rodamos Fase A (audit)
3. Depois: Plano exato baseado no audit

**Não vamos corrigir à noite apagando fogo.**
**Vamos fazer direito amanhã com a mente fresca.**

---

## 9. Resumo Executivo

| Item | Status | Prioridade |
|------|--------|-----------|
| Migrations aplicadas | ✅ | - |
| Dashboard RPC | ✅ | - |
| AdminApprovals queries | ✅ | - |
| Audit de outras queries | ⏳ | ALTA |
| Correções em lote | ⏳ | ALTA |
| Validação final | ⏳ | ALTA |


