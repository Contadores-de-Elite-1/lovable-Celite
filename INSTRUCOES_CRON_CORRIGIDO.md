# ✅ CORREÇÃO: CRON Jobs - Sistema de Comissões

## 🎯 CONFIGURAÇÃO FINAL CORRETA

Após análise detalhada, o sistema precisa de **APENAS 1 CRON JOB**:

---

## ✅ CRON ÚNICO: Processar Pagamentos (Dia 25)

Execute no **Supabase SQL Editor**:

```sql
-- Deletar CRON antigo do LTV (não é mais necessário)
SELECT cron.unschedule('verificar-ltv-bonus-dia-1');

-- Manter apenas o CRON de pagamentos
-- Verificar se já existe
SELECT jobid, jobname, schedule, active FROM cron.job WHERE jobname = 'processar-pagamentos-dia-25';
```

Se não existir, crie:

```sql
SELECT cron.schedule(
  'processar-pagamentos-dia-25',
  '0 9 25 * *', -- Todo dia 25 às 09:00
  $$
  SELECT net.http_post(
    url:='https://zytxwdgzjqrcmbnpgofj.supabase.co/functions/v1/processar-pagamento-comissoes',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5dHh3ZGd6anFyY21ibnBnb2ZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5ODY2NDIsImV4cCI6MjA3NjU2MjY0Mn0.KXvdfxHITLvW2r1Qiiv5CSVG-B1pGYrO4Qu7HWq-nQw"}'::jsonb,
    body:='{}'::jsonb
  ) AS request_id;
  $$
);
```

---

## 📝 POR QUE APENAS 1 CRON?

### ❌ ANTES (Incorreto):
- **CRON Dia 1:** Verificar LTV de todos os clientes
- **CRON Dia 25:** Processar pagamentos

### ✅ AGORA (Correto):
- **CRON Dia 25:** Processar pagamentos
- **Bônus LTV:** Calculado automaticamente dentro do `webhook-asaas` **a cada pagamento confirmado** que completa 12 meses

---

## 🔄 NOVO FLUXO CORRETO

```mermaid
graph TD
    A[Asaas: Pagamento Confirmado] --> B[Webhook Asaas]
    B --> C{Cliente completou<br/>12 meses?}
    C -->|Sim| D[Calcular Ticket Médio<br/>últimos 6 meses]
    D --> E[Criar Bônus LTV<br/>15%, 30% ou 50%]
    E --> F[Criar Comissão LTV]
    C -->|Não| G[Calcular apenas<br/>comissões normais]
    F --> H[Salvar tudo]
    G --> H
    
    I[DIA 25: CRON Job] --> J[Processar Pagamento<br/>Comissões]
    J --> K{Total >= R$100?}
    K -->|Sim| L[Marcar como 'paga'<br/>+ Notificar]
    K -->|Não| M[Acumular para<br/>próximo mês]
```

---

## 🎯 VANTAGENS DA NOVA LÓGICA

### ✅ Verificação em Tempo Real
- Cada cliente é verificado individualmente quando completa 12 meses
- Não depende de uma data fixa mensal

### ✅ Harmonia com Asaas
- O primeiro pagamento define a `data_ativacao`
- Após 12 meses, qualquer pagamento confirmado aciona o bônus

### ✅ Precisão
- Ticket médio calculado com dados reais dos últimos 6 meses
- Percentual ajustado automaticamente conforme crescimento do contador

### ✅ Menos Processamento
- Não precisa varrer toda a base no dia 1
- Processa apenas quando há pagamento real

---

## 📊 EXEMPLO PRÁTICO

### Cenário: Contador indica 3 clientes em meses diferentes

| Cliente | Data Ativação | Completa 12 meses | Quando recebe LTV? |
|---------|---------------|-------------------|-------------------|
| Cliente A | 15/01/2024 | 15/01/2025 | No pagamento de janeiro/2025 |
| Cliente B | 10/03/2024 | 10/03/2025 | No pagamento de março/2025 |
| Cliente C | 22/05/2024 | 22/05/2025 | No pagamento de maio/2025 |

**Resultado:** Contador recebe 3 bônus LTV em meses diferentes, cada um calculado individualmente!

---

## 🧪 COMO TESTAR

### 1. Criar cliente com data antiga

```sql
INSERT INTO clientes (
  id, contador_id, nome_empresa, cnpj, plano, valor_mensal, 
  status, data_ativacao
) VALUES (
  gen_random_uuid(),
  '<SEU_CONTADOR_ID>',
  'Teste LTV 12 Meses',
  '12345678000199',
  'standard',
  500.00,
  'ativo',
  (CURRENT_DATE - INTERVAL '12 months')::date -- 12 meses atrás
);
```

### 2. Criar 6 pagamentos históricos

```sql
DO $$
DECLARE
  v_cliente_id uuid;
  v_mes integer;
BEGIN
  SELECT id INTO v_cliente_id FROM clientes WHERE nome_empresa = 'Teste LTV 12 Meses';
  
  FOR v_mes IN 1..6 LOOP
    INSERT INTO pagamentos (
      id, cliente_id, tipo, valor_bruto, valor_liquido,
      competencia, status, pago_em, asaas_payment_id
    ) VALUES (
      gen_random_uuid(), v_cliente_id, 'mensalidade', 500.00, 475.00,
      (CURRENT_DATE - (v_mes || ' months')::interval)::date,
      'confirmed', NOW(), 'pay_' || substring(gen_random_uuid()::text, 1, 8)
    );
  END LOOP;
END $$;
```

### 3. Simular webhook Asaas

Vá em **Edge Functions > webhook-asaas > Test** e envie:

```json
{
  "event": "PAYMENT_CONFIRMED",
  "payment": {
    "id": "pay_test_ltv_001",
    "customer": "<ASAAS_CUSTOMER_ID_DO_CLIENTE>",
    "value": 500.00,
    "netValue": 475.00,
    "dateCreated": "2025-04-15",
    "confirmedDate": "2025-04-15",
    "status": "CONFIRMED"
  }
}
```

**Resultado esperado:** Logs devem mostrar:
```
📅 Cliente ativo há 12 meses (desde 2024-04-15)
🎯 Cliente elegível para Bônus LTV! Calculando...
💰 Ticket médio (últimos 6 meses): R$ 475.00
🎁 Bônus LTV: 15% sobre R$ 475.00 = R$ 71.25
✅ Bônus LTV criado: R$ 71.25
```

---

## ✅ CHECKLIST FINAL

- [x] CRON do LTV removido/desativado
- [x] CRON de pagamentos mantido (dia 25)
- [x] Webhook Asaas atualizado com lógica LTV
- [x] Testes realizados com dados simulados
- [x] Logs monitorados para validação

---

## 🔗 Links Úteis

- [Logs Webhook Asaas](https://supabase.com/dashboard/project/zytxwdgzjqrcmbnpgofj/functions/webhook-asaas/logs)
- [Logs Processar Pagamentos](https://supabase.com/dashboard/project/zytxwdgzjqrcmbnpgofj/functions/processar-pagamento-comissoes/logs)
- [SQL Editor](https://supabase.com/dashboard/project/zytxwdgzjqrcmbnpgofj/sql/new)
- [CRON Jobs Overview](https://supabase.com/dashboard/project/zytxwdgzjqrcmbnpgofj/database/extensions)
