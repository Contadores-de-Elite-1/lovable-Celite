# 🎯 Real-World Test Scenario - Complete End-to-End Flow

**Status**: Practical Testing Guide
**Date**: Nov 14, 2025
**Time Required**: ~2 hours
**Cost**: R$ 0 (using Asaas sandbox)

---

## 📖 Scenario

Você vai simular a vida real de um contador:

```
1. Contador "Maria Silva" se cadastra no app
2. Ela cria seus clientes e subscriptions no Asaas
3. Clientes pagam mensalidades
4. Sistema calcula comissões automaticamente
5. Maria vê seu saldo crescer
6. No dia 25, comissões são pagas
```

---

## 🚀 Setup (15 min)

### Step 1: Create Asaas Sandbox Account

1. Go to: https://sandbox.asaas.com/
2. Sign up (free)
3. Go to: Settings → Integrações → API
4. Copy `API Key` (starts with `aac_`)
5. Go to: Webhooks
6. Set webhook URL to:
   ```
   https://seu-app.com/functions/v1/webhook-asaas
   ```
   (Or local if testing: `http://localhost:5173/functions/v1/webhook-asaas`)
7. Copy webhook secret

### Step 2: Configure App

```bash
# Set environment variables
export ASAAS_API_KEY="aac_..."
export ASAAS_WEBHOOK_SECRET="seu-webhook-secret"

# Or in .env.local
echo 'ASAAS_API_KEY=aac_...' >> .env.local
echo 'ASAAS_WEBHOOK_SECRET=seu-webhook-secret' >> .env.local
```

### Step 3: Start App

```bash
npm install
npm run dev
# App runs on http://localhost:5173
```

---

## 👤 Scenario Part 1: User Registration (5 min)

### Action 1: Sign Up as Contador

**What to do**:
1. Go to http://localhost:5173
2. Click "Sign up"
3. Enter:
   - Email: `maria.silva@contadores.com`
   - Password: `MariaSilva123!`
   - Name: `Maria Silva`
4. Click "Create Account"
5. Verify email (check spam folder)
6. Login

**What should happen**:
```
✅ User created in auth
✅ Profile created automatically
✅ Contador record created automatically  ← NEW FIX!
✅ User redirected to dashboard
✅ Shows: "Welcome, Maria Silva"
✅ Shows: "Saldo de Comissões: R$ 0,00"
```

**Verify in Database**:
```sql
SELECT id, nome, email, nivel, clientes_ativos
FROM contadores
WHERE email = 'maria.silva@contadores.com';

-- Should show: 1 row, nivel='bronze', clientes_ativos=0
```

---

## 💼 Scenario Part 2: Company Setup (10 min)

### Action 2: Complete Profile

1. Click on Avatar → "Perfil"
2. Fill in:
   - CPF/CNPJ: `12345678000190`
   - **PIX Key** (or bank): `maria@pix` (fake, but required)
   - Click "Salvar"

**Expected**:
```
✅ Profile saved
✅ No RLS error  ← NEW FIX!
✅ Message: "Perfil atualizado com sucesso"
```

### Action 3: Create First Customer

1. Go to `/pagamentos` or `/clientes`
2. Click "Novo Cliente"
3. Fill in:
   - Name: `Empresa ABC Ltda`
   - Email: `contato@empresaabc.com`
   - CNPJ: `98765432000123`
   - Phone: `11987654321`
4. Click "Criar"

**Expected**:
```
✅ Customer created
✅ Asaas_customer_id saved  (starts with cust_)
✅ Message: "Cliente criado com sucesso"
```

**Verify in Asaas**:
1. Go to Asaas Dashboard
2. Search: "Empresa ABC"
3. Should see customer listed

---

## 💳 Scenario Part 3: Create Subscription (10 min)

### Action 4: Subscribe Customer

1. In `/clientes`, find "Empresa ABC"
2. Click "Adicionar Assinatura"
3. Fill in:
   - Monthly value: `R$ 500,00`
   - Billing type: `BOLETO`
   - Description: `Serviço Contábil Mensal`
   - First due: `${próximos 10 dias}`
4. Click "Criar"

**Expected**:
```
✅ Subscription created
✅ Asaas_subscription_id saved
✅ Status: ACTIVE
✅ Message: "Assinatura criada com sucesso"
```

**Verify in Asaas**:
1. Click on "Empresa ABC" customer
2. Go to "Assinaturas" tab
3. See subscription with R$ 500,00/month
4. See boleto listed with due date

---

## 💰 Scenario Part 4: Simulate Payment (15 min)

### Action 5A: Via Asaas Dashboard (REAL)

**If you want to test the full real flow**:

1. In Asaas Dashboard, find "Empresa ABC"
2. Click the boleto (payment)
3. Click "Pagar Agora" (sandbox allows)
4. Complete fake payment
5. **Wait 2-5 minutes** for webhook to arrive

**What happens automatically**:
```
1. Asaas sends PAYMENT_CONFIRMED webhook
2. Your app receives it at /webhook-asaas
3. Signature validated ✅
4. Payment registered in DB ✅
5. Commission calculated ✅
6. Status: 'calculada' ✅
7. Maria sees new balance ✅
```

### Action 5B: Via Script (FAST - for testing)

If Asaas webhook is slow, use script:

```bash
export ASAAS_API_KEY="aac_..."
export ASAAS_WEBHOOK_SECRET="seu-secret"
./test_asaas_flow.sh

# This will:
# 1. Create test customer
# 2. Create test subscription
# 3. Simulate webhook locally
# 4. Calculate commissions
# 5. Show results
```

**Expected Output**:
```
✅ Customer created: cust_...
✅ Subscription created: sub_...
✅ Webhook processed: pay_...
Next: Verify in database
```

---

## 📊 Scenario Part 5: Verify Commission (10 min)

### Action 6: Check Database

```sql
-- 1. See payment
SELECT id, valor_bruto, valor_liquido, status_pagamento
FROM pagamentos
WHERE valor_bruto = 500.00
LIMIT 1;

-- Expected: valor_bruto=500, valor_liquido=485 (approx)

-- 2. See commission calculated
SELECT tipo_comissao, valor, status_comissao
FROM comissoes
WHERE pagamento_id = '<payment-id-from-above>'
LIMIT 1;

-- Expected for BRONZE (15%):
-- tipo_comissao='recorrente', valor=72.75, status='calculada'

-- Calculation: 485 × 0.15 = 72.75
```

### Action 7: Check Dashboard

1. Login as Maria (if not already)
2. Go to `/dashboard`
3. Look for: **"Saldo de Comissões"**

**Expected**:
```
Before: R$ 0,00
After:  R$ 72,75  ← New!
```

---

## ⏰ Scenario Part 6: Auto-Approval (Optional - Faster if Manual)

### Option A: Wait 24 Hours

1. Commission created at: Nov 14, 10:00
2. Auto-approval runs at: Nov 15, 3:00 AM
3. Status changes to: `aprovada`

**Check**:
```sql
SELECT status_comissao, auto_aprovada_em
FROM comissoes
WHERE id = '<commission-id>';

-- Should show: status='aprovada', auto_aprovada_em=<timestamp>
```

### Option B: Manual Approval (Faster for Testing)

**As Admin** (if you have admin role):
1. Go to `/auditoria-comissoes`
2. Find Maria's commission
3. Click "Aprovar"
4. Commission status → `aprovada`

**Or via SQL**:
```sql
UPDATE comissoes
SET status_comissao = 'aprovada'
WHERE id = '<commission-id>';
```

---

## 💵 Scenario Part 7: Withdrawal Request (10 min)

### Action 8: Request Withdrawal

1. Go to `/comissoes`
2. Click **"Solicitar Saque"**

**Modal should show**:
```
Saldo Disponível: R$ 72,75
Método de Pagamento: maria@pix
Confirma? [Cancelar] [Confirmar]
```

3. Click "Confirmar"

**Expected**:
```
✅ Request saved
✅ No RLS error  ← NEW FIX!
✅ Message: "Solicitação de saque registrada"
✅ Status: PENDENTE
```

**Verify in Database**:
```sql
SELECT contador_id, valor, status, created_at
FROM solicitacoes_saque
WHERE contador_id = (SELECT id FROM contadores WHERE email = 'maria.silva@contadores.com')
ORDER BY created_at DESC
LIMIT 1;

-- Expected: valor=72.75, status='pendente'
```

---

## 🔄 Scenario Part 8: Payout Process (Day 25 - Simulate)

### Action 9: Simulate Day 25 CRON

Normally runs on day 25, but for testing:

```sql
-- Get pending withdrawals
SELECT id, contador_id, valor, status
FROM solicitacoes_saque
WHERE status = 'pendente'
AND valor >= 100;

-- For testing (Maria has only R$ 72,75, so won't trigger normally)
-- Let's add more by creating another payment:

-- Add another R$ 500 payment
INSERT INTO pagamentos (
  id, cliente_id, contador_id, valor_bruto, valor_liquido,
  asaas_payment_id, status_pagamento, competencia
) VALUES (
  gen_random_uuid(),
  '<client-id>',
  '<maria-contador-id>',
  500.00, 485.00,
  'pay_test_2',
  'CONFIRMADO',
  '2025-11-14'
);

-- This creates another R$ 72.75 commission
-- Total now: R$ 145.50 (>= R$ 100)

-- Run CRON manually
SELECT cron_processar_pagamento_comissoes();
```

**Expected**:
```
✅ Commissions marked as 'paga'
✅ Transfer created in Asaas
✅ Maria receives PIX/bank transfer
```

---

## 🎯 Complete Checklist

### Phase 1: User Setup ✅

- [ ] User signs up: maria.silva@contadores.com
- [ ] Profile created automatically (NEW FIX)
- [ ] Login works
- [ ] Dashboard shows R$ 0,00 saldo

### Phase 2: Company Setup ✅

- [ ] Complete profile with PIX or bank
- [ ] Create customer "Empresa ABC"
- [ ] Customer appears in Asaas dashboard

### Phase 3: Subscription ✅

- [ ] Create subscription: R$ 500,00/month
- [ ] Subscription appears in Asaas
- [ ] Status: ACTIVE

### Phase 4: Payment ✅

- [ ] Payment confirmed (via Asaas or script)
- [ ] Webhook received successfully
- [ ] Payment in `pagamentos` table

### Phase 5: Commission ✅

- [ ] Commission created: R$ 72,75
- [ ] Status: `calculada`
- [ ] Dashboard updates automatically

### Phase 6: Approval ✅

- [ ] Auto-approval after 24h (or manual)
- [ ] Status: `aprovada`

### Phase 7: Withdrawal ✅

- [ ] Withdrawal request created
- [ ] No RLS error (NEW FIX)
- [ ] Status: `pendente`

### Phase 8: Payout ✅

- [ ] CRON runs on day 25 (or simulated)
- [ ] Transfer to PIX/bank
- [ ] Status: `paga`

---

## 📊 Success Metrics

**Numbers to expect**:

```
1 Customer
1 Subscription @ R$ 500/month
1 Payment received
1 Commission calculated (BRONZE 15%)

Commission Value Calculation:
  Gross: R$ 500,00
  Asaas Fee: ~R$ 15,00
  Net: R$ 485,00
  Commission (15%): R$ 72,75
  Status: calculada → aprovada → paga
  Withdrawal: Manual on day 25 or simulated
```

---

## 🐛 If Something Goes Wrong

### Symptom 1: "RLS Policy Error"
```
Error: "new row violates row-level security policy"
```
**Fix**: This was already fixed! Verify migration applied:
```sql
SELECT COUNT(*) FROM solicitacoes_saque;
-- If error, run migration 20251115000000_add_solicitacoes_saque.sql
```

### Symptom 2: "Payment Not Showing"
```
Webhook received but no payment in DB
```
**Check**:
```sql
SELECT * FROM webhook_logs
ORDER BY created_at DESC
LIMIT 5;

-- Look for error_message field
```

### Symptom 3: "Commission Math Wrong"
```
Expecting R$ 72,75 but got R$ 81,60
```
**Check**:
```sql
SELECT valor_liquido, (valor_liquido * 0.15) as expected
FROM pagamentos
WHERE asaas_payment_id = 'pay_...';

-- Verify calculation
```

---

## 📝 Notes for Next Tests

After this passes, try:

1. **Multiple Customers**: Create 5+ customers for same contador
   - Triggers progression bonus (R$ 100 at milestone 5)
   - Verify bonus appears in commissions

2. **Different Levels**: Test PRATA, OURO, DIAMANTE
   - Each has different commission percentage (17%, 19%, 20%)
   - Verify calculations change accordingly

3. **Sponsor Override**: Create 2 contadores with referral link
   - Senior (sponsor) should earn override on junior's commissions
   - Verify override (3-5%) calculated correctly

4. **High Volume**: Create 20+ customers
   - Triggers volume bonus (R$ 100 per 5 after 15)
   - Verify cumulative bonuses

---

## 🚀 After This Test Passes

1. **Deploy to Staging**
   ```bash
   ./deploy.sh staging --execute
   ```

2. **Repeat Test in Staging**
   - Use staging URL instead of localhost
   - Same steps, same expectations

3. **Deploy to Production**
   ```bash
   ./deploy.sh production --execute
   ```

4. **Monitor Production**
   ```bash
   ./monitoring.sh
   supabase logs pull --function webhook-asaas
   ```

---

## ⏱️ Time Breakdown

```
Setup & Account Creation: 15 min
User Registration & Profile: 10 min
Customer Setup: 10 min
Subscription Creation: 10 min
Payment Simulation: 15 min
Verification & Debugging: 15 min
Documentation: 10 min
─────────────────────────
TOTAL: ~85 minutes (1.5 hours)
```

---

**Status**: Ready for Real-World Testing
**Environment**: Sandbox (zero financial risk)
**Expected Outcome**: Full commission workflow validated
**Success**: All 8 checklist items ✅

Good luck! 🚀
