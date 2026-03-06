-- ============================================================
-- Migration: Integridade de Dados — Correções do Próximo Sprint
-- Referência: supabase/SCHEMA_ANALYSIS.md — Seção "Próximo Sprint"
-- Data: Março 2026
-- ============================================================
-- Itens cobertos:
--   1. FK em comissoes_shadow (4 constraints ausentes)
--   2. UNIQUE em contador_conquistas (conquista duplicada por contador)
--   3. UNIQUE em evento_participantes (check-in duplicado)
--   4. UNIQUE em contador_performance_anual (múltiplos registros por ano)
--   5. Tabela de junção solicitacoes_saque_comissoes (substituição do ARRAY)
-- ============================================================

-- ============================================================
-- 1. FK EM comissoes_shadow
-- ============================================================
-- A tabela é cópia estrutural de comissoes, mas sem nenhuma FK declarada,
-- o que permite acúmulo silencioso de registros órfãos.
-- Estratégia: remover órfãos existentes antes de adicionar constraints.

-- 1a. Remover linhas cujo contador_id não existe em contadores
DELETE FROM public.comissoes_shadow cs
WHERE NOT EXISTS (
  SELECT 1 FROM public.contadores c WHERE c.id = cs.contador_id
);

-- 1b. Remover linhas cujo pagamento_id não existe em pagamentos (NULLs são aceitos)
DELETE FROM public.comissoes_shadow cs
WHERE cs.pagamento_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.pagamentos p WHERE p.id = cs.pagamento_id
  );

-- 1c. Remover linhas cujo cliente_id não existe em clientes
DELETE FROM public.comissoes_shadow cs
WHERE cs.cliente_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.clientes cl WHERE cl.id = cs.cliente_id
  );

-- 1d. Remover linhas cujo origem_cliente_id não existe em clientes
DELETE FROM public.comissoes_shadow cs
WHERE cs.origem_cliente_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.clientes cl WHERE cl.id = cs.origem_cliente_id
  );

-- 1e. Adicionar as quatro FKs
ALTER TABLE public.comissoes_shadow
  ADD CONSTRAINT comissoes_shadow_contador_id_fkey
    FOREIGN KEY (contador_id) REFERENCES public.contadores(id) ON DELETE RESTRICT,
  ADD CONSTRAINT comissoes_shadow_pagamento_id_fkey
    FOREIGN KEY (pagamento_id) REFERENCES public.pagamentos(id) ON DELETE SET NULL,
  ADD CONSTRAINT comissoes_shadow_cliente_id_fkey
    FOREIGN KEY (cliente_id) REFERENCES public.clientes(id) ON DELETE SET NULL,
  ADD CONSTRAINT comissoes_shadow_origem_cliente_id_fkey
    FOREIGN KEY (origem_cliente_id) REFERENCES public.clientes(id) ON DELETE SET NULL;

COMMENT ON TABLE public.comissoes_shadow IS
  'Cópia shadow de comissoes para testes de novas regras de cálculo (shadow mode). '
  'FK constraints adicionadas na migration 20260304000001_integrity_sprint.';

-- ============================================================
-- 2. UNIQUE em contador_conquistas
-- ============================================================
-- Sem UNIQUE, a mesma conquista pode ser concedida múltiplas vezes
-- ao mesmo contador, corrompendo cálculos de gamificação.

-- Remover duplicatas mantendo o registro mais antigo (desbloqueado_em menor)
DELETE FROM public.contador_conquistas
WHERE id IN (
  SELECT id FROM (
    SELECT
      id,
      ROW_NUMBER() OVER (
        PARTITION BY contador_id, conquista_id
        ORDER BY desbloqueado_em ASC
      ) AS rn
    FROM public.contador_conquistas
  ) ranked
  WHERE rn > 1
);

ALTER TABLE public.contador_conquistas
  ADD CONSTRAINT uq_contador_conquista
    UNIQUE (contador_id, conquista_id);

-- ============================================================
-- 3. UNIQUE em evento_participantes
-- ============================================================
-- Sem UNIQUE, o mesmo contador pode fazer check-in múltiplas vezes
-- no mesmo evento, distorcendo XP e contadores de participação.

-- Remover duplicatas mantendo o registro mais antigo (check_in_em menor, ou criado primeiro via id)
DELETE FROM public.evento_participantes
WHERE id IN (
  SELECT id FROM (
    SELECT
      id,
      ROW_NUMBER() OVER (
        PARTITION BY evento_id, contador_id
        ORDER BY COALESCE(check_in_em, '1970-01-01'::timestamptz) ASC, id ASC
      ) AS rn
    FROM public.evento_participantes
  ) ranked
  WHERE rn > 1
);

ALTER TABLE public.evento_participantes
  ADD CONSTRAINT uq_evento_participante
    UNIQUE (evento_id, contador_id);

-- ============================================================
-- 4. UNIQUE em contador_performance_anual
-- ============================================================
-- Múltiplos registros para o mesmo contador + ano geram inconsistência
-- nos cálculos do sistema TIER e de vitaliciedade.

-- Remover duplicatas mantendo o registro com ultima_atualizacao mais recente
DELETE FROM public.contador_performance_anual
WHERE id IN (
  SELECT id FROM (
    SELECT
      id,
      ROW_NUMBER() OVER (
        PARTITION BY contador_id, ano
        ORDER BY ultima_atualizacao DESC, id ASC
      ) AS rn
    FROM public.contador_performance_anual
  ) ranked
  WHERE rn > 1
);

ALTER TABLE public.contador_performance_anual
  ADD CONSTRAINT uq_contador_ano
    UNIQUE (contador_id, ano);

-- ============================================================
-- 5. TABELA DE JUNÇÃO: solicitacoes_saque_comissoes
-- ============================================================
-- O campo comissoes_ids ARRAY não suporta FK em PostgreSQL, permitindo
-- referências a comissões inexistentes sem erro do banco.
-- Esta tabela de junção garante integridade referencial plena.

CREATE TABLE IF NOT EXISTS public.solicitacoes_saque_comissoes (
  saque_id    uuid NOT NULL
    REFERENCES public.solicitacoes_saque(id) ON DELETE CASCADE,
  comissao_id uuid NOT NULL
    REFERENCES public.comissoes(id) ON DELETE RESTRICT,
  PRIMARY KEY (saque_id, comissao_id)
);

COMMENT ON TABLE public.solicitacoes_saque_comissoes IS
  'Tabela de junção que garante integridade referencial entre saques e comissões, '
  'substituindo o campo comissoes_ids ARRAY de solicitacoes_saque.';

-- Índice para lookup inverso: qual saque referencia esta comissão?
CREATE INDEX IF NOT EXISTS idx_ssc_comissao_id
  ON public.solicitacoes_saque_comissoes (comissao_id);

-- Migrar dados existentes do ARRAY para a nova tabela de junção
DO $$
DECLARE
  r           RECORD;
  comissao_id uuid;
BEGIN
  FOR r IN
    SELECT id, comissoes_ids
    FROM public.solicitacoes_saque
    WHERE comissoes_ids IS NOT NULL
      AND array_length(comissoes_ids::uuid[], 1) > 0
  LOOP
    BEGIN
      FOR comissao_id IN
        SELECT unnest(r.comissoes_ids::uuid[])
      LOOP
        -- Verificar se a comissão ainda existe antes de inserir
        IF EXISTS (SELECT 1 FROM public.comissoes WHERE id = comissao_id) THEN
          INSERT INTO public.solicitacoes_saque_comissoes (saque_id, comissao_id)
          VALUES (r.id, comissao_id)
          ON CONFLICT DO NOTHING;
        ELSE
          RAISE WARNING
            'Saque % referencia comissão % inexistente — ignorado na migração.',
            r.id, comissao_id;
        END IF;
      END LOOP;
    EXCEPTION WHEN others THEN
      RAISE WARNING
        'Falha ao migrar comissoes_ids do saque %: %', r.id, SQLERRM;
    END;
  END LOOP;
END $$;

-- Deprecar coluna legada (mantida para compatibilidade com código em produção)
-- AÇÃO FUTURA: remover comissoes_ids após confirmar que todos os endpoints
-- usam solicitacoes_saque_comissoes.
COMMENT ON COLUMN public.solicitacoes_saque.comissoes_ids IS
  'DEPRECATED — substituído pela tabela solicitacoes_saque_comissoes. '
  'Manter até conclusão da migração dos endpoints. Ver migration 20260304000001.';

-- RLS para a nova tabela de junção (herda política via saque)
ALTER TABLE public.solicitacoes_saque_comissoes ENABLE ROW LEVEL SECURITY;

-- Contadores podem ler apenas as comissões dos seus próprios saques
CREATE POLICY "contador_le_proprias_ssc"
  ON public.solicitacoes_saque_comissoes
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.solicitacoes_saque ss
      JOIN public.contadores c ON c.id = ss.contador_id
      WHERE ss.id = saque_id
        AND c.user_id = auth.uid()
    )
  );

-- Apenas admins e sistema (service_role) podem inserir/atualizar/deletar
CREATE POLICY "admin_gerencia_ssc"
  ON public.solicitacoes_saque_comissoes
  FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role = 'admin'
    )
  );
