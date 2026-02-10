# ⚡ Início Rápido - Lovable-Celite

**Comece a trabalhar em 5 minutos!**

---

## 🚀 Setup Super Rápido

### Opção 1: GitHub Codespaces (Mais Rápido) ⚡

```bash
# 1. Vá para: https://github.com/Contadores-de-Elite-1/lovable-Celite
# 2. Clique: Code → Codespaces → Create codespace
# 3. Aguarde 3 minutos (setup automático)
# 4. Pronto! ✅
```

### Opção 2: Na Sua Máquina 💻

```bash
# 1. Clone o repositório
git clone https://github.com/Contadores-de-Elite-1/lovable-Celite.git
cd lovable-Celite

# 2. Instale dependências (SEMPRE use pnpm!)
pnpm install

# 3. Configure variáveis de ambiente
# Crie arquivo .env.local com as credenciais
# (Peça as credenciais ao responsável do projeto)

# 4. Inicie o servidor
pnpm dev

# 5. Acesse: http://localhost:8080
```

---

## 🔑 Variáveis de Ambiente Essenciais

Crie um arquivo `.env.local` na raiz com:

```env
# SUPABASE (Peça ao responsável)
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anon

# STRIPE (Opcional para desenvolvimento)
VITE_STRIPE_PUBLIC_KEY=pk_test_sua-chave

# AMBIENTE
VITE_APP_ENV=development
NODE_ENV=development
```

**🔒 SEGURANÇA**: NUNCA commite o `.env.local`!

---

## 📚 Primeiros Passos

### 1️⃣ Leia PRIMEIRO (10 min)
- `FRAMEWORK_LOVABLE_CELITE.md` - Visão geral do projeto

### 2️⃣ Teste se Está Funcionando

```bash
# Inicie o servidor
pnpm dev

# Em outro terminal, rode os testes
pnpm test

# Verifique linter
pnpm lint
```

### 3️⃣ Explore a Estrutura

```
src/
├── components/    # Componentes React reutilizáveis
├── features/      # Features por domínio (auth, dashboard, etc)
├── lib/           # Lógica de baixo nível (Supabase, utils)
├── pages/         # Páginas (rotas)
└── types/         # Tipos TypeScript

supabase/
├── functions/     # Edge Functions (backend)
└── migrations/    # SQL migrations (estrutura do banco)

docs/              # Documentação completa do projeto
```

---

## 💻 Comandos Essenciais

```bash
# Desenvolvimento
pnpm dev              # Inicia servidor (porta 8080)
pnpm build            # Build para produção
pnpm preview          # Preview do build

# Testes
pnpm test             # Testes unitários
pnpm test:ui          # Testes com UI
pnpm lint             # Verifica erros

# Git (workflow)
git checkout -b feature/minha-feature    # Nova branch
git add .                                # Adiciona mudanças
git commit -m "feat: minha feature"      # Commita
git push origin feature/minha-feature    # Envia para GitHub
```

---

## 🔄 Workflow de Trabalho

### Antes de Começar (TODO DIA)

```bash
# 1. Atualize o código
git checkout main
git pull origin main

# 2. Crie uma branch para sua tarefa
git checkout -b feature/nome-da-tarefa

# 3. Trabalhe normalmente
```

### Depois de Terminar

```bash
# 1. Adicione e commite
git add .
git commit -m "feat: descrição clara da mudança"

# 2. Envie para o GitHub
git push origin feature/nome-da-tarefa

# 3. Abra um Pull Request no GitHub
# 4. Peça revisão do colaborador
# 5. Após aprovação, faça merge
```

---

## 🎯 Convenção de Commits

```bash
feat: nova funcionalidade
fix: correção de bug
docs: documentação
refactor: refatoração de código
test: adiciona/atualiza testes
style: formatação, sem mudança de lógica
chore: tarefas de manutenção
```

**Exemplos:**
```bash
git commit -m "feat: adiciona calculadora de comissões"
git commit -m "fix: corrige cálculo sobre valor líquido"
git commit -m "docs: atualiza README com setup"
```

---

## 🆘 Problemas Comuns

### Erro: `pnpm: command not found`
```bash
npm install -g pnpm
```

### Erro: Porta 8080 ocupada
```bash
# Mata processo na porta 8080
kill -9 $(lsof -ti:8080)

# OU use outra porta
pnpm dev --port 3000
```

### Erro: Conexão Supabase falha
1. Verifique `.env.local` existe e está correto
2. Teste as credenciais em: https://app.supabase.com
3. Reinicie o servidor: `pnpm dev`

### Módulos corrompidos
```bash
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

---

## 📞 Precisa de Ajuda?

1. **Documentação Completa**: Veja `SETUP_PARA_COLABORADORES.md`
2. **Issues do GitHub**: Reporte bugs e dúvidas
3. **Contate o Time**: Via Slack/Discord/Email
4. **Leia a Docs**: `docs/BASE_DADOS_CONSULTA.md` (índice)

---

## ✅ Checklist Rápido

- [ ] Clonei o repositório (ou abri no Codespaces)
- [ ] Instalei dependências (`pnpm install`)
- [ ] Configurei `.env.local` com credenciais
- [ ] Servidor rodando (`pnpm dev`)
- [ ] Acessei `http://localhost:8080` sem erros
- [ ] Testes passando (`pnpm test`)
- [ ] Li `FRAMEWORK_LOVABLE_CELITE.md`
- [ ] Criei minha branch de trabalho
- [ ] Estou pronto para desenvolver! 🚀

---

## 🎓 Dicas Pro

1. **Sempre use `pnpm`** - Nunca `npm` ou `yarn`
2. **Commite frequentemente** - Pequenos commits são melhores
3. **Teste antes de Push** - `pnpm lint && pnpm test`
4. **Sincronize diariamente** - `git pull origin main`
5. **Comunique-se** - Mantenha o time informado
6. **Leia o código** - Entenda antes de modificar
7. **Use Codespaces** - Se tiver problemas locais

---

## 📚 Leitura Recomendada (em ordem)

1. **FRAMEWORK_LOVABLE_CELITE.md** (20 min) - Overview completo
2. **docs/BASE_DADOS_CONSULTA.md** - Índice de toda documentação
3. **docs/AVATAR** - Entenda o cliente (para UX/Design)
4. **docs/17 bonificacoes_Regras do programa** - Regras de negócio

---

## 🚀 Você Está Pronto!

**Próximo passo:** Escolha uma task no GitHub Issues e comece a codar! 💻

---

**Criado por:** Claude Sonnet 4.5  
**Data:** Fevereiro 2026  
**Para**: Setup rápido de colaboradores

**Boa codificação! 🎉**

