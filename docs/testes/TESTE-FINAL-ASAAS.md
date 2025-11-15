# 🎯 TESTE FINAL - INTEGRAÇÃO ASAAS (PASSO A PASSO AUTOMÁTICO)

**Objetivo:** Validar fluxo completo: ASAAS → Webhook → Pagamento → Comissões

---

## ⚠️ PARTE 1: VOCÊ PRECISA FAZER (3 minutos)

### AÇÃO 1: Criar Cobrança no ASAAS Sandbox

**1.** Acesse: https://sandbox.asaas.com

**2.** Login com suas credenciais

**3.** Menu lateral → **Cobranças** → Botão **"Nova Cobrança"**

**4.** Preencha EXATAMENTE assim:

```
┌─────────────────────────────────────────┐
│ NOVA COBRANÇA                           │
├─────────────────────────────────────────┤
│ Cliente:                                │
│   [Digite: cus_000007222099]            │
│   (Se não aparecer, crie cliente novo)  │
│                                         │
│ Valor:                                  │
│   R$ 199,90                             │
│                                         │
│ Vencimento:                             │
│   15/11/2025 (hoje)                     │
│                                         │
│ Forma de pagamento:                     │
│   ( ) Boleto                            │
│   (•) PIX  ← SELECIONE ISTO             │
│   ( ) Cartão                            │
│                                         │
│ Descrição (opcional):                   │
│   Teste integração webhook Supabase     │
│                                         │
│         [Cancelar]    [Criar]           │
└─────────────────────────────────────────┘
```

**5.** Clique em **"Criar"**

---

### AÇÃO 2: Marcar Cobrança como Recebida

**1.** Assim que criar, você verá a tela da cobrança

**2.** Procure por botão **"Recebido"** ou **"Confirmar Recebimento"**

**3.** Clique para **marcar como recebida** (simula pagamento)

**4.** **COPIE o ID da cobrança** (formato: `pay_xxxxxxxxxx`)

---

### AÇÃO 3: Verificar Logs do Webhook no ASAAS

**1.** Menu ASAAS → **Configurações** → **Webhooks**

**2.** Procure pelo webhook configurado:
```
URL: https://zytxwdgzjqrcmbnpgofj.supabase.co/functions/v1/webhook-asaas
```

**3.** Clique para ver **"Logs de envio"** ou **"Histórico"**

**4.** Procure pelo evento mais recente (tipo: `PAYMENT_RECEIVED`)

**5.** **COPIE estas informações:**
```
Status HTTP: ___
Resposta: { ... }
Horário: ___
```

---

## 🤖 PARTE 2: VERIFICAÇÃO AUTOMÁTICA (EU FAÇO)

Depois que você fizer as 3 ações acima, **COLE AQUI OS DADOS:**

```
ID da cobrança ASAAS: pay_______________
Status HTTP do webhook: ___
Resposta do webhook:
{
  ...
}
```

**Então EU vou executar automaticamente:**

1. ✅ Query para verificar pagamento no banco
2. ✅ Query para verificar comissões calculadas
3. ✅ Query para verificar audit logs
4. ✅ Análise completa dos resultados
5. ✅ Relatório final de sucesso/erro

---

## 📋 CHECKLIST PARA VOCÊ

Antes de me passar os dados, confirme:

- [ ] Criei cobrança no ASAAS Sandbox
- [ ] Marquei como "Recebida"
- [ ] Copiei ID da cobrança (pay_xxx)
- [ ] Verifiquei logs de webhook no ASAAS
- [ ] Copiei status HTTP e resposta

---

## 🎯 RESULTADOS ESPERADOS

### Se tudo funcionar ✅

**ASAAS Webhook:**
```json
HTTP 200
{
  "success": true,
  "pagamento_id": "uuid-aqui",
  "comissoes_calculadas": true
}
```

**Banco de Dados:**
- ✅ 1 pagamento criado em `pagamentos`
- ✅ Múltiplas comissões em `comissoes` (ativação + overrides)
- ✅ Audit log registrado

---

## ⚠️ Se der erro ❌

**ASAAS Webhook:**
```json
HTTP 404/500
{
  "error": "Cliente não encontrado"
}
```

**Neste caso:**
- Vou verificar qual erro específico
- Vou criar o cliente automaticamente
- Vou pedir para repetir o teste

---

## 🚀 PRONTO PARA COMEÇAR?

**EXECUTE AS 3 AÇÕES** da Parte 1 e me passe:

1. ID da cobrança
2. Status HTTP do webhook
3. Resposta do webhook

**EU faço o resto automaticamente!** 🤖

---

**Data:** 2025-11-15
**Status:** Aguardando execução usuário
