# 🔍 ANÁLISE COMPLETA - Webhook Não Processando

## Status Atual

- ✅ Webhook function está deployada (Version 24)
- ✅ Função está sendo **chamada** (audit_logs registra eventos)
- ❌ Função está **rejeitando** com erro "Erro desconhecido"
- ❌ Nenhum pagamento sendo registrado no banco
- ❌ Nenhuma comissão sendo calculada

## Possíveis Causas - CHECKLIST

### 1️⃣ PAYLOAD DO ASAAS
**Status**: ❓ DESCONHECIDO

Asaas está enviando payload com:
```json
{
  "event": "unknown", // ← Isso é ESTRANHO
  "payment": {...}
}
```

**Por que é estranho:**
- No test manual webhook enviamos `event: "PAYMENT_CONFIRMED"`
- Asaas real está retornando `event: "unknown"` nos logs
- Isso pode significar:
  - Asaas real envia evento diferente
  - Payload está corrompido/modificado
  - Asaas envia sem campo `event`

**Como verificar:**
```bash
# Ver se há padrão nos eventos
select payload from audit_logs where acao like '%WEBHOOK%' limit 10
```

### 2️⃣ ASSINATURA DO WEBHOOK
**Status**: ✅ ALLOWLIST TEMPORÁRIA ATIVA

Atual validação:
- Se `secret` não existe: **PERMITE**
- Se `signature` não existe: **PERMITE**
- Se ambos existem: valida MD5

**Problema**: Secret está configurado, pode estar rejeitando signatures inválidas!

**Como verificar:**
- Logs mostram: "⚠️ ASAAS_WEBHOOK_SECRET not configured" OU "Secret configured: NO"?
- Resposta esperada: Secret IS configured

### 3️⃣ ESTRUTURA DO PAYLOAD
**Status**: ❓ SUSPEITO

Código espera:
```javascript
{
  "event": "string",
  "payment": {
    "id": "string",
    "customer": "string",
    "value": number,
    "netValue": number,
    "dateCreated": "ISO string",
    "confirmedDate": "ISO string",
    "status": "string",
    "billingType": "string"
  }
}
```

**Por que pode ser problema:**
- Asaas real pode enviar **OUTRO NOME** nos campos
- Ex: `valor` vs `value`, `cliente` vs `customer`
- Campo `netValue` pode não existir
- Campo `billingType` pode ter valor diferente

### 4️⃣ ERRO INTERNO DA FUNÇÃO
**Status**: ❌ PROVÁVEL

Audit log diz: `"error": "Erro desconhecido"`

Isso vem da linha 348 do webhook:
```typescript
return new Response(
  JSON.stringify({ error: errorMessage }),
  { status: 500 }
);
```

**Significa**: Houve exceção/erro em `try` block (linhas 102-360).

**Não sabemos qual erro** porque não está sendo logado em audit_logs!

### 5️⃣ VALIDAÇÃO DE CAMPOS
**Status**: ⚠️ POTENCIAL

Linha 179-180:
```typescript
if (!payment || !payment.id || !payment.customer) {
  throw new Error('Dados de pagamento incompletos no payload');
}
```

**Se Asaas envia com chaves diferentes:**
- `cid` em vez de `customer`
- `customer_id` em vez de `customer`
- `cliente` em vez de `customer`

Vai falhar aqui!

### 6️⃣ VALIDAÇÃO DE VALORES
**Status**: ⚠️ POTENCIAL

Linha 176-177:
```typescript
valor_bruto: validarValorMonetario(payment.value, 'valor_bruto'),
valor_liquido: validarValorMonetario(payment.netValue, 'valor_liquido'),
```

**Se `netValue` é null/undefined:**
Vai falhar em `validarValorMonetario()`

### 7️⃣ LOOKUP DO CLIENTE
**Status**: ⚠️ POTENCIAL

Linha 187-195:
```typescript
const { data: cliente, error: clienteError } = await supabase
  .from('clientes')
  .select('id, contador_id, data_ativacao')
  .eq('asaas_customer_id', payment.customer)
  .maybeSingle();
```

**Possível erro:**
- Campo esperado: `asaas_customer_id`
- Campo real em Asaas: `asaas_customer_id` (correto) OU outro valor
- Cliente não existe no banco

**Como verificar:**
```bash
select id, asaas_customer_id from clientes limit 5
```

---

## 🎯 AÇÕES DE INVESTIGAÇÃO RECOMENDADAS

### PASSO 1: Ver erro real
**Problema**: Audit log mostra "Erro desconhecido" mas não o erro real!

**Solução**: Adicionar logging detalhado ANTES de cada `.throw()`

```typescript
catch (error) {
  const errorMsg = error instanceof Error ? error.message : String(error);
  console.error('[WEBHOOK ERROR]', errorMsg);
  console.error('[WEBHOOK ERROR STACK]', error);

  await supabase.from('audit_logs').insert({
    acao: 'WEBHOOK_ASAAS_ERROR_DETAIL',
    tabela: 'pagamentos',
    payload: {
      error: errorMsg,
      stack: error instanceof Error ? error.stack : '',
      timestamp: new Date().toISOString()
    }
  });
}
```

### PASSO 2: Ver payload real
```typescript
console.log('[WEBHOOK PAYLOAD]', JSON.stringify(payload, null, 2));
console.log('[WEBHOOK PAYMENT]', JSON.stringify(payment, null, 2));
```

### PASSO 3: Ver estrutura esperada vs real
```typescript
console.log('[PAYMENT FIELDS]', Object.keys(payment).join(', '));
console.log('[HAS ID]', !!payment.id);
console.log('[HAS CUSTOMER]', !!payment.customer);
console.log('[HAS VALUE]', !!payment.value);
console.log('[HAS NETVALUE]', !!payment.netValue);
```

### PASSO 4: Teste com payload diferente
Tente manualmente com payloads que Asaas realmente envia:
- Sem `netValue`
- Com diferentes nomes de campo
- Com `event: null`

---

## 📊 DIAGNÓSTICO FINAL

A causa **MAIS PROVÁVEL** é:

**Asaas envia `netValue` como null/undefined OU com nome diferente**

Prova:
- Audit logs mostram "Erro desconhecido"
- Nenhum `WEBHOOK_ASAAS_ERROR_DETAIL` nos logs
- Significa erro está em try block, provavelmente em validação

---

## ✅ Próxima ação estruturada

1. Adicionar logging detalhado para capturar erro real
2. Deploy versão com logging melhorado
3. Simular pagamento novamente
4. Verificar que logs estão agora com erro específico
5. Corrigir baseado no erro real (não em suposição)

Assim não queimamos crédito "atirando no escuro"! 🎯
