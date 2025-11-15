# 📐 ARQUITETURA TÉCNICA COMPLETA - Contadores de Elite

**Data:** 2025-01-14
**Versão:** 1.0
**Status:** Documento Oficial de Referência

---

## 🎯 VISÃO GERAL DO SISTEMA

O sistema "Contadores de Elite" é uma plataforma de marketing multinível (MMN) para contadores, com cálculo automatizado de comissões através de webhooks do gateway de pagamento ASAAS.

**Tecnologias:**
- **Frontend:** React 18 + Vite + TypeScript + shadcn-ui
- **Backend:** Supabase (PostgreSQL + Edge Functions Deno)
- **Pagamentos:** ASAAS API (Sandbox/Produção)
- **Deploy:** GitHub Actions → Supabase Cloud

---

## 🔄 FLUXO COMPLETO DO SISTEMA (10 ETAPAS)

### **ETAPA 1: INDICAÇÃO**
**Nomenclatura Técnica:** `Invite Generation & Tracking Flow`

**Componente Frontend:** `src/pages/LinksIndicacao.tsx`

**Tabelas Envolvidas:**
- `invites` - Armazena convites gerados
- `indicacoes` - Registra indicações convertidas
- `links` - Links de rastreamento por canal

**Fluxo:**
```
1. Contador acessa /links
2. Seleciona tipo: 'cliente' | 'contador'
3. Seleciona canal: 'whatsapp' | 'email' | 'linkedin' | 'outros'
4. Sistema gera token único (36 chars random)
5. Cria registro em `invites`:
   - token: string único
   - emissor_id: UUID do contador
   - tipo: tipo_indicacao ENUM
   - flow: 'lp' | 'checkout'
   - expira_em: NOW() + 30 days
   - status: 'clique' (inicial)
6. Gera URL:
   - Cliente: /cadastro-cliente?ref={token}
   - Contador: /cadastro-contador?ref={token}
7. Contador compartilha link
```

**Rastreamento:**
```sql
-- Ao clicar no link
UPDATE invites
SET status = 'clique'
WHERE token = :token;

-- Ao se cadastrar
UPDATE invites
SET status = 'cadastro', usado_por = :user_id, usado_em = NOW()
WHERE token = :token;

-- Ao converter (ativar cliente)
UPDATE invites
SET status = 'convertido'
WHERE token = :token;

INSERT INTO indicacoes (invite_id, contador_id, cliente_id, status, origem, ip_address, user_agent)
VALUES (:invite_id, :contador_id, :cliente_id, 'convertido', :origem, :ip, :user_agent);
```

**Métricas Rastreadas:**
- `cliques` - Total de acessos ao link
- `conversoes` - Total de cadastros completados
- Taxa de conversão: `(conversoes / cliques) * 100`

---

### **ETAPA 2: CONTRATAÇÃO**
**Nomenclatura Técnica:** `Customer & Subscription Creation Flow`

**Componentes:**
- Frontend: `src/pages/Pagamentos.tsx`
- Edge Function: `supabase/functions/asaas-client/index.ts`

**Tabelas Envolvidas:**
- `clientes` - Dados do cliente
- `contadores` - Dados do contador (se indicação de contador)

**Fluxo de Contratação:**

```
1. Cliente preenche formulário de cadastro
2. Sistema verifica token de indicação (se houver)
3. Frontend chama Edge Function asaas-client

POST /functions/v1/asaas-client
{
  "action": "create-customer",
  "payload": {
    "name": "Nome da Empresa",
    "email": "email@empresa.com",
    "cpfCnpj": "00.000.000/0001-00",
    "phone": "11999999999"
  }
}

4. Edge Function → ASAAS API:

POST https://api.asaas.com/v3/customers
Headers: {
  "access_token": ASAAS_API_KEY,
  "content-type": "application/json"
}
Body: { name, email, cpfCnpj, phone }

5. ASAAS retorna:
{
  "id": "cus_000007222099",  ← Customer ID
  "name": "...",
  "email": "...",
  "cpfCnpj": "..."
}

6. Sistema salva cliente no Supabase:

INSERT INTO clientes (
  contador_id,        ← ID do contador que indicou
  indicacao_id,       ← ID da indicacao (se houver)
  nome_empresa,
  cnpj,
  contato_email,
  status,             ← 'lead' (inicial)
  plano,              ← 'basico' | 'profissional' | 'premium' | 'enterprise'
  valor_mensal,
  asaas_customer_id,  ← 'cus_000007222099'
  created_at
) VALUES (...);

7. Criar assinatura no ASAAS:

POST /functions/v1/asaas-client
{
  "action": "create-subscription",
  "payload": {
    "customerId": "cus_000007222099",
    "billingType": "CREDIT_CARD" | "BOLETO" | "PIX",
    "value": 199.90,
    "nextDueDate": "2025-02-01",
    "description": "Plano Profissional",
    "cycle": "MONTHLY"
  }
}

8. ASAAS cria subscription:

POST https://api.asaas.com/v3/subscriptions
Response: {
  "id": "sub_abc123",
  "customerId": "cus_000007222099",
  "status": "ACTIVE",
  "nextDueDate": "2025-02-01"
}

9. Atualizar cliente no Supabase:

UPDATE clientes
SET asaas_subscription_id = 'sub_abc123',
    status = 'ativo',
    data_ativacao = NOW()
WHERE asaas_customer_id = 'cus_000007222099';

10. Trigger atualiza contador:

UPDATE contadores
SET clientes_ativos = clientes_ativos + 1,
    ultima_ativacao = CURRENT_DATE
WHERE id = :contador_id;
```

**Estados do Cliente:**
- `lead` - Cadastrado mas não ativou
- `ativo` - Assinatura ativa
- `inadimplente` - Pagamento atrasado
- `cancelado` - Assinatura cancelada

---

### **ETAPA 3: REGISTRO DE PAGAMENTO (ASAAS)**
**Nomenclatura Técnica:** `Payment Processing & Event Generation`

**Sistema:** ASAAS (externo)

**Fluxo Automático (ASAAS):**

```
1. ASAAS gera cobrança automaticamente (subscription)
   - Dia do vencimento: conforme nextDueDate
   - Valor: conforme subscription value
   - Forma: conforme billingType

2. Cliente efetua pagamento:
   - PIX: instantâneo
   - Cartão: 1-2 dias úteis
   - Boleto: após compensação

3. ASAAS confirma recebimento

4. ASAAS gera evento webhook
```

**Eventos Gerados pelo ASAAS:**

| Evento | Descrição | Quando Ocorre |
|--------|-----------|---------------|
| `PAYMENT_CREATED` | Cobrança criada | Ao gerar boleto/PIX |
| `PAYMENT_CONFIRMED` | Pagamento confirmado | Após confirmação |
| `PAYMENT_RECEIVED` | ⭐ Pagamento recebido | Valor creditado |
| `PAYMENT_RECEIVED_IN_CASH` | Recebido em dinheiro | Pagamento manual |
| `PAYMENT_ANTICIPATED` | Antecipação | Antecipação de recebível |
| `PAYMENT_UPDATED` | Dados atualizados | Alteração de vencimento |
| `PAYMENT_OVERDUE` | Vencido | Após vencimento |
| `PAYMENT_DELETED` | Cancelado | Cobrança excluída |
| `SUBSCRIPTION_CREATED` | Assinatura criada | Nova subscription |

**Payload do Evento (exemplo):**

```json
{
  "id": "evt_abc123def456",           ← ID único do evento
  "event": "PAYMENT_RECEIVED",        ← Tipo do evento
  "dateCreated": "2025-01-14T10:30:00.000Z",
  "payment": {
    "id": "pay_xyz789",               ← ID do pagamento
    "customer": "cus_000007222099",   ← Customer ID
    "subscription": "sub_abc123",     ← Subscription ID (se recorrente)
    "value": 199.90,                  ← Valor bruto
    "netValue": 197.90,               ← Valor líquido (após taxas)
    "dateCreated": "2025-01-01T00:00:00.000Z",
    "confirmedDate": "2025-01-14T10:30:00.000Z",
    "status": "RECEIVED",
    "billingType": "PIX"
  }
}
```

---

### **ETAPA 4: WEBHOOK → SUPABASE**
**Nomenclatura Técnica:** `Webhook Reception & Validation Flow`

**Componente:** `supabase/functions/webhook-asaas/index.ts`

**URL do Webhook:**
```
https://zytxwdgzjqrcmbnpgofj.supabase.co/functions/v1/webhook-asaas
```

**Configuração no ASAAS:**
- Menu: Integrações → Webhooks
- URL: (acima)
- Eventos selecionados: `PAYMENT_CONFIRMED`, `PAYMENT_RECEIVED`
- Token/Assinatura: MD5(payload + secret)

**Fluxo de Recebimento:**

```typescript
// 1. RECEPÇÃO
Deno.serve(async (req) => {
  const payload = await req.text();
  const signature = req.headers.get('x-asaas-webhook-signature');

  // 2. VALIDAÇÃO DE ASSINATURA
  const secret = Deno.env.get('ASAAS_WEBHOOK_SECRET');
  const expectedSignature = MD5(payload + secret);

  if (signature !== expectedSignature) {
    // ⚠️ Webhook suspeito
    return Response(403); // Bloqueia
  }

  // 3. PARSE DO PAYLOAD
  const data: AsaasWebhookPayload = JSON.parse(payload);

  // 4. VALIDAÇÃO DE EVENTOS
  const eventosParaProcessar = [
    'PAYMENT_CONFIRMED',
    'PAYMENT_RECEIVED',
    'PAYMENT_CREATED',
    'PAYMENT_UPDATED',
    'PAYMENT_RECEIVED_IN_CASH',
    'PAYMENT_ANTICIPATED',
    'SUBSCRIPTION_CREATED',
  ];

  if (!eventosParaProcessar.includes(data.event)) {
    console.log(`Evento ignorado: ${data.event}`);
    return Response(200); // OK mas não processa
  }

  // 5. IDEMPOTÊNCIA - Verificar se já processado
  const { data: existing } = await supabase
    .from('webhook_logs')
    .select('id')
    .eq('event_id', data.id)  // ← ID único do evento
    .single();

  if (existing) {
    console.log('Webhook já processado (idempotente)');
    return Response(200); // OK mas não reprocessa
  }

  // 6. LOG DO WEBHOOK
  await supabase.from('webhook_logs').insert({
    event_id: data.id,
    event_type: data.event,
    payload: data,
    processado: false
  });

  // 7. BUSCAR CLIENTE
  const { data: cliente } = await supabase
    .from('clientes')
    .select('id, contador_id, plano, valor_mensal, status')
    .eq('asaas_customer_id', data.payment.customer)
    .single();

  if (!cliente) {
    throw new Error(`Cliente não encontrado: ${data.payment.customer}`);
  }

  // 8. CRIAR REGISTRO DE PAGAMENTO
  const { data: pagamento } = await supabase
    .from('pagamentos')
    .insert({
      cliente_id: cliente.id,
      tipo: data.payment.subscription ? 'recorrente' : 'ativacao',
      competencia: new Date().toISOString().substring(0, 7), // 'YYYY-MM'
      valor_bruto: data.payment.value,
      valor_liquido: data.payment.netValue,
      cashback: data.payment.value - data.payment.netValue,
      status: 'pago',
      asaas_payment_id: data.payment.id,
      asaas_event_id: data.id,  // ← Idempotência
      pago_em: data.payment.confirmedDate || new Date().toISOString()
    })
    .select()
    .single();

  // 9. CHAMAR FUNÇÃO DE CÁLCULO DE COMISSÕES
  const calcResult = await fetch(
    `${supabaseUrl}/functions/v1/calcular-comissoes`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`
      },
      body: JSON.stringify({
        pagamento_id: pagamento.id,
        cliente_id: cliente.id,
        contador_id: cliente.contador_id,
        valor_liquido: data.payment.netValue,
        competencia: pagamento.competencia,
        is_primeira_mensalidade: !data.payment.subscription
      })
    }
  );

  // 10. ATUALIZAR LOG
  await supabase
    .from('webhook_logs')
    .update({ processado: true, processed_at: new Date() })
    .eq('event_id', data.id);

  return Response(200);
});
```

**Tabela `webhook_logs`:**
```sql
CREATE TABLE webhook_logs (
  id UUID PRIMARY KEY,
  event_id TEXT UNIQUE NOT NULL,     -- Idempotência
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  processado BOOLEAN DEFAULT false,
  erro TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  processed_at TIMESTAMPTZ
);
```

---

### **ETAPA 5: PROCESSAMENTO DA LÓGICA (CÁLCULO DE COMISSÕES)**
**Nomenclatura Técnica:** `Commission Calculation Engine`

**Componente:** `supabase/functions/calcular-comissoes/index.ts`

**Entrada (Input):**
```typescript
interface CalculationInput {
  pagamento_id: string;
  cliente_id: string;
  contador_id: string;
  valor_liquido: number;
  competencia: string;              // 'YYYY-MM-DD'
  is_primeira_mensalidade: boolean;
}
```

**Regras de Negócio (MMN):**

#### **5.1. Níveis de Contador**

| Nível | Clientes Ativos | Comissão Direta | Override Recorrente |
|-------|-----------------|-----------------|---------------------|
| Bronze | 0-4 | 15% | 3% |
| Prata | 5-9 | 17.5% | 4% |
| Ouro | 10-14 | 20% | 5% |
| Diamante | 15+ | 20% | 5% |

```typescript
function getAccountantLevel(activeClients: number): AccountantLevel {
  if (activeClients >= 15) return { nivel: 'diamante', comissao_direta: 0.20, override: 0.05 };
  if (activeClients >= 10) return { nivel: 'ouro', comissao_direta: 0.20, override: 0.05 };
  if (activeClients >= 5) return { nivel: 'prata', comissao_direta: 0.175, override: 0.04 };
  return { nivel: 'bronze', comissao_direta: 0.15, override: 0.03 };
}
```

#### **5.2. Comissão Direta (Primeira Mensalidade)**

```typescript
// Primeira mensalidade = 100% do valor líquido
if (is_primeira_mensalidade) {
  comissao = {
    tipo: 'ativacao',
    valor: valor_liquido,  // 100%
    percentual: 1.0,
    observacao: 'Comissão ativação - 100% da 1ª mensalidade'
  };
}
```

**Exemplo:**
- Valor líquido: R$ 197,90
- Comissão ativação: **R$ 197,90** (100%)

#### **5.3. Comissão Direta (Recorrente)**

```typescript
// Mensalidades seguintes = percentual por nível
else {
  const level = getAccountantLevel(contador.clientes_ativos);
  comissao = {
    tipo: 'recorrente',
    valor: valor_liquido * level.comissao_direta,
    percentual: level.comissao_direta,
    observacao: `Comissão recorrente - Nível ${level.nivel}`
  };
}
```

**Exemplo (Bronze - 15%):**
- Valor líquido: R$ 197,90
- Comissão recorrente: **R$ 29,69** (15%)

**Exemplo (Ouro - 20%):**
- Valor líquido: R$ 197,90
- Comissão recorrente: **R$ 39,58** (20%)

#### **5.4. Override (Sponsor)**

Sistema de rede multi-nível: contador pode ter um "sponsor" (quem o indicou).

**Tabela `rede_contadores`:**
```sql
CREATE TABLE rede_contadores (
  id UUID PRIMARY KEY,
  sponsor_id UUID REFERENCES contadores(id),  -- Quem indicou
  child_id UUID REFERENCES contadores(id),    -- Quem foi indicado
  nivel_rede INTEGER CHECK (nivel_rede BETWEEN 1 AND 5)
);
```

**Cálculo Override:**

```typescript
// Buscar sponsor
const { data: network } = await supabase
  .from('rede_contadores')
  .select('sponsor_id')
  .eq('child_id', contador_id)
  .single();

if (network?.sponsor_id) {
  const { data: sponsor } = await supabase
    .from('contadores')
    .select('id, clientes_ativos')
    .eq('id', network.sponsor_id)
    .single();

  const sponsorLevel = getAccountantLevel(sponsor.clientes_ativos);

  let overrideComissao;

  if (is_primeira_mensalidade) {
    // 1ª mensalidade: mesmo % da comissão direta do sponsor
    overrideComissao = {
      tipo: 'override',
      valor: valor_liquido * sponsorLevel.comissao_direta,
      percentual: sponsorLevel.comissao_direta,
      nivel_sponsor: sponsorLevel.nivel,
      observacao: `Override 1ª mensalidade - Sponsor ${sponsorLevel.nivel}`
    };
  } else {
    // Recorrente: 3%/4%/5% conforme nível do sponsor
    overrideComissao = {
      tipo: 'override',
      valor: valor_liquido * sponsorLevel.override,
      percentual: sponsorLevel.override,
      nivel_sponsor: sponsorLevel.nivel,
      observacao: 'Override recorrente MMN'
    };
  }
}
```

**Exemplo (Sponsor Ouro, 1ª mensalidade):**
- Valor líquido: R$ 197,90
- Override sponsor: **R$ 39,58** (20% do sponsor)

**Exemplo (Sponsor Ouro, recorrente):**
- Valor líquido: R$ 197,90
- Override sponsor: **R$ 9,90** (5%)

#### **5.5. Bônus de Progressão**

Bônus único ao atingir marcos de clientes ativos.

```typescript
function calculateProgressBonus(activeClients: number): BonusRecord[] {
  const milestones = [
    { qty: 5, name: 'Bônus Prata', valor: 100 },
    { qty: 10, name: 'Bônus Ouro', valor: 100 },
    { qty: 15, name: 'Bônus Diamante', valor: 100 }
  ];

  return milestones
    .filter(m => activeClients === m.qty)  // Exatamente no marco
    .map(m => ({
      tipo_bonus: 'bonus_progressao',
      marco_atingido: m.qty,
      valor: m.valor,
      status: 'pendente',
      observacao: m.name
    }));
}
```

**Quando Paga:**
- Contador ativa 5º cliente → **R$ 100** (Bônus Prata)
- Contador ativa 10º cliente → **R$ 100** (Bônus Ouro)
- Contador ativa 15º cliente → **R$ 100** (Bônus Diamante)

#### **5.6. Bônus de Volume**

Bônus a cada múltiplo de 5 clientes.

```typescript
function calculateVolumeBonus(activeClients: number): BonusRecord | null {
  if (activeClients >= 5 && activeClients % 5 === 0) {
    return {
      tipo_bonus: 'bonus_volume',
      marco_atingido: activeClients,
      valor: 100,
      observacao: `Bônus Volume - ${activeClients} clientes`
    };
  }
  return null;
}
```

**Quando Paga:**
- 5 clientes → R$ 100
- 10 clientes → R$ 100
- 15 clientes → R$ 100
- 20 clientes → R$ 100
- ...

#### **5.7. Bônus de Indicação de Contador**

Quando um contador indicado ativa seu 1º cliente.

```typescript
if (is_primeira_mensalidade && network?.sponsor_id) {
  const { count } = await supabase
    .from('clientes')
    .select('id', { count: 'exact' })
    .eq('contador_id', contador_id)
    .eq('status', 'ativo');

  if (count === 1) {  // É o 1º cliente do contador
    bonus = {
      contador_id: network.sponsor_id,  // Vai para o sponsor
      tipo_bonus: 'bonus_contador',
      valor: 50,
      observacao: 'Bônus Indicação Contador - Downline ativou 1º cliente'
    };
  }
}
```

**Quando Paga:**
- Sponsor recebe **R$ 50** quando seu indicado (contador) ativa o 1º cliente

---

### **ETAPA 6: SALVAMENTO TRANSACIONAL (RPC)**
**Nomenclatura Técnica:** `Transactional Commission Storage`

**Componente:** `supabase/migrations/.../create_rpc_executar_calculo_comissoes.sql`

**RPC Function:** `executar_calculo_comissoes()`

**Por Que RPC?**
- ✅ Transação atômica (tudo ou nada)
- ✅ Bypass RLS (Row Level Security)
- ✅ Idempotência via UNIQUE constraints
- ✅ Performance (executa no BD, não no client)

**Assinatura:**
```sql
CREATE FUNCTION public.executar_calculo_comissoes(
  p_pagamento_id uuid,
  p_cliente_id uuid,
  p_contador_id uuid,
  p_competencia date,
  p_comissoes jsonb,    -- Array de comissões
  p_bonus jsonb,        -- Array de bônus
  p_logs jsonb          -- Array de logs de cálculo
) RETURNS jsonb;
```

**Entrada (exemplo):**
```json
{
  "p_pagamento_id": "uuid-123",
  "p_cliente_id": "uuid-456",
  "p_contador_id": "uuid-789",
  "p_competencia": "2025-01-14",
  "p_comissoes": [
    {
      "contador_id": "uuid-789",
      "cliente_id": "uuid-456",
      "pagamento_id": "uuid-123",
      "tipo": "ativacao",
      "valor": 197.90,
      "percentual": 1.0,
      "competencia": "2025-01-14",
      "status": "calculada",
      "observacao": "Comissão ativação - 100%"
    },
    {
      "contador_id": "uuid-sponsor",
      "tipo": "override",
      "valor": 39.58,
      "percentual": 0.20,
      "nivel_sponsor": "ouro",
      "...": "..."
    }
  ],
  "p_bonus": [
    {
      "contador_id": "uuid-789",
      "tipo_bonus": "bonus_progressao",
      "marco_atingido": 5,
      "valor": 100,
      "status": "pendente"
    }
  ],
  "p_logs": [
    {
      "regra_aplicada": "ATIVACAO_100",
      "valores_intermediarios": { "valor_liquido": 197.90 },
      "resultado_final": 197.90
    }
  ]
}
```

**Execução:**
```sql
BEGIN TRANSACTION;

-- 1. Inserir comissões com idempotência
INSERT INTO comissoes (...)
SELECT ... FROM jsonb_to_recordset(p_comissoes)
ON CONFLICT (pagamento_id, contador_id, tipo)  -- Idempotência
DO NOTHING;

-- 2. Inserir logs de cálculo
INSERT INTO comissoes_calculo_log (...)
SELECT ... FROM jsonb_to_recordset(p_logs);

-- 3. Inserir bônus com idempotência
INSERT INTO bonus_historico (...)
SELECT ... FROM jsonb_to_recordset(p_bonus)
ON CONFLICT (contador_id, tipo_bonus, competencia, marco_atingido)
DO NOTHING;

COMMIT;

-- 4. Retornar resultado
RETURN jsonb_build_object(
  'success', true,
  'comissoes_inseridas', 2,
  'bonus_inseridos', 1,
  'logs_inseridos', 1
);
```

**Tabela `comissoes`:**
```sql
CREATE TABLE comissoes (
  id UUID PRIMARY KEY,
  contador_id UUID REFERENCES contadores(id),
  tipo tipo_comissao,  -- ENUM: ativacao, recorrente, override, bonus_*
  pagamento_id UUID REFERENCES pagamentos(id),
  cliente_id UUID REFERENCES clientes(id),
  valor NUMERIC(10,2) NOT NULL CHECK (valor >= 0),
  percentual NUMERIC(5,2),
  competencia DATE NOT NULL,
  status status_comissao,  -- calculada, aprovada, paga, cancelada
  observacao TEXT,
  nivel_sponsor TEXT,
  origem_cliente_id UUID,
  pago_em TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  -- Idempotência: mesmo pagamento não gera mesma comissão 2x
  UNIQUE(pagamento_id, contador_id, tipo)
);
```

**Tabela `bonus_historico`:**
```sql
CREATE TABLE bonus_historico (
  id UUID PRIMARY KEY,
  contador_id UUID REFERENCES contadores(id),
  tipo_bonus TEXT,  -- bonus_progressao, bonus_volume, bonus_contador
  marco_atingido INTEGER,
  valor NUMERIC(10,2),
  competencia DATE,
  status TEXT,  -- pendente, aprovado, pago
  conquistado_em TIMESTAMPTZ,
  pago_em TIMESTAMPTZ,
  observacao TEXT,

  -- Idempotência: mesmo marco não paga 2x
  UNIQUE(contador_id, tipo_bonus, competencia, COALESCE(marco_atingido, 0))
);
```

---

### **ETAPA 7: ATUALIZAÇÃO DO FRONT-END**
**Nomenclatura Técnica:** `Real-time Dashboard Data Sync`

**Componentes Frontend:**
- `src/pages/Dashboard.tsx` - Dashboard principal
- `src/pages/Comissoes.tsx` - Extrato de comissões
- `src/pages/Relatorios.tsx` - Relatórios detalhados

**Fluxo de Atualização:**

```typescript
// Hook: useQuery do TanStack Query
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// 1. BUSCAR COMISSÕES DO CONTADOR
const { data: comissoes, isLoading } = useQuery({
  queryKey: ['comissoes', contadorId, mes],
  queryFn: async () => {
    const { data, error } = await supabase
      .from('comissoes')
      .select(`
        id,
        tipo,
        valor,
        percentual,
        status,
        observacao,
        competencia,
        created_at,
        pago_em,
        cliente:clientes(nome_empresa, plano)
      `)
      .eq('contador_id', contadorId)
      .gte('competencia', `${mes}-01`)
      .lt('competencia', `${proximoMes}-01`)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },
  refetchInterval: 30000,  // Atualiza a cada 30s
  staleTime: 10000         // Considera stale após 10s
});

// 2. TOTALIZADORES
const totais = {
  calculadas: comissoes?.filter(c => c.status === 'calculada')
                        .reduce((sum, c) => sum + c.valor, 0) || 0,
  aprovadas: comissoes?.filter(c => c.status === 'aprovada')
                       .reduce((sum, c) => sum + c.valor, 0) || 0,
  pagas: comissoes?.filter(c => c.status === 'paga')
                   .reduce((sum, c) => sum + c.valor, 0) || 0
};

// 3. BUSCAR BÔNUS
const { data: bonus } = useQuery({
  queryKey: ['bonus', contadorId, mes],
  queryFn: async () => {
    const { data } = await supabase
      .from('bonus_historico')
      .select('*')
      .eq('contador_id', contadorId)
      .gte('competencia', `${mes}-01`)
      .order('conquistado_em', { ascending: false });
    return data;
  }
});

// 4. INDICADORES (CLIENTES ATIVOS, XP, NÍVEL)
const { data: contador } = useQuery({
  queryKey: ['contador', contadorId],
  queryFn: async () => {
    const { data } = await supabase
      .from('contadores')
      .select('clientes_ativos, xp, nivel, status')
      .eq('id', contadorId)
      .single();
    return data;
  }
});

// 5. REDE (INDICADOS)
const { data: rede } = useQuery({
  queryKey: ['rede', contadorId],
  queryFn: async () => {
    const { data } = await supabase
      .from('rede_contadores')
      .select(`
        id,
        nivel_rede,
        child:contadores!child_id(
          id,
          nivel,
          clientes_ativos,
          status,
          profile:profiles(nome)
        )
      `)
      .eq('sponsor_id', contadorId)
      .order('created_at', { ascending: false });
    return data;
  }
});
```

**Exibição no Dashboard:**

```tsx
<Card>
  <CardHeader>
    <CardTitle>Comissões do Mês</CardTitle>
  </CardHeader>
  <CardContent>
    <div className="space-y-4">
      {/* Totalizadores */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-yellow-50 p-4 rounded">
          <div className="text-sm text-muted-foreground">Calculadas</div>
          <div className="text-2xl font-bold">
            R$ {totais.calculadas.toFixed(2)}
          </div>
        </div>
        <div className="bg-green-50 p-4 rounded">
          <div className="text-sm text-muted-foreground">Aprovadas</div>
          <div className="text-2xl font-bold">
            R$ {totais.aprovadas.toFixed(2)}
          </div>
        </div>
        <div className="bg-blue-50 p-4 rounded">
          <div className="text-sm text-muted-foreground">Pagas</div>
          <div className="text-2xl font-bold">
            R$ {totais.pagas.toFixed(2)}
          </div>
        </div>
      </div>

      {/* Lista de Comissões */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Tipo</TableHead>
            <TableHead>Cliente</TableHead>
            <TableHead>Valor</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Data</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {comissoes?.map(comissao => (
            <TableRow key={comissao.id}>
              <TableCell>
                <Badge variant={comissao.tipo === 'ativacao' ? 'default' : 'secondary'}>
                  {comissao.tipo}
                </Badge>
              </TableCell>
              <TableCell>{comissao.cliente?.nome_empresa}</TableCell>
              <TableCell className="font-semibold">
                R$ {comissao.valor.toFixed(2)}
              </TableCell>
              <TableCell>
                <Badge variant={
                  comissao.status === 'paga' ? 'success' :
                  comissao.status === 'aprovada' ? 'warning' :
                  'secondary'
                }>
                  {comissao.status}
                </Badge>
              </TableCell>
              <TableCell>
                {new Date(comissao.created_at).toLocaleDateString('pt-BR')}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  </CardContent>
</Card>
```

**Barras de Progresso (Gamificação):**

```tsx
<Card>
  <CardHeader>
    <CardTitle>Progresso para Próximo Nível</CardTitle>
  </CardHeader>
  <CardContent>
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span>Nível Atual: {contador?.nivel}</span>
        <span>{contador?.clientes_ativos} / {proximoMarco} clientes</span>
      </div>
      <Progress
        value={(contador?.clientes_ativos / proximoMarco) * 100}
        className="h-2"
      />
      <div className="text-xs text-muted-foreground">
        Faltam {proximoMarco - contador?.clientes_ativos} clientes para {proximoNivel}
      </div>
    </div>
  </CardContent>
</Card>
```

**RLS (Row Level Security) - Segurança:**

```sql
-- Contador só vê suas próprias comissões
CREATE POLICY "Contadores view own comissoes"
ON comissoes FOR SELECT
USING (
  contador_id = get_contador_id(auth.uid())
  OR has_role(auth.uid(), 'admin')
);

-- Função auxiliar
CREATE FUNCTION get_contador_id(_user_id UUID) RETURNS UUID AS $$
  SELECT id FROM contadores WHERE user_id = _user_id LIMIT 1
$$ LANGUAGE sql STABLE SECURITY DEFINER;
```

---

### **ETAPA 8: APROVAÇÃO DE COMISSÕES**
**Nomenclatura Técnica:** `Commission Approval Workflow`

**Componente:** `supabase/functions/aprovar-comissoes/index.ts`

**Quem Aprova:** Admin ou sistema automático

**Fluxo de Aprovação:**

```typescript
// 1. LISTAR COMISSÕES CALCULADAS
const { data: comissoesCalculadas } = await supabase
  .from('comissoes')
  .select('id, contador_id, valor, tipo, observacao, competencia')
  .eq('status', 'calculada')
  .gte('competencia', inicioMes)
  .lt('competencia', fimMes);

// 2. VALIDAÇÕES (opcional)
for (const comissao of comissoesCalculadas) {
  // Verificar se contador ainda está ativo
  const { data: contador } = await supabase
    .from('contadores')
    .select('status')
    .eq('id', comissao.contador_id)
    .single();

  if (contador.status !== 'ativo') {
    // Cancelar comissão
    await supabase
      .from('comissoes')
      .update({ status: 'cancelada', observacao: 'Contador inativo' })
      .eq('id', comissao.id);
    continue;
  }

  // Aprovar
  await supabase
    .from('comissoes')
    .update({
      status: 'aprovada',
      updated_at: new Date()
    })
    .eq('id', comissao.id);
}

// 3. APROVAR BÔNUS TAMBÉM
await supabase
  .from('bonus_historico')
  .update({ status: 'aprovado' })
  .eq('status', 'pendente')
  .gte('competencia', inicioMes);

// 4. AUDIT LOG
await supabase.from('audit_logs').insert({
  acao: 'APROVAR_COMISSOES',
  user_id: adminUserId,
  payload: {
    competencia: mes,
    total_aprovadas: comissoesCalculadas.length
  }
});
```

**Estados de Comissão:**
1. `calculada` - Calculada pelo webhook
2. `aprovada` - Validada e liberada para pagamento
3. `paga` - Pagamento efetuado
4. `cancelada` - Cancelada (erro, fraude, etc)

---

### **ETAPA 9: GERAÇÃO DE ORDEM DE PAGAMENTO**
**Nomenclatura Técnica:** `Payment Order Generation & Threshold Processing`

**Componente:** `supabase/functions/processar-pagamento-comissoes/index.ts`

**CRON Job:** Executa automaticamente dia 25 de cada mês

**Configuração CRON:**
```sql
-- Migration: setup_cron_payment_processing.sql
SELECT cron.schedule(
  'payment-processing-day-25',  -- Nome do job
  '0 0 25 * *',                 -- Dia 25, 00:00 UTC
  'SELECT public.cron_processar_pagamento_comissoes()'
);
```

**Regra de Pagamento:**
- ✅ **>= R$ 100:** Pagar no mês
- ⏳ **< R$ 100:** Acumular para próximo mês

**Fluxo de Processamento:**

```typescript
function calcularCompetencia() {
  const hoje = new Date();
  const mesAnterior = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1);

  return {
    mes: '2025-01',                // Competência
    inicio: '2025-01-01',          // Início do período
    fim: '2025-02-01'              // Fim do período (exclusive)
  };
}

// 1. BUSCAR COMISSÕES APROVADAS DO MÊS
const { data: comissoes } = await supabase
  .from('comissoes')
  .select('id, contador_id, valor, tipo')
  .eq('status', 'aprovada')
  .gte('competencia', '2025-01-01')
  .lt('competencia', '2025-02-01');

// 2. AGRUPAR POR CONTADOR
const porContador = comissoes.reduce((acc, c) => {
  if (!acc[c.contador_id]) {
    acc[c.contador_id] = { total: 0, comissoes: [] };
  }
  acc[c.contador_id].total += Number(c.valor);
  acc[c.contador_id].comissoes.push(c);
  return acc;
}, {});

// 3. PROCESSAR CADA CONTADOR
for (const [contadorId, { total, comissoes }] of Object.entries(porContador)) {
  if (total >= 100) {
    // ✅ PAGAR

    // 3.1. Marcar comissões como pagas
    const ids = comissoes.map(c => c.id);
    await supabase
      .from('comissoes')
      .update({
        status: 'paga',
        pago_em: new Date()
      })
      .in('id', ids);

    // 3.2. Marcar bônus como pagos
    await supabase
      .from('bonus_historico')
      .update({
        status: 'pago',
        pago_em: new Date()
      })
      .eq('contador_id', contadorId)
      .eq('status', 'aprovado')
      .gte('competencia', '2025-01-01')
      .lt('competencia', '2025-02-01');

    // 3.3. Criar notificação
    await supabase.from('notificacoes').insert({
      contador_id: contadorId,
      tipo: 'comissao_liberada',
      titulo: 'Comissões Liberadas',
      mensagem: `Suas comissões de janeiro/2025 foram liberadas: R$ ${total.toFixed(2)}`,
      payload: {
        competencia: '2025-01',
        valor_total: total,
        quantidade_comissoes: comissoes.length
      }
    });

    // 3.4. GERAR ORDEM DE PAGAMENTO PARA ASAAS
    // (Esta integração pode ser futura - por enquanto apenas marca como "pago")

    console.log(`✅ PAGO: Contador ${contadorId} - R$ ${total.toFixed(2)}`);

  } else {
    // ⏳ ACUMULAR
    // Comissões permanecem com status 'aprovada'
    // Serão somadas com as do próximo mês

    console.log(`⏳ ACUMULADO: Contador ${contadorId} - R$ ${total.toFixed(2)} (< R$ 100)`);
  }
}

// 4. AUDIT LOG
await supabase.from('audit_logs').insert({
  acao: 'PROCESSAR_PAGAMENTO_COMISSOES',
  payload: {
    competencia: '2025-01',
    processados: contadoresPagos,
    acumulados: contadoresAcumulados,
    valor_total_pago: valorTotalPago
  }
});
```

**Exemplo de Acumulação:**

```
Mês 1 (Janeiro):
- Comissões aprovadas: R$ 80
- Total: R$ 80 < R$ 100 → ACUMULA (status permanece 'aprovada')

Mês 2 (Fevereiro):
- Comissões aprovadas janeiro: R$ 80 (ainda aprovadas)
- Comissões aprovadas fevereiro: R$ 50
- Total: R$ 130 >= R$ 100 → PAGA TUDO

UPDATE comissoes
SET status = 'paga', pago_em = NOW()
WHERE contador_id = :id
  AND status = 'aprovada'
  AND competencia <= '2025-02-28';
```

---

### **ETAPA 10: EXECUÇÃO DO PAGAMENTO (FUTURO)**
**Nomenclatura Técnica:** `Payment Execution via ASAAS Transfer API`

**Status:** 🚧 **NÃO IMPLEMENTADO** (preparado para futuro)

**Componentes Futuros:**
- Edge Function: `supabase/functions/executar-pagamento-contador/index.ts`
- ASAAS API: `/v3/transfers` (transferência Pix)

**Fluxo Planejado:**

```typescript
// Após marcar comissões como "paga", disparar transferência real

async function executarPagamento(contadorId: string, valor: number) {
  // 1. Buscar dados do contador
  const { data: contador } = await supabase
    .from('contadores')
    .select('chave_pix, nome')
    .eq('id', contadorId)
    .single();

  if (!contador.chave_pix) {
    throw new Error('Contador sem chave Pix cadastrada');
  }

  // 2. Criar transferência no ASAAS
  const response = await fetch('https://api.asaas.com/v3/transfers', {
    method: 'POST',
    headers: {
      'access_token': ASAAS_API_KEY,
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      value: valor,
      pixAddressKey: contador.chave_pix,  // CPF, telefone, email, ou chave aleatória
      description: `Comissões Contadores de Elite - ${mes}`,
      scheduleDate: null  // Transferência imediata
    })
  });

  const transfer = await response.json();

  if (!response.ok) {
    throw new Error(`Erro ASAAS: ${JSON.stringify(transfer.errors)}`);
  }

  // 3. Registrar transferência
  await supabase.from('transferencias').insert({
    contador_id: contadorId,
    valor: valor,
    chave_pix: contador.chave_pix,
    asaas_transfer_id: transfer.id,
    status: transfer.status,  // PENDING, DONE, FAILED
    competencia: mes,
    created_at: new Date()
  });

  // 4. Atualizar audit log
  await supabase.from('audit_logs').insert({
    acao: 'EXECUTAR_PAGAMENTO_PIX',
    payload: {
      contador_id: contadorId,
      valor: valor,
      transfer_id: transfer.id
    }
  });

  return transfer;
}
```

**Tabela Futura: `transferencias`**
```sql
CREATE TABLE transferencias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contador_id UUID REFERENCES contadores(id),
  valor NUMERIC(10,2) NOT NULL,
  chave_pix TEXT NOT NULL,
  asaas_transfer_id TEXT UNIQUE,
  status TEXT,  -- PENDING, DONE, FAILED
  competencia TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);
```

**Webhook de Confirmação (ASAAS):**
```json
{
  "event": "TRANSFER_DONE",
  "transfer": {
    "id": "transf_abc123",
    "value": 130.00,
    "status": "DONE",
    "effectiveDate": "2025-01-25"
  }
}
```

**Processamento:**
```typescript
// Webhook ASAAS recebe TRANSFER_DONE
if (payload.event === 'TRANSFER_DONE') {
  await supabase
    .from('transferencias')
    .update({
      status: 'DONE',
      completed_at: payload.transfer.effectiveDate
    })
    .eq('asaas_transfer_id', payload.transfer.id);

  // Notificar contador
  await supabase.from('notificacoes').insert({
    contador_id: ...,
    tipo: 'pagamento_efetuado',
    titulo: 'Pagamento Efetuado',
    mensagem: `Seu pagamento de R$ ${valor} foi transferido via Pix!`
  });
}
```

---

## 📊 RESUMO DO FLUXO COMPLETO

```
┌─────────────────────────────────────────────────────────────────┐
│ ETAPA 1: INDICAÇÃO                                              │
│ Frontend: LinksIndicacao.tsx                                    │
│ BD: invites, indicacoes, links                                  │
│ Output: URL com token único                                     │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ ETAPA 2: CONTRATAÇÃO                                            │
│ Frontend: Pagamentos.tsx                                        │
│ Edge Function: asaas-client                                     │
│ ASAAS API: POST /customers, POST /subscriptions                 │
│ BD: clientes (asaas_customer_id, asaas_subscription_id)         │
│ Output: Cliente ativo com subscription                          │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ ETAPA 3: PAGAMENTO (ASAAS)                                      │
│ Sistema: ASAAS (externo)                                        │
│ Processo: Cliente paga → ASAAS confirma → Gera evento           │
│ Output: Evento PAYMENT_RECEIVED                                 │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ ETAPA 4: WEBHOOK → SUPABASE                                     │
│ Edge Function: webhook-asaas                                    │
│ Validação: Assinatura MD5, idempotência                         │
│ BD: webhook_logs, pagamentos                                    │
│ Output: Pagamento registrado                                    │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ ETAPA 5: CÁLCULO DE COMISSÕES                                   │
│ Edge Function: calcular-comissoes                               │
│ Regras: Níveis, Override MMN, Bônus                             │
│ Output: Arrays de comissões e bônus                             │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ ETAPA 6: SALVAMENTO TRANSACIONAL                                │
│ RPC: executar_calculo_comissoes()                               │
│ BD: comissoes, bonus_historico, comissoes_calculo_log          │
│ Idempotência: UNIQUE constraints                                │
│ Output: Comissões status 'calculada'                            │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ ETAPA 7: ATUALIZAÇÃO DO FRONT-END                               │
│ Frontend: Dashboard.tsx, Comissoes.tsx                          │
│ Query: TanStack Query com refetch automático                    │
│ RLS: Políticas de segurança por contador                        │
│ Output: Dashboard atualizado em tempo real                      │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ ETAPA 8: APROVAÇÃO                                              │
│ Edge Function: aprovar-comissoes (manual ou automático)         │
│ Validação: Contador ativo, valores corretos                     │
│ BD: UPDATE status 'calculada' → 'aprovada'                      │
│ Output: Comissões aprovadas                                     │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ ETAPA 9: ORDEM DE PAGAMENTO                                     │
│ CRON: Dia 25 de cada mês (00:00 UTC)                            │
│ Edge Function: processar-pagamento-comissoes                    │
│ Regra: >= R$ 100 PAGA, < R$ 100 ACUMULA                         │
│ BD: UPDATE status 'aprovada' → 'paga'                           │
│ Output: Notificação para contador                               │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ ETAPA 10: EXECUÇÃO DO PAGAMENTO (FUTURO)                        │
│ Edge Function: executar-pagamento-contador (não implementado)   │
│ ASAAS API: POST /transfers (Pix)                                │
│ BD: transferencias                                              │
│ Output: Dinheiro na conta do contador                           │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🗂️ TABELAS DO BANCO DE DADOS

### **Núcleo de Usuários**

| Tabela | Descrição | Campos-chave |
|--------|-----------|--------------|
| `profiles` | Perfis de usuários | id, nome, email, cpf |
| `user_roles` | Papéis (admin, contador, suporte) | user_id, role |
| `contadores` | Dados do contador | clientes_ativos, nivel, xp, chave_pix |
| `clientes` | Empresas clientes | contador_id, asaas_customer_id, status, plano |

### **Sistema de Indicação**

| Tabela | Descrição | Campos-chave |
|--------|-----------|--------------|
| `invites` | Convites gerados | token, emissor_id, tipo, status, expira_em |
| `indicacoes` | Indicações convertidas | contador_id, cliente_id, status |
| `links` | Links de rastreamento | token, canal, cliques, conversoes |
| `rede_contadores` | Árvore MMN | sponsor_id, child_id, nivel_rede |

### **Financeiro**

| Tabela | Descrição | Campos-chave |
|--------|-----------|--------------|
| `pagamentos` | Pagamentos recebidos | cliente_id, asaas_payment_id, asaas_event_id, valor_liquido, tipo, status |
| `comissoes` | Comissões calculadas | contador_id, pagamento_id, tipo, valor, status, competencia |
| `bonus_historico` | Bônus conquistados | contador_id, tipo_bonus, marco_atingido, valor, status |
| `comissoes_calculo_log` | Logs de cálculo | comissao_id, regra_aplicada, valores_intermediarios |
| `transferencias` | Pagamentos Pix (futuro) | contador_id, asaas_transfer_id, valor, status |

### **Controle e Auditoria**

| Tabela | Descrição | Campos-chave |
|--------|-----------|--------------|
| `webhook_logs` | Logs de webhooks | event_id, event_type, payload, processado |
| `audit_logs` | Logs de auditoria | acao, user_id, tabela, payload |
| `notificacoes` | Notificações | contador_id, tipo, titulo, mensagem |

---

## 🔧 EDGE FUNCTIONS (SUPABASE)

| Function | Descrição | Trigger |
|----------|-----------|---------|
| `webhook-asaas` | Recebe webhooks do ASAAS | HTTP POST do ASAAS |
| `calcular-comissoes` | Calcula comissões e bônus | Chamado por webhook-asaas |
| `aprovar-comissoes` | Aprova comissões calculadas | Manual ou automático |
| `processar-pagamento-comissoes` | Processa pagamentos >= R$100 | CRON dia 25 |
| `asaas-client` | Client para ASAAS API | Frontend |
| `verificar-bonus-ltv` | Verifica bônus LTV | Manual |

---

## 📐 ENUM TYPES

```sql
-- Níveis de contador
CREATE TYPE nivel_contador AS ENUM ('bronze', 'prata', 'ouro', 'diamante');

-- Status de contador
CREATE TYPE status_contador AS ENUM ('ativo', 'inativo', 'tier_1', 'tier_2', 'tier_3');

-- Tipos de plano
CREATE TYPE tipo_plano AS ENUM ('basico', 'profissional', 'premium', 'enterprise');

-- Status de cliente
CREATE TYPE status_cliente AS ENUM ('lead', 'ativo', 'cancelado', 'inadimplente');

-- Tipos de indicação
CREATE TYPE tipo_indicacao AS ENUM ('cliente', 'contador');

-- Status de indicação
CREATE TYPE status_indicacao AS ENUM ('clique', 'cadastro', 'convertido', 'expirado');

-- Tipos de pagamento
CREATE TYPE tipo_pagamento AS ENUM ('ativacao', 'recorrente');

-- Status de pagamento
CREATE TYPE status_pagamento AS ENUM ('pendente', 'pago', 'cancelado', 'estornado');

-- Tipos de comissão
CREATE TYPE tipo_comissao AS ENUM (
  'ativacao',
  'recorrente',
  'override',
  'bonus_progressao',
  'bonus_ltv',
  'bonus_rede',
  'lead_diamante'
);

-- Status de comissão
CREATE TYPE status_comissao AS ENUM ('calculada', 'aprovada', 'paga', 'cancelada');

-- Papéis de usuário
CREATE TYPE app_role AS ENUM ('admin', 'contador', 'suporte');
```

---

## 🔐 SEGREDOS E VARIÁVEIS DE AMBIENTE

### **Edge Functions (Supabase)**

| Variável | Descrição | Obrigatório |
|----------|-----------|-------------|
| `SUPABASE_URL` | URL do projeto Supabase | ✅ Auto |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key | ✅ Auto |
| `ASAAS_API_KEY` | Token de acesso ASAAS | ✅ Manual |
| `ASAAS_WEBHOOK_SECRET` | Secret para validação MD5 | ⚠️ Recomendado |
| `ASAAS_API_URL` | URL da API (sandbox/prod) | ✅ Manual |

---

## ✅ VALIDAÇÕES E CONTROLES

### **Idempotência**

| Tabela | Constraint | Finalidade |
|--------|-----------|-------------|
| `pagamentos` | UNIQUE(asaas_payment_id) | Não duplicar pagamento |
| `pagamentos` | UNIQUE(asaas_event_id) | Não processar evento 2x |
| `comissoes` | UNIQUE(pagamento_id, contador_id, tipo) | Não duplicar comissão |
| `bonus_historico` | UNIQUE(contador_id, tipo_bonus, competencia, marco_atingido) | Não duplicar bônus |
| `webhook_logs` | UNIQUE(event_id) | Rastrear webhooks únicos |

### **Triggers Automáticos**

| Trigger | Tabela | Ação |
|---------|--------|------|
| `update_updated_at` | Todas | Atualiza updated_at em UPDATE |
| `handle_new_user` | auth.users | Cria profile automaticamente |
| `atualizar_clientes_ativos` | clientes | Incrementa/decrementa contador.clientes_ativos |

---

## 📈 MÉTRICAS E KPIs

### **Por Contador**
- Clientes ativos
- XP acumulado
- Nível atual
- Taxa de conversão de links
- Comissões do mês (calculadas, aprovadas, pagas)
- Bônus conquistados
- Tamanho da rede (downline)

### **Por Sistema**
- Total de webhooks processados
- Taxa de sucesso de webhooks
- Volume de comissões calculadas
- Volume de comissões pagas
- Taxa de acumulação (< R$100)
- Tempo médio de processamento

---

## 🚀 DEPLOY E CI/CD

**GitHub Actions:** `.github/workflows/deploy-simples.yml`

```yaml
on:
  push:
    branches: ['claude/**']
    paths: ['supabase/functions/**']
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm install -g supabase
      - name: Deploy Webhook
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.CLAUDECODE_ACCESS_TOKEN }}
        run: |
          supabase functions deploy webhook-asaas \
            --project-ref zytxwdgzjqrcmbnpgofj \
            --no-verify-jwt
```

---

## 📚 GLOSSÁRIO TÉCNICO

| Termo | Definição |
|-------|-----------|
| **Contador** | Profissional de contabilidade que indica clientes |
| **Cliente** | Empresa que contrata serviços de contabilidade |
| **Sponsor** | Contador que indicou outro contador (upline) |
| **Downline** | Contador indicado por outro (child) |
| **Override** | Comissão do sponsor sobre vendas do downline |
| **Comissão Direta** | Comissão do contador sobre seu próprio cliente |
| **Ativação** | Primeira mensalidade (100%) |
| **Recorrente** | Mensalidades seguintes (15%-20%) |
| **Competência** | Mês de referência do pagamento (YYYY-MM) |
| **Idempotência** | Garantia de não processar evento duplicado |
| **RLS** | Row Level Security (segurança por linha) |
| **Edge Function** | Função serverless Deno no Supabase |
| **RPC** | Remote Procedure Call (função no banco) |
| **CRON** | Agendamento automático de tarefas |
| **Webhook** | Notificação HTTP de eventos |

---

**FIM DO DOCUMENTO**

**Última atualização:** 2025-01-14
**Mantenedor:** Equipe Contadores de Elite
**Contato:** suporte@contadoresdeelite.com.br
