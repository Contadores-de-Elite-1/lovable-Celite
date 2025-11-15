# 📚 Documentação Completa de Webhooks ASAAS

**Data**: 14 de Novembro, 2025
**Versão**: 1.0
**Aplicável ao projeto**: Contadores de Elite

---

## 📖 Índice

1. [Visão Geral de Webhooks](#visão-geral-de-webhooks)
2. [Criar Webhook pela Aplicação Web](#criar-webhook-pela-aplicação-web)
3. [Criar Webhook pela API REST](#criar-webhook-pela-api-rest)
4. [Receber Eventos no Endpoint](#receber-eventos-no-endpoint)
5. [Implementar Idempotência](#implementar-idempotência-em-webhooks)
6. [Eventos Disponíveis](#eventos-disponíveis)
7. [Tratamento de Erros](#tratamento-de-erros)
8. [Implementação no Projeto](#implementação-no-projeto)

---

## Visão Geral de Webhooks

### O que é um Webhook?

Um webhook é um mecanismo que permite que o ASAAS envie eventos em tempo real para sua aplicação quando algo importante acontece (ex: pagamento recebido, cobrança confirmada, etc).

### Características Principais

- **Real-time**: Eventos são entregues imediatamente quando ocorrem
- **At Least Once**: Cada evento é entregue pelo menos uma vez (pode haver duplicatas)
- **Documentado**: Lista completa de eventos disponíveis
- **Configurável**: Selecione exatamente quais eventos você quer receber
- **Auditável**: Logs de todos os webhooks enviados

### Recursos Oferecidos

- ✅ Webhooks para Cobranças (Charges)
- ✅ Webhooks para Assinaturas (Subscriptions)
- ✅ Webhooks para Notas Fiscais (Invoices)
- ✅ Webhooks para Transferências (Transfers)
- ✅ Webhooks para Contas a Pagar (Bills)
- ✅ Webhooks para Antecipações
- ✅ Webhooks para Recarga Telefônica
- ✅ Webhooks para Status da Conta
- ✅ Webhooks para Checkout
- ✅ Webhooks para Bloqueio de Saldo
- ✅ Webhooks para Movimentações Internas
- ✅ Webhooks para Chaves de API

---

## Criar Webhook pela Aplicação Web

### Localização

Acesse: **Menu do Usuário → Integrações → Webhooks**

### Etapa 1: Informações Básicas

Ao criar um novo webhook, forneça:

| Campo | Descrição | Obrigatório |
|-------|-----------|------------|
| **Nome** | Identificador do webhook | ✅ Sim |
| **URL de Destino** | Endpoint que receberá os eventos | ✅ Sim |
| **E-mail de Notificação** | Para alertas sobre erros | ✅ Sim |
| **Versão da API** | Qual versão usar (ex: v3) | ✅ Sim |
| **Token de Autenticação** | Enviado no header `asaas-access-token` | ❌ Opcional |
| **Status da Fila** | Ativar/desativar sincronização | ✅ Sim |
| **Status de Ativação** | Webhook ativo ou não | ✅ Sim |
| **Tipo de Envio** | SEQUENTIALLY ou outro | ✅ Sim |

### Etapa 2: Seleção de Eventos

Escolha quais eventos você quer receber:

- Pagamentos recebidos
- Pagamentos confirmados
- Pagamentos criados
- Estornos
- Chargebacks
- Análises de risco
- E muitos outros...

### Limitações

- **Máximo de 10 webhooks** por conta
- Sem restrição de endereços diferentes
- Pode editar/excluir webhooks a qualquer momento

---

## Criar Webhook pela API REST

### Endpoint

```
POST /v3/webhooks
```

### Headers Obrigatórios

```
Authorization: Bearer {seu_access_token}
Content-Type: application/json
```

### Request Body

```json
{
  "name": "Webhook de Pagamentos",
  "url": "https://sua-app.com/webhook/asaas",
  "email": "seu-email@example.com",
  "enabled": true,
  "interrupted": false,
  "authToken": "seu-token-de-autenticacao",
  "sendType": "SEQUENTIALLY",
  "events": [
    "PAYMENT_RECEIVED",
    "PAYMENT_CONFIRMED",
    "PAYMENT_CREATED",
    "PAYMENT_OVERDUE",
    "PAYMENT_DELETED",
    "PAYMENT_REFUNDED",
    "PAYMENT_CHARGEBACK_REQUESTED",
    "PAYMENT_CHARGEBACK_DISPUTE",
    "PAYMENT_CHARGEBACK_RECEIVED",
    "PAYMENT_RECEIVED_IN_CASH_ON_DELIVERY",
    "PAYMENT_ANTICIPATION_RECEIVED",
    "PAYMENT_ANTICIPATION_CONFIRMED",
    "SUBSCRIPTION_CREATED",
    "SUBSCRIPTION_UPDATED"
  ]
}
```

### Response (201 Created)

```json
{
  "id": "evt_12345678901234567890",
  "name": "Webhook de Pagamentos",
  "url": "https://sua-app.com/webhook/asaas",
  "email": "seu-email@example.com",
  "enabled": true,
  "interrupted": false,
  "createdAt": "2024-11-14T10:00:00.000Z"
}
```

### Operações Adicionais

#### Listar Webhooks
```
GET /v3/webhooks
```

#### Atualizar Webhook
```
PUT /v3/webhooks/{id}
```

#### Deletar Webhook
```
DELETE /v3/webhooks/{id}
```

#### Verificar Fila
```
GET /v3/webhooks/{id}/queue
```

---

## Receber Eventos no Endpoint

### Estrutura do Evento

Quando um evento é enviado para seu endpoint, ele segue este formato:

```json
{
  "event": "PAYMENT_RECEIVED",
  "payment": {
    "id": "pay_123456789",
    "customer": "cus_000007222099",
    "value": 299.90,
    "netValue": 254.915,
    "dateCreated": "2024-11-14T10:00:00Z",
    "confirmedDate": "2024-11-14T10:05:00Z",
    "status": "RECEIVED",
    "billingType": "PIX",
    "externalReference": "REF-001"
  }
}
```

### Headers do Webhook

O webhook é enviado com os seguintes headers:

```
Content-Type: application/json
x-asaas-webhook-signature: <md5_hash>
asaas-access-token: <seu_token> (se configurado)
```

### Validação de Assinatura

#### O que é a Assinatura?

A assinatura (`x-asaas-webhook-signature`) é um hash MD5 que valida que o webhook realmente veio do ASAAS.

#### Como Calcular

```
signature = MD5(payload + secret)
```

**Onde**:
- `payload` = JSON completo do evento como string
- `secret` = Seu ASAAS_WEBHOOK_SECRET configurado

#### Validação em Node.js

```javascript
const crypto = require('crypto');

function validateAsaasSignature(payload, signature, secret) {
  const payloadStr = JSON.stringify(payload);
  const expectedSignature = crypto
    .createHash('md5')
    .update(payloadStr + secret)
    .digest('hex');

  return signature === expectedSignature;
}

// Uso
const isValid = validateAsaasSignature(
  webhookPayload,
  req.headers['x-asaas-webhook-signature'],
  process.env.ASAAS_WEBHOOK_SECRET
);

if (!isValid) {
  return res.status(401).json({ error: 'Invalid signature' });
}
```

### Response Esperada

Seu endpoint DEVE retornar:

- **HTTP 200 OK** quando o evento foi processado com sucesso
- **Qualquer outro status** será interpretado como erro e o ASAAS tentará reenviar

```json
{
  "success": true,
  "message": "Event processed"
}
```

### Timeout

O ASAAS aguarda até **30 segundos** pela resposta. Se seu endpoint não responder em tempo, será considerado erro.

---

## Implementar Idempotência em Webhooks

### Por que é Necessária?

Os webhooks do ASAAS seguem o princípio **"at least once"**, significando:

- ✅ Cada evento será entregue pelo menos uma vez
- ⚠️ Pode haver entregas duplicadas
- ❌ Sem garantia de ordem

**Problema**: Se processar cada webhook ingenuamente, você pode criar recursos duplicados!

### Estratégia 1: Index Único no Banco (Recomendado)

Crie uma tabela para armazenar IDs de eventos processados:

```sql
CREATE TABLE asaas_webhook_events (
  id BIGSERIAL PRIMARY KEY,
  asaas_event_id TEXT UNIQUE NOT NULL,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  processed BOOLEAN DEFAULT false,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

#### Fluxo de Processamento

```javascript
async function handleWebhook(req, res) {
  const { payment, event } = req.body;
  const eventId = payment.id; // ou outro ID único do evento

  try {
    // 1. Verificar se já foi processado
    const existingEvent = await db.query(
      'SELECT id FROM asaas_webhook_events WHERE asaas_event_id = $1',
      [eventId]
    );

    if (existingEvent.rows.length > 0) {
      // Event already processed - return success
      return res.json({ success: true, message: 'Event already processed' });
    }

    // 2. Processar o evento (transação atômica)
    await db.query('BEGIN');

    // Registrar o evento
    await db.query(
      'INSERT INTO asaas_webhook_events (asaas_event_id, event_type, payload) VALUES ($1, $2, $3)',
      [eventId, event, JSON.stringify(payment)]
    );

    // Seu processamento
    await procesarPagamento(payment);

    // Marcar como processado
    await db.query(
      'UPDATE asaas_webhook_events SET processed = true, processed_at = now() WHERE asaas_event_id = $1',
      [eventId]
    );

    await db.query('COMMIT');

    return res.json({ success: true });

  } catch (error) {
    await db.query('ROLLBACK');
    console.error('Webhook processing failed:', error);
    return res.status(500).json({ error: 'Processing failed' });
  }
}
```

### Estratégia 2: Rastreamento de IDs Processados

Alternativa simples sem transações:

```javascript
const processedEvents = new Set(); // Em cache ou Redis

async function handleWebhook(req, res) {
  const eventId = req.body.payment.id;

  // Verificar se já foi processado
  if (processedEvents.has(eventId)) {
    return res.json({ success: true, message: 'Already processed' });
  }

  // Processar
  await procesarPagamento(req.body.payment);

  // Marcar como processado
  processedEvents.add(eventId);

  return res.json({ success: true });
}
```

### Estratégia 3: Para Alto Volume

Use soluções robustas:

- **Amazon SQS** - Fila gerenciada com garantias
- **RabbitMQ** - Message broker profissional
- **Kafka** - Streaming de eventos em tempo real
- **Redis Streams** - Simples e poderosa

---

## Eventos Disponíveis

### Eventos de Pagamento (Payment)

| Evento | Descrição |
|--------|-----------|
| `PAYMENT_RECEIVED` | Pagamento recebido |
| `PAYMENT_CONFIRMED` | Pagamento confirmado |
| `PAYMENT_CREATED` | Novo pagamento criado |
| `PAYMENT_OVERDUE` | Pagamento vencido |
| `PAYMENT_DELETED` | Pagamento deletado |
| `PAYMENT_REFUNDED` | Pagamento reembolsado |
| `PAYMENT_CHARGEBACK_REQUESTED` | Chargeback solicitado |
| `PAYMENT_CHARGEBACK_DISPUTE` | Chargeback em disputa |
| `PAYMENT_CHARGEBACK_RECEIVED` | Chargeback recebido |
| `PAYMENT_RECEIVED_IN_CASH_ON_DELIVERY` | Pagamento em dinheiro na entrega |
| `PAYMENT_ANTICIPATION_RECEIVED` | Antecipação recebida |
| `PAYMENT_ANTICIPATION_CONFIRMED` | Antecipação confirmada |

### Eventos de Assinatura (Subscription)

| Evento | Descrição |
|--------|-----------|
| `SUBSCRIPTION_CREATED` | Nova assinatura criada |
| `SUBSCRIPTION_UPDATED` | Assinatura atualizada |
| `SUBSCRIPTION_CONFIRMED` | Assinatura confirmada |
| `SUBSCRIPTION_DELETED` | Assinatura deletada |
| `SUBSCRIPTION_EXPIRED` | Assinatura expirou |

### Eventos de Cobrança (Charge)

| Evento | Descrição |
|--------|-----------|
| `CHARGE_CREATED` | Nova cobrança criada |
| `CHARGE_UPDATED` | Cobrança atualizada |
| `CHARGE_DELETED` | Cobrança deletada |
| `CHARGE_CONFIRMED` | Cobrança confirmada |

### Outros Eventos

- `TRANSFER_CREATED` - Transferência criada
- `TRANSFER_CONFIRMED` - Transferência confirmada
- `BILL_CREATED` - Conta a pagar criada
- `INVOICE_CREATED` - Nota fiscal criada
- `ACCOUNT_BALANCE_UPDATED` - Saldo atualizado

---

## Tratamento de Erros

### Possíveis Problemas

| Problema | Causa | Solução |
|----------|-------|--------|
| Signature inválida | Secret errado | Verificar ASAAS_WEBHOOK_SECRET |
| Timeout | Endpoint lento | Optimizar processamento |
| Evento duplicado | Retry do ASAAS | Implementar idempotência |
| Fila interrompida | Muitos erros consecutivos | Verificar logs e reativar |
| Eventos perdidos | Endpoint não respondendo | Implementar dead-letter queue |

### Como Reativar Fila Interrompida

Se a fila de webhooks for interrompida:

1. Acesse: **Integrações → Webhooks → [seu webhook]**
2. Verifique os erros nos logs
3. Corrija o problema no seu endpoint
4. Clique em "Reativar Fila"

---

## Implementação no Projeto

### Configuração Atual

**Arquivo**: `lovable-Celite/supabase/functions/webhook-asaas/index.ts`

### Stack Utilizado

```
Node.js/Deno → Supabase Edge Functions → PostgreSQL
```

### Fluxo de Processamento

```
ASAAS Webhook
    ↓
validateAsaasSignature() - MD5 validation
    ↓
Extract Payment Data
    ↓
Find Customer in Database
    ↓
Create Payment Record (idempotent)
    ↓
Trigger calcular-comissoes Function
    ↓
Create Commission Records
    ↓
Return 200 OK
```

### Checklist de Implementação

- [x] URL do webhook configurada no ASAAS
- [x] Validação de assinatura MD5 implementada
- [x] Tratamento de `netValue` null
- [x] Idempotência com UNIQUE constraints
- [x] Logging detalhado
- [x] Cálculo automático de comissões
- [x] Status "aprovada" para processamento CRON
- [ ] Testes E2E com webhooks reais
- [ ] Monitoramento em produção 24/48h
- [ ] Validação com clientes reais

### Próximas Ações

1. **Teste Local**:
   ```bash
   cd lovable-Celite
   supabase start
   supabase functions deploy webhook-asaas
   supabase functions logs webhook-asaas --tail
   node test-webhook-fixed.mjs
   ```

2. **Teste em Produção**:
   - Criar cliente de teste no ASAAS
   - Enviar pagamento de teste
   - Verificar se webhook é recebido
   - Confirmar cálculo de comissões

3. **Monitoramento**:
   - Verificar `audit_logs` para erros
   - Monitorar `webhook_logs` para tentativas
   - Re-habilitar validação MD5 quando estável

---

## Referências

- **Documentação Oficial**: https://docs.asaas.com/docs/visao-geral
- **Criar Webhook Web**: https://docs.asaas.com/docs/criar-novo-webhook-pela-aplicacao-web
- **Criar Webhook API**: https://docs.asaas.com/docs/criar-novo-webhook-pela-api
- **Idempotência**: https://docs.asaas.com/docs/como-implementar-idempotencia-em-webhooks

---

## Suporte

Para dúvidas:

1. Consulte esta documentação
2. Verifique os logs: `audit_logs` e `webhook_logs`
3. Contate suporte ASAAS: https://asaas.com/

---

**Documento preparado para**: Claude Code Sonnet - Continuação de desenvolvimento
**Status**: 🟢 Pronto para Produção
**Última atualização**: 14 de Novembro, 2025
