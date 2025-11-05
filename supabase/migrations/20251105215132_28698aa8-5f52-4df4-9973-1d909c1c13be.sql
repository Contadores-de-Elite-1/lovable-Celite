-- ============================================================
-- CORREÇÃO FINAL: Remover views SECURITY DEFINER antigas
-- ============================================================

-- As 4 views antigas (cursos_edu, vw_comissoes_detalhadas, vw_dashboard_contador, vw_links_desempenho)
-- ainda existem com SECURITY DEFINER. Vou recriar com DROP CASCADE para garantir que sejam substituídas.

DROP VIEW IF EXISTS public.cursos_edu CASCADE;
CREATE VIEW public.cursos_edu AS
SELECT 
  c.id,
  c.titulo,
  c.nivel,
  c.duracao,
  e.contador_id,
  e.progresso,
  e.status,
  e.certificado_url
FROM courses c
LEFT JOIN enrollments e ON c.id = e.course_id;

DROP VIEW IF EXISTS public.vw_comissoes_detalhadas CASCADE;
CREATE VIEW public.vw_comissoes_detalhadas AS
SELECT 
  c.id,
  c.contador_id,
  c.tipo,
  c.valor,
  c.percentual,
  c.competencia,
  c.status,
  c.pago_em,
  c.created_at,
  c.pagamento_id,
  cli.id AS cliente_id,
  cli.nome_empresa AS cliente_nome,
  cli.cnpj AS cliente_cnpj,
  cli.plano AS cliente_plano,
  p.valor_bruto AS pagamento_valor,
  p.tipo AS pagamento_tipo,
  p.status AS pagamento_status,
  p.competencia AS pagamento_competencia
FROM comissoes c
LEFT JOIN clientes cli ON c.cliente_id = cli.id
LEFT JOIN pagamentos p ON c.pagamento_id = p.id;

DROP VIEW IF EXISTS public.vw_dashboard_contador CASCADE;
CREATE VIEW public.vw_dashboard_contador AS
SELECT 
  cnt.id AS contador_id,
  cnt.user_id,
  cnt.nivel,
  cnt.xp,
  cnt.clientes_ativos,
  COALESCE(SUM(CASE WHEN com.status = 'calculada' THEN com.valor ELSE 0 END), 0) AS total_comissoes_provisionadas,
  COUNT(DISTINCT CASE WHEN com.tipo IN ('ativacao', 'recorrente') THEN com.id END) AS total_comissoes_diretas,
  COUNT(DISTINCT CASE WHEN com.tipo = 'override' THEN com.id END) AS total_comissoes_indiretas,
  COALESCE(SUM(CASE WHEN com.status = 'paga' THEN com.valor ELSE 0 END), 0) AS total_comissoes_pagas,
  COUNT(DISTINCT l.id) AS total_links,
  COALESCE(SUM(l.cliques), 0) AS total_cliques,
  COALESCE(SUM(l.conversoes), 0) AS total_conversoes,
  COUNT(DISTINCT cli.id) FILTER (WHERE cli.status = 'ativo') AS clientes_ativos_count,
  COUNT(DISTINCT e.id) AS cursos_matriculados,
  COUNT(DISTINCT e.id) FILTER (WHERE e.status = 'concluido') AS cursos_concluidos
FROM contadores cnt
LEFT JOIN comissoes com ON cnt.id = com.contador_id
LEFT JOIN links l ON cnt.id = l.contador_id
LEFT JOIN clientes cli ON cnt.id = cli.contador_id
LEFT JOIN enrollments e ON cnt.id = e.contador_id
GROUP BY cnt.id, cnt.user_id, cnt.nivel, cnt.xp, cnt.clientes_ativos;

DROP VIEW IF EXISTS public.vw_links_desempenho CASCADE;
CREATE VIEW public.vw_links_desempenho AS
SELECT 
  l.id,
  l.contador_id,
  l.token,
  l.tipo,
  l.canal,
  l.cliques,
  l.conversoes,
  l.created_at,
  CASE 
    WHEN l.cliques > 0 THEN ROUND((l.conversoes::numeric / l.cliques::numeric) * 100, 2)
    ELSE 0 
  END AS taxa
FROM links l;