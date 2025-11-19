# Lovable Celite

**Sistema de Comissões MLM/MMN para o Programa Contadores de Elite**

Este projeto foi criado usando Lovable + Supabase + Stripe para automatizar comissões e transformar contadores em consultores de elite.

---

## 🚀 Início Rápido

### **Para Desenvolvedores:**
1. Leia **FRAMEWORK_LOVABLE_CELITE.md** (20 min - guia essencial)
2. Consulte **docs/BASE_DADOS_CONSULTA.md** (índice de toda documentação)
3. Revise **docs/17 bonificacoes_Regras do programa** (regras de negócio)

### **Para Product/Design:**
1. Leia **docs/AVATAR** (persona completa - ESSENCIAL)
2. Consulte **FRAMEWORK_LOVABLE_CELITE.md** (visão geral)
3. Revise **docs/FRAMEWORK_COMPLETO.md** (contexto profundo)

### **Para Stakeholders:**
1. Leia **FRAMEWORK_LOVABLE_CELITE.md** (overview completo)
2. Consulte **docs/FRAMEWORK_COMPLETO.md** (estratégia + métricas)

---

## 📚 Documentação Principal

| Documento | Descrição | Quando Usar |
|-----------|-----------|-------------|
| **FRAMEWORK_LOVABLE_CELITE.md** | Guia rápido, direto ao ponto (~500 linhas) | Referência diária |
| **docs/FRAMEWORK_COMPLETO.md** | Documentação exaustiva (4.372 linhas) | Estratégia, onboarding |
| **docs/BASE_DADOS_CONSULTA.md** | Índice mestre de todos os documentos | Encontrar qualquer informação |
| **docs/AVATAR** | Psicografia profunda do cliente (Carlos) | UX, copy, decisões produto |
| **docs/17 bonificacoes_Regras do programa** | Regras completas comissões/bônus | Implementar lógica negócio |

---

## 🎯 O Que É Este Projeto?

**NÃO é**: Apenas um sistema de comissões MLM  
**É**: Ecossistema de transformação para contadores

**Meta #1**: **"Meus filhos terão orgulho de mim"**

Se o sistema não entregar isso, fracassou.

---

## 🛠️ Stack Técnica

- **Frontend**: Vite + React 18 + TypeScript + Shadcn/UI + Tailwind
- **Backend**: Supabase (PostgreSQL + Edge Functions + Auth + RLS)
- **Pagamentos**: Stripe (principal) + ASAAS (fallback)
- **Deploy**: Netlify (frontend) + Supabase Cloud (backend)

---

## 🚦 Como Começar

### **1. Setup Ambiente**
```bash
# Instalar dependências
pnpm install

# Configurar variáveis de ambiente
cp .env.example .env.local
# Preencher: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, STRIPE_PUBLIC_KEY

# Iniciar dev server
pnpm dev  # Roda na porta 8080
```

### **2. Setup Supabase**
```bash
# Login Supabase
npx supabase login

# Link projeto
npx supabase link --project-ref SEU_PROJECT_REF

# Aplicar migrations
npx supabase db push
```

### **3. Testar Edge Functions**
```bash
# Testar localmente
npx supabase functions serve

# Deploy
npx supabase functions deploy calcular-comissoes
npx supabase functions deploy webhook-stripe
```

---

## 📊 Funcionalidades Principais

1. **Sistema de Comissões** (7 tipos automáticos)
2. **Níveis de Contador** (Bronze → Prata → Ouro → Diamante)
3. **Lead Diamante** (reconhecimento supremo)
4. **Sistema TIER** (performance + penalidades)
5. **Links Rastreáveis** (`/i/:token`, `/r/:token`)
6. **Gamificação** (XP, conquistas, ranking)
7. **Alertas Proativos** (Firebase push notifications)
8. **Simulador de Crescimento** (projeção 12 meses)

---

## 🎯 Métricas de Sucesso

**Técnicas (Mês 6):**
- MRR: R$ 50K | 80 contadores | 400 clientes

**Emocionais (Mês 6):** ⭐ **MAIS IMPORTANTE**
- 80% relatam: **"Família tem orgulho"**
- 10% atingem: **Diamante** (reconhecimento supremo)

---

## 📞 Suporte & Links

- **Documentação Completa**: `docs/BASE_DADOS_CONSULTA.md`
- **Lovable Project**: https://lovable.dev/projects/ec352023-a482-4d12-99c5-aac2bf71f1db

---

## 💎 Filosofia do Projeto

**50% técnico + 50% emocional = 100% transformação**

Cada decisão técnica serve a um propósito emocional:
- Webhook rápido → Reduz medo
- Dashboard bonito → Combate vergonha
- Lead Diamante → STATUS (orgulho dos filhos)

---

## 🔧 Desenvolvimento Local

**Use Lovable**: Visit [Lovable Project](https://lovable.dev/projects/ec352023-a482-4d12-99c5-aac2bf71f1db)

**Use sua IDE favorita**:
```bash
git clone <YOUR_GIT_URL>
cd <YOUR_PROJECT_NAME>
pnpm install  # Usamos pnpm exclusivamente
pnpm dev      # Roda na porta 8080
```

**Tecnologias**: Vite, TypeScript, React, Shadcn-UI, Tailwind CSS, Supabase

---

**Autor**: Claude Sonnet 4.5 (Anthropic)  
**Data**: Novembro 2025  
**Licença**: Proprietária - Top Class Escritório Virtual

Para mais informações sobre o Lovable, visite [https://lovable.dev](https://lovable.dev).
