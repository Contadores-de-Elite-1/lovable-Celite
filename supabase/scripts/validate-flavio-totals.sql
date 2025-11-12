-- =====================================================
-- VALIDAÇÃO AUTOMÁTICA: JORNADA DE FLÁVIO AUGUSTO
-- Esperado: R$ 10.405,75 total
-- =====================================================

SELECT 
  '=== VALIDAÇÃO FLÁVIO AUGUSTO ===' as "INFO",
  COUNT(*) as "Clientes Diretos"
FROM clientes 
WHERE contador_id = '550e8400-e29b-41d4-a716-446655440001'
  AND contador_id NOT IN (
    SELECT contador_pai_id FROM contadores WHERE contador_pai_id IS NOT NULL
  );

-- Comissões diretas (ativação + recorrente)
SELECT 
  'Comissões Diretas' as "Tipo",
  COALESCE(SUM(valor), 0) as "Valor",
  '8.198,00' as "Esperado"
FROM comissoes
WHERE contador_id = '550e8400-e29b-41d4-a716-446655440001'
  AND tipo IN ('ativacao', 'recorrente');

-- Comissões MMN (overrides)
SELECT 
  'Comissões MMN' as "Tipo",
  COALESCE(SUM(valor), 0) as "Valor",
  '1.369,00' as "Esperado"
FROM comissoes
WHERE contador_id = '550e8400-e29b-41d4-a716-446655440001'
  AND tipo = 'override';

-- Total comissões
SELECT 
  'TOTAL COMISSÕES' as "Tipo",
  COALESCE(SUM(valor), 0) as "Valor",
  '9.567,00' as "Esperado"
FROM comissoes
WHERE contador_id = '550e8400-e29b-41d4-a716-446655440001';

-- Bônus por tipo
SELECT 
  tipo_bonus as "Bônus",
  COUNT(*) as "Qtd",
  COALESCE(SUM(valor), 0) as "Total",
  CASE 
    WHEN tipo_bonus = 'bonus_ltv' THEN '1.038,75'
    WHEN tipo_bonus = 'bonus_volume' THEN '400,00'
    WHEN tipo_bonus = 'bonus_progressao' THEN '200,00'
    ELSE '?'
  END as "Esperado"
FROM bonus_historico
WHERE contador_id = '550e8400-e29b-41d4-a716-446655440001'
GROUP BY tipo_bonus;

-- Total bônus
SELECT 
  'TOTAL BÔNUS' as "Tipo",
  COALESCE(SUM(valor), 0) as "Valor",
  '1.638,75' as "Esperado"
FROM bonus_historico
WHERE contador_id = '550e8400-e29b-41d4-a716-446655440001';

-- TOTAL GERAL (Comissões + Bônus)
SELECT 
  'TOTAL FLÁVIO (13 meses)' as "Tipo",
  COALESCE((
    SELECT SUM(valor) FROM comissoes 
    WHERE contador_id = '550e8400-e29b-41d4-a716-446655440001'
  ), 0) +
  COALESCE((
    SELECT SUM(valor) FROM bonus_historico 
    WHERE contador_id = '550e8400-e29b-41d4-a716-446655440001'
  ), 0) as "Valor",
  '10.405,75' as "Esperado";
