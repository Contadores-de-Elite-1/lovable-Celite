# ⚠️ MUDANÇAS CRÍTICAS: Cálculo de Comissão pós Stripe

**Data:** 19/11/2025  
**Prioridade:** 🔴 CRÍTICA - IMPACTA TODO O PROJETO  
**Status:** 📋 IDENTIFICADA E DOCUMENTADA

---

## 🔴 O PROBLEMA

Anteriormente, as comissões eram calculadas sobre o **valor BRUTO**.

Agora, devem ser calculadas sobre o **valor LÍQUIDO (após taxa Stripe)**.

**Exemplo:**
```
ANTES (❌ ERRADO):
Cliente paga: R$ 130
Comissão: 15% de R$ 130 = R$ 19,50

AGORA (✅ CORRETO):
Cliente paga: R$ 130
Stripe cobra: R$ 4,07 (2.9% + R$0.30)
Valor líquido: R$ 125,93
Comissão: 15% de R$ 125,93 = R$ 18,89
```

**Diferença:** R$ 19,50 → R$ 18,89 (-R$ 0,61 por comissão)

---

## 📊 IMPACTO EM CADA COMPONENTE

### **1. Calculadora.tsx** ⚠️ REQUER ATUALIZAÇÃO

**Local:** `/src/pages/Calculadora.tsx`

**Mudanças necessárias:**
```typescript
// ANTES:
const ativacao = totalClientesDiretos * valorPlano * taxa.ativacao;

// DEPOIS:
const valorLiquido = valorPlano * (1 - 0.029) - 0.30; // Após Stripe
const ativacao = totalClientesDiretos * valorLiquido * taxa.ativacao;
```

**Recorrente mensal:**
```typescript
// ANTES:
const recorrenteMensal = totalClientesDiretos * valorPlano * taxa.recorrente;

// DEPOIS:
const recorrenteMensal = totalClientesDiretos * valorLiquido * taxa.recorrente;
```

**Todas as 17 bonificações usam `valorLiquido` em vez de `valorPlano`!**

---

### **2. Edge Function: calcular-comissoes** ⚠️ REQUER ATUALIZAÇÃO

**Local:** `/supabase/functions/calcular-comissoes/index.ts`

**Mudanças necessárias:**
```typescript
// ANTES:
const ativacao = cliente.valor_plano * 0.15;

// DEPOIS:
const stripeFee = cliente.valor_plano * 0.029 + 0.30;
const valorLiquido = cliente.valor_plano - stripeFee;
const ativacao = valorLiquido * 0.15;
```

**Isto afeta TODAS as 17 bonificações no cálculo!**

---

### **3. Simulador (Futuro Épico)** ⚠️ REQUER ATUALIZAÇÃO

**Local:** `/src/pages/Simulador.tsx` (quando implementar)

**Mesma lógica que Calculadora:**
- Calcular valor líquido após Stripe
- Aplicar sobre todos os cenários

---

### **4. PRD - Fórmulas de Cálculo** ⚠️ REQUER ATUALIZAÇÃO

**Local:** `/docs/PRD_LOVABLE_CELITE.md` (Seção 6: Fórmulas de Cálculo)

**Atualmente:**
```
#1 - Ativação: clientes * valor_plano * taxa
```

**Deve ser:**
```
#1 - Ativação: clientes * valor_liquido * taxa
  onde: valor_liquido = valor_plano - (valor_plano * 0.029 + 0.30)
```

---

### **5. Testes Unitários** ⚠️ REQUER ATUALIZAÇÃO

**Local:** `/supabase/functions/calcular-comissoes/calcular-comissoes.test.ts`

**Todos os valores esperados mudam!**

**Exemplo:**
```typescript
// ANTES:
expect(resultado.ativacao).toBe(1950); // 15% de 13000

// DEPOIS:
// valor_liquido = 13000 - (377 + 30) = 12593
expect(resultado.ativacao).toBe(1889); // 15% de 12593
```

---

### **6. Dashboard** ℹ️ INFORMATIVO

**Local:** `/src/pages/Dashboard.tsx`

**Impacto:** Baixo (apenas exibe dados)

**Considerar:** Exibir breakdown de Stripe fee opcionalmente

---

### **7. FRAMEWORK & Documentação** ⚠️ REQUER ATUALIZAÇÃO

**Local:** `/docs/FRAMEWORK_LOVABLE_CELITE.md`

**Atualizar:** Seção de financeiro com novo cálculo

---

## 🔧 ORDEM DE IMPLEMENTAÇÃO

### **FASE 1: Épico 4 (Onboarding)**
- [ ] Implementar com valor líquido desde o início
- [ ] Edge Function: calcular-comissoes USE valor_liquido
- [ ] Testes: validar novo valor

### **FASE 2: Correção Retroativa** (após Épico 4)
- [ ] Atualizar Calculadora.tsx
- [ ] Atualizar Simulador.tsx
- [ ] Atualizar PRD fórmulas
- [ ] Atualizar testes
- [ ] Atualizar documentação

### **FASE 3: Dashboard**
- [ ] Considerar exibir fee Stripe (opcional)
- [ ] Testar cálculos com novo valor

---

## 💡 CHECKLIST ANTES DE CÓDIGO

- [ ] Calcular valor_liquido = valor_plano - (valor_plano * 0.029 + 0.30)
- [ ] Verificar se aplica em TODAS as 17 bonificações
- [ ] Testar com valores reais (R$ 100, 130, 180)
- [ ] Documentar fórmula no código com comentário
- [ ] Validar com testes

---

## 📝 VALORES CORRETOS POR PLANO

| Plano | Bruto | Stripe Fee | Líquido | Com 15% | Diferença |
|-------|-------|-----------|---------|---------|-----------|
| Básico | R$ 100 | R$ 3,19 | R$ 96,81 | R$ 14,52 | -R$ 0,48 |
| Prof. | R$ 130 | R$ 4,07 | R$ 125,93 | R$ 18,89 | -R$ 0,61 |
| Premium | R$ 180 | R$ 5,52 | R$ 174,48 | R$ 26,17 | -R$ 0,83 |

---

## ✅ IMPACTO NO NEGÓCIO

**Se não mudar:**
- ❌ Calculadora mostra valores INFLADOS
- ❌ Contador espera R$ 19,50 mas recebe R$ 18,89
- ❌ Litígio potencial 📋

**Se mudar agora:**
- ✅ Tudo consistente desde o início
- ✅ Sem surpresas para contadores
- ✅ Correto legal e financeiramente

---

## 🚀 PRÓXIMO PASSO

**Épico 4 deve ser implementado COM ESTES VALORES CORRETOS desde o início!**

Não implementar agora e corrigir depois = RETRABALHO!

---

**Status:** 🔴 CRÍTICA - Aguardando implementação com Épico 4

**Responsável:** Épico 4 (Onboarding) deve iniciar com isto já integrado

