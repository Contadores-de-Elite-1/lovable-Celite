# 🎯 ONBOARDING DO CONTADOR

**Fase 0, 0.1 e 0.2 - Primeira experiência do contador na plataforma**

---

## 📍 QUANDO ACONTECE

Este onboarding é apresentado **APENAS NA PRIMEIRA VEZ** que o contador faz login após criar sua conta.

---

## 🎨 3 TELAS IMPLEMENTADAS

### **TELA 1: BOAS-VINDAS (Fase 0.1)**

**Objetivo:** Apresentar o programa e motivar o contador

**Elementos:**
- ✅ Header com ícone Sparkles
- ✅ Título "Bem-vindo ao Programa Contadores de Elite"
- ✅ Subtitle persuasivo

**4 Cards de Benefícios:**
1. 💰 **Ganhe até 100% no 1º Pagamento**
   - Verde: Bônus de Ativação
   
2. 📈 **Comissões Recorrentes de 15%-20%**
   - Azul: Renda passiva

3. 🏆 **17 Tipos de Bonificações**
   - Roxo: Bônus múltiplos

4. 👥 **Evolução por Performance**
   - Laranja: Sistema de níveis

**Seção Níveis:**
- Grid com 4 níveis (Bronze, Prata, Ouro, Diamante)
- Emojis, range de clientes, percentuais

**Exemplo Prático:**
- Box azul com cálculo real
- 1 cliente → R$ 333,72/ano

**CTA:** Botão "Continuar" → Tela 2

---

### **TELA 2: COMO VOCÊ VAI RECEBER (Fase 0.2)**

**Objetivo:** Explicar sistema de pagamentos e tranquilizar

**Destaque Principal:**
- Banner verde (gradiente)
- "Pagamentos via Stripe"
- 3 números grandes:
  - 25 (Dia do pagamento)
  - 2-3 (Dias para cair)
  - 100% (Automático)

**4 Benefícios com Ícones:**
1. ⏰ **Receba SEMPRE no dia 25**
   - Previsibilidade

2. 💰 **Direto na sua conta bancária**
   - PIX automático

3. ✅ **Totalmente automático**
   - Sem solicitar saque

4. 🛡️ **Transparência total no app**
   - Dashboard em tempo real

**Alerta Valor Mínimo:**
- Box amarelo
- R$ 100 mínimo
- Acumulação automática

**Timeline de Pagamento:**
- 4 passos visuais
- Do contrato até dinheiro na conta

**CTA:** Botão verde "Conectar Conta Stripe" → Tela 3

---

### **TELA 3: CONECTAR STRIPE (Fase 0.3)**

**Objetivo:** Preparar para conexão Stripe

**Lista de Requisitos:**
- Box azul com checklist
- 5 itens necessários:
  - CPF/CNPJ
  - Nome/Razão Social
  - Data nascimento (PF)
  - Telefone/Endereço
  - Dados bancários

**Badge de Segurança:**
- Box verde
- Ícone Shield
- "100% Seguro"
- Explicação sobre Stripe

**CTA:** Botão "Conectar com Stripe"
- Loading state
- Redirecionamento (futuro: iframe Stripe)

---

## 🔧 IMPLEMENTAÇÃO TÉCNICA

### **Componente:** `ContadorOnboarding.tsx`

```typescript
// Estado gerencia 3 etapas
const [etapa, setEtapa] = useState(1);

// 3 componentes internos
TelaBoasVindas()    // Etapa 1
TelaRecebimento()   // Etapa 2
TelaConectarStripe() // Etapa 3
```

### **Rota:** `/onboarding-contador`

```typescript
<Route path="/onboarding-contador" element={<ContadorOnboarding />} />
```

### **Fluxo:**
1. Contador cria conta → Login
2. Sistema detecta: `first_login = true`
3. Redireciona para `/onboarding-contador`
4. Após completar → `first_login = false`
5. Redireciona para `/dashboard`

---

## 🎨 DESIGN

### **Paleta de Cores:**
- **Verde:** Pagamentos, dinheiro, sucesso
- **Azul/Indigo:** Programa, confiança, profissional
- **Roxo:** Bonificações, prêmios
- **Laranja/Âmbar:** Evolução, performance
- **Amarelo:** Avisos, informações importantes

### **Ícones Lucide:**
- `Sparkles` - Boas-vindas
- `DollarSign` - Dinheiro
- `TrendingUp` - Crescimento
- `Award` - Bonificações
- `Users` - Rede
- `CreditCard` - Pagamentos
- `Shield` - Segurança
- `Clock` - Tempo/Prazo
- `CheckCircle2` - Confirmações

### **Layout:**
- Gradiente de fundo: `from-indigo-50 via-white to-blue-50`
- Cards com shadow suave
- Bordas arredondadas (`rounded-xl`)
- Espaçamento generoso
- Mobile-first responsivo

---

## 📊 MÉTRICAS DE SUCESSO

### **O que queremos medir:**
- ✅ Taxa de conclusão (% que chega até Tela 3)
- ✅ Tempo médio gasto em cada tela
- ✅ Taxa de conexão Stripe
- ✅ Taxa de abandono por tela

### **Dados a registrar:**
```typescript
onboarding_contador_analytics {
  contador_id,
  tela_atual,
  tempo_tela_1,
  tempo_tela_2,
  tempo_tela_3,
  completou,
  stripe_conectado,
  data_inicio,
  data_conclusao
}
```

---

## 🚀 PRÓXIMOS PASSOS

### **Implementações Futuras:**

1. **Edge Function: `create-stripe-account`**
   ```typescript
   // Cria Connected Account no Stripe
   POST https://api.stripe.com/v1/accounts
   // Retorna: { account_id, onboarding_url }
   ```

2. **Iframe Embed Stripe**
   ```typescript
   // Carregar onboarding do Stripe dentro do app
   <iframe src={stripeOnboardingUrl} />
   ```

3. **Callback após Stripe**
   ```typescript
   // Stripe redireciona de volta
   /onboarding-contador/stripe-callback?account_id=acct_xxx
   // Sistema salva e marca como completo
   ```

4. **Detecção de First Login**
   ```typescript
   // No Auth.tsx após login bem-sucedido
   if (contador.first_login) {
     navigate('/onboarding-contador');
   } else {
     navigate('/dashboard');
   }
   ```

5. **Persistência de Progresso**
   ```typescript
   // Se contador sair no meio
   // Sistema salva última etapa
   // Retorna onde parou
   ```

---

## 🧪 COMO TESTAR AGORA

### **1. Acessar diretamente:**
```
http://localhost:8080/onboarding-contador
```

### **2. Navegar pelas 3 telas:**
- Tela 1 → Clicar "Continuar"
- Tela 2 → Clicar "Conectar Conta Stripe"
- Tela 3 → Clicar "Conectar com Stripe" (simula 2s)
- Redireciona para `/dashboard`

### **3. Verificar responsividade:**
- Desktop (≥ 1024px): Grid 2-4 colunas
- Tablet (768-1023px): Grid 2 colunas
- Mobile (< 768px): 1 coluna

---

## 📝 CONTEÚDO (Copywriting)

### **Tom de Voz:**
- ✅ Motivador e entusiasmado
- ✅ Transparente sobre pagamentos
- ✅ Números concretos (não promessas vagas)
- ✅ Segurança e confiança

### **Palavras-chave:**
- "Automático"
- "Transparente"
- "Recorrente"
- "Escalável"
- "Seguro"
- "Dia 25" (âncora temporal)

---

## ✅ CHECKLIST DE IMPLEMENTAÇÃO

### **Frontend:**
- [x] Tela 1: Boas-vindas completa
- [x] Tela 2: Recebimento completa
- [x] Tela 3: Conectar Stripe (placeholder)
- [x] Navegação entre telas
- [x] Rota `/onboarding-contador`
- [x] Design responsivo
- [x] Sem erros de linting

### **Backend (Pendente):**
- [ ] Edge Function: `create-stripe-account`
- [ ] Lógica de first_login
- [ ] Callback Stripe
- [ ] Analytics de onboarding
- [ ] Persistência de progresso

### **Integrações (Pendente):**
- [ ] Stripe Connect Account
- [ ] Iframe embed Stripe onboarding
- [ ] Webhook callback success
- [ ] Atualização `stripe_account_id` no banco

---

## 🎯 RESULTADO ESPERADO

Após completar este onboarding, o contador deve:
- ✅ Entender completamente como funciona o programa
- ✅ Saber exatamente quando e como vai receber
- ✅ Ter conta Stripe conectada e pronta
- ✅ Estar motivado a começar a indicar clientes
- ✅ Sentir confiança e segurança no sistema

---

## 📚 ARQUIVOS RELACIONADOS

- `src/pages/ContadorOnboarding.tsx` - Componente principal
- `src/App.tsx` - Rota configurada
- `docs/FLUXO_FINANCEIRO_SIMPLES.md` - Explicação detalhada de pagamentos
- `docs/Regras do Programa` - Regras oficiais

---

**Status:** ✅ Frontend completo, aguardando integração Stripe

