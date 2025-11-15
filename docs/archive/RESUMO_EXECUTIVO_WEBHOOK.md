# ⚡ RESUMO EXECUTIVO - O Que Está Acontecendo

**Versão**: Executiva (5 minutos de leitura)
**Data**: 14 de Novembro, 2025
**Status**: 🔴 CRÍTICO - Webhook ASAAS não funciona

---

## 🎯 VISÃO GERAL

Você tem um **sistema de comissões** que deveria funcionar assim:

```
1. Cliente paga no Asaas
        ↓
2. Asaas envia WEBHOOK para seu servidor
        ↓
3. Seu servidor processa e calcula COMISSÕES
        ↓
4. Contadores recebem SAQUES
```

**Problema**: Passo 3 está quebrado. Webhooks chegam mas **FALHAM**.

---

## 🔴 8 Problemas Encontrados

### 1️⃣ **Assinatura NUNCA é validada** (CRÍTICO - Segurança)

- Qualquer um pode enviar webhook fake
- Comissões podem ser criadas fraudulentamente

**Status**: ❌ Código permite qualquer assinatura

**Solução**: 2 linhas de código

---

### 2️⃣ **Campo `netValue` pode ser NULL** (CRÍTICO - Confiabilidade)

- Se Asaas não envia este campo, tudo falha
- Erro genérico: "Erro desconhecido"

**Status**: ❌ Sem tratamento

**Solução**: Usar fallback para `value` se `netValue` = null

---

### 3️⃣ **Eventos "unknown" não são mapeados** (CRÍTICO)

- Asaas envia `event: "unknown"` em alguns webhooks
- Código não reconhece e falha silenciosamente

**Status**: ❌ Sem tratamento específico

**Solução**: Mapear eventos ou usar fallback

---

### 4️⃣ **MD5 não funciona em Deno** (CRÍTICO - Técnico)

- Tentam usar `crypto.subtle.digest('MD5')`
- Deno só suporta SHA-256, SHA-512
- MD5 não existe no WebCrypto

**Status**: ❌ Sempre falha no cálculo

**Solução**: Usar Node.js crypto polyfill do Deno

---

### 5️⃣ **Cliente pode não existir no BD** (CRÍTICO - Lógica)

- Se cliente não foi criado ANTES do webhook, tudo falha
- Webhook retorna 404

**Status**: ⚠️ Código está certo, mas ordem de execução pode estar errada

**Solução**: Confirmar que cliente existe antes de criar pagamento

---

### 6️⃣ **Sem logging detalhado** (CRÍTICO - Debug)

- Erro diz: "Erro desconhecido"
- Sem saber QUAL validação falhou
- "Atirando no escuro" (do diagnóstico original)

**Status**: ❌ Logs muito genéricos

**Solução**: Adicionar logs antes de cada validação crítica

---

### 7️⃣ **Comissões presas em "calculada"** (IMPORTANTE - Negócio)

- Webhook cria comissões com `status = 'calculada'`
- CRON processa APENAS `status = 'aprovada'`
- **Ninguém muda para "aprovada"**
- Resultado: Comissões NUNCA são pagas

**Status**: ❌ Gap crítico no fluxo

**Solução**: Auto-aprovar comissões OU criar interface de aprovação manual

---

### 8️⃣ **API Keys hardcoded em scripts** (IMPORTANTE - Segurança)

- API Key do Asaas está em arquivo `.mjs` no Git
- Exposto em repositório público
- Risco: Alguém usa a chave para criar cobranças fake

**Status**: ❌ Secrets vazados

**Solução**: Mover para Supabase Secrets

---

## 📊 Impacto Atual

| Métrica | Valor | Impacto |
|---------|-------|--------|
| **Webhooks recebidos** | ✅ Sim | OK |
| **Webhooks processados** | ❌ 0% | CRÍTICO |
| **Pagamentos registrados** | ❌ 0% | CRÍTICO |
| **Comissões calculadas** | ❌ 0% | CRÍTICO |
| **Contadores pagos** | ❌ 0% | CRÍTICO |
| **Segurança** | ❌ Baixa | CRÍTICO |

---

## 💡 O Que Está Bom

✅ **Arquitetura**: Correta, bem estruturada
✅ **Idempotência**: Implementada corretamente
✅ **RPC Transacional**: Funciona bem
✅ **CRON Job**: Configurado corretamente
✅ **Aprovação**: Estrutura pronta (migration existe)

---

## 🛠️ O Que Precisa Ser Feito

### Prioridade 1 (CRÍTICO):

1. ✏️ Habilitar validação de assinatura
2. ✏️ Tratar netValue = null com fallback
3. ✏️ Adicionar logging detalhado
4. ✏️ Usar Node.js crypto para MD5
5. ✏️ Auto-aprovação de comissões (ou criar interface manual)

### Prioridade 2 (IMPORTANTE):

6. ✏️ Remover API Keys de scripts
7. ✏️ Testar E2E
8. ✏️ Configurar webhook em Asaas

---

## ⏱️ Tempo Estimado

| Tarefa | Tempo | Dificuldade |
|--------|-------|-------------|
| Análise (já feita) | ✅ 2h | Média |
| Implementação Crítica | 2-3h | Baixa |
| Testes Locais | 1-2h | Média |
| Testes Produção | 2-4h | Média |
| **TOTAL** | **7-11h** | - |

---

## 📋 Próximos Passos

### Hoje:
1. Leia: `ANALISE_COMPLETA_WEBHOOK_ASAAS_DIAGNOSTICO.md`
2. Leia: `GUIA_PRATICO_CORRECAO_WEBHOOK.md`

### Amanhã:
1. Implemente as 5 correções críticas
2. Teste localmente
3. Deploy em produção

### Próxima Semana:
1. Teste E2E em produção
2. Monitore logs por 24-48h
3. Declare "pronto para produção"

---

## 🎓 Entender o Fluxo

```
┌─────────────────────────────────────────────────────────┐
│                      ASAAS (Banco)                       │
│                                                          │
│  1. Cliente paga (PIX/Boleto/Cartão)                   │
│  2. Status: PENDING → RECEIVED                          │
│  3. 🚀 Dispara WEBHOOK HTTP POST                        │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│              SEU SERVIDOR (Supabase)                     │
│                                                          │
│  webhook-asaas/index.ts:                               │
│  - Recebe POST do Asaas                                │
│  - Valida assinatura MD5 ← ⚠️ QUEBRADO                 │
│  - Valida campos (value, netValue) ← ⚠️ QUEBRADO       │
│  - Busca cliente no BD ← ⚠️ Pode não existir           │
│  - INSERT pagamentos                                   │
│  - Chama calcular-comissoes                            │
│      ↓                                                  │
│  calcular-comissoes/index.ts:                          │
│  - Calcula comissão direta (% ou 100%)                 │
│  - Calcula override (sponsor)                          │
│  - Calcula bônus (progressão, volume, contador)        │
│  - Chama RPC executar_calculo_comissoes                │
│      ↓                                                  │
│  RPC (transação ATOMIC):                               │
│  - INSERT comissoes { status = 'calculada' }           │
│  - INSERT bonus_historico                              │
│  - INSERT comissoes_calculo_log ← ⚠️ Nunca aprovado    │
│                                                          │
│  ❌ PARA AQUI - Comissões presas em 'calculada'        │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│          CRON (Dia 25 do Mês)                           │
│                                                          │
│  cron_processar_pagamento_comissoes():                 │
│  - Procura: status = 'aprovada' ← NÃO ACHA!           │
│  - Se total >= R$100: UPDATE status = 'paga'          │
│  - RESULTADO: Nada acontece                            │
└─────────────────────────────────────────────────────────┘
```

---

## 📞 Contato ASAAS (Se Precisar)

Quando você precisar verificar detalhes técnicos:

- **URL da Documentação**: https://docs.asaas.com
- **Discord Comunidade**: https://discord.gg/invite/X2kgZm69HV
- **Status Page**: https://status.asaas.com/

---

## ✅ Conclusão

**Resumido**:
- Webhook chega, mas falha no processamento
- 8 problemas (6 críticos, 2 importantes)
- Solução: 2-3 horas de desenvolvimento
- Resultado: ✅ Sistema 100% funcional

**Confiança**: Alta - problemas bem identificados, soluções claras

---

**Próximo passo**: Leia `GUIA_PRATICO_CORRECAO_WEBHOOK.md` e comece a implementar!
