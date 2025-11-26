# 🚨 APLICAR CORREÇÃO AGORA - Dashboard 404

**Status:** Erro confirmado - Dashboard retorna 404

---

## PASSO 1: Abrir Supabase

1. Abra uma nova aba no navegador
2. Acesse: **https://supabase.com/dashboard**
3. Faça login (se necessário)
4. Selecione o projeto: **Lovable-Celite** (ou o nome do seu projeto)

---

## PASSO 2: Ir para SQL Editor

1. No menu lateral ESQUERDO, procure por: **SQL Editor**
2. Clique em **SQL Editor**
3. Clique no botão **+ New query** (botão verde, canto superior direito)

---

## PASSO 3: Copiar o SQL de Correção

**IMPORTANTE:** Vou te dar o SQL completo aqui embaixo. Copie TUDO (do início ao fim).

```sql
-- ============================================================
-- CORREÇÃO: Dashboard 404 - obter_dashboard_contador
-- ============================================================

CREATE OR REPLACE FUNCTION obter_dashboard_contador(user_id_param UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  resultado JSON;
  contador_id_var UUID;
  contador_nome VARCHAR;
  contador_nivel VARCHAR;
  contador_clientes INT;
  total_ganho_var NUMERIC;
  a_receber_var NUMERIC;
  pago_var NUMERIC;
  mes_atual_var NUMERIC;
  mes_passado_var NUMERIC;
  crescimento_var NUMERIC;
  ultimas_comissoes_var JSON;
BEGIN
  -- Buscar contador com nome de auth.users
  SELECT 
    c.id, 
    c.nivel, 
    c.clientes_ativos,
    COALESCE(u.raw_user_meta_data->>'nome', p.nome, 'Usuário') AS nome
  INTO contador_id_var, contador_nivel, contador_clientes, contador_nome
  FROM contadores c
  LEFT JOIN auth.users u ON u.id = c.user_id
  LEFT JOIN profiles p ON p.id = c.user_id
  WHERE c.user_id = user_id_param
  LIMIT 1;

  -- Se contador não encontrado, retorna null
  IF contador_id_var IS NULL THEN
    RETURN NULL;
  END IF;

  -- Calcular total ganho (SUM no servidor)
  SELECT COALESCE(SUM(valor), 0)
  INTO total_ganho_var
  FROM comissoes
  WHERE contador_id = contador_id_var;

  -- Calcular a receber (SUM no servidor)
  SELECT COALESCE(SUM(valor), 0)
  INTO a_receber_var
  FROM comissoes
  WHERE contador_id = contador_id_var
    AND status IN ('calculada', 'aprovada');

  -- Calcular pago
  pago_var := total_ganho_var - a_receber_var;

  -- Calcular comissões do mês atual
  SELECT COALESCE(SUM(valor), 0)
  INTO mes_atual_var
  FROM comissoes
  WHERE contador_id = contador_id_var
    AND competencia >= DATE_TRUNC('month', CURRENT_DATE)::DATE;

  -- Calcular comissões do mês passado
  SELECT COALESCE(SUM(valor), 0)
  INTO mes_passado_var
  FROM comissoes
  WHERE contador_id = contador_id_var
    AND competencia >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')::DATE
    AND competencia < DATE_TRUNC('month', CURRENT_DATE)::DATE;

  -- Calcular crescimento percentual
  IF mes_passado_var > 0 THEN
    crescimento_var := ((mes_atual_var - mes_passado_var) / mes_passado_var) * 100;
  ELSE
    crescimento_var := 0;
  END IF;

  -- Buscar últimas 4 comissões (JSON agregado no servidor)
  SELECT JSON_AGG(
    JSON_BUILD_OBJECT(
      'tipo', tipo,
      'valor', valor,
      'status', status,
      'created_at', created_at
    )
  )
  INTO ultimas_comissoes_var
  FROM (
    SELECT tipo, valor, status, created_at
    FROM comissoes
    WHERE contador_id = contador_id_var
    ORDER BY created_at DESC
    LIMIT 4
  ) sub;

  -- Montar JSON final
  resultado := JSON_BUILD_OBJECT(
    'contador', JSON_BUILD_OBJECT(
      'id', contador_id_var,
      'nome', contador_nome,
      'nivel', contador_nivel,
      'clientes_ativos', contador_clientes
    ),
    'resumo', JSON_BUILD_OBJECT(
      'total_ganho', total_ganho_var,
      'a_receber', a_receber_var,
      'pago', pago_var,
      'mes_atual', mes_atual_var,
      'crescimento', ROUND(crescimento_var, 2)
    ),
    'ultimas_comissoes', COALESCE(ultimas_comissoes_var, '[]'::JSON)
  );

  RETURN resultado;
END;
$$;

-- Grant para usuários autenticados
GRANT EXECUTE ON FUNCTION obter_dashboard_contador(UUID) TO authenticated;

-- Comentário explicativo
COMMENT ON FUNCTION obter_dashboard_contador IS 
'RPC otimizada para Dashboard: retorna TODOS os dados em UMA query.
Busca nome do contador de auth.users ou profiles corretamente.
Calcula agregações no servidor (muito mais rápido que no cliente).';
```

---

## PASSO 4: Colar e Executar no Supabase

1. No SQL Editor do Supabase, **COLE** todo o SQL acima (Cmd+V ou Ctrl+V)
2. Clique no botão **RUN** (ou "Executar") no canto inferior direito
3. Aguarde a mensagem: **"Success. No rows returned"** ✅

---

## PASSO 5: Testar o Dashboard

1. Volte para a aba do app (localhost:4174)
2. **Recarregue a página** (Cmd+R ou Ctrl+R, ou F5)
3. Verifique o console (já está aberto na sua tela)
4. O erro 404 deve desaparecer
5. O Dashboard deve carregar normalmente

---

## O Que Verificar

### ❌ ANTES (atual)
```
POST .../obter_dashboard_contador
404 (Not Found)
```

### ✅ DEPOIS (esperado)
```
POST .../obter_dashboard_contador
200 (OK)
```

---

## Em Caso de Erro ao Executar o SQL

Se aparecer erro no Supabase SQL Editor:

1. Tire um print da mensagem de erro
2. Copie a mensagem completa
3. Me envie para análise

---

**Pronto para aplicar?** Siga os passos acima e me avise o resultado!

