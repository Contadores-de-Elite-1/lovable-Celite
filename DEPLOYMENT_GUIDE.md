# 🚀 Deployment Guide - Step by Step

**Status**: Ready for Production
**Date**: Nov 14, 2025
**Environment**: Production-ready scripts included

---

## 📋 Quick Start (5 minutes)

### Prerequisites
```bash
# Install dependencies
npm install

# Verify smoke tests pass
python3 smoke_test.py
# Expected: 12/12 ✅
```

### Deploy to Staging (Recommended First)
```bash
# 1. Dry run (see what will deploy)
./deploy.sh staging --dry-run

# 2. Execute deployment
./deploy.sh staging --execute

# 3. Run health checks
./monitoring.sh

# 4. Test manually (see SMOKE_TEST.md)
```

### Deploy to Production
```bash
# Set environment variable (CRITICAL)
export ASAAS_WEBHOOK_SECRET="your-secret-here"

# 1. Dry run
./deploy.sh production --dry-run

# 2. Execute
./deploy.sh production --execute

# 3. Monitor
./monitoring.sh

# 4. Validate all workflows work
```

---

## 🎯 What Gets Deployed

### 1️⃣ Database Migrations (3 files)

**Migration Files**:
- `20251105215330_d89b630c-...sql` - Auth trigger creates contadores
- `20251115000000_add_solicitacoes_saque.sql` - Withdrawal RLS policies
- `20251115000100_auto_approve_commissions.sql` - Auto-approval function

**What They Fix**:
- ✅ User signup (creates contador record)
- ✅ Withdrawal RLS (get_contador_id)
- ✅ Commission approval (auto after 24h)

**Deploy**: `supabase db push --linked`

---

### 2️⃣ Supabase Functions (9 functions)

**Critical Functions**:
- `webhook-asaas` - Receives and validates Asaas webhooks (SECURITY)
- `calcular-comissoes` - Calculates commissions from payments
- `processar-pagamento-comissoes` - Processes day 25 payouts

**Deploy**: `supabase functions deploy <name>`

**Verify**:
```bash
supabase functions list
supabase logs pull --function webhook-asaas
```

---

### 3️⃣ Frontend Code (1 build)

**Files Changed**:
- `src/pages/Perfil.tsx` - Added bank account validation
- Other pages updated with modal confirmations

**Deploy**: Upload `dist/` folder to hosting

**Build**: `npm run build` (creates optimized output)

**Size**: 1.3MB JS + 74KB CSS (gzip)

---

## ⚙️ Step-by-Step Deployment

### Phase 1: Pre-Flight (30 seconds)
```bash
cd /path/to/lovable-Celite

# Verify clean state
git status
# Expected: "nothing to commit, working tree clean"

# Verify builds
npm install
npm run build
# Expected: "✓ built in X.XXs"

# Run tests
python3 smoke_test.py
# Expected: "12 passed, 0 failed"
```

### Phase 2: Staging Deployment (5 minutes)

```bash
# See what will deploy
./deploy.sh staging --dry-run

# Output shows:
# - Migrations to apply
# - Functions to deploy
# - Frontend build size

# Execute
./deploy.sh staging --execute
```

**What happens**:
1. Re-checks git is clean
2. Re-runs smoke tests
3. Builds frontend
4. Skips migrations (staging only)
5. Optionally deploys functions
6. Reports ready for manual testing

### Phase 3: Manual Validation (10-20 minutes)

**Test these flows** (see SMOKE_TEST.md for details):

1. **User Signup**
   - [ ] Go to staging URL
   - [ ] Click "Sign up"
   - [ ] Enter email + password
   - [ ] Verify email
   - [ ] Login
   - [ ] Dashboard loads (should show $0 commission)

2. **Commission Flow**
   - [ ] Check webhook logs: `supabase logs pull --function webhook-asaas`
   - [ ] See recent payment events
   - [ ] Verify commission was created: `SELECT * FROM comissoes LIMIT 1;`

3. **Withdrawal Request**
   - [ ] Go to Perfil page
   - [ ] Add PIX or bank account data
   - [ ] Go to Comissões
   - [ ] Click "Solicitar Saque"
   - [ ] Modal should show
   - [ ] Click confirm
   - [ ] Should save without RLS error

4. **Security Check**
   - [ ] Try webhook without signature: should fail
   - [ ] Check webhook_logs for errors
   - [ ] Verify no unsigned payments processed

### Phase 4: Production Deployment (5 minutes)

**ONLY after staging validates successfully!**

```bash
# Set the webhook secret
export ASAAS_WEBHOOK_SECRET="production-secret-from-asaas"

# Deploy
./deploy.sh production --execute

# This will:
# 1. Validate everything again
# 2. Deploy migrations to production DB
# 3. Deploy webhook function
# 4. Deploy other functions
# 5. Build frontend
```

### Phase 5: Post-Deployment Validation (30 minutes)

```bash
# Run monitoring
./monitoring.sh

# Check specific logs
supabase logs pull --function webhook-asaas

# Monitor errors
watch -n 5 'curl -s https://your-supabase-url/rest/v1/webhook_logs?limit=20'
```

**Critical Checks**:
- [ ] Users can signup
- [ ] Webhook accepts signed requests
- [ ] Webhook rejects unsigned requests
- [ ] Commission calculations run
- [ ] Users can request withdrawals
- [ ] No RLS errors in audit_logs

---

## 🔧 Configuration Files

### Environment Variables Needed

**Frontend** (`.env` or Vercel config):
```
VITE_SUPABASE_URL=https://zytxwdgzjqrcmbnpgofj.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Backend** (Supabase Secrets):
```
ASAAS_WEBHOOK_SECRET=your_secret_from_asaas_dashboard
```

**Local Development**:
```bash
# Copy example
cp .env.example .env

# Edit with real values
nano .env

# Supabase local
supabase start
```

---

## 📊 Scripts Overview

### `./deploy.sh`
Automated deployment with validation

**Usage**:
```bash
./deploy.sh staging --dry-run      # Preview
./deploy.sh staging --execute      # Deploy to staging
./deploy.sh production --execute   # Deploy to production
```

**What it does**:
1. Validates git is clean
2. Checks dependencies installed
3. Runs smoke tests (12 checks)
4. Builds frontend
5. Deploys migrations (if production)
6. Deploys functions
7. Reports success/failure

### `./monitoring.sh`
Health check dashboard

**Usage**:
```bash
./monitoring.sh
```

**Shows**:
- Frontend status
- Supabase status
- Webhook configuration
- Auto-approval status
- RLS policies
- Build info
- Last deployment
- Recommendations

### `python3 smoke_test.py`
Automated test suite (12 checks)

**Usage**:
```bash
python3 smoke_test.py
```

**Tests**:
- Build compiles
- TypeScript has no errors
- Database migrations exist
- Webhook function exists
- Auth handler exists
- RLS policies correct
- Webhook signature validation
- Auto-approval function
- Profile validation
- All critical components

---

## ⚠️ Common Issues & Solutions

### Issue 1: Build fails
```bash
npm install
npm run build
```
**Solution**: Delete node_modules and reinstall

### Issue 2: RLS policy error on withdrawal
```
"new row violates row-level security policy"
```
**Solution**: Verify migration applied correctly
```bash
supabase db pull  # Get schema
grep "get_contador_id" supabase/migrations/*
```

### Issue 3: Webhook not receiving payments
```bash
# Check webhook logs
supabase logs pull --function webhook-asaas

# Verify signature secret is set
echo $ASAAS_WEBHOOK_SECRET
```

### Issue 4: Commission never auto-approves
```sql
-- Manually check if function exists
SELECT * FROM pg_proc WHERE proname = 'auto_aprovar_comissoes';

-- Manually run to test
SELECT auto_aprovar_comissoes();
```

### Issue 5: Users can't login
```sql
-- Check if contador was created
SELECT * FROM contadores WHERE created_at > now() - INTERVAL '1 day';

-- Verify trigger exists
SELECT tgname FROM pg_trigger WHERE tgrelname = 'auth' AND tgname LIKE '%new_user%';
```

---

## 🔄 Rollback

If something goes wrong, see **ROLLBACK_PLAN.md** for:
- Quick frontend rollback (2 min)
- Function rollback (5-10 min)
- Database rollback (30+ min)
- Full emergency rollback (45-90 min)

**Quick rollback**:
```bash
git reset --hard <previous-commit>
npm run build
# Redeploy dist/
```

---

## 📈 Monitoring & Health

### Daily Health Check
```bash
./monitoring.sh
python3 smoke_test.py
```

### Log Monitoring
```bash
# Webhook logs
supabase logs pull --function webhook-asaas

# Function errors
supabase logs pull --function calcular-comissoes

# Database errors
SELECT * FROM audit_logs
WHERE error_message IS NOT NULL
ORDER BY created_at DESC LIMIT 20;
```

### Alert Conditions (Act if you see these)
- ❌ Webhook function failures > 5/hour
- ❌ RLS policy violations in logs
- ❌ Commission calculations not running
- ❌ User signup failures
- ❌ Build > 2MB (performance issue)

---

## 📝 Checklist

### Before Deployment
- [ ] All local tests pass (12/12 smoke tests)
- [ ] Build succeeds (`npm run build`)
- [ ] No TypeScript errors (`npx tsc --noEmit`)
- [ ] Git is clean (`git status`)
- [ ] Environment variables set (ASAAS_WEBHOOK_SECRET)
- [ ] Reviewed changes (`git log --oneline -5`)

### During Deployment
- [ ] Dry run executed (`./deploy.sh staging --dry-run`)
- [ ] Reviewed what will deploy
- [ ] Execute deployment (`./deploy.sh production --execute`)
- [ ] Monitoring started (`./monitoring.sh`)

### After Deployment
- [ ] Test user signup flow
- [ ] Test withdrawal request creation
- [ ] Check webhook logs for errors
- [ ] Verify no RLS violations
- [ ] Check commission calculations
- [ ] Monitor for 1 hour
- [ ] Document any issues

---

## 🎓 Learning Resources

- **NEXT_STEPS.md** - Detailed roadmap for next phases
- **PRODUCTION_READINESS_CHECKLIST.md** - Feature completeness check
- **ROLLBACK_PLAN.md** - Emergency procedures
- **SMOKE_TEST.md** - Manual testing guide
- **E2E_TEST_GUIDE.md** - End-to-end test suite

---

## 📞 Support

If something breaks:

1. **Check logs**
   ```bash
   ./monitoring.sh
   supabase logs pull --function webhook-asaas
   ```

2. **See recent errors**
   ```bash
   git log --oneline -10
   git diff HEAD~5..HEAD
   ```

3. **Rollback if needed**
   ```bash
   git reset --hard <previous-commit>
   ./deploy.sh production --execute
   ```

4. **Report issue**
   - GitHub: Create issue with error details
   - Slack: Post in #celite-production

---

**Good luck! 🚀**

Remember: Test locally, verify on staging, then promote to production.
