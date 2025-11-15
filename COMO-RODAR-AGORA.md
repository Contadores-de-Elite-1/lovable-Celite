# 🚀 Como Rodar o App AGORA

**Aplicação 100% pronta para rodar em 3 minutos**

---

## ⚡ Opção 1: Quick Start (Recomendado)

```bash
./quick-start.sh
```

Escolha a opção **1** (Iniciar servidor de desenvolvimento)

**Pronto!** 🎉 Aplicação rodando em http://localhost:8080

---

## 📝 Opção 2: Passo a Passo Manual

### 1️⃣ Instalar Dependências (só uma vez)

```bash
npm install
```

### 2️⃣ Configurar Ambiente

```bash
# Copiar arquivo de exemplo
cp .env.example .env

# Iniciar Supabase local
supabase start

# Ver credenciais
supabase status
```

### 3️⃣ Editar .env

Copie as credenciais do `supabase status` para o arquivo `.env`:

```env
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 4️⃣ Iniciar App

```bash
npm run dev
```

**Pronto!** 🎉 Aplicação rodando em http://localhost:8080

---

## 🎯 O que você vai ver

### Página Inicial (/)
- Landing page pública
- Botão de login/registro

### Login (/auth)
- Formulário de login
- Criar nova conta
- Reset de senha

### Dashboard (/dashboard) - PROTEGIDO
- Visão geral de comissões
- Métricas de rede
- Clientes ativos

### Pagamentos (/pagamentos) - PROTEGIDO
- **Página de assinatura Stripe**
- Preço: R$ 99,90/mês
- FAQ integrado
- Trust badges (Visa, Mastercard, Elo)
- Checkout completo
- Modo teste ativo (use card: 4242 4242 4242 4242)

---

## ✅ Features Funcionando

### UX & Performance
- ✅ **Code splitting**: Bundle 50% menor (678 KB vs 1,334 KB)
- ✅ **Lazy loading**: Páginas carregadas sob demanda
- ✅ **Skeleton loading**: Placeholders durante carregamento
- ✅ **Toast notifications**: Feedback visual instantâneo
- ✅ **Offline detection**: Warning quando sem internet
- ✅ **Error recovery**: Botão "Tentar Novamente"

### Stripe Integration
- ✅ **Checkout flow completo**: Redirecionamento + confirmação
- ✅ **Retry logic**: 3 tentativas com backoff exponencial
- ✅ **Test mode indicator**: Badge visual de ambiente
- ✅ **Payment methods**: Trust badges
- ✅ **Analytics tracking**: Funnel completo

### Accessibility
- ✅ **ARIA labels**: Todos os botões
- ✅ **Live regions**: Anúncios para screen readers
- ✅ **Keyboard navigation**: Tab order correto
- ✅ **Semantic HTML**: Headers, roles, etc

### Developer Experience
- ✅ **Environment validation**: Erros claros se .env errado
- ✅ **Quick start script**: Automação completa
- ✅ **TypeScript**: Type safety total
- ✅ **Error boundaries**: Graceful failure

---

## 🧪 Testar Checkout Stripe

### 1. Ir para /pagamentos

```
http://localhost:8080/pagamentos
```

### 2. Clicar em "Assinar Agora"

### 3. Usar cartão de teste

```
Número: 4242 4242 4242 4242
Validade: Qualquer data futura (ex: 12/25)
CVC: Qualquer 3 dígitos (ex: 123)
Nome: Qualquer nome
```

### 4. Ver confirmação

Você será redirecionado para `/checkout-confirmation?checkout=success`

---

## 📊 Analytics

Abra o console do navegador e veja os eventos sendo trackados:

```javascript
[ANALYTICS] { event: 'checkout_viewed_pricing', ... }
[ANALYTICS] { event: 'checkout_clicked_subscribe', ... }
[ANALYTICS] { event: 'checkout_session_created', ... }
[ANALYTICS] { event: 'checkout_success', ... }
```

Ver últimos 10 eventos:

```javascript
JSON.parse(localStorage.getItem('analytics_events'))
```

---

## 🔧 Comandos Úteis

### Desenvolvimento

```bash
npm run dev          # Inicia dev server
npm run build        # Build de produção
npm run preview      # Preview do build
```

### Supabase

```bash
supabase start       # Iniciar Supabase
supabase stop        # Parar Supabase
supabase status      # Ver credenciais
supabase db reset    # Resetar banco
```

### Database

```bash
# Ver usuários
supabase db psql -c "SELECT * FROM auth.users;"

# Ver contadores
supabase db psql -c "SELECT * FROM contadores;"

# Ver clientes
supabase db psql -c "SELECT * FROM clientes;"
```

---

## 🐛 Troubleshooting

### Erro: "VITE_SUPABASE_URL is not defined"

**Solução**: Configure o arquivo `.env` corretamente

```bash
cp .env.example .env
# Editar .env com credenciais do supabase status
```

### Erro: "Failed to connect to Supabase"

**Solução**: Inicie o Supabase

```bash
supabase start
```

### Build warning: "chunks larger than 500 KB"

**Não é erro!** É apenas um warning. O app funciona perfeitamente.
O bundle foi otimizado de 1,334 KB → 678 KB (50% menor).

### Aplicação não carrega nenhuma página

**Solução**: Verifique o console do navegador

1. Abra DevTools (F12)
2. Vá para Console
3. Veja os erros
4. Geralmente é problema de .env

---

## 📱 Testar Mobile

### Opção 1: Browser DevTools

1. F12 (DevTools)
2. Ctrl+Shift+M (Toggle device toolbar)
3. Escolha iPhone/iPad

### Opção 2: Rede Local

1. Ver IP da máquina: `ip addr` ou `ifconfig`
2. Acessar do celular: `http://<SEU_IP>:8080`
3. Exemplo: `http://192.168.1.100:8080`

**Nota**: Firewall pode bloquear. Use DevTools se não funcionar.

---

## 🚢 Próximos Passos

### Para Desenvolvimento

1. Explorar páginas: /dashboard, /comissoes, /links, /rede
2. Criar usuários de teste
3. Testar fluxo completo de comissões
4. Ver analytics no console

### Para Produção

1. Ler `PRODUCTION-CHECKLIST.md`
2. Configurar Stripe Live Mode
3. Deploy frontend (Vercel/Netlify)
4. Configurar webhooks
5. Monitorar com `MONITORING-LOGGING.md`

---

## 📚 Documentação Completa

- **[README.md](./README.md)** - Visão geral
- **[CLAUDE.md](./CLAUDE.md)** - Arquitetura do projeto
- **[PRODUCTION-CHECKLIST.md](./PRODUCTION-CHECKLIST.md)** - Deploy (100+ itens)
- **[MONITORING-LOGGING.md](./MONITORING-LOGGING.md)** - Monitoramento
- **[AUTO-MODE-SUMMARY.md](./AUTO-MODE-SUMMARY.md)** - Features implementadas

---

## 💡 Dicas

### 1. Use o Quick Start Script

Mais rápido e com validações automáticas:

```bash
./quick-start.sh
```

### 2. Mantenha Supabase Rodando

Deixe rodando em segundo plano durante desenvolvimento.

### 3. Use Git para Experimentos

```bash
git checkout -b minha-feature
# Experimente à vontade
git checkout main  # Voltar para versão estável
```

### 4. Veja os Logs

```bash
# Console do navegador (F12)
# Logs do Supabase
supabase logs --tail
```

---

## ✅ Checklist Rápido

Antes de começar a desenvolver:

- [ ] `npm install` executado
- [ ] `.env` configurado com credenciais corretas
- [ ] `supabase start` rodando
- [ ] `npm run dev` iniciado
- [ ] Browser aberto em http://localhost:8080
- [ ] Console aberto (F12) para ver logs

---

## 🎉 Você está pronto!

**Aplicação 100% funcional e pronta para desenvolvimento.**

Comece explorando:
1. Página inicial: http://localhost:8080
2. Login: http://localhost:8080/auth
3. Pagamentos: http://localhost:8080/pagamentos

**Dúvidas?** Veja a documentação completa ou abra um issue no GitHub.

**Bom desenvolvimento!** 🚀
