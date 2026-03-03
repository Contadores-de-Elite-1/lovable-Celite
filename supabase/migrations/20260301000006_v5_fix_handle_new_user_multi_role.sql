-- =============================================================================
-- V5.0 Migration 6: handle_new_user role-aware
-- Data: 2026-03-01
-- Descrição:
--   Atualiza a função handle_new_user para ler o role do raw_user_meta_data
--   em vez de sempre criar um Contador. Isso suporta o cadastro tripartite
--   (Contador | MPE | Coworking) sem criar registros incorretos.
--
--   Comportamento por role:
--   - 'contador' (padrão): cria profiles + contadores + user_roles
--   - 'mpe':               cria profiles + user_roles (mpe record criado no front)
--   - 'coworking':         cria profiles + user_roles (coworking record criado no front)
--   - qualquer outro:      trata como 'contador' (fallback seguro)
-- =============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_role TEXT;
BEGIN
  -- 1. Criar perfil público (sempre)
  INSERT INTO public.profiles (id, nome, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', 'Usuário'),
    NEW.email
  )
  ON CONFLICT (id) DO NOTHING;

  -- 2. Determinar role a partir dos metadados do cadastro
  --    Valida contra os valores permitidos; padrão é 'contador'
  v_role := COALESCE(NEW.raw_user_meta_data->>'role', 'contador');

  IF v_role NOT IN ('contador', 'mpe', 'coworking', 'suporte', 'admin') THEN
    v_role := 'contador';
  END IF;

  -- 3. Atribuir role ao usuário
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, v_role::app_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  -- 4. Criar registro específico por role
  --    MPE e Coworking: o registro detalhado é criado no frontend após o signup
  --    pois requer campos adicionais (CNPJ, cidade, etc.)
  IF v_role = 'contador' THEN
    INSERT INTO public.contadores (user_id, nivel, status, primeiro_acesso)
    VALUES (NEW.id, 'bronze', 'ativo', TRUE)
    ON CONFLICT (user_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$function$;

-- Log de migração
DO $$
BEGIN
  RAISE NOTICE '[V5.0 Migration 6] handle_new_user atualizado para suporte tripartite:
    - Lê role de raw_user_meta_data->>"role" (padrão: contador)
    - Atribui o role correto em user_roles
    - Cria registro em contadores APENAS para role=contador
    - MPE e Coworking: registros criados no frontend após signup';
END $$;
