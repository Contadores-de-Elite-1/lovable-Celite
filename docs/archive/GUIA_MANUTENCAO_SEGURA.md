# 🛡️ GUIA DE MANUTENÇÃO SEGURA - Sistema de Comissões

## ⚠️ ATENÇÃO CRÍTICA

Este sistema gerencia **pagamentos financeiros reais** para parceiros e contadores. Qualquer erro pode resultar em:
- ❌ Perda de pagamentos (problemas jurídicos)
- ❌ Pagamentos duplicados (prejuízo financeiro)
- ❌ Quebra de confiança com parceiros
- ❌ Risco de falência da empresa

**NUNCA faça alterações sem seguir este guia.**

---

## 🚫 O QUE VOCÊ NUNCA DEVE FAZER

### 1. ❌ NUNCA Desabilitar CRONs Sem Análise Completa

**CRONs Críticos (NÃO PODEM SER DESABILITADOS):**

| CRON Job | Schedule | Função | Impacto se Desabilitado |
|----------|----------|--------|------------------------|
| `processar-pagamentos-dia-25` | 25/mês às 09:00 | Processa pagamento de comissões mensais | ❌ Nenhum contador recebe pagamento |
| `verificar-bonus-ltv` | 1º/mês às 10:00 | Calcula Bônus LTV (Regras 14-16) | ❌ Zero bônus LTV pagos = PROBLEMA JURÍDICO |

**Como verificar CRONs ativos:**
```sql
SELECT jobname, schedule, active, jobid 
FROM cron.job 
ORDER BY jobname;
```

**Se precisar REALMENTE desabilitar um CRON:**
1. Leia COMPLETAMENTE `FLUXO_COMISSOES.md`
2. Consulte stakeholders (jurídico, financeiro, produto)
3. Prepare plano de rollback
4. Documente motivo detalhadamente
5. Monitore logs por 48h após alteração

---

### 2. ❌ NUNCA Altere Lógica de Cálculo Sem Testes Completos

**Arquivos Críticos (Testagem Obrigatória):**
- `supabase/functions/calcular-comissoes/index.ts`
- `supabase/functions/verificar-bonus-ltv/index.ts`
- `supabase/functions/processar-pagamento-comissoes/index.ts`
- `supabase/functions/webhook-asaas/index.ts`

**Antes de qualquer alteração:**
1. Crie backup do arquivo original
2. Documente EXATAMENTE o que será alterado
3. Execute testes em ambiente de staging
4. Valide com dados reais de meses anteriores
5. Peça revisão de código de 2+ pessoas

---

### 3. ❌ NUNCA Delete Dados de Produção Sem Backup

**Tabelas Críticas (SOMENTE LEITURA EM PRODUÇÃO):**
- `comissoes` - Histórico completo de comissões
- `bonus_historico` - Histórico completo de bônus
- `pagamentos` - Pagamentos confirmados da Asaas
- `audit_logs` - Trilha de auditoria
- `comissoes_status_historico` - Mudanças de status

**Se precisar corrigir dados:**
```sql
-- ✅ CORRETO: Criar nova entrada corretiva
INSERT INTO comissoes (...) VALUES (...);

-- ❌ ERRADO: Deletar ou alterar registros históricos
-- DELETE FROM comissoes WHERE ...;
-- UPDATE comissoes SET valor = ... WHERE status = 'paga';
```

---

### 4. ❌ NUNCA Ignore Logs de Erro em Produção

**Logs Críticos para Monitorar:**

| Edge Function | Link | O que Monitorar |
|---------------|------|-----------------|
| `webhook-asaas` | [Logs](https://supabase.com/dashboard/project/zytxwdgzjqrcmbnpgofj/functions/webhook-asaas/logs) | Erros de processamento de pagamentos |
| `calcular-comissoes` | [Logs](https://supabase.com/dashboard/project/zytxwdgzjqrcmbnpgofj/functions/calcular-comissoes/logs) | Erros de cálculo de comissões |
| `verificar-bonus-ltv` | [Logs](https://supabase.com/dashboard/project/zytxwdgzjqrcmbnpgofj/functions/verificar-bonus-ltv/logs) | Falta de bônus LTV sendo criados |
| `processar-pagamento-comissoes` | [Logs](https://supabase.com/dashboard/project/zytxwdgzjqrcmbnpgofj/functions/processar-pagamento-comissoes/logs) | Falhas em pagamentos mensais |

**Frequência de Monitoramento:**
- ✅ Diariamente: Logs de `webhook-asaas`
- ✅ Dia 1º: Logs de `verificar-bonus-ltv`
- ✅ Dia 25: Logs de `processar-pagamento-comissoes`

---

## ✅ CHECKLIST PRÉ-ALTERAÇÃO

Antes de qualquer mudança no sistema de comissões, preencha:

```markdown
## Checklist de Segurança

- [ ] Li completamente `FLUXO_COMISSOES.md`
- [ ] Entendo o impacto financeiro da alteração
- [ ] Criei backup dos arquivos que vou alterar
- [ ] Testei em ambiente de staging
- [ ] Validei com dados de meses anteriores
- [ ] Documentei o motivo da alteração
- [ ] Preparei plano de rollback
- [ ] Consultei stakeholders (se necessário)
- [ ] Agendei monitoramento pós-deploy
- [ ] Revisei este guia completamente

**Alteração proposta:**
[Descreva aqui]

**Impacto esperado:**
[Descreva aqui]

**Plano de rollback:**
[Descreva aqui]
```

---

## 🔍 COMANDOS SQL DE VALIDAÇÃO

### Verificar Integridade do Sistema

```sql
-- 1. Verificar CRONs ativos
SELECT jobname, schedule, active, jobid 
FROM cron.job 
ORDER BY jobname;

-- Resultado esperado: 2 CRONs ativos
-- - processar-pagamentos-dia-25
-- - verificar-bonus-ltv

-- 2. Verificar comissões pendentes (próximo ciclo de pagamento)
SELECT 
  status,
  COUNT(*) as quantidade,
  SUM(valor) as total
FROM comissoes
WHERE competencia >= DATE_TRUNC('month', CURRENT_DATE)
GROUP BY status;

-- 3. Verificar grupos elegíveis para LTV (próximo ciclo)
SELECT 
  contador_id,
  TO_CHAR(data_ativacao, 'YYYY-MM') as mes_grupo,
  COUNT(*) FILTER (WHERE status = 'ativo') as ativos,
  COUNT(*) as total,
  CASE 
    WHEN COUNT(*) FILTER (WHERE status = 'ativo') BETWEEN 5 AND 9 THEN '15%'
    WHEN COUNT(*) FILTER (WHERE status = 'ativo') BETWEEN 10 AND 14 THEN '30%'
    WHEN COUNT(*) FILTER (WHERE status = 'ativo') >= 15 THEN '50%'
    ELSE 'Não elegível'
  END as faixa_bonus
FROM clientes
WHERE data_ativacao >= CURRENT_DATE - INTERVAL '13 months'
  AND data_ativacao < CURRENT_DATE - INTERVAL '12 months'
GROUP BY contador_id, mes_grupo
HAVING COUNT(*) FILTER (WHERE status = 'ativo') >= 5;

-- 4. Detectar bônus LTV duplicados (NÃO DEVE RETORNAR NADA)
SELECT 
  contador_id,
  observacao,
  COUNT(*) as vezes_pago,
  ARRAY_AGG(id) as bonus_ids
FROM bonus_historico
WHERE tipo_bonus = 'bonus_ltv'
GROUP BY contador_id, observacao
HAVING COUNT(*) > 1;

-- Se retornar linhas: PROBLEMA! Investigar imediatamente.

-- 5. Verificar pagamentos Asaas não processados
SELECT 
  id,
  cliente_id,
  valor_bruto,
  competencia,
  status,
  created_at
FROM pagamentos
WHERE status = 'pending'
  AND created_at < CURRENT_DATE - INTERVAL '7 days';

-- Se retornar linhas: Verificar webhook-asaas

-- 6. Verificar comissões sem pagamento há mais de 60 dias
SELECT 
  c.id,
  c.contador_id,
  c.tipo,
  c.valor,
  c.competencia,
  c.status,
  c.created_at
FROM comissoes c
WHERE c.status IN ('calculada', 'aprovada')
  AND c.created_at < CURRENT_DATE - INTERVAL '60 days'
ORDER BY c.created_at ASC;

-- Se retornar linhas: Verificar processamento de pagamentos
```

---

## 🔄 PLANO DE ROLLBACK PADRÃO

Se algo der errado após uma alteração:

### 1. Imediatamente
```bash
# Reverter arquivos alterados (se usando Git)
git revert <commit-hash>
git push origin main
```

### 2. Comunicar Stakeholders
- Notificar equipe técnica
- Notificar financeiro/jurídico se afeta pagamentos
- Documentar incidente

### 3. Analisar Impacto
```sql
-- Verificar comissões afetadas
SELECT * FROM audit_logs 
WHERE created_at >= '<data-hora-deploy>'
ORDER BY created_at DESC;

-- Verificar bônus criados após deploy
SELECT * FROM bonus_historico
WHERE conquistado_em >= '<data-hora-deploy>';

-- Verificar comissões criadas após deploy
SELECT * FROM comissoes
WHERE created_at >= '<data-hora-deploy>';
```

### 4. Correção Manual (se necessário)
- Consultar backups
- Criar registros corretivos
- Documentar TUDO

---

## 📊 MONITORAMENTO CONTÍNUO

### Dashboards Essenciais

**1. Dashboard Financeiro (Revisar Semanalmente):**
```sql
-- Total de comissões por status
SELECT 
  status,
  COUNT(*) as quantidade,
  SUM(valor) as total_valor,
  MIN(competencia) as primeira_competencia,
  MAX(competencia) as ultima_competencia
FROM comissoes
GROUP BY status;

-- Total de bônus LTV pagos por mês
SELECT 
  TO_CHAR(competencia, 'YYYY-MM') as mes,
  COUNT(*) as quantidade_bonus,
  SUM(valor) as total_pago
FROM bonus_historico
WHERE tipo_bonus = 'bonus_ltv'
GROUP BY mes
ORDER BY mes DESC;
```

**2. Alertas Automáticos (Configurar no Supabase):**
- ⚠️ Se `processar-pagamento-comissoes` falhar
- ⚠️ Se `verificar-bonus-ltv` não criar nenhum bônus (quando deveria)
- ⚠️ Se houver duplicação de bônus LTV
- ⚠️ Se `webhook-asaas` tiver taxa de erro > 5%

---

## 📞 CONTATOS DE EMERGÊNCIA

**Em caso de problemas críticos:**

1. **Técnico:** [Nome/Email do Dev Lead]
2. **Financeiro:** [Nome/Email do Financeiro]
3. **Jurídico:** [Nome/Email do Jurídico]
4. **Supabase Support:** https://supabase.com/dashboard/support/new

---

## 📚 DOCUMENTAÇÃO DE REFERÊNCIA

| Documento | Propósito |
|-----------|-----------|
| `FLUXO_COMISSOES.md` | Regras completas do sistema de comissões |
| `CONFIGURAR_CRON_LTV.md` | Configuração do CRON de LTV |
| `GUIA_TESTE_COMISSOES.md` | Como testar comissões em staging |
| `ENUM_CRITICAL_VALUES.md` | Valores ENUM críticos do sistema |

---

## ✅ ÚLTIMA ATUALIZAÇÃO

- **Data:** 2025-01-XX
- **Autor:** [Seu Nome]
- **Versão:** 1.0
- **Próxima Revisão:** [Data]

---

**🛡️ LEMBRE-SE:** Em caso de dúvida, sempre consulte este guia e peça segunda opinião antes de alterar qualquer código crítico relacionado a comissões e pagamentos.
