# 🎯 Production Testing Guide - Using Asaas Sandbox

**Status**: App is LIVE in Production
**Date**: Nov 14, 2025
**Risk Level**: 🟢 ZERO (using Asaas SANDBOX - no real money)

---

## ⚠️ IMPORTANT

This is **NOT a test environment**. This is **PRODUCTION**.

But we use **Asaas SANDBOX** to test payments with **ZERO financial risk**.

```
Your Production App (LIVE)
         ↓
Asaas Sandbox API (TEST PAYMENTS, NO REAL MONEY)
         ↓
Everything else is REAL
```

---

## 🚀 Quick Start (15 min)

### Step 1: Create Asaas Sandbox Account

1. Go to: https://sandbox.asaas.com/
2. Sign up (free)
3. Complete setup wizard
4. Verify email

### Step 2: Get API Keys

1. Dashboard → Settings → Integrations → API
2. Copy **API Key** (starts with `aac_`)
3. Go to **Webhooks**
4. Webhook URL should be:
   ```
   https://zytxwdgzjqrcmbnpgofj.supabase.co/functions/v1/webhook-asaas
   ```
5. Copy **Webhook Secret**

### Step 3: Configure Production App

Tell your admin to set environment variables:

```bash
export ASAAS_API_KEY="aac_..."
export ASAAS_WEBHOOK_SECRET="your-webhook-secret"
```

Or in Supabase:
```bash
supabase secrets set ASAAS_API_KEY "aac_..."
supabase secrets set ASAAS_WEBHOOK_SECRET "your-webhook-secret"
```

### Step 4: Test User Signup

1. Go to your production app URL
2. Click "Sign up"
3. Enter:
   - Email: your-email@test.com
   - Password: SecurePassword123!
   - Name: Seu Nome
4. Verify email
5. Login

**Expected**: Dashboard shows "Saldo de Comissões: R$ 0,00" ✅

### Step 5: Complete Profile

1. Click Avatar → Perfil
2. Fill in:
   - CPF/CNPJ: 12345678000190 (fake but valid format)
   - PIX Key OR Bank Account: (required)
3. Save

**Expected**: No RLS error ✅

### Step 6: Create Customer

1. Go to Clientes or Pagamentos section
2. Click "Novo Cliente"
3. Fill in:
   - Name: Empresa Teste ABC
   - Email: empresa@test.com
   - CNPJ: 98765432000123
4. Create

**Expected**: Customer created with asaas_customer_id ✅

### Step 7: Create Subscription

1. Find customer you just created
2. Click "Adicionar Assinatura"
3. Fill in:
   - Value: R$ 500,00
   - Type: BOLETO
   - First Due: 10 days from now
4. Create

**Expected**: Subscription active in Asaas ✅

### Step 8: Pay (Simulate Payment)

**Option A: Real Payment (via Asaas Dashboard)**
1. Go to Asaas Dashboard
2. Find your customer
3. Click the boleto/payment
4. Click "Pagar Agora"
5. Complete payment (sandbox doesn't charge)
6. Wait 2-5 min for webhook

**Option B: Fast Simulation**
```bash
# Use webhook simulator (see ASAAS_TESTING_GUIDE.md)
./test_asaas_flow.sh
```

### Step 9: Verify Commission

**Check in App Dashboard**:
1. Login as your user
2. Go to Dashboard
3. Look for "Saldo de Comissões"
4. Should show: R$ 72,75 (for R$ 500 at BRONZE level)

**Check in Database** (Supabase Console):
```sql
SELECT * FROM comissoes
ORDER BY created_at DESC
LIMIT 1;

-- Should see:
-- tipo_comissao: 'recorrente'
-- valor: 72.75
-- status_comissao: 'calculada'
```

### Step 10: Request Withdrawal

1. Go to Comissões
2. Click "Solicitar Saque"
3. Modal shows details
4. Confirm

**Expected**: Request saved, no error ✅

---

## 📊 What Gets Tested

| Feature | Test | Expected |
|---------|------|----------|
| User Signup | Create account | Profile auto-created ✅ |
| Profile | Add PIX/Bank | Validation works ✅ |
| Customer | Create in Asaas | Linked to app ✅ |
| Subscription | Monthly R$ 500 | Status ACTIVE ✅ |
| Payment | Via Asaas | Webhook received ✅ |
| Commission | Auto-calculated | R$ 72,75 (15% of R$ 485) ✅ |
| Approval | Wait 24h or manual | Status → 'aprovada' ✅ |
| Withdrawal | Request saque | Saved in DB ✅ |
| Payout | Day 25 CRON | Transferred via PIX/Bank ✅ |

---

## 🔍 Troubleshooting

### Issue 1: "RLS Policy Error" on Withdrawal

**Error**: "new row violates row-level security policy"

**Solution**:
- This was already fixed in production
- If you see it, contact admin
- Verify migration 20251115000000 was applied

### Issue 2: Payment Webhook Not Received

**Check**:
```bash
supabase logs pull --function webhook-asaas
```

**Look for**:
- Recent webhook logs
- Any error messages
- Signature validation errors

**If webhook missing**:
1. Verify Asaas webhook URL is correct
2. Check Asaas webhook settings (Dashboard → Webhooks)
3. Manually trigger: use `test_asaas_flow.sh`

### Issue 3: Commission Shows Wrong Value

**Expected for BRONZE (15%)**:
- Payment: R$ 500
- Net (after Asaas fees): ~R$ 485
- Commission: R$ 485 × 15% = R$ 72,75

**If different**:
1. Check payment.valor_liquido in database
2. Check contador.nivel (should be 'bronze')
3. Verify calculation: valor_liquido × taxa

### Issue 4: Can't Complete Profile

**Error**: "Você deve fornecer PIX ou dados bancários"

**Solution**:
1. Fill in **either** PIX key OR bank account
2. Both are not required, **one is**
3. Save again

---

## 📝 Testing Checklist

### Phase 1: Setup (15 min)
- [ ] Asaas Sandbox account created
- [ ] API key copied
- [ ] Webhook secret copied
- [ ] Production app accessed

### Phase 2: User Flow (20 min)
- [ ] Signup works
- [ ] Profile complete
- [ ] Customer created
- [ ] Subscription created
- [ ] Payment initiated

### Phase 3: Backend (20 min)
- [ ] Webhook received
- [ ] Commission calculated
- [ ] Amount is correct
- [ ] Status is 'calculada'

### Phase 4: User Interface (10 min)
- [ ] Dashboard shows commission
- [ ] Withdrawal request works
- [ ] Modal confirms
- [ ] No errors in console

### Phase 5: Approval (1 hour)
- [ ] Wait 24h OR
- [ ] Manually approve via SQL
- [ ] Status → 'aprovada'

### Phase 6: Payout (Day 25)
- [ ] CRON runs on day 25
- [ ] Commission marked 'paga'
- [ ] User receives transfer

---

## 💡 Advanced Testing

### Test Multiple Levels

Create different users with different levels and verify commission percentages:

```
BRONZE:     15%  → R$ 72,75
PRATA:      17%  → R$ 82,45
OURO:       19%  → R$ 92,15
DIAMANTE:   20%  → R$ 97,00
```

### Test Progression Bonus

Create user with 4 clients, add 5th:
- Should trigger R$ 100 bonus
- Verify in comissoes table

### Test Volume Bonus

Create user with 20+ clients:
- Should trigger volume bonuses
- R$ 100 per 5 clients after 15

### Test Referral Bonus

Recruit new user:
- Give them first client
- Should earn R$ 50 referral bonus

---

## 🚨 Emergency Procedures

### If App Breaks After Deploy

```bash
# 1. Check monitoring
./monitoring.sh

# 2. Check logs
supabase logs pull --function webhook-asaas

# 3. If critical, rollback (< 5 min)
git reset --hard HEAD~1
npm run build
./deploy.sh production --execute

# 4. Notify admin
```

### If Webhook Fails

```bash
# 1. Check webhook logs
SELECT * FROM webhook_logs
ORDER BY created_at DESC
LIMIT 20;

# 2. Check signature validation
# Look for: "Invalid webhook signature"

# 3. Verify secret
echo $ASAAS_WEBHOOK_SECRET
# Must match Asaas Dashboard

# 4. If wrong, update:
supabase secrets set ASAAS_WEBHOOK_SECRET "correct-secret"
```

### If Commission Not Calculated

```bash
# Check if payment was registered
SELECT * FROM pagamentos
ORDER BY created_at DESC
LIMIT 1;

# Check if commission was created
SELECT * FROM comissoes
WHERE pagamento_id = '<payment-id>'
LIMIT 1;

# If missing:
# 1. Check webhook_logs for errors
# 2. Manually check Asaas API
# 3. Use test_asaas_flow.sh to debug
```

---

## 📞 Support

- **Webhook Issues**: See ASAAS_TESTING_GUIDE.md
- **Commission Math**: See COMMISSION_CALCULATION_GUIDE.md
- **Deployment Issues**: See ROLLBACK_PLAN.md
- **General Issues**: Create GitHub issue with logs

---

## ✅ Success Indicators

After testing, you should see:

✅ Users can signup and login
✅ Profiles complete without error
✅ Customers created in Asaas
✅ Subscriptions active
✅ Webhooks received (no signature errors)
✅ Commissions calculated correctly
✅ Withdrawal requests work
✅ No RLS errors
✅ No database errors
✅ App responds quickly

If all ✅, **you're ready for real users!**

---

**Status**: 🟢 PRODUCTION LIVE with SANDBOX PAYMENTS
**Risk**: 🟢 ZERO FINANCIAL (using Asaas sandbox)
**Test Duration**: 1-2 hours
**Confidence**: HIGH 💪
