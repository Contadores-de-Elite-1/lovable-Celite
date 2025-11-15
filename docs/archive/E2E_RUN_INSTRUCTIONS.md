# 🚀 Como Rodar E2E Tests Automaticamente

## TL;DR (3 segundos)

```bash
bash supabase/scripts/run-e2e-local.sh
```

**Fim!** O script faz TUDO automaticamente. Você não precisa fazer nada mais.

---

## O que o script faz (automaticamente)

### Etapa 1: Verificar/Iniciar Supabase ⏳
- ✓ Verifica se Supabase já está rodando
- ✓ Se não estiver, inicia automaticamente
- ✓ Aguarda até Supabase estar pronto (máximo 2 minutos)
- ✓ Obtém credenciais automaticamente

### Etapa 2: Rodar Testes 🧪
- ✓ Reseta banco de dados
- ✓ Aplica todas as migrations (13 migrations)
- ✓ Executa seed de dados de teste
- ✓ Simula webhook ASAAS
- ✓ Valida cálculo de comissões
- ✓ Testa aprovação em lote
- ✓ Testa processamento de pagamento
- ✓ Verifica RLS (isolamento de dados)
- ✓ Valida audit logs

### Etapa 3: Relatório Final 📊
- ✓ Se todos os testes passarem: **SUCCESS** ✓
- ✓ Se algo falhar: **ERROR** com dicas de debug

---

## Tempo Estimado

| Etapa | Tempo |
|-------|-------|
| Iniciar Supabase | 30-60 segundos |
| Migrations + Seed | 20-30 segundos |
| Testes (11 validações) | 60-90 segundos |
| **Total** | **2-3 minutos** |

---

## O que você NÃO precisa fazer

- ❌ Não execute `supabase start` manualmente
- ❌ Não execute migrations manualmente
- ❌ Não execute seed manualmente
- ❌ Não use psql diretamente
- ❌ Não faça NADA manual

**Apenas rode:** `bash supabase/scripts/run-e2e-local.sh`

---

## Se algo der errado

Se o teste falhar, o script vai te dar exatamente o que fazer:

### Erro: "Supabase não ficou pronto em 2 minutos"
```bash
# 1. Verifique se Docker está rodando
docker ps

# 2. Reset completo
supabase stop
rm -rf .supabase
supabase start

# 3. Tente de novo
bash supabase/scripts/run-e2e-local.sh
```

### Erro: "jq: command not found"
```bash
# macOS
brew install jq

# Ubuntu/Debian
sudo apt-get install jq

# Depois tente de novo
bash supabase/scripts/run-e2e-local.sh
```

### Erro: "Webhook retornou erro"
O script vai sugerir verificar logs:
```bash
supabase functions logs webhook-asaas
```

---

## Depois de rodar com sucesso ✓

Se todos os 11 testes passarem:

1. **Deixe Supabase rodando**
   ```bash
   supabase start
   ```

2. **Próximo passo:** Começar desenvolvimento do frontend (Week 2)

3. **Antes de cada commit importante**, rode os testes novamente:
   ```bash
   bash supabase/scripts/run-e2e-local.sh
   ```

---

## Arquivos envolvidos

| Arquivo | Propósito |
|---------|-----------|
| `supabase/scripts/run-e2e-local.sh` | 👈 **Script que você roda** (novo!) |
| `supabase/scripts/test-e2e-complete.sh` | Script dos 11 testes (original) |
| `supabase/migrations/*.sql` | 13 migrations do banco |
| `supabase/functions/*/index.ts` | 5 edge functions |
| `supabase/scripts/seed.sql` | Dados de teste |

---

## Estrutura dos 11 Testes

```
1. ✓ Supabase API disponível
2. ✓ Credenciais obtidas (ANON_KEY, SERVICE_ROLE_KEY)
3. ✓ Migrations aplicadas
4. ✓ Dados de teste existem (2+ contadores)
5. ✓ Webhook ASAAS funciona → payment criado
6. ✓ Comissões calculadas automaticamente
7. ✓ Aprovação em lote funciona
8. ✓ Status mudou para "aprovada"
9. ✓ Processamento de pagamento funciona
10. ✓ RLS isola dados corretamente
11. ✓ Audit logs registrados
```

---

## Perguntas Frequentes

**P: Preciso estar na pasta do projeto?**
Sim, execute de dentro de `/home/user/lovable-Celite`:
```bash
cd /home/user/lovable-Celite
bash supabase/scripts/run-e2e-local.sh
```

**P: Posso deixar rodando em background?**
Sim, se quiser:
```bash
nohup bash supabase/scripts/run-e2e-local.sh > e2e-test.log 2>&1 &
```

**P: Como vejo os logs em tempo real?**
```bash
tail -f e2e-test.log
```

**P: Quanto tempo leva?**
2-3 minutos normalmente. Máximo 5 minutos se Supabase precisar iniciar do zero.

**P: Preciso de internet?**
Não, é totalmente local.

---

## Próximas Etapas (após tests passarem)

1. **Week 1**: ✓ Backend validado com E2E tests
2. **Week 2**: Começar Frontend (Contador Dashboard)
3. **Week 3**: Admin Panel
4. **Week 4-5**: Testing, Staging, Production

---

**Dúvidas?** Verifique `E2E_TEST_GUIDE.md` para troubleshooting detalhado.
