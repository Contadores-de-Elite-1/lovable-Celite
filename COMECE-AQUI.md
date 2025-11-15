# ⚡ COMECE AQUI - TESTE WEBHOOK V3.0

**🎯 Objetivo:** Testar webhook ASAAS → Supabase em 5 minutos

---

## 📋 MÉTODO 1: Manual no ASAAS (RECOMENDADO)

**Siga este guia passo a passo:**

📖 **[docs/testes/INSTRUCOES-MANUAIS-ASAAS.md](docs/testes/INSTRUCOES-MANUAIS-ASAAS.md)**

**Resumo:**
1. Login ASAAS Sandbox
2. Criar cobrança (cliente cus_000007222099, R$ 199,90, PIX)
3. Marcar como recebida
4. Copiar Payment ID
5. Aguardar 15 segundos
6. Executar: `node scripts/verificar-resultado.js PAY_ID`

---

## 🔍 MÉTODO 2: Verificar Logs Diretamente

Se já criou cobrança e quer só verificar:

```bash
# Ver últimos pagamentos
node scripts/verificar-resultado.js pay_SEU_ID_AQUI
```

**Ou execute query SQL:**

https://supabase.com/dashboard/project/zytxwdgzjqrcmbnpgofj

SQL Editor → Copie queries de:
`docs/testes/queries-verificacao-automatica.sql`

---

## 📚 DOCUMENTAÇÃO COMPLETA

| Documento | Descrição |
|-----------|-----------|
| **[INSTRUCOES-MANUAIS-ASAAS.md](docs/testes/INSTRUCOES-MANUAIS-ASAAS.md)** | ⭐ Passo a passo criar cobrança |
| **[WEBHOOK-V3-CHANGELOG.md](docs/WEBHOOK-V3-CHANGELOG.md)** | Changelog completo V3.0 |
| **[MODO-ROBO-FINAL.md](docs/MODO-ROBO-FINAL.md)** | Guia modo robô completo |
| **[queries-verificacao-automatica.sql](docs/testes/queries-verificacao-automatica.sql)** | Queries SQL prontas |

---

## 🚀 WEBHOOK V3.0 - O QUE FAZ

✅ **Auto-cria clientes** quando recebe pagamento do ASAAS
✅ **3 formas de vincular contador** (link indicação, externalReference)
✅ **Atualiza vínculo** quando cliente muda de contador
✅ **Calcula comissões** automaticamente
✅ **Logs detalhados** para debugging

---

## 🔗 LINKS ÚTEIS

- **Supabase Dashboard:** https://supabase.com/dashboard/project/zytxwdgzjqrcmbnpgofj
- **Edge Function Logs:** https://supabase.com/dashboard/project/zytxwdgzjqrcmbnpgofj/functions/webhook-asaas/logs
- **ASAAS Sandbox:** https://sandbox.asaas.com

---

## 💡 PRECISA DE AJUDA?

Execute o teste e me passe:
1. Payment ID criado
2. Resultado do script verificar-resultado.js
3. Ou resultado da query SQL

Eu analiso e digo se está funcionando! 🤖

---

**🤖 Sistema pronto para produção!**
**📖 Comece pelo: INSTRUCOES-MANUAIS-ASAAS.md**
