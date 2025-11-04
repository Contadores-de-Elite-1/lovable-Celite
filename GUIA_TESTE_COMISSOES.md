# 🧪 GUIA DE TESTES - Sistema de Comissões

Este guia ensina como criar dados de teste para validar todo o fluxo de comissões e bônus.

---

## 📋 PASSO 1: Criar Contadores de Teste

Acesse o **Supabase SQL Editor** e execute:

```sql
-- Criar 3 contadores de teste (Bronze, Prata, Ouro)
INSERT INTO contadores (id, user_id, crc, nivel, status, clientes_ativos, data_ingresso) VALUES
  ('00000000-0000-0000-0000-000000000001', auth.uid(), 'CRC-001', 'bronze', 'ativo', 3, '2024-01-15'),
  ('00000000-0000-0000-0000-000000000002', auth.uid(), 'CRC-002', 'prata', 'ativo', 7, '2024-01-15'),
  ('00000000-0000-0000-0000-000000000003', auth.uid(), 'CRC-003', 'ouro', 'ativo', 12, '2024-01-15');
```

---

## 📋 PASSO 2: Criar Clientes com Datas Estratégicas

### 2.1 Cliente que completa 12 meses ESTE MÊS (para testar LTV)

```sql
-- Se hoje é abril/2025, cria cliente ativado em abril/2024
INSERT INTO clientes (
  id, 
  contador_id, 
  nome_empresa, 
  cnpj, 
  plano, 
  valor_mensal, 
  status, 
  data_ativacao
) VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001', -- Contador Bronze
  'Empresa Teste LTV 12 Meses',
  '12345678000199',
  'standard',
  500.00,
  'ativo',
  (CURRENT_DATE - INTERVAL '12 months')::date -- Exatamente 12 meses atrás
);
```

### 2.2 Clientes com 6 meses (para calcular ticket médio)

```sql
-- Criar 2 clientes ativados há 6 meses
INSERT INTO clientes (
  id, 
  contador_id, 
  nome_empresa, 
  cnpj, 
  plano, 
  valor_mensal, 
  status, 
  data_ativacao
) VALUES 
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'Cliente 6 Meses A', '11111111000101', 'standard', 400.00, 'ativo', (CURRENT_DATE - INTERVAL '6 months')::date),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'Cliente 6 Meses B', '22222222000102', 'standard', 600.00, 'ativo', (CURRENT_DATE - INTERVAL '6 months')::date);
```

### 2.3 Clientes recém-ativados (ativação este mês)

```sql
-- Cliente ativado HOJE (para gerar comissão de ativação)
INSERT INTO clientes (
  id, 
  contador_id, 
  nome_empresa, 
  cnpj, 
  plano, 
  valor_mensal, 
  status, 
  data_ativacao
) VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000002', -- Contador Prata
  'Cliente Novo - Ativação Hoje',
  '33333333000103',
  'standard',
  800.00,
  'ativo',
  CURRENT_DATE
);
```

---

## 📋 PASSO 3: Criar Pagamentos de Teste

### 3.1 Pagamento confirmado (primeira mensalidade)

```sql
-- Pegar o ID do cliente recém-criado
DO $$
DECLARE
  v_cliente_id uuid;
BEGIN
  SELECT id INTO v_cliente_id FROM clientes WHERE nome_empresa = 'Cliente Novo - Ativação Hoje';
  
  INSERT INTO pagamentos (
    id,
    cliente_id,
    tipo,
    valor_bruto,
    valor_liquido,
    competencia,
    status,
    pago_em,
    asaas_payment_id
  ) VALUES (
    gen_random_uuid(),
    v_cliente_id,
    'mensalidade',
    800.00,
    760.00, -- Descontando taxas
    DATE_TRUNC('month', CURRENT_DATE),
    'confirmed',
    NOW(),
    'pay_' || substring(gen_random_uuid()::text, 1, 8)
  );
END $$;
```

### 3.2 Pagamentos dos últimos 6 meses (para ticket médio LTV)

```sql
-- Criar 6 pagamentos mensais para o cliente de 12 meses
DO $$
DECLARE
  v_cliente_id uuid;
  v_mes integer;
BEGIN
  SELECT id INTO v_cliente_id FROM clientes WHERE nome_empresa = 'Empresa Teste LTV 12 Meses';
  
  -- Criar 6 pagamentos (últimos 6 meses)
  FOR v_mes IN 1..6 LOOP
    INSERT INTO pagamentos (
      id,
      cliente_id,
      tipo,
      valor_bruto,
      valor_liquido,
      competencia,
      status,
      pago_em,
      asaas_payment_id
    ) VALUES (
      gen_random_uuid(),
      v_cliente_id,
      'mensalidade',
      500.00,
      475.00,
      (CURRENT_DATE - (v_mes || ' months')::interval)::date,
      'confirmed',
      (CURRENT_DATE - (v_mes || ' months')::interval),
      'pay_' || substring(gen_random_uuid()::text, 1, 8)
    );
  END LOOP;
END $$;
```

---

## 🧪 PASSO 4: Testar o Fluxo Completo

### 4.1 Testar Webhook Asaas (Calcular Comissões)

Vá em **Edge Functions > webhook-asaas > Test** e envie:

```json
{
  "event": "PAYMENT_CONFIRMED",
  "payment": {
    "id": "pay_test_12345",
    "customer": "cus_test_001",
    "value": 800.00,
    "netValue": 760.00,
    "billingType": "CREDIT_CARD",
    "status": "CONFIRMED",
    "confirmedDate": "2025-04-01"
  }
}
```

**Resultado esperado:**
- Comissão direta criada (status: `calculada`)
- Se o contador tiver sponsor, comissão override criada

### 4.2 Testar Aprovação de Comissões

Vá em **Edge Functions > aprovar-comissoes > Test** e envie:

```json
{
  "competencia": "2025-04",
  "observacao": "Aprovação manual de teste"
}
```

**Resultado esperado:**
- Comissões mudam de `calculada` para `aprovada`

### 4.3 Testar Processamento de Pagamento (Dia 25)

Vá em **Edge Functions > processar-pagamento-comissoes > Test** e clique em **Send Request** (sem body).

**Resultado esperado:**
- Se total >= R$100: Comissões marcadas como `paga`
- Se total < R$100: Comissões ficam acumuladas para próximo mês
- Notificação criada para o contador

### 4.4 Testar Bônus LTV (Dia 1)

Vá em **Edge Functions > verificar-ltv-bonus > Test** e clique em **Send Request**.

**Resultado esperado:**
- Bônus LTV criado para clientes que completaram 12 meses
- Percentual calculado: 15%, 30% ou 50% (baseado em total de clientes ativos)
- Ticket médio calculado dos últimos 6 meses

---

## 📊 PASSO 5: Verificar Resultados

### 5.1 Ver comissões criadas

```sql
SELECT 
  c.id,
  c.tipo,
  c.valor,
  c.status,
  c.competencia,
  cl.nome_empresa,
  cont.crc
FROM comissoes c
LEFT JOIN clientes cl ON cl.id = c.cliente_id
LEFT JOIN contadores cont ON cont.id = c.contador_id
ORDER BY c.created_at DESC
LIMIT 20;
```

### 5.2 Ver bônus LTV criados

```sql
SELECT 
  b.id,
  b.tipo_bonus,
  b.valor,
  b.status,
  b.competencia,
  b.observacao,
  b.conquistado_em,
  cont.crc
FROM bonus_historico b
LEFT JOIN contadores cont ON cont.id = b.contador_id
ORDER BY b.conquistado_em DESC;
```

### 5.3 Ver notificações

```sql
SELECT 
  n.titulo,
  n.mensagem,
  n.tipo,
  n.created_at,
  n.lida,
  cont.crc
FROM notificacoes n
LEFT JOIN contadores cont ON cont.id = n.contador_id
ORDER BY n.created_at DESC
LIMIT 10;
```

---

## 🎯 CENÁRIOS DE TESTE

### ✅ Cenário 1: Comissão Direta (Bronze)
- **Cliente:** Valor mensal R$500
- **Contador:** Bronze (3% ativação, 10% recorrente)
- **Comissão ativação esperada:** R$15,00
- **Comissão recorrente esperada:** R$50,00

### ✅ Cenário 2: Override (Sponsor Prata)
- **Cliente:** Indicado por Bronze (sponsor: Prata)
- **Override esperado (Prata):** 4% sobre R$500 = R$20,00

### ✅ Cenário 3: Bônus LTV (12 meses)
- **Cliente:** Ativo há 12 meses, ticket médio R$475
- **Bônus esperado (Bronze, 15%):** R$71,25

### ✅ Cenário 4: Pagamento Acumulado
- **Contador:** Total de comissões R$85 (< R$100)
- **Resultado:** Fica acumulado para próximo mês

---

## 🚨 PROBLEMAS COMUNS

### ❌ "Nenhuma comissão criada"
- Verifique se o cliente tem `contador_id` válido
- Verifique se o pagamento está `status = 'confirmed'`

### ❌ "Bônus LTV não criado"
- Verifique se `data_ativacao` do cliente está há exatamente 12 meses
- Execute a função no dia 1 do mês ou simule alterando a data no código

### ❌ "Erro 500 no processamento"
- Veja os logs: **Edge Functions > [nome] > Logs**
- Verifique se há comissões com status `aprovada`

---

## 📌 PRÓXIMOS PASSOS

Após validar com dados de teste:

1. ✅ Configure webhooks reais do Asaas
2. ✅ Verifique CRON jobs estão ativos (SQL: `SELECT * FROM cron.job`)
3. ✅ Monitore logs diariamente: **Edge Functions > Logs**
4. ✅ Configure alertas para erros críticos

---

**💡 DICA:** Use sempre o **Supabase SQL Editor** para consultas rápidas e validação de dados!
