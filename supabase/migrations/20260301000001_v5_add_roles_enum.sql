-- =============================================================================
-- V5.0 Migration 1/4: Adicionar novos roles e tipos de comissão
-- Data: 2026-03-01
-- Descrição:
--   - Adiciona 'mpe' e 'coworking' ao enum app_role
--   - Adiciona 'indicacao_coworking' ao enum tipo_comissao (Fluxo 1 do Marketplace)
--
-- SEGURANÇA: ALTER TYPE ADD VALUE não é reversível (enums são append-only).
--            IF NOT EXISTS garante idempotência.
-- =============================================================================

-- Novos perfis de usuário para o ecossistema tripartite V5.0
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'mpe';
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'coworking';

-- Novo tipo de comissão gerado pelo Marketplace (Fluxo 1)
-- Acionado quando Coworking confirma conversão de indicação
ALTER TYPE tipo_comissao ADD VALUE IF NOT EXISTS 'indicacao_coworking';

-- Comentários explicativos
COMMENT ON TYPE app_role IS
  'Roles de usuário: admin (gestão total), contador (motor da plataforma),
   suporte (atendimento), mpe (cliente final), coworking (parceiro de espaço). V5.0';

COMMENT ON TYPE tipo_comissao IS
  'Tipos de bonificação: ativacao (#1), recorrente (#2-5), override (#6-10),
   bonus_progressao (#12), bonus_ltv (#14-16), bonus_rede (#11),
   lead_diamante (#17), bonus_volume (#13), bonus_contador (rede),
   indicacao_coworking (Marketplace V5.0 - Fluxo 1). V5.0';
