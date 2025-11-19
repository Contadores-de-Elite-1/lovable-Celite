# 📚 Base de Dados para Consulta - Lovable-Celite

**Versão**: 1.0  
**Data**: Novembro 2025  
**Objetivo**: Centralizar todos os documentos de referência do projeto

---

## 🎯 Como Usar Este Documento

Este é o **índice mestre** de toda a documentação do Lovable-Celite. Use-o para:
- Encontrar rapidamente informações específicas
- Entender a estrutura do projeto
- Consultar regras de negócio
- Revisar decisões técnicas
- Validar implementações

---

## 📑 ÍNDICE DE DOCUMENTOS

### **1. FRAMEWORKS**

#### **1.1 Framework Resumido** ⭐ **PRINCIPAL**
- **Arquivo**: `/FRAMEWORK_LOVABLE_CELITE.md`
- **Linhas**: ~500
- **Conteúdo**: Guia rápido, direto ao ponto
- **Quando usar**: Referência rápida durante desenvolvimento
- **Seções principais**:
  - Problema (7 dores emocionais)
  - Solução (4 pilares)
  - Arquitetura técnica
  - Funcionalidades principais
  - Checklist implementação
  - Métricas de sucesso

#### **1.2 Framework Completo**
- **Arquivo**: `/docs/FRAMEWORK_COMPLETO.md`
- **Linhas**: 4.372
- **Conteúdo**: Documentação exaustiva com profundidade psicográfica
- **Quando usar**: Planejamento estratégico, pitch investidores, onboarding equipe
- **Seções principais**:
  - Seção 0: Psicografia completa do cliente-alvo (Carlos)
  - Seção 1: Visão estratégica
  - Seção 2: Insights do mercado
  - Seção 3: Arquitetura técnica
  - Seção 4: Criação interativa
  - Seção 5: Lançamento e PDCA
  - Apêndice: Por que cada feature existe

#### **1.3 Framework Original (Exemplo)**
- **Arquivo**: `/docs/Framework`
- **Linhas**: 538
- **Conteúdo**: Framework exemplo usado como base
- **Quando usar**: Referência de estrutura, comparação

---

### **2. REGRAS DE NEGÓCIO**

#### **2.1 Regras do Programa de Bonificações** ⭐ **CRÍTICO**
- **Arquivo**: `/docs/17 bonificacoes_Regras do programa`
- **Linhas**: 462
- **Conteúdo**: Regras COMPLETAS do programa de comissões e bonificações
- **Quando usar**: Implementar sistema de comissões, validar cálculos
- **Seções principais**:
  - 7 tipos de comissão (ativação, recorrente, override, progressão, volume, LTV, contador)
  - Sistema TIER de performance
  - Porto Seguro Elite/Semi-Elite
  - Janela de Reativação (90/180 dias)
  - Planos e valores (Pro R$100, Premium R$130, Top R$180)
  - Incentivos ao cliente (cashback 50%)
  - Lead Diamante (definição operacional completa)

#### **2.2 Prompt Original**
- **Arquivo**: `/docs/Prompt 1`
- **Linhas**: 323
- **Conteúdo**: Prompt inicial com especificações do projeto
- **Quando usar**: Entender origem do projeto, validar requisitos iniciais
- **Seções principais**:
  - Sistema de links rastreáveis (`/i/:token`, `/r/:token`)
  - Fluxo de indicação de clientes
  - Fluxo de convite de contadores
  - Estrutura de comissões
  - Mini-LP de conversão

---

### **3. PERSONA & AVATAR**

#### **3.1 Avatar do Cliente-Alvo** ⭐ **ESSENCIAL PARA UX**
- **Arquivo**: `/docs/AVATAR`
- **Linhas**: 679
- **Conteúdo**: Psicografia PROFUNDA do contador (Carlos)
- **Quando usar**: Tomar decisões de UX, escrever copy, validar features
- **Seções principais**:
  - Perfil demográfico (42 anos, Aracaju, 18 anos experiência)
  - AS 7 DORES EMOCIONAIS:
    1. **MEDO** (paralisa decisão, tem R$15 mil mas não investe)
    2. **DESVALORIZAÇÃO** ("É só contabilidade mesmo")
    3. **PRESSÃO SOCIAL** (família tem pena)
    4. **VERGONHA** (filhos sem orgulho do pai) ← DOR MAIS PROFUNDA
    5. **SOLIDÃO** ("não posso falar com ninguém")
    6. **POTENCIAL DESPERDIÇADO** (18 anos fazendo trabalho de auxiliar)
    7. **ESTAGNAÇÃO** (mesmo faturamento há 5 anos)
  - OS 10 ANSEIOS E SONHOS:
    1. **Filhos terem orgulho do pai** ← ANSEIO SUPREMO
    2. Ser respeitado como especialista
    3. Trabalhar 6-8h/dia (não 12h)
    4. Família vibrar com conquistas
    5. Deixar legado positivo
    + 5 secundários
  - História Real: Diário de Carlos
  - Gatilhos de marketing
  - Comportamento de compra

---

### **4. DOCUMENTAÇÃO TÉCNICA**

#### **4.1 PRD do Portal de Transparência (Portal dos Contadores)** ⭐ **CRÍTICO**
- **Arquivo**: `/docs/PRD_LOVABLE_CELITE.md`
- **Linhas**: 1.275
- **Conteúdo**: Documento técnico 100% implementável - Sistema de comissões MLM/MMN
- **Responsável**: DEV 2
- **Quando usar**: Durante desenvolvimento, testes e validação técnica
- **Seções principais**:
  1. Visão Geral Técnica
  2. AS 17 BONIFICAÇÕES COMPLETAS (com fórmulas)
  3. Stack Tecnológica
  4. Portal de Transparência (5 páginas)
  5. Modelo de Dados (6 tabelas SQL)
  6. Fórmulas de Cálculo (TypeScript)
  7. Regras de Negócio (TIER, Porto Seguro, Alertas)
  8. Segurança (RLS, AES-256, Audit Logs)
  9. Requisitos Funcionais
  10. APIs e Webhooks
  11. Roadmap Técnico (12 semanas)
  12. Glossário

#### **4.2 Fluxo DEV1: App de Onboarding** ⭐ **NOVO**
- **Arquivo**: `/docs/FLUXO_DEV1_ONBOARDING.md`
- **Linhas**: ~800
- **Conteúdo**: Especificação completa do App de Onboarding de Clientes
- **Responsável**: DEV 1
- **Quando usar**: Implementar sistema de captação de clientes
- **Seções principais**:
  - 7 telas mobile-first (Landing → Sucesso)
  - Integração Stripe Checkout
  - Upload de documentos (Supabase Storage)
  - Assinatura digital (Canvas HTML5)
  - Geração de PDF (PDFKit)
  - Webhook Stripe (processamento pagamento)
  - Cálculo automático de comissões
  - Checklist implementação (4 semanas)

#### **4.3 Migração ASAAS → Stripe** ⭐ **CRÍTICO**
- **Arquivo**: `/docs/MIGRACAO_ASAAS_PARA_STRIPE.md`
- **Linhas**: ~600
- **Conteúdo**: Plano completo de migração sem downtime
- **Responsável**: DEV 2
- **Quando usar**: Substituir gateway de pagamento atual
- **Seções principais**:
  - Arquitetura atual (ASAAS) vs Nova (Stripe)
  - Problemas identificados no código atual
  - Plano de migração em 4 fases (4 semanas)
  - Stripe Connect (split automático de comissões)
  - Edge Function webhook-stripe completa
  - Scripts de migração (contadores + clientes)
  - Rollback plan
  - Monitoramento e alertas

#### **4.4 Fluxo de Comissões**
- **Arquivo**: `/FLUXO_COMISSOES.md`
- **Conteúdo**: Fluxo completo desde pagamento até comissão paga
- **Quando usar**: Implementar webhooks, edge functions, CRON jobs
- **Seções principais**:
  - Processo webhook Stripe
  - Cálculo de comissões (7 tipos)
  - Aprovação admin
  - Pagamento automático

#### **4.5 Fluxo do App (Rascunhos)** ℹ️ **REFERÊNCIA**
- **Arquivo**: `/docs/Fluxo App`
- **Linhas**: 521
- **Conteúdo**: Rascunhos e discussões sobre o fluxo de onboarding
- **Quando usar**: Entender origem das decisões do App de Onboarding
- **Nota**: Documento informal com ideias misturadas (GPT + Claude + Manual)

#### **4.6 Roadmap de Desenvolvimento**
- **Arquivo**: `/DEVELOPMENT_ROADMAP.md`
- **Conteúdo**: Cronograma, prioridades, blockers críticos
- **Quando usar**: Planejamento sprint, tracking progresso
- **Seções principais**:
  - Timeline 12 semanas
  - Blockers críticos
  - Matriz de testes
  - Breakdown de custos

#### **4.7 Overview do Codebase**
- **Arquivo**: `/CODEBASE_OVERVIEW.md`
- **Conteúdo**: Estrutura do código frontend
- **Quando usar**: Onboarding dev, refactoring, code review
- **Seções principais**:
  - Estrutura de diretórios
  - Arquitetura de componentes
  - Padrões de código
  - Hooks customizados
  - Integração Supabase

#### **4.4 ENUMs Críticos**
- **Arquivo**: `/ENUM_CRITICAL_VALUES.md`
- **Conteúdo**: Valores ENUM que NÃO podem mudar (hardcoded em Edge Functions)
- **Quando usar**: Migrations, validações, debugging
- **Atenção**: ⚠️ MODIFICAR ESSES VALORES QUEBRA O SISTEMA

#### **4.5 Relatórios de Erros**
- **Arquivo**: `/RELATORIO_COMPLETO_CLAUDE_SONNET.md`
- **Conteúdo**: Jornada de correção webhook ASAAS
- **Quando usar**: Debugging, entender decisões passadas
- **Seções principais**:
  - Problemas iniciais
  - Erros encontrados
  - Soluções implementadas
  - Lições aprendidas

#### **4.6 Handover Claude Sonnet**
- **Arquivo**: `/HANDOVER_PARA_CLAUDE_SONNET.md`
- **Conteúdo**: Situação atual do projeto, prioridades imediatas
- **Quando usar**: Transfer de contexto, retomar trabalho

---

### **5. CONFIGURAÇÕES**

#### **5.1 Package.json**
- **Arquivo**: `/package.json`
- **Conteúdo**: Dependências, scripts, versões
- **Dependências principais**:
  - React 18, Vite 5
  - Supabase client
  - TanStack Query v5
  - Shadcn/UI (Radix UI + Tailwind)
  - Framer Motion

#### **5.2 Supabase Config**
- **Arquivo**: `/supabase/config.toml`
- **Conteúdo**: Configuração Edge Functions, JWT, CORS
- **Quando usar**: Deploy, troubleshooting

#### **5.3 Regras do Projeto**
- **Arquivo**: `/.cursor/rules/regrasdoprojeto.mdc`
- **Linhas**: 57
- **Conteúdo**: Padrões de código, arquitetura, boas práticas
- **Quando usar**: Code review, novos devs

---

### **6. SCRIPTS & MIGRATIONS**

#### **6.1 Migrations SQL**
- **Diretório**: `/supabase/migrations/`
- **Conteúdo**: Histórico completo do schema do banco
- **Migrations críticas**:
  - `20251103234439_*.sql` - Schema inicial (tabelas, ENUMs, RLS)
  - `20251112000200_*.sql` - RPC `executar_calculo_comissoes` (transacional)
  - `20251119000000_*.sql` - Fix ENUM `tipo_plano` (pro/premium/top)

#### **6.2 Scripts de Teste**
- **Arquivo**: `/supabase/scripts/test-calcular-comissoes.sh`
- **Conteúdo**: Script bash para testar edge function localmente
- **Quando usar**: Desenvolvimento, debugging comissões

---

## 🔍 CONSULTAS RÁPIDAS

### **Encontrar Informação Sobre:**

#### **"Quanto o contador ganha?"**
→ `docs/17 bonificacoes_Regras do programa` (seção "7 tipos de comissão")
→ `FRAMEWORK_LOVABLE_CELITE.md` (seção "Sistema de Comissões")

#### **"Como funciona o Lead Diamante?"**
→ `docs/17 bonificacoes_Regras do programa` (seção "Lead Diamante")
→ `docs/FRAMEWORK_COMPLETO.md` (seção "Lead Diamante: O Reconhecimento Supremo")

#### **"Quais as dores do cliente?"**
→ `docs/AVATAR` (seção "AS 7 DORES EMOCIONAIS")
→ `docs/FRAMEWORK_COMPLETO.md` (Seção 0 - Psicografia)

#### **"Como calcular comissões?"**
→ `FLUXO_COMISSOES.md`
→ `supabase/functions/calcular-comissoes/index.ts`
→ `docs/17 bonificacoes_Regras do programa`

#### **"Quais os valores dos planos?"**
→ `docs/17 bonificacoes_Regras do programa` (Pro R$100, Premium R$130, Top R$180)
→ `docs/Prompt 1`

#### **"Como funciona o Sistema TIER?"**
→ `docs/17 bonificacoes_Regras do programa` (seção "Sistema TIER de Penalidades")
→ `FRAMEWORK_LOVABLE_CELITE.md` (seção "Sistema TIER")

#### **"Quais as métricas de sucesso?"**
→ `FRAMEWORK_LOVABLE_CELITE.md` (seção "Métricas de Sucesso")
→ `docs/FRAMEWORK_COMPLETO.md` (Seção 5 - Lançamento e PDCA)

#### **"Qual a stack técnica?"**
→ `FRAMEWORK_LOVABLE_CELITE.md` (seção "Arquitetura Técnica")
→ `package.json`
→ `CODEBASE_OVERVIEW.md`

#### **"Como fazer onboarding de novo dev?"**
→ `FRAMEWORK_LOVABLE_CELITE.md` (leitura 20 min)
→ `CODEBASE_OVERVIEW.md`
→ `docs/FRAMEWORK_COMPLETO.md` (leitura 2h, opcional)
→ `.cursor/rules/regrasdoprojeto.mdc`

#### **"Como escrever copy que converte?"**
→ `docs/AVATAR` (gatilhos de marketing)
→ `docs/FRAMEWORK_COMPLETO.md` (Seção 0 - Gatilhos de Marketing)
→ Frase chave: **"Meus filhos terão orgulho de mim"**

---

## 📊 TABELA COMPARATIVA DE DOCUMENTOS

| Documento | Linhas | Profundidade | Atualização | Uso Principal |
|-----------|--------|--------------|-------------|---------------|
| **FRAMEWORK_LOVABLE_CELITE.md** | ~500 | ⭐⭐⭐ Médio | Novembro 2025 | Referência diária dev |
| **FRAMEWORK_COMPLETO.md** | 4.372 | ⭐⭐⭐⭐⭐ Máximo | Novembro 2025 | Estratégia, pitch, onboarding |
| **17 bonificacoes_Regras do programa** | 462 | ⭐⭐⭐⭐ Alto | Novembro 2025 | Regras negócio, validação |
| **AVATAR** | 679 | ⭐⭐⭐⭐⭐ Máximo | Novembro 2025 | UX, copy, decisões produto |
| **Prompt 1** | 323 | ⭐⭐ Médio | Novembro 2025 | Contexto inicial |
| **FLUXO_COMISSOES.md** | ~200 | ⭐⭐⭐ Alto | Novembro 2025 | Implementação webhooks |
| **DEVELOPMENT_ROADMAP.md** | ~150 | ⭐⭐ Médio | Novembro 2025 | Planejamento sprint |
| **CODEBASE_OVERVIEW.md** | ~400 | ⭐⭐⭐ Alto | Novembro 2025 | Arquitetura frontend |

---

## 🎯 HIERARQUIA DE CONSULTA (Ordem de Importância)

### **Para Desenvolvedores:**
1. **FRAMEWORK_LOVABLE_CELITE.md** (guia diário)
2. **17 bonificacoes_Regras do programa** (lógica negócio)
3. **CODEBASE_OVERVIEW.md** (arquitetura código)
4. **FLUXO_COMISSOES.md** (webhooks/edge functions)
5. **FRAMEWORK_COMPLETO.md** (contexto completo)

### **Para Designers/UX:**
1. **AVATAR** (persona profunda)
2. **FRAMEWORK_COMPLETO.md** (Seção 0 - Psicografia)
3. **FRAMEWORK_LOVABLE_CELITE.md** (Decisões de UX)
4. **17 bonificacoes_Regras do programa** (features a desenhar)

### **Para Product Owners:**
1. **FRAMEWORK_COMPLETO.md** (visão estratégica completa)
2. **AVATAR** (entender cliente profundamente)
3. **17 bonificacoes_Regras do programa** (regras negócio)
4. **DEVELOPMENT_ROADMAP.md** (timeline)
5. **FRAMEWORK_LOVABLE_CELITE.md** (referência rápida)

### **Para Marketing/Copywriters:**
1. **AVATAR** (dores, anseios, gatilhos)
2. **FRAMEWORK_COMPLETO.md** (Seção 0 - Gatilhos de Marketing)
3. **Prompt 1** (fluxos de conversão)
4. **FRAMEWORK_LOVABLE_CELITE.md** (features a destacar)

### **Para Investidores/Stakeholders:**
1. **FRAMEWORK_COMPLETO.md** (visão completa + métricas)
2. **FRAMEWORK_LOVABLE_CELITE.md** (overview técnico)
3. **AVATAR** (validação de mercado)
4. **DEVELOPMENT_ROADMAP.md** (timeline + custos)

---

## 💡 DICAS DE USO

### **✅ Boas Práticas:**
- Leia **FRAMEWORK_LOVABLE_CELITE.md** primeiro (20 min)
- Consulte **AVATAR** antes de qualquer decisão de UX
- Valide cálculos contra **17 bonificacoes_Regras do programa**
- Use **FRAMEWORK_COMPLETO.md** para contexto profundo quando necessário

### **❌ Evite:**
- Pular a leitura do AVATAR (vai criar UX sem propósito)
- Modificar ENUMs sem consultar **ENUM_CRITICAL_VALUES.md**
- Implementar comissões sem entender **FLUXO_COMISSOES.md**
- Ignorar regras de **17 bonificacoes_Regras do programa** (vai quebrar negócio)

---

## 🔄 ATUALIZAÇÃO DESTA BASE

**Última atualização**: Novembro 2025  
**Responsável**: Claude Sonnet 4.5 (Anthropic)

**Quando atualizar:**
- Novos documentos criados
- Mudanças significativas em regras de negócio
- Refactoring de arquitetura
- Novos requisitos aprovados

**Como atualizar:**
1. Adicionar novo documento na seção apropriada
2. Atualizar tabela comparativa
3. Adicionar "Consultas Rápidas" relevantes
4. Revisar hierarquia de consulta se necessário

---

## 📞 SUPORTE

**Para dúvidas sobre:**
- **Regras de negócio**: Consultar `17 bonificacoes_Regras do programa` primeiro
- **Dores/anseios do cliente**: Consultar `AVATAR`
- **Arquitetura técnica**: Consultar `FRAMEWORK_LOVABLE_CELITE.md`
- **Contexto completo**: Consultar `FRAMEWORK_COMPLETO.md`

**Se a informação não estiver documentada:**
- Registrar dúvida
- Buscar resposta
- **ATUALIZAR ESTA BASE** com a resposta

---

## 💎 PRINCÍPIO FUNDAMENTAL

**Lembre-se sempre:**

Todo o Lovable-Celite existe para entregar **UMA ÚNICA COISA**:

> **"Meus filhos terão orgulho de mim."**

Se uma feature, decisão técnica ou mudança de design **NÃO contribui** para isso, **NÃO deve existir**.

**50% técnico + 50% emocional = 100% transformação**

---

**Fim da Base de Dados para Consulta**

**Autor**: Claude Sonnet 4.5 (Anthropic)  
**Data**: Novembro 2025  
**Versão**: 1.0

