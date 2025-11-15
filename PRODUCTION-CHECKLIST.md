# Production Deployment Checklist

Complete checklist for deploying Contadores de Elite to production with Stripe integration.

## 📋 Pre-Deployment Checklist

### 1. Environment Configuration

- [ ] **Supabase Production Project**
  - [ ] Created production project on Supabase
  - [ ] Database migrated (all 20+ migrations applied)
  - [ ] RLS policies enabled and tested
  - [ ] Edge Functions deployed
  - [ ] Environment variables configured

- [ ] **Stripe Configuration**
  - [ ] Live mode API keys obtained from Stripe dashboard
  - [ ] Webhook endpoint configured (https://your-domain.com/webhook)
  - [ ] Webhook secret obtained and stored securely
  - [ ] Test payment in live mode (with real card)
  - [ ] Subscription product created in Stripe
  - [ ] Price ID noted for production use

- [ ] **Frontend Environment**
  - [ ] `VITE_SUPABASE_URL` set to production URL
  - [ ] `VITE_SUPABASE_ANON_KEY` set to production key
  - [ ] All sensitive data removed from code
  - [ ] `.env` file NOT committed to git
  - [ ] Build succeeds without warnings

### 2. Security

- [ ] **Authentication**
  - [ ] Email confirmation enabled in Supabase
  - [ ] Password requirements configured (min 8 chars)
  - [ ] Rate limiting enabled on auth endpoints
  - [ ] Session timeout configured (30 days default)

- [ ] **Database Security**
  - [ ] All RLS policies tested with different user roles
  - [ ] No direct database access from frontend
  - [ ] API keys are anonymous keys (not service role)
  - [ ] Sensitive columns encrypted if needed

- [ ] **Frontend Security**
  - [ ] No API keys in client-side code
  - [ ] CSP headers configured (see below)
  - [ ] HTTPS enforced
  - [ ] XSS protection enabled

### 3. Performance

- [ ] **Build Optimization**
  - [ ] Production build created (`npm run build`)
  - [ ] Bundle size checked (< 500KB initial load)
  - [ ] Code splitting implemented
  - [ ] Images optimized
  - [ ] Lazy loading for heavy components

- [ ] **Caching**
  - [ ] Static assets cached (1 year)
  - [ ] API responses cached where appropriate
  - [ ] Service worker configured (optional)

- [ ] **Monitoring**
  - [ ] Error tracking setup (Sentry, LogRocket, etc.)
  - [ ] Analytics configured (see ANALYTICS section below)
  - [ ] Performance monitoring enabled
  - [ ] Uptime monitoring configured

### 4. Testing

- [ ] **Functionality**
  - [ ] User registration works
  - [ ] Login/logout works
  - [ ] Password reset works
  - [ ] Stripe checkout flow (test mode → live mode)
  - [ ] Webhook processing works
  - [ ] Commission calculations correct
  - [ ] Network referral tracking works

- [ ] **Cross-Browser**
  - [ ] Chrome/Edge (latest)
  - [ ] Firefox (latest)
  - [ ] Safari (latest)
  - [ ] Mobile browsers (iOS Safari, Chrome Mobile)

- [ ] **Responsive Design**
  - [ ] Mobile (375px - iPhone SE)
  - [ ] Tablet (768px - iPad)
  - [ ] Desktop (1024px+)

- [ ] **Accessibility**
  - [ ] Keyboard navigation works
  - [ ] Screen reader compatible
  - [ ] Color contrast meets WCAG AA
  - [ ] Focus indicators visible

### 5. Stripe Integration

- [ ] **Live Mode Checklist**
  - [ ] Account activated and verified
  - [ ] Business information complete
  - [ ] Bank account connected for payouts
  - [ ] Tax information submitted
  - [ ] Identity verification complete

- [ ] **Webhook Configuration**
  ```
  Endpoint URL: https://YOUR_PROJECT.supabase.co/functions/v1/stripe-webhook
  Events to send:
    - checkout.session.completed
    - customer.subscription.created
    - customer.subscription.updated
    - customer.subscription.deleted
    - invoice.paid
    - invoice.payment_failed
  ```

- [ ] **Test Scenarios**
  - [ ] Successful payment
  - [ ] Failed payment
  - [ ] Subscription renewal
  - [ ] Subscription cancellation
  - [ ] Webhook retry logic

### 6. Documentation

- [ ] **User Documentation**
  - [ ] FAQ section complete
  - [ ] Help articles written
  - [ ] Support email configured
  - [ ] Terms of service published
  - [ ] Privacy policy published

- [ ] **Developer Documentation**
  - [ ] README up to date
  - [ ] API documentation complete
  - [ ] Deployment guide written
  - [ ] Troubleshooting guide created

### 7. Legal & Compliance

- [ ] **LGPD Compliance** (Brazilian GDPR)
  - [ ] Privacy policy includes data collection details
  - [ ] User consent mechanism implemented
  - [ ] Data deletion process documented
  - [ ] Data export functionality available

- [ ] **Payment Processing**
  - [ ] PCI compliance (handled by Stripe)
  - [ ] Refund policy published
  - [ ] Subscription terms clear

## 🚀 Deployment Steps

### Step 1: Database Migration

```bash
# Connect to production Supabase project
supabase link --project-ref YOUR_PROJECT_REF

# Push all migrations
supabase db push

# Verify migration status
supabase migration list
```

### Step 2: Deploy Edge Functions

```bash
# Deploy Stripe webhook handler
supabase functions deploy stripe-webhook --no-verify-jwt

# Deploy commission calculator
supabase functions deploy calcular-comissoes

# Set environment variables
supabase secrets set STRIPE_SECRET_KEY=sk_live_...
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
```

### Step 3: Frontend Deployment

```bash
# Install dependencies
npm install

# Build for production
npm run build

# Test build locally
npm run preview

# Deploy to hosting (Vercel/Netlify/etc)
# Follow your hosting provider's instructions
```

### Step 4: Configure Stripe Webhook

1. Go to Stripe Dashboard → Developers → Webhooks
2. Click "Add endpoint"
3. Enter URL: `https://YOUR_PROJECT.supabase.co/functions/v1/stripe-webhook`
4. Select events (see list above)
5. Copy webhook secret and add to Supabase secrets

### Step 5: Post-Deployment Verification

```bash
# Check all endpoints respond
curl https://your-domain.com/health

# Test authentication flow
# (Manual testing in browser)

# Test Stripe checkout
# (Use test mode first, then live mode)

# Monitor logs
supabase functions logs stripe-webhook --tail
```

## 📊 Analytics Configuration

The app includes built-in analytics tracking. To enable Google Analytics:

1. Create GA4 property
2. Add tracking script to `index.html`:

```html
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```

3. Events are automatically tracked via `src/lib/analytics.ts`

## 🔒 Security Headers

Add these headers to your hosting platform:

```
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' https://js.stripe.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://*.supabase.co https://api.stripe.com; frame-src https://js.stripe.com;
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: geolocation=(), microphone=(), camera=()
```

## 🐛 Troubleshooting

### Webhook Not Firing

1. Check webhook endpoint is publicly accessible
2. Verify webhook secret matches
3. Check Supabase function logs
4. Test with Stripe CLI: `stripe listen --forward-to localhost:54321/functions/v1/stripe-webhook`

### Payment Not Processing

1. Check Stripe dashboard for payment status
2. Verify webhook received and processed
3. Check database for commission records
4. Review function logs for errors

### Commission Calculation Wrong

1. Verify network structure in `rede_contadores` table
2. Check commission percentages in code
3. Review audit logs in `audit_logs` table
4. Test calculation with known values

## 📞 Support

After deployment, monitor these channels:

- **Email**: suporte@contadoresdeelite.com
- **Stripe Dashboard**: Check for failed payments
- **Supabase Logs**: Monitor edge function errors
- **Analytics**: Track user behavior and drop-off

## ✅ Post-Launch

- [ ] Monitor error rates (first 24h)
- [ ] Check webhook success rate
- [ ] Verify commission calculations
- [ ] Test user signup flow
- [ ] Monitor payment success rate
- [ ] Check analytics data collection
- [ ] Review support tickets
- [ ] Gather user feedback

## 🎯 Success Metrics

Track these KPIs:

- **Conversion Rate**: Visitors → Signups → Paid Subscribers
- **Payment Success Rate**: Should be > 95%
- **Webhook Success Rate**: Should be > 99%
- **Commission Accuracy**: 100%
- **User Retention**: Month-over-month
- **Support Tickets**: Trend downward as UX improves

---

## Quick Reference

**Test Card (Stripe)**:
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`
- Any future expiry date, any 3-digit CVC

**Supabase Commands**:
```bash
supabase start           # Start local dev
supabase functions deploy # Deploy function
supabase db push         # Push migrations
supabase secrets set     # Set environment variable
```

**Environment Variables**:
```env
# Frontend (.env)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...

# Backend (Supabase Secrets)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```
