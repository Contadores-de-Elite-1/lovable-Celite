# PRD - Product Requirements Document
## Lovable-Celite: Ecossistema Contadores de Elite — Marketplace + Área de Membros

**Versão**: 5.0  
**Data**: Fevereiro 2026  
**Autor**: Claude Sonnet 4.6 (Anthropic)  
**Status**: ✅ VERSÃO ATIVA — Pronta para Implementação

> 💡 **O que é um PRD?**
> Product Requirements Document = Documento técnico que define EXATAMENTE
> o que o software fará, como funciona e por quê.
> É como a "planta de construção" de um prédio, mas para software.

> 📌 **Histórico de Versões**
> - V4.0 (Nov/2025): Portal de Transparência — 17 Bonificações MLM
> - V5.0 (Fev/2026): Ecossistema completo — Marketplace + Área de Membros com IA

---

## 📑 Índice

1. [Visão Geral V5.0](#1-visão-geral-v50)
   - 1.1 O Que É o Lovable-Celite V5.0?
   - 1.2 Evolução: V4.0 → V5.0
   - 1.3 Os 4 Pilares Técnicos
   - 1.4 Problema → Solução
   - 1.5 Proposta de Valor por Perfil ⭐ **NOVO**
   - 1.6 Diferenciais Competitivos ⭐ **NOVO**
2. [Ecossistema: Os 3 Atores](#2-ecossistema-os-3-atores)
3. [Modelo de Receita da Plataforma](#3-modelo-de-receita-da-plataforma)
4. [Área de Membros com IA](#4-área-de-membros-com-ia) ⭐ **EXPANDIDO**
   - 4.1 Visão Geral
   - 4.2 A IA Personalizada (4 dimensões: perfil, nicho, legislação, maturidade)
   - 4.3 Área de Membros — Contador
   - 4.4 Área de Membros — MPE
   - 4.5 Área de Membros — Coworking
   - 4.6 Jornada por Estágios de Maturidade — Lógica de Ativação ⭐ **NOVO**
   - 4.7 Estrutura de Conteúdo e Acesso
5. [As 17 Bonificações Completas](#5-as-17-bonificações-completas) ⭐ **CRÍTICO**
   - 5.0 As Bonificações como Mecanismo de Gamificação ⭐ **NOVO**
6. [Stack Tecnológica](#6-stack-tecnológica)
7. [Portal de Transparência — Contadores](#7-portal-de-transparência--contadores)
8. [Modelo de Dados](#8-modelo-de-dados)
   - Novas tabelas: `trilhas`, `progresso_trilhas` ⭐ **NOVO**
   - Tabelas atualizadas: `ia_perfis` (nicho, legislação, estágio, diagnósticos), `cursos` (tipo_conteudo, segmentação)
9. [Fórmulas de Cálculo](#9-fórmulas-exatas-de-cálculo)
10. [Regras de Negócio](#10-regras-de-negócio)
11. [Segurança](#11-segurança)
12. [Requisitos Funcionais](#12-requisitos-funcionais)
13. [APIs e Webhooks](#13-apis-e-webhooks)
14. [Roadmap Técnico V5.0](#14-roadmap-técnico-v50)
15. [Glossário](#15-glossário)

---

# 1. Visão Geral V5.0

## 1.1 O Que É o Lovable-Celite V5.0?

**Lovable-Celite V5.0** é uma **plataforma inteligente tripartite** que conecta Contadores, Coworkings e MPEs num ecossistema integrado de indicação, capacitação, automação e crescimento empresarial.

O Contador atua como **agente estratégico de entrada**: indica MPEs, é remunerado por isso e acessa inteligência especializada para fortalecer seu papel consultivo. Cada perfil acessa um ambiente exclusivo com trilhas educacionais, ferramentas e agentes de IA especializados por perfil, nicho, legislação e estágio de maturidade.

A plataforma inova ao **organizar e monetizar um fluxo real de mercado hoje fragmentado** — conectando demanda (MPEs), serviços (Coworkings) e inteligência (Contadores) num único sistema escalável e difícil de replicar. É sustentada por IA e automação que coletam dados, identificam gargalos, riscos e oportunidades, e guiam cada usuário conforme seu estágio de evolução, gerando personalização e impacto econômico real.

**Três produtos integrados**:

1. **Portal de Transparência MLM** — automatiza o cálculo de 17 bonificações com gamificação para Contadores de Elite
2. **Marketplace de Indicações** — conecta Contadores, MPEs e Coworkings com pagamentos automáticos em tempo real
3. **Área de Membros com IA** — jornada empresarial por estágios com trilhas educacionais, diagnósticos, experimentação guiada e agentes de IA personalizados

## 1.2 Evolução: V4.0 → V5.0

| Dimensão | V4.0 | V5.0 |
|----------|------|------|
| **Atores** | Contador + Cliente (MPE) | Contador + MPE + Coworking |
| **Produto** | Portal de Transparência | Portal + Marketplace + Área de Membros |
| **Receita** | Não havia | Taxa 20% (Fluxo 1) + 10% (Fluxo 2) + Conteúdo freemium |
| **IA** | Não havia | IA por perfil, nicho, legislação e estágio de maturidade |
| **Aprendizado** | Não havia | Trilhas educacionais com progressão por estágio |
| **Gamificação** | Não havia (bonif. eram só financeiras) | 17 bonificações como motor de engajamento |
| **Mercado** | Isolado (só contadores) | Ecossistema tripartite escalável |

## 1.3 Os 4 Pilares Técnicos da V5.0

### **Pilar 1: Cálculo Automático de 17 Bonificações + Gamificação** *(herdado e expandido da V4.0)*
Cada webhook de pagamento ativa uma Edge Function que calcula automaticamente todas as 17 bonificações. As bonificações funcionam também como mecanismo de gamificação, incentivando engajamento e progressão dos Contadores na plataforma.

### **Pilar 2: Transparência Total** *(herdado da V4.0)*
Contador vê todas as 17 bonificações, histórico completo e rede MLM em tempo real.

### **Pilar 3: Marketplace com Pagamentos em Tempo Real** *(NOVO na V5.0)*
Contadores indicam MPEs para Coworkings. A MPE paga a mensalidade via Stripe e a plataforma distribui os valores automaticamente — Coworking recebe 90%, Contador recebe comissão conforme bonificações, tudo em tempo real sem ação manual.

### **Pilar 4: Jornada Empresarial por Estágios com IA** *(NOVO na V5.0)*
Cada perfil percorre uma jornada estruturada do estágio inicial à maturidade. A IA identifica gargalos, riscos e oportunidades e ativa automaticamente trilhas educacionais, agentes e conteúdos adequados ao momento do usuário — combinando conteúdos gratuitos, testes práticos, experimentação guiada e progressão para cursos, agentes e mentorias pagos.

## 1.4 Problema → Solução

**O mercado hoje (fragmentado)**:
- Contadores sem canal estruturado para indicar MPEs a Coworkings e ser remunerados por isso
- MPEs sem formalização simplificada, suporte contínuo e ferramentas acessíveis de crescimento
- Coworkings com CAC elevado, baixa ocupação e sem ferramentas de diagnóstico e desenvolvimento
- Demanda, serviços e inteligência existem, mas operam de forma isolada e ineficiente

**Com a plataforma V5.0**:
- Contador se torna agente estratégico central: indica MPEs, ganha comissões automáticas e acessa IA especializada para fortalecer seu papel consultivo — sem ser marginalizado
- MPE acessa formalização simplificada, trilhas educacionais por estágio e agentes de IA adaptados ao seu nicho e maturidade
- Coworking reduz CAC, aumenta ocupação e LTV dos clientes, com diagnósticos, educação prática e automação de IA
- A plataforma monetiza cada transação e gera uma rede escalável e difícil de replicar

## 1.5 Proposta de Valor por Perfil

### Para o **Contador**
```
✅ Renda recorrente garantida pelas 17 bonificações + comissões de indicação
✅ Papel consultivo fortalecido — posicionado como agente central de orientação
✅ IA especializada por nicho contábil e legislação
✅ Trilhas educacionais para evolução profissional contínua
✅ Gamificação com 17 bonificações que incentiva crescimento de carteira
✅ Canal estruturado para indicar MPEs e gerar nova fonte de receita
```

### Para o **Coworking**
```
✅ Redução do CAC — MPEs chegam indicadas por Contadores (parceiros confiáveis)
✅ Aumento de ocupação via fluxo contínuo de indicações rastreáveis
✅ Aumento do LTV — MPEs permanecem mais tempo com suporte da plataforma
✅ Diagnósticos de IA sobre ocupação, conversão e perfil das MPEs
✅ Educação prática e agentes de automação para gestão do espaço
✅ Receita estruturada via mensalidades processadas pela plataforma
```

### Para a **MPE**
```
✅ Formalização simplificada com suporte do Contador responsável
✅ Trilhas educacionais por estágio de maturidade (do nascimento ao crescimento)
✅ IA personalizada por nicho, legislação e momento do negócio
✅ Agentes de automação para reduzir custos operacionais
✅ Capacitações contínuas e mentorias com especialistas
✅ Acesso ao ecossistema empreendedor (Contador + Coworking + plataforma)
```

## 1.6 Diferenciais Competitivos

| Diferencial | Descrição |
|-------------|-----------|
| **Ecossistema tripartite** | Único sistema que une Contadores, MPEs e Coworkings num fluxo integrado |
| **Contador como agente central** | Fortalece (não marginaliza) o papel consultivo do contador |
| **IA por estágio de maturidade** | Conteúdo e diagnósticos ativados conforme evolução real do negócio |
| **Especialização por nicho e legislação** | IA e trilhas adaptadas ao segmento específico de cada usuário |
| **Gamificação com 17 bonificações** | Sistema de recompensas que incentiva engajamento e crescimento |
| **Rede escalável e difícil de replicar** | A integração dos 3 perfis cria um efeito de rede com barreira natural de entrada |
| **Monetização alinhada ao valor gerado** | Plataforma só monetiza quando gera receita real para os parceiros |

---

# 2. Ecossistema: Os 3 Atores

## 2.1 Visão Geral do Ecossistema

```
┌──────────────────────────────────────────────────────────────────────────┐
│                     ECOSSISTEMA LOVABLE-CELITE V5.0                      │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  ┌─────────────────┐      indica MPE       ┌─────────────────┐           │
│  │                 │ ────────────────────► │                 │           │
│  │    CONTADOR     │                       │    COWORKING    │           │
│  │  (motor da      │                       │  (espaço +      │           │
│  │   plataforma)   │                       │   serviços)     │           │
│  └────────┬────────┘                       └────────┬────────┘           │
│           │ indica / serve                          │                    │
│           ▼                                         │                    │
│  ┌─────────────────┐  paga mensalidade (Stripe)     │                    │
│  │                 │ ─────────────────────────────► │                    │
│  │       MPE       │                                │                    │
│  │  (cliente       │                                │                    │
│  │   final)        │                                │                    │
│  └─────────────────┘                                │                    │
│                                                     │                    │
│           PLATAFORMA processa o pagamento automaticamente e em tempo real │
│           ┌──────────────────────────────────────────────────────────┐   │
│           │  MPE paga mensalidade                                    │   │
│           │    → Coworking recebe 90%  (plataforma retém 10%)        │   │
│           │    → Contador recebe comissão conforme regras de         │   │
│           │      bonificação (plataforma retém 20% dessa comissão)   │   │
│           └──────────────────────────────────────────────────────────┘   │
│                                                                           │
│  Todos os 3 perfis acessam a ÁREA DE MEMBROS (gratuita + premium)        │
└──────────────────────────────────────────────────────────────────────────┘
```

## 2.2 O Contador — Usuário Principal (Motor da Plataforma)

**Quem é**: Profissional contábil cadastrado no programa Contadores de Elite.

**Por que é o motor**: É o único ator que gera tráfego bidirecional — serve MPEs contabilmente E as encaminha a Coworkings, gerando receita transacional para a plataforma.

**O que acessa**:

| Área | Funcionalidades |
|------|----------------|
| **Portal de Transparência** | 17 bonificações, rede MLM, dashboard, comissões, simulador, perfil |
| **Área de Membros** | IA personalizada, cursos, automações, mentorias |
| **Marketplace** | Criar indicações de MPEs para Coworkings, rastrear conversões |

**Cadastro**: Gratuito

---

## 2.3 A MPE — Usuária Secundária (Cliente Final)

**Quem é**: Micro ou Pequena Empresa com necessidade de espaço de trabalho e serviços contábeis.

**Como entra na plataforma**: É indicada por um Contador a um Coworking. Recebe acesso à plataforma como benefício.

**O que acessa**:

| Área | Informação / Funcionalidade | Descrição |
|------|-----------------------------|-----------|
| **Pagamento** | Pagar mensalidade do Coworking | Página exclusiva para efetuar o pagamento mensal via Stripe |
| **Área de Membros** | Contador responsável | Quem me indicou, dados de contato |
| **Área de Membros** | Coworking vinculado | Qual coworking está associado |
| **Área de Membros** | Cursos e conteúdos | Gestão, finanças, crescimento empresarial |
| **Área de Membros** | IA personalizada | Guia MPE com base no perfil do negócio |
| **Área de Membros** | Agentes de automação | Ferramentas prontas para o negócio |
| **Área de Membros** | Mentorias | Sessões com especialistas |

**Cadastro**: Gratuito

---

## 2.4 O Coworking — Usuário Secundário (Parceiro de Espaço)

**Quem é**: Espaço de trabalho compartilhado que recebe MPEs indicadas por Contadores.

**Como entra na plataforma**: Cadastro gratuito como parceiro. Só monetiza quando recebe MPEs.

**O que acessa** (somente Área de Membros):

| Informação | Descrição |
|-----------|-----------|
| **MPEs indicadas** | Lista de MPEs encaminhadas, status de cada uma |
| **Contador responsável** | Quem indicou cada MPE |
| **Mensalidades ativas** | Controle de MPEs com mensalidade ativa |
| **Cursos e conteúdos** | Gestão de espaços, captação, retenção |
| **IA personalizada** | Guia Coworking com base no perfil do espaço |
| **Agentes de automação** | Ferramentas de gestão do coworking |
| **Mentorias** | Sessões com especialistas em coworking |

**Cadastro**: Gratuito

---

## 2.5 Matriz de Acesso por Perfil

| Funcionalidade | Contador | MPE | Coworking |
|---------------|----------|-----|-----------|
| Portal de Transparência (17 bonif.) | ✅ | ❌ | ❌ |
| Dashboard MLM / Rede | ✅ | ❌ | ❌ |
| Simulador de Crescimento | ✅ | ❌ | ❌ |
| Criar Indicação (Marketplace) | ✅ | ❌ | ❌ |
| Pagar mensalidade do Coworking | ❌ | ✅ | ❌ |
| Ver indicações recebidas | ❌ | ❌ | ✅ |
| Ver contador responsável | ❌ | ✅ | ✅ |
| Área de Membros — IA personalizada | ✅ | ✅ | ✅ |
| Área de Membros — Cursos | ✅ | ✅ | ✅ |
| Área de Membros — Automações/IA | ✅ | ✅ | ✅ |
| Área de Membros — Mentorias | ✅ | ✅ | ✅ |

---

# 3. Modelo de Receita da Plataforma

## 3.1 Visão Geral: Como a Plataforma é Remunerada

> 💡 **Princípio fundamental**: A plataforma só monetiza quando gera valor real.
> Ela só recebe quando o Contador ganha (Fluxo 1) ou quando o Coworking fatura (Fluxo 2).

```
FONTES DE RECEITA DA PLATAFORMA
├── Fluxo 1: Taxa sobre comissão do Contador (20%)
├── Fluxo 2: Taxa sobre mensalidade do Coworking (10%)
└── Área de Membros: Conteúdo freemium (conteúdos gratuitos + pagos, automações e mentorias)
```

---

## 3.2 Fluxo 1 — Indicação de MPE para Coworking

**Descrição**: Contador indica uma MPE para um Coworking parceiro. Quando a MPE é convertida (contrata espaço), o Contador recebe uma comissão. A plataforma retém 20% sobre o valor pago ao Contador.

**Diagrama do Fluxo**:
```
1. Contador cria indicação no app → MPE é encaminhada ao Coworking
2. Coworking confirma conversão (MPE aceitou contratar o espaço)
3. MPE efetua o pagamento da mensalidade do Coworking pela plataforma (via Stripe)
4. No momento do pagamento, a plataforma processa automaticamente e em tempo real:
   → Retém 20% do valor como taxa de receita da plataforma
   → Credita 80% ao Contador como comissão
5. Contador recebe 80% do valor líquido sem nenhuma ação manual
```

**Exemplo Numérico**:
```
MPE paga R$200 de mensalidade ao Coworking pela plataforma
  Plataforma retém (taxa de indicação 20%): R$40
  Contador recebe automaticamente (80%):    R$160
```

**Regras**:
- A taxa e a comissão são processadas **automaticamente** no momento do pagamento da MPE
- Nenhuma ação manual é necessária pelo Coworking ou pelo Contador
- Rastreamento via `indicacoes_coworking` (status: pendente → convertida → paga)
- A comissão do Fluxo 1 é parte do sistema de bonificações existente (não cria nova bonificação separada)

---

## 3.3 Fluxo 2 — Mensalidade de MPE no Coworking

**Descrição**: MPE indicada por um Contador paga mensalidade ao Coworking pelos serviços. A plataforma retém 10% de cada mensalidade recebida pelo Coworking.

**Diagrama do Fluxo**:
```
1. MPE paga mensalidade ao Coworking (ex: R$500/mês)
2. Coworking registra pagamento na plataforma
3. Plataforma retém 10% automaticamente
4. Coworking recebe 90% líquido
```

**Exemplo Numérico**:
```
MPE paga R$500/mês de mensalidade ao Coworking
  Plataforma retém: R$500 × 10% = R$50/mês
  Coworking recebe: R$500 × 90% = R$450/mês

  Se 10 MPEs ativas pagando R$500 = R$5.000/mês
  Plataforma arrecada: R$500/mês recorrente
```

**Regras**:
- Taxa cobrada apenas enquanto a MPE está ativa no Coworking
- Se MPE cancela, a taxa deixa de ser cobrada automaticamente
- Relatório mensal enviado ao Coworking com detalhamento das taxas

---

## 3.4 Área de Membros — Conteúdo Freemium

**Descrição**: Modelo freemium. Acesso básico gratuito para todos os perfis. Conteúdo premium (cursos pagos, mentorias) gera receita direta.

```
FREEMIUM — GRATUITO para todos
├── IA interativa básica
├── Cursos introdutórios
└── Conteúdo informativo

PREMIUM — Pago individualmente
├── Cursos completos e avançados
├── Sessões de mentoria (1:1)
└── Agentes de automação/IA avançados
```

---

## 3.5 Resumo da Receita

| Fonte | Modelo | Taxa | Frequência |
|-------|--------|------|-----------|
| Fluxo 1 — Indicação | Taxa sobre comissão do Contador | 20% | Por conversão |
| Fluxo 2 — Mensalidade | Taxa sobre receita do Coworking | 10% | Mensal recorrente |
| Curso pago | Venda direta | Preço definido | Por compra |
| Mentoria | Venda direta | Preço definido | Por sessão |

---

# 4. Área de Membros com IA

## 4.1 Visão Geral

A Área de Membros é um ambiente de desenvolvimento profissional e econômico integrado à plataforma principal (mesmo domínio, rotas separadas por perfil). Todos os 3 perfis têm acesso, com experiências completamente distintas.

**Premissa central**: A plataforma estrutura uma **jornada empresarial por estágios — do nascimento à maturidade**. A IA não é apenas um chatbot: é uma guia contínua que acompanha cada usuário, identifica seu estágio atual, detecta gargalos, riscos e oportunidades, e ativa automaticamente os conteúdos, trilhas e agentes adequados ao momento de cada um.

**Modelo de aprendizado**: combina conteúdos gratuitos → testes práticos → experimentação guiada → progressão para cursos completos, agentes avançados e mentorias.

---

## 4.2 A IA Personalizada — Funcionamento

### **Especialização da IA**

A IA é personalizada por **4 dimensões simultâneas**:

| Dimensão | O que determina |
|----------|----------------|
| **Perfil** | Contador, MPE ou Coworking — experiência radicalmente diferente |
| **Nicho** | Segmento de atuação (ex: comércio, serviços, tech, alimentação) |
| **Legislação** | Regime tributário, obrigações específicas (Simples, Lucro Presumido, MEI) |
| **Estágio de maturidade** | Nascente, em desenvolvimento, em crescimento, maduro |

---

### **Coleta de Dados em Dois Momentos**

**Onboarding Inteligente** (cadastro):
```
A IA conduz uma conversa de boas-vindas estruturada:
- Perfil profissional / do negócio e segmento de atuação
- Regime tributário e obrigações legais vigentes
- Estágio de maturidade atual (nascente → maduro)
- Objetivos de curto e médio prazo
- Principais desafios e gargalos percebidos

Resultado: perfil inicial com estágio, nicho e legislação definidos
→ Primeira trilha educacional é ativada automaticamente
```

**Interações Contínuas** (ao longo do uso):
```
A IA aprende e atualiza o perfil com base em:
- Trilhas concluídas e testes práticos realizados
- Perguntas feitas à IA (revelam dúvidas e lacunas)
- Ações realizadas na plataforma (indicações, pagamentos, matrículas)
- Check-ins periódicos ("Como está seu negócio este mês?")
- Sinais de evolução de estágio (ex: MPE formalizada → passa ao próximo estágio)

Resultado: personalização crescente + ativação progressiva de novos conteúdos
```

---

### **Capacidades da IA**

| Capacidade | Descrição |
|-----------|-----------|
| **Identifica gargalos** | Detecta pontos de bloqueio no negócio com base no perfil e histórico |
| **Identifica riscos** | Alerta sobre riscos fiscais, operacionais ou de conformidade |
| **Identifica oportunidades** | Sugere ações com base no estágio e no ecossistema disponível |
| **Diagnóstico completo** | Gera diagnóstico estruturado do negócio/perfil ao final do onboarding |
| **Ativa trilhas por estágio** | Desbloqueia automaticamente conteúdos quando o usuário evolui de estágio |
| **Recomenda próximos passos** | Indica ação concreta e relevante para o momento atual |
| **Guia experimentação** | Propõe testes práticos antes de avançar para conteúdo pago |
| **Agenda mentorias** | Identifica quando mentoria é necessária e facilita o agendamento |
| **Acompanha progresso** | Monitora e celebra avanços do usuário |

### **Tecnologia** *(a definir)*
> API de LLM com suporte a contexto longo. Requisitos mínimos:
> - Histórico persistente de conversas por usuário
> - Integração com perfil, estágio, nicho, legislação e progresso
> - Capacidade de gerar diagnósticos estruturados (JSON + texto)
> - Candidatos: OpenAI GPT-4o, Google Gemini, Anthropic Claude API

---

## 4.3 Área de Membros — Contador

**Rota**: `/membros/contador`

**Contexto da IA para Contadores**:
```
A IA conhece:
- Nível atual (Bronze/Prata/Ouro/Diamante) e histórico de crescimento
- Nicho de atuação contábil (ex: e-commerce, construção, saúde)
- Legislação e regimes dos clientes na carteira
- Bonificações recebidas e metas no simulador
- Indicações de Coworkings feitas e taxa de conversão
- Estágio de maturidade profissional (iniciante → especialista)

A IA usa isso para guiar o Contador rumo a:
- Crescimento de carteira com estratégia por nicho
- Fortalecimento do papel consultivo junto aos clientes MPE
- Domínio de legislação específica do seu segmento
- Ferramentas de automação do escritório contábil
- Nova fonte de renda via indicações de Coworkings
```

**Trilhas educacionais disponíveis** (ativadas por estágio):
```
ESTÁGIO 1 — Iniciante
  └─ Prospecção de clientes MPE
  └─ Como usar o programa de bonificações

ESTÁGIO 2 — Em desenvolvimento
  └─ Gestão de carteira e retenção
  └─ Marketing para contadores
  └─ Legislação avançada por nicho

ESTÁGIO 3 — Avançado
  └─ Automação do escritório contábil
  └─ Como indicar MPEs para Coworkings (receita extra)
  └─ Consultoria empresarial para MPEs
```

**Agentes de automação disponíveis**:
- Templates para onboarding de clientes
- Modelos de proposta comercial
- Alertas de obrigações fiscais por cliente

---

## 4.4 Área de Membros — MPE

**Rota**: `/membros/mpe`

**Contexto da IA para MPEs**:
```
A IA conhece:
- Nicho / segmento do negócio (ex: varejo, serviços, alimentação)
- Regime tributário (MEI, Simples Nacional, Lucro Presumido)
- Estágio de maturidade (nascente, em desenvolvimento, em crescimento, maduro)
- Coworking vinculado e Contador responsável
- Objetivos e desafios declarados no onboarding
- Progresso nas trilhas educacionais

A IA usa isso para guiar a MPE rumo a:
- Formalização simplificada (prioridade para MPEs nascentes)
- Conformidade fiscal e obrigações legais do regime tributário
- Educação financeira e gestão do negócio
- Ferramentas de produtividade e automação por nicho
- Crescimento e acesso ao ecossistema empreendedor
```

**Informações básicas exibidas**:
```
┌─────────────────────────────────────────────────┐
│  Meu Contador: João Silva (CRC/SP 123456)        │
│  📞 (11) 9 9999-0000 | ✉ joao@silva.com.br      │
├─────────────────────────────────────────────────┤
│  Meu Coworking: Space Hub São Paulo              │
│  📍 Av. Paulista, 1000 - São Paulo/SP            │
└─────────────────────────────────────────────────┘
```

**Trilhas educacionais disponíveis** (ativadas por estágio de maturidade):
```
ESTÁGIO 1 — Nascente (formalização)
  └─ Formalização simplificada (MEI, abertura de empresa)
  └─ Obrigações fiscais básicas do regime tributário
  └─ Como funciona o Simples Nacional

ESTÁGIO 2 — Em desenvolvimento (gestão)
  └─ Controle financeiro básico
  └─ Emissão de notas fiscais e DAS
  └─ Gestão de fluxo de caixa

ESTÁGIO 3 — Em crescimento (escala)
  └─ Marketing digital para MPEs
  └─ Gestão de equipe e processos
  └─ Planejamento tributário

ESTÁGIO 4 — Maduro (estratégia)
  └─ Estratégias de expansão
  └─ Captação de crédito e investimento
  └─ Governança e compliance
```

**Agentes de automação disponíveis**:
- Controle de DAS (Simples Nacional) com alertas de vencimento
- Gestão de notas fiscais
- Fluxo de caixa automatizado

---

## 4.5 Área de Membros — Coworking

**Rota**: `/membros/coworking`

**Contexto da IA para Coworkings**:
```
A IA conhece:
- Número de MPEs ativas e taxa de ocupação
- Contadores parceiros e taxa de conversão de indicações
- Receita mensal e LTV médio das MPEs
- Perfil das MPEs (nicho, estágio, tempo de permanência)
- Estágio de maturidade do próprio coworking

A IA usa isso para:
- Gerar diagnósticos de ocupação e conversão
- Identificar gargalos no funil de indicações
- Recomendar ações para reduzir CAC e aumentar LTV
- Sugerir melhorias nos serviços para o perfil das MPEs ativas
- Alertar sobre riscos de churn de MPEs (queda de engajamento)
```

**Informações básicas exibidas**:
```
┌─────────────────────────────────────────────────────┐
│  MPEs Ativas: 12  |  Taxa de Ocupação: 68%           │
│  LTV Médio das MPEs: 8,4 meses                       │
├─────────────────────────────────────────────────────┤
│  Indicações Recebidas este mês: 4                    │
│  • MPE Alfa Ltda — Contador: João Silva — Pendente  │
│  • Beta Comércio ME — Contador: Ana Lima — Ativa    │
│  • Gama Serviços — Contador: Carlos Melo — Ativa    │
│  • Delta Tech ME — Contador: João Silva — Pendente  │
├─────────────────────────────────────────────────────┤
│  Contadores Parceiros: 5                             │
│  • João Silva (3 indicações / conversão: 67%)        │
│  • Ana Lima (2 indicações / conversão: 100%)         │
│  • Carlos Melo (1 indicação / conversão: 100%)       │
└─────────────────────────────────────────────────────┘
```

**Trilhas educacionais disponíveis** (ativadas por estágio):
```
ESTÁGIO 1 — Iniciante
  └─ Fundamentos de gestão de coworking
  └─ Como estruturar contratos com MPEs

ESTÁGIO 2 — Em operação
  └─ Captação e retenção de MPEs
  └─ Comunidade e eventos no coworking

ESTÁGIO 3 — Em crescimento
  └─ Estratégias para aumentar LTV e reduzir CAC
  └─ Expansão e novos modelos de receita
```

**Agentes de automação disponíveis**:
- Controle de contratos de MPEs
- Faturamento e cobranças automatizadas
- Agenda de salas e espaços

---

## 4.6 Jornada por Estágios de Maturidade — Lógica de Ativação

### **Conceito**

A plataforma estrutura a evolução de cada usuário em estágios. Ao avançar de estágio, novos conteúdos, agentes e funcionalidades são **desbloqueados automaticamente** pela IA. O progresso é baseado em:
- Conclusão de trilhas e testes práticos
- Ações concretas realizadas na plataforma
- Diagnósticos periódicos da IA
- Tempo de engajamento ativo

### **Estágios por Perfil**

| Perfil | Estágios |
|--------|---------|
| **Contador** | Iniciante → Em desenvolvimento → Avançado → Especialista |
| **MPE** | Nascente → Em desenvolvimento → Em crescimento → Maduro |
| **Coworking** | Iniciante → Em operação → Em crescimento → Referência |

### **Modelo de Aprendizado por Estágio**

```
Para cada estágio, o usuário percorre:

  1. DIAGNÓSTICO (IA gera diagnóstico do estágio atual)
        ↓
  2. CONTEÚDO GRATUITO (introdução ao tema do estágio)
        ↓
  3. TESTE PRÁTICO (exercício aplicado ao negócio real do usuário)
        ↓
  4. EXPERIMENTAÇÃO GUIADA (IA acompanha implementação de 1 ação)
        ↓
  5. PROGRESSÃO (cursos completos, agentes avançados, mentorias)
        ↓
  6. VALIDAÇÃO (IA avalia se usuário está pronto para próximo estágio)
        ↓
  → PRÓXIMO ESTÁGIO desbloqueado
```

---

## 4.7 Estrutura de Conteúdo e Acesso

### **Tipos de Conteúdo**

| Tipo | Descrição | Acesso |
|------|-----------|--------|
| **Diagnóstico de IA** | Análise do estágio atual com gargalos e oportunidades | Gratuito |
| **Conteúdo introdutório** | Módulos curtos por estágio (≤ 1h) | Gratuito |
| **Teste prático** | Exercício aplicado ao negócio/perfil real | Gratuito |
| **Experimentação guiada** | IA acompanha implementação de uma ação concreta | Gratuito |
| **Trilha completa** | Curso aprofundado por estágio (4-16h) | Pago |
| **Agente de Automação Básico** | Templates e fluxos simples | Gratuito |
| **Agente de Automação Avançado** | Fluxos customizados por nicho | Pago |
| **Mentoria em Grupo** | Sessão ao vivo com especialista | Gratuito |
| **Mentoria Individual (1:1)** | Sessão exclusiva com especialista | Pago |
| **IA Básica** | Diagnósticos e recomendações gerais | Gratuito |
| **IA Avançada** | Análise profunda + planos de ação personalizados | Pago |

### **Limites de IA por Plano**

```
Freemium: 20 interações/mês + 1 diagnóstico/mês
Premium:  Interações ilimitadas + diagnósticos ilimitados
```

---

# 5. As 17 Bonificações Completas

> ⚠️ **Esta seção é herdada integralmente da V4.0 e permanece inalterada.**
> As 17 bonificações continuam sendo o núcleo do programa para Contadores.

## 5.0 As Bonificações como Mecanismo de Gamificação

As 17 bonificações não são apenas remuneração financeira — são o **motor de gamificação** da plataforma para Contadores. Cada bonificação é um incentivo que recompensa comportamentos específicos (indicar, crescer, reter, engajar), criando uma progressão natural de Bronze a Diamante.

```
GAMIFICAÇÃO VIA 17 BONIFICAÇÕES

  Comportamento incentivado        → Bonificação ativada
  ─────────────────────────────────────────────────────
  Indicar 1º cliente               → #1 Bônus 1ª Mensalidade (100%)
  Crescer a carteira               → #2-5 Comissão Recorrente (nível sobe)
  Indicar contadores para a rede   → #11 Bônus Indicação Contador (R$50)
  Atingir marcos de clientes       → #12 Bônus Progressão (R$100 × marco)
  Reter clientes 1 ano             → #14-16 Bônus LTV (15-50% no mês 13)
  Manter nível Diamante            → #17 Bônus Leads + #13 Volume Recorrente
  Construir rede ativa             → #6-10 Override sobre toda a rede (∞)

Resultado: o Contador é incentivado a crescer, reter e engajar continuamente.
```

**Integração com a Área de Membros**: A IA da Área de Membros usa os dados das bonificações para personalizar recomendações — ex: Contador que ganhou #12 (Progressão para Prata) recebe automaticamente a trilha "Gestão de carteira Prata" e sugestão de próximos clientes para alcançar Ouro.

## 5.1 Tabela Resumida (Visão Rápida)

| # | Nome | Base | Valor | Tipo | Frequência |
|---|------|------|-------|------|-----------|
| **1** | Bônus 1ª Mensalidade | 1º pagamento cliente | 100% | Direto | 1x por cliente |
| **2** | Comissão Recorrente Bronze | Mensalidade cliente | 15% | Direto | Mensal (∞) |
| **3** | Comissão Recorrente Prata | Mensalidade cliente | 17,5% | Direto | Mensal (∞) |
| **4** | Comissão Recorrente Ouro | Mensalidade cliente | 20% | Direto | Mensal (∞) |
| **5** | Comissão Recorrente Diamante | Mensalidade cliente | 20% | Direto | Mensal (∞) |
| **6** | Override 1º Pagamento Rede | 1º pagamento da rede | 15-20% | Rede | 1x por cliente rede |
| **7** | Override Recorrente Bronze | Carteira da rede | 3% | Rede | Mensal (∞) |
| **8** | Override Recorrente Prata | Carteira da rede | 4% | Rede | Mensal (∞) |
| **9** | Override Recorrente Ouro | Carteira da rede | 5% | Rede | Mensal (∞) |
| **10** | Override Recorrente Diamante | Carteira da rede | 5% | Rede | Mensal (∞) |
| **11** | Bônus Indicação Contador | Ativação contador | R$ 50 fixo | Rede | 1x por contador |
| **12** | Bônus Progressão | Atingir 5/10/15 clientes | R$ 100 fixo | Desempenho | 1x por marco |
| **13** | Bônus Volume Recorrente | A cada 5 clientes após 15 | R$ 100 fixo | Desempenho | Mensal após Diamante |
| **14** | Bônus LTV Faixa 1 | 5-9 clientes completam 1 ano | 15% do mês 13 | Desempenho | 1x/ano por grupo |
| **15** | Bônus LTV Faixa 2 | 10-14 clientes completam 1 ano | 30% do mês 13 | Desempenho | 1x/ano por grupo |
| **16** | Bônus LTV Faixa 3 | 15+ clientes completam 1 ano | 50% do mês 13 | Desempenho | 1x/ano por grupo |
| **17** | Bônus Diamante Leads | Manutenção Diamante | 1 lead/mês | Desempenho | Mensal enquanto Diamante |

---

## 5.2 PARTE 1: Ganhos Sobre Clientes Diretos (5 Bonificações)

> 💡 **Ganhos Diretos** = Comissões sobre clientes que o contador indicou pessoalmente

### **Bonificação #1: Bônus de 1ª Mensalidade**

**O que é**: Contador recebe 100% do 1º pagamento do cliente que indicou.

**Quando ganha**: Imediatamente após 1º pagamento do cliente.

**Quanto ganha**:
```
Plano Pro (R$100/mês)    → Ganha R$100
Plano Premium (R$130/mês) → Ganha R$130
Plano Top (R$180/mês)    → Ganha R$180
```

**Regra Especial - Pagamento Anual vs Parcelado**:
```
ANUAL (MPE paga 12 parcelas mensais pelo plano anual):
  Parcela 1 (Ativação):
    MPE paga R$130 → Contador recebe 100% = R$130 (Bônus 1ª Mensalidade)

  Parcelas 2 a 12 (Recorrência):
    Cada parcela é calculada conforme o nível atual do Contador:
    → Bronze (15%):   R$130 × 15%   = R$19,50/mês
    → Prata (17,5%):  R$130 × 17,5% = R$22,75/mês
    → Ouro (20%):     R$130 × 20%   = R$26,00/mês
    → Diamante (20%): R$130 × 20%   = R$26,00/mês

PARCELADO (pagamento mensal, sem plano anual):
  Mês 1: MPE paga R$130 → Contador recebe R$130 (ativação, 100%)
  Mês 2+: Comissão recorrente conforme nível (idem acima, vitalícia)
```

**Fórmula Técnica**:
```typescript
const bonusAtivacao = (valorPrimeiroPagamento - incentivosAplicados);
// Exemplo: 130 - 0 = R$130
```

---

### **Bonificações #2-5: Comissões Recorrentes Diretas (por Nível)**

**O que é**: Porcentagem da mensalidade de CADA cliente, **TODO MÊS, PARA SEMPRE** (vitalício).

**Porcentagens por Nível**:
```
🥉 Bronze (1-4 clientes):     15%
🥈 Prata (5-9 clientes):      17,5%
🥇 Ouro (10-14 clientes):     20%
💎 Diamante (15+ clientes):   20%
```

**Regra Crítica - RETROATIVIDADE ao Subir de Nível**:
```
MÊS 1: Você tem 4 clientes (Bronze 15%)
  TOTAL: R$73,50

MÊS 2: Você indica Cliente 5 → Sobe para PRATA (17,5%)
  AGORA: TODOS os 5 clientes ganham 17,5% (retroativo!)
  TOTAL: R$108,50 (cresceu R$35!)
```

**Fórmula Técnica**:
```typescript
function calcularComissaoRecorrente(cliente, contador) {
  const nivelAtual = determinarNivel(contador.clientesAtivos);
  const percentualNivel = {
    'bronze': 0.15, 'prata': 0.175, 'ouro': 0.20, 'diamante': 0.20
  };
  return cliente.mensalidade * percentualNivel[nivelAtual];
}
```

---

## 5.3 PARTE 2: Ganhos Sobre Rede (Override) — 6 Bonificações

> 💡 **Override** = Comissão sobre clientes da REDE (contadores que você indicou)

### **Bonificação #6: Override 1º Pagamento Rede**

**Porcentagem**: Igual ao seu percentual de nível (15% a 20%) sobre o 1º pagamento da rede.

**Fórmula Técnica**:
```typescript
const overrideAtivacao = cliente.primeiroPagamento * meuPercentualNivel;
```

---

### **Bonificações #7-10: Overrides Recorrentes (por Nível)**

**Porcentagens por Nível**:
```
🥉 Bronze: 3% da carteira total da rede
🥈 Prata:  4% da carteira total da rede
🥇 Ouro:   5% da carteira total da rede
💎 Diamante: 5% da carteira total da rede
```

**Fórmula Técnica**:
```typescript
function calcularOverrideRecorrente(rede, contador) {
  const percentualOverride = {
    'bronze': 0.03, 'prata': 0.04, 'ouro': 0.05, 'diamante': 0.05
  };
  const carteiraTotalRede = rede.reduce((sum, c) => sum + (c.clientesAtivos * 130), 0);
  return carteiraTotalRede * percentualOverride[contador.nivel];
}
```

---

### **Bonificação #11: Bônus Indicação de Contador**

**Valor**: R$50 fixo (uma única vez)

**Quando ganha**: Quando o contador indicado traz seu 1º cliente.

---

## 5.4 PARTE 3: Bônus de Desempenho — 6 Bonificações

### **Bonificação #12: Bônus Progressão**

**Marcos**:
```
Atingir 5 clientes (Bronze → Prata):   R$100 (1x na vida)
Atingir 10 clientes (Prata → Ouro):    R$100 (1x na vida)
Atingir 15 clientes (Ouro → Diamante): R$100 (1x na vida)
```

---

### **Bonificação #13: Bônus Volume Recorrente**

**Valor**: R$100 a cada 5 clientes após 15.

```
15 clientes (Diamante):  Não ganha ainda
20 clientes:              R$100 (1º volume)
25 clientes:              R$100 (2º volume)
```

---

### **Bonificações #14-16: Bônus LTV (Retenção no 13º Mês)**

**Porcentagens por Faixa**:
```
5-9 clientes completam 1 ano:   15% da mensalidade total no 13º mês
10-14 clientes completam 1 ano: 30% da mensalidade total no 13º mês
15+ clientes completam 1 ano:   50% da mensalidade total no 13º mês
```

---

### **Bonificação #17: Bônus Diamante Leads**

**O que é**: Contador Diamante recebe 1 lead qualificado por mês.

**Critérios do lead**:
```
✅ CNPJ ativo (validado na Receita Federal)
✅ Fit para os planos (empresa pequena/média)
✅ Intenção de contratar em ≤ 30 dias
✅ Contato verificável (telefone + email válido)
```

**SLA**: Até dia 15 de cada mês via aplicativo.

---

## 5.5 Resumo Visual: As 17 Bonificações

```
┌────────────────────────────────────────────────────────────────┐
│          ⭐ AS 17 BONIFICAÇÕES DO LOVABLE-CELITE ⭐            │
├────────────────────────────────────────────────────────────────┤
│  PARTE 1: GANHOS SOBRE CLIENTES DIRETOS (5)                   │
│  #1  Bônus 1ª Mensalidade                    100%    [1x]     │
│  #2  Comissão Recorrente Bronze              15%     [∞]      │
│  #3  Comissão Recorrente Prata              17,5%    [∞]      │
│  #4  Comissão Recorrente Ouro               20%      [∞]      │
│  #5  Comissão Recorrente Diamante           20%      [∞]      │
│                                                                 │
│  PARTE 2: GANHOS SOBRE REDE/OVERRIDE (6)                      │
│  #6  Override 1º Pagamento Rede            15-20%   [1x]     │
│  #7  Override Recorrente Bronze              3%     [∞]      │
│  #8  Override Recorrente Prata               4%     [∞]      │
│  #9  Override Recorrente Ouro                5%     [∞]      │
│  #10 Override Recorrente Diamante            5%     [∞]      │
│  #11 Bônus Indicação Contador               R$50    [1x]     │
│                                                                 │
│  PARTE 3: BÔNUS DE DESEMPENHO (6)                             │
│  #12 Bônus Progressão (5/10/15)            R$100   [1x c/]   │
│  #13 Bônus Volume Recorrente               R$100   [∞ após]  │
│  #14 Bônus LTV Faixa 1 (5-9 clientes)       15%    [1x/ano]  │
│  #15 Bônus LTV Faixa 2 (10-14 clientes)     30%    [1x/ano]  │
│  #16 Bônus LTV Faixa 3 (15+ clientes)       50%    [1x/ano]  │
│  #17 Bônus Diamante Leads                  1/mês   [∞ D]     │
│                                                                 │
│  [1x]=1 vez | [∞]=Vitalício | [D]=Enquanto Diamante           │
└────────────────────────────────────────────────────────────────┘
```

---

# 6. Stack Tecnológica

## 6.1 Frontend

**Stack**: Vite + React 18 + TypeScript + Shadcn/UI + Tailwind

| Tecnologia | Uso |
|-----------|-----|
| **Vite** | Build tool e dev server |
| **React 18** | Componentes de interface |
| **TypeScript** | Tipagem estática |
| **Shadcn/UI** | Componentes de UI prontos |
| **Tailwind CSS** | Estilos utilitários, mobile-first |
| **React Router** | Roteamento por perfil (/contador, /mpe, /coworking) |
| **TanStack Query** | Cache e sincronização de dados |

---

## 6.2 Backend

**Stack**: Supabase (PostgreSQL + Auth + Edge Functions + RLS)

| Tecnologia | Uso |
|-----------|-----|
| **PostgreSQL** | Banco de dados principal |
| **Supabase Auth** | Autenticação com perfil (contador/mpe/coworking) |
| **Edge Functions** | Cálculo de comissões, webhooks, taxas |
| **RLS** | Isolamento de dados por perfil |
| **Storage** | Arquivos de cursos, materiais |

---

## 6.3 Integrações

| Serviço | Uso | Fluxo |
|---------|-----|-------|
| **Stripe** | Recebe pagamentos (MPEs, mensalidades) | Fluxo 1 e 2 |
| **IA API** *(a definir)* | IA personalizada da Área de Membros | Área de Membros |
| **Firebase** | Push notifications | Todos os perfis |
| **Brevo** | Emails automáticos | Todos os perfis |
| **ReceitaWS** | Validação de CNPJ | Lead Diamante + cadastro MPE |

---

# 7. Portal de Transparência — Contadores

> Esta seção detalha as páginas exclusivas do **Contador** (usuário principal).
> MPEs e Coworkings acessam apenas a Área de Membros (Seção 4).

## 7.1 Páginas do Portal de Transparência

### **Página 1: Dashboard (`/dashboard`)**

**KPIs no Topo**:
```
┌──────────────┬──────────────┬──────────────┬──────────────┐
│ Clientes     │ Comissões    │  Saldo       │   Nível      │
│ Ativos       │ Este Mês     │ Disponível   │              │
│   12         │  R$ 2.450    │  R$ 850      │   🥇 Ouro    │
│  +2 este mês │  +15% vs mês │              │  3 p/ 💎     │
└──────────────┴──────────────┴──────────────┴──────────────┘
```

**Novidade V5.0 — KPI de Marketplace**:
```
┌──────────────┬──────────────┐
│ Indicações   │ MPEs         │
│ Coworking    │ Convertidas  │
│   5 este mês │  3 ativas    │
└──────────────┴──────────────┘
```

**Gráfico de Evolução**: Últimos 6 meses de comissões

**Barra de Progresso**: Para próximo nível (ex: 80% para Diamante)

**Feed de Notificações**: Últimas 5 ações importantes

---

### **Página 2: Comissões (`/comissoes`)**

**Filtros**: Competência, Tipo de bonificação, Status, Cliente

**Tabela Detalhada**:
```
Data | Cliente | Tipo Bonificação | Valor | Status | Ações
```

**Totalizadores**:
- Total Este Mês
- Total Disponível (só aprovadas)
- Botão: Solicitar Saque (mínimo R$100)

---

### **Página 3: Rede MLM (`/rede`)**

**Visualização em Árvore**: Até 5 níveis de indicações

**Cards por Nó**: Nome, nível, clientes, ganhos

---

### **Página 4: Simulador (`/simulador`)**

**Inputs**: Clientes/mês, rede esperada, ticket médio

**Output**: Projeção 12 meses (conservador/moderado/otimista)

---

### **Página 5: Marketplace — Indicações (`/indicacoes`)**

**Funcionalidade NOVA na V5.0**:

```
┌─────────────────────────────────────────────────────┐
│  NOVA INDICAÇÃO                                      │
│  MPE: _________________ (buscar por CNPJ ou nome)   │
│  Coworking: ____________ (selecionar parceiro)       │
│  Mensagem: _____________ (opcional)                  │
│  [Criar Indicação]                                   │
├─────────────────────────────────────────────────────┤
│  MINHAS INDICAÇÕES                                   │
│  Data | MPE | Coworking | Status | Comissão          │
│  01/02 | Alfa Ltda | Space Hub | Convertida | R$160  │
│  15/02 | Beta ME  | Work+  | Pendente   | —          │
└─────────────────────────────────────────────────────┘
```

**Status de Indicação**: `pendente` → `em_negociação` → `convertida` → `paga` | `recusada`

---

### **Página 6: Perfil (`/perfil`)**

**Dados Pessoais**: Nome, email, telefone, CRC

**Dados Bancários**: PIX, agência, conta (criptografados)

**Histórico de Saques**: Últimos 12 meses

---

## 7.2 Página Exclusiva da MPE — Pagamento de Mensalidade (`/mpe/pagamento`)

> ⚠️ **Funcionalidade exclusiva da MPE.** Contadores e Coworkings não têm acesso a esta página.

**Descrição**: Página onde a MPE efetua o pagamento mensal ao Coworking pela plataforma via Stripe. No momento do pagamento, a plataforma processa automaticamente e em tempo real a distribuição dos valores.

**Layout da Página**:
```
┌──────────────────────────────────────────────────────┐
│  PAGAMENTO DA MENSALIDADE                             │
├──────────────────────────────────────────────────────┤
│  Coworking:   Space Hub São Paulo                     │
│  Plano:       Estação Flexível — R$ 500,00/mês        │
│  Vencimento:  Todo dia 10                             │
│  Status:      ⚠️ Pendente (vence em 3 dias)           │
├──────────────────────────────────────────────────────┤
│  [Pagar agora via Stripe]                             │
├──────────────────────────────────────────────────────┤
│  HISTÓRICO DE PAGAMENTOS                              │
│  Mês     | Valor    | Status    | Data pagamento      │
│  Jan/26  | R$500,00 | ✅ Pago   | 08/01/2026          │
│  Fev/26  | R$500,00 | ✅ Pago   | 07/02/2026          │
│  Mar/26  | R$500,00 | ⚠️ Pendente | —                 │
└──────────────────────────────────────────────────────┘
```

**O que acontece no momento do pagamento (automático e em tempo real)**:
```
MPE confirma pagamento de R$500,00
  → Plataforma retém 10% (R$50,00) — taxa Fluxo 2
  → Coworking recebe 90% (R$450,00) — crédito automático
  → Contador responsável recebe comissão conforme nível de bonificação
     (plataforma retém 20% dessa comissão)
  → Webhook Stripe dispara Edge Function em < 2s
  → Saldos atualizados em tempo real no dashboard de cada parte
```

---

# 8. Modelo de Dados

## 8.1 Tabelas Existentes (V4.0 — mantidas)

### **Tabela: `contadores`**
```sql
CREATE TABLE contadores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id),
  nome_completo VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  telefone VARCHAR(20) NOT NULL,
  crc VARCHAR(20),
  nivel VARCHAR(20) NOT NULL DEFAULT 'bronze',
  clientes_ativos INTEGER DEFAULT 0,
  contador_pai_id UUID REFERENCES contadores(id),
  xp INTEGER DEFAULT 0,
  tier_atual VARCHAR(20) DEFAULT 'tier_1',
  data_entrada TIMESTAMPTZ DEFAULT NOW(),
  ativo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### **Tabela: `clientes`** *(MPEs vinculadas a contadores via plano)*
```sql
CREATE TABLE clientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contador_id UUID NOT NULL REFERENCES contadores(id),
  stripe_customer_id VARCHAR(255) UNIQUE NOT NULL,
  nome_empresa VARCHAR(255) NOT NULL,
  cnpj VARCHAR(20) NOT NULL,
  plano VARCHAR(20) NOT NULL,
  status VARCHAR(20) DEFAULT 'ativo',
  data_ativacao DATE NOT NULL,
  ativo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### **Tabela: `comissoes`** *(CRÍTICA)*
```sql
CREATE TABLE comissoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contador_id UUID NOT NULL REFERENCES contadores(id),
  cliente_id UUID REFERENCES clientes(id),
  contador_rede_id UUID REFERENCES contadores(id),
  tipo_bonificacao VARCHAR(50) NOT NULL,
  base_calculo DECIMAL(12, 2) NOT NULL,
  percentual_aplicado DECIMAL(5, 2),
  valor DECIMAL(12, 2) NOT NULL,
  status VARCHAR(20) DEFAULT 'calculada',
  competencia DATE NOT NULL,
  data_pagamento TIMESTAMPTZ,
  stripe_payment_id VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### **Tabela: `rede_contadores`**
```sql
CREATE TABLE rede_contadores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contador_pai_id UUID NOT NULL REFERENCES contadores(id),
  contador_filho_id UUID NOT NULL REFERENCES contadores(id),
  nivel_profundidade INTEGER NOT NULL,
  data_entrada TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 8.2 Novas Tabelas — V5.0

### **Tabela: `mpes`** *(perfil completo da MPE)*
```sql
CREATE TABLE mpes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id),
  nome_empresa VARCHAR(255) NOT NULL,
  cnpj VARCHAR(20) UNIQUE NOT NULL,
  segmento VARCHAR(100),
  porte VARCHAR(20) DEFAULT 'micro', -- micro, pequena
  telefone VARCHAR(20),
  email_comercial VARCHAR(255),
  cidade VARCHAR(100),
  estado VARCHAR(2),
  -- Vínculos no ecossistema
  contador_responsavel_id UUID REFERENCES contadores(id),
  coworking_ativo_id UUID REFERENCES coworkings(id),
  -- Área de Membros
  onboarding_concluido BOOLEAN DEFAULT FALSE,
  ia_perfil_id UUID REFERENCES ia_perfis(id),
  -- Metadados
  ativo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### **Tabela: `coworkings`**
```sql
CREATE TABLE coworkings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id),
  nome_fantasia VARCHAR(255) NOT NULL,
  razao_social VARCHAR(255),
  cnpj VARCHAR(20) UNIQUE NOT NULL,
  telefone VARCHAR(20),
  email_comercial VARCHAR(255),
  endereco_completo TEXT,
  cidade VARCHAR(100) NOT NULL,
  estado VARCHAR(2) NOT NULL,
  capacidade_mpes INTEGER,
  -- Área de Membros
  onboarding_concluido BOOLEAN DEFAULT FALSE,
  ia_perfil_id UUID REFERENCES ia_perfis(id),
  -- Metadados
  ativo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### **Tabela: `indicacoes_coworking`** *(Fluxo 1 — Marketplace)*
```sql
CREATE TABLE indicacoes_coworking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contador_id UUID NOT NULL REFERENCES contadores(id),
  mpe_id UUID NOT NULL REFERENCES mpes(id),
  coworking_id UUID NOT NULL REFERENCES coworkings(id),
  -- Status do funil
  status VARCHAR(30) NOT NULL DEFAULT 'pendente',
  -- pendente | em_negociacao | convertida | paga | recusada
  data_indicacao TIMESTAMPTZ DEFAULT NOW(),
  data_conversao TIMESTAMPTZ,
  data_pagamento TIMESTAMPTZ,
  -- Financeiro (Fluxo 1)
  valor_comissao_bruta DECIMAL(12, 2),       -- Valor definido pelo coworking
  taxa_plataforma_pct DECIMAL(5, 2) DEFAULT 20.00,
  taxa_plataforma_valor DECIMAL(12, 2),       -- 20% do valor bruto
  valor_contador_liquido DECIMAL(12, 2),      -- 80% do valor bruto
  -- Observações
  mensagem_contador TEXT,
  motivo_recusa TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### **Tabela: `mensalidades_coworking`** *(Fluxo 2 — Recorrência)*
```sql
CREATE TABLE mensalidades_coworking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mpe_id UUID NOT NULL REFERENCES mpes(id),
  coworking_id UUID NOT NULL REFERENCES coworkings(id),
  contador_id UUID REFERENCES contadores(id), -- Quem originou a indicação
  -- Financeiro (Fluxo 2)
  valor_mensalidade DECIMAL(12, 2) NOT NULL,
  taxa_plataforma_pct DECIMAL(5, 2) DEFAULT 10.00,
  taxa_plataforma_valor DECIMAL(12, 2),       -- 10% do valor
  valor_coworking_liquido DECIMAL(12, 2),     -- 90% do valor
  -- Competência
  competencia DATE NOT NULL,                  -- YYYY-MM-01
  status VARCHAR(20) DEFAULT 'pendente',      -- pendente | paga | atrasada
  data_pagamento TIMESTAMPTZ,
  stripe_payment_id VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### **Tabela: `ia_perfis`** *(dados coletados pela IA por usuário)*
```sql
CREATE TABLE ia_perfis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id),
  tipo_perfil VARCHAR(20) NOT NULL, -- contador | mpe | coworking
  -- Especialização da IA (4 dimensões)
  nicho VARCHAR(100),               -- ex: 'comercio_varejista', 'servicos_saude'
  legislacao_regime VARCHAR(50),    -- ex: 'simples_nacional', 'lucro_presumido', 'mei'
  estagio_maturidade VARCHAR(30),   -- contador: iniciante|em_desenvolvimento|avancado|especialista
                                    -- mpe: nascente|em_desenvolvimento|em_crescimento|maduro
                                    -- coworking: iniciante|em_operacao|em_crescimento|referencia
  -- Dados coletados no onboarding e interações contínuas
  dados_onboarding JSONB DEFAULT '{}',
  objetivos JSONB DEFAULT '[]',
  desafios JSONB DEFAULT '[]',
  gargalos_identificados JSONB DEFAULT '[]',  -- identificados pela IA
  riscos_identificados JSONB DEFAULT '[]',    -- identificados pela IA
  oportunidades_identificadas JSONB DEFAULT '[]', -- identificadas pela IA
  -- Diagnóstico gerado pela IA
  ultimo_diagnostico JSONB DEFAULT '{}',
  data_ultimo_diagnostico TIMESTAMPTZ,
  -- Progressão na jornada
  trilha_ativa_id UUID REFERENCES trilhas(id),
  estagio_anterior VARCHAR(30),              -- para rastrear evolução
  data_avanco_estagio TIMESTAMPTZ,           -- quando subiu de estágio
  -- Recomendações ativas
  ultima_interacao_ia TIMESTAMPTZ,
  -- Metadados
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### **Tabela: `trilhas`** *(trilhas educacionais por perfil + estágio)*
```sql
CREATE TABLE trilhas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo VARCHAR(255) NOT NULL,
  descricao TEXT,
  -- Segmentação (define quando a trilha é ativada)
  perfil_alvo VARCHAR(20) NOT NULL,    -- contador | mpe | coworking
  estagio_maturidade VARCHAR(30) NOT NULL, -- ex: 'nascente', 'em_desenvolvimento'
  nicho VARCHAR(100),                  -- NULL = vale para todos os nichos
  legislacao_regime VARCHAR(50),       -- NULL = vale para todos os regimes
  -- Sequência dentro do estágio (1 = primeiro a ser desbloqueado)
  ordem_no_estagio INTEGER DEFAULT 1,
  -- Tipo de ativação
  ativacao VARCHAR(30) DEFAULT 'automatica', -- automatica | manual | por_conclusao
  -- Conteúdo da trilha
  tipo_acesso VARCHAR(20) DEFAULT 'gratuito', -- gratuito | pago
  preco DECIMAL(12, 2),
  -- Metadados
  publicado BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### **Tabela: `cursos`** *(conteúdos individuais dentro de trilhas)*
```sql
CREATE TABLE cursos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trilha_id UUID REFERENCES trilhas(id), -- NULL = curso avulso
  titulo VARCHAR(255) NOT NULL,
  descricao TEXT,
  -- Segmentação
  perfil_alvo VARCHAR(20)[],           -- {contador, mpe, coworking}
  estagio_maturidade VARCHAR(30),      -- estágio para o qual o curso é relevante
  nicho VARCHAR(100),                  -- NULL = genérico
  legislacao_regime VARCHAR(50),       -- NULL = genérico
  -- Tipo de conteúdo
  tipo_conteudo VARCHAR(30) DEFAULT 'curso', -- curso | teste_pratico | experimentacao_guiada | diagnostico
  nivel_curso VARCHAR(20) DEFAULT 'iniciante',
  tipo_acesso VARCHAR(20) DEFAULT 'gratuito',
  preco DECIMAL(12, 2),
  duracao_horas DECIMAL(5, 1),
  thumbnail_url TEXT,
  -- Conteúdo
  modulos JSONB DEFAULT '[]',
  -- Metadados
  publicado BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### **Tabela: `progresso_trilhas`** *(progresso do usuário em cada trilha)*
```sql
CREATE TABLE progresso_trilhas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  trilha_id UUID NOT NULL REFERENCES trilhas(id),
  -- Status
  status VARCHAR(20) DEFAULT 'ativa', -- ativa | concluida | pausada
  progresso_pct INTEGER DEFAULT 0,
  data_inicio TIMESTAMPTZ DEFAULT NOW(),
  data_conclusao TIMESTAMPTZ,
  -- Validação de estágio
  validado_para_proximo_estagio BOOLEAN DEFAULT FALSE,
  data_validacao TIMESTAMPTZ,
  -- Metadados
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, trilha_id)
);
```

### **Tabela: `matriculas`**
```sql
CREATE TABLE matriculas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  curso_id UUID NOT NULL REFERENCES cursos(id),
  tipo_acesso VARCHAR(20) NOT NULL, -- gratuito | pago
  -- Progresso
  progresso_pct INTEGER DEFAULT 0, -- 0 a 100
  ultimo_modulo_acessado INTEGER DEFAULT 0,
  concluido BOOLEAN DEFAULT FALSE,
  data_conclusao TIMESTAMPTZ,
  -- Pagamento (se pago)
  stripe_payment_id VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, curso_id)
);
```

### **Tabela: `mentorias`**
```sql
CREATE TABLE mentorias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo VARCHAR(255) NOT NULL,
  descricao TEXT,
  perfil_alvo VARCHAR(20)[], -- {contador, mpe, coworking}
  tipo VARCHAR(20) NOT NULL, -- grupo | individual
  tipo_acesso VARCHAR(20) DEFAULT 'gratuito',
  preco DECIMAL(12, 2),
  data_hora TIMESTAMPTZ,
  duracao_minutos INTEGER DEFAULT 60,
  link_sessao TEXT,
  vagas_totais INTEGER,
  vagas_disponiveis INTEGER,
  -- Metadados
  publicado BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### **Tabela: `ia_interacoes`** *(histórico de conversas com a IA)*
```sql
CREATE TABLE ia_interacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  ia_perfil_id UUID NOT NULL REFERENCES ia_perfis(id),
  tipo VARCHAR(30) NOT NULL, -- onboarding | recomendacao | checkin | pergunta_livre
  mensagem_usuario TEXT,
  resposta_ia TEXT,
  contexto_usado JSONB DEFAULT '{}',
  -- Resultado da interação
  acao_gerada VARCHAR(100), -- ex: 'matricula_sugerida', 'mentoria_agendada'
  acao_aceita BOOLEAN,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### **Tabela: `transacoes_plataforma`** *(receita da plataforma)*
```sql
CREATE TABLE transacoes_plataforma (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo VARCHAR(30) NOT NULL, -- taxa_indicacao | taxa_mensalidade | venda_curso | venda_mentoria
  -- Origem
  indicacao_id UUID REFERENCES indicacoes_coworking(id),
  mensalidade_id UUID REFERENCES mensalidades_coworking(id),
  matricula_id UUID REFERENCES matriculas(id),
  -- Valores
  valor_bruto DECIMAL(12, 2) NOT NULL,
  taxa_pct DECIMAL(5, 2),
  valor_plataforma DECIMAL(12, 2) NOT NULL,
  -- Metadados
  competencia DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 8.3 Políticas RLS para Novos Perfis

```sql
-- MPE vê apenas seus próprios dados
CREATE POLICY "mpe_ve_seus_dados"
ON mpes FOR SELECT
USING (user_id = auth.uid());

-- Coworking vê indicações recebidas
CREATE POLICY "coworking_ve_indicacoes_recebidas"
ON indicacoes_coworking FOR SELECT
USING (coworking_id = (SELECT id FROM coworkings WHERE user_id = auth.uid()));

-- Coworking vê mensalidades das suas MPEs
CREATE POLICY "coworking_ve_suas_mensalidades"
ON mensalidades_coworking FOR SELECT
USING (coworking_id = (SELECT id FROM coworkings WHERE user_id = auth.uid()));

-- Usuário vê apenas seu próprio perfil de IA
CREATE POLICY "usuario_ve_seu_perfil_ia"
ON ia_perfis FOR ALL
USING (user_id = auth.uid());

-- Usuário vê apenas suas próprias matrículas
CREATE POLICY "usuario_ve_suas_matriculas"
ON matriculas FOR SELECT
USING (user_id = auth.uid());
```

---

# 9. Fórmulas Exatas de Cálculo

## 9.1 Edge Function: `calcular-comissoes` *(herdada da V4.0)*

**Acionada por**: Webhook Stripe (`invoice.payment_succeeded`)

**Processa**: Calcula as 17 bonificações para 1 pagamento

```typescript
export async function calcularComissoes(stripe_payment_id: string) {
  const pagamento = await supabase
    .from('pagamentos')
    .select('*, clientes(*, contadores(*))')
    .eq('stripe_payment_id', stripe_payment_id)
    .single();

  const contador = pagamento.clientes.contadores;
  const valor = pagamento.valor;
  const bonificacoes = [];

  // #1: Bônus Ativação (só 1ª vez)
  if (pagamento.eh_primeiro_pagamento) {
    bonificacoes.push({ tipo: 'ativacao', valor, descricao: 'Bônus 1ª Mensalidade' });
  }

  // #2-5: Comissão Recorrente
  const percentualNivel = { bronze: 0.15, prata: 0.175, ouro: 0.20, diamante: 0.20 };
  const percentual = percentualNivel[contador.nivel];
  bonificacoes.push({
    tipo: `comissao_recorrente_${contador.nivel}`,
    percentual,
    valor: valor * percentual,
  });

  // #6-10: Override Rede
  const pais = await supabase
    .from('rede_contadores')
    .select('contador_pai_id, contadores!inner(*)')
    .eq('contador_filho_id', contador.id);

  for (const link of pais.data) {
    const percentualOverride = { bronze: 0.03, prata: 0.04, ouro: 0.05, diamante: 0.05 };
    bonificacoes.push({
      tipo: `override_${link.contadores.nivel}`,
      contador_id: link.contador_pai_id,
      valor: valor * percentualOverride[link.contadores.nivel],
    });
  }

  await supabase.rpc('executar_calculo_comissoes', {
    contador_id: contador.id,
    bonificacoes_array: bonificacoes,
    competencia: pagamento.competencia
  });
}
```

---

## 9.2 Edge Function: `processar-taxa-indicacao` *(NOVA V5.0)*

**Acionada por**: Coworking confirma conversão de indicação

```typescript
export async function processarTaxaIndicacao(indicacao_id: string) {
  const indicacao = await supabase
    .from('indicacoes_coworking')
    .select('*, contadores(*), mpes(*), coworkings(*)')
    .eq('id', indicacao_id)
    .single();

  const valorBruto = indicacao.valor_comissao_bruta;
  const taxaPlataforma = valorBruto * 0.20; // 20%
  const valorLiquido = valorBruto * 0.80;   // 80%

  // Atualiza indicação com valores calculados
  await supabase.from('indicacoes_coworking').update({
    taxa_plataforma_valor: taxaPlataforma,
    valor_contador_liquido: valorLiquido,
    status: 'convertida'
  }).eq('id', indicacao_id);

  // Registra receita da plataforma
  await supabase.from('transacoes_plataforma').insert({
    tipo: 'taxa_indicacao',
    indicacao_id: indicacao_id,
    valor_bruto: valorBruto,
    taxa_pct: 20.00,
    valor_plataforma: taxaPlataforma,
    competencia: new Date().toISOString().substring(0, 7) + '-01'
  });

  // Cria comissão para o contador
  await supabase.from('comissoes').insert({
    contador_id: indicacao.contador_id,
    tipo_bonificacao: 'indicacao_coworking',
    base_calculo: valorBruto,
    percentual_aplicado: 80.00,
    valor: valorLiquido,
    status: 'aprovada',
    competencia: new Date().toISOString().substring(0, 7) + '-01'
  });
}
```

---

## 9.3 Edge Function: `processar-taxa-mensalidade` *(NOVA V5.0)*

**Acionada por**: Webhook Stripe — pagamento de mensalidade de MPE no Coworking (`invoice.payment_succeeded`)

```typescript
export async function processarTaxaMensalidade(stripe_payment_id: string) {
  const pagamento = await supabase
    .from('mensalidades_coworking')
    .select('*')
    .eq('stripe_payment_id', stripe_payment_id)
    .single();

  const valorBruto = pagamento.valor_mensalidade;
  const taxaPlataforma = valorBruto * 0.10; // 10%
  const valorLiquido = valorBruto * 0.90;   // 90%

  await supabase.from('mensalidades_coworking').update({
    taxa_plataforma_valor: taxaPlataforma,
    valor_coworking_liquido: valorLiquido,
    status: 'paga',
    data_pagamento: new Date().toISOString()
  }).eq('id', pagamento.id);

  await supabase.from('transacoes_plataforma').insert({
    tipo: 'taxa_mensalidade',
    mensalidade_id: pagamento.id,
    valor_bruto: valorBruto,
    taxa_pct: 10.00,
    valor_plataforma: taxaPlataforma,
    competencia: pagamento.competencia
  });
}
```

---

# 10. Regras de Negócio

## 10.1 Sistema TIER de Performance *(herdado da V4.0)*

### **TIER 1: Performance Mínima (Mantém 100% da Comissão)**

**OPÇÃO A — Foco Comercial:**
```
4+ indicações diretas por ano (≥ 1 por trimestre)
```

**OPÇÃO B — Foco Qualidade + Comunidade:**
```
✅ 2-3 indicações/ano (mínimo) E
✅ Retenção ≥ 85% na carteira ativa E
✅ Participação ≥ 70% dos treinamentos/eventos
```

### **Escala de Penalidades**

| Inatividade | Comissão | Ação |
|-------------|----------|------|
| ANO 1 | Reduz para 7% | Alertas + janela de reativação |
| ANO 2 | Reduz para 3% | Última chance |
| ANO 3 | Reduz para 0% | Carteira liberada |

---

## 10.2 Porto Seguro *(herdado da V4.0)*

| Nível | Requisitos | Benefício |
|-------|-----------|-----------|
| **ELITE** | 30+ clientes, retenção ≥ 90%, 2+ anos, 8+ indicações/ano | Pausa de 12 meses, mantém 8% |
| **SEMI-ELITE** | 20-29 clientes, retenção ≥ 85%, 2+ anos, 6+ indicações/ano | Pausa de 6 meses (1x na carreira), mantém 4% |

---

## 10.3 Regras do Marketplace (NOVO V5.0)

### **Indicação de MPE para Coworking**

**Regras de criação de indicação**:
```
✅ Contador deve ter cadastro ativo
✅ MPE deve ter CNPJ válido (validado via ReceitaWS)
✅ Coworking deve estar ativo na plataforma
✅ Não pode haver indicação ativa para a mesma MPE+Coworking
```

**SLA de resposta do Coworking**:
```
Coworking tem 15 dias para responder (converter ou recusar)
Se não responder: status muda para "sem_resposta", Contador é notificado
```

**Proteção de indicação**:
```
Se Contador A indica MPE X para Coworking Z:
  - Durante 12 meses, se MPE X contratar com Coworking Z por qualquer canal,
    a comissão pertence ao Contador A (rastreamento pelo CNPJ da MPE)
```

---

## 10.4 Regras da Área de Membros (NOVO V5.0)

### **Acesso Freemium**

```
Conteúdo gratuito: disponível imediatamente após cadastro
Conteúdo pago: liberado após confirmação de pagamento via Stripe
Progresso: salvo automaticamente, retoma de onde parou
```

### **IA — Limites por Tier**

```
Freemium: 20 interações/mês com a IA
Premium:  Interações ilimitadas
```

---

# 11. Segurança

## 11.1 Autenticação com Perfil Múltiplo

Na V5.0, o Supabase Auth precisa suportar 3 tipos de perfil. A role é definida na tabela `user_roles`:

```sql
CREATE TABLE user_roles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id),
  role VARCHAR(20) NOT NULL -- contador | mpe | coworking | admin
);

-- Trigger: ao criar usuário, define role com base no fluxo de cadastro
CREATE OR REPLACE FUNCTION definir_role_usuario()
RETURNS TRIGGER AS $$
BEGIN
  -- Role é passada como metadado no cadastro (raw_user_meta_data)
  INSERT INTO user_roles (user_id, role)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'role');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

---

## 11.2 Row Level Security (RLS)

```sql
-- Contador vê apenas suas comissões
CREATE POLICY "contador_ve_suas_comissoes"
ON comissoes FOR SELECT
USING (contador_id = (SELECT id FROM contadores WHERE user_id = auth.uid()));

-- Coworking vê apenas suas indicações recebidas e mensalidades
CREATE POLICY "coworking_ve_indicacoes"
ON indicacoes_coworking FOR SELECT
USING (coworking_id = (SELECT id FROM coworkings WHERE user_id = auth.uid()));
```

---

## 11.3 Criptografia de Dados Sensíveis

```
Dados bancários (PIX, conta): AES-256
CNPJs: armazenados em texto (necessário para validação)
Dados de IA (perfil usuário): JSONB criptografado em repouso
```

---

## 11.4 Auditoria Completa

```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  role VARCHAR(20) NOT NULL,
  acao VARCHAR(100) NOT NULL,
  entidade_tipo VARCHAR(50) NOT NULL,
  entidade_id UUID NOT NULL,
  detalhes JSONB,
  ip_address INET,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Ações registradas**:
```
✅ Criação de indicação (marketplace)
✅ Confirmação de conversão (coworking)
✅ Cálculo de taxa da plataforma
✅ Aprovação/pagamento de comissão
✅ Interação com IA (resumo)
✅ Compra de curso ou mentoria
```

---

# 12. Requisitos Funcionais

## 12.1 Requisitos Críticos — FASE 1 (MUST — Implementar primeiro)

> 🎯 **Foco da Fase 1**: Indicações, cálculo de comissões e pagamentos automáticos em tempo real.

| ID | Requisito | Perfil | Prioridade |
|----|-----------|--------|-----------|
| RF001 | Webhook Stripe processa pagamento da MPE e distribui valores automaticamente em tempo real | Sistema | CRÍTICO |
| RF002 | Taxa 10% retida da mensalidade do Coworking calculada automaticamente | Sistema | CRÍTICO |
| RF003 | Comissão do Contador calculada automaticamente (com 20% de taxa da plataforma) conforme regras de bonificação | Sistema | CRÍTICO |
| RF004 | 17 bonificações calculadas em < 2s via webhook Stripe | Contador | CRÍTICO |
| RF005 | Contador cria indicação de MPE para Coworking | Contador | CRÍTICO |
| RF006 | Coworking confirma/recusa indicação recebida | Coworking | CRÍTICO |
| RF007 | MPE efetua pagamento da mensalidade ao Coworking pela plataforma (via Stripe) | MPE | CRÍTICO |
| RF008 | Dashboard do Contador exibe KPIs de comissões e indicações em tempo real | Contador | CRÍTICO |
| RF009 | Coworking visualiza indicações recebidas e status de cada MPE | Coworking | CRÍTICO |
| RF010 | MPE visualiza contador responsável e coworking vinculado | MPE | CRÍTICO |
| RF011 | RLS garante isolamento de dados por perfil | Todos | CRÍTICO |
| RF012 | Cadastro gratuito para todos os 3 perfis (com seleção de role) | Todos | CRÍTICO |

---

## 12.2 Requisitos Importantes — FASE 2 (SHOULD)

| ID | Requisito | Perfil | Prioridade |
|----|-----------|--------|-----------|
| RF100 | Push notifications para conversões de indicação | Contador | IMPORTANTE |
| RF101 | Email automático ao Coworking com dados da indicação | Coworking | IMPORTANTE |
| RF102 | Simulador de crescimento 12 meses | Contador | IMPORTANTE |
| RF103 | Rastreamento de lead Diamante com CNPJ | Contador | IMPORTANTE |
| RF104 | Relatório mensal de taxas para Coworkings | Coworking | IMPORTANTE |
| RF105 | Dashboard de receita da plataforma (admin) | Admin | IMPORTANTE |
| RF106 | Aprovação de comissões em lote (admin) | Admin | IMPORTANTE |

---

## 12.3 Requisitos Futuros — FASE 3 (WILL — Após Fases 1 e 2)

> ⏳ **Complexidade elevada** — Implementar somente após estabilização das Fases 1 e 2.

| ID | Requisito | Perfil | Prioridade |
|----|-----------|--------|-----------|
| RF200 | Área de Membros acessível por todos os perfis | Todos | FUTURO |
| RF201 | IA personalizada coleta dados no onboarding | Todos | FUTURO |
| RF202 | IA recomenda cursos e conteúdos por perfil | Todos | FUTURO |
| RF203 | Sistema de matrículas (gratuito + pago) | Todos | FUTURO |
| RF204 | IA realiza check-ins periódicos | Todos | FUTURO |
| RF205 | Progresso de cursos salvo automaticamente | Todos | FUTURO |
| RF206 | Agendamento de mentorias via plataforma | Todos | FUTURO |

---

## 12.3 Rotas da Aplicação V5.0

```
PÚBLICO
  GET /              → Landing page
  GET /auth          → Login/cadastro (com seleção de perfil)
  GET /reset-password → Recuperação de senha

CONTADOR (requer auth + role: contador)
  GET /dashboard     → Dashboard principal
  GET /comissoes     → Gerenciar comissões
  GET /rede          → Rede MLM
  GET /indicacoes    → Marketplace (novo V5.0)
  GET /simulador     → Simulador de crescimento
  GET /membros       → Área de Membros
  GET /perfil        → Perfil e dados bancários

MPE (requer auth + role: mpe)
  GET /mpe/pagamento → Efetuar pagamento da mensalidade ao Coworking (via Stripe)
  GET /mpe/membros   → Área de Membros
  GET /mpe/perfil    → Perfil

COWORKING (requer auth + role: coworking)
  GET /coworking/indicacoes → Indicações recebidas
  GET /coworking/membros    → Área de Membros
  GET /coworking/perfil     → Perfil

ADMIN
  GET /admin/dashboard      → Visão geral
  GET /admin/transacoes     → Receita da plataforma
  GET /admin/contadores     → Gestão de contadores
  GET /admin/coworkings     → Gestão de coworkings
  GET /admin/comissoes      → Aprovação em lote
  GET /admin/auditoria      → Logs de auditoria
```

---

# 13. APIs e Webhooks

## 13.1 Webhook: `POST /webhook-stripe` *(atualizado V5.0)*

**Eventos tratados**:

| Evento Stripe | Ação |
|--------------|------|
| `invoice.payment_succeeded` (cliente contador) | Calcula 17 bonificações |
| `invoice.payment_succeeded` (mensalidade coworking) | Calcula taxa 10% automaticamente (Fluxo 2) |
| `checkout.session.completed` (curso/mentoria) | Libera acesso ao conteúdo |
| `invoice.payment_failed` | Notifica e suspende acesso |
| `customer.subscription.deleted` | Cancela comissão/acesso |

**Validação**:
```typescript
const stripeSignature = req.headers['stripe-signature'];
const event = stripe.webhooks.constructEvent(
  await req.text(),
  stripeSignature,
  Deno.env.get('STRIPE_WEBHOOK_SECRET')
);
// Verificar idempotência
const existe = await supabase
  .from('webhook_logs')
  .select('id')
  .eq('stripe_event_id', event.id)
  .single();
if (existe.data) return { status: 200, message: 'Already processed' };
```

---

## 13.2 Edge Function: `indicacao-coworking` *(NOVA V5.0)*

**Endpoint**: `POST /functions/v1/indicacao-coworking`

**Payload**:
```json
{
  "mpe_cnpj": "12.345.678/0001-99",
  "coworking_id": "uuid-do-coworking",
  "mensagem": "MPE com necessidade de espaço flexível"
}
```

**Fluxo**:
```
1. Valida CNPJ via ReceitaWS
2. Verifica se MPE já tem indicação ativa para esse Coworking
3. Cria/vincula registro em mpes (se não existir)
4. Cria indicacao_coworking com status 'pendente'
5. Envia email/push ao Coworking
6. Retorna { success: true, indicacao_id }
```

---

## 13.3 Edge Function: `confirmar-conversao` *(NOVA V5.0)*

**Endpoint**: `POST /functions/v1/confirmar-conversao`

**Quem chama**: Coworking (via app)

**Payload**:
```json
{
  "indicacao_id": "uuid",
  "valor_comissao": 200.00,
  "confirmacao": true
}
```

**Fluxo**:
```
1. Valida que Coworking é dono da indicação
2. Calcula taxa (20%) e valor líquido (80%)
3. Atualiza indicacao_coworking (status: convertida)
4. Cria comissão para o Contador
5. Registra receita em transacoes_plataforma
6. Notifica Contador via push + email
```

---

## 13.4 CRON Jobs

| Job | Quando | O que faz |
|-----|--------|-----------|
| `processar-pagamentos-comissoes` | Dia 25, 00:01 | Paga comissões aprovadas ≥ R$100 |
| `verificar-indicacoes-sem-resposta` | Diário, 09:00 | Alerta Coworkings com indicações sem resposta há 10+ dias |
| `checkin-ia` | 1º de cada mês | IA envia check-in personalizado para usuários ativos |
| `calcular-bonus-ltv` | Dia 1, 01:00 | Verifica clientes completando 13º mês |

---

# 14. Roadmap Técnico V5.0

## Fase 1 — Fundação (Semanas 1–4) *[Parcialmente existente da V4.0]*

- [ ] Setup Vite + React + TypeScript + Supabase
- [ ] Autenticação com múltiplos perfis (contador/mpe/coworking)
- [ ] Tabelas base: contadores, clientes, comissoes, rede_contadores
- [ ] Webhook Stripe → 17 bonificações
- [ ] Dashboard do Contador com KPIs

---

## Fase 2 — Portal de Transparência Completo (Semanas 5–8) *[V4.0 core]*

- [ ] Página de Comissões com filtros e solicitação de saque
- [ ] Rede MLM com visualização em árvore (5 níveis)
- [ ] Simulador de crescimento 12 meses
- [ ] Sistema TIER + Porto Seguro
- [ ] CRON dia 25 para pagamento de comissões
- [ ] Admin: aprovação em lote de comissões

---

## Fase 3 — Marketplace de Indicações (Semanas 9–12) *[NOVO V5.0]*

- [ ] Cadastro de MPEs (com validação de CNPJ)
- [ ] Cadastro de Coworkings
- [ ] Página `/indicacoes` para Contadores (criar indicações)
- [ ] Área de Membros básica para MPE (ver contador responsável e coworking vinculado)
- [ ] Área de Membros básica para Coworking (ver indicações recebidas e contador responsável por cada MPE)
- [ ] Edge Function: `indicacao-coworking`
- [ ] Edge Function: `confirmar-conversao`
- [ ] Cálculo automático das taxas (20% e 10%)
- [ ] Registro em `transacoes_plataforma`
- [ ] Notificações push e email para o ecossistema
- [ ] CRON: alertas de indicações sem resposta

---

## Fase 4 — Área de Membros Base (Semanas 13–18) *[NOVO V5.0]*

- [ ] Infraestrutura de Cursos (tabelas: cursos, matriculas)
- [ ] Player de curso (módulos, progresso, certificado)
- [ ] Cursos gratuitos iniciais para os 3 perfis
- [ ] Sistema de matrículas pagas (Stripe)
- [ ] Mentorias em grupo (agendamento + link de sessão)
- [ ] Mentorias individuais (Stripe + calendário)
- [ ] Área de Membros por perfil (rotas separadas)

---

## Fase 5 — IA Personalizada (Semanas 19–26) *[NOVO V5.0]*

- [ ] Definição e integração da API de IA (OpenAI/Gemini/Claude)
- [ ] Fluxo de onboarding inteligente (formulários por perfil)
- [ ] Perfil de IA por usuário (tabela `ia_perfis`)
- [ ] Recomendações de cursos baseadas em perfil
- [ ] Histórico de conversas (`ia_interacoes`)
- [ ] Interações contínuas (check-ins mensais via CRON)
- [ ] IA avançada (premium, interações ilimitadas)
- [ ] Dashboard admin: métricas de engajamento com IA

---

## Fase 6 — Consolidação e Escala (Semanas 27–32) *[V5.0 final]*

- [ ] Dashboard admin de receita da plataforma
- [ ] Relatório mensal de taxas para Coworkings
- [ ] Testes E2E (Playwright) para os 3 fluxos principais
- [ ] Testes unitários (Vitest)
- [ ] Monitoramento (Sentry)
- [ ] Otimização de performance
- [ ] Deploy em produção (Netlify + Supabase Cloud)
- [ ] Documentação técnica atualizada

---

## Visão Consolidada do Roadmap

```
SEM 1–4:    [FASE 1] Fundação
SEM 5–8:    [FASE 2] Portal de Transparência (17 bonif.)
SEM 9–12:   [FASE 3] Marketplace de Indicações
SEM 13–18:  [FASE 4] Área de Membros Base
SEM 19–26:  [FASE 5] IA Personalizada
SEM 27–32:  [FASE 6] Consolidação e Escala
```

---

# 15. Glossário

| Termo | Significado |
|-------|------------|
| **RLS** | Row Level Security — garante cada usuário vê só seus dados |
| **Edge Function** | Código serverless que roda na nuvem do Supabase |
| **Webhook** | Aviso automático disparado por evento (ex: pagamento recebido) |
| **Override** | Comissão sobre clientes que a REDE do Contador trouxe |
| **TIER** | Nível de performance do Contador (afeta comissão) |
| **LTV** | Lifetime Value — valor que cliente/MPE gera ao longo do tempo de permanência |
| **CAC** | Custo de Aquisição de Cliente — custo para conquistar uma nova MPE |
| **MPE** | Micro e Pequena Empresa — cliente final do ecossistema |
| **Coworking** | Espaço de trabalho compartilhado — parceiro da plataforma |
| **Marketplace** | Ambiente de troca onde Contadores indicam MPEs a Coworkings |
| **Área de Membros** | Ambiente de desenvolvimento com trilhas educacionais, IA e mentorias |
| **Freemium** | Acesso básico gratuito + recursos avançados pagos |
| **Fluxo 1** | Indicação de MPE → Coworking (taxa de 20% sobre comissão do Contador) |
| **Fluxo 2** | Mensalidade de MPE no Coworking (taxa de 10% retida pela plataforma) |
| **IA Personalizada** | IA que guia cada perfil por nicho, legislação, estágio e histórico |
| **Onboarding Inteligente** | Conversa conduzida pela IA no cadastro para definir perfil, nicho e estágio |
| **Trilha Educacional** | Sequência estruturada de conteúdos ativada conforme estágio de maturidade |
| **Estágio de Maturidade** | Fase de evolução do usuário na plataforma (ex: nascente, em crescimento) |
| **Ativação Progressiva** | Desbloqueio automático de conteúdos ao avançar de estágio |
| **Experimentação Guiada** | IA acompanha o usuário na implementação prática de uma ação |
| **Teste Prático** | Exercício aplicado ao negócio/perfil real do usuário (antecede conteúdo pago) |
| **Diagnóstico de IA** | Análise gerada pela IA com gargalos, riscos e oportunidades do perfil |
| **Gamificação** | Uso das 17 bonificações como sistema de recompensas para engajamento |
| **Nicho** | Segmento específico de atuação (ex: varejo, saúde, construção) |
| **Legislação/Regime** | Regime tributário do usuário (MEI, Simples Nacional, Lucro Presumido) |
| **CNPJ** | Registro único da empresa (como CPF para pessoa jurídica) |
| **PIX** | Sistema de pagamento instantâneo brasileiro |
| **CRON** | Tarefa agendada que executa automaticamente em horário definido |
| **Idempotência** | Propriedade que garante processar o mesmo evento 2x sem duplicar resultado |
| **Porto Seguro** | Proteção especial para Contadores de alto desempenho durante pausas |

---

## Fim do PRD

**Status**: ✅ COMPLETO — V5.0

**Total de Seções**: 15

**Documentação cobre**:
- Ecossistema com 3 atores (Contador, MPE, Coworking)
- 2 Fluxos de receita transacional (20% e 10%)
- Área de Membros com IA personalizada por perfil
- 17 Bonificações MLM (intactas da V4.0)
- Modelo de dados completo (11 novas tabelas)
- Roadmap de 32 semanas em 6 fases

**Pronto para**: Desenvolvimento das Fases 1 a 6.

---

**Autor**: Claude Sonnet 4.6 (Anthropic)  
**Data**: Fevereiro 2026  
**Versão**: 5.0  
**Status**: ✅ PRONTO PARA PRODUÇÃO
