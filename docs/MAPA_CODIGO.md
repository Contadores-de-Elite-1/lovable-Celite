# MAPA DO CODIGO - Lovable-Celite
## Guia Completo de Navegacao do Codebase

**Versao**: 1.0  
**Data**: Novembro 2025  
**Objetivo**: Permitir que qualquer desenvolvedor entenda a estrutura em < 30 minutos

---

## ESTRUTURA DE DIRETORIOS

```
lovable-celite/
├── src/                          # Frontend (React + TypeScript)
│   ├── components/               # Componentes reutilizaveis
│   │   ├── ui/                  # Shadcn/UI components (40+ componentes)
│   │   ├── auth-security/       # Componentes de autenticacao e seguranca
│   │   ├── charts/              # Graficos (Recharts)
│   │   ├── AppSidebar.tsx       # Menu lateral principal
│   │   ├── MobileHeader.tsx     # Header mobile
│   │   ├── PaymentHistory.tsx   # Historico de pagamentos
│   │   └── ProtectedRoute.tsx   # HOC para rotas protegidas
│   │
│   ├── pages/                    # Paginas (rotas)
│   │   ├── Auth.tsx             # Login/Registro
│   │   ├── Dashboard.tsx        # Dashboard principal
│   │   ├── Comissoes.tsx        # Lista de comissoes
│   │   ├── Rede.tsx             # Visualizacao da rede MLM
│   │   ├── Saques.tsx           # Solicitacoes de saque
│   │   ├── LinksIndicacao.tsx   # Geracao de links de indicacao
│   │   ├── Simulador.tsx        # Simulador de ganhos
│   │   ├── Perfil.tsx           # Perfil do contador
│   │   ├── Educacao.tsx         # Conteudo educacional
│   │   ├── Materiais.tsx        # Materiais de marketing
│   │   ├── Assistente.tsx       # Assistente virtual (chatbot)
│   │   ├── Relatorios.tsx       # Relatorios gerenciais
│   │   ├── AdminApprovalsPage.tsx      # Aprovacao de comissoes (admin)
│   │   ├── AdminWithdrawals.tsx        # Aprovacao de saques (admin)
│   │   ├── AuditoriaComissoes.tsx      # Auditoria de comissoes (admin)
│   │   └── AuthSecurityDashboard.tsx   # Dashboard de seguranca (admin)
│   │
│   ├── hooks/                    # Custom React Hooks
│   │   ├── useAuth.tsx          # Hook de autenticacao (context)
│   │   ├── useAuthSecurityStatus.ts  # Status de seguranca
│   │   ├── use-mobile.tsx       # Detecta se e mobile
│   │   └── use-toast.ts         # Hook de toasts (notificacoes)
│   │
│   ├── lib/                      # Bibliotecas e utilitarios
│   │   ├── commission.ts        # Calculo de comissoes (frontend)
│   │   ├── filters.ts           # Filtros e validacoes
│   │   ├── csv.ts               # Exportacao CSV
│   │   ├── utils.ts             # Utilitarios gerais (cn, etc)
│   │   ├── asaas-client.ts      # Cliente ASAAS (API)
│   │   ├── webhook-simulator.ts # Simulador de webhooks (dev)
│   │   └── __tests__/           # Testes unitarios
│   │       ├── commission.test.ts
│   │       ├── filters.test.ts
│   │       ├── csv.test.ts
│   │       └── integration.test.ts
│   │
│   ├── integrations/             # Integracoes externas
│   │   └── supabase/
│   │       ├── client.ts        # Cliente Supabase (singleton)
│   │       └── types.ts         # Tipos do Supabase (gerados)
│   │
│   ├── types/                    # TypeScript types
│   │   ├── auditoria.ts         # Tipos de auditoria
│   │   └── auth-security.ts     # Tipos de auth/seguranca
│   │
│   ├── App.tsx                   # Componente raiz (router)
│   ├── main.tsx                  # Entry point (React DOM)
│   └── index.css                 # Estilos globais (Tailwind)
│
├── supabase/                     # Backend (Supabase)
│   ├── functions/                # Edge Functions (Deno + TypeScript)
│   │   ├── webhook-asaas/       # Processa webhooks do ASAAS
│   │   ├── calcular-comissoes/  # Calcula as 17 bonificacoes
│   │   ├── aprovar-comissoes/   # Aprova comissoes (admin)
│   │   ├── processar-pagamento-comissoes/  # Processa pagamentos (CRON)
│   │   ├── verificar-bonus-ltv/ # Verifica bonus LTV
│   │   ├── send-approval-email/ # Envia email de aprovacao
│   │   ├── asaas-client/        # Cliente ASAAS (backend)
│   │   ├── exec-test-flavio/    # Testes do Flavio (dev)
│   │   └── insert-flavio-data/  # Insere dados de teste (dev)
│   │
│   ├── migrations/               # SQL migrations (schema do banco)
│   │   ├── 20251103234439_*.sql # Tabelas iniciais
│   │   ├── 20251112000100_*.sql # Idempotencia
│   │   ├── 20251112000200_*.sql # RPC executar_calculo_comissoes
│   │   ├── 20251113000100_*.sql # CRON job
│   │   ├── 20251114000000_*.sql # Sistema de aprovacoes
│   │   ├── 20251115000000_*.sql # Solicitacoes de saque
│   │   └── 20251119000000_*.sql # Fix enum tipo_plano
│   │
│   ├── scripts/                  # Scripts de teste e seed
│   │   ├── test-calcular-comissoes.sh
│   │   ├── test-e2e-complete.sh
│   │   ├── test-17-bonus-journey.sh
│   │   └── seed.sql
│   │
│   └── config.toml               # Configuracao do Supabase CLI
│
├── docs/                         # Documentacao
│   ├── PLANO_EPICO_REVISAO_CODIGO.md  # Este plano!
│   ├── MAPA_CODIGO.md            # Este arquivo
│   ├── PRD_LOVABLE_CELITE.md     # PRD do Portal
│   ├── PRD_APP_ONBOARDING.md     # PRD do App Onboarding
│   ├── FRAMEWORK_COMPLETO.md     # Framework completo
│   ├── MIGRACAO_ASAAS_PARA_STRIPE.md
│   ├── FLUXO_DEV1_ONBOARDING.md
│   ├── BASE_DADOS_CONSULTA.md    # Indice mestre
│   └── ... (outros docs)
│
├── package.json                  # Dependencias NPM
├── tsconfig.json                 # Config TypeScript
├── vite.config.ts                # Config Vite
├── tailwind.config.ts            # Config Tailwind CSS
└── README.md                     # Documentacao inicial

```

---

## FLUXO DE DADOS

### FLUXO 1: Cliente paga → Comissoes calculadas

```
1. Cliente paga no ASAAS
        ↓
2. ASAAS envia webhook HTTP POST
        ↓
3. Edge Function: webhook-asaas (Deno)
   - Valida assinatura MD5
   - Valida payload (Zod)
   - Extrai dados do pagamento
        ↓
4. Cria registro em tabela 'pagamentos' (PostgreSQL)
        ↓
5. Chama RPC: executar_calculo_comissoes(pagamento_id)
        ↓
6. Edge Function: calcular-comissoes (Deno)
   - Busca dados do contador
   - Busca dados do sponsor (upline)
   - Calcula 17 bonificacoes
   - Insere em tabela 'comissoes'
        ↓
7. Frontend: Dashboard.tsx (React)
   - Faz query: SELECT * FROM comissoes WHERE contador_id = ?
   - Exibe comissoes em tempo real
```

### FLUXO 2: Contador acessa Dashboard

```
1. Usuario abre /dashboard
        ↓
2. ProtectedRoute verifica autenticacao
   - Se nao autenticado → redirect /auth
   - Se autenticado → continua
        ↓
3. Dashboard.tsx monta
   - useEffect() executa fetchData()
        ↓
4. fetchData() chama Supabase
   - supabase.from('comissoes').select('*')
   - supabase.from('clientes').select('*')
        ↓
5. Supabase RLS aplica politicas
   - Filtra apenas dados do contador logado
   - Retorna dados autorizados
        ↓
6. Dashboard renderiza com dados
   - Cards de comissoes
   - Grafico (Recharts)
   - Lista de clientes
```

### FLUXO 3: Admin aprova comissoes

```
1. Admin acessa /admin/approvals
        ↓
2. AdminApprovalsPage.tsx busca comissoes pendentes
   - SELECT * FROM comissoes WHERE status = 'calculada'
        ↓
3. Admin clica "Aprovar"
        ↓
4. Edge Function: aprovar-comissoes
   - UPDATE comissoes SET status = 'aprovada'
   - INSERT INTO audit_logs (...)
        ↓
5. CRON Job (roda todo dia as 6h AM)
   - SELECT * FROM comissoes WHERE status = 'aprovada'
   - Para cada comissao, faz payout via ASAAS API
   - UPDATE comissoes SET status = 'paga'
```

---

## DEPENDENCIAS ENTRE MODULOS

### Frontend

```
App.tsx
  ├─ AuthProvider (useAuth hook)
  │   └─ Supabase Auth
  │
  ├─ QueryClientProvider (React Query)
  │   └─ Cache de queries
  │
  └─ Router (React Router v6)
      ├─ / → Index.tsx (landing page)
      ├─ /auth → Auth.tsx (login/register)
      ├─ /dashboard → Dashboard.tsx
      │   ├─ useAuth() → verifica se autenticado
      │   ├─ supabase.from('comissoes') → busca dados
      │   └─ components/charts → renderiza graficos
      │
      ├─ /comissoes → Comissoes.tsx
      │   ├─ lib/commission.ts → calcula totais
      │   ├─ lib/filters.ts → filtra por data
      │   └─ components/PaymentHistory → exibe historico
      │
      └─ /rede → Rede.tsx
          └─ supabase.from('rede_contadores') → busca rede MLM
```

### Backend (Edge Functions)

```
webhook-asaas
  ├─ validateAsaasSignature() → valida MD5
  ├─ validarValorMonetario() → valida valor
  ├─ parseCompetencia() → converte data
  └─ supabase.rpc('executar_calculo_comissoes')
      ↓
calcular-comissoes
  ├─ getAccountantLevel() → determina nivel (Bronze/Silver/Gold/Diamond)
  ├─ calculateDirectCommission() → calcula comissao direta
  ├─ calculateOverride() → calcula override
  ├─ calculateProgressionBonus() → calcula bonus progressao
  └─ supabase.from('comissoes').insert()
```

---

## PONTOS CRITICOS (NAO MEXER SEM ENTENDER)

### 1. Edge Function: calcular-comissoes
**Arquivo**: `supabase/functions/calcular-comissoes/index.ts`

**Por que e critico**: Calcula as 17 bonificacoes. Erro aqui = comissoes erradas = processo judicial.

**Funcoes principais**:
- `getAccountantLevel()` - Determina nivel do contador (Bronze/Silver/Gold/Diamond)
- `calculateDirectCommission()` - Calcula comissao direta (15-20%)
- `calculateOverride()` - Calcula override (3-5%)
- `calculateProgressionBonus()` - Calcula bonus de progressao

**Testes**: `src/lib/__tests__/integration.test.ts`

---

### 2. RPC Function: executar_calculo_comissoes
**Arquivo**: `supabase/migrations/20251112000200_create_rpc_executar_calculo_comissoes.sql`

**Por que e critico**: Funcao SQL que orquestra todo o calculo de comissoes.

**O que faz**:
1. Verifica idempotencia (ja calculou?)
2. Busca dados do pagamento
3. Busca dados do contador
4. Busca sponsor (upline)
5. Insere comissoes calculadas
6. Insere audit logs

**IMPORTANTE**: Roda com `SECURITY DEFINER` (privilegios elevados)

---

### 3. Tabela: comissoes
**Schema**: `supabase/migrations/20251103234439_*.sql`

**Colunas principais**:
- `id` (UUID) - PK
- `contador_id` (UUID) - FK para contadores
- `pagamento_id` (UUID) - FK para pagamentos
- `tipo` (TEXT) - ativacao | recorrente | override | bonus_progressao | bonus_volume | bonus_contador
- `valor` (NUMERIC) - Valor da comissao
- `status` (TEXT) - calculada | aprovada | paga | cancelada
- `competencia` (DATE) - Mes de referencia

**RLS Policies**:
- Contador so ve suas proprias comissoes
- Admin ve todas as comissoes

---

### 4. Hook: useAuth
**Arquivo**: `src/hooks/useAuth.tsx`

**Por que e critico**: Gerencia autenticacao em todo o app.

**Funcionalidades**:
- Login/Logout
- Verifica sessao
- Fornece user via Context API
- Redireciona se nao autenticado

**Usado em**: TODAS as paginas protegidas

---

## CONVENCOES DE NOMENCLATURA

### Arquivos
- Componentes: PascalCase (`Dashboard.tsx`, `AppSidebar.tsx`)
- Hooks: camelCase com prefixo `use` (`useAuth.tsx`, `use-mobile.tsx`)
- Utils: camelCase (`commission.ts`, `filters.ts`)
- Types: camelCase (`auditoria.ts`, `auth-security.ts`)

### Variaveis
- Interfaces: PascalCase (`CommissionInput`, `AccountantLevel`)
- Funcoes: camelCase (`calculateTotalCommissions`, `validarValorMonetario`)
- Constantes: SCREAMING_SNAKE_CASE (`ASAAS_API_KEY`, `SUPABASE_URL`)
- Componentes React: PascalCase (`Dashboard`, `PaymentHistory`)

### Database
- Tabelas: snake_case (`comissoes`, `rede_contadores`, `solicitacoes_saque`)
- Colunas: snake_case (`contador_id`, `valor_liquido`, `tipo_comissao`)
- ENUMs: snake_case (`tipo_plano`, `status_comissao`)

---

## FLUXO DE DESENVOLVIMENTO

### 1. Criar nova feature
```bash
# 1. Criar branch
git checkout -b feature/nome-da-feature

# 2. Fazer mudancas
# ... editar arquivos ...

# 3. Testar localmente
npm run dev  # Frontend
supabase functions serve  # Edge Functions

# 4. Rodar testes
npm run test

# 5. Commit
git add .
git commit -m "feat: descricao da feature"

# 6. Push
git push origin feature/nome-da-feature

# 7. Abrir Pull Request no GitHub
```

### 2. Adicionar nova Edge Function
```bash
# 1. Criar funcao
supabase functions new nome-da-funcao

# 2. Editar index.ts
# ... implementar logica ...

# 3. Testar localmente
supabase functions serve nome-da-funcao

# 4. Testar com curl
curl -X POST http://localhost:54321/functions/v1/nome-da-funcao \
  -H "Authorization: Bearer xxx" \
  -d '{"test": "data"}'

# 5. Deploy
supabase functions deploy nome-da-funcao
```

### 3. Criar migration
```bash
# 1. Gerar migration
supabase migration new descricao_da_mudanca

# 2. Editar SQL
# ... escrever SQL ...

# 3. Aplicar localmente
supabase db reset

# 4. Testar
# ... validar que funcionou ...

# 5. Commit migration
git add supabase/migrations/
git commit -m "db: descricao da mudanca"
```

---

## COMANDOS UTEIS

### Frontend
```bash
# Rodar dev server
npm run dev

# Rodar testes
npm run test

# Rodar testes com coverage
npm run test:coverage

# Build para producao
npm run build

# Lint
npm run lint

# Format
npm run format
```

### Backend (Supabase)
```bash
# Iniciar Supabase local
supabase start

# Parar Supabase local
supabase stop

# Aplicar migrations
supabase db reset

# Criar nova migration
supabase migration new nome

# Servir Edge Functions localmente
supabase functions serve

# Deploy Edge Function
supabase functions deploy nome-da-funcao

# Ver logs de Edge Function
supabase functions logs nome-da-funcao
```

---

## TROUBLESHOOTING

### Problema: "Supabase client not initialized"
**Causa**: Cliente Supabase nao foi importado corretamente

**Solucao**:
```typescript
import { supabase } from '@/integrations/supabase/client'
```

---

### Problema: "RLS policy violation"
**Causa**: Row Level Security impediu acesso

**Solucao**:
1. Verificar se usuario esta autenticado
2. Verificar policies em `supabase/migrations/`
3. Usar service_role key se for operacao admin (backend only)

---

### Problema: "Type error: Property does not exist"
**Causa**: TypeScript nao reconhece tipo

**Solucao**:
1. Gerar tipos do Supabase: `supabase gen types typescript`
2. Adicionar interface ou type
3. Usar type assertion se necessario: `data as TipoEsperado`

---

### Problema: "Edge Function timeout"
**Causa**: Funcao demorou > 60 segundos

**Solucao**:
1. Otimizar queries (adicionar indices)
2. Dividir em funcoes menores
3. Usar CRON job para processos longos

---

## PROXIMOS PASSOS PARA NOVOS DEVS

1. **Ler este documento** (voce esta aqui!)
2. **Ler `PRD_LOVABLE_CELITE.md`** (regras de negocio)
3. **Rodar localmente**:
   ```bash
   npm install
   npm run dev  # Frontend
   supabase start  # Backend
   ```
4. **Explorar Dashboard** (http://localhost:8080/dashboard)
5. **Ler codigo dos componentes principais**:
   - `src/App.tsx`
   - `src/pages/Dashboard.tsx`
   - `src/hooks/useAuth.tsx`
6. **Ler Edge Functions**:
   - `supabase/functions/webhook-asaas/`
   - `supabase/functions/calcular-comissoes/`
7. **Fazer primeira contribuicao** (ex: adicionar teste)

---

## AJUDA E SUPORTE

- **Documentacao Supabase**: https://supabase.com/docs
- **Documentacao React**: https://react.dev
- **Documentacao Tailwind**: https://tailwindcss.com
- **Duvidas tecnicas**: Ver `docs/BASE_DADOS_CONSULTA.md`

---

**Ultima atualizacao**: Novembro 2025  
**Mantenedor**: Equipe Lovable-Celite

