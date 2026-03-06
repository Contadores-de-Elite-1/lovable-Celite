-- =============================================================================
-- MIGRATION: Performance Indexes — Índices Críticos Ausentes
-- Data: 2026-03-03
-- Descrição: Adiciona APENAS os índices genuinamente ausentes no schema.
--
-- VERIFICAÇÃO DE DUPLICATAS — índices já existentes (não recriados aqui):
--
--   20251103234439: idx_clientes_contador_id, idx_clientes_status,
--                   idx_rede_sponsor(sponsor_id), idx_rede_child(child_id),
--                   idx_pagamentos_cliente(cliente_id),
--                   idx_comissoes_status, idx_comissoes_contador,
--                   idx_audit_logs_user(user_id), idx_audit_logs_created
--   20251104012436: idx_comissao_hist_comissao(comissoa_id),
--                   idx_notif_contador_nao_lida(contador_id, lida, created_at
--                   WHERE lida=false), idx_click_logs_link(link_id)
--   20251104015746: idx_clientes_contador_status(contador_id, status)
--   20251104171819: idx_comissoes_contador_competencia(contador_id, competencia)
--   20260301000004: idx_indicacoes_cw_contador, idx_indicacoes_cw_coworking,
--                   idx_indicacoes_cw_status, idx_mensalidades_cw_mpe,
--                   idx_mensalidades_cw_coworking, idx_mensalidades_cw_competencia
--
-- Nota: PostgreSQL NÃO cria índices automaticamente para FKs —
--   apenas para PK e UNIQUE. Índices em colunas de FK são explícitos.
-- =============================================================================


-- =============================================================================
-- 1. comissoes — índice parcial para auditoria em lote
--
-- Contexto: as queries de aprovação em lote (admin) filtram WHERE auditado = false.
-- Índices existentes (status, contador_id+competencia) não cobrem esse filtro.
-- Índice parcial mantém tamanho reduzido: só registros ainda não auditados.
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_comissoes_auditado_pendente
  ON public.comissoes(created_at DESC)
  WHERE auditado = false;


-- =============================================================================
-- 2. notificacoes — índice completo (lida = true e false)
--
-- Contexto: a migration 20251104012436 criou idx_notif_contador_nao_lida,
-- um índice PARCIAL (WHERE lida = false). Esse índice não é utilizado pelo
-- PostgreSQL em queries que buscam TODAS as notificações de um contador
-- (ex: tela de histórico sem filtro). Este índice full cobre esse gap.
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_notificacoes_contador_todas
  ON public.notificacoes(contador_id, lida, created_at DESC);


-- =============================================================================
-- 3. audit_logs — índice composto (user_id + created_at)
--
-- Contexto: a migration 20251103234439 criou índices SEPARADOS em user_id e
-- created_at. Para queries de auditoria que filtram por usuário E ordenam por
-- data (padrão na tela de auditoria admin), um índice composto é mais eficiente
-- pois evita o bitmap heap scan sobre os dois índices separados.
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_created
  ON public.audit_logs(user_id, created_at DESC);


-- =============================================================================
-- 4. contadores — índice composto (nivel + status)
--
-- Contexto: queries que filtram a rede por nível específico (ex: todos os
-- Diamante ativos para o relatório de leads, promoções de nível, dashboard
-- administrativo de distribuição de níveis). Não existe índice composto
-- cobrindo esses dois campos simultaneamente.
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_contadores_nivel_status
  ON public.contadores(nivel, status);


-- =============================================================================
-- 5. indicacoes_coworking — índices compostos (contador+status, coworking+status)
--
-- Contexto: a migration 20260301000004 criou índices SEPARADOS em contador_id,
-- coworking_id e status. Para as queries mais comuns do marketplace:
--   - Contador: "minhas indicações por status" → (contador_id, status)
--   - Coworking: "indicações recebidas por status" → (coworking_id, status)
-- Índices compostos são mais eficientes que combinar dois índices separados.
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_indicacoes_cw_contador_status
  ON public.indicacoes_coworking(contador_id, status);

CREATE INDEX IF NOT EXISTS idx_indicacoes_cw_coworking_status
  ON public.indicacoes_coworking(coworking_id, status);


-- =============================================================================
-- 6. mensalidades_coworking — índice composto (coworking_id + competencia)
--
-- Contexto: a migration 20260301000004 criou índices SEPARADOS em coworking_id
-- e competencia. A query de relatório mensal (coworking filtra suas mensalidades
-- por mês) e o CRON de taxa 10% (Fluxo 2) precisam filtrar AMBOS simultaneamente.
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_mensalidades_cw_coworking_competencia
  ON public.mensalidades_coworking(coworking_id, competencia);


-- =============================================================================
-- 7. webhook_events — UNIQUE em event_id (idempotência)
--
-- Contexto: a tabela webhook_events armazena eventos do provider (Asaas/Stripe)
-- mas NÃO possui constraint UNIQUE em event_id. Sem isso, um retry do provider
-- pode inserir o mesmo evento duas vezes e disparar o processamento em duplicata,
-- gerando comissões duplicadas. Esta é a única proteção a nível de banco de dados.
-- A tabela webhook_logs tem esse UNIQUE, mas webhook_events não.
-- =============================================================================
CREATE UNIQUE INDEX IF NOT EXISTS idx_webhook_events_event_id_unique
  ON public.webhook_events(event_id);
