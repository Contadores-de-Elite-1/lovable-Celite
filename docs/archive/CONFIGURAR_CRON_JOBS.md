# ⏰ Configuração OBRIGATÓRIA - CRON Jobs

## 🚨 ATENÇÃO: Executar ANTES de ir para produção

Para o sistema funcionar automaticamente, você **DEVE** configurar os CRON jobs que executam as edge functions nos dias corretos do mês.

---

## 📋 Pré-requisitos

1. Acesse o **SQL Editor** do Supabase:
   https://supabase.com/dashboard/project/zytxwdgzjqrcmbnpgofj/sql/new

2. Certifique-se de que as extensões `pg_cron` e `pg_net` estão habilitadas

---

## 🔧 Passo 1: Habilitar Extensões (se necessário)

Execute este SQL primeiro:

```sql
-- Habilitar pg_cron (agendamento de tarefas)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Habilitar pg_net (requisições HTTP)
CREATE EXTENSION IF NOT EXISTS pg_net;
```

---

## 📅 Passo 2: Configurar CRON - Pagamentos (Dia 25)

**O QUE FAZ:** Processa pagamentos de comissões todo dia 25 às 09:00

```sql
SELECT cron.schedule(
  'processar-pagamentos-dia-25',
  '0 9 25 * *', -- Dia 25 de cada mês às 09:00
  $$
  SELECT net.http_post(
    url:='https://zytxwdgzjqrcmbnpgofj.supabase.co/functions/v1/processar-pagamento-comissoes',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5dHh3ZGd6anFyY21ibnBnb2ZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5ODY2NDIsImV4cCI6MjA3NjU2MjY0Mn0.KXvdfxHITLvW2r1Qiiv5CSVG-B1pGYrO4Qu7HWq-nQw"}'::jsonb,
    body:='{}'::jsonb
  ) AS request_id;
  $$
);
```

**✅ Sucesso esperado:** Retorna o ID do job criado

---

## 📅 Passo 3: Configurar CRON - Bônus LTV (Dia 1)

**O QUE FAZ:** Verifica clientes com 12 meses e calcula bônus LTV todo dia 1 às 10:00

```sql
SELECT cron.schedule(
  'verificar-ltv-bonus-dia-1',
  '0 10 1 * *', -- Dia 1 de cada mês às 10:00
  $$
  SELECT net.http_post(
    url:='https://zytxwdgzjqrcmbnpgofj.supabase.co/functions/v1/verificar-ltv-bonus',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5dHh3ZGd6anFyY21ibnBnb2ZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5ODY2NDIsImV4cCI6MjA3NjU2MjY0Mn0.KXvdfxHITLvW2r1Qiiv5CSVG-B1pGYrO4Qu7HWq-nQw"}'::jsonb,
    body:='{}'::jsonb
  ) AS request_id;
  $$
);
```

**✅ Sucesso esperado:** Retorna o ID do job criado

---

## 🔍 Passo 4: Verificar CRON Jobs Ativos

Execute este SQL para listar os jobs configurados:

```sql
SELECT 
  jobid,
  schedule,
  command,
  nodename,
  nodeport,
  database,
  username,
  active
FROM cron.job
ORDER BY jobid DESC;
```

**Você deve ver 2 jobs:**
1. `processar-pagamentos-dia-25` - Schedule: `0 9 25 * *`
2. `verificar-ltv-bonus-dia-1` - Schedule: `0 10 1 * *`

---

## 🗑️ Desabilitar/Remover CRON (se necessário)

### Desabilitar temporariamente:
```sql
-- Desabilitar pagamentos
UPDATE cron.job 
SET active = false 
WHERE jobname = 'processar-pagamentos-dia-25';

-- Desabilitar LTV
UPDATE cron.job 
SET active = false 
WHERE jobname = 'verificar-ltv-bonus-dia-1';
```

### Remover permanentemente:
```sql
-- Remover job de pagamentos
SELECT cron.unschedule('processar-pagamentos-dia-25');

-- Remover job de LTV
SELECT cron.unschedule('verificar-ltv-bonus-dia-1');
```

---

## 🧪 Testar CRON Jobs Manualmente

Você pode chamar as edge functions diretamente para testar:

### Via Supabase Dashboard:
1. Acesse: https://supabase.com/dashboard/project/zytxwdgzjqrcmbnpgofj/functions
2. Clique na função desejada
3. Clique em "Invoke" no canto superior direito
4. Envie `{}` como body

### Via cURL:
```bash
# Testar pagamentos
curl -X POST \
  'https://zytxwdgzjqrcmbnpgofj.supabase.co/functions/v1/processar-pagamento-comissoes' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5dHh3ZGd6anFyY21ibnBnb2ZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5ODY2NDIsImV4cCI6MjA3NjU2MjY0Mn0.KXvdfxHITLvW2r1Qiiv5CSVG-B1pGYrO4Qu7HWq-nQw' \
  -H 'Content-Type: application/json' \
  -d '{}'

# Testar LTV
curl -X POST \
  'https://zytxwdgzjqrcmbnpgofj.supabase.co/functions/v1/verificar-ltv-bonus' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5dHh3ZGd6anFyY21ibnBnb2ZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5ODY2NDIsImV4cCI6MjA3NjU2MjY0Mn0.KXvdfxHITLvW2r1Qiiv5CSVG-B1pGYrO4Qu7HWq-nQw' \
  -H 'Content-Type: application/json' \
  -d '{}'
```

---

## 📊 Monitorar Execuções

### Verificar histórico de execuções:
```sql
SELECT 
  runid,
  jobid,
  status,
  return_message,
  start_time,
  end_time
FROM cron.job_run_details
ORDER BY start_time DESC
LIMIT 20;
```

### Verificar logs da última execução:
```sql
SELECT 
  j.jobname,
  r.status,
  r.return_message,
  r.start_time,
  r.end_time
FROM cron.job j
LEFT JOIN cron.job_run_details r ON r.jobid = j.jobid
WHERE j.jobname IN ('processar-pagamentos-dia-25', 'verificar-ltv-bonus-dia-1')
ORDER BY r.start_time DESC
LIMIT 10;
```

---

## ⚠️ Troubleshooting

### Problema: CRON não está executando
**Possíveis causas:**
1. `active = false` → Execute `UPDATE cron.job SET active = true WHERE jobname = 'nome-do-job';`
2. Extensão `pg_cron` não instalada → Execute `CREATE EXTENSION pg_cron;`
3. Horário no formato errado → Verifique o formato cron (minuto hora dia mês dia_semana)

### Problema: Edge function retorna erro 401
**Causa:** Token de autorização expirado ou inválido
**Solução:** Atualizar o Bearer token no comando SQL do CRON

### Problema: CRON executou mas não há resultados
**Diagnóstico:**
1. Verificar logs da edge function no Supabase Dashboard
2. Confirmar que há dados elegíveis (comissões `aprovada`, clientes com 12 meses, etc.)

---

## ✅ Checklist Final

Antes de ir para produção, confirme:

- [ ] Extensões `pg_cron` e `pg_net` estão habilitadas
- [ ] CRON `processar-pagamentos-dia-25` está criado e ativo
- [ ] CRON `verificar-ltv-bonus-dia-1` está criado e ativo
- [ ] Testou manualmente ambas as edge functions
- [ ] Verificou logs e confirmou que não há erros
- [ ] Documentou o processo para a equipe

---

## 📞 Links Úteis

- **SQL Editor:** https://supabase.com/dashboard/project/zytxwdgzjqrcmbnpgofj/sql/new
- **Edge Functions:** https://supabase.com/dashboard/project/zytxwdgzjqrcmbnpgofj/functions
- **Logs Pagamentos:** https://supabase.com/dashboard/project/zytxwdgzjqrcmbnpgofj/functions/processar-pagamento-comissoes/logs
- **Logs LTV:** https://supabase.com/dashboard/project/zytxwdgzjqrcmbnpgofj/functions/verificar-ltv-bonus/logs

---

**🚨 CRÍTICO:** Sem os CRON jobs configurados, os pagamentos e bônus LTV NÃO serão processados automaticamente!
