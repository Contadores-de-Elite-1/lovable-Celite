# Guia E2E Testing - Fluxo Completo de Comissões

Teste completo de ponta-a-ponta que valida todo o sistema de comissões funcionando.

## O que é testado

- ✓ Webhook ASAAS recebendo pagamento confirmado
- ✓ Pagamento sendo registrado no banco
- ✓ Comissões sendo calculadas automaticamente
- ✓ Aprovação de comissões em lote
- ✓ Processamento de pagamento (com limite mínimo R$100)
- ✓ RLS policies isolando dados
- ✓ Audit logs sendo registrados

## Pré-requisitos

```bash
# Ter instalado:
- supabase CLI
- curl
- jq
- psql (postgresql client)

# Verificar:
supabase --version
curl --version
jq --version
psql --version
```

## Como Rodar

### 1. Iniciar Supabase (se não estiver rodando)

```bash
supabase start
```

Aguarde até aparecer:
```
Started supabase local development server.
```

### 2. Executar o script E2E

```bash
bash supabase/scripts/test-e2e-complete.sh
```

### O que esperar

O script vai:

1. Verificar que Supabase está disponível
2. Obter credenciais (ANON_KEY, SERVICE_ROLE_KEY)
3. Resetar + aplicar migrations + executar seed
4. Simular webhook ASAAS
5. Validar que comissões foram calculadas
6. Aprovar as comissões
7. Processar pagamentos
8. Verificar RLS
9. Validar audit logs

**Duração esperada:** 30-60 segundos

### Resultado esperado

```
════════════════════════════════════════════════════════════════════════
                          RESULTADO DOS TESTES
════════════════════════════════════════════════════════════════════════

Testes Passados: 11
Testes Falhados: 0

✓ TODOS OS TESTES PASSARAM!
```

---

## Se algo falhar

### Erro: "Supabase não está rodando"

```bash
supabase start
# Aguarde 30 segundos e tente de novo
```

### Erro: "Não consegui obter ANON_KEY"

```bash
supabase status
# Copie a ANON_KEY manualmente
export ANON_KEY="seu_anon_key_aqui"
bash supabase/scripts/test-e2e-complete.sh
```

### Erro: "Webhook retornou erro"

Verificar logs:
```bash
supabase functions list
supabase functions logs webhook-asaas
```

### Erro: "Não consegui resetar via psql"

Tentar resetar manualmente:
```bash
psql postgresql://postgres:postgres@localhost:54322/postgres

# Dentro do psql:
DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;
\q
```

Depois rodar o teste novamente.

---

## Estrutura do Teste

O teste tem **11 passos** que validam:

| Passo | O que testa | Status esperado |
|-------|-------------|-----------------|
| 1 | Supabase disponível | UP |
| 2 | Credenciais obtidas | ANON_KEY presente |
| 3 | Migrations aplicadas | sem erro |
| 4 | Dados de teste existem | >= 2 contadores |
| 5 | Webhook ASAAS funciona | 200 OK |
| 6 | Comissões calculadas | > 0 comissões |
| 7 | Aprovação funciona | success: true |
| 8 | Status mudou para aprovada | > 0 aprovadas |
| 9 | Processamento de pagamento | success: true |
| 10 | RLS permite leitura | 200 OK |
| 11 | Audit logs registrados | > 0 logs |

---

## Para Developers

### Limpar tudo e começar do zero

```bash
supabase stop
rm -rf .supabase
supabase start

bash supabase/scripts/test-e2e-complete.sh
```

### Rodar apenas o E2E sem reset

```bash
# Editar script e comentar PASSO 3
nano supabase/scripts/test-e2e-complete.sh

# Ou rodar com variável de env
SKIP_RESET=1 bash supabase/scripts/test-e2e-complete.sh
```

### Debug individual

Verificar logs em tempo real:

```bash
# Terminal 1: tail dos logs
tail -f .supabase/logs/realtime.log

# Terminal 2: rodar o teste
bash supabase/scripts/test-e2e-complete.sh
```

Verificar banco diretamente:

```bash
psql postgresql://postgres:postgres@localhost:54322/postgres

# Dentro do psql
SELECT COUNT(*) FROM contadores;
SELECT COUNT(*) FROM comissoes WHERE status = 'aprovada';
SELECT COUNT(*) FROM audit_logs;
\q
```

---

## Próximos Passos

Depois que E2E passar:

1. Frontend: construir dashboard do contador
2. Testes com dados reais
3. Deploy em staging
4. Testes com colaboradores/amigos
5. Deploy em produção

---

## Problemas Comuns

**P: Script não tem permissão de executar**
```bash
chmod +x supabase/scripts/test-e2e-complete.sh
```

**P: jq não instalado**
```bash
# macOS
brew install jq

# Ubuntu/Debian
sudo apt-get install jq

# Depois rodar o teste
```

**P: Webhook retorna erro de cliente não encontrado**

Significa que seed não rodou corretamente. Tente:
```bash
psql postgresql://postgres:postgres@localhost:54322/postgres -f supabase/scripts/seed.sql
bash supabase/scripts/test-e2e-complete.sh
```

---

Qualquer dúvida, me avise!
