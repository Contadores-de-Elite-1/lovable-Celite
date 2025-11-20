-- Migration: Adicionar função para usuário se tornar admin
-- Criada em: 2025-11-20
-- Descrição: Permite que o usuário logado se torne admin

-- Função para adicionar role admin ao usuário atual
CREATE OR REPLACE FUNCTION make_me_admin()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Inserir role admin para o usuário atual
  INSERT INTO user_roles (user_id, role)
  VALUES (auth.uid(), 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RAISE NOTICE 'Role admin adicionada com sucesso para o usuário %', auth.uid();
END;
$$;

-- Comentário da função
COMMENT ON FUNCTION make_me_admin() IS 'Adiciona role admin ao usuário logado. Executar via SQL Editor: SELECT make_me_admin();';

