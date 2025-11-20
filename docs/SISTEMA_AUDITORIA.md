# SISTEMA DE AUDITORIA COMPLETA
## Rastreabilidade Total de Comissoes e Bonus

**Data**: 19/11/2025  
**Responsavel**: Claude Sonnet 4.5  
**Objetivo**: Garantir rastreabilidade 100% de todos os calculos de comissoes

---

## VISAO GERAL

O Sistema de Auditoria do Lovable-Celite registra TODAS as operacoes relacionadas a comissoes e bonus, permitindo:

1. **Rastreabilidade**: Saber exatamente quando e como cada comissao foi calculada
2. **Transparencia**: Contadores podem ver historico completo
3. **Debugging**: Identificar rapidamente problemas
4. **Compliance**: Atender requisitos legais e contratuais
5. **Reprocessamento**: Recalcular comissoes em caso de erro

---

## TABELA `audit_logs`

### Estrutura

```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  acao VARCHAR(50) NOT NULL,
  tabela VARCHAR(50),
  registro_id UUID,
  usuario_id UUID,
  payload JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indices para performance
CREATE INDEX idx_audit_logs_acao ON audit_logs(acao);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_registro_id ON audit_logs(registro_id);
```

### Acoes Registradas

| Acao | Quando | Payload |
|------|--------|---------|
| `WEBHOOK_ASAAS_RECEBIDO` | Pagamento confirmado | payload completo do ASAAS |
| `PAGAMENTO_CRIADO` | Novo pagamento inserido | dados do pagamento |
| `COMISSAO_CALCULADA` | Comissao calculada | detalhes do calculo |
| `BONUS_CRIADO` | Bonus gerado | tipo e valor do bonus |
| `RECONCILIACAO_DIARIA` | Reconciliacao executada | divergencias encontradas |
| `LTV_BONUS_GRUPO_PROCESSADO` | Bonus LTV calculado | grupo processado |
| `REPROCESSAMENTO_MANUAL` | Admin reprocessou | motivo e resultado |

---

## FLUXO DE AUDITORIA

### 1. Webhook ASAAS Recebido

```typescript
// supabase/functions/webhook-asaas/index.ts

await supabase.from('audit_logs').insert({
  acao: 'WEBHOOK_ASAAS_RECEBIDO',
  tabela: 'pagamentos',
  payload: {
    asaas_payment_id: payment.id,
    asaas_customer_id: payment.customer,
    valor_bruto: payment.value,
    valor_liquido: payment.netValue,
    evento: payload.event,
    assinatura_validada: isValidSignature,
    timestamp: new Date().toISOString()
  }
});
```

**O que registra**:
- ID do pagamento no ASAAS
- Valores bruto e liquido
- Se a assinatura foi validada
- Timestamp da recep cao

---

### 2. Pagamento Criado

```typescript
await supabase.from('audit_logs').insert({
  acao: 'PAGAMENTO_CRIADO',
  tabela: 'pagamentos',
  registro_id: novoPagamento.id,
  payload: {
    cliente_id: cliente.id,
    contador_id: cliente.contador_id,
    tipo: isPrimeiroPagamento ? 'ativacao' : 'mensalidade',
    valor_liquido: valoresValidados.valor_liquido,
    competencia: competencia,
    asaas_payment_id: payment.id
  }
});
```

**O que registra**:
- Tipo de pagamento (ativacao/mensalidade)
- Cliente e contador vinculados
- Valores validados
- Link com ASAAS

---

### 3. Comissao Calculada

```typescript
await supabase.from('audit_logs').insert({
  acao: 'COMISSAO_CALCULADA',
  tabela: 'comissoes',
  registro_id: comissaoId,
  payload: {
    pagamento_id: input.pagamento_id,
    contador_id: input.contador_id,
    nivel: level.nivel,
    tipo: 'ativacao', // ou 'recorrente', 'override', etc.
    valor_calculado: directCommission.valor,
    percentual_aplicado: directCommission.percentual,
    formula: `valor_liquido (${input.valor_liquido}) × percentual (${level.comissao_direta})`,
    resultado: directCommission.valor
  }
});
```

**O que registra**:
- Nivel do contador no momento do calculo
- Formula aplicada
- Percentual utilizado
- Resultado final

---

### 4. Bonus Criado

```typescript
await supabase.from('audit_logs').insert({
  acao: 'BONUS_CRIADO',
  tabela: 'bonus_historico',
  registro_id: bonusId,
  payload: {
    contador_id: accountantId,
    tipo_bonus: 'bonus_progressao', // ou 'bonus_volume', 'bonus_ltv', etc.
    marco_atingido: 5, // ou 10, 15, 20, etc.
    valor: 100,
    competencia: competencia,
    regra_aplicada: 'Bonus Progressao: R$ 100 ao atingir 5 clientes',
    clientes_ativos_no_momento: activeClients
  }
});
```

**O que registra**:
- Tipo de bonus
- Marco atingido
- Quantidade de clientes no momento
- Regra aplicada

---

### 5. Reconciliacao Diaria

```typescript
await supabase.from('audit_logs').insert({
  acao: 'RECONCILIACAO_DIARIA',
  tabela: 'comissoes',
  payload: {
    data_reconciliacao: hoje,
    total_verificacoes: totalVerificacoes,
    divergencias_encontradas: divergencias.length,
    divergencias: divergencias,
    severidade_maxima: 'critica' // ou 'alta', 'media', 'baixa'
  }
});
```

**O que registra**:
- Todas as divergencias encontradas
- Severidade de cada uma
- Total de verificacoes realizadas

---

## DASHBOARD DE AUDITORIA (ADMIN)

### Tela 1: Visao Geral

```
┌─────────────────────────────────────────────────────────────┐
│  AUDITORIA DE COMISSOES - VISAO GERAL                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Periodo: [Ultimo mes ▼]                  🔍 Buscar          │
│                                                              │
│  📊 RESUMO DO PERIODO                                        │
│  ┌──────────────┬──────────────┬──────────────┬────────────┐│
│  │ Pagamentos   │ Comissoes    │ Bonus        │ Divergencias││
│  │ Processados  │ Calculadas   │ Criados      │ Encontradas ││
│  ├──────────────┼──────────────┼──────────────┼────────────┤│
│  │    1.247     │    4.892     │     156      │      3     ││
│  └──────────────┴──────────────┴──────────────┴────────────┘│
│                                                              │
│  ⚠️ ALERTAS CRITICOS                                         │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ [CRITICO] Pagamento PAY_123 sem comissao (19/11)      │ │
│  │ [ALTO] Comissao duplicada para contador CON_456       │ │
│  │ [MEDIO] Bonus Progressao faltando para CON_789        │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  📈 HISTORICO DE LOGS (ultimos 100)                          │
│  ┌──────────┬─────────────────┬────────────┬──────────────┐│
│  │ Data/Hora│ Acao            │ Tabela     │ Detalhes     ││
│  ├──────────┼─────────────────┼────────────┼──────────────┤│
│  │ 19/11 14h│ WEBHOOK_RECEBIDO│ pagamentos │ Ver payload  ││
│  │ 19/11 14h│ COMISSAO_CALC   │ comissoes  │ Ver calculo  ││
│  │ 19/11 13h│ BONUS_CRIADO    │ bonus_hist │ Ver detalhes ││
│  │ 19/11 12h│ RECONCILIACAO   │ comissoes  │ Ver relatorio││
│  └──────────┴─────────────────┴────────────┴──────────────┘│
│                                                              │
│  [Reprocessar Comissoes]  [Exportar Logs]  [Configuracoes] │
└─────────────────────────────────────────────────────────────┘
```

---

### Tela 2: Detalhes de um Calculo

```
┌─────────────────────────────────────────────────────────────┐
│  AUDITORIA - DETALHES DO CALCULO                            │
│  Comissao ID: COM_12345                                     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  📋 INFORMACOES GERAIS                                       │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Contador: Carlos Silva (CON_789)                       │ │
│  │ Cliente: Empresa XYZ (CLI_456)                         │ │
│  │ Pagamento: PAY_123 (R$ 130,00)                         │ │
│  │ Data: 19/11/2025 14:23:45                              │ │
│  │ Tipo: Comissao Recorrente                              │ │
│  │ Status: Aprovada                                       │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  🧮 CALCULO DETALHADO                                        │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Nivel do contador: PRATA (7 clientes ativos)          │ │
│  │ Formula aplicada: valor_liquido × percentual           │ │
│  │                                                        │ │
│  │ Valores:                                               │ │
│  │   - Valor liquido: R$ 130,00                           │ │
│  │   - Percentual Prata: 17,5%                            │ │
│  │   - Resultado: R$ 130,00 × 0,175 = R$ 22,75            │ │
│  │                                                        │ │
│  │ Regra: Bonificacao #3 (Comissao Recorrente Prata)     │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  📜 HISTORICO DE MUDANCAS                                    │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ 19/11 14:23 - Comissao calculada (R$ 22,75)           │ │
│  │ 19/11 14:25 - Status alterado: calculada → aprovada   │ │
│  │ 25/11 10:00 - Comissao paga via Stripe                │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  📎 PAYLOAD COMPLETO (JSON)                                  │
│  ```json                                                     │
│  {                                                           │
│    "contador_id": "CON_789",                                 │
│    "cliente_id": "CLI_456",                                  │
│    "nivel": "prata",                                         │
│    "clientes_ativos": 7,                                     │
│    "valor_liquido": 130,                                     │
│    "percentual": 0.175,                                      │
│    "valor_calculado": 22.75                                  │
│  }                                                           │
│  ```                                                         │
│                                                              │
│  [Voltar]  [Reprocessar]  [Exportar JSON]                   │
└─────────────────────────────────────────────────────────────┘
```

---

## QUERIES UTEIS PARA AUDITORIA

### 1. Buscar todos os logs de um pagamento especifico

```sql
SELECT 
  al.*,
  p.valor_liquido,
  c.nome as cliente_nome
FROM audit_logs al
LEFT JOIN pagamentos p ON al.registro_id = p.id
LEFT JOIN clientes c ON p.cliente_id = c.id
WHERE al.payload->>'asaas_payment_id' = 'pay_123456'
ORDER BY al.created_at DESC;
```

---

### 2. Buscar comissoes calculadas em um periodo

```sql
SELECT 
  al.created_at,
  al.payload->>'contador_id' as contador_id,
  al.payload->>'valor_calculado' as valor,
  al.payload->>'percentual_aplicado' as percentual,
  al.payload->>'nivel' as nivel
FROM audit_logs al
WHERE al.acao = 'COMISSAO_CALCULADA'
  AND al.created_at >= '2025-11-01'
  AND al.created_at < '2025-12-01'
ORDER BY al.created_at DESC;
```

---

### 3. Buscar divergencias criticas

```sql
SELECT 
  al.created_at,
  al.payload->'divergencias' as divergencias,
  jsonb_array_length(al.payload->'divergencias') as total_divergencias
FROM audit_logs al
WHERE al.acao = 'RECONCILIACAO_DIARIA'
  AND al.payload->>'divergencias_criticas' != '0'
ORDER BY al.created_at DESC;
```

---

### 4. Rastrear historico completo de um contador

```sql
SELECT 
  al.created_at,
  al.acao,
  al.tabela,
  al.payload
FROM audit_logs al
WHERE al.payload->>'contador_id' = 'uuid-do-contador'
ORDER BY al.created_at DESC
LIMIT 100;
```

---

### 5. Verificar se todas as comissoes tem log de auditoria

```sql
SELECT 
  c.id as comissao_id,
  c.created_at,
  c.valor,
  CASE 
    WHEN al.id IS NOT NULL THEN 'Tem log'
    ELSE 'SEM LOG!'
  END as status_auditoria
FROM comissoes c
LEFT JOIN audit_logs al 
  ON c.id = al.registro_id 
  AND al.acao = 'COMISSAO_CALCULADA'
WHERE c.created_at >= '2025-11-01'
ORDER BY c.created_at DESC;
```

---

## REPROCESSAMENTO MANUAL

### Quando Reprocessar?

Reprocessar comissoes e necessario quando:
1. **Bug corrigido**: Erro no codigo foi identificado e corrigido
2. **Regra alterada**: Mudanca retroativa de percentual
3. **Divergencia detectada**: Reconciliacao encontrou problema
4. **Solicitacao do contador**: Contador reporta valor incorreto

### Como Reprocessar

1. **Identificar pagamentos afetados**:
```sql
SELECT id, cliente_id, valor_liquido
FROM pagamentos
WHERE created_at >= '2025-11-01'
  AND created_at < '2025-11-02';
```

2. **Deletar comissoes antigas** (com backup):
```sql
-- Backup
CREATE TABLE comissoes_backup_20251119 AS
SELECT * FROM comissoes WHERE pagamento_id IN (SELECT id FROM pagamentos WHERE ...);

-- Deletar
DELETE FROM comissoes WHERE pagamento_id IN (...);
```

3. **Executar Edge Function novamente**:
```bash
curl -X POST https://your-project.supabase.co/functions/v1/calcular-comissoes \
  -H "Authorization: Bearer YOUR_SERVICE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "pagamento_id": "uuid",
    "cliente_id": "uuid",
    "contador_id": "uuid",
    "valor_liquido": 130,
    "competencia": "2025-11-01",
    "is_primeira_mensalidade": false
  }'
```

4. **Registrar reprocessamento**:
```typescript
await supabase.from('audit_logs').insert({
  acao: 'REPROCESSAMENTO_MANUAL',
  tabela: 'comissoes',
  payload: {
    motivo: 'Bug corrigido: Bonus Volume pagava para Bronze',
    pagamentos_reprocessados: [...],
    comissoes_antigas_deletadas: [...],
    comissoes_novas_criadas: [...],
    admin_responsavel: 'admin@topclass.com.br',
    timestamp: new Date().toISOString()
  }
});
```

---

## METRICAS DE AUDITORIA

### KPIs Principais

| Metrica | Meta | Frequencia |
|---------|------|------------|
| Taxa de logs criados | 100% | Diaria |
| Divergencias criticas | 0 | Diaria |
| Tempo de resolucao de divergencias | < 24h | Por incidente |
| Cobertura de auditoria | 100% | Mensal |
| Reprocessamentos necessarios | < 1/mes | Mensal |

---

## INTEGRACAO COM SENTRY

Para erros criticos, integrar com Sentry:

```typescript
// Em caso de divergencia critica
if (divergencia.severidade === 'critica') {
  // Sentry.captureException(new Error(`Divergencia critica: ${divergencia.descricao}`), {
  //   extra: {
  //     divergencia: divergencia,
  //     pagamento_id: divergencia.pagamento_id
  //   },
  //   level: 'error'
  // });
}
```

---

## CONCLUSAO

O Sistema de Auditoria garante:

1. ✅ **Rastreabilidade 100%** de todos os calculos
2. ✅ **Transparencia** para contadores
3. ✅ **Debugging rapido** em caso de problemas
4. ✅ **Compliance** legal e contratual
5. ✅ **Reprocessamento seguro** quando necessario

**Proximo passo**: Implementar Dashboard de Auditoria na UI (Sprint futura)

---

**Documento gerado em**: 19/11/2025  
**Responsavel**: Claude Sonnet 4.5  
**Status**: Sistema de auditoria implementado e documentado

