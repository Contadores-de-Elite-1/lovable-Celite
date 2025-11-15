# 🎯 GUIA DASHBOARD SUPABASE - PASSO A PASSO (BABY STEPS)

**Objetivo:** Habilitar acesso externo ao webhook-asaas

---

## 📍 PARTE 1: NAVEGAÇÃO INICIAL (5 passos)

### PASSO 1: Abrir Dashboard
```
URL: https://supabase.com/dashboard/project/zytxwdgzjqrcmbnpgofj
```
**Você verá:** Tela principal do projeto com menu lateral esquerdo

---

### PASSO 2: Localizar Menu "Edge Functions"
**Menu lateral ESQUERDO**, procure este ícone e texto:

```
☰ Menu Lateral
├─ 📊 Home
├─ 🗄️  Database
├─ 🔐 Authentication
├─ 📦 Storage
├─ ⚡ Edge Functions  ← CLIQUE AQUI
├─ 📈 Logs
└─ ⚙️  Settings
```

**Clique em:** `⚡ Edge Functions`

---

### PASSO 3: Encontrar "webhook-asaas"
**Você verá uma lista de funções:**

```
┌─────────────────────────────────────────┐
│ Edge Functions                          │
├─────────────────────────────────────────┤
│ 🟢 webhook-asaas          ← CLIQUE AQUI │
│ 🟢 calcular-comissoes                   │
│ 🟢 create-test-client                   │
│ 🟢 processar-pagamento-comissoes        │
└─────────────────────────────────────────┘
```

**Clique em:** `webhook-asaas`

---

### PASSO 4: Identificar ABAS no topo
**Depois de clicar em webhook-asaas, você verá ABAS no topo:**

```
┌─────────────────────────────────────────┐
│ webhook-asaas                           │
├─────────────────────────────────────────┤
│ [Details] [Logs] [Settings] [Metrics]  │  ← ESTAS ABAS
└─────────────────────────────────────────┘
```

**Veja as abas disponíveis e me diga quais aparecem para você!**

Possíveis abas:
- [ ] Details
- [ ] Logs
- [ ] Settings
- [ ] Configuration
- [ ] Metrics
- [ ] Invocations
- [ ] Outras? (me diga quais)

---

## 📍 PARTE 2: PROCURAR CONFIGURAÇÃO (DEPENDE DAS ABAS)

### CENÁRIO A: Se tiver aba "Settings"

**PASSO 5A:** Clique em `Settings`

**PASSO 6A:** Procure por uma destas SEÇÕES:

```
Settings
├─ Function Configuration
│  ├─ Verify JWT: [toggle]
│  ├─ Allow Anonymous Access: [toggle]  ← PROCURE ISTO
│  └─ CORS Settings: [...]
├─ Security
│  └─ Public Access: [toggle]  ← OU ISTO
└─ Advanced
```

**ME DIGA:** Quais seções você vê na aba Settings?

---

### CENÁRIO B: Se tiver aba "Configuration"

**PASSO 5B:** Clique em `Configuration`

**PASSO 6B:** Procure por:

```
Configuration
├─ Runtime Settings
├─ Authorization
│  └─ Require Authentication: [toggle]  ← PROCURE ISTO
└─ Environment Variables
```

**ME DIGA:** O que aparece na aba Configuration?

---

### CENÁRIO C: Se NÃO tiver Settings nem Configuration

**PASSO 5C:** Clique em `Details`

**PASSO 6C:** Role a página e procure por:

```
Details
├─ Function Info
│  ├─ Name: webhook-asaas
│  ├─ Region: ...
│  └─ Created: ...
├─ Configuration
│  └─ JWT Verification: Disabled ✓
└─ [Botão Edit] ou [Botão Configure]  ← PROCURE BOTÕES
```

**ME DIGA:** Você vê algum botão de "Edit", "Configure", ou "Manage"?

---

## 🔍 PARTE 3: O QUE PROCURAR (QUANDO ENCONTRAR AS CONFIGURAÇÕES)

Quando encontrar a área de configurações, procure por **UM DESTES TERMOS** (Ctrl+F na página):

### Lista de Termos para Buscar:
1. ✅ `anonymous` (anonymous access, allow anonymous, etc.)
2. ✅ `public` (public access, make public, etc.)
3. ✅ `auth` (require auth, authentication required, etc.)
4. ✅ `jwt` (verify jwt, jwt verification, etc.)
5. ✅ `cors` (CORS settings, allowed origins, etc.)
6. ✅ `invoke` (invoke permissions, who can invoke, etc.)
7. ✅ `external` (external access, allow external, etc.)

**O que queremos:**
- Toggle "Allow Anonymous Access" → **ENABLE (ON)**
- Ou toggle "Require Authentication" → **DISABLE (OFF)**
- Ou toggle "Verify JWT" → **DISABLE (OFF)** (já deve estar)
- Ou toggle "Public Access" → **ENABLE (ON)**

---

## 🎯 INSTRUÇÕES PARA VOCÊ AGORA

**NÃO tente fazer tudo sozinho ainda!**

Execute apenas **ATÉ O PASSO 4** e me responda:

### CHECKLIST PARA VOCÊ:
1. ✅ Acessou https://supabase.com/dashboard/project/zytxwdgzjqrcmbnpgofj ?
2. ✅ Clicou em "Edge Functions" no menu lateral?
3. ✅ Clicou em "webhook-asaas"?
4. ✅ Viu abas no topo?

### ME RESPONDA (copie e preencha):

```
ABAS QUE APARECEM NO TOPO:
[ ] Details
[ ] Logs
[ ] Settings
[ ] Configuration
[ ] Metrics
[ ] Outras: ____________

CONTEÚDO DA PÁGINA:
(Cole aqui uma descrição do que você vê, ou tire screenshot)
```

---

## ⚠️ IMPORTANTE

**Se você NÃO encontrar nenhuma opção de acesso/segurança:**

Isso pode significar que o Supabase **não permite configurar acesso público via Dashboard** (só via CLI/API).

Nesse caso, teríamos que tentar uma destas alternativas:

### ALTERNATIVA 1: Testar direto do ASAAS
- Configurar webhook no ASAAS Sandbox apontando para nossa URL
- ASAAS pode ter whitelist de IPs que bypassa o 403

### ALTERNATIVA 2: Usar Supabase CLI localmente
```bash
supabase functions serve webhook-asaas
# Isso roda local e não tem 403
```

### ALTERNATIVA 3: API de Management
- Usar API do Supabase para configurar a função
- Requer token de management (não temos ainda)

---

## 📸 TIRE SCREENSHOTS

Se possível, tire 2 screenshots:

1. **Screenshot 1:** Lista de Edge Functions (onde aparece webhook-asaas)
2. **Screenshot 2:** Página de detalhes do webhook-asaas (com as abas)

E me mande ou descreva o que aparece!

---

**RESUMO:** Execute até PASSO 4, me diga quais abas aparecem, e podemos continuar juntos a partir daí! 🎯
