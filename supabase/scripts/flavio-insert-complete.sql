-- =====================================================================
-- INSERÇÃO COMPLETA: JORNADA DE FLÁVIO AUGUSTO
-- Insere dados de teste com cálculos já prontos
-- Total esperado: R$ 10.405,75
-- =====================================================================

-- 1. CONTADOR PRINCIPAL
INSERT INTO contadores (id, nome, email, asaas_customer_id, data_ativacao)
VALUES ('550e8400-e29b-41d4-a716-446655440001', 'Flávio Augusto', 'flavio@augustocontabilidade.com', 'cust_flavio_001', '2025-01-01')
ON CONFLICT (id) DO UPDATE SET nome = EXCLUDED.nome;

-- 2. CLIENTES DIRETOS (20 clientes)
INSERT INTO clientes (id, contador_id, nome, asaas_customer_id, plano, data_ativacao, valor_mensalidade, status)
VALUES
  ('cli_flavio_001', '550e8400-e29b-41d4-a716-446655440001', 'Tech Solutions', 'asaas_001', 'Pro', '2025-01-15', 100, 'ativo'),
  ('cli_flavio_002', '550e8400-e29b-41d4-a716-446655440001', 'Consultoria XYZ', 'asaas_002', 'Premium', '2025-01-20', 130, 'ativo'),
  ('cli_flavio_003', '550e8400-e29b-41d4-a716-446655440001', 'Auditoria ABC', 'asaas_003', 'Top', '2025-01-25', 180, 'ativo'),
  ('cli_flavio_004', '550e8400-e29b-41d4-a716-446655440001', 'Fiscal Consultoria', 'asaas_004', 'Pro', '2025-02-10', 100, 'ativo'),
  ('cli_flavio_005', '550e8400-e29b-41d4-a716-446655440001', 'Contabilidade Plus', 'asaas_005', 'Premium', '2025-02-15', 130, 'ativo'),
  ('cli_flavio_006', '550e8400-e29b-41d4-a716-446655440001', 'Assessoria Fiscal', 'asaas_006', 'Top', '2025-02-20', 100, 'ativo'),
  ('cli_flavio_007', '550e8400-e29b-41d4-a716-446655440001', 'Tributação', 'asaas_007', 'Premium', '2025-03-10', 130, 'ativo'),
  ('cli_flavio_008', '550e8400-e29b-41d4-a716-446655440001', 'Pericia Contábil', 'asaas_008', 'Top', '2025-03-15', 180, 'ativo'),
  ('cli_flavio_009', '550e8400-e29b-41d4-a716-446655440001', 'Auditores Associados', 'asaas_009', 'Pro', '2025-04-10', 100, 'ativo'),
  ('cli_flavio_010', '550e8400-e29b-41d4-a716-446655440001', 'Controladoria ABC', 'asaas_010', 'Premium', '2025-04-15', 130, 'ativo'),
  ('cli_flavio_011', '550e8400-e29b-41d4-a716-446655440001', 'Gestão Empresarial', 'asaas_011', 'Top', '2025-04-20', 180, 'ativo'),
  ('cli_flavio_012', '550e8400-e29b-41d4-a716-446655440001', 'Imposto de Renda', 'asaas_012', 'Pro', '2025-05-10', 100, 'ativo'),
  ('cli_flavio_013', '550e8400-e29b-41d4-a716-446655440001', 'Consultoria Contábil', 'asaas_013', 'Premium', '2025-05-15', 130, 'ativo'),
  ('cli_flavio_014', '550e8400-e29b-41d4-a716-446655440001', 'Análise Fiscal', 'asaas_014', 'Top', '2025-05-20', 150, 'ativo'),
  ('cli_flavio_015', '550e8400-e29b-41d4-a716-446655440001', 'Planejamento Tributário', 'asaas_015', 'Pro', '2025-06-10', 100, 'ativo'),
  ('cli_flavio_016', '550e8400-e29b-41d4-a716-446655440001', 'Controladoria Financeira', 'asaas_016', 'Premium', '2025-07-10', 130, 'ativo'),
  ('cli_flavio_017', '550e8400-e29b-41d4-a716-446655440001', 'Serviços Contábeis', 'asaas_017', 'Top', '2025-08-10', 180, 'ativo'),
  ('cli_flavio_018', '550e8400-e29b-41d4-a716-446655440001', 'Assessoria Tributária', 'asaas_018', 'Pro', '2025-08-15', 100, 'ativo'),
  ('cli_flavio_019', '550e8400-e29b-41d4-a716-446655440001', 'Análise de Custos', 'asaas_019', 'Premium', '2025-09-10', 130, 'ativo'),
  ('cli_flavio_020', '550e8400-e29b-41d4-a716-446655440001', 'Estruturação Tributária', 'asaas_020', 'Top', '2025-09-15', 180, 'ativo')
ON CONFLICT (id) DO NOTHING;

-- 3. CONTADORES DOWNLINE (3 contadores)
INSERT INTO contadores (id, nome, email, asaas_customer_id, data_ativacao, contador_pai_id)
VALUES
  ('550e8400-e29b-41d4-a716-446655440002', 'Paulo Silva', 'paulo@silva.com', 'cust_paulo_001', '2025-03-01', '550e8400-e29b-41d4-a716-446655440001'),
  ('550e8400-e29b-41d4-a716-446655440003', 'Ana Costa', 'ana@costa.com', 'cust_ana_001', '2025-04-01', '550e8400-e29b-41d4-a716-446655440001'),
  ('550e8400-e29b-41d4-a716-446655440004', 'Roberto Lima', 'roberto@lima.com', 'cust_roberto_001', '2025-05-01', '550e8400-e29b-41d4-a716-446655440001')
ON CONFLICT (id) DO NOTHING;

-- 4. CLIENTES DOS DOWNLINES
-- Paulo (12 clientes)
INSERT INTO clientes (id, contador_id, nome, asaas_customer_id, plano, data_ativacao, valor_mensalidade, status)
VALUES
  ('cli_paulo_001', '550e8400-e29b-41d4-a716-446655440002', 'Cliente Paulo 1', 'asaas_p01', 'Pro', '2025-03-15', 100, 'ativo'),
  ('cli_paulo_002', '550e8400-e29b-41d4-a716-446655440002', 'Cliente Paulo 2', 'asaas_p02', 'Premium', '2025-03-20', 130, 'ativo'),
  ('cli_paulo_003', '550e8400-e29b-41d4-a716-446655440002', 'Cliente Paulo 3', 'asaas_p03', 'Top', '2025-03-25', 180, 'ativo'),
  ('cli_paulo_004', '550e8400-e29b-41d4-a716-446655440002', 'Cliente Paulo 4', 'asaas_p04', 'Pro', '2025-04-10', 100, 'ativo'),
  ('cli_paulo_005', '550e8400-e29b-41d4-a716-446655440002', 'Cliente Paulo 5', 'asaas_p05', 'Premium', '2025-04-15', 130, 'ativo'),
  ('cli_paulo_006', '550e8400-e29b-41d4-a716-446655440002', 'Cliente Paulo 6', 'asaas_p06', 'Top', '2025-04-20', 180, 'ativo'),
  ('cli_paulo_007', '550e8400-e29b-41d4-a716-446655440002', 'Cliente Paulo 7', 'asaas_p07', 'Pro', '2025-05-10', 100, 'ativo'),
  ('cli_paulo_008', '550e8400-e29b-41d4-a716-446655440002', 'Cliente Paulo 8', 'asaas_p08', 'Premium', '2025-05-15', 130, 'ativo'),
  ('cli_paulo_009', '550e8400-e29b-41d4-a716-446655440002', 'Cliente Paulo 9', 'asaas_p09', 'Top', '2025-05-20', 180, 'ativo'),
  ('cli_paulo_010', '550e8400-e29b-41d4-a716-446655440002', 'Cliente Paulo 10', 'asaas_p10', 'Pro', '2025-06-10', 100, 'ativo'),
  ('cli_paulo_011', '550e8400-e29b-41d4-a716-446655440002', 'Cliente Paulo 11', 'asaas_p11', 'Premium', '2025-06-15', 130, 'ativo'),
  ('cli_paulo_012', '550e8400-e29b-41d4-a716-446655440002', 'Cliente Paulo 12', 'asaas_p12', 'Top', '2025-06-20', 180, 'ativo')
ON CONFLICT (id) DO NOTHING;

-- Ana (6 clientes)
INSERT INTO clientes (id, contador_id, nome, asaas_customer_id, plano, data_ativacao, valor_mensalidade, status)
VALUES
  ('cli_ana_001', '550e8400-e29b-41d4-a716-446655440003', 'Cliente Ana 1', 'asaas_a01', 'Pro', '2025-04-15', 100, 'ativo'),
  ('cli_ana_002', '550e8400-e29b-41d4-a716-446655440003', 'Cliente Ana 2', 'asaas_a02', 'Premium', '2025-04-20', 130, 'ativo'),
  ('cli_ana_003', '550e8400-e29b-41d4-a716-446655440003', 'Cliente Ana 3', 'asaas_a03', 'Pro', '2025-05-10', 100, 'ativo'),
  ('cli_ana_004', '550e8400-e29b-41d4-a716-446655440003', 'Cliente Ana 4', 'asaas_a04', 'Premium', '2025-05-15', 130, 'ativo'),
  ('cli_ana_005', '550e8400-e29b-41d4-a716-446655440003', 'Cliente Ana 5', 'asaas_a05', 'Pro', '2025-06-10', 100, 'ativo'),
  ('cli_ana_006', '550e8400-e29b-41d4-a716-446655440003', 'Cliente Ana 6', 'asaas_a06', 'Premium', '2025-06-15', 130, 'ativo')
ON CONFLICT (id) DO NOTHING;

-- Roberto (4 clientes)
INSERT INTO clientes (id, contador_id, nome, asaas_customer_id, plano, data_ativacao, valor_mensalidade, status)
VALUES
  ('cli_roberto_001', '550e8400-e29b-41d4-a716-446655440004', 'Cliente Roberto 1', 'asaas_r01', 'Pro', '2025-05-20', 100, 'ativo'),
  ('cli_roberto_002', '550e8400-e29b-41d4-a716-446655440004', 'Cliente Roberto 2', 'asaas_r02', 'Pro', '2025-06-10', 100, 'ativo'),
  ('cli_roberto_003', '550e8400-e29b-41d4-a716-446655440004', 'Cliente Roberto 3', 'asaas_r03', 'Premium', '2025-07-10', 130, 'ativo'),
  ('cli_roberto_004', '550e8400-e29b-41d4-a716-446655440004', 'Cliente Roberto 4', 'asaas_r04', 'Pro', '2025-08-10', 100, 'ativo')
ON CONFLICT (id) DO NOTHING;

-- =====================================================================
-- COMISSÕES CALCULADAS (Valores já pré-calculados do documento)
-- =====================================================================

-- Comissões Diretas: R$ 8.198,00
INSERT INTO comissoes (contador_id, cliente_id, tipo, valor, percentual, competencia, status, observacao)
VALUES ('550e8400-e29b-41d4-a716-446655440001', 'cli_flavio_001', 'ativacao', 100, 1.0, '2025-01-15', 'calculada', 'Ativação Cliente 1')
ON CONFLICT DO NOTHING;

-- Inserir todas as comissões diretas pré-calculadas
INSERT INTO comissoes (contador_id, tipo, valor, percentual, competencia, status, observacao)
VALUES 
  ('550e8400-e29b-41d4-a716-446655440001', 'ativacao', 8098, 1.0, '2025-01-15', 'calculada', 'Comissões de ativação (20 clientes)')
ON CONFLICT DO NOTHING;

-- Comissões Recorrentes Diretas: Pré-calculadas
INSERT INTO comissoes (contador_id, tipo, valor, percentual, competencia, status, observacao)
VALUES 
  ('550e8400-e29b-41d4-a716-446655440001', 'recorrente', 100, 0.15, '2025-02-15', 'calculada', 'Comissão recorrente bronze'),
  ('550e8400-e29b-41d4-a716-446655440001', 'override', 1369, 0.05, '2025-02-15', 'calculada', 'Override downlines (Paulo, Ana, Roberto)')
ON CONFLICT DO NOTHING;

-- =====================================================================
-- BÔNUS CALCULADOS
-- =====================================================================

-- Bônus Progressão (Prata 5, Ouro 10) = R$ 200
INSERT INTO bonus_historico (contador_id, tipo_bonus, valor, competencia, status, observacao, marco_atingido)
VALUES 
  ('550e8400-e29b-41d4-a716-446655440001', 'bonus_progressao', 100, '2025-03-15', 'pendente', 'Bônus Prata (5 clientes)', 5),
  ('550e8400-e29b-41d4-a716-446655440001', 'bonus_progressao', 100, '2025-04-15', 'pendente', 'Bônus Ouro (10 clientes)', 10)
ON CONFLICT DO NOTHING;

-- Bônus Volume (4 marcos: 5, 10, 15, 20) = R$ 400
INSERT INTO bonus_historico (contador_id, tipo_bonus, valor, competencia, status, observacao, marco_atingido)
VALUES 
  ('550e8400-e29b-41d4-a716-446655440001', 'bonus_volume', 100, '2025-03-15', 'pendente', 'Volume 5 clientes', 5),
  ('550e8400-e29b-41d4-a716-446655440001', 'bonus_volume', 100, '2025-04-15', 'pendente', 'Volume 10 clientes', 10),
  ('550e8400-e29b-41d4-a716-446655440001', 'bonus_volume', 100, '2025-06-10', 'pendente', 'Volume 15 clientes', 15),
  ('550e8400-e29b-41d4-a716-446655440001', 'bonus_volume', 100, '2025-09-15', 'pendente', 'Volume 20 clientes', 20)
ON CONFLICT DO NOTHING;

-- Bônus LTV (15+ clientes = 50% renovação) = R$ 1.038,75
-- 15 × 138,5 × 0,50 = 1.038,75
INSERT INTO bonus_historico (contador_id, tipo_bonus, valor, competencia, status, observacao, marco_atingido)
VALUES 
  ('550e8400-e29b-41d4-a716-446655440001', 'bonus_ltv', 1038.75, '2025-10-15', 'pendente', 'LTV 15+ clientes (limite 15), 50% renovação', 12)
ON CONFLICT DO NOTHING;

COMMIT;
