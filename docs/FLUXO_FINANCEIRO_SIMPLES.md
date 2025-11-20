# 💰 COMO FUNCIONA O PAGAMENTO DAS COMISSÕES

**Explicação simples para quem não é programador**

---

## 📅 LINHA DO TEMPO (Exemplo Real)

Imagine que hoje é **10 de Janeiro de 2025**:

```
┌──────────────────────────────────────────────────────┐
│ 📆 DIA 10/JANEIRO - CLIENTE CONTRATA                │
├──────────────────────────────────────────────────────┤
│                                                      │
│ Você (contador) indica um cliente                   │
│ Cliente escolhe Plano PREMIUM (R$ 130/mês)          │
│ Cliente paga com cartão de crédito                  │
│                                                      │
│ ✅ Pagamento aprovado!                               │
│                                                      │
│ O que acontece:                                     │
│ • Dinheiro vai para conta da Lovable-Celite        │
│ • Sistema CALCULA sua comissão automaticamente:     │
│   - Cliente pagou: R$ 130,00                        │
│   - Stripe cobrou taxa: R$ 4,07                     │
│   - Sobrou: R$ 125,93                               │
│   - SUA COMISSÃO (1º pagamento): R$ 125,93 ✅      │
│                                                      │
│ • Sistema GUARDA essa informação no banco de dados  │
│ • Status: "Calculada" (ainda não foi para sua conta)│
│                                                      │
│ 💡 Você pode ver isso no app imediatamente!         │
└──────────────────────────────────────────────────────┘
         │
         │ Continua captando clientes...
         │
         ▼
┌──────────────────────────────────────────────────────┐
│ 📆 DIA 15/JANEIRO - OUTRO CLIENTE                   │
├──────────────────────────────────────────────────────┤
│                                                      │
│ Você indica mais um cliente                         │
│ Plano PRO (R$ 100/mês)                              │
│ Comissão: R$ 96,81                                  │
│ Status: "Calculada"                                 │
│                                                      │
│ TOTAL DO MÊS até agora:                             │
│ Cliente 1: R$ 125,93                                │
│ Cliente 2: R$  96,81                                │
│ ─────────────────────                               │
│ TOTAL:     R$ 222,74 ✅                             │
└──────────────────────────────────────────────────────┘
         │
         │ Continua o mês...
         │
         ▼
┌──────────────────────────────────────────────────────┐
│ 📆 DIA 31/JANEIRO - FIM DO MÊS                      │
├──────────────────────────────────────────────────────┤
│                                                      │
│ Mês de Janeiro fechou!                              │
│                                                      │
│ Você captou 5 clientes em Janeiro:                  │
│ • Cliente 1 (dia 10): R$ 125,93                     │
│ • Cliente 2 (dia 15): R$  96,81                     │
│ • Cliente 3 (dia 18): R$ 125,93                     │
│ • Cliente 4 (dia 22): R$ 174,48                     │
│ • Cliente 5 (dia 28): R$ 125,93                     │
│ ───────────────────────────────                     │
│ TOTAL JANEIRO/2025: R$ 649,08 💰                    │
│                                                      │
│ Status: "Calculada" (aguardando aprovação)          │
└──────────────────────────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────────────────┐
│ 📆 DIA 01/FEVEREIRO - FECHAMENTO                    │
├──────────────────────────────────────────────────────┤
│                                                      │
│ 🤖 Sistema automático verifica TUDO às 03:00 da     │
│    madrugada (você está dormindo):                  │
│                                                      │
│ ✅ Os 5 clientes estão ativos?                      │
│ ✅ Os pagamentos foram confirmados?                 │
│ ✅ Ninguém cancelou?                                │
│ ✅ Você está ativo no programa?                     │
│                                                      │
│ Tudo OK! ✅                                          │
│                                                      │
│ Sistema APROVA suas comissões:                      │
│ Status: "Calculada" → "Aprovada" ✅                 │
│                                                      │
│ Você recebe notificação no celular:                 │
│ 📱 "Suas comissões de Jan/2025 foram aprovadas!     │
│     Total: R$ 649,08                                │
│     Pagamento previsto: 25/Fev/2025"               │
└──────────────────────────────────────────────────────┘
         │
         │ Aguarda até dia 25...
         │
         ▼
┌──────────────────────────────────────────────────────┐
│ 📆 DIAS 02 a 24/FEVEREIRO - AGUARDANDO              │
├──────────────────────────────────────────────────────┤
│                                                      │
│ Suas comissões estão aprovadas, mas ainda não       │
│ foram pagas.                                        │
│                                                      │
│ No app você vê:                                     │
│ • Comissões de Jan/2025: R$ 649,08                  │
│ • Status: Aprovada                                  │
│ • Previsão de pagamento: 25/Fev/2025                │
│                                                      │
│ Enquanto isso, você continua trabalhando e          │
│ captando clientes em Fevereiro...                   │
└──────────────────────────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────────────────┐
│ 📆 DIA 25/FEVEREIRO - DIA DO PAGAMENTO! 💸          │
├──────────────────────────────────────────────────────┤
│                                                      │
│ 🤖 Sistema automático às 03:00 da madrugada:        │
│                                                      │
│ 1. Verifica se você tem pelo menos R$ 100           │
│    ✅ Você tem R$ 649,08 (muito acima!)             │
│                                                      │
│ 2. Verifica se você conectou sua conta Stripe       │
│    ✅ Conectada!                                     │
│                                                      │
│ 3. Sistema ENVIA o dinheiro via Stripe:             │
│    R$ 649,08 da conta Lovable → Sua conta Stripe    │
│                                                      │
│ 4. Atualiza status:                                 │
│    "Aprovada" → "Paga" ✅                           │
│                                                      │
│ Você recebe notificação:                            │
│ 📱 "Pagamento realizado: R$ 649,08                  │
│     O dinheiro chegará em 2-3 dias úteis"          │
└──────────────────────────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────────────────┐
│ 📆 DIA 27/FEVEREIRO - DINHEIRO NA CONTA! 🎉         │
├──────────────────────────────────────────────────────┤
│                                                      │
│ Stripe transfere automaticamente para sua conta     │
│ bancária:                                           │
│                                                      │
│ Você vê no extrato do banco:                        │
│ "PIX Recebido - Stripe                              │
│  R$ 649,08"                                         │
│                                                      │
│ ✅ DINHEIRO NA SUA CONTA! 💰                         │
│                                                      │
│ E o ciclo recomeça para Fevereiro/2025...           │
└──────────────────────────────────────────────────────┘
```

---

## 🎯 REGRAS IMPORTANTES

### **1. Quanto você recebe?**

**No 1º pagamento do cliente (Bônus Ativação):**
- Você recebe **100%** do que sobra depois da taxa do Stripe
- Exemplo: Cliente paga R$ 130 → Stripe cobra R$ 4,07 → Você recebe R$ 125,93

**Nos meses seguintes (Comissão Recorrente):**
- Depende do seu nível:
  - 🥉 Bronze (1-4 clientes): **15%**
  - 🥈 Prata (5-9 clientes): **17,5%**
  - 🥇 Ouro (10-14 clientes): **20%**
  - 💎 Diamante (15+ clientes): **20%**

---

### **2. Quando você recebe?**

**SEMPRE no dia 25** do mês seguinte.

Exemplos:
- Captou clientes em Janeiro? → Recebe dia **25 de Fevereiro**
- Captou clientes em Fevereiro? → Recebe dia **25 de Março**
- Captou clientes em Março? → Recebe dia **25 de Abril**

---

### **3. Valor mínimo**

Você só recebe se tiver **pelo menos R$ 100** acumulado.

**Exemplo 1 - Recebe:**
- Janeiro: R$ 120
- ✅ Recebe R$ 120 no dia 25/Fev

**Exemplo 2 - Acumula:**
- Janeiro: R$ 89 (menos que R$ 100)
- ❌ Não recebe em Fevereiro, acumula para Março
- Fevereiro: R$ 120
- Total acumulado: R$ 89 + R$ 120 = R$ 209
- ✅ Recebe R$ 209 no dia 25/Março

---

### **4. Como conectar sua conta para receber?**

**Passo a passo (2 minutos):**

1. Entre no Portal Lovable-Celite
2. Vá em "Configurações" ou "Perfil"
3. Clique em "Conectar Conta para Receber"
4. Preencha:
   - CPF ou CNPJ
   - Nome completo
   - Telefone
   - Endereço
   - Dados bancários (banco, agência, conta)
5. Pronto! ✅

Você só faz isso **UMA VEZ**. Depois, todos os pagamentos caem automaticamente.

---

## ❓ PERGUNTAS FREQUENTES

### **"Quando posso ver minhas comissões no app?"**
**Imediatamente!** Assim que o cliente paga, a comissão já aparece no seu dashboard.

### **"Posso pedir para receber antes do dia 25?"**
**Não.** O pagamento é sempre no dia 25 para todos os contadores.

### **"E se eu não tiver R$ 100?"**
O sistema **acumula automaticamente** para o mês seguinte. Você não perde nada!

### **"O que acontece se o cliente cancelar?"**
Se o cliente cancelar **antes do dia 1º** (fechamento), a comissão é cancelada. Se cancelar **depois**, você já recebe normalmente.

### **"Como sei que o dinheiro vai cair na minha conta?"**
Você recebe **3 notificações**:
1. Dia 1º: "Comissões aprovadas"
2. Dia 25: "Pagamento realizado"
3. Dia 27-28: "Dinheiro depositado" (confirmação do banco)

---

## 📊 EXEMPLO COMPLETO DE 3 MESES

```
MÊS 1 - JANEIRO
├─ Captou 3 clientes
├─ Total: R$ 348,67
├─ 01/Fev: Aprovado
└─ 25/Fev: Recebe R$ 348,67 ✅

MÊS 2 - FEVEREIRO  
├─ Captou 2 clientes
├─ Total: R$ 222,74
├─ 01/Mar: Aprovado
└─ 25/Mar: Recebe R$ 222,74 ✅

MÊS 3 - MARÇO
├─ Captou 5 clientes (virou Prata! 🥈)
├─ Total: R$ 649,08
├─ BONUS: Seus clientes antigos agora pagam 17,5%!
├─ 01/Abr: Aprovado
└─ 25/Abr: Recebe R$ 649,08 + comissões retroativas ✅
```

---

## 🎯 RESUMO EM 3 PASSOS

1. **Você indica clientes** → Sistema calcula comissão na hora
2. **Dia 1º do mês seguinte** → Sistema aprova automaticamente
3. **Dia 25 do mês seguinte** → Dinheiro cai na sua conta 💰

**Simples assim!** 🚀

---

## 💡 DICA PRO

Quanto mais clientes você captar, mais você ganha E mais rápido sobe de nível!

- 5 clientes = Prata 🥈 = 17,5% recorrente + Bônus R$ 100
- 10 clientes = Ouro 🥇 = 20% recorrente + Bônus R$ 100
- 15 clientes = Diamante 💎 = 20% recorrente + Bônus R$ 100 + **1 lead grátis/mês**

E o melhor: quando você sobe de nível, **TODOS os seus clientes antigos** passam a pagar a nova comissão retroativamente!

---

**Dúvidas?** Fale com nosso suporte pelo WhatsApp ou dentro do app! 📱

