# 🚀 CRIAR CLIENTE - SOLUÇÃO RÁPIDA

## Opção 1: Script Node.js (RECOMENDADO)

Execute no seu terminal Mac:

```bash
node create-cliente-cloud.mjs
```

## Opção 2: Comandos curl (se script falhar)

### Passo 1: Criar Cliente no ASAAS

```bash
curl -X POST https://sandbox.asaas.com/api/v3/customers \
  -H "accept: application/json" \
  -H "content-type: application/json" \
  -H "access_token: \$aact_hmlg_000MzkwODA2MWY2OGM3MWRlMDU2NWM3MzJlNzZmNGZhZGY6Ojg5NGI4NmYzLWQxYmUtNDkwYy05ZWMwLTM5ZTFhZGUwYWM2MDo6JGFhY2hfNDNkMWQ3N2YtNTEzOS00NmU3LWE4NzAtMzU0Y2Q1ZWEyYTA4" \
  -d '{
    "name": "Empresa Teste Webhook",
    "email": "teste-webhook@empresa.com",
    "cpfCnpj": "12345678000199",
    "phone": "11999999999",
    "observation": "Cliente para teste webhook"
  }'
```

**COPIE O ID RETORNADO** (exemplo: `cus_000007222335`)

### Passo 2: Criar Cliente no Supabase

Substitua `SEU_ASAAS_CUSTOMER_ID` pelo ID copiado acima e `SEU_CONTADOR_ID` por um ID de contador existente:

```bash
curl -X POST 'https://zytxwdgzjqrcmbnpgofj.supabase.co/rest/v1/clientes' \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5dHh3ZGd6anFyY21ibnBnb2ZqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDk4NjY0MiwiZXhwIjoyMDc2NTYyNjQyfQ.uC4X8zC-XtPNfQC0m7aKEoYO8DtCtbT4kZ67QGI-1A4" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5dHh3ZGd6anFyY21ibnBnb2ZqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDk4NjY0MiwiZXhwIjoyMDc2NTYyNjQyfQ.uC4X8zC-XtPNfQC0m7aKEoYO8DtCtbT4kZ67QGI-1A4" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{
    "contador_id": "SEU_CONTADOR_ID",
    "nome_empresa": "Empresa Teste Webhook",
    "cnpj": "12345678000199",
    "contato_email": "teste-webhook@empresa.com",
    "contato_telefone": "11999999999",
    "status": "lead",
    "plano": "profissional",
    "valor_mensal": 299.90,
    "asaas_customer_id": "SEU_ASAAS_CUSTOMER_ID"
  }'
```

## Opção 3: Buscar IDs Necessários

Para pegar um ID de contador existente:

```bash
curl 'https://zytxwdgzjqrcmbnpgofj.supabase.co/rest/v1/contadores?select=id&limit=1' \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5dHh3ZGd6anFyY21ibnBnb2ZqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDk4NjY0MiwiZXhwIjoyMDc2NTYyNjQyfQ.uC4X8zC-XtPNfQC0m7aKEoYO8DtCtbT4kZ67QGI-1A4" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5dHh3ZGd6anFyY21ibnBnb2ZqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDk4NjY0MiwiZXhwIjoyMDc2NTYyNjQyfQ.uC4X8zC-XtPNfQC0m7aKEoYO8DtCtbT4kZ67QGI-1A4"
```

---

## 📋 JSON de Configuração do Webhook ASAAS

Você também perguntou sobre configurar o webhook em JSON. Aqui está:

### webhook-config.json

```json
{
  "name": "Webhook Contadores de Elite - Producao",
  "url": "https://zytxwdgzjqrcmbnpgofj.supabase.co/functions/v1/webhook-asaas",
  "email": "dev@contadoresdeelite.com",
  "apiVersion": 3,
  "enabled": true,
  "interrupted": false,
  "authToken": "opcional-token-seguranca",
  "events": [
    "PAYMENT_RECEIVED",
    "PAYMENT_CONFIRMED",
    "PAYMENT_OVERDUE",
    "PAYMENT_DELETED",
    "PAYMENT_RESTORED",
    "PAYMENT_REFUNDED",
    "PAYMENT_RECEIVED_IN_CASH_UNDONE",
    "PAYMENT_CHARGEBACK_REQUESTED",
    "PAYMENT_CHARGEBACK_DISPUTE",
    "PAYMENT_AWAITING_CHARGEBACK_REVERSAL",
    "PAYMENT_DUNNING_RECEIVED",
    "PAYMENT_DUNNING_REQUESTED",
    "PAYMENT_BANK_SLIP_VIEWED",
    "PAYMENT_CHECKOUT_VIEWED"
  ],
  "sendType": "SEQUENTIALLY"
}
```

### Criar webhook via curl:

```bash
curl -X POST https://sandbox.asaas.com/api/v3/webhooks \
  -H "accept: application/json" \
  -H "content-type: application/json" \
  -H "access_token: \$aact_hmlg_000MzkwODA2MWY2OGM3MWRlMDU2NWM3MzJlNzZmNGZhZGY6Ojg5NGI4NmYzLWQxYmUtNDkwYy05ZWMwLTM5ZTFhZGUwYWM2MDo6JGFhY2hfNDNkMWQ3N2YtNTEzOS00NmU3LWE4NzAtMzU0Y2Q1ZWEyYTA4" \
  -d @webhook-config.json
```

## 🎯 Próximos Passos

Depois de criar o cliente:

1. Teste o webhook com o novo `asaas_customer_id`
2. Verifique os logs em `audit_logs`
3. Confirme que comissões foram calculadas

