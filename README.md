# Contadores de Elite

Sistema de gestão de comissões para contadores com rede multinível e integração Stripe.

## 🚀 Quick Start

**Opção 1: Script Automático (Recomendado)**

```bash
./quick-start.sh
```

**Opção 2: Manual**

```bash
# 1. Instalar dependências
npm install

# 2. Copiar arquivo de ambiente
cp .env.example .env

# 3. Iniciar Supabase local
supabase start

# 4. Ver credenciais
supabase status

# 5. Editar .env com as credenciais

# 6. Iniciar aplicação
npm run dev
```

Aplicação disponível em: http://localhost:8080

## 📋 Pré-requisitos

- Node.js 18+ - [instalar com nvm](https://github.com/nvm-sh/nvm)
- Supabase CLI - [instalar](https://supabase.com/docs/guides/cli)
- Git

## 🛠️ Comandos Disponíveis

```bash
npm run dev          # Servidor de desenvolvimento
npm run build        # Build de produção
npm run preview      # Preview do build
npm test             # Executar testes
supabase start       # Iniciar Supabase local
supabase status      # Ver status e credenciais
supabase db reset    # Resetar banco de dados
```

## 📁 Estrutura do Projeto

```
lovable-Celite/
├── src/
│   ├── pages/              # Páginas da aplicação
│   ├── components/         # Componentes reutilizáveis
│   ├── hooks/              # Custom React hooks
│   ├── lib/                # Utilitários e helpers
│   └── integrations/       # Integrações (Supabase, etc)
├── supabase/
│   ├── migrations/         # Migrações do banco
│   └── functions/          # Edge Functions
├── PRODUCTION-CHECKLIST.md # Checklist de deploy
├── MONITORING-LOGGING.md   # Guia de monitoramento
└── AUTO-MODE-SUMMARY.md    # Resumo de features
```

## 🔧 Configuração

### Ambiente Local

1. Execute `supabase start`
2. Execute `supabase status` para ver credenciais
3. Copie as credenciais para `.env`:

```env
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Produção

Ver `PRODUCTION-CHECKLIST.md` para deployment completo.

## 🎯 Features

✅ Sistema de comissões multinível (5 níveis)
✅ Integração completa com Stripe
✅ Analytics e tracking de funel
✅ Acessibilidade (WCAG AA)
✅ Mobile-first responsive
✅ Offline detection
✅ Error recovery automático
✅ Code splitting e lazy loading
✅ Environment validation

## 📚 Documentação

- **[CLAUDE.md](./CLAUDE.md)** - Visão geral do projeto
- **[PRODUCTION-CHECKLIST.md](./PRODUCTION-CHECKLIST.md)** - Checklist de deploy (100+ itens)
- **[MONITORING-LOGGING.md](./MONITORING-LOGGING.md)** - Monitoramento e logs
- **[AUTO-MODE-SUMMARY.md](./AUTO-MODE-SUMMARY.md)** - Resumo de features implementadas

## 🚢 Deploy

### Desenvolvimento via Lovable

**URL**: https://lovable.dev/projects/ec352023-a482-4d12-99c5-aac2bf71f1db

Changes made via Lovable will be committed automatically to this repo.

### Produção

```bash
# 1. Build
npm run build

# 2. Deploy (Vercel/Netlify/etc)
# Siga o guia em PRODUCTION-CHECKLIST.md
```

## 🔒 Segurança

- RLS (Row Level Security) habilitado em todas as tabelas
- Validação de environment variables ao iniciar
- CSP headers configurados
- Secrets gerenciados via Supabase
- Nunca commitar .env

## 🎓 Como Editar

**Use Lovable**

Visit the [Lovable Project](https://lovable.dev/projects/ec352023-a482-4d12-99c5-aac2bf71f1db) and start prompting.

**Use your preferred IDE**

Clone this repo and push changes. Pushed changes will also be reflected in Lovable.

```sh
git clone <YOUR_GIT_URL>
cd lovable-Celite
npm install
./quick-start.sh
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/ec352023-a482-4d12-99c5-aac2bf71f1db) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
