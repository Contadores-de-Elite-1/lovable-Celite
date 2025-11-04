# Configuração do CRON para Bônus LTV

## 📋 Instruções

Execute os seguintes comandos SQL no **SQL Editor** do Supabase para configurar o processamento automático do Bônus LTV:

---

## 1. Remover CRON Antigo (se existir)

```sql
SELECT cron.unschedule('verificar-ltv-bonus-dia-1');
```

---

## 2. Criar Novo CRON - Bônus LTV por Grupo

```sql
SELECT cron.schedule(
  'verificar-bonus-ltv-grupo',
  '0 10 1 * *', -- Dia 1 de cada mês às 10:00
  $$
  SELECT
    net.http_post(
        url:='https://zytxwdgzjqrcmbnpgofj.supabase.co/functions/v1/verificar-bonus-ltv',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5dHh3ZGd6anFyY21ibnBnb2ZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5ODY2NDIsImV4cCI6MjA3NjU2MjY0Mn0.KXvdfxHITLvW2r1Qiiv5CSVG-B1pGYrO4Qu7HWq-nQw"}'::jsonb,
        body:='{}'::jsonb
    ) as request_id;
  $$
);
```

---

## 3. Verificar CRON Jobs Ativos

```sql
SELECT * FROM cron.job ORDER BY jobname;
```

### Resultado Esperado:

| jobname | schedule | command |
|---------|----------|---------|
| processar-pagamentos-dia-25 | 0 9 25 * * | POST processar-pagamento-comissoes |
| verificar-bonus-ltv-grupo | 0 10 1 * * | POST verificar-bonus-ltv |

---

## 📖 O que o CRON faz?

### `verificar-bonus-ltv-grupo`
- **Executa:** Dia 1 de cada mês às 10:00
- **Função:** Identifica grupos de clientes que completaram 12 meses e calcula Bônus LTV
- **Lógica:**
  1. Busca clientes ativados há 13 meses (ex: ativados em Jan/2024, processados em Fev/2025)
  2. Agrupa por contador + mês de ativação
  3. Conta quantos clientes do grupo ainda estão ativos
  4. Se >= 5 clientes ativos:
     - 5-9: 15% sobre soma das mensalidades (Bonificação #14)
     - 10-14: 30% sobre soma das mensalidades (Bonificação #15)
     - 15+: 50% sobre soma das mensalidades (Bonificação #16)
  5. Cria bônus em `bonus_historico` e comissão em `comissoes`

---

## 🧪 Testar Manualmente

Para testar sem esperar o CRON:

```sql
SELECT
  net.http_post(
    url:='https://zytxwdgzjqrcmbnpgofj.supabase.co/functions/v1/verificar-bonus-ltv',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5dHh3ZGd6anFyY21ibnBnb2ZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5ODY2NDIsImV4cCI6MjA3NjU2MjY0Mn0.KXvdfxHITLvW2r1Qiiv5CSVG-B1pGYrO4Qu7HWq-nQw"}'::jsonb,
    body:='{}'::jsonb
  ) as request_id;
```

---

## 📝 Scripts de Teste SQL

### 1. Criar Grupo de Teste (ativados há 13 meses)

```sql
-- Substitua 'SEU-CONTADOR-UUID' pelo UUID real de um contador de teste
INSERT INTO clientes (contador_id, cnpj, nome_empresa, valor_mensal, status, data_ativacao, plano)
VALUES 
  ('SEU-CONTADOR-UUID', '11111111000101', 'Teste LTV A', 130, 'ativo', (CURRENT_DATE - INTERVAL '13 months'), 'basic'),
  ('SEU-CONTADOR-UUID', '22222222000102', 'Teste LTV B', 130, 'ativo', (CURRENT_DATE - INTERVAL '13 months'), 'basic'),
  ('SEU-CONTADOR-UUID', '33333333000103', 'Teste LTV C', 130, 'ativo', (CURRENT_DATE - INTERVAL '13 months'), 'basic'),
  ('SEU-CONTADOR-UUID', '44444444000104', 'Teste LTV D', 130, 'ativo', (CURRENT_DATE - INTERVAL '13 months'), 'basic'),
  ('SEU-CONTADOR-UUID', '55555555000105', 'Teste LTV E', 130, 'ativo', (CURRENT_DATE - INTERVAL '13 months'), 'basic'),
  ('SEU-CONTADOR-UUID', '66666666000106', 'Teste LTV F', 130, 'cancelado', (CURRENT_DATE - INTERVAL '13 months'), 'basic'); -- não conta
```

### 2. Verificar Grupos Elegíveis para LTV

```sql
SELECT 
  contador_id,
  TO_CHAR(data_ativacao, 'YYYY-MM') as mes_grupo,
  COUNT(*) FILTER (WHERE status = 'ativo') as clientes_ativos,
  COUNT(*) as total_inicial,
  SUM(valor_mensal) FILTER (WHERE status = 'ativo') as soma_valores,
  CASE 
    WHEN COUNT(*) FILTER (WHERE status = 'ativo') >= 15 THEN '50% (Bonificação #16)'
    WHEN COUNT(*) FILTER (WHERE status = 'ativo') >= 10 THEN '30% (Bonificação #15)'
    WHEN COUNT(*) FILTER (WHERE status = 'ativo') >= 5 THEN '15% (Bonificação #14)'
    ELSE 'Não elegível'
  END as bonus_ltv,
  CASE 
    WHEN COUNT(*) FILTER (WHERE status = 'ativo') >= 15 
      THEN SUM(valor_mensal) FILTER (WHERE status = 'ativo') * 0.50
    WHEN COUNT(*) FILTER (WHERE status = 'ativo') >= 10 
      THEN SUM(valor_mensal) FILTER (WHERE status = 'ativo') * 0.30
    WHEN COUNT(*) FILTER (WHERE status = 'ativo') >= 5 
      THEN SUM(valor_mensal) FILTER (WHERE status = 'ativo') * 0.15
    ELSE 0
  END as valor_bonus
FROM clientes
WHERE data_ativacao >= CURRENT_DATE - INTERVAL '13 months'
  AND data_ativacao < CURRENT_DATE - INTERVAL '12 months'
GROUP BY contador_id, TO_CHAR(data_ativacao, 'YYYY-MM')
ORDER BY contador_id, mes_grupo;
```

### 3. Verificar Bônus LTV Criados

```sql
SELECT 
  bh.id,
  bh.contador_id,
  bh.tipo_bonus,
  bh.valor,
  bh.competencia,
  bh.status,
  bh.observacao,
  bh.conquistado_em
FROM bonus_historico bh
WHERE bh.tipo_bonus = 'bonus_ltv'
ORDER BY bh.conquistado_em DESC;
```

---

## ⚠️ Importante

- **Não remova o CRON de pagamento**: `processar-pagamentos-dia-25` deve continuar ativo
- **Bônus LTV é pago uma única vez por grupo**: Não há duplicação
- **Grupos diferentes podem receber múltiplos bônus**: Um contador pode ter vários grupos em meses diferentes
- **Apenas clientes ativos contam**: Clientes cancelados não entram no cálculo

---

## 🔗 Links Úteis

- [Documentação CRON Supabase](https://supabase.com/docs/guides/functions/schedule-functions)
- [Documentação pg_cron](https://github.com/citusdata/pg_cron)
