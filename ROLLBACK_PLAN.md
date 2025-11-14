# 🔄 Rollback Plan - Emergency Procedures

**Status**: Production Emergency Procedures
**Last Updated**: Nov 14, 2025
**Severity Levels**: 🔴 Critical | 🟠 High | 🟡 Medium | 🟢 Low

---

## 🚨 When to Rollback

### Critical (Rollback IMMEDIATELY)
- ❌ Users cannot login
- ❌ Database migrations fail
- ❌ Webhook accepting fake payments
- ❌ RLS blocking all authenticated requests
- ❌ App completely unavailable

### High (Rollback within 30 min)
- ⚠️ Core workflows broken (signup, withdraw, commission)
- ⚠️ Webhook functions erroring consistently
- ⚠️ High error rate (>10% of requests)
- ⚠️ Data corruption detected

### Medium (Can wait for fix)
- 📊 Performance degradation
- 🎨 UI issues
- ⚠️ Specific feature broken (not core)

---

## 🔄 Rollback Procedures

### LEVEL 1: Frontend Rollback (Fastest - 2 min)

**Scenario**: UI broken, app won't load, styling issues

**Steps**:
```bash
# 1. Get previous working commit
git log --oneline | head -10
# Find last good commit before deployment

# 2. Rollback frontend
git revert <commit-id>  # OR
git reset --hard <commit-id>

# 3. Rebuild
npm install
npm run build

# 4. Redeploy dist/
# Upload dist/ to your hosting (Vercel, Netlify, etc)

# 5. Verify
curl https://your-app.com | grep -q "DOCTYPE"  # Should return HTML
```

**Rollback Time**: ~2-5 minutes

---

### LEVEL 2: Function Rollback (Database Functions - 5-10 min)

**Scenario**: Webhook broken, commission calculation broken, but app still loads

**Steps**:
```bash
# 1. Check which function is failing
supabase functions list

# 2. Get previous version from git
git log --oneline supabase/functions/webhook-asaas/ | head -5
# Note the commit ID

# 3. Revert the function
git show <commit-id>:supabase/functions/webhook-asaas/index.ts > /tmp/old_webhook.ts

# 4. Deploy previous version
cp /tmp/old_webhook.ts supabase/functions/webhook-asaas/index.ts
supabase functions deploy webhook-asaas

# 5. Verify
supabase logs pull --function webhook-asaas
```

**Alternative**: If git rollback too slow, edit function directly in Supabase Dashboard:
- Go to Supabase → Functions → webhook-asaas
- Edit code directly
- Deploy

**Rollback Time**: ~5-15 minutes

---

### LEVEL 3: Database Rollback (Migrations - ⚠️ DANGEROUS)

**Scenario**: Migration corrupted data, tables missing, RLS broken

**⚠️ WARNING**: Migrations are APPEND-ONLY. Cannot be reverted without data loss.

**Option A: Revert by creating new migration (SAFE)**
```bash
# 1. Identify bad migration
ls -la supabase/migrations/ | grep 202511

# 2. Create REVERSE migration
# Example: if 20251115000100_auto_approve_commissions.sql broke things
# Create: 20251115000101_ROLLBACK_auto_approve_commissions.sql

cat > supabase/migrations/20251115000101_ROLLBACK_auto_approve_commissions.sql << 'EOF'
-- Reverse the broken migration
DROP FUNCTION IF EXISTS public.auto_aprovar_comissoes CASCADE;
DROP INDEX IF EXISTS idx_comissoes_auto_approve;
ALTER TABLE public.comissoes DROP COLUMN IF EXISTS auto_aprovada_em;

-- Restore previous state if needed
-- (Depends on what went wrong)
EOF

# 3. Deploy
supabase db push --linked

# 4. Verify
supabase db pull  # Verify schema is correct
```

**Option B: Reset (DESTRUCTIVE - Last resort)**
```bash
# ⚠️ THIS DELETES ALL DATA!
supabase db reset

# Will:
# 1. Delete database
# 2. Recreate from migrations
# 3. Run seed data if available

# Then restore from backup:
# (You DO have backups, right?)
```

**Rollback Time**: ~30 minutes (+ restore time if needed)

---

### LEVEL 4: Full Emergency Rollback (Complete Reset)

**Scenario**: Everything broken, need to go back to last known good state

**Steps**:
```bash
# 1. Frontend
git reset --hard <last-good-commit>
npm install
npm run build
# Deploy dist/ again

# 2. Database (if necessary)
# Option A: Reverse migrations (preferred)
git log --oneline supabase/migrations/ | head -5
# Create rollback migrations for the broken ones

# Option B: Restore from backup
# Contact your database provider for restore point
# Timeline: ~1-2 hours

# 3. Functions
git reset --hard <last-good-commit>
supabase functions deploy webhook-asaas
supabase functions deploy calcular-comissoes

# 4. Full system test
python3 smoke_test.py  # Should be 12/12
npm run build          # Should succeed
```

**Rollback Time**: ~45-90 minutes (depending on backup restore)

---

## 📋 Rollback Checklist

### Before You Deploy Anything
- [ ] You have git history (never force push to main)
- [ ] You have database backups (Supabase auto-backs up daily)
- [ ] You know how to roll back
- [ ] You have a test environment

### After Deploying
- [ ] Run smoke_test.py (12/12 must pass)
- [ ] Monitor webhook logs for errors
- [ ] Monitor RLS policy violations
- [ ] Check user signups working
- [ ] Verify withdrawals processing

### If You Need to Rollback
- [ ] 🔴 Stop the bleeding (disable webhooks if needed)
- [ ] 📝 Document what went wrong
- [ ] 🔄 Execute rollback
- [ ] 🧪 Test thoroughly after rollback
- [ ] 📊 Monitor for 1 hour after rollback
- [ ] 🐛 Create bug report/issue

---

## 🆘 Emergency Contacts & Procedures

### Critical Issue Detection
```bash
# Script to check for critical errors
while true; do
  ERROR_COUNT=$(curl -s "https://api.supabase.co/..." | jq '.errors | length')
  if [ "$ERROR_COUNT" -gt 100 ]; then
    echo "🚨 CRITICAL: ${ERROR_COUNT} errors detected!"
    # Trigger alert/webhook
  fi
  sleep 30
done
```

### Immediate Actions
1. **Slack/Email Alert** → Notify team
2. **Disable Webhooks** → Prevent bad payments
3. **Database Read-Only** → Prevent corruption
4. **Analyze Logs** → Determine root cause
5. **Execute Rollback** → Restore service
6. **Post-mortem** → Learn and prevent

---

## 📊 Git History for Rollback

### Last 10 Commits (reference)
```
8f726e2 docs: add detailed next steps roadmap for production deployment
5eb8a77 docs: fix smoke test paths and add production readiness checklist
2908d14 chore: update submodule and dependencies
fd9b1cb feat: add database migrations for production fixes
bea081a test: add smoke test for critical workflows
6805633 fix: add bank account validation in profile form
3f3980d fix: critical production blockers - auth, withdrawals, commissions, security
8972437 fix: add UX confirmation modal for withdrawal requests
5b34cb3 feat: implement MVP disbursement system
15fc8b6 feat: implement MVP disbursement system (MILESTONE 6 - Phase 1)
```

### How to Rollback to Specific Commit
```bash
# See what changed
git diff <commit-id> HEAD

# Rollback to specific commit
git reset --hard <commit-id>

# Verify
git log --oneline -1
git status
```

---

## 🛡️ Prevention Tips

1. **Always test locally first**
   ```bash
   npm run build    # Must pass
   npm run dev      # Test workflows
   python3 smoke_test.py  # Must be 12/12
   ```

2. **Use dry-run before deploy**
   ```bash
   ./deploy.sh staging --dry-run  # Review what will deploy
   ./deploy.sh staging --execute  # Then execute
   ```

3. **Monitor after deploy**
   ```bash
   ./monitoring.sh  # Check health
   supabase logs pull --function webhook-asaas
   ```

4. **Automate tests**
   - Run smoke_test.py before each deploy
   - Setup CI/CD to catch errors early
   - Test migrations on staging first

5. **Document changes**
   ```bash
   git commit -m "fix: specific issue with clear description"
   # Good commit messages help during rollback
   ```

---

## 🔒 Disaster Recovery

### If Database Is Corrupted
```bash
# 1. Contact Supabase support (they have 30-day backup)
# 2. Request point-in-time recovery
# 3. Timeline: ~4-8 hours
```

### If All Migrations Failed
```bash
# 1. Reset database (DESTRUCTIVE)
supabase db reset

# 2. Reapply only working migrations
# 3. Restore from backup if available
```

### If You Deleted Production Data
```bash
# 1. Stop all operations immediately
# 2. Contact Supabase support for emergency backup
# 3. They can recover recent snapshots
```

---

## ✅ Success Criteria After Rollback

- [ ] All smoke tests pass (12/12)
- [ ] Users can login
- [ ] Users can create withdrawal requests
- [ ] Webhook accepts payments (and validates signature)
- [ ] Commission calculations work
- [ ] No RLS policy violations in logs
- [ ] No critical errors in console
- [ ] Performance is normal

---

## 📝 Post-Rollback

After you rollback:

1. **Write root cause analysis**
   ```markdown
   ## What went wrong?
   - [Describe the issue]

   ## Why did it happen?
   - [Root cause]

   ## How to prevent?
   - [Preventive measures]
   ```

2. **Create GitHub issue**
   ```
   Title: [INCIDENT] Description of what broke

   - Issue detected at: [time]
   - Rollback completed at: [time]
   - Root cause: [...]
   - Prevention: [...]
   ```

3. **Schedule retrospective**
   - Team review
   - Process improvements
   - Updated checklists

---

## 📞 Emergency Contacts

- **Supabase Support**: support@supabase.io
- **GitHub**: Issues in repo
- **Team Slack**: #celite-production
- **On-Call**: [Your contact info]

---

**Remember**: A good rollback plan is worth more than perfect deployments.
Test it before you need it. 🚀
