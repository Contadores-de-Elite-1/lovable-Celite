# 💳 Asaas Gateway Testing - Guia Prático

**Status**: Ready for Integration Testing
**Date**: Nov 14, 2025
**Environment**: Sandbox (no real money!)

---

## 🎯 Objetivo

Testar o fluxo COMPLETO de pagamento com Asaas de forma prática:

```
Criar Cliente → Criar Subscription → Pagamento → Webhook → Comissão
```

**Cenários**:
- ✅ Usuário cria cliente no Asaas
- ✅ Cliente assina serviço (subscription)
- ✅ Asaas envia webhook de pagamento confirmado
- ✅ Sistema calcula comissão corretamente
- ✅ Usuário vê saldo de comissão

---

## 🚀 Setup Inicial (5 min)

### 1. Criar Conta Sandbox no Asaas

1. Ir para: https://sandbox.asaas.com/
2. Criar conta gratuita
3. Ativar API: Dashboard → Integrações → API
4. Copiar `ASAAS_API_KEY`
5. Copiar `ASAAS_WEBHOOK_SECRET`

### 2. Configurar Ambiente

```bash
# Criar .env.local (não commitar)
cat > .env.local << 'EOF'
VITE_SUPABASE_URL=https://zytxwdgzjqrcmbnpgofj.supabase.co
VITE_SUPABASE_ANON_KEY=<your-key>
ASAAS_API_KEY=<seu-sandbox-key>
ASAAS_WEBHOOK_SECRET=<seu-webhook-secret>
EOF

# Ou configurar no Supabase
supabase secrets set ASAAS_API_KEY "<seu-sandbox-key>"
supabase secrets set ASAAS_WEBHOOK_SECRET "<seu-webhook-secret>"
```

### 3. Verificar Configuração

```bash
npm run dev

# Em outro terminal, testar:
curl http://localhost:5173/functions/v1/asaas-client \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"action":"validate-config"}'

# Esperado:
# {"success": true, "message": "Asaas configured correctly"}
```

---

## 📋 Teste 1: Criar Cliente (5 min)

### Dados de Teste

```javascript
const testeCliente = {
  name: "Empresa Teste XYZ",
  email: "empresa@teste.com.br",
  cpfCnpj: "12345678000190",  // CNPJ teste (formato válido)
  phone: "11999999999"
};
```

### Execução (Method 1: Dashboard)

1. Ir para `/pagamentos`
2. Clicar em "Criar Cliente"
3. Preencher dados acima
4. Clicar "Criar"

**Esperado**:
- ✅ Cliente criado
- ✅ Asaas_customer_id salvo no DB
- ✅ Mensagem de sucesso

### Execução (Method 2: API Direct)

```bash
# Chamar função diretamente
curl http://localhost:5173/functions/v1/asaas-client \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "action": "create-customer",
    "payload": {
      "name": "Empresa Teste XYZ",
      "email": "empresa@teste.com.br",
      "cpfCnpj": "12345678000190",
      "phone": "11999999999"
    }
  }'

# Resposta esperada:
{
  "success": true,
  "data": {
    "id": "cust_1234567890",
    "name": "Empresa Teste XYZ",
    "email": "empresa@teste.com.br",
    "cpfCnpj": "12345678000190"
  }
}
```

### Validação no Banco

```sql
-- Verificar que cliente foi criado
SELECT id, name, email, asaas_customer_id
FROM clientes
WHERE name = 'Empresa Teste XYZ'
LIMIT 1;

-- Esperado: 1 linha com asaas_customer_id preenchido
```

---

## 📋 Teste 2: Criar Subscription (5 min)

### Dados de Teste

```javascript
const testeSubscription = {
  customerId: "cust_1234567890",  // ID do cliente anterior
  billingType: "BOLETO",           // Opções: BOLETO, CREDIT_CARD, PIX
  value: 299.00,                   // R$ 299,00 (valor mensal)
  nextDueDate: "2025-12-01",       // Data do primeiro vencimento
  description: "Serviço Contábil Mensal",
  cycle: "MONTHLY"
};
```

### Execução

```bash
curl http://localhost:5173/functions/v1/asaas-client \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "action": "create-subscription",
    "payload": {
      "customerId": "cust_1234567890",
      "billingType": "BOLETO",
      "value": 299.00,
      "nextDueDate": "2025-12-01",
      "description": "Serviço Contábil Mensal",
      "cycle": "MONTHLY"
    }
  }'

# Resposta esperada:
{
  "success": true,
  "data": {
    "id": "sub_1234567890",
    "customerId": "cust_1234567890",
    "value": 299.00,
    "status": "ACTIVE",
    "cycle": "MONTHLY"
  }
}
```

### Validação no Asaas Dashboard

1. Ir para: Dashboard → Clientes → "Empresa Teste XYZ"
2. Verificar aba "Assinaturas"
3. Ver subscription criada com R$ 299,00/mês

### Validação no Banco

```sql
-- Verificar que subscription foi criada
SELECT id, cliente_id, valor, status
FROM assinaturas
WHERE cliente_id = (SELECT id FROM clientes WHERE name = 'Empresa Teste XYZ')
LIMIT 1;

-- Esperado: 1 linha com status 'ACTIVE'
```

---

## 📋 Teste 3: Simular Pagamento Confirmado (10 min)

### Option A: Via Asaas Dashboard (Mais Realista)

1. Ir para: Asaas Dashboard → Clientes → "Empresa Teste XYZ"
2. Ver o boleto/pagamento listado
3. Clicar em "Pagar Agora" (sandbox permite)
4. Seguir fluxo de pagamento (teste, sem dinheiro real)
5. **Aguardar webhook** (pode levar 2-5 minutos)

**O que deve acontecer automaticamente**:
- Asaas envia webhook: `PAYMENT_CONFIRMED`
- Seu servidor recebe em `/webhook-asaas`
- Sistema cria entrada em `pagamentos` table
- Sistema calcula comissões automaticamente

### Option B: Via Webhook Simulator (Teste Rápido)

Se a opção A for lenta, simule o webhook:

```bash
# Usar o webhook simulator local
curl http://localhost:5173/functions/v1/webhook-asaas \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "event": "PAYMENT_CONFIRMED",
    "payment": {
      "id": "pay_1234567890",
      "customer": "cust_1234567890",
      "value": 299.00,
      "netValue": 290.00,
      "dateCreated": "2025-11-14T10:00:00Z",
      "confirmedDate": "2025-11-14T10:30:00Z",
      "status": "CONFIRMED",
      "billingType": "BOLETO",
      "subscription": "sub_1234567890"
    }
  }'

# Resposta esperada:
{
  "success": true,
  "message": "Payment processed successfully",
  "payment_id": "pay_1234567890"
}
```

**⚠️ IMPORTANTE**: Este método não valida assinatura. Use só para teste local!

---

## 💰 Teste 4: Validar Cálculo de Comissões

### Após pagamento confirmado, verificar:

```sql
-- 1. Ver pagamento registrado
SELECT id, cliente_id, valor_bruto, valor_liquido, status_pagamento
FROM pagamentos
WHERE asaas_payment_id = 'pay_1234567890';

-- Esperado:
-- id: uuid-xxx
-- cliente_id: uuid-yyyy
-- valor_bruto: 299.00
-- valor_liquido: 290.00
-- status_pagamento: CONFIRMADO

-- 2. Ver comissões calculadas
SELECT id, contador_id, tipo_comissao, valor, status_comissao, competencia
FROM comissoes
WHERE pagamento_id = 'pay_xxx'
ORDER BY created_at DESC;

-- Esperado: 1+ linhas com comissões calculadas
-- Exemplo:
-- tipo_comissao: 'recorrente', valor: 43.50, status_comissao: 'calculada'
```

### Cálculo Esperado (para R$ 299,00)

**Assumindo contador nível BRONZE com 1 cliente**:

```
Valor bruto: R$ 299,00

Comissão Recorrente (BRONZE):
  Taxa: 15% sobre valor líquido
  Valor líquido: R$ 290,00
  Comissão: R$ 290,00 × 15% = R$ 43,50
  Status: 'calculada'

Total de Comissões: R$ 43,50
```

**Verificar no Dashboard**:
1. Login como contador
2. Ir para `/comissoes`
3. Deve mostrar: "Saldo de Comissões: R$ 43,50"
4. Status: "Pendente Aprovação" (até 24h depois)

---

## 📊 Teste 5: Auto-Aprovação (Após 24h)

### Cenário

Depois que pagamento é confirmado:
- `t+0h`: Comissão com status `calculada`
- `t+24h`: Auto-approval job roda (função `auto_aprovar_comissoes`)
- `t+24h`: Status muda para `aprovada`

### Teste Manual

```bash
# Forçar auto-aprovação (para teste rápido)
curl -X POST http://localhost:5173/functions/v1/cron-auto-approve \
  -H "Authorization: Bearer YOUR_SERVICE_KEY"

# Ou via SQL (admin only):
SELECT auto_aprovar_comissoes();

# Verificar resultado
SELECT COUNT(*) as comissoes_aprovadas
FROM comissoes
WHERE status_comissao = 'aprovada'
AND auto_aprovada_em > now() - INTERVAL '5 minutes';

# Esperado: > 0
```

---

## 📝 Teste 6: Fluxo Completo End-to-End (30 min)

### Checklist Prático

**Parte 1: Setup**
- [ ] Criar conta Asaas sandbox
- [ ] Configurar `ASAAS_API_KEY` e `ASAAS_WEBHOOK_SECRET`
- [ ] `npm run dev` compilando sem erros

**Parte 2: Cliente**
- [ ] Criar cliente via API
- [ ] Verificar em Asaas dashboard
- [ ] Verificar em `clientes` table

**Parte 3: Subscription**
- [ ] Criar subscription via API
- [ ] Verificar em Asaas dashboard
- [ ] Verificar em `assinaturas` table

**Parte 4: Pagamento**
- [ ] Pagar boleto no Asaas dashboard (ou simular webhook)
- [ ] Aguardar webhook (ou validar simulação)
- [ ] Verificar em `pagamentos` table

**Parte 5: Comissão**
- [ ] Verificar `comissoes` criada com status `calculada`
- [ ] Verificar valor calculado corretamente
- [ ] Dashboard mostra saldo de comissão

**Parte 6: Auto-Aprovação**
- [ ] Forçar `auto_aprovar_comissoes()`
- [ ] Verificar status muda para `aprovada`
- [ ] Dashboard mostra comissão aprovada

**Parte 7: Saque**
- [ ] Ir para `/comissoes`
- [ ] Clicar "Solicitar Saque"
- [ ] Validar PIX ou dados bancários
- [ ] Confirmar saque
- [ ] Verificar em `solicitacoes_saque` table

---

## 🔍 Troubleshooting

### Problema 1: "ASAAS_API_KEY not found"
```bash
# Verificar variável está setada
echo $ASAAS_API_KEY

# Se vazio, configurar:
export ASAAS_API_KEY="your-key"

# Ou adicionar a .env.local:
ASAAS_API_KEY=your-key
```

### Problema 2: "Cliente não encontrado" (RLS error)
```bash
# Verificar que contador está logged in
# Ir para /dashboard primeiro

# Verificar que contador_id está correto
SELECT id, user_id FROM contadores WHERE user_id = auth.uid();
```

### Problema 3: "Webhook signature validation failed"
```bash
# Verificar que ASAAS_WEBHOOK_SECRET está correto
# Em Asaas Dashboard → Integrações → Webhooks

# Ver seu secret:
grep "ASAAS_WEBHOOK_SECRET" .env.local

# Deve ser igual ao que está em Asaas
```

### Problema 4: "Pagamento não aparece em comissões"
```bash
# Verificar webhook foi recebido
SELECT * FROM webhook_logs
ORDER BY created_at DESC LIMIT 10;

# Se não houver, webhook não foi recebido
# Verificar URL em Asaas Dashboard é correto:
# https://zytxwdgzjqrcmbnpgofj.supabase.co/functions/v1/webhook-asaas

# Se houver error_message, ver qual foi
```

### Problema 5: "Comissão calculada com valor errado"
```bash
-- Verificar cálculo:
SELECT
  p.valor_liquido,
  (p.valor_liquido * 0.15) as comissao_esperada,  -- 15% para BRONZE
  c.valor as comissao_atual
FROM pagamentos p
JOIN comissoes c ON c.pagamento_id = p.id
WHERE p.asaas_payment_id = 'pay_xxx';
```

---

## 📊 Resultados Esperados

### Por Tipo de Usuário

#### Contador BRONZE (Novo)
- Comissão Recorrente: 15% do valor líquido
- Exemplo: R$ 290,00 × 15% = R$ 43,50 por mês

#### Contador PRATA
- Comissão Recorrente: 17% do valor líquido
- Bônus se tiver 5+ clientes: +R$ 100

#### Contador OURO
- Comissão Recorrente: 19% do valor líquido
- Bônus se tiver 10+ clientes: +R$ 150

#### Contador DIAMANTE
- Comissão Recorrente: 20% do valor líquido
- Bônus se tiver 15+ clientes: +R$ 200

---

## 📈 Métricas para Validar

**Depois de completar teste:**

```sql
-- 1. Contagem de registros criados
SELECT 'clientes' as tabela, COUNT(*) as qtd FROM clientes
UNION ALL
SELECT 'assinaturas', COUNT(*) FROM assinaturas
UNION ALL
SELECT 'pagamentos', COUNT(*) FROM pagamentos
UNION ALL
SELECT 'comissoes', COUNT(*) FROM comissoes
UNION ALL
SELECT 'webhook_logs', COUNT(*) FROM webhook_logs;

-- 2. Comissões totais
SELECT SUM(valor) as total_comissoes
FROM comissoes
WHERE status_comissao = 'aprovada';

-- 3. Webhook success rate
SELECT
  COUNT(*) as total_webhooks,
  COUNT(CASE WHEN status = 'success' THEN 1 END) as sucesso,
  COUNT(CASE WHEN status = 'error' THEN 1 END) as erro
FROM webhook_logs;
```

---

## ✅ Checklist Final

- [ ] ASAAS_API_KEY configurada
- [ ] ASAAS_WEBHOOK_SECRET configurada
- [ ] Cliente criado e visível em Asaas
- [ ] Subscription criada e ativa
- [ ] Pagamento confirmado (real ou simulado)
- [ ] Webhook recebido com sucesso
- [ ] Comissão calculada corretamente
- [ ] Comissão aprovada (após 24h ou manual)
- [ ] Usuário vê saldo na dashboard
- [ ] Saque pode ser solicitado

---

## 🚀 Próximos Passos

Depois de validar Teste 1-7:

1. **Deploy para Staging**
   ```bash
   ./deploy.sh staging --execute
   ```

2. **Repetir testes em Staging**
   - URL: seu-staging-url.com
   - Mesmos passos, mas ambiente de produção

3. **Deploy para Production**
   ```bash
   export ASAAS_API_KEY="production-key"
   export ASAAS_WEBHOOK_SECRET="production-secret"
   ./deploy.sh production --execute
   ```

4. **Monitorar Webhooks em Produção**
   ```bash
   supabase logs pull --function webhook-asaas
   ./monitoring.sh
   ```

---

**Status**: Ready for Integration Testing
**Difficulty**: ⭐⭐ Medium (depends on Asaas response time)
**Time to Complete**: ~1-2 hours
**Risk Level**: 🟢 Low (using sandbox, no real money)

Boa sorte! 🚀
