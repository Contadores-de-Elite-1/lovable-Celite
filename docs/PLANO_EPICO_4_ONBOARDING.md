# 📱 Épico 4: App de Onboarding de Clientes

**Data:** 19/11/2025  
**Status:** 🚀 EM PLANEJAMENTO  
**Tempo Estimado:** 3-4 semanas  
**Complexidade:** ⭐⭐⭐⭐⭐

---

## 🎯 Objetivo

Criar um **app mobile-first** que permita **clientes assinar e pagar** de forma frictionless (mínimo atrito), com integração **Stripe** como gateway de pagamento principal.

**Restrição:** Não pode ficar no Portal dos Contadores. Precisa ser **acessível via link único** que cada contador compartilha.

---

## 📋 User Stories

### **US4.1: Tela de Boas-vindas (Welcome)**
- [ ] **Logo do CONTADOR** (dinâmica! - obtida via parâmetro do link)
- [ ] Breve descrição do serviço
- [ ] Benefícios principais (3-4 bullets)
- [ ] Botão "Começar" → próxima tela
- [ ] Mobile-first, sem header/menu
- [ ] Fundo com identidade visual do contador

**Acesso:** `https://app.lovablecelite.com/onboarding/[LINK_CONTADOR]`

**Dinamismo:**
- Fetch logo contador via API: `GET /api/onboarding/contador/[LINK_CONTADOR]`
- Retorna: `{ nome, logo_url, cor_primaria, cor_secundaria }`
- Aplica branding customizado em todas as 6 telas

---

### **US4.2: Seleção de Plano (Plan Selection)**
- [ ] 3 cards com planos (Básico, Profissional, Premium)
- [ ] Preços R$ 100, R$ 130, R$ 180
- [ ] Destaque visual do plano recomendado
- [ ] Features de cada plano
- [ ] Botão "Continuar" para cada plano
- [ ] Botão "Voltar"

**Dados armazenados:** Plano selecionado

---

### **US4.3: Dados e Documentos (Data/Document Upload)**
- [ ] Form com campos obrigatórios:
  - Nome da empresa
  - CNPJ (validado com ReceitaWS)
  - Email
  - Telefone
  - Endereço (rua, número, cidade, estado, CEP)
- [ ] Upload de documentos (OBRIGATÓRIOS):
  - Contrato social (PDF)
  - Certidão simplificada (via API CNPJ ou upload)
  - **Comprovante de Residência** (conta água/luz/gás/telefone) ⭐ NOVO
- [ ] Validação em tempo real
- [ ] Botões: "Voltar" e "Próxima"
- [ ] Exibir identidade do contador (logo + nome)

**Validação:** ReceitaWS para CNPJ

**Documentos Requeridos:**
- Contrato social: PDF, máx 10MB
- Certidão: PDF, máx 10MB
- Comprovante de residência: PDF/JPG, máx 5MB, últimos 3 meses

---

### **US4.4: Prévia e Assinatura do Contrato (Contract Preview/Signature)**
- [ ] Exibir contrato em PDF (renderizado)
- [ ] Campos de assinatura eletrônica:
  - Canvas para desenhar assinatura (HTML5)
  - Ou upload de imagem
- [ ] Checkbox: "Aceito os termos"
- [ ] Botões: "Voltar" e "Próxima"

**Tecnologia:** HTML5 Canvas para assinatura

---

### **US4.5: Pagamento via Stripe (Stripe Checkout)**
- [ ] Resumo do pedido (plano, valor, detalhes)
- [ ] Botão "Pagar com Stripe"
- [ ] Redirecionamento para Stripe Checkout
- [ ] Retorno com confirmação ou erro

**Gateway:** Stripe Checkout (hosted)

---

### **US4.6: Página de Sucesso (Success)**
- [ ] Mensagem de confirmação
- [ ] Detalhes da assinatura:
  - Plano contratado
  - Valor
  - Data de vencimento
  - Número de confirmação
- [ ] Email confirmação enviado
- [ ] Botão "Ir para o Dashboard" (link do contador)
- [ ] Botão "Fechar"

**Evento:** Comissão de ativação criada para contador

---

## 🏗️ Arquitetura

### **Frontend (SPA React)**
```
/src/onboarding/
├── pages/
│   ├── Welcome.tsx          # US4.1
│   ├── PlanSelection.tsx     # US4.2
│   ├── DataUpload.tsx        # US4.3
│   ├── ContractSignature.tsx # US4.4
│   ├── PaymentStripe.tsx     # US4.5
│   └── Success.tsx           # US4.6
├── components/
│   ├── ProgressBar.tsx       # Indicador de progresso
│   ├── FormValidator.tsx     # Validações
│   └── SignatureCanvas.tsx   # Canvas de assinatura
├── hooks/
│   ├── useOnboarding.ts      # State management
│   └── useStripe.ts          # Stripe integration
├── services/
│   ├── receitaws.ts          # CNPJ validation
│   ├── stripe.ts             # Stripe API
│   └── api.ts                # Backend communication
└── layout/
    └── OnboardingLayout.tsx  # Layout base
```

### **Backend (Edge Functions)**
```
supabase/functions/
├── webhook-stripe/           # Processa pagamentos
├── criar-cliente/            # Cria cliente no DB
├── enviar-contrato/          # Envia contrato assinado
├── validar-cnpj/             # Valida CNPJ (ReceitaWS)
└── calcular-comissao-ativacao/ # Cria comissão
```

### **Database Updates**
```sql
-- Tabela clientes (já existe, pode precisar de campos)
ALTER TABLE clientes ADD COLUMN (
  assinatura_digital TEXT,      -- Assinatura em base64
  documento_contrato_url TEXT,  -- URL do contrato assinado
  status_onboarding VARCHAR,    -- completed, pending, failed
  data_conclusao_onboarding TIMESTAMPTZ
);
```

---

## 📊 Fluxo de Dados

```
┌─────────────────────────────────────────────────────────┐
│ Contador Compartilha Link                              │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
        https://app.lovablecelite.com/onboarding/ABC123
                       │
        ┌──────────────┼──────────────┐
        │              │              │
        ▼              ▼              ▼
    Welcome    → PlanSelection → DataUpload
                                    │
                                    ▼
                          ContractSignature
                                    │
                                    ▼
                            PaymentStripe
                                    │
                    ┌───────────────┼───────────────┐
                    │               │               │
                  Pago           Falha         Pendente
                    │               │               │
                    ▼               ▼               ▼
                  Success         Error        Retry
```

---

## 🔄 Fluxo de Negócio

### **Contador (origem)**
1. Acessa Portal (Dashboard)
2. Clica em "Compartilhar Link de Onboarding"
3. Copia link: `https://app.lovablecelite.com/onboarding/SEU_CODIGO`
4. Compartilha com cliente (WhatsApp, Email, SMS, etc)

### **Cliente (novo)**
1. Clica no link
2. Vê tela de Welcome
3. Seleciona plano
4. Preenche dados e faz upload
5. Assina contrato eletrônico
6. Paga com Stripe
7. Vê tela de sucesso

### **Backend (automático)**
1. ✅ Valida CNPJ
2. ✅ Cria cliente no DB
3. ✅ Recebe webhook Stripe
4. ✅ Cria comissão de ativação para contador
5. ✅ Envia email de confirmação
6. ✅ Marca onboarding como concluído

---

## 💰 Fluxo Financeiro (CRÍTICO - COMISSÃO APÓS STRIPE!)

```
Cliente paga R$ 130 (Profissional)
        │
        ▼
    Stripe recebe R$ 130
        │
    ┌───┴─────────────────────────────────────────┐
    │ Taxa Stripe: 2.9% + R$0.30 = R$4,07        │
    │                                              │
    │ Valor LÍQUIDO para Lovable: R$125,93        │
    │                                              │
    └───┬──────────────────────────────────────────┘
        │
        ├─→ Contador (Comissão sobre VALOR LÍQUIDO!)
        │   Comissão Ativação: 15% de R$125,93 = R$18,89 ⭐ NOVO!
        │   (Antes era 15% de R$130 = R$19,50)
        │   Status: APROVADA (automaticamente)
        │
        └─→ Lovable-Celite: R$125,93 - R$18,89 = R$107,04
            (Fica com a margem)
```

**⚠️ CRÍTICO:** Comissão é calculada sobre valor APÓS taxa Stripe!

**Impacto em TODO o projeto:**
- ✅ Calculadora.tsx: Fórmulas precisam ser recalculadas
- ✅ Simulador: Mesma mudança
- ✅ Edge Function calcular-comissoes: Lógica muda
- ✅ PRD_LOVABLE_CELITE.md: Fórmulas na seção 6
- ✅ Testes unitários: Novos valores esperados
- ✅ Dashboard: Exibir este novo valor

---

## 🛠️ Tecnologias

### **Frontend**
- React + TypeScript
- React Router (single-page routing)
- React Hook Form + Zod (validação)
- Stripe.js (pagamento)
- HTML5 Canvas (assinatura)
- TailwindCSS (estilo)
- Framer Motion (animações)

### **Backend**
- Supabase Edge Functions (Deno)
- Stripe API
- ReceitaWS API (CNPJ)
- SendGrid (email)

### **Segurança**
- HTTPS obrigatório
- CORS configurado apenas para domínio
- Rate limiting nos endpoints
- Validação de CNPJ com ReceitaWS
- RLS nas tabelas
- Assinatura digital em PDF

---

## 📱 Design (Mobile-First)

### **Tela Welcome**
```
┌─────────────────────────┐
│                         │
│   [Logo]                │
│                         │
│   Bem-vindo ao          │
│   Lovable-Celite        │
│                         │
│   ✓ Contabilidade       │
│   ✓ Compliance          │
│   ✓ Economia            │
│                         │
│   [Começar]             │
│                         │
└─────────────────────────┘
```

### **Tela Planos**
```
┌─────────────────────────┐
│ Selecione seu plano     │
├─────────────────────────┤
│ ┌─────────────────────┐ │
│ │ Básico              │ │
│ │ R$ 100/mês          │ │
│ │ ✓ Feature 1         │ │
│ │ ✓ Feature 2         │ │
│ │                     │ │
│ │ [Escolher]          │ │
│ └─────────────────────┘ │
│ ┌─────────────────────┐ │
│ │ Profissional ⭐     │ │
│ │ R$ 130/mês          │ │
│ │ ✓ Feature 1         │ │
│ │ ✓ Feature 2         │ │
│ │ ✓ Feature 3         │ │
│ │ [Escolher]          │ │
│ └─────────────────────┘ │
│ ┌─────────────────────┐ │
│ │ Premium             │ │
│ │ R$ 180/mês          │ │
│ │ ✓ Todos os resources│ │
│ │                     │ │
│ │ [Escolher]          │ │
│ └─────────────────────┘ │
└─────────────────────────┘
```

---

## 📈 Métricas de Sucesso

| Métrica | Meta | Status |
|---------|------|--------|
| Taxa de conclusão | > 80% | - |
| Tempo médio | < 5 min | - |
| Erro de validação CNPJ | < 2% | - |
| Taxa de pagamento aprovada | > 95% | - |
| Taxa de conversão | > 70% | - |

---

## 🔒 Segurança & Compliance

- [ ] PCI-DSS (Stripe cuida, mas validar)
- [ ] LGPD (dados de cliente protegidos)
- [ ] MD5 signature validation (webhooks)
- [ ] Rate limiting (max 10 req/min por IP)
- [ ] CSRF tokens
- [ ] SQL Injection prevention (via Supabase)
- [ ] XSS protection
- [ ] Assinatura digital válida

---

## ✅ Checklist de Implementação

### **Phase 1: Frontend Base (1 semana)**
- [ ] Setup repo separado (ou mesma)
- [ ] Layout base + routing
- [ ] Telas 1-2 (Welcome, PlanSelection)
- [ ] Styling completo
- [ ] Responsividade mobile

### **Phase 2: Formulários & Validação (1 semana)**
- [ ] Telas 3-4 (DataUpload, ContractSignature)
- [ ] React Hook Form integrado
- [ ] Zod schemas
- [ ] ReceitaWS CNPJ validation
- [ ] Canvas signature

### **Phase 3: Pagamento & Backend (1 semana)**
- [ ] Tela 5-6 (Payment, Success)
- [ ] Stripe.js integration
- [ ] Edge Function webhook
- [ ] Criar cliente no DB
- [ ] Comissão de ativação

### **Phase 4: Testes & Refinamento (1 semana)**
- [ ] Testes E2E (Cypress)
- [ ] Testes manuais
- [ ] Performance otimização
- [ ] Security audit
- [ ] Deploy

---

## 🚀 Próximos Passos Imediatos

1. **AGORA:** Apresentar este plano para aprovação
2. **Amanhã:** Começar Phase 1 (Setup + Welcome + PlanSelection)
3. **Próxima semana:** Phase 2 (Formulários)
4. **Semana 3:** Phase 3 (Pagamento)
5. **Semana 4:** Phase 4 (Testes + Deploy)

---

## 📞 Dúvidas/Decisões Necessárias

1. **Domínio:** `app.lovablecelite.com` ou `onboarding.lovablecelite.com`?
2. **Email:** Usar SendGrid ou Supabase?
3. **PDF:** Gerar dinamicamente ou usar template pré-definido?
4. **Assinatura:** Canvas ou upload de imagem?
5. **Link compartilhável:** Como gerar código único por contador?
6. **Retenção de dados:** Quanto tempo guardar dados do formulário?

---

**Status:** 🚀 **PRONTO PARA COMEÇAR**

**Aprovação do plano?** Sim/Não/Modificações

