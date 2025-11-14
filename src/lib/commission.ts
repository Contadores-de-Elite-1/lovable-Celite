// Commission calculation utilities

export interface CommissionInput {
  valor: number;
  tipo_comissao: string;
  status_comissao: string;
  competencia: string;
}

export interface CommissionStats {
  totalAcumulado: number;
  totalPago: number;
  totalPendente: number;
  mediaMonthly: number;
  totalComissoes: number;
}

export const calculateTotalCommissions = (
  commissions: CommissionInput[]
): number => {
  if (!commissions || commissions.length === 0) return 0;
  return commissions.reduce((sum, c) => sum + Number(c.valor), 0);
};

export const calculatePaidCommissions = (
  commissions: CommissionInput[]
): number => {
  if (!commissions || commissions.length === 0) return 0;
  return commissions
    .filter((c) => c.status_comissao === 'paga')
    .reduce((sum, c) => sum + Number(c.valor), 0);
};

export const calculatePendingCommissions = (
  total: number,
  paid: number
): number => {
  return Math.max(0, total - paid);
};

export const calculateMonthlyAverage = (
  total: number,
  months: number = 12
): number => {
  if (months <= 0) return 0;
  return total / months;
};

export const calculateCommissionStats = (
  commissions: CommissionInput[]
): CommissionStats => {
  const totalAcumulado = calculateTotalCommissions(commissions);
  const totalPago = calculatePaidCommissions(commissions);
  const totalPendente = calculatePendingCommissions(totalAcumulado, totalPago);
  const mediaMonthly = calculateMonthlyAverage(totalAcumulado);

  return {
    totalAcumulado,
    totalPago,
    totalPendente,
    mediaMonthly,
    totalComissoes: commissions.length,
  };
};

export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

export const roundToTwoDecimals = (value: number): number => {
  return Math.round(value * 100) / 100;
};

export const isValidCommissionValue = (value: unknown): boolean => {
  if (value === null || value === undefined) return false;
  const num = Number(value);
  return !isNaN(num) && isFinite(num);
};

export const validateCommissionData = (commission: unknown): boolean => {
  if (typeof commission !== 'object' || commission === null) return false;

  const c = commission as Record<string, unknown>;
  return (
    isValidCommissionValue(c.valor) &&
    typeof c.tipo_comissao === 'string' &&
    typeof c.status_comissao === 'string' &&
    typeof c.competencia === 'string'
  );
};
