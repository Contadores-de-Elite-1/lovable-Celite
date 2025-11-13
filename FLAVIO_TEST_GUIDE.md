# Guia: Executar Teste Flávio Augusto

## Resumo
Inserir dados de teste para validar cálculos da jornada de Flávio Augusto:
- **20 clientes diretos**
- **Bônus progressão + volume + LTV**
- **Total esperado: R$ 10.405,75**

---

## Opção 1: Via SQL no Supabase Dashboard (MAIS SIMPLES)

### Passo 1: Abrir o arquivo SQL
```bash
cat supabase/scripts/flavio-insert-complete.sql
```

### Passo 2: Copiar todo o conteúdo

### Passo 3: Ir para Supabase Dashboard
```
https://supabase.com/dashboard/project/zytxwdgzjqrcmbnpgofj/sql/new
```

### Passo 4: Colar o SQL (Ctrl+V)

### Passo 5: Clicar "Run" ou apertar Ctrl+Enter

### Passo 6: Verificar resultado na aba "Results"

Deve mostrar:
```
Item                | Valor
--------------------|----------
Clientes           | 20
Total Comissões    | 9567
Total Bônus        | 1638.75
TOTAL FLÁVIO       | 10405.75
```

---

## Opção 2: Via Edge Function (AUTOMATIZADO)

### Pré-requisitos
- Ter `supabase` CLI instalado
- Estar autenticado com `supabase login`

### Passo 1: Fazer deploy da função
```bash
supabase functions deploy exec-test-flavio \
  --project-id zytxwdgzjqrcmbnpgofj
```

### Passo 2: Chamar a função
```bash
bash supabase/scripts/call-flavio-function.sh
```

Ou via curl direto:
```bash
PROJECT_ID="zytxwdgzjqrcmbnpgofj"
SERVICE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

curl -X POST \
  "https://${PROJECT_ID}.supabase.co/functions/v1/exec-test-flavio" \
  -H "Authorization: Bearer $SERVICE_KEY" \
  -H "Content-Type: application/json" \
  -d '{}'
```

---

## Validação

### Conferir dados inseridos
```sql
-- No Supabase Dashboard, execute:

SELECT 'Flávio Augusto' as contador;

-- Clientes diretos
SELECT COUNT(*) as clientes_diretos
FROM clientes
WHERE contador_id = '550e8400-e29b-41d4-a716-446655440001';

-- Comissões
SELECT
  COUNT(*) as comissoes_count,
  SUM(valor) as total_comissoes
FROM comissoes
WHERE contador_id = '550e8400-e29b-41d4-a716-446655440001';

-- Bônus
SELECT
  tipo_bonus,
  COUNT(*) as qtd,
  SUM(valor) as total
FROM bonus_historico
WHERE contador_id = '550e8400-e29b-41d4-a716-446655440001'
GROUP BY tipo_bonus;

-- Total
SELECT
  COALESCE(SUM(valor), 0) as total_comissoes
FROM comissoes
WHERE contador_id = '550e8400-e29b-41d4-a716-446655440001'
UNION ALL
SELECT
  COALESCE(SUM(valor), 0) as total_bonus
FROM bonus_historico
WHERE contador_id = '550e8400-e29b-41d4-a716-446655440001';
```

---

## Arquivos Envolvidos

| Arquivo | Descrição |
|---------|-----------|
| `supabase/scripts/flavio-insert-complete.sql` | SQL com todos os inserts |
| `supabase/functions/exec-test-flavio/index.ts` | Edge Function para inserir dados |
| `supabase/scripts/call-flavio-function.sh` | Script para chamar a função |
| `FLAVIO_TEST_GUIDE.md` | Este guia |

---

## Valores Esperados

### Clientes: 20
- 5 Pro @ 100 = 500
- 5 Premium @ 130 = 650
- 5 Top @ 180 = 900
- 5 misto = variável

### Comissões: 9.567,00
- Ativação (20 clientes): 8.098,00
- Recorrente: 1.469,00

### Bônus: 1.638,75
- Progressão (Prata + Ouro): 200,00
- Volume (5+10+15+20): 400,00
- LTV (15 × 138,5 × 50%): 1.038,75

### TOTAL: 10.405,75

---

## Troubleshooting

### "Function not found"
A função ainda não foi deployada. Use a **Opção 1** (SQL direto).

### "Authorization failed"
Service key está vencido ou inválido. Usar SQL direto no Dashboard.

### Dados já existem
Usar `ON CONFLICT ... DO NOTHING` no SQL (já está implementado).

---

## Próximos Passos

Após inserir com sucesso:
1. ✅ Validar valores no banco
2. ✅ Confirmar todos os bônus foram criados
3. ✅ Passar para Week 2 (Frontend)
