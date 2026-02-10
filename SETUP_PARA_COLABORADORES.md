# 🚀 Setup do Projeto Lovable-Celite para Colaboradores

**Guia completo para você e seu colaborador começarem a trabalhar no projeto**

---

## 📋 Índice

1. [Pré-requisitos](#pré-requisitos)
2. [Opção A: GitHub Codespaces (Recomendado)](#opção-a-github-codespaces-recomendado)
3. [Opção B: Setup Local](#opção-b-setup-local)
4. [Configuração das Variáveis de Ambiente](#configuração-das-variáveis-de-ambiente)
5. [Testando a Instalação](#testando-a-instalação)
6. [Trabalhando em Equipe](#trabalhando-em-equipe)
7. [Comandos Úteis](#comandos-úteis)
8. [Troubleshooting](#troubleshooting)

---

## 🎯 Pré-requisitos

### Ferramentas Necessárias

- **Git**: [Download](https://git-scm.com/)
- **Node.js** (v18 ou superior): [Download](https://nodejs.org/)
- **pnpm** (gerenciador de pacotes):
  ```bash
  npm install -g pnpm
  ```
- **Conta GitHub**: Para clonar o repositório
- **Conta Supabase**: Para acessar o banco de dados

### Acessos Necessários

- ✅ Repositório do projeto no GitHub
- ✅ Credenciais do Supabase (URL + Keys)
- ✅ Credenciais do Stripe (opcional, para testes de pagamento)
- ✅ Credenciais do ASAAS (opcional, para testes de pagamento)

---

## 🌟 Opção A: GitHub Codespaces (Recomendado)

**A forma mais rápida e sem dores de cabeça!**

### Vantagens
- ✅ Setup automático (3 minutos)
- ✅ Ambiente consistente para todos
- ✅ Sem problemas com Docker/Supabase local
- ✅ 120 horas grátis por mês

### Passo a Passo

1. **Acesse o repositório no GitHub**
   ```
   https://github.com/Contadores-de-Elite-1/lovable-Celite
   ```

2. **Crie um Codespace**
   - Clique em **Code** (botão verde)
   - Selecione **Codespaces**
   - Clique em **Create codespace on main**

3. **Aguarde o Setup Automático** (~3 minutos)
   - Node.js e dependências instaladas
   - Supabase CLI configurado
   - Migrations aplicadas
   - Ambiente pronto!

4. **Configure as Variáveis de Ambiente**
   - Crie o arquivo `.env.local`:
     ```bash
     cp .env.example .env.local
     ```
   - Edite com suas credenciais (veja seção [Configuração das Variáveis](#configuração-das-variáveis-de-ambiente))

5. **Inicie o Servidor de Desenvolvimento**
   ```bash
   pnpm dev
   ```
   - O servidor rodará na porta **8080**
   - Acesse via URL fornecida pelo Codespaces

6. **Pronto!** 🎉

Para mais detalhes, consulte: [CODESPACES_SETUP.md](./CODESPACES_SETUP.md)

---

## 💻 Opção B: Setup Local

**Para quem prefere trabalhar na própria máquina**

### Passo 1: Clonar o Repositório

```bash
# Clone o repositório
git clone https://github.com/Contadores-de-Elite-1/lovable-Celite.git

# Entre no diretório
cd lovable-Celite

# Alterne para a branch de desenvolvimento (se necessário)
git checkout develop
```

### Passo 2: Instalar Dependências

```bash
# Instalar dependências do projeto (use pnpm EXCLUSIVAMENTE)
pnpm install
```

**⚠️ IMPORTANTE**: Sempre use `pnpm`, nunca `npm` ou `yarn`!

### Passo 3: Configurar Supabase Local (Opcional)

Se quiser rodar o Supabase localmente:

```bash
# Instalar Supabase CLI
npm install -g supabase

# Login no Supabase
npx supabase login

# Link com o projeto (se já existir na cloud)
npx supabase link --project-ref SEU_PROJECT_REF

# OU iniciar localmente
npx supabase init
npx supabase start

# Aplicar migrations
npx supabase db push
```

**URLs locais do Supabase:**
- API: `http://localhost:54321`
- Studio: `http://localhost:54323`
- Database: `postgresql://postgres:postgres@localhost:54322/postgres`

### Passo 4: Configurar Variáveis de Ambiente

```bash
# Crie o arquivo .env.local
touch .env.local
```

Veja a próxima seção para preencher as variáveis.

### Passo 5: Iniciar o Servidor de Desenvolvimento

```bash
# Inicia na porta 8080
pnpm dev
```

Acesse: `http://localhost:8080`

---

## 🔐 Configuração das Variáveis de Ambiente

Crie um arquivo `.env.local` na raiz do projeto:

```env
# ===============================================
# SUPABASE
# ===============================================
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anon-aqui

# Para uso em Edge Functions (servidor)
SUPABASE_SERVICE_ROLE_KEY=sua-chave-service-role-aqui

# ===============================================
# STRIPE (Pagamentos)
# ===============================================
VITE_STRIPE_PUBLIC_KEY=pk_test_sua-chave-publica
STRIPE_SECRET_KEY=sk_test_sua-chave-secreta
STRIPE_WEBHOOK_SECRET=whsec_sua-webhook-secret

# ===============================================
# ASAAS (Pagamentos - Fallback)
# ===============================================
ASAAS_API_KEY=sua-api-key-asaas
ASAAS_WEBHOOK_TOKEN=seu-webhook-token

# ===============================================
# AMBIENTE
# ===============================================
VITE_APP_ENV=development
NODE_ENV=development
```

### Onde Obter as Credenciais

1. **Supabase**:
   - Vá para: https://app.supabase.com
   - Selecione seu projeto
   - Settings → API → Copy as environment variables

2. **Stripe**:
   - Vá para: https://dashboard.stripe.com
   - Developers → API Keys

3. **ASAAS**:
   - Vá para: https://www.asaas.com/
   - Configurações → API

### ⚠️ Segurança

- **NUNCA** commite o arquivo `.env.local` no Git
- Compartilhe as credenciais de forma segura (1Password, LastPass, etc)
- Use chaves de **teste** no desenvolvimento
- Use chaves de **produção** APENAS em produção

---

## ✅ Testando a Instalação

### Teste 1: Verificar se o Frontend Inicia

```bash
pnpm dev
```

**Resultado esperado:**
```
VITE v5.4.19  ready in 2345 ms

➜  Local:   http://localhost:8080/
➜  Network: use --host to expose
```

### Teste 2: Verificar TypeScript

```bash
pnpm lint
```

**Resultado esperado:** Sem erros críticos

### Teste 3: Rodar Testes Unitários

```bash
pnpm test
```

### Teste 4: Verificar Conexão com Supabase

Acesse: `http://localhost:8080`

- Tente fazer login
- Verifique se não há erros no console do navegador

### Teste 5: Rodar E2E Tests (Se estiver no Codespaces ou local com Supabase)

```bash
bash supabase/scripts/run-e2e-local.sh
```

**Resultado esperado:** ✅ TODOS OS TESTES PASSARAM!

---

## 👥 Trabalhando em Equipe

### Workflow Git Recomendado

```bash
# 1. Sempre atualize antes de começar
git pull origin main

# 2. Crie uma branch para sua tarefa
git checkout -b feature/nome-da-feature

# 3. Trabalhe e commite frequentemente
git add .
git commit -m "feat: adiciona nova funcionalidade X"

# 4. Envie para o repositório remoto
git push origin feature/nome-da-feature

# 5. Abra um Pull Request no GitHub
# - Peça revisão do colaborador
# - Após aprovação, faça merge para main
```

### Convenção de Commits (Seguir!)

```bash
# Feature nova
git commit -m "feat: adiciona calculadora de comissões"

# Correção de bug
git commit -m "fix: corrige cálculo de comissão sobre valor líquido"

# Documentação
git commit -m "docs: atualiza README com instruções de setup"

# Refatoração
git commit -m "refactor: reorganiza componentes de onboarding"

# Testes
git commit -m "test: adiciona testes para webhook ASAAS"

# Estilo (formatação)
git commit -m "style: formata código com Prettier"
```

### Sincronização Constante

```bash
# A cada dia, antes de começar:
git checkout main
git pull origin main
git checkout sua-branch
git merge main  # ou git rebase main (se preferir)

# Resolve conflitos se houver
# Testa se está tudo funcionando
pnpm dev
```

### Comunicação

**Use Issues do GitHub para:**
- Reportar bugs
- Propor novas features
- Discutir arquitetura

**Use Pull Requests para:**
- Revisar código
- Discutir implementação
- Documentar decisões

---

## 🛠️ Comandos Úteis

### Desenvolvimento

```bash
# Iniciar servidor de desenvolvimento (porta 8080)
pnpm dev

# Build para produção
pnpm build

# Preview do build de produção
pnpm preview

# Rodar linter
pnpm lint
```

### Testes

```bash
# Rodar todos os testes
pnpm test

# Testes com UI interativa
pnpm test:ui

# Testes com cobertura
pnpm test:coverage

# E2E tests (requer Supabase local)
bash supabase/scripts/run-e2e-local.sh
```

### Supabase

```bash
# Ver status do Supabase
supabase status

# Aplicar migrations
supabase db push

# Ver diff antes de aplicar
supabase db push --dry-run

# Resetar banco de dados (CUIDADO!)
supabase db reset

# Ver logs de uma Edge Function
supabase functions logs webhook-asaas

# Deploy de Edge Function
supabase functions deploy calcular-comissoes
```

### Git

```bash
# Ver status
git status

# Ver histórico
git log --oneline --graph --all

# Ver branches
git branch -a

# Trocar de branch
git checkout nome-da-branch

# Criar nova branch
git checkout -b feature/nova-feature

# Ver diferenças
git diff

# Ver arquivos modificados
git diff --name-only
```

---

## 🆘 Troubleshooting

### Problema: `pnpm: command not found`

**Solução:**
```bash
npm install -g pnpm
```

### Problema: Porta 8080 já está em uso

**Solução:**
```bash
# Mata processo na porta 8080
kill -9 $(lsof -ti:8080)

# OU use outra porta
pnpm dev --port 3000
```

### Problema: Erro de conexão com Supabase

**Verifique:**
1. `.env.local` existe e está preenchido corretamente
2. URLs não têm espaços ou caracteres extras
3. Keys são válidas (teste no Supabase Studio)

**Solução:**
```bash
# Recarregue as variáveis
source .env.local

# Reinicie o servidor
pnpm dev
```

### Problema: `node_modules` corrompidos

**Solução:**
```bash
# Remove node_modules
rm -rf node_modules

# Remove lockfile
rm pnpm-lock.yaml

# Reinstala
pnpm install
```

### Problema: Conflitos no Git

**Solução:**
```bash
# Veja os arquivos em conflito
git status

# Edite manualmente os arquivos
# (procure por <<<<<<, ======, >>>>>>)

# Após resolver:
git add .
git commit -m "chore: resolve conflitos"
```

### Problema: Build falha

**Verifique:**
```bash
# Erros de TypeScript
pnpm lint

# Limpe cache do Vite
rm -rf dist
rm -rf node_modules/.vite

# Tente novamente
pnpm build
```

### Problema: Docker/Supabase travado no Mac

**Solução:** Use GitHub Codespaces (Opção A)!

---

## 📚 Documentação Adicional

### Arquivos Importantes

| Arquivo | Descrição |
|---------|-----------|
| `README.md` | Visão geral do projeto |
| `FRAMEWORK_LOVABLE_CELITE.md` | Framework completo (LEIA!) |
| `CODESPACES_SETUP.md` | Guia detalhado do Codespaces |
| `docs/BASE_DADOS_CONSULTA.md` | Índice de toda documentação |
| `docs/AVATAR` | Persona do cliente (UX/Design) |
| `docs/17 bonificacoes_Regras do programa` | Regras de negócio |

### Estrutura do Projeto

```
lovable-Celite/
├── src/                          # Código-fonte frontend
│   ├── components/               # Componentes React
│   ├── features/                 # Features por domínio
│   ├── lib/                      # Lógica de baixo nível
│   ├── pages/                    # Páginas (rotas)
│   └── types/                    # Tipos TypeScript
├── supabase/                     # Backend Supabase
│   ├── functions/                # Edge Functions
│   ├── migrations/               # SQL migrations
│   └── scripts/                  # Scripts de teste
├── docs/                         # Documentação completa
├── public/                       # Assets estáticos
└── .env.local                    # Variáveis de ambiente (NÃO committar!)
```

### Stack Tecnológica

- **Frontend**: Vite + React 18 + TypeScript + Shadcn/UI + Tailwind
- **Backend**: Supabase (PostgreSQL + Edge Functions + Auth + RLS)
- **Pagamentos**: Stripe (principal) + ASAAS (fallback)
- **Deploy**: Netlify (frontend) + Supabase Cloud (backend)
- **Testes**: Vitest + Testing Library

---

## 🎯 Checklist de Setup Completo

### Para Você

- [ ] Escolheu Codespaces (A) ou Local (B)
- [ ] Clonou/abriu o repositório
- [ ] Instalou dependências (`pnpm install`)
- [ ] Configurou `.env.local` com credenciais
- [ ] Iniciou servidor (`pnpm dev`)
- [ ] Testou acesso em `http://localhost:8080`
- [ ] Rodou testes (`pnpm test`)
- [ ] Leu `FRAMEWORK_LOVABLE_CELITE.md`

### Para Seu Colaborador

- [ ] Deu acesso ao repositório GitHub
- [ ] Compartilhou credenciais Supabase (seguramente!)
- [ ] Compartilhou credenciais Stripe/ASAAS (se necessário)
- [ ] Explicou workflow de Git
- [ ] Mostrou documentação principal
- [ ] Fez pair programming inicial (opcional mas recomendado!)

---

## 🚀 Próximos Passos

Após configuração completa:

1. **Leia a documentação essencial**:
   - `FRAMEWORK_LOVABLE_CELITE.md` (20 min)
   - `docs/BASE_DADOS_CONSULTA.md` (índice)

2. **Explore o código**:
   - Componentes principais em `src/components/`
   - Features em `src/features/`
   - Edge Functions em `supabase/functions/`

3. **Defina tarefas**:
   - Use GitHub Issues
   - Crie branches separadas
   - Revise código mutuamente

4. **Desenvolva com confiança**:
   - Teste frequentemente
   - Commite com mensagens descritivas
   - Sincronize diariamente

---

## 📞 Suporte

**Dúvidas? Problemas?**

1. Consulte a [Documentação Completa](./docs/BASE_DADOS_CONSULTA.md)
2. Veja [Issues no GitHub](https://github.com/Contadores-de-Elite-1/lovable-Celite/issues)
3. Contate o time via Slack/Discord
4. Abra uma Issue descrevendo o problema

---

## ✨ Dicas Finais

1. **Sempre use `pnpm`** - Nunca `npm` ou `yarn`
2. **Commite frequentemente** - Pequenos commits são melhores
3. **Teste antes de committar** - Rode `pnpm lint` e `pnpm test`
4. **Comunique-se** - Mantenha o colaborador informado
5. **Leia a documentação** - Evita retrabalho e erros
6. **Use Codespaces** - Se tiver problemas locais
7. **Revise código mutuamente** - Aprenda e ensine

---

**Criado por:** Claude Sonnet 4.5  
**Data:** Fevereiro 2026  
**Versão:** 1.0

**Boa sorte! 🚀**

