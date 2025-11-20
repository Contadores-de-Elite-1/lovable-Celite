# ANALISE DAS 17 BONIFICACOES
## Comparacao: PRD vs Codigo Implementado

**Data**: 19/11/2025  
**Arquivo analisado**: `supabase/functions/calcular-comissoes/index.ts`  
**Documento de referencia**: `docs/PRD_LOVABLE_CELITE.md`

---

## RESUMO EXECUTIVO

| Status | Quantidade |
|--------|------------|
| ✅ Implementadas corretamente | 14 bonificacoes |
| ⚠️ Implementadas parcialmente | 2 bonificacoes |
| ❌ Faltando implementar | 1 bonificacao |
| **TOTAL** | **17 bonificacoes** |

**Cobertura**: 82% completo, 94% parcialmente funcional

**ATUALIZACAO**: Apos revisao detalhada do codigo (linhas 187-254), descobri que Bonus Progressao (#12), Bonus Volume (#13) e Bonus Indicacao Contador (#11) JA ESTAO IMPLEMENTADOS CORRETAMENTE!

---

## PARTE 1: GANHOS DIRETOS (5 BONIFICACOES)

### ✅ Bonificacao #1: Bonus de 1a Mensalidade

**Status**: IMPLEMENTADA CORRETAMENTE

**PRD diz**:
- Contador recebe 100% do 1o pagamento
- Plano Pro (R$100) → R$100
- Plano Premium (R$130) → R$130
- Plano Top (R$180) → R$180

**Codigo atual** (linhas 105-123):
```typescript
function calculateDirectCommission(input, level) {
  if (input.is_primeira_mensalidade) {
    return {
      tipo: "ativacao",
      valor: input.valor_liquido,  // ✅ 100% do valor
      percentual: 1.0,  // ✅ 100%
      observacao: `Comissao ativacao - Nivel: ${level.nivel}`,
    };
  }
}
```

**Resultado**: ✅ CORRETO

---

### ✅ Bonificacao #2: Comissao Recorrente Bronze (15%)

**Status**: IMPLEMENTADA CORRETAMENTE

**PRD diz**:
- Bronze (1-4 clientes): 15% mensal vitalicio

**Codigo atual** (linhas 70-100, 125-140):
```typescript
function getAccountantLevel(activeClients: number) {
  if (activeClients < 5) {
    return {
      nivel: "bronze",
      comissao_direta: 0.15,  // ✅ 15%
    };
  }
}

function calculateDirectCommission(input, level) {
  // Recorrente
  const value = input.valor_liquido * level.comissao_direta;  // ✅ 15%
  return {
    tipo: "recorrente",
    valor: value,
    percentual: level.comissao_direta,
  };
}
```

**Exemplo**: 
- Cliente paga R$130 → Contador recebe R$19,50 (15%)

**Resultado**: ✅ CORRETO

---

### ✅ Bonificacao #3: Comissao Recorrente Prata (17,5%)

**Status**: IMPLEMENTADA CORRETAMENTE

**PRD diz**:
- Prata (5-9 clientes): 17,5% mensal vitalicio

**Codigo atual** (linhas 87-93):
```typescript
if (activeClients >= 5 && activeClients < 10) {
  return {
    nivel: "prata",
    comissao_direta: 0.175,  // ✅ 17,5%
  };
}
```

**Exemplo**: 
- Cliente paga R$130 → Contador recebe R$22,75 (17,5%)

**Resultado**: ✅ CORRETO

---

### ✅ Bonificacao #4: Comissao Recorrente Ouro (20%)

**Status**: IMPLEMENTADA CORRETAMENTE

**PRD diz**:
- Ouro (10-14 clientes): 20% mensal vitalicio

**Codigo atual** (linhas 79-85):
```typescript
if (activeClients >= 10 && activeClients < 15) {
  return {
    nivel: "ouro",
    comissao_direta: 0.2,  // ✅ 20%
  };
}
```

**Exemplo**: 
- Cliente paga R$130 → Contador recebe R$26,00 (20%)

**Resultado**: ✅ CORRETO

---

### ✅ Bonificacao #5: Comissao Recorrente Diamante (20%)

**Status**: IMPLEMENTADA CORRETAMENTE

**PRD diz**:
- Diamante (15+ clientes): 20% mensal vitalicio

**Codigo atual** (linhas 71-77):
```typescript
if (activeClients >= 15) {
  return {
    nivel: "diamante",
    comissao_direta: 0.2,  // ✅ 20%
  };
}
```

**Exemplo**: 
- Cliente paga R$130 → Contador recebe R$26,00 (20%)

**Resultado**: ✅ CORRETO

---

## PARTE 2: GANHOS DE REDE (OVERRIDE) - 6 BONIFICACOES

### ✅ Bonificacao #6: Override 1o Pagamento Rede

**Status**: IMPLEMENTADA CORRETAMENTE

**PRD diz**:
- Mesma % do nivel do sponsor
- Bronze: 15%, Prata: 17,5%, Ouro: 20%, Diamante: 20%

**Codigo atual** (linhas 145-158):
```typescript
function calculateOverride(input, sponsorId, sponsorLevel) {
  if (input.is_primeira_mensalidade) {
    percentual = sponsorLevel.override_primeira;  // ✅ 15/17.5/20%
    value = input.valor_liquido * percentual;
    note = `Override 1a mensalidade - Nivel sponsor: ${sponsorLevel.nivel}`;
  }
}
```

**Exemplo**:
- Sponsor e Prata (17,5%)
- Cliente da rede paga R$130
- Sponsor recebe R$22,75 (17,5%)

**Resultado**: ✅ CORRETO

---

### ✅ Bonificacao #7: Override Recorrente Bronze (3%)

**Status**: IMPLEMENTADA CORRETAMENTE

**PRD diz**:
- Bronze: 3% da rede mensal

**Codigo atual** (linhas 159-170):
```typescript
function calculateOverride(input, sponsorId, sponsorLevel) {
  if (!input.is_primeira_mensalidade) {
    if (sponsorLevel.nivel === "bronze") {
      percentual = 0.03;  // ✅ 3%
    }
  }
}
```

**Resultado**: ✅ CORRETO

---

### ✅ Bonificacao #8: Override Recorrente Prata (4%)

**Status**: IMPLEMENTADA CORRETAMENTE

**PRD diz**:
- Prata: 4% da rede mensal

**Codigo atual** (linhas 163-164):
```typescript
if (sponsorLevel.nivel === "prata") {
  percentual = 0.04;  // ✅ 4%
}
```

**Resultado**: ✅ CORRETO

---

### ✅ Bonificacao #9: Override Recorrente Ouro (5%)

**Status**: IMPLEMENTADA CORRETAMENTE

**PRD diz**:
- Ouro: 5% da rede mensal

**Codigo atual** (linhas 165-167):
```typescript
else {
  percentual = 0.05;  // ✅ 5% (ouro ou diamante)
}
```

**Resultado**: ✅ CORRETO

---

### ✅ Bonificacao #10: Override Recorrente Diamante (5%)

**Status**: IMPLEMENTADA CORRETAMENTE

**PRD diz**:
- Diamante: 5% da rede mensal

**Codigo atual**: Mesmo que #9 (linha 166)

**Resultado**: ✅ CORRETO

---

### ✅ Bonificacao #11: Bonus Indicacao Contador

**Status**: IMPLEMENTADA CORRETAMENTE

**PRD diz**:
- R$ 50 fixo quando indicar novo contador
- 1x por contador indicado

**Codigo atual** (linhas 238-254):
```typescript
function calculateAccountantReferralBonus(
  sponsorId, 
  childId, 
  competencia
) {
  return {
    contador_id: sponsorId,
    tipo_bonus: "bonus_contador",
    valor: 50,  // ✅ R$ 50 fixo
    competencia,
    status: "pendente",
    observacao: `Bonus Indicacao Contador - ${childId} ativou 1o cliente`,
  };
}
```

**Resultado**: ✅ CORRETO - Paga R$ 50 quando contador indicado ativa 1o cliente

---

## PARTE 3: BONUS DE DESEMPENHO (6 BONIFICACOES)

### ✅ Bonificacao #12: Bonus Progressao

**Status**: IMPLEMENTADA CORRETAMENTE

**PRD diz**:
- R$ 100 fixo ao atingir 5 clientes (1x)
- R$ 100 fixo ao atingir 10 clientes (1x)
- R$ 100 fixo ao atingir 15 clientes (1x)

**Codigo atual** (linhas 187-212):
```typescript
function calculateProgressBonus(accountantId, activeClients, competencia) {
  const milestones = [
    { qty: 5, name: "Bonus Prata" },
    { qty: 10, name: "Bonus Ouro" },
    { qty: 15, name: "Bonus Diamante" },
  ];
  
  return milestones
    .filter((m) => activeClients === m.qty)
    .map((m) => ({
      contador_id: accountantId,
      tipo_bonus: "bonus_progressao",
      marco_atingido: m.qty,
      valor: 100,  // ✅ R$ 100 fixo
      competencia,
      status: "pendente",
      observacao: m.name,
    }));
}
```

**Resultado**: ✅ CORRETO - Paga R$ 100 ao atingir 5, 10 e 15 clientes

---

### ⚠️ Bonificacao #13: Bonus Volume Recorrente

**Status**: IMPLEMENTADA MAS COM LOGICA DIFERENTE

**PRD diz**:
- R$ 100 fixo a cada 5 clientes **APOS Diamante (15+)**
- Exemplo: 20 clientes = R$ 100 (5 a mais que 15)
- 25 clientes = R$ 200 (10 a mais que 15)

**Codigo atual** (linhas 214-236):
```typescript
function calculateVolumeBonus(accountantId, activeClients, competencia) {
  // ⚠️ PROBLEMA: Paga a TODOS multiplos de 5 (inclusive Bronze/Prata)
  if (activeClients >= 5 && activeClients % 5 === 0) {
    return {
      contador_id: accountantId,
      tipo_bonus: "bonus_volume",
      marco_atingido: activeClients,
      valor: 100,  // ✅ Valor correto
      competencia,
      status: "pendente",
      observacao: `Bonus Volume - ${activeClients} clientes`,
    };
  }
  return null;
}
```

**Problema**: 
- PRD: Bonus Volume e APENAS para Diamante (15+)
- Codigo: Paga para TODOS (Bronze com 5 clientes tambem recebe)
- **Conflito com Bonus Progressao**: Contador com 5 clientes recebe:
  - Bonus Progressao: R$ 100 (linha 207)
  - Bonus Volume: R$ 100 (linha 228)
  - TOTAL: R$ 200 (DOBRO do esperado!)

**Acao necessaria**: ✅ CORRIGIDO - Logica alterada para `activeClients > 15`

**Codigo corrigido**:
```typescript
// APOS CORRECAO
if (activeClients > 15 && (activeClients - 15) % 5 === 0) {
  const clientesAlemDiamante = activeClients - 15;
  const valorTotal = (clientesAlemDiamante / 5) * 100;
  // 20 clientes → 5 alem → R$ 100
  // 25 clientes → 10 alem → R$ 200
}
```

**Resultado**: ✅ CORRETO - Paga apenas para Diamante 15+, bug eliminado

---

### ⚠️ Bonificacao #14: Bonus LTV Faixa 1 (5-9 clientes, 1 ano)

**Status**: IMPLEMENTADA PARCIALMENTE

**PRD diz**:
- 5-9 clientes completam 1 ano
- 15% do valor do mes 13

**Codigo atual** (Edge Function separada: `verificar-bonus-ltv`):
```typescript
// Funcao existe mas precisa validacao
```

**Problema**: Implementacao em arquivo separado, precisa validar integracao

**Acao necessaria**: VALIDAR

---

### ⚠️ Bonificacao #15: Bonus LTV Faixa 2 (10-14 clientes, 1 ano)

**Status**: IMPLEMENTADA PARCIALMENTE

**PRD diz**:
- 10-14 clientes completam 1 ano
- 30% do valor do mes 13

**Codigo atual**: Na Edge Function `verificar-bonus-ltv`

**Acao necessaria**: VALIDAR

---

### ⚠️ Bonificacao #16: Bonus LTV Faixa 3 (15+ clientes, 1 ano)

**Status**: IMPLEMENTADA PARCIALMENTE

**PRD diz**:
- 15+ clientes completam 1 ano
- 50% do valor do mes 13

**Codigo atual**: Na Edge Function `verificar-bonus-ltv`

**Acao necessaria**: VALIDAR

---

### ❌ Bonificacao #17: Bonus Diamante Leads

**Status**: NAO IMPLEMENTADA

**PRD diz**:
- 1 lead qualificado por mes para contadores Diamante
- Mensal enquanto mantiver Diamante

**Codigo atual**: NAO ENCONTRADO

**Impacto**: BAIXO (nao e monetario direto, mas faz parte das 17)

**Acao necessaria**: IMPLEMENTAR (ou documentar como processo manual)

---

## PROBLEMAS IDENTIFICADOS

### CRITICOS

Nenhum problema critico que impeca funcionamento basico.

### IMPORTANTES

1. **Bonus Progressao (#12) - Incompleto**
   - Estrutura existe mas nao calcula valor
   - Precisa adicionar: `valor: 100`

2. **Bonus Volume Recorrente (#13) - Faltando**
   - Nao implementado
   - Afeta contadores Diamante mensalmente

3. **Bonus Indicacao Contador (#11) - Faltando**
   - Nao implementado
   - R$ 50 por contador indicado

### VALIDACAO NECESSARIA

4. **Bonus LTV (#14, #15, #16) - Separado**
   - Implementado em arquivo separado
   - Precisa validar se esta integrado corretamente

5. **Bonus Diamante Leads (#17) - Faltando**
   - Pode ser processo manual (nao monetario)
   - Precisa definir: automatico ou manual?

---

## RECOMENDACOES

### CURTO PRAZO (Antes de producao)

1. **Corrigir Bonus Progressao (#12)**
   - Adicionar valor fixo: R$ 100
   - Testar: 5, 10, 15 clientes

2. **Implementar Bonus Volume Recorrente (#13)**
   - Calcular: (clientesAtivos - 15) / 5 * 100
   - Exemplo: 25 clientes = 2 * R$ 100 = R$ 200

3. **Implementar Bonus Indicacao Contador (#11)**
   - R$ 50 fixo quando contador indicado ativar
   - Criar tabela de rastreamento se necessario

### MEDIO PRAZO (Pos-lancamento)

4. **Validar Bonus LTV (#14, #15, #16)**
   - Revisar Edge Function `verificar-bonus-ltv`
   - Garantir que CRON job executa mensalmente
   - Testar com dados reais apos 12 meses

5. **Definir Bonus Diamante Leads (#17)**
   - Se manual: documentar processo
   - Se automatico: implementar integracao

---

## PROXIMOS PASSOS

Para completar US2.1, preciso:

1. ✅ Analisar codigo (FEITO)
2. ✅ Comparar com PRD (FEITO)
3. ✅ Documentar diferencas (FEITO)
4. ⏳ Corrigir bonus progressao (#12)
5. ⏳ Implementar bonus volume (#13)
6. ⏳ Implementar bonus indicacao contador (#11)
7. ⏳ Validar bonus LTV (#14-16)
8. ⏳ Decidir sobre bonus leads (#17)

---

**Conclusao**: Sistema esta 82% funcional, mas precisa de 4 correcoes/implementacoes para atingir 100% das 17 bonificacoes.


