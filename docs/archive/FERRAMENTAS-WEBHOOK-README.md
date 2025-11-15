# 🛠️ FERRAMENTAS WEBHOOK ASAAS - GUIA COMPLETO

Sistema completo de ferramentas para gerenciar webhooks ASAAS e testar integração de comissões.

**Baseado em**: Documentação oficial ASAAS (https://docs.asaas.com)

---

## 📚 DOCUMENTAÇÃO

### 📖 WEBHOOK-ASAAS-GUIA.md

**Guia completo** com toda a documentação oficial do ASAAS:

- 🔧 Configuração via API (endpoints, headers, body)
- 📋 Todos os 23 eventos de pagamento disponíveis
- 📦 Estrutura do payload e exemplos
- ✅ Boas práticas oficiais (idempotência, async, segurança)
- ⚠️ **CRÍTICO**: Gestão de falhas e retenção de 14 dias
- 🔧 Gerenciamento completo (listar, criar, editar, deletar)
- 🚀 Comandos curl prontos para usar

**Leia primeiro**: Este guia tem todas as informações que você precisa!

---

## 🚀 SCRIPTS DISPONÍVEIS

### 1️⃣ configurar-webhook-asaas.mjs

**Cria e configura webhook automaticamente**

```bash
node configurar-webhook-asaas.mjs
```

**O que faz:**
- ✅ Lista webhooks existentes
- ✅ Cria novo webhook com todos os 23 eventos de pagamento
- ✅ Mostra ID e detalhes do webhook criado
- ✅ Instrui como atualizar se webhook já existir

**Quando usar:**
- Primeira vez configurando webhook
- Precisa criar webhook adicional (limite: 10)

---

### 2️⃣ gerenciar-webhooks-asaas.mjs

**Gerencia webhooks existentes**

```bash
# Listar todos os webhooks
node gerenciar-webhooks-asaas.mjs list

# Ver detalhes de webhook específico
node gerenciar-webhooks-asaas.mjs view WEBHOOK_ID

# Deletar webhook
node gerenciar-webhooks-asaas.mjs delete WEBHOOK_ID
```

**O que mostra (list):**
- ID, nome, URL de cada webhook
- Status (ativo/inativo)
- ⚠️ **Fila interrompida ou não** (CRÍTICO!)
- Número de eventos configurados

**O que mostra (view):**
- Detalhes completos do webhook
- Lista de todos os eventos configurados
- Se tem token de autenticação
- Avisos se fila estiver interrompida

**Quando usar:**
- Verificar status dos webhooks
- Confirmar se fila está funcionando
- Ver configuração de eventos
- Limpar webhooks antigos

---

### 3️⃣ create-cliente-cloud.mjs

**Cria cliente para teste de webhook**

```bash
node create-cliente-cloud.mjs
```

**O que faz:**
1. Busca um contador existente (ou cria um novo)
2. Cria cliente no ASAAS Sandbox
3. Registra cliente no Supabase Cloud
4. Mostra IDs para uso em testes

**Quando usar:**
- Precisa testar webhook com cliente real
- Erro "Cliente não encontrado" nos testes
- Primeira vez testando sistema de comissões

---

### 4️⃣ check-webhook-error-now.mjs

**Diagnóstico inteligente de erros**

```bash
node check-webhook-error-now.mjs
```

**O que faz:**
- Verifica últimos 5 logs de auditoria
- Mostra erros de webhook
- Verifica se cliente específico existe
- Identifica causa raiz do problema

**Quando usar:**
- Webhook retornou erro
- Teste falhou
- Debug de problemas de integração

---

## 📁 ARQUIVOS DE CONFIGURAÇÃO

### webhook-config.json

**Template JSON pronto para usar**

Contém:
- Todos os 23 eventos de pagamento oficiais
- Configuração completa (name, url, email, etc.)
- Pronto para usar com curl ou Postman

**Como usar:**
```bash
curl -X POST https://api-sandbox.asaas.com/v3/webhooks \
  -H "access_token: $ASAAS_API_KEY" \
  -H "content-type: application/json" \
  -d @webhook-config.json
```

### cliente-payload.json

**Template de dados do cliente**

Estrutura para:
- Criar cliente no ASAAS
- Registrar no Supabase
- Usar em testes

---

## 🎯 FLUXO COMPLETO DE USO

### CENÁRIO 1: Primeira configuração

```bash
# 1. Ler o guia completo
cat WEBHOOK-ASAAS-GUIA.md

# 2. Configurar webhook no ASAAS
node configurar-webhook-asaas.mjs

# 3. Verificar se foi criado
node gerenciar-webhooks-asaas.mjs list

# 4. Criar cliente para teste
node create-cliente-cloud.mjs

# 5. Testar webhook (criar pagamento)
node test-baby-step-3-create-payment.mjs

# 6. Verificar comissões calculadas
node test-baby-step-4-check-commissions.mjs
```

### CENÁRIO 2: Diagnóstico de problemas

```bash
# 1. Verificar status dos webhooks
node gerenciar-webhooks-asaas.mjs list

# 2. Se fila interrompida: corrigir código e reativar no ASAAS
#    (Minha Conta → Integração → Webhooks)

# 3. Ver detalhes do webhook
node gerenciar-webhooks-asaas.mjs view WEBHOOK_ID

# 4. Diagnosticar erro específico
node check-webhook-error-now.mjs

# 5. Verificar logs no Supabase
# Tabela: audit_logs
# Filtro: acao LIKE '%WEBHOOK%'
```

### CENÁRIO 3: Limpar e recriar

```bash
# 1. Listar webhooks existentes
node gerenciar-webhooks-asaas.mjs list

# 2. Deletar webhook antigo
node gerenciar-webhooks-asaas.mjs delete WEBHOOK_ID_ANTIGO

# 3. Criar novo webhook
node configurar-webhook-asaas.mjs

# 4. Confirmar criação
node gerenciar-webhooks-asaas.mjs list
```

---

## ⚠️ INFORMAÇÕES CRÍTICAS

### 🚨 Retenção de 14 Dias

**IMPORTANTE**: ASAAS guarda eventos por **apenas 14 dias**!

- Se fila ficar interrompida, você tem 14 dias para resolver
- Após 14 dias, eventos antigos são **deletados permanentemente**
- Você receberá email do ASAAS se houver problema

### 🚨 Limite de Falhas

- Após **15 falhas consecutivas**, fila é **interrompida**
- Seu endpoint DEVE retornar status **200-299**
- Retorne 200 **imediatamente**, processe depois

### 🚨 Idempotência Obrigatória

- Mesmo evento pode chegar **mais de uma vez**
- Use o **ID único** do evento para evitar duplicatas
- Salve eventos processados em `webhook_logs`

---

## 📊 EVENTOS DE PAGAMENTO (23 Total)

**Principais para comissões:**
- `PAYMENT_CONFIRMED` ⭐ - Pagamento confirmado
- `PAYMENT_RECEIVED` ⭐ - Pagamento recebido

**Lifecycle completo:**
- `PAYMENT_CREATED` - Nova cobrança
- `PAYMENT_UPDATED` - Alteração
- `PAYMENT_ANTICIPATED` - Antecipado
- `PAYMENT_OVERDUE` - Vencido
- `PAYMENT_DELETED` - Removido
- `PAYMENT_RESTORED` - Restaurado

**Estornos:**
- `PAYMENT_REFUNDED` - Estornado
- `PAYMENT_REFUND_IN_PROGRESS` - Estorno em andamento

**Chargebacks:**
- `PAYMENT_CHARGEBACK_REQUESTED`
- `PAYMENT_CHARGEBACK_DISPUTE`
- `PAYMENT_AWAITING_CHARGEBACK_REVERSAL`

**Análise de Risco:**
- `PAYMENT_AUTHORIZED`
- `PAYMENT_AWAITING_RISK_ANALYSIS`
- `PAYMENT_APPROVED_BY_RISK_ANALYSIS`
- `PAYMENT_REPROVED_BY_RISK_ANALYSIS`
- `PAYMENT_CREDIT_CARD_CAPTURE_REFUSED`

**Outros:**
- `PAYMENT_RECEIVED_IN_CASH_UNDONE`
- `PAYMENT_DUNNING_RECEIVED`
- `PAYMENT_DUNNING_REQUESTED`
- `PAYMENT_BANK_SLIP_VIEWED`
- `PAYMENT_CHECKOUT_VIEWED`

---

## 🔐 SEGURANÇA

### Token de Autenticação

Configure `authToken` no webhook para verificar origem:

```json
{
  "authToken": "seu-token-secreto"
}
```

ASAAS enviará em header: `asaas-access-token`

Valide no seu endpoint:
```javascript
if (req.headers['asaas-access-token'] !== process.env.WEBHOOK_AUTH_TOKEN) {
  return res.status(401).send('Unauthorized');
}
```

---

## 📞 SUPORTE E DOCUMENTAÇÃO

- **Guia Local**: `WEBHOOK-ASAAS-GUIA.md`
- **Criar Cliente**: `CRIAR-CLIENTE-AGORA.md`
- **Docs Oficiais**: https://docs.asaas.com/docs/sobre-os-webhooks
- **API Reference**: https://docs.asaas.com/reference/criar-novo-webhook
- **Central de Ajuda**: https://ajuda.asaas.com/pt-BR/articles/3860347-webhooks

---

## ✅ CHECKLIST DE PRODUÇÃO

Antes de ir para produção, verifique:

- [ ] Webhook configurado com todos os eventos necessários
- [ ] Endpoint retorna 200-299 em menos de 3 segundos
- [ ] Idempotência implementada (verifica ID do evento)
- [ ] Processamento assíncrono (fila) implementado
- [ ] Token de autenticação configurado e validado
- [ ] Logs de webhook salvos no banco (`webhook_logs`)
- [ ] Monitoramento de fila interrompida configurado
- [ ] Email de notificações configurado no webhook
- [ ] Testes E2E passando (pagamento → comissão)
- [ ] Plano de recuperação para fila interrompida documentado

---

## 🎉 PRÓXIMOS PASSOS

1. **Ler o guia**: `WEBHOOK-ASAAS-GUIA.md`
2. **Configurar webhook**: `node configurar-webhook-asaas.mjs`
3. **Criar cliente**: `node create-cliente-cloud.mjs`
4. **Testar integração**: `node test-baby-step-3-create-payment.mjs`
5. **Verificar comissões**: `node test-baby-step-4-check-commissions.mjs`

**Sistema pronto para produção!** 🚀
