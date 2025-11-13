# 🗺️ ROADMAP DESENVOLVIMENTO - Celite MVP

**Prepared**: 2025-11-12
**Current Branch**: `claude/fix-database-types-and-rpc-011CV3XrXYKkYhhLFsYXfAZ1`
**Option Selected**: B - Completo (4-5 weeks, $500-650)
**Your Budget**: $246 (⚠️ SHORTFALL: $254-404)

---

## 📊 RESUMO EXECUTIVO

| Métrica | Valor |
|---------|-------|
| **Tempo Total Estimado** | 120-150 horas |
| **Semanas Recomendadas** | 4-5 (45h/semana) |
| **Custo Recomendado** | $500-650 USD |
| **Seu Budget** | $246 USD |
| **Gap** | -$254 a -$404 |
| **Conclusão do MVP** | 3-4 de dezembro 2025 |
| **Viável em 2 semanas com $250?** | ❌ NÃO |

---

## ⚠️ DIAGNÓSTICO ATUAL

### Progresso: 35-40% do MVP

```
[████████░░░░░░░░░░░░░░░░░░] 40%

Completo:
✅ Database schema + migrations
✅ RPC executar_calculo_comissoes
✅ Edge function calcular-comissoes
✅ Seed idempotente
✅ GitHub Actions workflow
✅ RLS base structure

Faltando:
❌ ASAAS integration completa (30%)
❌ 3 Edge functions críticas (30%)
❌ Frontend dashboard (40%)
❌ CRON jobs (5%)
❌ Testing e2e (20%)
❌ Monitoring (5%)
```

---

## 🚨 4 CRITICAL BLOCKERS (PRIORITY 1)

Estes DEVEM ser fixos antes de continuar com frontend:

### BLOCKER #1: ASAAS Webhook Integration (4 horas)
**Status**: ❌ Não implementado
**Impacto**: Payment lifecycle doesn't exist
**Tarefas**:
- [ ] Create migration: webhook_eventos table (timestamps, payload, status)
- [ ] Create edge function: processar-webhook-asaas
- [ ] Implement idempotency: webhook_id unique constraint
- [ ] Test payload: simulate payment states (pending→pago→estornado)
- [ ] Add error handling: retry logic, DLQ for failed webhooks

**Tests Required**:
```bash
# Test 1: Valid webhook - payment pending
curl -X POST http://localhost:54321/functions/v1/processar-webhook-asaas \
  -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
  -d '{"event":"payment.pending", "id":"asaas_123", "status":"PENDING"}'
# Expected: 200 OK, registro criado em webhook_eventos

# Test 2: Idempotency - same webhook twice
curl ... (same payload)
# Expected: 200 OK, apenas 1 registro (ON CONFLICT)

# Test 3: Payment complete
curl -X POST ... \
  -d '{"event":"payment.confirmed", "id":"asaas_123", "status":"CONFIRMED"}'
# Expected: 200 OK, trigger comissão calculation
```

**File Locations**:
- Migration: `supabase/migrations/20251113000000_webhook_eventos.sql`
- Function: `supabase/functions/processar-webhook-asaas/index.ts`

---

### BLOCKER #2: Edge Function `aprovar-comissoes` (4 horas)
**Status**: ❌ Não implementado
**Impacto**: Admin cannot approve commissions
**Tarefas**:
- [ ] Create edge function with RLS check (admin only)
- [ ] Add validation: comissão exists, status=calculada
- [ ] Implement transaction: update status → aprovada
- [ ] Add audit log: quien aprobó, timestamp
- [ ] Return 400 on: not found, wrong status, permission denied
- [ ] Return 500 on: database error
- [ ] Return 200 on: success with comissao object

**Tests Required**:
```bash
# Test 1: Admin approves comissão
curl -X POST .../functions/v1/aprovar-comissoes \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"comissao_id":"550e8400-...", "observacoes":"OK"}'
# Expected: 200 OK, status=aprovada

# Test 2: Non-admin user cannot approve
curl -X POST ... \
  -H "Authorization: Bearer $USER_TOKEN" \
  -d '{"comissao_id":"..."}'
# Expected: 403 Forbidden (RLS)

# Test 3: Invalid comissão_id
curl -X POST ... \
  -d '{"comissao_id":"invalid-uuid"}'
# Expected: 400 Bad Request

# Test 4: Comissão already aprovada
curl -X POST ... \
  -d '{"comissao_id":"already-aprovada-id"}'
# Expected: 400 Bad Request (wrong status)
```

**File Locations**:
- Function: `supabase/functions/aprovar-comissoes/index.ts`
- RLS Policy: `supabase/migrations/comissoes_rls_update.sql`

---

### BLOCKER #3: Edge Function `processar-pagamento-comissoes` (4 horas)
**Status**: ❌ Não implementado
**Impacto**: Cannot disburse approved commissions
**Tarefas**:
- [ ] Create edge function: integrate with ASAAS transfers API
- [ ] Validation: comissão status=aprovada, contador has bank info
- [ ] Call ASAAS: POST /transfers with amount + bank_account_id
- [ ] On success: update comissão status → paga, salvar transaction_id
- [ ] On failure: log error, return 500 with message
- [ ] Add retry logic: exponential backoff for ASAAS failures

**Tests Required**:
```bash
# Test 1: Successful transfer
curl -X POST .../functions/v1/processar-pagamento-comissoes \
  -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
  -d '{"comissao_id":"...", "contador_id":"..."}'
# Expected: 200 OK, status=paga, transaction_id populated

# Test 2: Missing bank account
curl -X POST ... \
  -d '{"comissao_id":"...", "contador_id":"contador-no-bank"}'
# Expected: 400 Bad Request

# Test 3: ASAAS API error
(mock ASAAS error response)
# Expected: 500 Server Error, retry attempt logged
```

**File Locations**:
- Function: `supabase/functions/processar-pagamento-comissoes/index.ts`
- Bank info: Add `bank_account_info` column to `contadores` table (migration)

---

### BLOCKER #4: Complete RLS Policies (2 horas)
**Status**: ⚠️ Parcial
**Impacto**: Data not properly isolated between users
**Current State**:
```
✅ contadores: user_id filtering
✅ clientes: contador_id filtering
⚠️ comissoes: needs approval role check
⚠️ bonus_historico: needs own/admin check
❌ pagamentos: not filtered yet
```

**Tarefas**:
- [ ] Create RLS for pagamentos (contador_id → contador → user_id)
- [ ] Create admin role + table
- [ ] Update comissoes policy: aprovador role
- [ ] Test: contador can only see own data
- [ ] Test: admin can see everything
- [ ] Test: other users cannot access

**Tests Required**:
```sql
-- Test 1: Contador 1 cannot see Contador 2's data
SET SESSION ROLE 'user_1_role';
SELECT COUNT(*) FROM comissoes;
-- Expected: only comissões for contadores owned by user_1

-- Test 2: Admin can see all data
SET SESSION ROLE 'admin_role';
SELECT COUNT(*) FROM comissoes;
-- Expected: all comissões

-- Test 3: Cross-tenant isolation
-- User from different organization cannot see anything
SET SESSION ROLE 'user_2_role';
SELECT COUNT(*) FROM contadores WHERE user_id != current_user_id();
-- Expected: 0
```

**File Locations**:
- Migration: `supabase/migrations/20251113000001_complete_rls_policies.sql`

---

## 📅 SEMANA-A-SEMANA (Detailed Timeline)

### ⏱️ WEEK 1: Backend Foundation (40-45 hours)

**Days 1-2: BLOCKER Fixes (12 hours)**
- [ ] BLOCKER #1: ASAAS webhook (4h)
  - Migrate, test, deploy
- [ ] BLOCKER #2: aprovar-comissoes (4h)
  - Function, RLS, deploy
- [ ] BLOCKER #3: processar-pagamento-comissoes (4h)
  - Function, ASAAS API, deploy

**Daily Checklist (Day 1-2)**:
- [ ] Write migration file
- [ ] Create edge function TypeScript
- [ ] Test locally with curl
- [ ] Run on supabase dev
- [ ] Commit and push to branch
- [ ] GitHub Actions passes
- [ ] No 42804 type errors in logs

**Days 3-4: RLS + CRON (8 hours)**
- [ ] BLOCKER #4: Complete RLS (2h)
  - Test isolation
- [ ] Setup CRON jobs (2h)
  - Day 25 payment check
  - Monthly bonus verification
- [ ] Test CRON execution (2h)
- [ ] Edge function verificar-bonus-ltv (2h)

**Days 5: Integration Testing (5 hours)**
- [ ] Full payment lifecycle test (3h)
  - Create pagamento → webhook → comissão calculated → approved → disbursed
- [ ] Error scenarios (2h)
  - Failed ASAAS transfer
  - Webhook timeout
  - RLS violation attempts

**End of Week 1 Validation**:
- [ ] Run: `bash supabase/scripts/run-all.sh` ✅ All green
- [ ] GitHub Actions passes ✅
- [ ] No console.error logs ✅
- [ ] All BLOCKER tests pass ✅
- [ ] Commit: "feat: backend foundation complete - blockers fixed"

---

### ⏱️ WEEK 2-3: Frontend Dashboard (35-40 hours)

**Priority Order** (by user value):
1. Contador Dashboard (what contador wants to see first)
2. Admin Panel (approval interface)
3. Bonus/History pages
4. Polish and responsive design

**Week 2 (20 hours)**:

**Days 1-2: Contador Dashboard Components (8 hours)**
- [ ] Page layout + navigation integration
- [ ] Commission list component (with filters, pagination)
  - Filters: status (calculada/aprovada/paga), date range, amount
  - Sorting: newest first, highest value first
  - Columns: Cliente, Tipo, Valor, Status, Data
- [ ] Test: load 100+ commissions, scroll performance
- [ ] Commit: "feat(ui): contador dashboard - list view"

**Days 3-4: Commission Details + Admin Panel (10 hours)**
- [ ] Commission detail page
  - Show full breakdown: base + bonus calculation
  - Timeline of status changes
  - Approval history
- [ ] Admin approval interface
  - Bulk select commissions
  - Approve/reject/request changes
  - Add notes
- [ ] Test: responsive on mobile (320px), tablet (768px), desktop
- [ ] Commit: "feat(ui): commission details + admin panel"

**Days 5: Responsive Design Pass (2 hours)**
- [ ] Review mobile experience
- [ ] Fix layout issues
- [ ] Test on real device

**Week 3 (20 hours)**:

**Days 1-2: Bonus/History Pages (8 hours)**
- [ ] Bonus history component
  - Show all bonus types, amounts, dates
  - Filter by type, month
- [ ] Analytics/charts
  - Monthly commission trend
  - Bonus breakdown pie chart
- [ ] Test: chart rendering, large datasets
- [ ] Commit: "feat(ui): bonus history and analytics"

**Days 3-4: UX Polish (8 hours)**
- [ ] Loading states (skeleton screens)
- [ ] Error messages (user-friendly)
- [ ] Empty states (no commissions yet)
- [ ] Confirmation dialogs (before approve/reject)
- [ ] Success notifications
- [ ] Test: all error paths tested
- [ ] Commit: "style(ui): polish loading, error, empty states"

**Days 5: Final UI Review (4 hours)**
- [ ] Accessibility check (keyboard navigation, screen reader)
- [ ] Color contrast (WCAG AA)
- [ ] Responsive final pass
- [ ] Performance audit (lighthouse)

**End of Week 3 Validation**:
- [ ] Dashboard loads in <2s ✅
- [ ] Mobile responsive (320px+) ✅
- [ ] All pages accessible ✅
- [ ] No console errors ✅
- [ ] Lighthouse score >90 ✅

---

### ⏱️ WEEK 4-5: Testing & Production (25-35 hours)

**Week 4 (20 hours)**:

**Days 1-2: End-to-End Testing (8 hours)**
```gherkin
Feature: Complete Commission Workflow
  Scenario: Payment → Calculation → Approval → Disbursement
    Given a new payment is created in ASAAS
    When webhook is received
    Then comissão is calculated automatically
    And comptador sees in dashboard
    And admin can approve
    And payment is transferred to bank
    And contador receives confirmation
```

- [ ] Write cypress tests for full flow
- [ ] Test all commission types (ativacao, recorrente, override, bonus_*)
- [ ] Test with multiple contadores
- [ ] Verify all database states

**Days 3-4: Error & Edge Case Testing (8 hours)**
- [ ] Failed ASAAS transfer → auto-retry
- [ ] Invalid bank account → clear error to user
- [ ] Webhook timeout → recovery
- [ ] Network split → eventual consistency
- [ ] High load: 100+ simultaneous calculations
- [ ] Concurrent approvals: 10 admins approving same batch

**Day 5: Security Audit (4 hours)**
- [ ] RLS bypass attempts (exploit testing)
- [ ] SQL injection on search filters
- [ ] Token expiry handling
- [ ] Rate limiting on endpoints
- [ ] ASAAS API key exposure check
- [ ] Commit: "test: complete e2e and security testing"

**Week 5 (15 hours)**:

**Days 1-2: Deployment (6 hours)**
- [ ] Setup staging environment (separate Supabase project)
- [ ] Run migrations on staging ✅
- [ ] Run full test suite on staging ✅
- [ ] Load test: 10 simultaneous users
- [ ] Verify all logs clean (no errors)
- [ ] Document deployment procedure

**Days 3: Monitoring Setup (3 hours)**
- [ ] Sentry integration (error tracking)
- [ ] Datadog integration (performance monitoring)
- [ ] Setup alerts: failed webhooks, RPC errors, API timeouts
- [ ] Create runbook: troubleshooting guide

**Days 4: Documentation (4 hours)**
- [ ] User guide: how to view commissions
- [ ] Admin guide: how to approve payments
- [ ] Developer guide: how to deploy, maintain
- [ ] API documentation: all endpoints
- [ ] FAQ: common issues

**Day 5: Final QA + Production Deploy (2 hours)**
- [ ] Final smoke test checklist
- [ ] Health check all endpoints
- [ ] Deploy to production
- [ ] Monitor first 24h
- [ ] Commit: "chore: production deployment - monitored"

---

## 🧪 TESTING MATRIX

| Feature | Unit Tests | Integration | E2E | Manual |
|---------|-----------|-------------|-----|--------|
| ASAAS webhook | ✅ | ✅ | ❌ | ✅ |
| aprovar-comissoes | ✅ | ✅ | ✅ | ✅ |
| processar-pagamento | ✅ | ✅ | ❌ | ✅ |
| RLS policies | ✅ | ✅ | ✅ | ❌ |
| Commission calculation | ✅ | ✅ | ✅ | ✅ |
| Frontend dashboard | ❌ | ✅ | ✅ | ✅ |
| Admin panel | ❌ | ✅ | ✅ | ✅ |
| Bonus calculation | ✅ | ✅ | ✅ | ❌ |
| CRON jobs | ✅ | ✅ | ❌ | ✅ |

**Test Execution Schedule**:
- Daily: Unit tests (automated)
- Daily: Integration tests (pre-commit hook)
- Weekly: E2E tests (before merge)
- End of phase: Manual regression testing
- Week 5: Load testing (production-scale)

---

## 💰 DETAILED COST BREAKDOWN

### Option B Recommended (What you SHOULD do)

```
PHASE 0 - Setup & Validation: 2 hours = $50
PHASE 1 - Backend (4 blockers + CRON): 16 hours = $400
PHASE 2 - Frontend Dashboard: 40 hours = $1,000
PHASE 3 - Testing & Deployment: 30 hours = $750
────────────────────────────────────────
TOTAL: 88 hours = $2,200 USD
```

**Wait, that's much higher!** Let me recalculate based on realistic burn rates:

If paying **$500-650 for 4-5 weeks**, that assumes:
- 100-120 hours of work
- $5-6.50 per hour (below-market for senior dev, below-market for mid-level dev with specialist knowledge)
- OR: 3-4 developers @ 25-40h/week for 4 weeks

### Your Reality: $246 Budget

With $246, you can get approximately:
- **40-50 hours** of developer time at $5/hour (if outsourced to lower-cost regions)
- **25-30 hours** at $8-10/hour (junior dev with supervision needed)
- **15-20 hours** at market rate $12-15/hour

**This covers**:
- Option A: Minimal UI (15-20 hours max, skip polish)
- Core BLOCKERS only (16 hours)
- That leaves 9-14 hours for:
  - Very basic dashboard (list only, no filters)
  - Basic admin panel (approve/reject only)
  - NO analytics/history pages
  - NO error handling polish
  - NO monitoring setup

---

## ✅ ACCEPTANCE CRITERIA (MVP Definition)

**Minimum Viable for Launch** (must have):
- [ ] Payment lifecycle works (webhook → calculation → approval → disbursement)
- [ ] Contador can see their commissions
- [ ] Admin can approve commissions
- [ ] All 4 BLOCKERS fixed and tested
- [ ] No console errors in production
- [ ] GitHub Actions passing on all commits
- [ ] RLS properly isolating data
- [ ] CRON jobs executing

**Nice to Have** (budget permitting):
- [ ] Commission analytics/charts
- [ ] Bonus history page
- [ ] Mobile responsive polish
- [ ] Email notifications
- [ ] Advanced filtering

**Not in MVP**:
- [ ] Mobile app
- [ ] Payments via other gateways
- [ ] Advanced reporting
- [ ] Audit trail UI
- [ ] Multi-language support

---

## 🚀 RECOMMENDATIONS

### For Your Situation ($246 budget):

**OPTION A-LITE (2-3 weeks, $246 stretch):**
1. Fix all 4 BLOCKERS (16h) - **MANDATORY**
2. Basic contador dashboard (8h)
3. Basic admin panel (8h)
4. Testing only blockers properly (4h)
5. Deploy to staging only (2h)
**Gap**: No production monitoring, no polish, MVP but rough

### Better: Find $254-404 more OR extend timeline

**With realistic $500-650**:
- Complete frontend with polish
- Proper testing (e2e, load, security)
- Production deployment + monitoring
- Documentation

---

## 🎯 NEXT IMMEDIATE STEPS (Today)

1. **Confirm your budget situation**:
   - Can you find additional $254-404?
   - Or should we cut scope to fit $246?

2. **Choose development approach**:
   - Full-time: 1 dev, 4-5 weeks
   - Part-time: 2-3 devs, 6-8 weeks
   - Balanced: mix yourself + 1-2 devs

3. **Pick your environment**:
   - GitHub Codespaces (cloud, $12-21/month for stronger machine)
   - Local VSCode (your computer, no extra cost)
   - Both (recommend for reliability)

4. **Start WEEK 1 immediately**:
   - BLOCKER #1: ASAAS webhook (4h this week)
   - Branch already ready: `claude/fix-database-types-and-rpc-011CV3XrXYKkYhhLFsYXfAZ1`
   - GitHub Actions validates all changes automatically

---

## 📊 DAILY STATUS TRACKING

Each day, track:
```
Date: YYYY-MM-DD
Hours worked: [X/45]
Completed:
- [ ] Feature X
- [ ] Tests X
- [ ] Commit X

Blockers:
- None / [list issues]

Next day:
- Start Feature Y
- Test Z
```

---

## 🆘 SUPPORT RESOURCES

- **This doc**: Update as scope/timeline changes
- **Todo list**: Track all tasks (already created in session)
- **GitHub Issues**: Create for blocking bugs
- **Testing guide**: TESTING.md in repository
- **Schema reference**: ENUM_CRITICAL_VALUES.md

---

**Created**: 2025-11-12
**Last Updated**: 2025-11-12
**Status**: READY FOR APPROVAL
