# Baby Steps: Aplicar Correção do Dashboard

**Objetivo:** Corrigir o erro 404 na função RPC `obter_dashboard_contador`

---

## Passo 1: Abrir o Supabase

1. Abra o navegador
2. Acesse: https://supabase.com/dashboard
3. Faça login
4. Selecione seu projeto: **celite-app-atual / lovable-Celite**

---

## Passo 2: Abrir o SQL Editor

1. No menu lateral esquerdo, clique em **SQL Editor**
2. Clique no botão **+ New query** (ou "Nova consulta")

---

## Passo 3: Copiar o SQL

1. Abra o arquivo: `docs/SQL_APLICAR_CORRIGIR_DASHBOARD.sql`
2. Selecione TODO o conteúdo (Cmd+A ou Ctrl+A)
3. Copie (Cmd+C ou Ctrl+C)

---

## Passo 4: Colar e Executar

1. Volte para o SQL Editor do Supabase
2. Cole o SQL no editor (Cmd+V ou Ctrl+V)
3. Clique no botão **Run** (ou "Executar") no canto inferior direito
4. Aguarde a mensagem: **Success. No rows returned**

---

## Passo 5: Validar

### Opção A: Testar no próprio SQL Editor

1. No mesmo SQL Editor, **delete tudo**
2. Cole esta query de teste:
   ```sql
   SELECT obter_dashboard_contador(auth.uid());
   ```
3. Clique em **Run**
4. Deve retornar um JSON com seus dados

### Opção B: Testar no App

1. Volte para o app rodando no navegador
2. Se já estiver no Dashboard, recarregue (Cmd+R ou Ctrl+R)
3. Se não estiver, faça login e acesse o Dashboard
4. Não deve mais aparecer erro 404 no console
5. Os dados devem carregar normalmente

---

## Passo 6: Confirmar Sucesso

Abra o console do navegador (F12) e verifique:

- ❌ ANTES: `POST .../obter_dashboard_contador 404 (Not Found)`
- ✅ DEPOIS: `POST .../obter_dashboard_contador 200 (OK)`

---

## Em Caso de Erro

Se aparecer algum erro ao executar o SQL:

1. Copie a mensagem de erro completa
2. Tire um print da tela
3. Me envie para analisarmos

---

**Pronto!** Depois de aplicar, me avise se funcionou ou se houve algum erro.

