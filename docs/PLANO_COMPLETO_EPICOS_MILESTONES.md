# 🎯 PLANO COMPLETO: ÉPICOS E MILESTONES PARA LANÇAMENTO

**Data:** 21/11/2025  
**Status:** 📋 Estruturação Final  
**Objetivo:** Lançamento Produção até 26/12/2025

---

## 📊 VISÃO GERAL

### **Progresso Geral: 70%**

```
[██████████████████░░░░░░] 70%

Épicos Concluídos: 5/10 (50%)
Milestones Concluídos: 8/13 (62%)
```

**Nota:** Progresso ajustado após adicionar Épico 6 (Arquitetura) e Épico 10 (CRM).

---

## ✅ ÉPICOS CONCLUÍDOS (5/10)

### **ÉPICO 0: Fundamentos de Código** ✅
**Status:** 100% Completo  
**Data Conclusão:** 15/11/2025

**Entregas:**
- ✅ Base sólida estabelecida
- ✅ Código organizado e estruturado
- ✅ Padrões de código definidos
- ✅ TypeScript configurado

---

### **ÉPICO 1: Segurança e Validação** ✅
**Status:** 100% Completo  
**Data Conclusão:** 16/11/2025

**Entregas:**
- ✅ Webhooks seguros implementados
- ✅ Validações robustas (Zod)
- ✅ RLS policies configuradas
- ✅ Logging estruturado

---

### **ÉPICO 2: Sistema de Comissões (17 Bonificações)** ✅
**Status:** 100% Completo  
**Data Conclusão:** 17/11/2025

**Entregas:**
- ✅ Todas as 17 bonificações implementadas
- ✅ Cálculos precisos e validados
- ✅ Edge Functions funcionando
- ✅ Auditoria completa

**Bonificações Implementadas:**
1. ✅ Bônus Ativação (100% primeira mensalidade)
2. ✅ Comissão Recorrente por Nível (Bronze, Prata, Ouro, Diamante)
3. ✅ Override (3-5% por nível)
4. ✅ Bônus Progressão (marcos de nível)
5. ✅ Bônus Volume (volumetria mensal)
6. ✅ Bônus LTV (faixas 6/12/18 meses)
7. ✅ Bônus Indicação Contador
8. ✅ Bônus Lead Diamante
9. ✅ Bônus Rede
10. ✅ Bônus Contador
11. ✅ Bônus Progressão Nível
12. ✅ Bônus Volume Mensal
13. ✅ Bônus LTV 6 Meses
14. ✅ Bônus LTV 12 Meses
15. ✅ Bônus LTV 18 Meses
16. ✅ Bônus Rede Completa
17. ✅ Bônus Indicação Especial

---

### **ÉPICO 3: Frontend Portal** ✅
**Status:** 100% Completo  
**Data Conclusão:** 18/11/2025

**Entregas:**
- ✅ Dashboard completo
- ✅ Página de Comissões
- ✅ Calculadora de Comissões
- ✅ Relatórios e Analytics
- ✅ Rede MLM (visualização)
- ✅ Links de Indicação
- ✅ Perfil do Contador

---

### **ÉPICO 4: App Onboarding** ✅
**Status:** 100% Completo  
**Data Conclusão:** 19/11/2025

**Entregas:**
- ✅ 6 telas mobile-first
- ✅ Branding dinâmico do contador
- ✅ Upload de documentos
- ✅ Assinatura digital
- ✅ Integração Stripe (checkout)
- ✅ Edge Functions de onboarding

**Telas Implementadas:**
1. ✅ Welcome (logo dinâmica, benefícios)
2. ✅ Seleção de Plano (PRO, PREMIUM, TOP)
3. ✅ Upload de Dados (PF/PJ, documentos)
4. ✅ Assinatura de Contrato (canvas)
5. ✅ Checkout Stripe
6. ✅ Confirmação

---

## 🔄 ÉPICO EM ANDAMENTO (1/10)

### **ÉPICO 5: Stripe Connect & Pagamentos** 🔄
**Status:** 60% Completo  
**Data Início:** 20/11/2025  
**Data Estimada Conclusão:** 05/12/2025

**Entregas Parciais:**
- ✅ Configuração Stripe Connect (parcial)
- ✅ Webhook Stripe implementado
- ✅ Edge Functions de pagamento criadas
- ⏳ Integração completa (pendente)
- ⏳ Testes finais (pendente)
- ⏳ Processamento de saques (pendente)

**Próximas Tarefas:**
- [ ] Finalizar configuração Stripe Connect Express
- [ ] Testes end-to-end de pagamentos
- [ ] Validação de webhooks
- [ ] Processamento automático de saques
- [ ] Testes com valores reais (sandbox)

---

## ⏳ PRÓXIMOS ÉPICOS (4/10)

### **ÉPICO 6: Estudo e Correção de Arquitetura** 🔴 **CRÍTICO - ANTES DE PERFORMANCE**
**Status:** Pendente  
**Prioridade:** CRÍTICA (bloqueador)  
**Data Estimada:** 22/11/2025 - 24/11/2025

**Objetivo:** Entender arquitetura atual, corrigir inconsistências de schema, padronizar queries

**Contexto:**
- Múltiplas queries tentam acessar campos que não existem (ex: `contadores.nome`, `contadores.email`)
- Erros 400/404 em várias páginas
- Schema não está alinhado com código existente

**FASE A: Audit Completo** (30 min)
- [ ] Mapear TODAS as queries que acessam `contadores`
- [ ] Listar quais colunas cada query busca
- [ ] Verificar quais campos realmente existem no banco
- [ ] Identificar quais precisam fazer JOIN com `auth.users` ou `profiles`
- [ ] Criar documento com mapeamento completo

**FASE B: Padronizar Pattern** (1h)
- [ ] Criar padrão único para queries a `contadores`
- [ ] Documentar padrão correto de JOIN com `auth.users`
- [ ] Criar helper functions/utilities se necessário
- [ ] Exemplos de código correto

**Padrão Correto a Implementar:**
```typescript
// Campos que EXISTEM em contadores:
- id, nivel, clientes_ativos, user_id, status, xp, created_at, updated_at

// Para obter NOME/EMAIL:
// JOIN com auth.users via user_id
// Usar: u.raw_user_meta_data->>'nome'
```

**FASE C: Aplicar Padrão** (2h)
- [ ] Corrigir Dashboard.tsx
- [ ] Corrigir AdminWithdrawals.tsx
- [ ] Corrigir Comissões.tsx
- [ ] Corrigir LinksIndicacao.tsx
- [ ] Corrigir outras páginas que precisem
- [ ] Remover queries que buscam campos inexistentes

**FASE D: Testar e Validar** (30 min)
- [ ] Cada página deve carregar sem 400/404
- [ ] Console deve estar limpo (sem erros)
- [ ] Dashboard deve mostrar dados corretos
- [ ] Todas as queries funcionando

**Entregáveis:**
- ✅ Documento de mapeamento completo (ARQUITETURA_COMPLETA.md)
- ✅ Padrão documentado de queries
- ✅ Todas as páginas corrigidas
- ✅ Console limpo (zero erros 400/404)
- ✅ Testes validando correções

**Referência:** `docs/ARQUITETURA_E_PLANO_DEFINITIVO.md`

---

### **ÉPICO 7: Otimização de Performance** 🔴 **URGENTE**
**Status:** Pendente  
**Prioridade:** CRÍTICA  
**Data Estimada:** 25/11/2025 - 01/12/2025  
**Pré-requisito:** ✅ Épico 6 (Arquitetura) deve estar completo

**Objetivo:** Reduzir tempo de carregamento em 3G para <15s

**Nota:** Este épico só pode começar DEPOIS que o Épico 6 estiver completo, pois precisa de queries corretas e arquitetura alinhada.

**Tarefas:**
- [ ] Análise completa de performance
- [ ] Reduzir número de requisições (meta: <50)
- [ ] Otimizar queries do Supabase
- [ ] Implementar cache mais agressivo
- [ ] Code splitting melhorado
- [ ] Lazy loading otimizado
- [ ] Testes em 3G (meta: <15s)

**Métrica de Sucesso:**
- ✅ Carregamento < 15s em 3G
- ✅ < 50 requisições por página
- ✅ Lighthouse Performance > 80

---

### **ÉPICO 8: Testes e Qualidade**
**Status:** Pendente  
**Prioridade:** ALTA  
**Data Estimada:** 02/12/2025 - 12/12/2025

**Objetivo:** Cobertura de testes > 80%, zero bugs críticos

**Tarefas:**
- [ ] Testes E2E completos
- [ ] Testes de carga
- [ ] Testes de segurança
- [ ] Testes de integração
- [ ] Cobertura > 80%

---

### **ÉPICO 9: Preparação para Lançamento**
**Status:** Pendente  
**Prioridade:** ALTA  
**Data Estimada:** 13/12/2025 - 19/12/2025

**Objetivo:** Tudo pronto para lançamento beta

**Tarefas:**
- [ ] Documentação completa
- [ ] Monitoramento configurado (Sentry)
- [ ] Alertas críticos
- [ ] Runbook de operações
- [ ] Deploy em staging
- [ ] Validação pós-deploy

---

### **ÉPICO 10: CRM Funcional** 🆕
**Status:** Pendente  
**Prioridade:** ALTA  
**Data Estimada:** 20/12/2025 - 10/01/2026  
**Duração:** ~2-3 semanas

**Objetivo:** Criar interface administrativa completa para gerenciar contadores topline, downline e clientes, com pipeline visual, hierarquia e analytics.

**Contexto:**
- Estrutura de dados já existe (17+ tabelas)
- Relacionamentos já estão mapeados
- Status já estão definidos
- Views agregadas já existem
- **Falta apenas:** Interface completa e funcionalidades avançadas

**Referência:** `docs/ANALISE_CRM_FUNCIONAL.md`

---

#### **FASE 1: Interface CRM para Admin** (1 semana)

**1.1 Página de Gestão de Contadores**
- [ ] Rota: `/admin/contadores`
- [ ] Lista completa de todos os contadores
- [ ] Filtros:
  - Por status (ativo, inativo)
  - Por nível (Bronze, Prata, Ouro, Diamante)
  - Por sponsor (topline)
  - Por data de cadastro
- [ ] Busca por nome, email, CPF
- [ ] Visualização hierárquica (árvore MLM)
- [ ] Ações:
  - Alterar status do contador
  - Ver detalhes completos
  - Ver rede (downlines)
  - Ver clientes gerenciados

**1.2 Página de Gestão de Clientes**
- [ ] Rota: `/admin/clientes`
- [ ] Lista completa de todos os clientes
- [ ] Filtros:
  - Por status (lead, ativo, cancelado)
  - Por contador gerenciador
  - Por plano
  - Por data de ativação
- [ ] Busca por nome, CNPJ, email
- [ ] Ações:
  - Alterar status do cliente
  - Transferir cliente entre contadores
  - Ver histórico de pagamentos
  - Ver comissões geradas

**1.3 Visualização Hierárquica (Árvore MLM)**
- [ ] Rota: `/admin/rede-hierarquia`
- [ ] Árvore visual da rede MLM
- [ ] Navegação por níveis (1-5)
- [ ] Cores diferentes por nível
- [ ] Filtros por contador específico
- [ ] Estatísticas por nível:
  - Total de contadores
  - Total de clientes
  - Total de comissões geradas

---

#### **FASE 2: Funcionalidades de Pipeline** (3 dias)

**2.1 Pipeline de Clientes (Funnel)**
- [ ] Rota: `/admin/pipeline-clientes`
- [ ] Visualização em Kanban (drag & drop)
- [ ] Status: Lead → Ativo → Inadimplente → Cancelado
- [ ] Contagem por status
- [ ] Timeline de movimentação entre status
- [ ] Ações rápidas:
  - Mover para próximo status
  - Adicionar observação
  - Enviar notificação

**2.2 Pipeline de Contadores (Onboarding)**
- [ ] Status: Convidado → Cadastrado → Ativo → Inativo
- [ ] Visualização em Kanban
- [ ] Métricas de conversão

---

#### **FASE 3: Relacionamentos e Timeline** (3 dias)

**3.1 Timeline de Atividades**
- [ ] Timeline completa por Contador/Cliente:
  - Data de cadastro
  - Quando foi indicado (por quem)
  - Primeira comissão
  - Mudanças de nível
  - Clientes indicados
  - Saques solicitados
  - Eventos importantes

**3.2 Gestão de Relacionamentos**
- [ ] Interface para visualizar todas as relações
- [ ] Histórico de mudanças de relacionamentos
- [ ] Transferência de clientes entre contadores

---

#### **FASE 4: Notas e Interações** (2 dias)

**4.1 Sistema de Notas**
- [ ] Criar tabela `crm_notas`
- [ ] Adicionar notas em contadores e clientes
- [ ] Editar/excluir notas
- [ ] Buscar por conteúdo de notas
- [ ] Timeline de notas

**4.2 Sistema de Interações**
- [ ] Criar tabela `crm_interacoes`
- [ ] Registrar interações (email, telefone, whatsapp, reunião)
- [ ] Lembretes de follow-up
- [ ] Histórico completo de interações

**Migration SQL:**
```sql
-- Tabela crm_notas
CREATE TABLE crm_notas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entidade_tipo TEXT NOT NULL CHECK (entidade_tipo IN ('contador', 'cliente')),
  entidade_id UUID NOT NULL,
  autor_id UUID NOT NULL REFERENCES auth.users(id),
  conteudo TEXT NOT NULL,
  visibilidade TEXT DEFAULT 'privada' CHECK (visibilidade IN ('privada', 'equipe', 'publica')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela crm_interacoes
CREATE TABLE crm_interacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entidade_tipo TEXT NOT NULL CHECK (entidade_tipo IN ('contador', 'cliente')),
  entidade_id UUID NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('email', 'telefone', 'whatsapp', 'reuniao', 'outro')),
  assunto TEXT NOT NULL,
  descricao TEXT,
  data_interacao TIMESTAMPTZ NOT NULL,
  proximo_followup TIMESTAMPTZ,
  autor_id UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);
```

---

#### **FASE 5: Analytics e Relatórios CRM** (3 dias)

**5.1 Dashboard CRM**
- [ ] Métricas Gerais:
  - Total de contadores por nível
  - Total de clientes por status
  - Taxa de conversão (lead → ativo)
  - Taxa de retenção
  - Crescimento mensal

**5.2 Relatórios Avançados**
- [ ] Relatório de Rede:
  - Distribuição por níveis
  - Contador com mais downlines
  - Rede mais profunda
  - Rede mais lucrativa
- [ ] Relatório de Performance:
  - Contadores top performers
  - Clientes mais valiosos
  - Taxa de cancelamento
  - Tempo médio de conversão

---

**Critérios de Aceitação:**
- [ ] Admin pode visualizar todos os contadores e clientes
- [ ] Filtros e busca funcionam corretamente
- [ ] Árvore MLM renderiza corretamente
- [ ] Pipeline Kanban permite drag & drop
- [ ] Timeline mostra eventos históricos
- [ ] Notas e interações podem ser criadas/visualizadas
- [ ] Dashboard CRM mostra métricas em tempo real
- [ ] Relatórios podem ser exportados (CSV/PDF)

**Entregáveis:**
- ✅ 5 páginas admin completas
- ✅ 2 tabelas novas (crm_notas, crm_interacoes)
- ✅ Dashboard CRM com métricas
- ✅ Pipeline visual (Kanban)
- ✅ Árvore hierárquica funcional

---

## 🎯 MILESTONES PARA LANÇAMENTO

### **MILESTONE 0: Arquitetura Corrigida e Documentada** 🔴 **CRÍTICO - BLOQUEADOR**
**Data Alvo:** 24/11/2025  
**Status:** Pendente

**Critérios de Aceitação:**
- [ ] Audit completo realizado
- [ ] Todas as queries corrigidas
- [ ] Zero erros 400/404 no console
- [ ] Padrão de queries documentado
- [ ] Documentação de arquitetura atualizada

**Responsável:** Dev Team  
**Prioridade:** CRÍTICA (bloqueador)

---

### **MILESTONE 1: Performance Otimizada** 🔴 **URGENTE**
**Data Alvo:** 01/12/2025 (ajustado após Épico 6)  
**Status:** Pendente  
**Pré-requisito:** ✅ MILESTONE 0 (Arquitetura Corrigida)

**Critérios de Aceitação:**
- [ ] Páginas carregam em < 15s em 3G
- [ ] < 50 requisições por carregamento
- [ ] Lighthouse Performance > 80
- [ ] LCP < 4s

**Responsável:** Dev Team  
**Prioridade:** CRÍTICA

---

### **MILESTONE 2: Épico 5 Completo (Stripe Connect)**
**Data Alvo:** 05/12/2025  
**Status:** Em Andamento (60%)

**Critérios de Aceitação:**
- [ ] Stripe Connect Express configurado
- [ ] Pagamentos funcionando end-to-end
- [ ] Webhooks validados
- [ ] Processamento de saques automático
- [ ] Testes com valores reais passando

**Responsável:** Dev Team  
**Prioridade:** ALTA

---

### **MILESTONE 3: Testes Finais**
**Data Alvo:** 12/12/2025  
**Status:** Aguardando

**Critérios de Aceitação:**
- [ ] Testes E2E 100% passando
- [ ] Testes de carga concluídos
- [ ] Testes de segurança concluídos
- [ ] Cobertura > 80%
- [ ] Zero bugs críticos

**Responsável:** QA Team + Dev Team  
**Prioridade:** ALTA

---

### **MILESTONE 4: Lançamento Beta**
**Data Alvo:** 19/12/2025  
**Status:** Aguardando

**Critérios de Aceitação:**
- [ ] Deploy em produção concluído
- [ ] Monitoramento ativo
- [ ] Documentação completa
- [ ] Equipe treinada
- [ ] Rollback plan documentado

**Responsável:** DevOps + Dev Team  
**Prioridade:** ALTA

---

### **MILESTONE 5: Lançamento Produção**
**Data Alvo:** 26/12/2025  
**Status:** Aguardando

**Critérios de Aceitação:**
- [ ] Beta testado por 1 semana
- [ ] Zero problemas críticos
- [ ] Performance validada
- [ ] Monitoramento funcionando
- [ ] Suporte preparado

**Responsável:** Product Team  
**Prioridade:** CRÍTICA

---

## 📅 TIMELINE COMPLETA

### **SEMANA 1 (21-28/11) - Arquitetura + Performance** 🔴
**Foco:** Correção de arquitetura (BLOQUEADOR) + Otimização de performance

**Segunda (22/11) - ARQUITETURA:**
- 🔴 **MANHÃ:** FASE A - Audit completo de queries
- 🔴 **TARDE:** FASE B - Padronizar pattern de queries

**Terça (23/11) - ARQUITETURA:**
- 🔴 **MANHÃ:** FASE C - Aplicar padrão (corrigir páginas)
- 🔴 **TARDE:** FASE D - Testes e validação

**Quarta (24/11):**
- ✅ **MILESTONE 0: Arquitetura Corrigida**
- Análise de performance completa (início)

**Terça-Quinta (23-25/11):**
- Otimização de queries
- Redução de requisições
- Cache implementado

**Sexta-Sábado (26-27/11):**
- Testes em 3G
- Ajustes finais

**Domingo (28/11):**
- ✅ **MILESTONE 1: Performance Otimizada**

---

### **SEMANA 2 (29/11-05/12) - Finalizar Épico 5**
**Foco:** Stripe Connect completo

**Segunda-Quarta (29/11-01/12):**
- Finalizar integração Stripe Connect
- Testes de pagamentos

**Quinta-Sexta (02-03/12):**
- Processamento de saques
- Validação completa

**Sábado (04/12):**
- Testes finais

**Domingo (05/12):**
- ✅ **MILESTONE 2: Épico 5 Completo**

---

### **SEMANA 3 (06-12/12) - Testes**
**Foco:** Qualidade e testes

**Segunda-Quarta (06-08/12):**
- Testes E2E
- Testes de carga

**Quinta-Sexta (09-10/12):**
- Testes de segurança
- Correção de bugs

**Sábado (11/12):**
- Cobertura de testes

**Domingo (12/12):**
- ✅ **MILESTONE 3: Testes Finais**

---

### **SEMANA 4 (13-19/12) - Preparação Beta**
**Foco:** Preparação para lançamento

**Segunda-Quarta (13-15/12):**
- Documentação
- Monitoramento

**Quinta-Sexta (16-17/12):**
- Deploy staging
- Validação

**Sábado (18/12):**
- Treinamento equipe

**Domingo (19/12):**
- ✅ **MILESTONE 4: Lançamento Beta**

---

### **SEMANA 5 (20-26/12) - Produção**
**Foco:** Validação beta e produção

**Segunda-Quinta (20-23/12):**
- Monitoramento beta
- Correções rápidas

**Sexta (24/12):**
- Preparação final

**Sábado (25/12):**
- ✅ **MILESTONE 5: Lançamento Produção**

**Domingo (26/12):**
- 🎉 **LANÇAMENTO OFICIAL**

---

### **SEMANAS 6-8 (27/12-10/01) - CRM Funcional** 🆕
**Foco:** Épico 10 - Interface administrativa completa (pós-lançamento)

**Semana 1 (27/12-02/01):**
- FASE 1: Interface CRM para Admin
  - Página de Gestão de Contadores
  - Página de Gestão de Clientes
  - Visualização Hierárquica (Árvore MLM)

**Semana 2 (03-09/01):**
- FASE 2: Funcionalidades de Pipeline (Kanban)
- FASE 3: Relacionamentos e Timeline
- FASE 4: Notas e Interações (migrations)

**Semana 3 (10/01):**
- FASE 5: Analytics e Relatórios CRM
- Testes finais
- ✅ **ÉPICO 10: CRM Funcional Completo**

**Nota:** Épico 10 é uma funcionalidade de melhoria pós-lançamento, não bloqueia o MVP inicial.

---

## 🚨 RISCOS E MITIGAÇÕES

### **Risco 1: Performance em 3G** 🔴
**Probabilidade:** ALTA  
**Impacto:** CRÍTICO

**Mitigação:**
- Priorizar Épico 6 imediatamente
- Testar continuamente em 3G
- Fallback para versão simplificada se necessário

---

### **Risco 2: Integração Stripe**
**Probabilidade:** MÉDIA  
**Impacto:** ALTO

**Mitigação:**
- Testes extensivos em sandbox
- Plano B: processamento manual temporário
- Documentação de troubleshooting

---

### **Risco 3: Bugs em Produção**
**Probabilidade:** MÉDIA  
**Impacto:** ALTO

**Mitigação:**
- Monitoramento ativo (Sentry)
- Rollback plan documentado
- Equipe de suporte preparada

---

## 📊 MÉTRICAS DE SUCESSO

### **Performance:**
- ✅ LCP < 4s (em 3G)
- ✅ Total Load < 15s (em 3G)
- ✅ < 50 requisições por página
- ✅ Lighthouse Performance > 80

### **Qualidade:**
- ✅ Cobertura de testes > 80%
- ✅ Zero bugs críticos
- ✅ Uptime > 99%

### **Funcionalidades:**
- ✅ Todos os 9 épicos completos (MVP)
- ✅ Todas as 17 bonificações funcionando
- ✅ Stripe Connect integrado
- ✅ Onboarding completo
- ⏳ CRM Funcional (Épico 10 - pós-lançamento)

---

## 📝 PRÓXIMAS AÇÕES IMEDIATAS

### **HOJE (21/11):**
- ✅ Commit das correções
- ✅ Documentação estruturada
- ✅ Plano de épicos e milestones completo

### **AMANHÃ (22/11) - CRÍTICO:**
- 🔴 **PRIORIDADE 1:** Iniciar Épico 6 (Arquitetura) - BLOQUEADOR
  - FASE A: Audit completo de queries (manhã)
  - FASE B: Padronizar pattern (tarde)
- ⚠️ **PRIORIDADE 2:** Depois da arquitetura, seguir com performance

### **TERÇA (23/11):**
- 🔴 Finalizar Épico 6 (Arquitetura)
  - FASE C: Aplicar correções (manhã)
  - FASE D: Testes (tarde)

### **QUARTA (24/11):**
- ✅ MILESTONE 0: Arquitetura Corrigida
- Iniciar Épico 7 (Performance)

---

## ✅ CHECKLIST DE LANÇAMENTO

### **Técnico:**
- [ ] Performance otimizada (<15s em 3G)
- [ ] Todos os épicos completos
- [ ] Testes passando (100%)
- [ ] Cobertura > 80%
- [ ] Monitoramento configurado
- [ ] Deploy automatizado
- [ ] Rollback plan documentado

### **Documentação:**
- [ ] Guia do usuário (contadores)
- [ ] Documentação técnica
- [ ] Runbook de operações
- [ ] FAQ

### **Operacional:**
- [ ] Equipe treinada
- [ ] Suporte preparado
- [ ] Comunicação com usuários
- [ ] Plano de marketing (se aplicável)

---

**Última atualização:** 21/11/2025 23:00

