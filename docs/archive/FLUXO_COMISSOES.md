# 📊 Sistema de Comissões - Documentação Completa

## 🎯 Visão Geral

Sistema completo de cálculo, aprovação e pagamento de comissões e bônus para contadores, com auditoria completa e segurança jurídica.

---

## 🔄 Fluxo Principal

```
┌─────────────┐
│   ASAAS     │ Webhook de pagamento confirmado
│  (Gateway)  │
└──────┬──────┘
       │
       ▼
┌─────────────────────┐
│  webhook-asaas      │ 1. Registra pagamento
│  (Edge Function)    │ 2. Valida duplicidade
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│ calcular-comissoes  │ 3. Calcula comissões/bônus
│  (Edge Function)    │ 4. Status: 'calculada'
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│ aprovar-comissoes   │ 5. Admin aprova
│  (Edge Function)    │ 6. Status: 'aprovada'
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│processar-pagamento  │ 7. Dia 25 de cada mês
│  (CRON Automático)  │ 8. Status: 'paga'
│  Regra: >= R$100    │ 9. Notifica contadores
└─────────────────────┘
```

---

## 💰 Matriz de Comissões

### 1. Comissão Direta (Ativação)
**Trigger:** Primeira mensalidade confirmada
**Valor:** 100% do valor líquido
**Tipo:** `ativacao`

**Exemplo:**
- Cliente paga R$ 200 → Contador recebe R$ 200

---

### 2. Comissão Recorrente
**Trigger:** Mensalidades após a primeira
**Valor:** Baseado no nível do contador

| Nível    | Clientes Ativos | Percentual |
|----------|-----------------|------------|
| Bronze   | 1-4             | 15%        |
| Prata    | 5-9             | 17,5%      |
| Ouro     | 10-14           | 20%        |
| Diamante | 15+             | 20%        |

**Exemplo:**
- Contador Prata (7 clientes ativos)
- Cliente paga R$ 200 → Contador recebe R$ 35 (17,5%)

---

### 3. Override (Sponsor)
**Trigger:** Downline realiza venda
**Valor:** Baseado no nível do SPONSOR

#### 3.1 Override Primeira Mensalidade
**Percentual:** Mesmo % de comissão direta do sponsor

| Nível Sponsor | Override 1ª Mensalidade |
|---------------|-------------------------|
| Bronze        | 15%                     |
| Prata         | 17,5%                   |
| Ouro          | 20%                     |
| Diamante      | 20%                     |

**Exemplo:**
- Sponsor Ouro (12 clientes)
- Downline ativa cliente R$ 200
- Sponsor recebe R$ 40 (20% override)

#### 3.2 Override Recorrente (CORRIGIDO ✅)
**Percentual:** Baseado no nível do sponsor

| Nível Sponsor | Override Recorrente |
|---------------|---------------------|
| Bronze        | 3%                  |
| Prata         | 4%                  |
| Ouro          | 5%                  |
| Diamante      | 5%                  |

**Exemplo:**
- Sponsor Prata (7 clientes)
- Downline recebe mensalidade R$ 200
- Sponsor recebe R$ 8 (4% override)

---

### 4. Bônus de Progressão
**Trigger:** Atingir marcos específicos de clientes ativos
**Valor:** R$ 100 por marco (pago uma única vez)

| Marco          | Clientes | Valor  | Tipo               |
|----------------|----------|--------|--------------------|
| Bônus Prata    | 5        | R$ 100 | bonus_progressao   |
| Bônus Ouro     | 10       | R$ 100 | bonus_progressao   |
| Bônus Diamante | 15       | R$ 100 | bonus_progressao   |

**Observações:**
- Pago apenas uma vez ao atingir cada marco
- Verificação automática a cada nova ativação

---

### 5. Bônus Volume
**Trigger:** A cada 5 clientes após 15 (Diamante)
**Valor:** R$ 100
**Tipo:** `bonus_volume`

**Marcos:**
- 20 clientes → R$ 100
- 25 clientes → R$ 100
- 30 clientes → R$ 100
- (continua a cada 5)

---

### 6. Bônus LTV (Lifetime Value) - Bonificações 14-16
**Trigger:** Grupo de clientes completa 12 meses e atinge 13º mês
**Tipo:** `bonus_ltv`
**Verificação:** CRON mensal (dia 1 de cada mês via `verificar-bonus-ltv`)

**Regras de Elegibilidade:**
1. Clientes devem ter sido ativados no **MESMO MÊS**
2. Grupo deve ter pelo menos **5 clientes ATIVOS** no 13º mês
3. Bônus é pago **UMA ÚNICA VEZ por grupo**

**Percentuais por Tamanho do Grupo:**

| Clientes Ativos no Grupo | Percentual | Bonificação |
|--------------------------|------------|-------------|
| 5-9 clientes             | 15%        | #14         |
| 10-14 clientes           | 30%        | #15         |
| 15+ clientes             | 50%        | #16         |

**Cálculo:**
```
Valor Bônus = (Soma das Mensalidades dos Clientes Ativos do Grupo) × Percentual
```

**Exemplo 1: Grupo Pequeno (8 clientes - Bonificação #14)**
```
Ativados: Janeiro/2025 (10 clientes iniciais)
13º Mês: Janeiro/2026
Ativos no 13º mês: 8 clientes (80% retenção)

Mensalidades:
- 8 clientes × R$ 130 = R$ 1.040,00

Bônus LTV: R$ 1.040 × 15% = R$ 156,00
```

**Exemplo 2: Grupo Médio (12 clientes - Bonificação #15)**
```
Ativados: Janeiro/2025 (15 clientes iniciais)
13º Mês: Janeiro/2026
Ativos no 13º mês: 12 clientes (80% retenção)

Mensalidades:
- 12 clientes × R$ 130 = R$ 1.560,00

Bônus LTV: R$ 1.560 × 30% = R$ 468,00
```

**Exemplo 3: Grupo Grande (18 clientes - Bonificação #16)**
```
Ativados: Janeiro/2025 (20 clientes iniciais)
13º Mês: Janeiro/2026
Ativos no 13º mês: 18 clientes (90% retenção)

Mensalidades:
- 18 clientes × R$ 130 = R$ 2.340,00

Bônus LTV: R$ 2.340 × 50% = R$ 1.170,00
```

**Observações Importantes:**
- Bônus LTV premia a **QUALIDADE** (retenção) e não apenas quantidade
- Incentiva contadores a manterem clientes ativos por longo prazo
- Grupos diferentes do mesmo contador podem receber múltiplos bônus LTV
- Apenas clientes que completaram 12 meses E estão ativos contam

---

### 7. Bônus Contador
**Trigger:** Downline ativa primeiro cliente
**Valor:** R$ 50 para o sponsor
**Tipo:** `bonus_contador`

**Exemplo:**
- João indica Maria (nova contadora)
- Maria ativa seu primeiro cliente
- João recebe R$ 50

---

## 🔐 Workflow de Status

### Status das Comissões

```
┌──────────────┐
│  CALCULADA   │ ← Criada automaticamente pelo sistema
└──────┬───────┘
       │
       │ (Admin aprova via aprovar-comissoes)
       ▼
┌──────────────┐
│  APROVADA    │ ← Elegível para pagamento
└──────┬───────┘
       │
       │ (CRON dia 25 + validação >= R$100)
       ▼
┌──────────────┐
│    PAGA      │ ← Paga e imutável
└──────────────┘
```

### Transições

1. **calculada → aprovada**
   - Via: `aprovar-comissoes` Edge Function
   - Por: Admin ou sistema
   - Quando: Após validação mensal

2. **aprovada → paga**
   - Via: `processar-pagamento-comissoes` (CRON)
   - Quando: Dia 25 de cada mês
   - Condição: Total >= R$ 100 por contador

---

## 🤖 Edge Functions

### 1. webhook-asaas
**Função:** Recebe webhooks do Asaas
**Trigger:** Eventos de pagamento confirmado
**Ações:**
1. Valida evento
2. Registra pagamento na tabela `pagamentos`
3. Verifica duplicidade
4. Invoca `calcular-comissoes`

**Endpoint:** `/functions/v1/webhook-asaas`
**Auth:** JWT desabilitado (webhook público)

---

### 2. calcular-comissoes
**Função:** Calcula todas as comissões e bônus
**Trigger:** Invocado por `webhook-asaas`
**Ações:**
1. Comissão direta (ativação ou recorrente)
2. Override para sponsor (se houver)
3. Bônus progressão (5, 10, 15 clientes)
4. Bônus volume (a cada 5 após 15)
5. Bônus contador (primeiro cliente do downline)
6. Logs de auditoria

**Input:**
```json
{
  "pagamento_id": "uuid",
  "cliente_id": "uuid",
  "contador_id": "uuid",
  "valor_liquido": 200.00,
  "competencia": "2025-01-01",
  "is_primeira_mensalidade": true
}
```

**Status Criado:** `calculada`

---

### 3. aprovar-comissoes ✅ NOVO
**Função:** Aprova comissões calculadas
**Trigger:** Manual (admin) ou automático
**Ações:**
1. Busca comissões com status `calculada`
2. Atualiza para status `aprovada`
3. Atualiza bônus relacionados
4. Log de auditoria

**Input:**
```json
{
  "competencia": "2025-01-01",
  "contador_ids": ["uuid1", "uuid2"], // opcional
  "observacao": "Aprovação mensal janeiro/2025"
}
```

**Endpoint:** `/functions/v1/aprovar-comissoes`

---

### 4. processar-pagamento-comissoes
**Função:** Processa pagamentos mensais
**Trigger:** CRON dia 25 de cada mês
**Ações:**
1. Busca comissões `aprovada` da competência anterior
2. Agrupa por contador_id
3. Valida total >= R$ 100
4. Atualiza para status `paga`
5. Marca `pago_em` com timestamp
6. Cria notificação para contador
7. Atualiza bônus relacionados

**Regra de Pagamento:**
- **Paga:** Total >= R$ 100
- **Acumula:** Total < R$ 100 (aguarda próximo mês)

---

### 5. verificar-bonus-ltv ⚠️ CRÍTICO
**Gatilho:** CRON (1º dia de cada mês às 10:00)
**Endpoint:** `/functions/v1/verificar-bonus-ltv`
**Entrada:** Automática (sem body)
**Saída:** Lista de bônus LTV criados por grupo

**⚠️ IMPORTANTE:** Este é o ÚNICO momento em que Bônus LTV são calculados. O webhook Asaas NÃO calcula LTV (conforme regras de negócio: pagamento no 13º mês, não em tempo real).

**O que faz:**
1. Identifica grupos de clientes ativados há 13 meses (ex: Jan/2024 processado em Fev/2025)
2. Agrupa por contador + mês de ativação
3. Conta quantos clientes do grupo ainda estão ativos
4. Se >= 5 clientes ativos:
   - Determina percentual: 15% (5-9), 30% (10-14), 50% (15+)
   - Calcula bônus sobre soma das mensalidades do grupo ativo
   - Cria `bonus_historico` + `comissoes` com tipo `bonus_ltv`
5. Registra em `audit_logs`
6. **Não processa grupos que já receberam bônus LTV**

**Exemplo Payload de Saída:**
```json
{
  "success": true,
  "mes_grupo": "2024-01",
  "competencia_pagamento": "2025-02-01",
  "contadores_processados": 15,
  "grupos_elegiveis": 8,
  "bonus_criados": [
    {
      "contador_id": "uuid",
      "grupo": "2024-01",
      "clientes_ativos": 8,
      "clientes_iniciais": 10,
      "percentual": 0.15,
      "valor": 156.00,
      "bonificacao": 14
    }
  ],
  "total_distribuido": 3450.00
}
```

---

## ⚠️ AVISO CRÍTICO: NÃO DESABILITAR CRONs

**ATENÇÃO:** Os CRONs configurados são ESSENCIAIS para o funcionamento correto do sistema de comissões. Desabilitar qualquer um deles resultará em:
- ❌ Perda de pagamentos de comissões mensais
- ❌ Perda de bônus LTV (risco jurídico e financeiro)
- ❌ Quebra de contrato com parceiros e contadores

**NUNCA desabilite os CRONs sem revisar completamente o `GUIA_MANUTENCAO_SEGURA.md`**

---

## ⏰ CRON Jobs - CONFIGURAÇÃO NECESSÁRIA

### 1. Processar Pagamentos (Dia 25) ✅ ATIVO

**Status:** OBRIGATÓRIO - NÃO DESABILITAR

```sql
SELECT cron.schedule(
  'processar-pagamentos-dia-25',
  '0 9 25 * *', -- Dia 25 às 09:00 todo mês
  $$
  SELECT net.http_post(
    url:='https://zytxwdgzjqrcmbnpgofj.supabase.co/functions/v1/processar-pagamento-comissoes',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5dHh3ZGd6anFyY21ibnBnb2ZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5ODY2NDIsImV4cCI6MjA3NjU2MjY0Mn0.KXvdfxHITLvW2r1Qiiv5CSVG-B1pGYrO4Qu7HWq-nQw"}'::jsonb,
    body:='{}'::jsonb
  ) AS request_id;
  $$
);
```

### CRON 2: Verificar Bônus LTV por Grupo (Dia 1 de Cada Mês) ✅ ATIVO

**Status:** OBRIGATÓRIO - NÃO DESABILITAR

**⚠️ ATENÇÃO:** Este CRON implementa as regras de negócio 14-16 (Bônus de Qualidade LTV). Desabilitá-lo resultará em ZERO bônus LTV pagos, causando problemas jurídicos e financeiros graves.

```sql
SELECT cron.schedule(
  'verificar-bonus-ltv-grupo',
  '0 10 1 * *', -- 1º dia do mês, 10:00
  $$
  SELECT
    net.http_post(
        url:='https://zytxwdgzjqrcmbnpgofj.supabase.co/functions/v1/verificar-bonus-ltv',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."}'::jsonb,
        body:='{}'::jsonb
    ) as request_id;
  $$
);
```

**Importante:** Ver instruções completas em `CONFIGURAR_CRON_LTV.md`

**⚠️ IMPORTANTE:** Execute esses SQLs no SQL Editor do Supabase para ativar os CRONs.

---

## 📊 Exemplos Práticos

### Exemplo 1: Flávio - Mês 1 (3 clientes)
```
Cliente A: R$ 200 (ativação)
Cliente B: R$ 150 (ativação)
Cliente C: R$ 180 (ativação)

Comissões Diretas:
- Cliente A: R$ 200 (100%)
- Cliente B: R$ 150 (100%)
- Cliente C: R$ 180 (100%)

Total Esperado: R$ 530
Status Inicial: calculada
Após Aprovação: aprovada
Dia 25: paga (>= R$ 100 ✅)
```

### Exemplo 2: João - Mês 1 (5 clientes)
```
5 clientes ativados x R$ 200 = R$ 1.000

Comissões Diretas: R$ 1.000
Bônus Prata (5 clientes): R$ 100

Total Esperado: R$ 1.100
Status: calculada → aprovada → paga
```

### Exemplo 3: Override - Sponsor Prata
```
Sponsor Prata (7 clientes ativos)
Downline ativa cliente R$ 200

Downline: R$ 200 (ativação)
Sponsor: R$ 35 (17,5% override 1ª mensalidade)

Mês seguinte (recorrente R$ 200):
Downline: R$ 30 (15% bronze)
Sponsor: R$ 8 (4% override recorrente) ✅ CORRIGIDO
```

### Exemplo 4: Bônus LTV
```
Contador Diamante (18 clientes)
Cliente X completa 12 meses
Ticket médio últimos 6 meses: R$ 220

Bônus LTV: R$ 110 (50% de R$ 220)
Status: calculada
Tipo: bonus_ltv
```

---

## 🔍 Auditoria e Rastreabilidade

### Tabelas de Auditoria

1. **comissoes_calculo_log**
   - Cada comissão tem entrada de log
   - Valores intermediários
   - Regra aplicada
   - Timestamp de cálculo

2. **bonus_historico**
   - Histórico completo de bônus
   - Marco atingido
   - Status (pendente/aprovado/pago)
   - Data de conquista e pagamento

3. **audit_logs**
   - Log geral de ações
   - Aprovações, pagamentos
   - Alterações críticas

4. **comissoes_status_historico**
   - Histórico de mudanças de status
   - Quem alterou, quando, por quê

---

## 🚨 Troubleshooting

### Problema: Comissões não foram pagas dia 25
**Diagnóstico:**
1. Status está `aprovada`? Se `calculada`, precisa aprovar primeiro
2. Total >= R$ 100? Se não, acumula para próximo mês
3. CRON está ativo? Verificar SQL Editor

**Solução:**
```sql
-- Verificar comissões aprovadas não pagas
SELECT contador_id, SUM(valor) as total
FROM comissoes
WHERE status = 'aprovada'
AND competencia = '2025-01-01'
GROUP BY contador_id;

-- Executar manualmente se necessário
-- (via Supabase Dashboard ou chamada direta)
```

---

### Problema: Override está com valor errado
**Diagnóstico:**
✅ **CORRIGIDO** - Override recorrente agora usa percentual baseado no nível do sponsor

**Verificação:**
```sql
-- Verificar overrides recorrentes
SELECT c.*, ct.nivel, ct.clientes_ativos
FROM comissoes c
JOIN contadores ct ON c.contador_id = ct.id
WHERE c.tipo = 'override'
AND c.percentual IN (0.03, 0.04, 0.05);
```

---

### Problema: Bônus LTV não foi criado
**Diagnóstico:**
1. Cliente completou exatos 12 meses?
2. Cliente está ativo?
3. `verificar-ltv-bonus` foi executado?
4. Já recebeu esse bônus anteriormente?

**Verificação:**
```sql
-- Clientes elegíveis para LTV
SELECT id, nome_empresa, data_ativacao,
  AGE(CURRENT_DATE, data_ativacao) as idade
FROM clientes
WHERE status = 'ativo'
AND data_ativacao <= CURRENT_DATE - INTERVAL '12 months'
AND data_ativacao >= CURRENT_DATE - INTERVAL '13 months';
```

---

## ✅ Checklist de Implementação

### Fase 0.1 - Crítica ✅
- [x] Corrigir override recorrente (3%, 4%, 5%)
- [x] Implementar edge function `verificar-ltv-bonus`
- [x] Implementar edge function `aprovar-comissoes`
- [x] Atualizar `config.toml`
- [x] Documentar fluxos completos
- [ ] **PENDENTE:** Configurar CRON jobs (SQL acima)
- [ ] **PENDENTE:** Testar cenários de validação

### Próximos Passos Obrigatórios
1. **Executar SQLs de CRON** no Supabase SQL Editor
2. **Testar manualmente** todas as edge functions
3. **Validar cálculos** com dados reais
4. **Monitorar logs** nos primeiros 30 dias

---

## 📞 Suporte

**Logs de Edge Functions:**
- Dashboard Supabase → Functions → [function-name] → Logs

**Links Úteis:**
- SQL Editor: https://supabase.com/dashboard/project/zytxwdgzjqrcmbnpgofj/sql/new
- Edge Functions: https://supabase.com/dashboard/project/zytxwdgzjqrcmbnpgofj/functions
- Logs webhook-asaas: https://supabase.com/dashboard/project/zytxwdgzjqrcmbnpgofj/functions/webhook-asaas/logs
- Logs calcular-comissoes: https://supabase.com/dashboard/project/zytxwdgzjqrcmbnpgofj/functions/calcular-comissoes/logs

---

**Status:** ✅ FASE 0.1 COMPLETA - Pronto para testes e configuração de CRON
**Última Atualização:** 2025-01-04
