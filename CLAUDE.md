# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Contadores de Elite** is a React + TypeScript web application for managing a commission system for accountants ("contadores"). It integrates with Supabase for backend/authentication and Stripe for payment processing.

- **Frontend**: React 18 + Vite, shadcn-ui, Tailwind CSS, TypeScript
- **Backend**: Supabase (PostgreSQL, Auth, Functions, RLS)
- **Payments**: Stripe payment gateway integration
- **Structure**: `/lovable-Celite/` contains the main app; `/supabase/` contains DB migrations and serverless functions

## Common Development Commands

```sh
# Install dependencies (run from project root)
npm i

# Start development server (runs on http://localhost:8080)
cd lovable-Celite && npm run dev

# Build for production
cd lovable-Celite && npm run build

# Build in development mode (unminified)
cd lovable-Celite && npm run build:dev

# Lint code
cd lovable-Celite && npm lint

# Preview production build locally
cd lovable-Celite && npm run preview

# Start Supabase local development
supabase start

# Check Supabase status
supabase status

# Stop Supabase
supabase stop

# Database operations
supabase db pull     # Pull schema from cloud
supabase db push     # Push migrations to local/cloud
supabase db reset    # Reset local database

# Deploy functions to Supabase
supabase functions deploy <function-name>
```

## Project Architecture

### Frontend Structure

```
lovable-Celite/src/
├── pages/              # Page components (dashboard, comissões, etc.)
├── components/         # Reusable UI components
│   ├── ui/            # shadcn-ui components (card, button, etc.)
│   ├── ProtectedRoute.tsx
│   ├── AppSidebar.tsx
│   └── MobileHeader.tsx
├── hooks/              # Custom React hooks
│   ├── useAuth.tsx    # Auth context & provider
│   └── useAuthSecurityStatus.ts
├── integrations/       # External service clients
│   └── supabase/
│       ├── client.ts  # Supabase client initialization
│       └── types.ts   # Auto-generated types from DB schema
├── types/              # TypeScript type definitions
├── lib/                # Utility functions
└── App.tsx             # Main app with routing & providers
```

### Routing

Routes are defined in `App.tsx`:
- `GET /` - Landing page (public)
- `GET /auth` - Login/signup
- `GET /reset-password` - Password reset
- `GET /dashboard` - Main dashboard (protected)
- `GET /comissoes` - Commission management
- `GET /links` - Referral links
- `GET /rede` - Network management
- `GET /simulador` - Commission simulator
- `GET /educacao` - Education resources
- `GET /materiais` - Educational materials
- `GET /assistente` - AI assistant
- `GET /perfil` - User profile
- `GET /relatorios` - Reports
- `GET /auditoria-comissoes` - Commission audit logs
- `GET /auth-security` - Security dashboard (admin)

All protected routes require authentication via `ProtectedRoute` component.

### Authentication Flow

**Authentication** is managed through the `useAuth` hook (`src/hooks/useAuth.tsx`):
- Uses Supabase Auth (email/password)
- Provides context with: `user`, `session`, `signIn()`, `signUp()`, `signOut()`, `loading`
- Auto-refreshes tokens with `autoRefreshToken: true`
- Persists session in localStorage

**Authorization** is handled via Supabase RLS (Row Level Security) policies on database tables.

### Backend: Supabase & Database

**Database Schema** (13 migrations):
- `profiles` - User profile data
- `user_roles` - Role assignments (admin, contador, suporte)
- `contadores` - Accountant data (nível, status, clientes_ativos, xp)
- `clientes` - Client companies (linked to contadores)
- `rede_contadores` - Multi-level network (up to 5 levels)
- `invites` - Referral invites
- `indicacoes` - Referral tracking
- `pagamentos` - Payment records (Stripe integration)
- `comissoes` - Commission records
- `bonus_historico` - Bonus history
- `conquistas` - Gamification achievements
- `eventos` - Events & check-ins
- `audit_logs` - Audit trail
- `webhook_logs` - Webhook event logs
- `lgpd_requests` - LGPD data requests

**Key Features**:
- RLS enabled on all tables
- ENUM types for controlled values (nivel, status, tipo_plano, etc.)
- Triggers auto-update `updated_at` timestamps
- Triggers auto-create user profiles on auth signup
- Triggers maintain `clientes_ativos` count

**Serverless Functions** (`supabase/functions/`):
- `webhook-stripe/` - Handles Stripe payment webhooks
- `create-checkout-session/` - Creates Stripe checkout sessions
- `calcular-comissoes/` - Calculates commissions (called by webhook)
- `processar-pagamento-comissoes/` - Processes payment thresholds
- `verificar-bonus-ltv/` - Verifies LTV bonuses
- `aprovar-comissoes/` - Approves calculated commissions
- `health-check/` - System health monitoring

**RPC Functions** (in migrations):
- `executar_calculo_comissoes()` - Transactional commission calculation with idempotency
- `cron_processar_pagamento_comissoes()` - CRON job runs day 25 of each month to process commissions >= R$100

### Stripe Integration

**Payment Flow**:
1. Frontend creates checkout session via `create-checkout-session` edge function
2. User completes payment on Stripe Checkout page
3. Stripe sends webhook events to `webhook-stripe` function:
   - `checkout.session.completed` - Session finalized
   - `customer.subscription.created` - Subscription created
   - `invoice.payment_succeeded` - Payment confirmed (TRIGGERS COMMISSION CALCULATION)
   - `customer.subscription.updated` - Subscription status changed
   - `customer.subscription.deleted` - Subscription cancelled
4. Function triggers `calcular-comissoes` to compute commissions
5. Commissions stored in `comissoes` table with status 'calculada'
6. On day 25, CRON job processes approved commissions (>= R$100)

**Database Fields** (in `clientes` & `pagamentos`):
- `stripe_customer_id` - Stripe customer reference (cus_xxx)
- `stripe_subscription_id` - Stripe subscription reference (sub_xxx)
- `stripe_price_id` - Stripe price/plan reference (price_xxx)
- `stripe_payment_id` - Stripe payment intent ID (pi_xxx) - unique constraint for idempotency
- `stripe_charge_id` - Stripe charge ID (ch_xxx)
- `moeda` - Payment currency (BRL, USD, EUR, etc.)
- `metodo_pagamento` - Payment method (card, pix, boleto, etc.)
- `card_brand` - Card brand (visa, mastercard, etc.)
- `card_last4` - Last 4 digits of card
- `customer_id` - Customer ID in payment gateway
- `order_id` - Order/invoice ID
- `metadata` - Additional payment metadata (JSONB)

**Webhook Configuration**:
- Webhook URL: `https://zytxwdgzjqrcmbnpgofj.supabase.co/functions/v1/webhook-stripe`
- Secrets configured via Supabase CLI:
  ```bash
  supabase secrets set STRIPE_SECRET_KEY=sk_test_... # or sk_live_...
  supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
  supabase secrets set STRIPE_PUBLISHABLE_KEY=pk_test_... # or pk_live_...
  ```
- No JWT verification (`verify_jwt = false` in `config.toml`) - Stripe signature validation used instead

**Commission Calculation Trigger**:
- Event: `invoice.payment_succeeded` (handled in `webhook-stripe/index.ts:305-437`)
- Determines payment type: `ativacao` (first payment) or `recorrente` (recurring)
- Registers payment in `pagamentos` table with full Stripe metadata
- Invokes `calcular-comissoes` edge function with payment details
- Idempotency guaranteed by unique constraint on `stripe_payment_id`

### Key Business Logic

**Commission Types** (enum `tipo_comissao`):
- `ativacao` - One-time activation fee
- `recorrente` - Monthly recurring
- `override` - Manager override bonus
- `bonus_progressao` - Level progression bonus
- `bonus_ltv` - Lifetime value bonus
- `bonus_rede` - Network bonus
- `lead_diamante` - Diamond tier lead bonus

**Contador Levels** (enum `nivel_contador`):
- `bronze`, `prata`, `ouro`, `diamante`

**Client Status** (enum `status_cliente`):
- `lead` - Prospect
- `ativo` - Active subscription
- `cancelado` - Cancelled
- `inadimplente` - Delinquent

## Configuration

### Environment Variables

The app uses Supabase credentials (auto-generated in `client.ts` or from environment):
- Local dev uses `localhost:54321` (Supabase CLI)
- Production uses cloud instance at `zytxwdgzjqrcmbnpgofj.supabase.co`

Never commit `.env` files with secrets (included in `.gitignore`).

### Lovable Integration

This project is tied to Lovable (https://lovable.dev/projects/ec352023-a482-4d12-99c5-aac2bf71f1db):
- Frontend changes via Lovable auto-commit to this repo
- Backend/DB changes managed via this repo and pushed to Lovable

## Key Files to Know

- `lovable-Celite/src/App.tsx` - Main routing & provider setup
- `lovable-Celite/src/hooks/useAuth.tsx` - Authentication context
- `lovable-Celite/src/integrations/supabase/client.ts` - Supabase client
- `lovable-Celite/src/integrations/supabase/types.ts` - Auto-generated DB types
- `supabase/migrations/` - Database schema versions
- `supabase/functions/*/index.ts` - Serverless function handlers
- `supabase/config.toml` - Local Supabase config

## Common Development Patterns

### Using Supabase in Components

```tsx
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

// Simple query
const { data, isLoading } = useQuery({
  queryKey: ['contadores'],
  queryFn: async () => {
    const { data, error } = await supabase
      .from('contadores')
      .select('*');
    if (error) throw error;
    return data;
  }
});
```

### Using useAuth Hook

```tsx
import { useAuth } from "@/hooks/useAuth";

export function MyComponent() {
  const { user, session, signOut, loading } = useAuth();

  if (loading) return <div>Loading...</div>;
  if (!user) return <div>Not authenticated</div>;

  return <div>Hello {user.email}</div>;
}
```

### Adding New Pages

1. Create `lovable-Celite/src/pages/MyPage.tsx`
2. Add route to `App.tsx`:
   ```tsx
   <Route path="/mypage" element={<MyPage />} />
   ```
3. Add sidebar link in `AppSidebar.tsx` if needed

## Important Notes

- **Type Safety**: Always import types from `@/integrations/supabase/types.ts`
- **RLS**: All database queries respect RLS policies - ensure user has proper role
- **Idempotency**: Commission calculations use unique constraints to prevent duplicates
- **Local Testing**: Use `supabase start` for local dev, not cloud instance
- **Migrations**: Always create new migration files (never edit existing ones)
- **Functions**: Deploy with `supabase functions deploy <name>` after changes

## Debugging Tips

1. **Supabase Logs**: `supabase logs --function <name>`
2. **Database Logs**: Check `audit_logs` table for actions
3. **Webhook Logs**: Check `webhook_logs` table for Asaas events
4. **Browser DevTools**: Check Network tab for API requests
5. **RLS Errors**: Usually "new row violates row-level security policy" - check role & policies
