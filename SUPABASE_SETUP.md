# 🔧 Supabase Setup Guide - Local Development

## Problema Identificado

O script `run-e2e-local.sh` precisa de Supabase Access Token para funcionar com Supabase Local.

## Solução

### Opção 1: Using Supabase Cloud (Recommended for Testing)

Se você quer testar com a instância Supabase Cloud:

```bash
# 1. Gere um Access Token em https://app.supabase.com/account/tokens
# 2. Configure como variável de ambiente:
export SUPABASE_ACCESS_TOKEN="seu-token-aqui"

# 3. Execute o script E2E:
bash supabase/scripts/run-e2e-local.sh
```

### Opção 2: Using Supabase Local (Docker Required)

Se você quer usar Supabase completamente local:

```bash
# 1. Instale Supabase CLI (via Docker)
docker run -it --rm -v ~/.supabase:/root/.supabase supabase/cli:latest version

# 2. Inicie Supabase Local
supabase start

# 3. Execute o script E2E:
bash supabase/scripts/run-e2e-local.sh
```

## Como Obter Supabase Access Token

1. Vá para: https://app.supabase.com/account/tokens
2. Clique em "Generate new token"
3. Dê um nome (ex: "Development Local Testing")
4. Copie o token
5. Configure como variável de ambiente:

```bash
export SUPABASE_ACCESS_TOKEN="sbp_..."
echo 'export SUPABASE_ACCESS_TOKEN="sbp_..."' >> ~/.bashrc  # Para persistir
```

## Verificar Configuração

```bash
# Verificar se token está configurado
echo $SUPABASE_ACCESS_TOKEN

# Testar conexão com Supabase
supabase status
```

## Próximos Passos

Depois de configurar o token:

```bash
# 1. Start Supabase
supabase start

# 2. Apply migrations
supabase db push

# 3. Load seed data
psql postgresql://postgres:postgres@localhost:54322/postgres -f supabase/scripts/seed.sql

# 4. Run E2E tests
bash supabase/scripts/run-e2e-local.sh
```
