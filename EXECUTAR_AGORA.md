# EXECUÇÃO IMEDIATA DO TESTE FLÁVIO

## Status Backend: ✅ PRONTO

Todos os fixes foram implementados e commitados:
- ✅ Volume Bonus (agora dispara em 5, 10, 15, 20, 25... clientes)
- ✅ LTV Limit (máximo 15 clientes para cálculo = R$ 1.038,75)
- ✅ Dados pré-calculados no banco

---

## PRÓXIMO PASSO: Inserir dados de teste no Supabase

### Opção A: Copy/Paste SQL (MAIS SIMPLES - Recomendado)

1. Abra este arquivo:
   ```
   supabase/scripts/flavio-insert-complete.sql
   ```

2. Selecione TODO o conteúdo (Ctrl+A)

3. Copie (Ctrl+C)

4. Vá para Supabase Dashboard:
   ```
   https://supabase.com/dashboard/project/zytxwdgzjqrcmbnpgofj/sql/new
   ```

5. Cole o SQL (Ctrl+V)

6. Clique "Run" ou press Ctrl+Enter

7. **PRONTO!** Verifique os resultados no painel inferior

### Resultado Esperado:
```
Item             | Valor
-----------------|--------
Clientes         | 20
Total Comissões  | 9567.00
Total Bônus      | 1638.75
TOTAL FLÁVIO     | 10405.75
```

---

### Opção B: Edge Function (Automatizado)

Se você tiver Supabase CLI instalado:

```bash
# 1. Deploy da função
supabase functions deploy exec-test-flavio

# 2. Executar
bash supabase/scripts/call-flavio-function.sh
```

---

## Depois que inserir os dados:

### Validar no banco:
```sql
-- Copie/cole isto no Supabase para confirmar

SELECT 'Clientes diretos' as item, COUNT(*) as qtd
FROM clientes
WHERE contador_id = '550e8400-e29b-41d4-a716-446655440001'
UNION ALL
SELECT 'Bônus inseridos', COUNT(*)
FROM bonus_historico
WHERE contador_id = '550e8400-e29b-41d4-a716-446655440001'
UNION ALL
SELECT 'Comissões inseridas', COUNT(*)
FROM comissoes
WHERE contador_id = '550e8400-e29b-41d4-a716-446655440001';
```

---

## Cronograma Week 2:

- [x] Week 1: Backend fixes (Volume Bonus + LTV Limit)
- [ ] Week 2A: Validar dados (você rodará o SQL agora)
- [ ] Week 2B: Frontend - Dashboard Flávio
- [ ] Week 2C: Testes E2E
- [ ] Week 3: Deploy em produção

---

## Documentação Completa:
Veja `FLAVIO_TEST_GUIDE.md` para mais detalhes e troubleshooting.

---

**Próximo comando que você deve rodar:**

```bash
# 1. Copie/cole o SQL do arquivo flavio-insert-complete.sql
# 2. Cole no Supabase Dashboard em:
#    https://supabase.com/dashboard/project/zytxwdgzjqrcmbnpgofj/sql/new
# 3. Clique "Run"
# 4. Confirme os resultados
# 5. Me avise quando terminar
```
