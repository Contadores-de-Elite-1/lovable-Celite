-- =============================================================================
-- Fix: handle_new_user deve também criar registro em contadores
-- Data: 2026-03-01
-- Descrição:
--   O trigger handle_new_user só criava o profiles do usuário.
--   Todo novo cadastro também precisa de um registro na tabela contadores
--   com primeiro_acesso = TRUE para redirecionar ao onboarding.
--
-- IMPACTO: Resolve o bug de "dashboard em branco" para novos usuários.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- 1. Criar perfil público
  INSERT INTO public.profiles (id, nome, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', 'Usuário'),
    NEW.email
  )
  ON CONFLICT (id) DO NOTHING;

  -- 2. Criar registro de contador com nivel bronze e primeiro_acesso = true
  --    ON CONFLICT garante idempotência caso o trigger seja chamado 2x
  INSERT INTO public.contadores (user_id, nivel, status, primeiro_acesso)
  VALUES (
    NEW.id,
    'bronze',
    'ativo',
    TRUE
  )
  ON CONFLICT (user_id) DO NOTHING;

  -- 3. Atribuir role 'contador' por padrão
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'contador')
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$function$;

-- Log de migração
DO $$
BEGIN
  RAISE NOTICE '[Fix 2026-03-01] handle_new_user atualizado:
    - Cria profiles (existente)
    - Cria contadores com nivel=bronze, status=ativo, primeiro_acesso=TRUE (NOVO)
    - Atribui role contador (NOVO)
    Resolve: dashboard em branco para novos usuários.';
END $$;
