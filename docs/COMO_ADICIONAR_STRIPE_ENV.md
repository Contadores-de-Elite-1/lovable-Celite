# 📁 COMO ADICIONAR CREDENCIAIS STRIPE NO .env.local

## 🎯 OBJETIVO

Adicionar as credenciais Stripe no arquivo `.env.local` para que o app funcione.

---

## 📂 ABRIR ARQUIVO .env.local

### **Opção 1: Via Cursor (RECOMENDADO)**

Clique no link abaixo para abrir a pasta do projeto:

**[📁 Abrir /lovable-Celite](.)**

Depois dentro do projeto, procure ou crie o arquivo `.env.local` na **RAIZ do projeto**:

```
/Users/PedroGuilherme/Cursor/celite-app-atual /lovable-Celite/.env.local
```

Se o arquivo não existir, crie um novo arquivo chamado `.env.local` na raiz.

---

### **Opção 2: Abrir no Cursor**

1. **Pressione:** `Ctrl+K` (ou `Cmd+K` no Mac)
2. **Digite:** `.env.local`
3. **Enter**

Vai abrir ou criar o arquivo.

---

## 📝 CONTEÚDO DO .env.local

Copie e cole este conteúdo no arquivo `.env.local`:

```env
# SUPABASE
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anonima

# STRIPE - CHAVES PÚBLICAS (Frontend)
VITE_STRIPE_PUBLIC_KEY=pk_test_sua_chave_aqui

# STRIPE - PRICE IDs
STRIPE_PRICE_PRO=price_1Abc123XXX
STRIPE_PRICE_PREMIUM=price_1Def456YYY
STRIPE_PRICE_TOP=price_1Ghi789ZZZ
```

---

## 🔑 PREENCHER COM SUAS CREDENCIAIS STRIPE

### **1. VITE_STRIPE_PUBLIC_KEY**

1. Abrir: https://dashboard.stripe.com/apikeys
2. Em **Test Mode**, copiar **Publishable key** (começa com `pk_test_`)
3. Colar aqui:
```
VITE_STRIPE_PUBLIC_KEY=pk_test_COLE_AQUI
```

---

### **2. STRIPE_PRICE_PRO**

1. Abrir: https://dashboard.stripe.com/products
2. Clique no produto **PRO**
3. Em "Pricing" → Copiar o **Price ID** (começa com `price_`)
4. Colar aqui:
```
STRIPE_PRICE_PRO=price_COLE_AQUI
```

---

### **3. STRIPE_PRICE_PREMIUM**

1. Na mesma página
2. Clique no produto **PREMIUM**
3. Copiar o **Price ID**
4. Colar aqui:
```
STRIPE_PRICE_PREMIUM=price_COLE_AQUI
```

---

### **4. STRIPE_PRICE_TOP**

1. Na mesma página
2. Clique no produto **TOP**
3. Copiar o **Price ID**
4. Colar aqui:
```
STRIPE_PRICE_TOP=price_COLE_AQUI
```

---

## 📋 EXEMPLO FINAL

Seu `.env.local` deve parecer assim:

```env
# SUPABASE
VITE_SUPABASE_URL=https://zytxwdgzjqrcmbnpgofj.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# STRIPE - CHAVES PÚBLICAS
VITE_STRIPE_PUBLIC_KEY=pk_test_51Abc123xyzABC123

# STRIPE - PRICE IDs
STRIPE_PRICE_PRO=price_1Pr1XYZABC123
STRIPE_PRICE_PREMIUM=price_1Pr2XYZABC123
STRIPE_PRICE_TOP=price_1Pr3XYZABC123
```

---

## ✅ VERIFICAR SE FUNCIONOU

Após salvar o arquivo:

1. **Reload do servidor:**
   ```bash
   pnpm dev
   ```

2. **Abrir DevTools** (F12)

3. **Console:** Não deve ter erro sobre `VITE_STRIPE_PUBLIC_KEY`

4. **Testar:**
   - Abrir qualquer página
   - Não deve dar erro de Stripe

---

## ⚠️ IMPORTANTE

- ✅ `.env.local` **NÃO** é commitado (está em `.gitignore`)
- ✅ Valores são **locais apenas** (não vai para GitHub)
- ✅ Cada desenvolvedor tem seu próprio `.env.local`
- ✅ Guardar seguro!

---

## 🚀 PRÓXIMO PASSO

Depois de adicionar as credenciais:

1. ✅ Restart `pnpm dev`
2. ✅ Testar se funciona
3. ✅ Me avisar ✅
4. ✅ Começar US5.2 (Webhook Stripe)

---

**Precisando de ajuda?** Posso criar o arquivo `.env.local` para você com as variáveis vazias se preferir.



