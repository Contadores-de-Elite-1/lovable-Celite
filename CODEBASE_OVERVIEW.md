# Lovable-Celite Frontend Codebase Overview

Generated: 2025-11-14
Purpose: Understanding structure and identifying commission-related changes needed for new webhook flow

---

## 1. MAIN APPLICATION STRUCTURE

### Entry Point: `/src/App.tsx`
- **Architecture Pattern**: React Router v6 with protected routes
- **State Management**: TanStack React Query v5 (caching layer)
- **Authentication**: Custom `useAuth` hook (Supabase Auth with context)
- **UI Framework**: shadcn-ui components + Tailwind CSS
- **Providers Stack**:
  - QueryClientProvider (React Query)
  - AuthProvider (Custom auth context)
  - TooltipProvider (shadcn)
  - BrowserRouter (React Router)
  - SidebarProvider (shadcn sidebar)

### Route Structure
```
Public Routes:
  / (Index)
  /auth (Login/Signup)
  /reset-password (Password reset)
  /auth/reset-password

Protected Routes (behind ProtectedRoute component):
  /dashboard (Main dashboard)
  /comissoes (Commission management) ← KEY PAGE
  /saques (Withdrawals)
  /links (Referral links)
  /rede (Network management)
  /simulador (Commission simulator)
  /educacao (Education)
  /materiais (Educational materials)
  /assistente (AI assistant)
  /perfil (User profile) ← KEY PAGE
  /relatorios (Reports)
  /auditoria-comissoes (Commission audit)
  /auth-security (Admin security dashboard)
  /admin/approvals (Admin approvals)
  /admin/withdrawals (Admin withdrawals)
```

---

## 2. COMMISSION-RELATED PAGES & COMPONENTS

### 2.1 Comissoes Page (`/src/pages/Comissoes.tsx`)

**Purpose**: Display all commissions with filtering, export, and withdrawal request

**Key Features**:
- Real-time commission fetching via React Query
- Multi-tab display (Diretas/Overrides/Bônus)
- Date range + status filtering
- CSV export functionality
- Withdrawal request (saque) with confirmation modal
- Responsive grid layout (1 col mobile → 3 cols desktop)

**Data Flow**:
1. Fetches `contadores` table (get contador_id from user)
2. Queries `comissoes` table with nested relations:
   ```
   comissoes.*
   - clientes (nome, cnpj)
   - pagamentos (valor_bruto, pago_em)
   ```
3. Filters using `filterByMultipleCriteria` utility
4. Calculates stats using `calculateCommissionStats`
5. Displays in responsive table with Badge status indicators

**Commission Types Displayed**:
- `ativacao` → "Ativação"
- `recorrente` → "Recorrente"
- `override` → "Override"
- `bonus_progressao` → "Bônus Progressão"
- `bonus_volume` → "Bônus Volume"
- `bonus_ltv` → "Bônus LTV"
- `bonus_contador` → "Bônus Contador"

**Status Badges**:
- `calculada` → Blue badge "Calculada"
- `aprovada` → Yellow badge "Aprovada"
- `paga` → Green badge "Paga"
- `cancelada` → Red badge "Cancelada"

**UI Components Used**:
- Card (from shadcn)
- Tabs (from shadcn)
- Table (from shadcn)
- Badge (from shadcn)
- Button (from shadcn)
- Input (from shadcn)
- Label (from shadcn)
- Dialog (from shadcn)
- Icons: DollarSign, TrendingUp, Clock, Download, Wallet, AlertCircle (lucide-react)
- Animations: framer-motion

**Mobile Responsiveness**:
```tsx
// KPI Cards grid
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

// Filters grid
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
```

**Data Mutations**:
- `handleSolicitarSaque()` → Creates entry in `solicitacoes_saque` table
- Sends to: `/supabase` → `solicitacoes_saque` insert

---

### 2.2 Dashboard Page (`/src/pages/Dashboard.tsx`)

**Purpose**: Overview of user performance with KPIs and 12-month trend

**Commission Data Displayed**:
- Current month total commissions (R$)
- Growth % (vs. previous month)
- 12-month trending chart

**Data Fetching**:
1. `contadores` table (get user's contador_id)
2. `comissoes` table (last 12 months):
   ```
   SELECT valor, competencia, status
   WHERE contador_id = X
   AND competencia >= (12 months ago)
   ```
3. Calculates current month, previous month, growth %

**Chart Library**: Recharts
- LineChart with responsive container
- XAxis (month labels), YAxis (currency)
- Custom tooltip with currency formatter
- Legend

**UI Components**:
- 4-column KPI card grid (responsive)
- Recharts LineChart
- Quick action buttons (navigate to other pages)
- Onboarding info card

**Mobile Responsive**:
```tsx
// KPI cards
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

// Welcome section
<div className="flex flex-col md:flex-row items-start md:items-center justify-between">

// Chart container
<ResponsiveContainer width="100%" height={300}>
```

---

### 2.3 Perfil Page (`/src/pages/Perfil.tsx`)

**Purpose**: User profile management including banking details for commission payouts

**Banking Information Stored** (relevant for webhook):
- `banco` - Bank name
- `agencia` - Branch code
- `conta` - Account number
- `tipo_conta` - Account type (corrente/poupança)
- `titular_conta` - Account holder name
- `chave_pix` - PIX key (email/CPF/phone/random)

**Validation**:
- Requires PIX key OR complete bank details before withdrawals allowed
- Used in `/comissoes` page to validate saque eligibility

**Data Structure**:
```typescript
interface ProfileData {
  nome: string;
  email: string;
  telefone: string;
  cpf_cnpj: string;
  endereco: string;
  cidade: string;
  estado: string;
  cep: string;
  banco: string;
  agencia: string;
  conta: string;
  tipo_conta: "corrente" | "poupanca";
  titular_conta: string;
  chave_pix: string;
  tipo_pessoa: "fisica" | "juridica";
}
```

**Edit/View Modes**:
- View mode: Displays all info in read-only cards
- Edit mode: Form inputs for all fields
- Mutation: `updateMutation.mutate(formData)` → Updates `profiles` table

---

### 2.4 AuditoriaComissoes Page (`/src/pages/AuditoriaComissoes.tsx`)

**Purpose**: Admin-only audit dashboard for commission calculations and approvals

**Features** (Admin view):
- Payouts summary (total, pending, etc.)
- List expected payouts with filters
- Commission diff calculations (shadow vs official)
- Approve multiple commissions

**Data Queries** (RPC functions):
1. `expected_payouts_summary` - Summary cards
2. `list_expected_payouts` - Paginated list
3. `diff_commissions` - Differences between calculations

**Access Control**:
- Checks `has_role('admin')` via RPC before loading

---

## 3. COMMISSION UTILITY LIBRARY

### `/src/lib/commission.ts`

**Purpose**: Centralized commission calculation and formatting logic

**Exported Functions**:

```typescript
// Calculations
calculateTotalCommissions(commissions) → number
calculatePaidCommissions(commissions) → number
calculatePendingCommissions(total, paid) → number
calculateMonthlyAverage(total, months=12) → number
calculateCommissionStats(commissions) → CommissionStats

// Formatting
formatCurrency(value) → string (pt-BR format)
roundToTwoDecimals(value) → number

// Validation
isValidCommissionValue(value) → boolean
validateCommissionData(commission) → boolean
```

**Types**:
```typescript
interface CommissionInput {
  valor: number;
  tipo_comissao: string;
  status_comissao: string;
  competencia: string;
}

interface CommissionStats {
  totalAcumulado: number;
  totalPago: number;
  totalPendente: number;
  mediaMonthly: number;
  totalComissoes: number;
}
```

---

## 4. UI PATTERNS & LIBRARIES

### 4.1 shadcn/ui Components Used
```
ui/card.tsx           - Card containers
ui/button.tsx         - Buttons (variants: default, outline, destructive)
ui/badge.tsx          - Status badges
ui/input.tsx          - Text inputs
ui/label.tsx          - Form labels
ui/table.tsx          - Data tables
ui/tabs.tsx           - Tab navigation
ui/dialog.tsx         - Modals
ui/select.tsx         - Dropdown selects
ui/avatar.tsx         - User avatars
ui/sidebar.tsx        - Navigation sidebar
ui/tooltip.tsx        - Tooltips
ui/accordion.tsx      - Accordion panels
ui/alert-dialog.tsx   - Confirmation dialogs
```

### 4.2 Styling Approach
- **CSS Framework**: Tailwind CSS
- **Component Library**: shadcn/ui (on top of Radix UI)
- **Animations**: framer-motion (motion.div, motion.p, etc.)
- **Icons**: lucide-react

**Color Scheme**:
- Primary: Blue (blue-900, blue-600, blue-700)
- Accent: Yellow (yellow-400, yellow-500)
- Status: Green (success), Yellow (pending), Red (error)
- Background: Gray-50, White
- Borders: Gray-200, Gray-300

**Responsive Classes Pattern**:
```tsx
// 1-column mobile, 2-col tablet, 3-col desktop
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

// Typography scales
<h1 className="text-2xl md:text-3xl">

// Flex layouts
<div className="flex flex-col md:flex-row">
```

---

## 5. STATE MANAGEMENT & DATA FETCHING

### 5.1 React Query Pattern

**Library**: `@tanstack/react-query` v5

**Typical Pattern** (from Comissoes.tsx):
```typescript
const { data: allComissoes, isLoading, refetch: refetchComissoes } = useQuery({
  queryKey: ['comissoes', contador?.id],  // Dependency array for caching
  queryFn: async () => {
    if (!contador) return [];
    const { data } = await supabase
      .from('comissoes')
      .select(`*,clientes (nome, cnpj),pagamentos (...)`)
      .eq('contador_id', contador.id)
      .order('created_at', { ascending: false });
    return data || [];
  },
  enabled: !!contador?.id,  // Don't run query until dependency available
});
```

**Key Patterns**:
- `queryKey` array for smart caching
- `enabled` to prevent unnecessary queries
- `refetch` for manual refresh
- Async `queryFn` with Supabase client
- Error handling in optional `onError` callback

**Mutations** (for updates/inserts):
```typescript
const updateMutation = useMutation({
  mutationFn: async (data) => {
    const { error } = await supabase.from('table').update(data).eq('id', id);
    if (error) throw error;
  },
  onSuccess: () => {
    toast.success('✓ Success!');
    queryClient.invalidateQueries({ queryKey: ['cache-key'] });
  },
  onError: () => toast.error('Error message'),
});

// Usage: updateMutation.mutate(newData);
```

### 5.2 Supabase Client

**Location**: `/src/integrations/supabase/client.ts`

**Usage Pattern**:
```typescript
import { supabase } from '@/integrations/supabase/client';

// Query
const { data, error } = await supabase
  .from('table_name')
  .select('column1, column2, relation(*)')
  .eq('filter_column', value)
  .single();

// Insert
const { error } = await supabase
  .from('table_name')
  .insert({ field: value });

// Update
const { error } = await supabase
  .from('table_name')
  .update({ field: newValue })
  .eq('id', id);

// RPC (Remote Procedure Call - database functions)
const { data } = await supabase.rpc('function_name', { param: value });
```

---

## 6. HOOKS & CUSTOM LOGIC

### 6.1 useAuth Hook (`/src/hooks/useAuth.tsx`)

**Purpose**: Authentication context and state management

**Provides**:
```typescript
interface AuthContextType {
  user: User | null;          // Supabase auth user
  session: Session | null;    // Auth session
  signIn: (email, password) => Promise
  signUp: (email, password, nome) => Promise
  signOut: () => Promise<void>
  loading: boolean;
}

const { user, session, signIn, signUp, signOut, loading } = useAuth();
```

**Implementation**:
- Uses Supabase auth listeners
- Initializes auth state on mount
- Persists session automatically
- Wraps entire app in AuthProvider

---

## 7. MOBILE RESPONSIVENESS APPROACH

### Mobile-First Strategy
**Implementation**: Tailwind's responsive prefixes with mobile base

**Breakpoints Used**:
- `sm:` - Small (640px)
- `md:` - Medium (768px)
- `lg:` - Large (1024px)
- `xl:` - Extra large (1280px)

**Mobile Header** (`src/components/MobileHeader.tsx`):
```tsx
<header className="fixed top-0 left-0 right-0 z-50 h-14 bg-background/95 
  backdrop-blur border-b md:hidden">  // Hidden on md+ screens
  {/* Mobile-only header content */}
</header>
```

**Main Content Area** (from App.tsx):
```tsx
<main className="flex-1 pt-14 md:pt-0">  // pt-14 for mobile header space
  {/* Routes */}
</main>
```

**Responsive Grids**:
```
1 column (mobile)
↓
2 columns (tablet/sm)
↓
3-4 columns (desktop/lg)
```

**Sidebar Behavior**:
- Visible on desktop (md+)
- Collapsible on mobile
- Controlled by `useSidebar` hook

---

## 8. REAL-TIME DATA FETCHING PATTERNS

### Pattern 1: Eager Load on Component Mount
```typescript
useEffect(() => {
  loadData();
}, [user]);  // Dependency: user changes → reload
```

### Pattern 2: Query with Dependencies
```typescript
const { data: comissoes } = useQuery({
  queryKey: ['comissoes', contador?.id],  // Changes → automatic refetch
  enabled: !!contador?.id,                 // Skip until ready
});
```

### Pattern 3: Manual Refresh
```typescript
const { refetch } = useQuery({...});
// Later:
refetch(); // Manually trigger query
```

### Pattern 4: Conditional Queries
```typescript
// Only fetch if condition is true
enabled: isAdmin === true  // Won't run if undefined or false
```

### No WebSockets/Real-time Subscriptions
- Current implementation uses polling via React Query
- No Supabase real-time listeners configured
- Data updates on page navigation or manual refetch
- **IMPLICATION**: Webhook updates won't appear live until refetch

---

## 9. COMMISSION DATA STRUCTURE

### Comissoes Table Join Pattern
```typescript
// What Comissoes.tsx fetches:
const { data } = await supabase
  .from('comissoes')
  .select(`
    *,
    clientes (nome, cnpj),
    pagamentos (valor_bruto, pago_em)
  `)
  .eq('contador_id', contador.id)
  .order('created_at', { ascending: false });

// Result object:
{
  id: string;
  contador_id: string;
  cliente_id: string;
  valor: number;
  tipo_comissao: string;  // ativacao, recorrente, override, bonus_*
  status_comissao: string; // calculada, aprovada, paga, cancelada
  competencia: string;    // Date field
  created_at: string;
  clientes: {
    nome: string;
    cnpj: string;
  };
  pagamentos: {
    valor_bruto: number;
    pago_em: string | null;
  };
}
```

---

## 10. RECOMMENDED CHANGES FOR NEW WEBHOOK FLOW

### Issue Analysis
**Current Limitation**: No real-time commission updates when webhooks create/modify data

### Recommended Changes

#### 10.1 Add Real-time Subscriptions
```typescript
// In Comissoes.tsx component
useEffect(() => {
  const channel = supabase
    .channel(`comissoes:${contador?.id}`)
    .on(
      'postgres_changes',
      {
        event: '*',  // INSERT, UPDATE, DELETE
        schema: 'public',
        table: 'comissoes',
        filter: `contador_id=eq.${contador?.id}`
      },
      (payload) => {
        // Auto-refetch when comissoes change
        refetchComissoes();
        // Or invalidate cache: queryClient.invalidateQueries(...)
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, [contador?.id]);
```

#### 10.2 Add Toast Notifications for Webhook Events
```typescript
// Subscribe to webhook_logs for status updates
useEffect(() => {
  const channel = supabase
    .channel(`webhook:${user?.id}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'webhook_logs',
        filter: `user_id=eq.${user?.id}`
      },
      (payload) => {
        if (payload.new.status === 'processed') {
          toast.success(`✓ ${payload.new.message}`);
        } else if (payload.new.status === 'error') {
          toast.error(`✗ ${payload.new.error}`);
        }
      }
    )
    .subscribe();

  return () => supabase.removeChannel(channel);
}, [user?.id]);
```

#### 10.3 Add Refetch Button to Comissoes Page
```tsx
<Button 
  onClick={() => refetchComissoes()}
  className="bg-blue-600 hover:bg-blue-700"
>
  <RefreshCw className="h-4 w-4 mr-2" />
  Atualizar Comissões
</Button>
```

#### 10.4 Add Status Change UI
```tsx
// Show commission status transitions
const getStatusIcon = (status: string) => {
  switch(status) {
    case 'calculada': return <Clock className="w-4 h-4 text-yellow-500" />;
    case 'aprovada': return <CheckCircle className="w-4 h-4 text-blue-500" />;
    case 'paga': return <CheckCircle2 className="w-4 h-4 text-green-500" />;
    default: return null;
  }
};
```

#### 10.5 Configure QueryClient for Webhook Retry
```typescript
// In App.tsx
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 1000 * 60 * 5,  // 5 minutes
      gcTime: 1000 * 60 * 10,     // 10 minutes
    },
    mutations: {
      retry: 1,
    },
  },
});
```

---

## 11. FILE STRUCTURE SUMMARY

```
lovable-Celite/src/
├── App.tsx                          # Main router, providers
├── pages/
│   ├── Comissoes.tsx               # Commission display ★ KEY
│   ├── Dashboard.tsx               # Overview with charts
│   ├── Perfil.tsx                  # Profile & banking info ★ KEY
│   ├── AuditoriaComissoes.tsx      # Admin audit dashboard
│   ├── Auth.tsx                    # Login/signup
│   ├── Saques.tsx                  # Withdrawal requests
│   ├── Rede.tsx                    # Network management
│   └── [other pages...]
├── components/
│   ├── ui/                         # shadcn components
│   ├── AppSidebar.tsx             # Navigation sidebar
│   ├── MobileHeader.tsx           # Mobile-only header
│   ├── ProtectedRoute.tsx         # Route guard
│   └── PaymentHistory.tsx
├── hooks/
│   ├── useAuth.tsx                # Auth context ★ KEY
│   └── useAuthSecurityStatus.ts
├── lib/
│   ├── commission.ts              # Commission utilities ★ KEY
│   ├── filters.ts                 # Filtering logic
│   ├── csv.ts                     # CSV export
│   └── [other utilities]
├── integrations/
│   └── supabase/
│       ├── client.ts              # Supabase init ★ KEY
│       └── types.ts               # Auto-generated types
├── types/
│   ├── auditoria.ts              # Admin dashboard types
│   └── [other types]
└── index.css                       # Tailwind styles
```

---

## 12. KEY TECHNICAL DECISIONS

| Aspect | Choice | Rationale |
|--------|--------|-----------|
| **State Management** | React Query | Simplicity + built-in caching |
| **UI Components** | shadcn/ui | Customizable + Tailwind first |
| **Styling** | Tailwind CSS | Mobile-first, utility-based |
| **Auth** | Supabase Auth | Built-in, minimal setup |
| **Database** | Supabase | Real-time ready, PostgreSQL |
| **Animation** | framer-motion | Smooth, performant |
| **Charts** | Recharts | Responsive, React-native |
| **Icons** | lucide-react | Consistent, tree-shakeable |
| **Real-time** | None (yet) | Polling via refetch currently |

---

## 13. TESTING & VALIDATION

### Commission Page Test Scenarios
1. Display all commission types correctly
2. Filter by date range works
3. Filter by status works
4. CSV export generates valid file
5. Withdrawal request validates minimum (R$100)
6. Withdrawal validates banking info
7. Responsive layout on mobile (< 768px)
8. Responsive layout on tablet (768-1024px)
9. Responsive layout on desktop (> 1024px)

### Webhook Integration Tests
1. New commission appears after webhook processed
2. Status changes reflect immediately (if real-time added)
3. Toast notifications show on updates
4. Errors display proper error messages
5. Refetch button works manually

---

## 14. DEPLOYMENT & BUILDING

### Build Commands
```bash
cd lovable-Celite
npm run build          # Production build
npm run build:dev      # Dev build (unminified)
npm run dev           # Development server
npm run preview       # Preview production build
npm run lint          # ESLint
npm run test          # Vitest
```

### Production Build Output
- Vite-bundled React app
- Tree-shaken shadcn components
- Tailwind CSS purged
- Deployed to Lovable platform

---

## 15. NEXT STEPS FOR INTEGRATION

1. **Add Real-time Subscriptions** to Comissoes.tsx
2. **Implement Toast Notifications** for webhook events
3. **Create Webhook Event Type** in types/ folder
4. **Test Webhook → UI Flow** with manual trigger
5. **Add Refetch UI Controls** on relevant pages
6. **Monitor Query Caching** with React DevTools
7. **Update Commission Filters** if new statuses added
8. **Ensure Mobile Layout** still responsive with changes

---

**End of Codebase Overview**

Generated by Claude Code Analysis
For: lovable-Celite Frontend Integration with New Webhook Flow
