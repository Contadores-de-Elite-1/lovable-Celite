# Monitoring & Logging Setup

Production monitoring and logging configuration for Contadores de Elite.

## 📊 Built-in Analytics

The application includes a built-in analytics system (`src/lib/analytics.ts`) that tracks:

### Checkout Funnel Events

```typescript
import { trackCheckoutStep, CheckoutEvents } from '@/lib/analytics';

// Automatically tracked events:
trackCheckoutStep(CheckoutEvents.VIEWED_PRICING);
trackCheckoutStep(CheckoutEvents.CLICKED_SUBSCRIBE);
trackCheckoutStep(CheckoutEvents.SESSION_CREATED);
trackCheckoutStep(CheckoutEvents.REDIRECTED_TO_STRIPE);
trackCheckoutStep(CheckoutEvents.SUCCESS);
trackCheckoutStep(CheckoutEvents.CANCELLED);
trackCheckoutStep(CheckoutEvents.ERROR);
```

### Local Debugging

- Last 10 events stored in `localStorage` under key `analytics_events`
- View in browser console: `JSON.parse(localStorage.getItem('analytics_events'))`
- All events logged to console with `[ANALYTICS]` prefix

## 🔍 Error Tracking

### Option 1: Sentry (Recommended)

**Installation:**

```bash
npm install @sentry/react
```

**Configuration (`src/main.tsx`):**

```typescript
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "https://your-dsn@sentry.io/project-id",
  integrations: [
    new Sentry.BrowserTracing(),
    new Sentry.Replay(),
  ],
  tracesSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  environment: import.meta.env.PROD ? 'production' : 'development',
});
```

**Usage:**

```typescript
try {
  await StripeClient.redirectToCheckout(config);
} catch (error) {
  Sentry.captureException(error, {
    tags: {
      component: 'Pagamentos',
      action: 'checkout',
    },
  });
}
```

### Option 2: LogRocket

**Installation:**

```bash
npm install logrocket
```

**Configuration:**

```typescript
import LogRocket from 'logrocket';

LogRocket.init('your-app-id/your-project');

// Track user sessions
LogRocket.identify(user.id, {
  name: user.email,
  email: user.email,
});
```

## 📈 Performance Monitoring

### Web Vitals Tracking

**Installation:**

```bash
npm install web-vitals
```

**Setup (`src/lib/performance.ts`):**

```typescript
import { onCLS, onFID, onFCP, onLCP, onTTFB } from 'web-vitals';

function sendToAnalytics(metric: Metric) {
  // Send to your analytics service
  console.log('[PERFORMANCE]', metric);

  // Google Analytics example
  if (window.gtag) {
    window.gtag('event', metric.name, {
      value: Math.round(metric.value),
      event_category: 'Web Vitals',
      non_interaction: true,
    });
  }
}

// Measure all Web Vitals
onCLS(sendToAnalytics);
onFID(sendToAnalytics);
onFCP(sendToAnalytics);
onLCP(sendToAnalytics);
onTTFB(sendToAnalytics);
```

## 🗄️ Backend Logging (Supabase)

### Edge Function Logs

**View real-time logs:**

```bash
# All functions
supabase functions logs --tail

# Specific function
supabase functions logs stripe-webhook --tail

# Filter by level
supabase functions logs --level error
```

### Database Audit Logs

The application includes an `audit_logs` table that tracks:

- User actions
- Commission calculations
- Payment processing
- Security events

**Query recent errors:**

```sql
SELECT *
FROM audit_logs
WHERE nivel = 'error'
ORDER BY created_at DESC
LIMIT 100;
```

**Track specific user:**

```sql
SELECT *
FROM audit_logs
WHERE user_id = 'uuid-here'
ORDER BY created_at DESC;
```

### Webhook Logs

All Stripe webhooks are logged in `webhook_logs` table:

```sql
-- Failed webhooks (last 24h)
SELECT *
FROM webhook_logs
WHERE status = 'failed'
  AND created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;

-- Success rate
SELECT
  status,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM webhook_logs
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY status;
```

## 📱 Frontend Error Boundary

Add error boundary to catch React errors:

**`src/components/ErrorBoundary.tsx`:**

```typescript
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[ERROR_BOUNDARY]', error, errorInfo);

    // Send to error tracking service
    // Sentry.captureException(error, { contexts: { react: errorInfo } });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <Card className="max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-900">
                <AlertCircle className="w-5 h-5" />
                Algo deu errado
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600">
                Ocorreu um erro inesperado. Tente recarregar a página.
              </p>
              {import.meta.env.DEV && this.state.error && (
                <pre className="p-3 bg-gray-100 rounded text-xs overflow-auto">
                  {this.state.error.message}
                </pre>
              )}
              <Button
                onClick={() => window.location.reload()}
                className="w-full"
              >
                Recarregar Página
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
```

**Usage in `App.tsx`:**

```typescript
import { ErrorBoundary } from './components/ErrorBoundary';

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      {/* rest of app */}
    </QueryClientProvider>
  </ErrorBoundary>
);
```

## 🎯 Key Metrics to Monitor

### Application Health

1. **Error Rate**
   - Target: < 1% of requests
   - Alert if > 5%

2. **API Response Time**
   - Target: < 500ms p95
   - Alert if > 2s

3. **Checkout Conversion**
   - Viewed → Clicked: Track drop-off
   - Clicked → Success: Should be > 80%

4. **Webhook Success Rate**
   - Target: > 99%
   - Alert if < 95%

### Business Metrics

1. **Payment Success Rate**
   ```sql
   SELECT
     COUNT(*) FILTER (WHERE status = 'paid') * 100.0 / COUNT(*) as success_rate
   FROM pagamentos
   WHERE created_at > NOW() - INTERVAL '7 days';
   ```

2. **Commission Accuracy**
   ```sql
   SELECT
     status,
     COUNT(*) as count
   FROM comissoes
   WHERE created_at > NOW() - INTERVAL '30 days'
   GROUP BY status;
   ```

3. **Active Subscriptions**
   ```sql
   SELECT COUNT(*)
   FROM clientes
   WHERE status = 'ativo'
     AND stripe_subscription_id IS NOT NULL;
   ```

## 🔔 Alerting

### Stripe Dashboard Alerts

Configure in Stripe Dashboard → Settings → Notifications:

- Failed payments (> 10/hour)
- Webhook delivery issues
- Subscription cancellations (> 20/day)

### Supabase Alerts

Use Supabase Dashboard → Reports to set up:

- Database CPU usage > 80%
- Edge function errors > 100/hour
- API errors > 500/hour

### Custom Alerts (via Slack/Email)

**Edge Function example (`supabase/functions/monitor/index.ts`):**

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

serve(async (req) => {
  // Check metrics
  const { data: errorCount } = await supabase
    .from('audit_logs')
    .select('*', { count: 'exact', head: true })
    .eq('nivel', 'error')
    .gte('created_at', new Date(Date.now() - 3600000).toISOString());

  // Alert if too many errors
  if (errorCount && errorCount > 100) {
    // Send to Slack
    await fetch(process.env.SLACK_WEBHOOK_URL!, {
      method: 'POST',
      body: JSON.stringify({
        text: `⚠️ High error rate: ${errorCount} errors in last hour`,
      }),
    });
  }

  return new Response('OK');
});
```

**Run via cron:**

```toml
# supabase/config.toml
[functions.monitor]
verify_jwt = false

[[functions.monitor.schedule]]
enabled = true
cron = "*/15 * * * *"  # Every 15 minutes
```

## 📊 Dashboard Setup

### Option 1: Grafana + Prometheus

Monitor Supabase metrics with Grafana:

1. Enable Prometheus endpoint in Supabase
2. Configure Grafana data source
3. Import dashboard templates
4. Set up alerts

### Option 2: Custom Dashboard

Build with React + Recharts:

```typescript
// src/pages/AdminDashboard.tsx
export default function AdminDashboard() {
  const { data: metrics } = useQuery({
    queryKey: ['metrics'],
    queryFn: async () => {
      const [payments, commissions, webhooks] = await Promise.all([
        supabase.from('pagamentos').select('*', { count: 'exact', head: true }),
        supabase.from('comissoes').select('*', { count: 'exact', head: true }),
        supabase.from('webhook_logs').select('*').limit(100),
      ]);

      return { payments, commissions, webhooks };
    },
    refetchInterval: 60000, // 1 minute
  });

  return (
    <div>
      <h1>System Health</h1>
      {/* Display metrics with charts */}
    </div>
  );
}
```

## 🔒 Security Monitoring

### Failed Login Attempts

```sql
CREATE OR REPLACE FUNCTION log_failed_auth()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'failed' THEN
    INSERT INTO audit_logs (acao, detalhes, nivel)
    VALUES (
      'auth_failed',
      jsonb_build_object('email', NEW.email, 'ip', NEW.ip_address),
      'warning'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### Suspicious Activity

Monitor for:

- Multiple failed logins from same IP
- Unusual payment amounts
- Rapid subscription changes
- High commission requests

## 📝 Log Retention

### Production Recommendations

- **Application Logs**: 30 days
- **Audit Logs**: 1 year (regulatory requirement)
- **Webhook Logs**: 90 days
- **Error Logs**: 1 year
- **Performance Metrics**: 90 days

### Cleanup Query

```sql
-- Archive old logs (run monthly)
DELETE FROM webhook_logs
WHERE created_at < NOW() - INTERVAL '90 days';

DELETE FROM audit_logs
WHERE nivel IN ('info', 'debug')
  AND created_at < NOW() - INTERVAL '30 days';
```

## 🎓 Best Practices

1. **Structured Logging**
   ```typescript
   console.log('[COMPONENT]', { action, userId, metadata });
   ```

2. **Log Levels**
   - `debug`: Development only
   - `info`: Normal operations
   - `warning`: Recoverable errors
   - `error`: Needs attention

3. **Sensitive Data**
   - Never log passwords
   - Mask email addresses: `u***@example.com`
   - Truncate IDs: `cus_abc...xyz`

4. **Context**
   - Include request ID
   - Add user ID when available
   - Timestamp automatically added

---

## Quick Reference

**View analytics locally:**
```javascript
JSON.parse(localStorage.getItem('analytics_events'))
```

**Check Supabase logs:**
```bash
supabase functions logs stripe-webhook --tail
```

**Query recent errors:**
```sql
SELECT * FROM audit_logs WHERE nivel = 'error' ORDER BY created_at DESC LIMIT 20;
```

**Test error tracking:**
```typescript
throw new Error('Test error for monitoring');
```
