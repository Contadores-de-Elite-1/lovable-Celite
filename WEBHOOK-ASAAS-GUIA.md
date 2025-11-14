# 🔗 GUIA COMPLETO - WEBHOOK ASAAS

## 📚 Informações da Documentação Oficial

**Fonte**: https://docs.asaas.com/docs/sobre-os-webhooks

### O que são Webhooks ASAAS?

Webhooks são eventos enviados pelo ASAAS para uma URL configurada quando algo acontece na sua conta (pagamento recebido, cobrança criada, etc.). São objetos JSON enviados via POST.

### Características Importantes

1. **Limite**: Até 10 webhooks por conta
2. **Idempotência**: Cada evento tem ID único
3. **Garantia**: "At least once" - pode receber o mesmo evento mais de uma vez
4. **Resposta**: Seu endpoint deve retornar 200 o mais rápido possível

---

## 🛠️ CONFIGURAÇÃO VIA API

### Endpoint

```
POST https://sandbox.asaas.com/api/v3/webhooks
```

### Headers Obrigatórios

```json
{
  "accept": "application/json",
  "content-type": "application/json",
  "access_token": "SEU_TOKEN_ASAAS"
}
```

### Body (Request)

```json
{
  "name": "Nome do Webhook",
  "url": "https://seu-endpoint.com/webhook",
  "email": "notificacoes@empresa.com",
  "apiVersion": 3,
  "enabled": true,
  "interrupted": false,
  "authToken": null,
  "sendType": "SEQUENTIALLY",
  "events": [
    "PAYMENT_CREATED",
    "PAYMENT_CONFIRMED",
    "PAYMENT_RECEIVED"
  ]
}
```

### Parâmetros

| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| `name` | String | Sim | Nome identificador do webhook |
| `url` | String | Sim | URL que receberá os eventos POST |
| `email` | String | Sim | Email para notificações de falha |
| `apiVersion` | Integer | Não | Versão da API (padrão: 3) |
| `enabled` | Boolean | Não | Ativar/desativar (padrão: true) |
| `interrupted` | Boolean | Não | Fila interrompida (padrão: false) |
| `authToken` | String | Não | Token de autenticação enviado no header |
| `sendType` | String | Não | "SEQUENTIALLY" ou "NON_SEQUENTIALLY" |
| `events` | Array | Sim | Lista de eventos a receber |

---

## 📋 EVENTOS DISPONÍVEIS

### Eventos de Pagamento (Cobranças)

| Evento | Quando é disparado |
|--------|-------------------|
| `PAYMENT_CREATED` | Nova cobrança criada |
| `PAYMENT_UPDATED` | Alteração em vencimento/valor |
| `PAYMENT_CONFIRMED` | ⭐ Pagamento confirmado |
| `PAYMENT_RECEIVED` | ⭐ Pagamento recebido |
| `PAYMENT_OVERDUE` | Pagamento vencido |
| `PAYMENT_DELETED` | Cobrança removida |
| `PAYMENT_RESTORED` | Cobrança restaurada |
| `PAYMENT_REFUNDED` | Pagamento estornado |
| `PAYMENT_RECEIVED_IN_CASH_UNDONE` | Confirmação desfeita |
| `PAYMENT_CHARGEBACK_REQUESTED` | Chargeback solicitado |
| `PAYMENT_CHARGEBACK_DISPUTE` | Contestação de chargeback |
| `PAYMENT_AWAITING_CHARGEBACK_REVERSAL` | Aguardando reversão |
| `PAYMENT_DUNNING_RECEIVED` | Pagamento de negativação |
| `PAYMENT_DUNNING_REQUESTED` | Negativação solicitada |
| `PAYMENT_BANK_SLIP_VIEWED` | Boleto visualizado |
| `PAYMENT_CHECKOUT_VIEWED` | Checkout visualizado |

**Principais para comissões**: `PAYMENT_CONFIRMED` e `PAYMENT_RECEIVED`

---

## 📦 ESTRUTURA DO PAYLOAD

Exemplo de evento recebido:

```json
{
  "id": "evt_abc123",
  "event": "PAYMENT_CONFIRMED",
  "dateCreated": "2025-01-14T10:30:00.000-03:00",
  "payment": {
    "id": "pay_123456789",
    "customer": "cus_000007222335",
    "value": 299.90,
    "netValue": 287.90,
    "status": "CONFIRMED",
    "billingType": "CREDIT_CARD",
    "description": "Mensalidade Plano Pro",
    "dueDate": "2025-01-15",
    "confirmedDate": "2025-01-14"
  }
}
```

### Campos Principais

- `id`: ID único do evento (usar para idempotência)
- `event`: Tipo de evento
- `dateCreated`: Data/hora do evento
- `payment`: Objeto com dados da cobrança

---

## ✅ BOAS PRÁTICAS

### 1. Retorne 200 Rapidamente

```javascript
// ✅ BOM
app.post('/webhook', (req, res) => {
  res.status(200).send();  // Responde imediatamente
  processarEvento(req.body); // Processa depois
});

// ❌ RUIM
app.post('/webhook', async (req, res) => {
  await processarEvento(req.body);  // Demora muito!
  res.status(200).send();
});
```

### 2. Implemente Idempotência

```javascript
const { id, event, payment } = req.body;

// Verificar se já processou este evento
const jaProcessado = await db.query(
  'SELECT 1 FROM webhook_logs WHERE asaas_event_id = ?',
  [id]
);

if (jaProcessado) {
  return res.status(200).send(); // Já processou, retorna OK
}

// Processar evento...
```

### 3. Configure Apenas Eventos Necessários

Não configure todos os eventos! Sobrecarrega seu servidor.

```json
// ✅ BOM - Apenas o que precisa
"events": ["PAYMENT_CONFIRMED", "PAYMENT_RECEIVED"]

// ❌ RUIM - Tudo
"events": ["PAYMENT_*", "SUBSCRIPTION_*", "TRANSFER_*", ...]
```

### 4. Use Filas para Processamento

```
Webhook recebido → Salva em fila → Retorna 200
                    ↓
              Worker processa fila
```

---

## 🚀 COMANDOS PRONTOS

### Listar Webhooks Existentes

```bash
curl https://sandbox.asaas.com/api/v3/webhooks \
  -H "access_token: $ASAAS_API_KEY"
```

### Criar Novo Webhook

```bash
curl -X POST https://sandbox.asaas.com/api/v3/webhooks \
  -H "accept: application/json" \
  -H "content-type: application/json" \
  -H "access_token: $ASAAS_API_KEY" \
  -d @webhook-config.json
```

### Atualizar Webhook Existente

```bash
curl -X PUT https://sandbox.asaas.com/api/v3/webhooks/WEBHOOK_ID \
  -H "access_token: $ASAAS_API_KEY" \
  -H "content-type: application/json" \
  -d @webhook-config.json
```

### Deletar Webhook

```bash
curl -X DELETE https://sandbox.asaas.com/api/v3/webhooks/WEBHOOK_ID \
  -H "access_token: $ASAAS_API_KEY"
```

---

## 🔧 SCRIPTS DISPONÍVEIS NESTE PROJETO

### 1. Configurar Webhook Automaticamente

```bash
node configurar-webhook-asaas.mjs
```

Este script:
- Lista webhooks existentes
- Cria novo webhook com configuração ideal
- Mostra detalhes do webhook criado

### 2. Criar Cliente para Teste

```bash
node create-cliente-cloud.mjs
```

Cria cliente no ASAAS e Supabase para testar webhook.

### 3. Verificar Erros do Webhook

```bash
node check-webhook-error-now.mjs
```

Verifica logs de erro e se cliente existe.

---

## 🎯 FLUXO COMPLETO DE TESTE

```
1. Configurar webhook
   → node configurar-webhook-asaas.mjs

2. Criar cliente
   → node create-cliente-cloud.mjs

3. Criar pagamento de teste
   → node test-baby-step-3-create-payment.mjs

4. Webhook é disparado automaticamente
   → ASAAS envia POST para sua URL

5. Verificar comissões calculadas
   → node test-baby-step-4-check-commissions.mjs
```

---

## 📞 SUPORTE

- **Documentação**: https://docs.asaas.com/docs/sobre-os-webhooks
- **API Reference**: https://docs.asaas.com/reference/criar-novo-webhook
- **Central de Ajuda**: https://ajuda.asaas.com/pt-BR/articles/3860347-webhooks

