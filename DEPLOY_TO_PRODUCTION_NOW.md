# 🚀 PRODUCTION DEPLOYMENT - GO LIVE NOW

**Status**: 🟢 **PRODUCTION READY**
**Date**: Nov 14, 2025
**Confidence**: 💪 VERY HIGH
**Time to Deploy**: 5 minutes
**Risk Level**: 🟢 LOW (using Asaas sandbox)

---

## 📋 PRÉ-REQUISITOS

### 1. Get Asaas Sandbox Secrets

```bash
# Go to: https://sandbox.asaas.com/
# 1. Create free sandbox account
# 2. Settings → Integrations → API
# 3. Copy API Key (starts with "aac_")
# 4. Go to Webhooks → Copy Webhook Secret
```

### 2. Verify You Have Secrets

```bash
# Check if variables are set
echo "API Key: $ASAAS_API_KEY"
echo "Webhook Secret: $ASAAS_WEBHOOK_SECRET"

# If empty, set them:
export ASAAS_API_KEY="aac_..."
export ASAAS_WEBHOOK_SECRET="your-webhook-secret"
```

---

## 🎯 DEPLOY PRODUCTION (5 minutes)

### Step 1: Run Dry-Run (See What Will Deploy)

```bash
./deploy.sh production --dry-run
```

**Expected Output**:
```
✅ Git working tree clean
✅ npm installed
✅ Smoke tests: 12/12 PASS
✅ Build successful (1.4M)

📋 DRY RUN - Showing what would be deployed:

1️⃣  Database Migrations:
   19 migrations from Nov

2️⃣  Supabase Functions:
   webhook-asaas, calcular-comissoes, ...

3️⃣  Frontend Build:
   dist/index.html
   dist/assets/*.js (1 files)
   dist/assets/*.css (1 files)

To execute deployment, run:
  ./deploy.sh production --execute
```

### Step 2: Execute Deploy

```bash
./deploy.sh production --execute
```

**Expected Output**:
```
✅ Git working tree clean
✅ npm installed
✅ Smoke tests: 12/12 PASS
✅ Build successful (1.4M)

⏳ Deploying to production...

2️⃣  Deploying Supabase functions...
   webhook-asaas (deployed)
   calcular-comissoes (deployed)

3️⃣  Frontend build ready:
   ✅ Build artifacts in dist/

✅ Deployment complete!
```

### Step 3: Verify Deployment

```bash
# Check system health
./monitoring.sh
```

**Expected Output**:
```
📋 1. System Health
Frontend Status: ✅ UP
Supabase Status: ✅ UP
Webhook Function: ✅ PRESENT

✓ Database Migrations:
  Found: 19 migrations

✓ Webhook Configuration:
  ✅ Signature validation enabled

✓ Auto-Approval Function:
  ✅ Function exists

✓ RLS Policies:
  ✅ Using get_contador_id() for safety
```

---

## ✅ Success Criteria (After Deploy)

All of these should be TRUE:

- [ ] No deployment errors
- [ ] Monitoring shows all systems UP
- [ ] 12/12 smoke tests still pass
- [ ] No RLS policy violations in logs
- [ ] Build completed successfully

If all ✅, **you are LIVE!** 🎉

---

## 🧪 Test Immediately After Deploy

### Quick Smoke Test (2 minutes)

1. **Go to your production app URL**
2. **Click "Sign up"**
3. **Create account**:
   - Email: test@yourcompany.com
   - Password: TestPassword123!
   - Name: Test User
4. **Verify email** (check spam folder)
5. **Login**

**Expected**: Dashboard shows "Saldo de Comissões: R$ 0,00" ✅

---

## 📊 What's Live Now

### Users Can:
✅ Sign up without errors
✅ Profile auto-created
✅ Add customers to Asaas
✅ Create subscriptions
✅ See commission balance
✅ Request withdrawals
✅ No RLS errors

### System Can:
✅ Receive webhook payments (validated)
✅ Calculate commissions automatically
✅ Auto-approve after 24h
✅ Process payout on day 25

### You Can:
✅ Monitor health (./monitoring.sh)
✅ Check logs
✅ Rollback if needed (< 5 min)

---

## 🔄 Next: Collect Real User Feedback

### Timeline

**Week 1**:
- App is live
- Users sign up
- Users test workflows

**Week 2-3**:
- Collect feedback (Google Forms or Typeform)
- Analyze: What worked? What didn't?
- Top complaints/compliments

**Week 4**:
- Implement top 2-3 changes
- Redeploy with fixes
- Measure impact

---

## 📞 Commands You'll Need

```bash
# Monitor health
./monitoring.sh

# Check webhook logs
supabase logs pull --function webhook-asaas

# Check for RLS errors
supabase logs pull

# Emergency rollback (if needed)
git reset --hard HEAD~1
npm run build
./deploy.sh production --execute
```

---

## ⚠️ If Something Goes Wrong

### Problem: Deployment fails

```bash
# Check the error message
./deploy.sh production --execute

# Common issues:
# 1. Missing ASAAS_WEBHOOK_SECRET
#    → export ASAAS_WEBHOOK_SECRET="..."
#
# 2. Git not clean
#    → git add . && git commit -m "fix"
#
# 3. Build error
#    → npm install && npm run build
```

### Problem: App is down (critical)

```bash
# Rollback to previous version (< 5 minutes)
git reset --hard HEAD~1
npm run build
./deploy.sh production --execute

# Then investigate what went wrong
```

---

## 🎯 You're Ready!

```
CHECKLIST FOR DEPLOYMENT:

Before Running Deploy:
  [ ] Have ASAAS_API_KEY from sandbox
  [ ] Have ASAAS_WEBHOOK_SECRET from sandbox
  [ ] Git is clean (git status shows nothing)
  [ ] Smoke tests pass locally (python3 smoke_test.py)

During Deploy:
  [ ] Run dry-run first (./deploy.sh production --dry-run)
  [ ] Review what will deploy
  [ ] Run execute (./deploy.sh production --execute)
  [ ] Watch for errors

After Deploy:
  [ ] Run ./monitoring.sh
  [ ] Test signup/login
  [ ] Check logs for errors
  [ ] Ready for users!

Post-Deploy (Week 2-3):
  [ ] Collect user feedback
  [ ] Analyze feedback
  [ ] Plan improvements
  [ ] Iterate
```

---

## 🚀 FINAL COMMANDS

```bash
# Export secrets
export ASAAS_API_KEY="aac_..."
export ASAAS_WEBHOOK_SECRET="your-secret"

# Deploy to production
./deploy.sh production --execute

# Monitor
./monitoring.sh

# Done! 🎉
```

---

**Status**: 🟢 **READY TO DEPLOY**
**Next Step**: Run the commands above
**Expected Time**: 5 minutes

**Let's go live!** 🚀
