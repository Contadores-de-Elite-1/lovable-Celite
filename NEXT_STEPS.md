# 📋 Next Steps - Roadmap de Produção

## 🎯 Status Atual
**Versão**: Production Ready v1
**Data**: Nov 14, 2025
**Branch**: `claude/fix-production-blockers-01SVbHYWsADE4oGDf8PWnAxh`
**Testes**: 12/12 ✅ PASS

---

## ✅ O Que Foi Feito (Hoje)

### Bloqueadores Críticos Resolvidos
1. ✅ **Login não funcionava** → Adicionado trigger que cria contadores record
2. ✅ **Saques sempre falhavam** → RLS policy corrigida (get_contador_id)
3. ✅ **Comissões nunca aprovadas** → Auto-aprovação após 24h implementada
4. ✅ **Webhook aceitava pagamentos falsos** → Validação de assinatura forçada
5. ✅ **UX confusa no perfil** → Validação clara de PIX ou dados bancários

### Testes Adicionados
- ✅ Smoke test completo (12 checks)
- ✅ Validação de build, TypeScript, migrations, RLS, security
- ✅ Pronto para rodar antes de cada deploy

---

## 🚀 Próximos Passos (Por Prioridade)

### FASE 1: Deploy para Produção (Prox. 1-2 dias)

#### 1. Deploy das Migrations
```bash
# 1. Push para Supabase production
supabase db push --linked

# Esperado: Todas as 3 novas migrations aplicadas
# - handle_new_user trigger (criar contadores)
# - solicitacoes_saque RLS (get_contador_id)
# - auto_aprovar_comissoes function

# 2. Verificar que trigger funciona
SELECT * FROM contadores WHERE created_at > now() - INTERVAL '1 hour';
```

#### 2. Deploy da Função Webhook (Critical)
```bash
# Setup environment variable FIRST
export ASAAS_WEBHOOK_SECRET="seu-secret-aqui"

# Deploy
supabase functions deploy webhook-asaas

# Test
curl -X POST http://localhost:54321/functions/v1/webhook-asaas \
  -H "Content-Type: application/json" \
  -d '{"event":"payment.created"}'
# Esperado: 400 (bad signature) - NÃO 200 (unsigned accepted)
```

#### 3. Deploy Frontend
```bash
# Build deve passar
npm run build  # ✅ 13.77s

# Deploy dist/ para production
# (Vercel, Netlify, ou seu host)
```

---

### FASE 2: Validação em Produção (1-2 dias depois)

#### Checklist de Validação Manual

```
🧪 User Signup Flow
[ ] Ir para app.com
[ ] Sign up com email novo
[ ] Verificar email de confirmação
[ ] Login com credenciais novas
[ ] Ver dashboard → Deve mostrar contador_id na console
[ ] Ir para /perfil
[ ] Adicionar PIX ou dados bancários
[ ] Salvar → Deve funcionar sem erro RLS

🧪 Commission Flow
[ ] Criar cliente fake no Asaas (sandbox)
[ ] Assinar subscription
[ ] Esperar webhook: Deve ver entrada em webhook_logs
[ ] Verificar comissoes table: status = 'calculada'
[ ] Esperar 24h (ou forçar em DB)
[ ] Verificar: status muda para 'aprovada'
[ ] Ver saldo em dashboard aumentou

🧪 Withdrawal Flow
[ ] Dashboard → Solicitar Saque
[ ] Ver modal de confirmação
[ ] Confirmar → Deve gravar em solicitacoes_saque
[ ] Admin vê em /auditoria-comissoes
[ ] Não deve ter erro RLS

🧪 Webhook Security
[ ] Tentar enviar POST para /webhook-asaas SEM assinatura
[ ] Deve retornar 401/403 NÃO 200
[ ] Checar supabase logs: deve ter erro sobre secret
```

---

### FASE 3: Automação & Cron Jobs (Day 3-4)

#### Implementar Auto-Aprovação Diária
A função `auto_aprovar_comissoes()` foi criada mas precisa ser agendada.

**Opção A: Supabase CRON (Recomendado)**
```sql
-- Criar job que roda todo dia às 2 AM
SELECT cron.schedule(
  'auto_approve_commissions',
  '0 2 * * *',  -- 2 AM todo dia
  $$
  SELECT auto_aprovar_comissoes();
  $$
);

-- Verificar se rodou
SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 5;
```

**Opção B: GitHub Actions (Se não tiver Supabase CRON)**
```yaml
# .github/workflows/cron-auto-approve.yml
name: Auto-Approve Commissions
on:
  schedule:
    - cron: '0 2 * * *'  # 2 AM UTC
jobs:
  auto-approve:
    runs-on: ubuntu-latest
    steps:
      - name: Auto-approve commissions
        run: |
          curl -X POST https://zytxwdgzjqrcmbnpgofj.supabase.co/functions/v1/cron-auto-approve \
            -H "Authorization: Bearer ${{ secrets.SUPABASE_SERVICE_KEY }}"
```

---

### FASE 4: Monitoramento (Contínuo)

#### Alertas a Monitorar
1. **Webhook Failures**
   ```sql
   SELECT COUNT(*) FROM webhook_logs
   WHERE status = 'error' AND created_at > now() - INTERVAL '1 hour';
   ```

2. **RLS Errors**
   ```sql
   SELECT * FROM audit_logs
   WHERE error_message LIKE '%violates row-level%'
   ORDER BY created_at DESC LIMIT 10;
   ```

3. **Withdrawn Pending > 24h**
   ```sql
   SELECT COUNT(*) FROM solicitacoes_saque
   WHERE status = 'pendente'
   AND created_at < now() - INTERVAL '1 day';
   ```

#### Setup Alerting (Integração com Slack/Email)
```bash
# Opção 1: Usar Supabase Realtime para alertas em tempo real
# Opção 2: Implementar API endpoint que monitora e alerta
# Opção 3: Setup Sentry.io para rastrear erros
```

---

## ⚠️ Testes IMPORTANTES Antes de Deploy

### 1. Testar LOCALMENTE Primeiro
```bash
# Terminal 1: Start Supabase local
supabase start

# Terminal 2: Start app
npm run dev

# Terminal 3: Run tests
python3 smoke_test.py  # Deve ser 12/12
```

### 2. Testar Fluxo de Pagamento (Sandbox)
1. Criar conta de teste no Asaas
2. Criar subscription teste
3. Simular webhook Payment Confirmed
4. Verificar que comissão foi criada

### 3. Testar RLS Policies
```sql
-- Como user comum, tente ver saques de outro usuário
SELECT * FROM solicitacoes_saque WHERE contador_id != get_contador_id(auth.uid());
-- Deve retornar 0 linhas (bloqueado por RLS)
```

---

## 📊 Vulnerabilidades Conhecidas a Serem Fixadas

### TIER 1: Security (Próxima Sprint)
- [ ] Atualizar dependências npm (2 moderate, 2 low vulnerabilities)
  ```bash
  npm audit fix
  npm update
  ```

### TIER 2: Stability (Próxima Sprint)
- [ ] Implementar Error Boundary (React)
- [ ] Adicionar Auth token refresh automático
- [ ] Melhorar tratamento de erros de rede

### TIER 3: Performance (Quando convir)
- [ ] Code splitting para reduzir bundle size (1.3MB → ~600KB)
- [ ] Lazy loading de páginas heavy
- [ ] Cache de queries com React Query

---

## 📚 Documentação de Referência

### Arquivos Críticos
- `src/pages/Perfil.tsx` - Validação de dados bancários
- `src/pages/Comissoes.tsx` - Fluxo de saque
- `supabase/functions/webhook-asaas/index.ts` - Webhook handler
- `supabase/migrations/202511*.sql` - Schema changes

### Queries SQL Úteis
```sql
-- Ver comissões de um usuário
SELECT * FROM comissoes WHERE contador_id = 'uuid-aqui';

-- Ver saques pendentes
SELECT * FROM solicitacoes_saque WHERE status = 'pendente';

-- Ver logs de webhook
SELECT * FROM webhook_logs ORDER BY created_at DESC LIMIT 20;

-- Forçar aprovação manual (para teste)
UPDATE comissoes SET status_comissao = 'aprovada'
WHERE contador_id = 'uuid' AND status_comissao = 'calculada';
```

---

## 🔄 Rollback Plan (Se Algo Der Errado)

Se após deploy encontrar erro crítico:

```bash
# 1. Reverter migrations (CUIDADO!)
supabase db reset --include-seed

# 2. Reverter frontend (git)
git revert <commit-id>

# 3. Redeploy versão anterior
npm run build
# Deploy dist/ novamente

# 4. Avisar time
```

**Nota**: As migrations são **não-reversíveis** por design (migrations nunca devem ser revertidas). Se houver problema, criar nova migration para fix.

---

## 🎯 Próxima Reunião

**Sugerido**: Após FASE 1 (Deploy em Produção)

**Agenda**:
1. Validar checklist de produção
2. Revisar logs e erros
3. Planejar FASE 4 (Monitoramento)
4. Decidir sobre TIER 2 fixes

**Duração**: 30 min

---

## 📞 Contatos & Suporte

- **Github Issues**: Reportar bugs em https://github.com/Contadores-de-Elite-1/lovable-Celite/issues
- **Slack**: #celite-production para discussões
- **PagerDuty**: Setup se quiser alertas automáticos

---

**Próximo Responsável**: 🤵 [Seu Nome]
**Próxima Data**: Nov 16, 2025
**Status**: 🟢 ON TRACK
