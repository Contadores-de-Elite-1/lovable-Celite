# 📱 COMO VER AS TELAS DO ONBOARDING

## 🚀 ACESSO

O servidor já está rodando em: **http://localhost:8080**

Para acessar o onboarding, use a URL:

```
http://localhost:8080/onboarding/teste
```

Ou qualquer outro link (ex: `pedro`, `demo`, `abc123`). O sistema está usando dados MOCK para testes.

---

## 🎨 TELAS DISPONÍVEIS

### **Tela 1: Welcome (Boas-vindas)**
- Logo do contador (placeholder temporário)
- Título e descrição
- 4 cards de benefícios (Rápido, Seguro, Crescimento, Suporte)
- Lista do que será necessário
- Tempo estimado
- Botão "Começar Cadastro"

**Ações:**
- Clique em "Começar Cadastro" → vai para Tela 2

---

### **Tela 2: Plan Selection (Escolha do Plano)**
- 3 cards de planos:
  - **Plano PRO** - R$ 100/mês
  - **Plano PREMIUM** - R$ 130/mês ⭐ (Recomendado)
  - **Plano TOP** - R$ 180/mês
- Cada card mostra features
- Seleção visual com checkbox
- Progress bar no topo mostrando "Etapa 2 de 6"

**Ações:**
- Clique em um card → seleciona o plano
- Clique em "Continuar" → vai para Tela 3 (em desenvolvimento)
- Clique em "← Voltar" → volta para Tela 1

---

## 📊 PROGRESS BAR

No topo de cada tela você verá:
- Barra de progresso visual (0-100%)
- "Etapa X de 6"
- "X% completo"
- Indicadores de etapas (bolinhas coloridas)
- Nome da etapa atual

---

## 🎨 DESIGN RESPONSIVO

Teste em diferentes tamanhos de tela:

### **Mobile (< 768px)**
- Cards de planos empilhados (1 coluna)
- Layout vertical otimizado
- Sidebar escondido
- Progress bar compacto

### **Desktop (≥ 768px)**
- Cards de planos lado a lado (3 colunas)
- Layout horizontal
- Mais espaçamento

---

## 🔍 O QUE TESTAR

### **Tela 1 (Welcome)**
- [ ] Logo do contador aparece?
- [ ] Texto está legível?
- [ ] 4 cards de benefícios aparecem?
- [ ] Botão responde ao click?
- [ ] Animação de fade-in acontece?

### **Tela 2 (Plan Selection)**
- [ ] 3 cards de planos aparecem?
- [ ] Badge "Recomendado" no PREMIUM?
- [ ] Seleção visual funciona (checkbox)?
- [ ] Preços corretos (100, 130, 180)?
- [ ] Features listadas corretamente?
- [ ] Botão "Continuar" só habilita após selecionar?
- [ ] Botão "Voltar" funciona?

### **Progress Bar**
- [ ] Barra visual atualiza?
- [ ] Porcentagem correta (17% → 33%)?
- [ ] Nome da etapa atualiza?
- [ ] Indicadores de etapas corretos?

---

## 🐛 POSSÍVEIS PROBLEMAS

### **Tela branca**
- Verifique o console do navegador (F12)
- Erro de import? Verifique os arquivos

### **Estilo quebrado**
- TailwindCSS não carregou?
- Verifique se `pnpm dev` está rodando

### **API Mock não funciona**
- Normal! Estamos usando dados fake
- A API real será implementada no backend

---

## 📸 SCREENSHOTS

### **Tela 1 - Welcome**
```
┌────────────────────────────────────────┐
│ [LOGO] Pedro Guilherme Contabilidade   │
├────────────────────────────────────────┤
│ ▓▓░░░░ 17% completo (Etapa 1 de 6)    │
├────────────────────────────────────────┤
│                                        │
│     Bem-vindo ao Lovable-Celite!      │
│   Complete seu cadastro para começar   │
│                                        │
│  ┌─────────────────────────────────┐  │
│  │ Gerencie sua contabilidade...   │  │
│  └─────────────────────────────────┘  │
│                                        │
│  ┌───────┬───────┐ ┌───────┬───────┐ │
│  │ ⚡    │ 🛡️    │ │ 📈    │ ✅    │ │
│  │Rápido │Seguro │ │Cresce │Suport │ │
│  └───────┴───────┘ └───────┴───────┘ │
│                                        │
│  ℹ️ Você precisará de:                 │
│  ✓ CNPJ, ✓ Documentos, ✓ Email        │
│                                        │
│  ⏱️ Tempo: 3-5 minutos                 │
│                                        │
│  [    Começar Cadastro    ]           │
│                                        │
└────────────────────────────────────────┘
```

### **Tela 2 - Plan Selection**
```
┌──────────────────────────────────────────────┐
│ [LOGO] Pedro Guilherme Contabilidade         │
├──────────────────────────────────────────────┤
│ ▓▓▓▓░░ 33% completo (Etapa 2 de 6)          │
├──────────────────────────────────────────────┤
│                                              │
│         Escolha seu plano                    │
│  Todos incluem 30 dias de teste gratuito    │
│                                              │
│ ┌──────┐  ┌──────────┐  ┌──────┐           │
│ │ PRO  │  │⭐PREMIUM │  │ TOP  │            │
│ │      │  │          │  │      │            │
│ │R$ 100│  │ R$ 130   │  │R$ 180│            │
│ │ /mês │  │  /mês    │  │ /mês │            │
│ │      │  │          │  │      │            │
│ │✓ 1   │  │✓ 3 emps  │  │✓ Ilim│            │
│ │✓Email│  │✓ Prior.  │  │✓ 24/7│            │
│ │✓Basic│  │✓ Avançado│  │✓Custo│            │
│ └──────┘  └──────────┘  └──────┘           │
│                                              │
│ 💡 Todos incluem suporte completo...        │
│                                              │
│ [← Voltar]          [Continuar →]          │
│                                              │
└──────────────────────────────────────────────┘
```

---

## 🚀 PRÓXIMAS ETAPAS

Após testar as Telas 1 e 2, vou continuar com:

**Tela 3 - Data Upload:**
- Formulário com CNPJ (validação)
- Campos: Nome empresa, Email, Telefone
- Endereço completo (CEP com ViaCEP)
- Upload de 3 documentos
- Validação em tempo real

---

## 💻 COMANDOS ÚTEIS

```bash
# Parar o servidor
Ctrl + C (no terminal onde rodou pnpm dev)

# Reiniciar o servidor
pnpm dev

# Ver logs
Abra o console do navegador (F12)
```

---

**Pronto para testar!** 🎉

Acesse: **http://localhost:8080/onboarding/teste**

