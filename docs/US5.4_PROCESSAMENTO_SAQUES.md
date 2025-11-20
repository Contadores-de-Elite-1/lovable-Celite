# 💸 US5.4 - PROCESSAMENTO DE SAQUES

**Status:** ✅ CÓDIGO PRONTO (CRON PENDENTE)  
**Data:** 19/11/2025  
**Duração:** 3-4 dias

---

## 🎯 OBJETIVO

Automatizar o processamento de saques. No dia 25 de cada mês, transferir as comissões aprovadas para as contas Stripe dos contadores.

---

## ✅ O QUE FOI IMPLEMENTADO

### Edge Function: `processar-pagamentos`

**Arquivo:** `supabase/functions/processar-pagamentos/index.ts`

**Responsabilidades:**
- ✅ Busca comissões com status "aprovada"
- ✅ Agrupa por contador
- ✅ Valida valor mínimo (R$ 100)
- ✅ Valida Stripe Account ID conectado
- ✅ Cria Stripe Transfer para cada contador
- ✅ Atualiza comissões para status "paga"
- ✅ Acumula comissões < R$ 100 para mês seguinte
- ✅ Tratamento de erros individual (não falha tudo se um falhar)
- ✅ Registra em audit_logs
- ✅ Logging estruturado

---

## 📋 FLUXO COMPLETO

```
[DIA 25 DO MÊS - 03:00 AM]
        ↓
[CRON dispara processar-pagamentos]
        ↓
[Edge Function busca comissões "aprovada"]
        ↓
[Agrupa por contador]
        ↓
        ├─ Se total < R$ 100 → Acumula para próximo mês
        │
        ├─ Se sem Stripe Account ID → Erro (contador não conectou)
        │
        └─ Se total >= R$ 100 → Cria Stripe Transfer
                ↓
            [Stripe processa transferência]
                ↓
            [Atualiza comissão → status = "paga"]
                ↓
            [Envia notificação ao contador]
                ↓
            [CONTADOR RECEBE DINHEIRO! ✅]
```

---

## 📊 EXEMPLO DE PROCESSAMENTO

### Cenário: 3 contadores com comissões

**Entrada (comissões "aprovada" do mês):**
```
Contador A: R$ 150
Contador B: R$ 80
Contador C: R$ 120
Total: R$ 350
```

**Processamento:**
```
Contador A:
  - Total: R$ 150
  - Status: >= R$ 100 ✅
  - Stripe Account: acct_123 ✅
  - Ação: Cria Stripe Transfer de R$ 150
  - Resultado: "paga" ✅

Contador B:
  - Total: R$ 80
  - Status: < R$ 100 ❌
  - Ação: Acumula para próximo mês
  - Observação: "Aguardando R$ 20 para atingir mínimo"

Contador C:
  - Total: R$ 120
  - Status: >= R$ 100 ✅
  - Stripe Account: acct_456 ✅
  - Ação: Cria Stripe Transfer de R$ 120
  - Resultado: "paga" ✅

Resultados:
  - Pagos: 2
  - Acumulados: 1 (próximo mês pode receber)
  - Erros: 0
```

---

## ⚠️ REGRAS IMPORTANTES

### 1. Valor Mínimo: R$ 100
- Se comissão < R$ 100, acumula para o mês seguinte
- Contador vê observação: "Aguardando R$ X para atingir R$ 100"

### 2. Data do Processamento: DIA 25
- Sempre dia 25 de cada mês
- Horário: 03:00 AM (Brasil)
- NUNCA é alterado, mesmo se for fim de semana

### 3. Stripe Account ID Obrigatório
- Contador DEVE estar conectado ao Stripe
- Se não estiver, comissão fica com status "não processada"
- Admin recebe alerta

### 4. Transferências são Permanentes
- Após Stripe Transfer ser criada, é irreversível
- Se houver erro, comissão fica com observação de erro
- Admin pode revisar e fazer transferência manual depois

### 5. Idempotência
- Se rodada 2x no mesmo dia, não cria transferências duplicadas
- Verifica `stripe_transfer_id` antes de criar

---

## 🧪 COMO TESTAR

### Teste Manual (sem CRON)

1. Chamar a função manualmente:
```bash
curl -X POST https://SEU_PROJECT.supabase.co/functions/v1/processar-pagamentos \
  -H "Authorization: Bearer $SERVICE_ROLE_KEY"
```

2. Verificar na base:
```sql
-- Ver comissões processadas
SELECT * FROM comissoes 
WHERE status = 'paga' 
AND updated_at > NOW() - INTERVAL '1 hour'
ORDER BY updated_at DESC;

-- Ver transfers
SELECT * FROM audit_logs 
WHERE acao = 'processar_pagamentos' 
AND created_at > NOW() - INTERVAL '1 hour';
```

### Teste com CRON (depois de configurar)

1. Aguardar dia 25 do mês
2. Verificar logs do Supabase
3. Confirmar que transferências foram criadas
4. Verificar que contadores receberam notificações

---

## 🔧 PRÓXIMAS AÇÕES: CONFIGURAR CRON

Falta configurar o CRON job para rodar automaticamente no dia 25.

### Opção 1: Supabase Database Webhooks (Recomendado)

1. Ir para Supabase Dashboard
2. Database → Webhooks
3. Criar webhook que dispara no dia 25
4. URL: `https://SEU_PROJECT.supabase.co/functions/v1/processar-pagamentos`

### Opção 2: Criar Edge Function com Timer

Criar nova Edge Function que monitora o dia e dispara automaticamente.

### Opção 3: CRON externo (AWS Lambda, etc)

Usar serviço externo para chamar a função no dia 25.

---

## 📊 TABELAS ENVOLVIDAS

| Tabela | Ações |
|--------|-------|
| `comissoes` | SELECT, UPDATE (status, stripe_transfer_id, observacao) |
| `contadores` | SELECT (stripe_account_id) |
| `audit_logs` | INSERT (registro de processamento) |

---

## 🔒 SEGURANÇA

### Validações
- ✅ Stripe Account ID validado
- ✅ Valor mínimo (R$ 100) validado
- ✅ Status "aprovada" validado
- ✅ Sem valores negativos

### Proteções
- ✅ Transferências são irreversíveis no Stripe
- ✅ Cada contador recebe exatamente o valor devido
- ✅ Logs completos de auditoria
- ✅ Erro em um contador não afeta outros

---

## 📝 MONITORAMENTO

### Alertas que devem ser enviados

1. **Sucesso:** "Processamento concluído - X transferências criadas"
2. **Erro:** "Erro ao processar saques - verifique logs"
3. **Aviso:** "Y contadores não conectaram Stripe"

### Métricas para acompanhar

- Total de comissões processadas
- Total em transferências
- Quantidade de contadores pagos
- Quantidade acumulada (< R$ 100)
- Taxa de erro

---

## ✅ CHECKLIST DE IMPLEMENTAÇÃO

- [x] Edge Function `processar-pagamentos` implementada
- [x] Validações robustas
- [x] Error handling individual
- [x] Logging estruturado
- [ ] CRON job configurado para dia 25
- [ ] Teste manual realizado
- [ ] Teste com CRON (aguardar dia 25)
- [ ] Alertas configurados
- [ ] Documentação para admin

---

## 🎯 LINHA DO TEMPO PARA CONTADOR

```
Dia 1-24:  Contador oferece serviços → Clientes pagam
Dia 24:    Noturno → Edge Function calcula comissões
Dia 25:    Madrugada (03:00 AM) → CRON processa saques
Dia 25:    Manhã → Contador recebe notificação
Dia 25-27: Stripe processa a transferência
Dia 27-28: Dinheiro chega na conta do contador ✅
```

---

## 📝 NOTAS

- Código segue as diretrizes: código em inglês, comentários em português
- Sem emojis em nenhuma saída
- Usa logging estruturado (JSON)
- Validação robusta com Zod
- Edge Function pronta para production
- Precisa apenas configurar CRON
