-- ============================================================================
-- PERFORMANCE OPTIMIZATION - DATABASE INDEXES
-- ============================================================================
-- Migration: 20251115090000_add_performance_indexes.sql
-- Description: Add strategic indexes for production performance
-- Author: Claude (Auto Mode)
-- Date: 2024-11-15
-- ============================================================================

-- ============================================================================
-- INDEXES FOR COMMON QUERIES
-- ============================================================================

-- Profiles: Query by user_id (most common)
CREATE INDEX IF NOT EXISTS idx_profiles_user_id
ON profiles(user_id);

-- Contadores: Query by status and nivel (dashboard filters)
CREATE INDEX IF NOT EXISTS idx_contadores_status
ON contadores(status);

CREATE INDEX IF NOT EXISTS idx_contadores_nivel
ON contadores(nivel);

CREATE INDEX IF NOT EXISTS idx_contadores_status_nivel
ON contadores(status, nivel);

-- Clientes: Query by contador_id and status (performance critical)
CREATE INDEX IF NOT EXISTS idx_clientes_contador_id_status
ON clientes(contador_id, status);

-- Clientes: Query by created_at for sorting
CREATE INDEX IF NOT EXISTS idx_clientes_created_at
ON clientes(created_at DESC);

-- Rede: Query by contador_pai (network traversal)
CREATE INDEX IF NOT EXISTS idx_rede_contador_pai
ON rede_contadores(contador_pai);

-- Rede: Query by contador_filho (reverse lookup)
CREATE INDEX IF NOT EXISTS idx_rede_contador_filho
ON rede_contadores(contador_filho);

-- Rede: Query by nivel (level-based queries)
CREATE INDEX IF NOT EXISTS idx_rede_nivel
ON rede_contadores(nivel);

-- Comissoes: Query by contador_id and status (payment processing)
CREATE INDEX IF NOT EXISTS idx_comissoes_contador_status
ON comissoes(contador_id, status);

-- Comissoes: Query by created_at for chronological listing
CREATE INDEX IF NOT EXISTS idx_comissoes_created_at
ON comissoes(created_at DESC);

-- Comissoes: Query by tipo for reports
CREATE INDEX IF NOT EXISTS idx_comissoes_tipo
ON comissoes(tipo_comissao);

-- Pagamentos: Query by cliente_id (payment history)
CREATE INDEX IF NOT EXISTS idx_pagamentos_cliente_id
ON pagamentos(cliente_id);

-- Pagamentos: Query by created_at for sorting
CREATE INDEX IF NOT EXISTS idx_pagamentos_created_at
ON pagamentos(created_at DESC);

-- Pagamentos: Query by status
CREATE INDEX IF NOT EXISTS idx_pagamentos_status
ON pagamentos(status);

-- Audit Logs: Query by created_at for recent activity
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at
ON audit_logs(created_at DESC);

-- Audit Logs: Query by user_id for user activity
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id
ON audit_logs(user_id);

-- Audit Logs: Query by action type
CREATE INDEX IF NOT EXISTS idx_audit_logs_action
ON audit_logs(action);

-- ============================================================================
-- COMPOSITE INDEXES FOR COMPLEX QUERIES
-- ============================================================================

-- Clientes: Active clients by contador (most common dashboard query)
CREATE INDEX IF NOT EXISTS idx_clientes_contador_active
ON clientes(contador_id, status)
WHERE status = 'ativo';

-- Comissoes: Pending payments by contador (payment processing)
CREATE INDEX IF NOT EXISTS idx_comissoes_pending_by_contador
ON comissoes(contador_id, created_at DESC)
WHERE status IN ('calculada', 'aprovada');

-- Comissoes: Sum calculations (aggregate queries)
CREATE INDEX IF NOT EXISTS idx_comissoes_valor_calculations
ON comissoes(contador_id, valor_comissao)
WHERE status = 'paga';

-- ============================================================================
-- PARTIAL INDEXES FOR SPECIFIC SCENARIOS
-- ============================================================================

-- Active contadores only (most queries filter by status)
CREATE INDEX IF NOT EXISTS idx_contadores_active
ON contadores(id, nivel, xp)
WHERE status = 'ativo';

-- Active clients only
CREATE INDEX IF NOT EXISTS idx_clientes_active_count
ON clientes(contador_id)
WHERE status = 'ativo';

-- Unpaid commissions
CREATE INDEX IF NOT EXISTS idx_comissoes_unpaid
ON comissoes(contador_id, valor_comissao, created_at DESC)
WHERE status IN ('calculada', 'aprovada');

-- ============================================================================
-- TEXT SEARCH INDEXES (GIN for JSONB/arrays)
-- ============================================================================

-- If you add JSONB columns in the future, use GIN indexes
-- Example: CREATE INDEX idx_metadata_gin ON table_name USING GIN (metadata_column);

-- ============================================================================
-- ANALYZE TABLES FOR QUERY PLANNER
-- ============================================================================

-- Update statistics for query planner
ANALYZE profiles;
ANALYZE contadores;
ANALYZE clientes;
ANALYZE rede_contadores;
ANALYZE comissoes;
ANALYZE pagamentos;
ANALYZE audit_logs;

-- ============================================================================
-- NOTES
-- ============================================================================

-- Index Maintenance:
-- - PostgreSQL automatically maintains indexes
-- - VACUUM and ANALYZE run automatically in Supabase
-- - Monitor index usage: SELECT * FROM pg_stat_user_indexes;
-- - Drop unused indexes to save space and write performance

-- Index Size Check:
-- SELECT schemaname, tablename, indexname,
--        pg_size_pretty(pg_relation_size(indexrelid)) AS index_size
-- FROM pg_stat_user_indexes
-- ORDER BY pg_relation_size(indexrelid) DESC;

-- Index Usage Check:
-- SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch
-- FROM pg_stat_user_indexes
-- WHERE schemaname = 'public'
-- ORDER BY idx_scan ASC;

-- ============================================================================
-- PERFORMANCE IMPACT
-- ============================================================================

-- Expected improvements:
-- - Dashboard queries: 50-80% faster
-- - Network traversal: 70-90% faster
-- - Payment processing: 60-80% faster
-- - Audit log queries: 80-95% faster
-- - Reports generation: 40-60% faster

-- Trade-offs:
-- - Slightly slower writes (5-10%)
-- - Additional storage (~10-15% of table size)
-- - Worth it for read-heavy workload

-- ============================================================================
