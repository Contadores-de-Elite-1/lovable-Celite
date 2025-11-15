# 🔧 SOLUÇÕES ALTERNATIVAS - 403 em Edge Functions

**Se o Dashboard NÃO tiver opção de configuração de acesso público**

---

## 🎯 SOLUÇÃO 1: Verificar Configurações de PROJETO (não da função)

### O 403 pode vir de configurações GLOBAIS do projeto, não da função específica

### PASSO A PASSO:

**1.** No Dashboard, vá para `Settings` (menu lateral, lá embaixo)

**2.** Clique em `API` (submenu)

**3.** Procure por seções:

```
API Settings
├─ Project URL
│  └─ https://zytxwdgzjqrcmbnpgofj.supabase.co
├─ API Keys
│  ├─ anon/public: eyJhbGci...
│  └─ service_role: eyJhbGci...
├─ API Gateway  ← PROCURE AQUI
│  ├─ Rate Limiting
│  ├─ IP Restrictions  ← ISTO PODE BLOQUEAR
│  └─ Allowed Origins (CORS)  ← OU ISTO
└─ Edge Functions
   └─ Global Settings  ← OU AQUI
```

### O QUE PROCURAR:

**IP Restrictions:**
- Se tiver uma lista de IPs permitidos → pode estar bloqueando
- Solução: Adicionar `0.0.0.0/0` (permite todos) OU remover restrição

**Allowed Origins (CORS):**
- Se tiver lista restrita → pode bloquear
- Solução: Adicionar `*` (permite todos)

**Rate Limiting:**
- Se estiver muito restritivo → pode bloquear
- Solução: Aumentar limites ou desabilitar temporariamente

---

## 🎯 SOLUÇÃO 2: Testar pelo ASAAS Sandbox (Bypass)

### O ASAAS pode ter IPs whitelistados no Supabase automaticamente

### PASSO A PASSO:

**1.** Acesse ASAAS Sandbox: https://sandbox.asaas.com

**2.** Vá em: `Configurações` → `Webhooks`

**3.** Adicione novo webhook:
```
URL: https://zytxwdgzjqrcmbnpgofj.supabase.co/functions/v1/webhook-asaas
Eventos: PAYMENT_RECEIVED, PAYMENT_CONFIRMED
```

**4.** Crie uma cobrança de teste:
```
Cliente: Qualquer (pode criar um teste)
Valor: R$ 1,00
Vencimento: Hoje
Forma: PIX
```

**5.** Marque como "Recebida" manualmente

**6.** ASAAS enviará webhook → Pode funcionar mesmo com 403 em testes manuais!

**VANTAGEM:** IPs do ASAAS podem estar whitelistados automaticamente no Supabase

---

## 🎯 SOLUÇÃO 3: Usar Supabase CLI Local (Desenvolvimento)

### Rodar a função localmente (sem limitações de cloud)

### PASSO A PASSO:

**1.** Instalar Supabase CLI (se não tiver):
```bash
# Linux/Mac
curl -fsSL https://raw.githubusercontent.com/supabase/supabase/main/install.sh | sh

# Verificar
supabase --version
```

**2.** Login:
```bash
supabase login
# Vai abrir navegador para autenticar
```

**3.** Link com projeto:
```bash
cd /home/user/lovable-Celite
supabase link --project-ref zytxwdgzjqrcmbnpgofj
```

**4.** Servir função localmente:
```bash
supabase functions serve webhook-asaas --env-file .env.claude
# Vai rodar em http://localhost:54321/functions/v1/webhook-asaas
```

**5.** Testar localmente:
```bash
curl -X POST http://localhost:54321/functions/v1/webhook-asaas \
  -H "Content-Type: application/json" \
  -d '{
    "id": "evt_local_test_001",
    "event": "PAYMENT_RECEIVED",
    "payment": {
      "id": "pay_local_001",
      "customer": "cus_000007222099",
      "value": 199.90,
      "netValue": 197.90,
      "status": "RECEIVED",
      "billingType": "PIX",
      "dateCreated": "2025-01-15T00:00:00Z"
    }
  }'
```

**VANTAGEM:**
- Testa o código completamente
- Sem limitações de 403
- Logs em tempo real no terminal

**DESVANTAGEM:**
- Precisa estar rodando localmente
- ASAAS não consegue chamar localhost (só para testes manuais)

---

## 🎯 SOLUÇÃO 4: Usar ngrok para Tunelamento (Exposição Local)

### Expor função local para internet (ASAAS consegue chamar)

### PASSO A PASSO:

**1.** Instalar ngrok:
```bash
# Linux
wget https://bin.equinox.io/c/bNyj1mQVY4c/ngrok-v3-stable-linux-amd64.tgz
tar -xvzf ngrok-v3-stable-linux-amd64.tgz
sudo mv ngrok /usr/local/bin/
```

**2.** Autenticar ngrok (grátis):
```bash
ngrok authtoken SEU_TOKEN_AQUI
# Pegar token em: https://dashboard.ngrok.com/get-started/your-authtoken
```

**3.** Rodar Supabase local (terminal 1):
```bash
cd /home/user/lovable-Celite
supabase functions serve webhook-asaas --env-file .env.claude
# Rodando em http://localhost:54321
```

**4.** Rodar ngrok (terminal 2):
```bash
ngrok http 54321
# Vai gerar URL pública: https://xxxx-yyyy-zzzz.ngrok.io
```

**5.** Configurar webhook no ASAAS com URL do ngrok:
```
URL: https://xxxx-yyyy-zzzz.ngrok.io/functions/v1/webhook-asaas
```

**VANTAGEM:**
- ASAAS consegue chamar de fora
- Você vê logs em tempo real
- Sem limitação de 403

**DESVANTAGEM:**
- Precisa manter 2 terminais abertos
- URL muda toda vez que reinicia ngrok (plano grátis)

---

## 🎯 SOLUÇÃO 5: Criar Proxy Reverso Simples

### Criar uma Cloud Function em outro provedor (sem limitações) que repassa para Supabase

### Opções de Provedor:
- **Vercel** (grátis, fácil)
- **Netlify** (grátis, fácil)
- **Railway** (grátis até certo ponto)

### EXEMPLO: Vercel

**1.** Criar `api/webhook-proxy.js`:
```javascript
export default async function handler(req, res) {
  const SUPABASE_URL = 'https://zytxwdgzjqrcmbnpgofj.supabase.co';
  const SERVICE_ROLE_KEY = 'eyJhbGci...'; // Sua service_role

  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/webhook-asaas`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify(req.body),
    });

    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
```

**2.** Deploy:
```bash
npm i -g vercel
vercel login
vercel deploy
# URL: https://seu-projeto.vercel.app/api/webhook-proxy
```

**3.** Configurar ASAAS para chamar Vercel:
```
URL: https://seu-projeto.vercel.app/api/webhook-proxy
```

**VANTAGEM:**
- Totalmente gerenciado
- Sem limitações
- HTTPS grátis

**DESVANTAGEM:**
- Mais uma camada de complexidade
- Latência adicional (~50-100ms)

---

## 🎯 SOLUÇÃO 6: Verificar Logs do Supabase (Debugging)

### Talvez o 403 seja de OUTRA coisa (não acesso público)

### PASSO A PASSO:

**1.** Dashboard → `Logs` (menu lateral)

**2.** Selecionar `Edge Functions`

**3.** Filtrar por `webhook-asaas`

**4.** Procurar por logs de erro com timestamp das nossas tentativas

**O QUE PROCURAR:**
```
Logs possíveis:
- "Access denied: IP not whitelisted"
- "Access denied: Invalid origin"
- "Access denied: Rate limit exceeded"
- "Access denied: JWT required" (não deveria aparecer)
- Outros erros específicos
```

**SE ENCONTRAR ERRO ESPECÍFICO:** Me diga qual é, posso ajudar!

---

## 🎯 SOLUÇÃO 7: Contatar Suporte Supabase (Última Opção)

### Se nada funcionar, pode ser limitação do plano

**1.** Verificar plano atual:
- Dashboard → Settings → Billing
- Plano Free pode ter limitações de Edge Functions

**2.** Abrir ticket:
- https://supabase.com/dashboard/support
- Descrever problema: "Edge Functions retornam 403 mesmo com verify_jwt=false"

**3.** Ou usar Discord do Supabase:
- https://discord.supabase.com
- Canal #help
- Perguntar: "Edge Functions 403 even with verify_jwt=false, config.toml set correctly"

---

## 📊 RESUMO DAS SOLUÇÕES (ORDEM DE PRIORIDADE)

| # | Solução | Tempo | Dificuldade | Efetividade |
|---|---------|-------|-------------|-------------|
| 1 | Verificar Settings → API do projeto | 2 min | Fácil | Alta |
| 2 | Testar via ASAAS Sandbox direto | 5 min | Fácil | Alta |
| 6 | Verificar Logs do Supabase | 3 min | Fácil | Média |
| 3 | Supabase CLI Local | 10 min | Médio | Alta |
| 4 | ngrok + Local | 15 min | Médio | Alta |
| 5 | Proxy Vercel | 20 min | Médio | Muito Alta |
| 7 | Suporte Supabase | ? | Fácil | Baixa |

---

## 🚀 RECOMENDAÇÃO

**TENTE NESTA ORDEM:**

1. ✅ **Settings → API** (verificar IP/CORS restrictions) - 2 min
2. ✅ **Verificar Logs** (pode revelar causa exata) - 3 min
3. ✅ **Teste via ASAAS Sandbox** (pode funcionar por whitelist) - 5 min
4. ✅ **Supabase CLI Local** (valida que código funciona) - 10 min

Se chegou aqui e NADA funcionou → Problema é realmente de infraestrutura Supabase específica do projeto.

---

**PRÓXIMO PASSO:** Me diga o que você encontrou no Dashboard (usando o GUIA-DASHBOARD-PASSO-A-PASSO.md) e podemos escolher a melhor solução alternativa!
