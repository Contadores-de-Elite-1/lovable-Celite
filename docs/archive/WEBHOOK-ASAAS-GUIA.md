# 🔗 GUIA COMPLETO - WEBHOOK ASAAS

## 📚 Informações da Documentação Oficial

**Fonte**: https://docs.asaas.com/docs/sobre-os-webhooks

### O que são Webhooks ASAAS?

Webhooks são eventos enviados pelo ASAAS para uma URL configurada quando algo acontece na sua conta (pagamento recebido, cobrança criada, etc.). São objetos JSON enviados via POST.

### Características Importantes

1. **Limite**: Até 10 URLs de webhooks por conta
2. **Idempotência**: Cada evento tem ID único - use para evitar processar duplicatas
3. **Garantia**: "At least once" - pode receber o mesmo evento mais de uma vez
4. **Resposta**: Status HTTP 200-299 para considerar sucesso
5. **Autenticação**: Token opcional enviado em header `asaas-access-token`
6. **Falhas**: Após **15 falhas consecutivas**, fila é **interrompida** automaticamente
7. **Retenção**: ⚠️ **Eventos guardados por apenas 14 dias!** Depois disso são **excluídos permanentemente**
8. **Notificação**: ASAAS envia email se fila for interrompida

### ⚠️ CRÍTICO - Gestão de Falhas

**O que acontece quando falha:**
1. Seu endpoint retorna erro (não 200-299)
2. ASAAS tenta novamente
3. Após **15 falhas consecutivas**: fila **PARA**
4. Você recebe **email de aviso**
5. Eventos continuam sendo gerados mas **NÃO são enviados**
6. Você tem **14 dias** para resolver
7. Após 14 dias, eventos antigos são **DELETADOS**

**Como resolver:**
1. Corrija o problema no seu endpoint
2. Acesse: Minha Conta → Integração → Webhooks
3. Reative a fila de sincronização
4. Eventos pendentes serão processados em ordem cronológica

---

## 🛠️ CONFIGURAÇÃO VIA API

### Endpoint

**Sandbox (Teste)**:
```
POST https://api-sandbox.asaas.com/v3/webhooks
```

**Produção**:
```
POST https://api.asaas.com/v3/webhooks
```

### Headers Obrigatórios

```json
{
  "accept": "application/json",
  "content-type": "application/json",
  "access_token": "SEU_TOKEN_ASAAS"
}
```

### Respostas da API

- **200** - Webhook criado com sucesso
- **400** - Erro na requisição (Bad Request)
- **401** - Não autorizado (Unauthorized)

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

### Parâmetros (Body)

| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| `name` | String | Sim | Nome do Webhook |
| `url` | String | Sim | URL de destino dos eventos |
| `email` | String | Sim | E-mail que receberá notificações sobre o Webhook |
| `enabled` | Boolean | Não | Definir se o Webhook está ativo |
| `interrupted` | Boolean | Não | Definir se a fila de sincronização está interrompida |
| `apiVersion` | Integer (int32) | Não | Versão da API |
| `authToken` | String | Não | Token de autenticação do Webhook |
| `sendType` | String (enum) | Não | Sequencial (`SEQUENTIALLY`) ou não sequencial (`NON_SEQUENTIALLY`) |
| `events` | Array of Strings (enum) | Sim | Lista de eventos enviados pelo Webhook |

**Nota**: Webhooks agora possuem um **ID**. Você pode utilizar este ID para editar, visualizar dados ou removê-lo. Você também pode listar todos os Webhooks configurados.

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
| `PAYMENT_AUTHORIZED` | Pagamento autorizado |
| `PAYMENT_AWAITING_RISK_ANALYSIS` | Aguardando análise de risco |
| `PAYMENT_APPROVED_BY_RISK_ANALYSIS` | Aprovado pela análise de risco |
| `PAYMENT_REPROVED_BY_RISK_ANALYSIS` | Reprovado pela análise de risco |
| `PAYMENT_CREDIT_CARD_CAPTURE_REFUSED` | Captura de cartão recusada |
| `PAYMENT_ANTICIPATED` | Pagamento antecipado |
| `PAYMENT_REFUND_IN_PROGRESS` | Estorno em andamento |

**⭐ Principais para comissões**: `PAYMENT_CONFIRMED` e `PAYMENT_RECEIVED`

**Total**: 23 eventos de pagamento disponíveis

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

## ✅ BOAS PRÁTICAS (Documentação Oficial)

### 1. Retorne 200 o Mais Rápido Possível ⚡

**Crítico**: Resposta deve ser **200-299**. Após **15 falhas**, fila é **interrompida**.

```javascript
// ✅ BOM - Responde imediatamente
app.post('/webhook', (req, res) => {
  res.status(200).send();  // Retorna sucesso AGORA
  processarEvento(req.body); // Processa depois de forma assíncrona
});

// ❌ RUIM - Demora para responder
app.post('/webhook', async (req, res) => {
  await processarEvento(req.body);  // ASAAS fica esperando!
  res.status(200).send();           // Pode dar timeout!
});
```

### 2. Gerencie Eventos Duplicados (Idempotência) 🔄

**Garantia**: "At least once" - mesmo evento pode chegar mais de uma vez.

```javascript
const { id, event, payment } = req.body;

// ✅ Verificar se já processou usando o ID único do evento
const jaProcessado = await db.query(
  'SELECT 1 FROM webhook_logs WHERE asaas_event_id = ?',
  [id]  // ID único de cada evento
);

if (jaProcessado) {
  console.log(`Evento ${id} já processado. Ignorando duplicata.`);
  return res.status(200).send(); // Retorna OK sem reprocessar
}

// Processar evento pela primeira vez...
await db.query(
  'INSERT INTO webhook_logs (asaas_event_id, ...) VALUES (?, ...)',
  [id, ...]
);
```

### 3. Configure APENAS Eventos Necessários ⚙️

**Importante**: Não sobrecarregue seu servidor recebendo eventos desnecessários.

```json
// ✅ BOM - Apenas o que sua aplicação precisa
"events": [
  "PAYMENT_CONFIRMED",  // Pagamento confirmado
  "PAYMENT_RECEIVED"    // Pagamento recebido
]

// ❌ RUIM - Todos os eventos (sobrecarga!)
"events": [
  "PAYMENT_CREATED", "PAYMENT_UPDATED", "PAYMENT_CONFIRMED",
  "PAYMENT_RECEIVED", "PAYMENT_OVERDUE", "PAYMENT_DELETED",
  ... 17 outros eventos que você não usa ...
]
```

### 4. Gerencie Eventos de Forma Assíncrona 🚀

**Escalabilidade**: Evite processar eventos de forma síncrona.

```
┌─────────────────────────────────────────────────┐
│ Webhook recebido                                │
│  ↓                                              │
│ Salva em fila (Redis, RabbitMQ, SQS)           │
│  ↓                                              │
│ Retorna 200 imediatamente ✅                    │
│                                                 │
│        (separado)                               │
│         ↓                                       │
│    Worker processa fila de forma assíncrona     │
│         ↓                                       │
│    Calcula comissões, atualiza banco, etc.      │
└─────────────────────────────────────────────────┘
```

### 5. Verifique Origem com Token de Autenticação 🔐

**Segurança**: Garanta que requisições vêm do ASAAS.

```javascript
app.post('/webhook', (req, res) => {
  const token = req.headers['asaas-access-token'];
  const expectedToken = process.env.WEBHOOK_AUTH_TOKEN;

  if (token !== expectedToken) {
    console.error('Token inválido! Possível ataque.');
    return res.status(401).send('Unauthorized');
  }

  // Token válido, processar evento...
  res.status(200).send();
});
```

**Configure o token** no webhook:
```json
{
  "authToken": "seu-token-secreto-aqui"
}
```

### 6. Monitore a Fila de Sincronização 📊

**Prevenção**: Fique atento a emails do ASAAS sobre fila interrompida.

- Use `GET /v3/webhooks` para verificar campo `interrupted`
- Se `interrupted: true`, corrija e reative a fila
- Você tem **14 dias** antes de perder eventos!

---

## 🔧 GERENCIAMENTO DE WEBHOOKS

### Listar Todos os Webhooks

**Endpoint**: `GET /v3/webhooks`

```bash
curl https://api-sandbox.asaas.com/v3/webhooks \
  -H "accept: application/json" \
  -H "access_token: $ASAAS_API_KEY"
```

**Resposta**: Lista de webhooks com seus IDs, status, eventos configurados e se a fila está interrompida.

### Visualizar Webhook Específico

**Endpoint**: `GET /v3/webhooks/{id}`

```bash
curl https://api-sandbox.asaas.com/v3/webhooks/WEBHOOK_ID \
  -H "accept: application/json" \
  -H "access_token: $ASAAS_API_KEY"
```

### Criar Novo Webhook

**Endpoint**: `POST /v3/webhooks`

```bash
curl -X POST https://api-sandbox.asaas.com/v3/webhooks \
  -H "accept: application/json" \
  -H "content-type: application/json" \
  -H "access_token: $ASAAS_API_KEY" \
  -d @webhook-config.json
```

**Resposta 200**: Webhook criado com ID

### Editar Webhook Existente

**Endpoint**: `PUT /v3/webhooks/{id}`

```bash
curl -X PUT https://api-sandbox.asaas.com/v3/webhooks/WEBHOOK_ID \
  -H "accept: application/json" \
  -H "content-type: application/json" \
  -H "access_token: $ASAAS_API_KEY" \
  -d @webhook-config.json
```

### Deletar Webhook

**Endpoint**: `DELETE /v3/webhooks/{id}`

```bash
curl -X DELETE https://api-sandbox.asaas.com/v3/webhooks/WEBHOOK_ID \
  -H "accept: application/json" \
  -H "access_token: $ASAAS_API_KEY"
```

---

## 🚀 COMANDOS PRONTOS (Sandbox)

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

