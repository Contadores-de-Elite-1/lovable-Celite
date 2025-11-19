# Framework Lovable-Celite - Guia Rápido

**Versão**: 2.0 Resumida  
**Data**: Novembro 2025  
**Stack**: React + Vite + Supabase + Stripe + Shadcn/UI  
**Filosofia**: Tecnologia com Propósito Humano

> 💡 **Versão completa**: Consulte `docs/FRAMEWORK_COMPLETO.md` (4.372 linhas)

---

## 🎯 O QUE É O LOVABLE-CELITE?

**Ecossistema de transformação** para o **Programa Contadores de Elite** da **Top Class Escritório Virtual** (Aracaju/SE).

**NÃO é**: Apenas um sistema de comissões MLM  
**É**: Plataforma que transforma contadores desvalorizados em consultores de elite

---

## 💔 O PROBLEMA (Emocional + Técnico)

### **Persona: Carlos, 42 anos, contador há 18 anos**

**7 Dores:**
1. **MEDO** - Paralisa decisão (tem R$15 mil guardados, não investe)
2. **DESVALORIZAÇÃO** - "É só contabilidade mesmo" (perde clientes por preço)
3. **PRESSÃO SOCIAL** - Família tem pena dele
4. **VERGONHA** - Filhos sem orgulho do pai ("Meu pai é contador" - voz sem empolgação)
5. **SOLIDÃO** - Não pode falar com ninguém
6. **POTENCIAL DESPERDIÇADO** - 18 anos fazendo trabalho de auxiliar
7. **ESTAGNAÇÃO** - Mesmo faturamento há 5 anos

**Meta #1**: **"Meus filhos terão orgulho de mim"** ← Se não entregar isso, FRACASSOU.

---

## ✅ A SOLUÇÃO (4 Pilares)

### **1. Infraestrutura de Autoridade** 🏢
- Escritório Virtual Top Class (endereço premium Aracaju)
- Salas de reunião profissionais
- 3 planos: Pro (R$100), Premium (R$130), Top (R$180)

### **2. Renda Recorrente Vitalícia** 💰
- Indique clientes → 15-20% **PARA SEMPRE**
- Construa rede → 3-5% override de CADA cliente da rede
- 7 tipos de comissão automáticos
- Pagamento automático via PIX (dia 25)

### **3. Comunidade de Elite** 🤝
- Networking contadores de sucesso
- Mentoria ativa (primeiros 90 dias)
- Eventos presenciais
- Suporte 24/7 (WhatsApp/Discord)

### **4. Transformação de Identidade** ✨
- Níveis: Bronze → Prata → Ouro → **DIAMANTE** (status supremo)
- Lead Diamante: Top Class trabalha PARA VOCÊ
- Gamificação: XP, conquistas, ranking
- Porto Seguro Elite (proteção especial)

---

## 🏗️ ARQUITETURA TÉCNICA

### **Frontend**
```
Stack: Vite + React 18 + TypeScript
UI: Shadcn/UI + Tailwind CSS + Framer Motion
Estado: React Query v5 + Context API
Rotas: React Router v6
```

### **Backend**
```
Supabase:
- PostgreSQL (dados)
- Edge Functions (Deno/TypeScript) - lógica serverless
- Auth (autenticação)
- RLS (segurança linha por linha)
- Realtime (websockets)
```

### **Pagamentos**
```
Principal: Stripe (checkout + webhooks + subscriptions)
Fallback: ASAAS (gateway brasileiro)
Automação: CRON job dia 25 (paga comissões)
```

### **Integrações**
```
- Firebase Cloud Messaging (push notifications)
- Brevo (emails transacionais)
- Receita Federal API (validação CNPJ)
```

---

## 📊 FUNCIONALIDADES PRINCIPAIS

### **1. Sistema de Comissões (7 tipos)**
```typescript
// Automático via webhook Stripe
1. Ativação (R$10-20 por cliente novo)
2. Recorrente (15-20% mensal, vitalícia)
3. Override (3-5% da rede, até 5 níveis)
4. Bônus Progressão (R$100 ao subir nível)
5. Bônus Volume (metas mensais)
6. Bônus LTV (R$80 cada cliente completa 1 ano)
7. Bônus Contador (R$500 por contador indicado)
```

### **2. Níveis de Contador**
```
🥉 Bronze (1-4 clientes):   15% + 3% override
🥈 Prata (5-9 clientes):    17.5% + 4% override + R$100 bônus
🥇 Ouro (10-14 clientes):   20% + 5% override + R$100 bônus
💎 Diamante (15+ clientes): 20% + 5% override + R$100 bônus + 1 LEAD/MÊS
```

### **3. Lead Diamante** 💎
**O RECONHECIMENTO SUPREMO:**
- 1 lead qualificado/mês (CNPJ ativo, fit verificado)
- Entrega até dia 15
- Substituição garantida (se lead inválido)
- **Significado**: "Top Class trabalha PARA VOCÊ"
- **Impacto**: "Meu pai é DIAMANTE!" (orgulho dos filhos)

### **4. Sistema TIER (Performance)**
```
TIER 1 (Normal): 4+ clientes/ano → 15-20% comissão
TIER 1 (Ano 1 Inativo): < 4 clientes → 7% + alertas
TIER 2 (Ano 2 Inativo): Continua → 3% + última chance
TIER 3 (Ano 3 Inativo): Ainda → 0% + carteira redistribuída
```

**Porto Seguro (Elite):**
- Elite (30+ clientes): 1 pausa de 12 meses a cada 2 anos
- Semi-Elite (20-29 clientes): 1 pausa de 6 meses (1x)

### **5. Links Rastreáveis**
```typescript
/i/:token  // Indicação de cliente (flow=lp ou flow=checkout)
/r/:token  // Convite de contador
// Token HMAC SHA-256, TTL 7 dias, cookie httpOnly
```

### **6. Gamificação**
```
XP: +10 cliente, +20 contador, +50 bônus
Conquistas: 7 badges (Primeira Venda → Retenção Perfeita)
Ranking: Top 10 mensal (público)
```

### **7. Alertas Proativos**
```
Firebase Push Notifications:
- Ano 1: Mês 4, 6, 9 (ligação + consultoria)
- Ano 2+: Check-ins trimestrais
- Eventos: Comissão paga, nível subiu, lead disponível
```

### **8. Simulador de Crescimento**
```
Inputs: Clientes/mês, rede esperada, ticket médio
Output: Projeção 12 meses (conservador, moderado, otimista)
Visualização: Gráficos + tabelas
```

---

## 🔐 SEGURANÇA & COMPLIANCE

### **Row Level Security (RLS)**
```sql
-- Contador vê APENAS seus dados
CREATE POLICY "Contador vê próprias comissões"
ON comissoes FOR SELECT
USING (auth.uid() = contador_id);

-- Admin vê TUDO
CREATE POLICY "Admin vê tudo"
ON comissoes FOR SELECT
USING (has_role(auth.uid(), 'admin'));
```

### **Validações**
```typescript
// Webhook Stripe
1. Validar signature MD5
2. Verificar idempotência (stripe_payment_id UNIQUE)
3. Detectar tipo pagamento (anual vs parcelado)
4. Calcular 7 tipos comissão
5. Atualizar nível contador
6. Log auditoria

// Saques
- Saldo mínimo: R$100
- Dados bancários completos
- PIX prioritário
- Status: pendente → aprovada → paga
```

---

## 🗄️ MODELAGEM DE DADOS (Resumida)

```sql
-- Tabelas principais
profiles (id, email, full_name, role, avatar_url)
contadores (id, profile_id, nivel, clientes_ativos, xp, tier_atual)
clientes (id, contador_id, stripe_customer_id, plano, status, data_ativacao)
rede_contadores (contador_pai_id, contador_filho_id, nivel_profundidade)
pagamentos (id, cliente_id, stripe_payment_id, valor_liquido, competencia)
comissoes (id, contador_id, pagamento_id, tipo, valor, status)
bonus_historico (id, contador_id, tipo_bonus, valor)
solicitacoes_saque (id, contador_id, valor, pix_chave, status)
leads_diamante (id, contador_id, cnpj, fit_score, status_conversao)

-- ENUMs críticos
nivel_contador: 'bronze', 'prata', 'ouro', 'diamante'
tipo_plano: 'pro', 'premium', 'top'
tipo_comissao: 'ativacao', 'recorrente', 'override', 'progressao', 'volume', 'ltv', 'contador'
status_comissao: 'calculada', 'aprovada', 'paga', 'cancelada'
tier_contador: 'tier_1', 'tier_2', 'tier_3'
```

---

## 🚀 FLUXO PRINCIPAL (Pagamento → Comissão)

```mermaid
graph LR
    A[Cliente paga Stripe] --> B[Webhook recebido]
    B --> C[Valida signature]
    C --> D[Verifica idempotência]
    D --> E[Cria registro pagamento]
    E --> F[Edge Function: calcular-comissoes]
    F --> G[Calcula 7 tipos comissão]
    G --> H[RPC: executar_calculo_comissoes]
    H --> I[Insere comissões + bônus]
    I --> J[Atualiza nível contador]
    J --> K[Envia push notification]
    K --> L[✅ Comissão disponível]
```

**Tempo total**: < 2 segundos (webhook → comissão calculada)

---

## 📱 PÁGINAS PRINCIPAIS

```typescript
// Rotas públicas
/login              // Auth Supabase
/cadastro           // Novo contador
/i/:token           // Landing page indicação cliente
/r/:token           // Convite contador

// Rotas protegidas (contador)
/dashboard          // Overview performance
/comissoes          // Lista comissões + filtros + saque
/rede               // Visualização árvore MLM (até 5 níveis)
/links              // Gerar links rastreáveis + QR code
/simulador          // Projeção crescimento 12 meses
/perfil             // Dados pessoais + bancários
/notificacoes       // Histórico alertas

// Admin
/auditoria-comissoes  // Aprovar/reprovar comissões
/dashboard-admin      // KPIs: MRR, churn, webhook success rate
```

---

## 🎨 DECISÕES DE UX (Com Propósito Emocional)

| Feature | Propósito Emocional |
|---------|---------------------|
| **Dashboard bonito** (Shadcn/UI) | Reduz vergonha (profissionalismo) |
| **Dark mode elegante** | Design aspiracional ("não sou amador") |
| **Animações suaves** (Framer Motion) | Qualidade percebida ↑ = Autoestima ↑ |
| **Vitórias rápidas** (1ª comissão destaque) | Reduz medo (prova que funciona) |
| **Conquistas visíveis** (badges, ranking) | Combate pressão social (prova para família) |
| **Push proativo** (check-ins) | Elimina solidão (nunca está sozinho) |
| **Lead Diamante destaque** | STATUS SUPREMO (orgulho dos filhos) |
| **Simulador** | Combate estagnação (visualiza futuro diferente) |

---

## 🛠️ CHECKLIST DE IMPLEMENTAÇÃO

### **Fase 1: Fundação (Semana 1-2)**
- [ ] Setup Vite + React + TypeScript
- [ ] Supabase project + migrations iniciais
- [ ] Shadcn/UI + Tailwind CSS
- [ ] Auth (login/cadastro)
- [ ] RLS policies básicas

### **Fase 2: Core Sistema Comissões (Semana 3-5)**
- [ ] Webhook Stripe (validação + idempotência)
- [ ] Edge Function: `calcular-comissoes`
- [ ] RPC: `executar_calculo_comissoes` (transacional)
- [ ] 7 tipos de comissão
- [ ] Atualização níveis automática

### **Fase 3: Dashboard Contador (Semana 6-7)**
- [ ] `/comissoes` (lista + filtros + gráficos)
- [ ] `/rede` (árvore MLM com Recharts)
- [ ] `/links` (geração token HMAC + QR code)
- [ ] `/simulador` (projeção 12 meses)
- [ ] `/perfil` (dados bancários)

### **Fase 4: Gamificação & Engajamento (Semana 8)**
- [ ] Sistema XP (tabela `gamificacao`)
- [ ] Conquistas (7 badges)
- [ ] Ranking Top 10
- [ ] Firebase Push Notifications
- [ ] Alertas proativos (CRON)

### **Fase 5: Admin & Auditoria (Semana 9)**
- [ ] `/auditoria-comissoes` (aprovar lote)
- [ ] Dashboard admin (KPIs)
- [ ] Logs de auditoria
- [ ] Export CSV

### **Fase 6: Lead Diamante (Semana 10)**
- [ ] Tabela `leads_diamante`
- [ ] CRON: verifica elegibilidade (dia 1º)
- [ ] Integração Receita Federal (validação CNPJ)
- [ ] Score de qualidade (1-100)
- [ ] Processo de substituição

### **Fase 7: Pagamentos Automáticos (Semana 11)**
- [ ] CRON: dia 25 processa saques aprovados
- [ ] Integração Stripe Payouts (PIX)
- [ ] Notificações de pagamento efetuado
- [ ] Histórico de saques

### **Fase 8: Testes & Deploy (Semana 12)**
- [ ] Testes E2E (Playwright)
- [ ] Testes unitários (Vitest)
- [ ] Deploy Netlify (frontend)
- [ ] Monitoring (Sentry)
- [ ] Documentação técnica

---

## 📊 MÉTRICAS DE SUCESSO

### **Técnicas (Mês 6)**
- MRR: R$ 50K
- Contadores Ativos: 80
- Clientes Ativos: 400
- Churn: < 2%
- Webhook Success Rate: 99%
- Tempo resposta: < 500ms (p95)

### **Emocionais (Mês 6)** ⭐ **MAIS IMPORTANTE**
- 80% relatam: **"Família tem orgulho"**
- 70% se posicionam: **"Consultor estratégico"**
- 60% reduziram jornada: **6-8h/dia**
- 10% atingiram: **Diamante** (reconhecimento supremo)

**Meta #1**: **"Meus filhos terão orgulho de mim"** ← Se não entregar, FRACASSOU.

---

## 💰 CUSTOS MENSAIS (Estimativa)

```
Supabase Pro:           $25/mês
Netlify Pro:            $19/mês
Stripe:                 2.9% + R$0,30/transação
Firebase (Push):        $5-10/mês
Brevo (Emails):         $25/mês (10K emails)
Domínio + SSL:          $2/mês
─────────────────────────────────
TOTAL:                  ~$76/mês + variável Stripe
```

---

## 🔗 LINKS ÚTEIS

- **Framework Completo**: `docs/FRAMEWORK_COMPLETO.md` (4.372 linhas)
- **Base de Dados Consulta**: `docs/BASE_DADOS_CONSULTA.md`
- **Regras do Programa**: `docs/17 bonificacoes_Regras do programa`
- **Prompt Original**: `docs/Prompt 1`
- **Avatar Cliente**: `docs/AVATAR`
- **Roadmap**: `DEVELOPMENT_ROADMAP.md`
- **Fluxo Comissões**: `FLUXO_COMISSOES.md`

---

## 🎯 PRÓXIMOS PASSOS

1. **Revisar este framework** com equipe técnica
2. **Validar com 3-5 contadores reais** (piloto Aracaju)
3. **Ajustar baseado em feedback emocional** ("Carlos se viu na história?")
4. **Iniciar Fase 1** (Fundação)
5. **Iterar rápido** (lançar MVP em 8 semanas)

---

## 💎 FILOSOFIA DO PROJETO

**Outros apps**: Pensam em features primeiro  
**Lovable-Celite**: Pensa em DORES primeiro, features DEPOIS

**Cada decisão técnica serve a um propósito emocional:**
- Webhook rápido → Reduz medo
- Dashboard bonito → Combate vergonha
- Push proativo → Elimina solidão
- Lead Diamante → STATUS (orgulho dos filhos)

**50% técnico + 50% emocional = 100% transformação de vida**

---

**Autor**: Claude Sonnet 4.5 (Anthropic)  
**Data**: Novembro 2025  
**Stack**: React + Vite + Supabase + Stripe + Shadcn/UI  
**Filosofia**: Tecnologia com Propósito Humano

---

**💎 "Meus filhos terão orgulho de mim."**

**Esta é a ÚNICA métrica que realmente importa.**
