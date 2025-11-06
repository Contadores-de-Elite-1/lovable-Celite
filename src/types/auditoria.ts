// Tipos para as RPCs de auditoria

// Retorno de expected_payouts_summary()
export interface PayoutsSummary {
  pending: number;
  scheduled: number;
  paid: number;
  canceled: number;
}

// Linha da tabela expected_payouts (retornado por list_expected_payouts)
export interface ExpectedPayout {
  id: string;
  contador_id: string;
  competencia: string; // ISO date string
  category: string;
  amount: number;
  rules_version: string;
  source_ref: string | null;
  status: 'pending' | 'scheduled' | 'paid' | 'canceled';
  created_at: string; // ISO date string
}

// Linha de diff_commissions()
export interface CommissionDiff {
  contador_id: string;
  cliente_id: string;
  competencia: string; // ISO date string
  tipo: string; // tipo_comissao enum como texto
  valor_shadow: number;
  valor_oficial: number;
  delta: number;
}

// Retorno de list_admin_contadores()
export interface AdminContador {
  id: string;
  email: string;
  nome: string;
}

// Opções de filtro para a UI
export interface AuditoriaFilters {
  competencia: string; // formato: YYYY-MM-DD (primeiro dia do mês)
  status: 'all' | 'pending' | 'scheduled' | 'paid' | 'canceled';
  contadorId: string | null;
}
