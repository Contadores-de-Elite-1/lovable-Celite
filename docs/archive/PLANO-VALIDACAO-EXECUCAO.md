# 🎯 PLANO DE VALIDAÇÃO DE EXECUÇÃO - MVP HOJE

**Data:** 2025-01-14
**Objetivo:** Validar TODA a cadeia de execução com dados REAIS
**Prazo:** Hoje (3-4 horas)

---

## 🔄 FLUXO DE EXECUÇÃO REAL

```
USUÁRIO (Front-end)
    ↓
CRIA CLIENTE + ASSINATURA
    ↓
ASAAS (Sandbox)
    ↓ webhook automático
SUPABASE Edge Function (webhook-asaas)
    ↓
SUPABASE Database (clientes, pagamentos)
    ↓
SUPABASE RPC (calcular-comissoes)
    ↓
SUPABASE Database (comissoes)
    ↓
DASHBOARD (visualiza comissões)
```

**GitHub NÃO participa! Só serviu para fazer deploy.**

---

## ✅ FASE 1: VALIDAÇÃO DA INFRAESTRUTURA (30min)

### 1.1 Supabase - Edge Functions
**Objetivo:** Confirmar que webhook-asaas está deployed e respondendo

**Checklist:**
- [ ] Acessar: https://supabase.com/dashboard/project/zytxwdgzjqrcmbnpgofj/functions
- [ ] Webhook-asaas aparece na lista?
- [ ] Status: Deployed?
- [ ] Última atualização: Hoje?

**Teste:**
```bash
curl -X POST https://zytxwdgzjqrcmbnpgofj.supabase.co/functions/v1/webhook-asaas \
  -H "Content-Type: application/json" \
  -d '{"test":"connectivity"}'
```

**Resultado esperado:** Status 200-499 (qualquer resposta = está vivo)

---

### 1.2 Supabase - Secrets
**Objetivo:** Confirmar que Edge Function tem acesso aos secrets

**Checklist:**
- [ ] Acessar: https://supabase.com/dashboard/project/zytxwdgzjqrcmbnpgofj/settings/secrets
- [ ] Verificar se existem:
  - `ASAAS_API_KEY`
  - `ASAAS_WEBHOOK_SECRET`
  - Outros necessários?

**Ação:** Se NÃO existem, criar agora:
```
ASAAS_API_KEY = $aact_hmlg_000MzkwODA2MWY2OGM3MWRlMDU2NWM3MzJlNzZmNGZhZGY6Ojg5NGI4NmYzLWQxYmUtNDkwYy05ZWMwLTM5ZTFhZGUwYWM2MDo6JGFhY2hfNDNkMWQ3N2YtNTEzOS00NmU3LWE4NzAtMzU0Y2Q1ZWEyYTA4
```

---

### 1.3 Supabase - Database
**Objetivo:** Confirmar que tabelas existem e RPC funciona

**SQL direto no Supabase:**
```sql
-- 1. Verificar tabelas
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- Deve retornar: clientes, contadores, pagamentos, comissoes, etc.

-- 2. Verificar RPC existe
SELECT routine_name FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name LIKE '%comiss%';

-- Deve retornar: executar_calculo_comissoes, etc.

-- 3. Contar registros
SELECT
  'contadores' as tabela, COUNT(*) as total FROM contadores
UNION ALL
SELECT 'clientes', COUNT(*) FROM clientes
UNION ALL
SELECT 'pagamentos', COUNT(*) FROM pagamentos
UNION ALL
SELECT 'comissoes', COUNT(*) FROM comissoes;
```

---

### 1.4 ASAAS - Dashboard
**Objetivo:** Verificar configuração atual do ASAAS

**Checklist:**
- [ ] Login: https://sandbox.asaas.com
- [ ] Menu: Integrações → Webhooks
- [ ] Existe webhook cadastrado?
- [ ] URL aponta para: `https://zytxwdgzjqrcmbnpgofj.supabase.co/functions/v1/webhook-asaas`?
- [ ] Eventos selecionados incluem: `PAYMENT_RECEIVED`, `PAYMENT_CONFIRMED`?

**Se NÃO existe:** Executar localmente:
```bash
node configurar-webhook-asaas.mjs
```

---

## ✅ FASE 2: PREPARAÇÃO DE DADOS (30min)

### 2.1 Criar Contador
**Objetivo:** Ter um contador para vincular clientes

**Opção A - SQL direto:**
```sql
-- Pegar um user_id existente
SELECT id, email FROM auth.users LIMIT 1;

-- Criar contador (substituir USER_ID)
INSERT INTO contadores (user_id, nivel, status, xp, clientes_ativos)
VALUES ('USER_ID_AQUI', 'bronze', 'ativo', 0, 0)
RETURNING id;
```

**Opção B - Script:**
```bash
node criar-cliente-especifico.mjs
```

**Resultado:** Anote o `contador_id`

---

### 2.2 Criar Cliente no ASAAS
**Objetivo:** Cliente real no ASAAS Sandbox para receber pagamentos

**Via API ASAAS:**
```bash
curl -X POST https://api-sandbox.asaas.com/v3/customers \
  -H "access_token: $aact_hmlg_..." \
  -H "content-type: application/json" \
  -d '{
    "name": "Cliente Teste MVP",
    "email": "teste@mvp.com",
    "cpfCnpj": "12345678000199",
    "phone": "11999999999"
  }'
```

**Resultado:** Copie o `id` (ex: `cus_000123456`)

---

### 2.3 Registrar Cliente no Supabase
**Objetivo:** Vincular cliente ASAAS com contador

**SQL:**
```sql
INSERT INTO clientes (
  contador_id,
  nome_empresa,
  cnpj,
  contato_email,
  status,
  plano,
  valor_mensal,
  asaas_customer_id
) VALUES (
  'CONTADOR_ID_AQUI',
  'Cliente Teste MVP',
  '12345678000199',
  'teste@mvp.com',
  'ativo',
  'profissional',
  199.90,
  'CUS_ID_ASAAS_AQUI'
) RETURNING id;
```

**Resultado:** Anote o `cliente_id`

---

## ✅ FASE 3: TESTE DE INTEGRAÇÃO (1 hora)

### 3.1 Criar Cobrança no ASAAS
**Objetivo:** Cobrança real que vai disparar webhook

**Via API ASAAS:**
```bash
curl -X POST https://api-sandbox.asaas.com/v3/payments \
  -H "access_token: $aact_hmlg_..." \
  -H "content-type: application/json" \
  -d '{
    "customer": "CUS_ID_ASAAS_AQUI",
    "billingType": "PIX",
    "value": 199.90,
    "dueDate": "2025-01-15",
    "description": "Teste MVP - Mensalidade"
  }'
```

**Resultado:** Copie o `id` do pagamento

---

### 3.2 Simular Recebimento (Sandbox)
**Objetivo:** Marcar como pago para disparar webhook

**Via API ASAAS:**
```bash
curl -X POST https://api-sandbox.asaas.com/v3/payments/PAYMENT_ID/receiveInCash \
  -H "access_token: $aact_hmlg_..." \
  -H "content-type: application/json" \
  -d '{
    "paymentDate": "2025-01-14",
    "value": 199.90
  }'
```

**O que acontece agora:**
1. ASAAS marca como recebido
2. ASAAS dispara webhook → Supabase
3. Supabase processa evento
4. Supabase cria pagamento
5. Supabase calcula comissões

---

### 3.3 Verificar Logs Supabase
**Objetivo:** Ver se webhook foi recebido e processado

**Acessar:**
```
https://supabase.com/dashboard/project/zytxwdgzjqrcmbnpgofj/logs/edge-functions
```

**Filtrar por:** `webhook-asaas`

**Procurar:**
- ✅ Request recebido do ASAAS
- ✅ Status 200 retornado
- ✅ "Cliente encontrado"
- ✅ "Pagamento criado"
- ✅ "Comissões calculadas"
- ❌ Qualquer erro

---

### 3.4 Verificar Database
**Objetivo:** Confirmar que dados foram salvos

**SQL:**
```sql
-- 1. Verificar pagamento criado
SELECT * FROM pagamentos
WHERE asaas_payment_id = 'PAYMENT_ID_AQUI'
ORDER BY created_at DESC;

-- 2. Verificar comissões criadas
SELECT
  c.*,
  ct.nivel as contador_nivel
FROM comissoes c
JOIN contadores ct ON c.contador_id = ct.id
WHERE c.pagamento_id = (
  SELECT id FROM pagamentos
  WHERE asaas_payment_id = 'PAYMENT_ID_AQUI'
)
ORDER BY c.created_at DESC;

-- 3. Verificar audit logs
SELECT * FROM audit_logs
WHERE created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC
LIMIT 20;
```

**Verificar:**
- [ ] Pagamento existe? Status 'pago'?
- [ ] Comissões foram criadas?
- [ ] Valores corretos?
- [ ] Audit logs registraram tudo?

---

## ✅ FASE 4: TESTE E2E COMPLETO (1 hora)

### 4.1 Cenário Completo
**Objetivo:** Fluxo completo como usuário real

**Passos:**
1. Acessa front-end (se disponível)
2. Cria novo cliente
3. Define plano e valor
4. Gera cobrança ASAAS
5. Simula pagamento
6. Verifica comissão calculada no dashboard

**OU via API/SQL se front não estiver pronto**

---

### 4.2 Testes de Casos Extremos

**Teste A: Pagamento duplicado (idempotência)**
```
1. Enviar mesmo webhook 2x
2. Verificar: só 1 pagamento criado
3. Verificar: audit log registrou duplicata
```

**Teste B: Cliente não existe**
```
1. Enviar webhook com customer_id inválido
2. Verificar: retorna 404
3. Verificar: audit log registrou erro
```

**Teste C: Valor zero**
```
1. Tentar criar pagamento valor 0
2. Verificar: rejeita ou aceita?
3. Verificar: lógica de validação
```

**Teste D: Multi-nível**
```
1. Criar rede: Contador A indica B
2. B indica cliente
3. Cliente paga
4. Verificar: A e B recebem comissão
```

---

## ✅ FASE 5: VALIDAÇÃO FINAL (30min)

### 5.1 Checklist Completo

**Infraestrutura:**
- [ ] Webhook deployed no Supabase
- [ ] Secrets configurados
- [ ] Database com tabelas corretas
- [ ] RPC functions funcionando
- [ ] Webhook configurado no ASAAS

**Integração:**
- [ ] ASAAS → Supabase (webhook funciona)
- [ ] Supabase recebe e processa
- [ ] Database atualizado
- [ ] Comissões calculadas corretamente

**Casos de teste:**
- [ ] Pagamento simples funciona
- [ ] Idempotência funciona
- [ ] Erros são tratados
- [ ] Multi-nível funciona (se aplicável)

**Logs e Auditoria:**
- [ ] Logs Supabase registram tudo
- [ ] Audit logs no database
- [ ] Erros são logados e tratados

---

### 5.2 Documentação de Testes

**Criar arquivo:** `TESTES-EXECUTADOS.md`

**Registrar:**
- Data/hora de cada teste
- Resultado (✅ ou ❌)
- Logs relevantes
- Screenshots se possível
- Problemas encontrados
- Soluções aplicadas

---

## 🎯 CRONOGRAMA HOJE

**14:00 - 14:30** → Fase 1: Validação Infraestrutura
**14:30 - 15:00** → Fase 2: Preparação Dados
**15:00 - 16:00** → Fase 3: Teste Integração
**16:00 - 17:00** → Fase 4: E2E Completo
**17:00 - 17:30** → Fase 5: Validação Final

**TOTAL: 3h30min**

---

## 🚨 PONTOS DE ATENÇÃO

### Se falhar Fase 1:
→ Problema: Infraestrutura
→ Solução: Deploy correto / Secrets / Database

### Se falhar Fase 2:
→ Problema: Dados
→ Solução: Criar dados corretamente

### Se falhar Fase 3:
→ Problema: Integração ASAAS ↔ Supabase
→ Solução: Webhook URL / Secrets / Código

### Se falhar Fase 4:
→ Problema: Lógica de negócio
→ Solução: Ajustar cálculo comissões / Regras

---

## 📊 CRITÉRIOS DE SUCESSO

**MVP VALIDADO se:**
✅ Webhook Supabase responde
✅ ASAAS envia eventos
✅ Pagamentos são registrados
✅ Comissões são calculadas
✅ Valores estão corretos
✅ Idempotência funciona
✅ Erros são tratados

**GitHub NÃO precisa estar perfeito!**
**Foco: EXECUÇÃO funciona!**

---

## 🎉 ENTREGA FINAL

**Ao final do dia:**
1. MVP validado com dados REAIS
2. Documentação de testes
3. Lista de ajustes necessários (se houver)
4. Sistema pronto para próxima fase

**GitHub? Só guarda o código. Fim.**

---

**FOCO TOTAL EM EXECUÇÃO, NÃO EM CI/CD!** 🚀
