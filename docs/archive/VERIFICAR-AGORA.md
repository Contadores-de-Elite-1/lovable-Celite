# VERIFICAR SE WEBHOOK V3.0 FUNCIONOU

Voce criou a cobranca no ASAAS. Agora vamos verificar se processou.

## PASSO 1: VER LOGS DO WEBHOOK

Abrir: https://supabase.com/dashboard/project/zytxwdgzjqrcmbnpgofj/functions/webhook-asaas/logs

**Procurar por:**
- `[WEBHOOK] New webhook received from ASAAS`
- `[FIND_CONTADOR] Starting contador lookup`
- `[CLIENT] Starting client lookup/creation`
- `[CLIENT] Client not found - AUTO-CREATING` (se cliente novo)
- `[WEBHOOK] Processing completed successfully`

**Se aparecer `[FIND_CONTADOR]` = V3.0 ESTA RODANDO! ✅**

**Se NAO aparecer nada = Webhook nao foi chamado pelo ASAAS**

---

## PASSO 2: EXECUTAR SQL DE VERIFICACAO

Abrir: https://supabase.com/dashboard/project/zytxwdgzjqrcmbnpgofj/editor

**Executar arquivo:** `VERIFICAR-WEBHOOK-FUNCIONOU.sql`

Ou copiar e colar este SQL:

```sql
-- AUDIT LOGS - Ver se webhook foi processado
SELECT
  acao,
  tabela,
  payload->>'asaas_payment_id' as payment_id,
  payload->>'cliente_id' as cliente_id,
  created_at
FROM audit_logs
WHERE acao LIKE '%WEBHOOK%'
ORDER BY created_at DESC
LIMIT 5;

-- CLIENTES - Ver se cliente foi auto-criado
SELECT
  id,
  nome_empresa,
  asaas_customer_id,
  status,
  created_at
FROM clientes
ORDER BY created_at DESC
LIMIT 3;

-- PAGAMENTOS - Ver se pagamento foi registrado
SELECT
  id,
  cliente_id,
  tipo,
  valor_bruto,
  asaas_payment_id,
  status,
  created_at
FROM pagamentos
ORDER BY created_at DESC
LIMIT 3;

-- COMISSOES - Ver se comissões foram calculadas
SELECT
  id,
  contador_id,
  tipo,
  valor,
  status,
  created_at
FROM comissoes
ORDER BY created_at DESC
LIMIT 5;
```

---

## PASSO 3: COPIAR RESULTADO E ME ENVIAR

Copie o resultado do SQL e me envie.

Ou me diga:

1. Apareceu logs do webhook? (sim/nao)
2. Quantos clientes novos? (numero)
3. Quantos pagamentos novos? (numero)
4. Quantas comissoes novas? (numero)

---

## SE NAO FUNCIONOU:

**Possibilidades:**

### A) Webhook nao foi chamado pelo ASAAS
- Verificar se URL do webhook esta configurada no ASAAS
- Verificar se cobranca foi marcada como "recebida"

### B) Webhook deu erro
- Ver logs detalhados no Supabase
- Me enviar mensagem de erro exata

### C) Webhook V3.0 nao foi deployado
- Ver codigo deployado em: Edge Functions → webhook-asaas → Code
- Procurar por `findContadorId` ou `findOrCreateClient`
- Se nao tiver essas funcoes = ainda esta versao antiga

---

## DADOS DA COBRANCA QUE VOCE CRIOU:

Por favor me enviar:
- Numero da fatura
- Nome do cliente
- Valor
- Descricao (tem "ref=TESTE2025A"?)
- Status (pendente/recebida)

Assim posso ajudar a debugar se nao funcionou.
