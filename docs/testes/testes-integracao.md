# 📋 Registro Oficial – Integração Asaas ↔ Supabase

**Início da Documentação:** 2025-01-14 22:15:30 UTC
**Responsável Técnico:** Claude Code (Modo Automático)
**Projeto:** Contadores de Elite - MVP
**Objetivo:** Destravar integração ASAAS e validar fluxo completo

---

## ⚡ Objetivo Geral

Registrar todos os testes, todos os erros, todos os retornos, todos os endpoints, e todo comportamento real da integração:

```
Asaas → Supabase → Lógica de Comissões → Front → Pagamentos
```

Este arquivo será atualizado em tempo real a cada teste executado.

---

## ⚙️ Protocolo de Execução

### Modo Automático
O sistema (via Claude Code) executará automaticamente tudo que for possível sem intervenção humana.

**Só será pedido ao Pedro ações que:**
- dependam de chaves secretas
- dependam de permissão humana
- dependam de acesso externo
- ou que sejam absolutamente impossíveis de automatizar

### Criação de Cliente de Teste
- Se o cliente `cus_000007222099` não existir no banco → **criar um cliente novo imediatamente**
- Não repetir testes com cliente quebrado
- Cada teste deve gerar um log completo, sempre no mesmo formato

---

## 🧪 Formato obrigatório de cada teste

```markdown
### TESTE #X — [DATA/HORA]

**Ação executada:**
(descrever brevemente o que foi feito)

**Endpoint acionado:**
(URL completa atingida pelo Asaas ou chamada manual)

**Método:**
(GET/POST/PUT/etc.)

**Payload enviado:**
(json exato usado no teste)

**Resposta do endpoint:**
(json retornado, se houver)

**HTTP retornado:**
(200, 404, 500, 401, etc.)

**Logs do Supabase:**
(eventos recebidos, edge functions acionadas, triggers, erros)

**Resultado:**
(o que funcionou / o que falhou)

**Diagnóstico inicial:**
(conclusão direta do teste)

**Próxima ação automática:**
(passos que serão executados imediatamente)
```

---

## 🟢 STATUS ATUAL

- ✅ Documento de LOG criado
- ⏳ Integração Asaas → nunca retornou 200
- ⚠️ Retornos observados: 404, 500, erros internos e endpoints não encontrados
- 🚀 Teste sistemático iniciando AGORA

**Problema identificado anteriormente:**
- Cliente `cus_000007222099` não existe no banco de dados
- Webhook lança exception → HTTP 500
- ASAAS vê falha e não confirma processamento

**Ação automática planejada:**
1. Verificar se cliente existe
2. Se não existir, criar automaticamente
3. Testar webhook com cliente válido
4. Registrar todos os resultados

---

## 📒 HISTÓRICO DE TESTES

### TESTE #1 — 2025-01-14 22:16:47 UTC

**Ação executada:**
Tentativa de verificação automática da existência do cliente `cus_000007222099` via script Node.js conectando ao Supabase.

**Endpoint acionado:**
`https://zytxwdgzjqrcmbnpgofj.supabase.co/rest/v1/clientes` (via Supabase JS Client)

**Método:**
SELECT (via Supabase client)

**Query executada:**
```sql
SELECT id, contador_id, nome_empresa, asaas_customer_id, status, plano, valor_mensal, created_at
FROM clientes
WHERE asaas_customer_id = 'cus_000007222099';
```

**Resposta do banco:**
```
❌ TypeError: fetch failed
```

**HTTP retornado:**
N/A (falha de rede antes de HTTP)

**Logs do Supabase:**
N/A (não conseguiu conectar)

**Resultado:**
❌ **FALHOU** - Ambiente sandbox não tem conectividade externa com Supabase Cloud

**Diagnóstico inicial:**
- Ambiente de execução (Claude Code sandbox) não possui acesso de rede externo
- Não é possível automatizar consultas SQL ou criação de registros via script
- **Limitação técnica do ambiente, não do código**

**Conclusão:**
Este teste prova que a automação 100% não é possível devido a restrições de rede.
**Ação humana necessária** para criar cliente no banco.

**Próxima ação:**
Preparar SQL pronto para Pedro executar + Preparar TESTE #2 (simulação de webhook)

---

### 🚨 AÇÃO NECESSÁRIA (PEDRO)

Como o ambiente não permite conexão com Supabase, você precisa executar este SQL manualmente:

**1. Acesse:** https://supabase.com/dashboard/project/zytxwdgzjqrcmbnpgofj/editor

**2. Execute este SQL:**

```sql
-- Verificar se cliente já existe
SELECT id, asaas_customer_id, nome_empresa FROM clientes
WHERE asaas_customer_id = 'cus_000007222099';

-- Se retornar vazio, execute:

-- Primeiro, pegue um contador_id disponível:
SELECT id FROM contadores WHERE status = 'ativo' LIMIT 1;

-- Se não houver contador, crie um:
-- SELECT id FROM auth.users LIMIT 1;
-- INSERT INTO contadores (user_id, nivel, status, xp, clientes_ativos)
-- VALUES ('USER_ID_AQUI', 'bronze', 'ativo', 0, 0) RETURNING id;

-- Depois crie o cliente (substituir CONTADOR_ID):
INSERT INTO clientes (
  contador_id,
  nome_empresa,
  cnpj,
  contato_email,
  status,
  plano,
  valor_mensal,
  asaas_customer_id,
  data_ativacao
) VALUES (
  'CONTADOR_ID_AQUI',
  'Cliente Teste Webhook ASAAS',
  '00000000000000',
  'teste@webhook-asaas.com',
  'ativo',
  'profissional',
  199.90,
  'cus_000007222099',
  NOW()
) RETURNING id, asaas_customer_id, nome_empresa;
```

**3. Confirme aqui quando executar:** "Cliente criado" ou "Cliente já existe"

Enquanto isso, preparo o TESTE #2 (simulação de webhook).

---

### TESTE #2 — 2025-01-14 22:17:00 UTC
**(PREPARANDO - AGUARDANDO CONFIRMAÇÃO DO TESTE #1)**

**Ação planejada:**
Simular webhook do ASAAS enviando evento PAYMENT_RECEIVED para o endpoint do Supabase.

**Endpoint que será acionado:**
`https://zytxwdgzjqrcmbnpgofj.supabase.co/functions/v1/webhook-asaas`

**Método:**
POST

**Payload que será enviado:**
```json
{
  "id": "evt_test_20250114_001",
  "event": "PAYMENT_RECEIVED",
  "dateCreated": "2025-01-14T22:17:00.000Z",
  "payment": {
    "id": "pay_test_20250114_001",
    "customer": "cus_000007222099",
    "value": 199.90,
    "netValue": 197.90,
    "dateCreated": "2025-01-14T00:00:00.000Z",
    "confirmedDate": "2025-01-14T22:17:00.000Z",
    "status": "RECEIVED",
    "billingType": "PIX",
    "subscription": null
  }
}
```

**Comando curl preparado:**
```bash
curl -X POST https://zytxwdgzjqrcmbnpgofj.supabase.co/functions/v1/webhook-asaas \
  -H "Content-Type: application/json" \
  -d '{
    "id": "evt_test_20250114_001",
    "event": "PAYMENT_RECEIVED",
    "dateCreated": "2025-01-14T22:17:00.000Z",
    "payment": {
      "id": "pay_test_20250114_001",
      "customer": "cus_000007222099",
      "value": 199.90,
      "netValue": 197.90,
      "dateCreated": "2025-01-14T00:00:00.000Z",
      "confirmedDate": "2025-01-14T22:17:00.000Z",
      "status": "RECEIVED",
      "billingType": "PIX",
      "subscription": null
    }
  }' \
  -w "\nHTTP Status: %{http_code}\n" \
  -s -S
```

**Status:**
⏳ AGUARDANDO confirmação de que cliente foi criado no TESTE #1

---

_[LOG será atualizado continuamente durante os testes]_
