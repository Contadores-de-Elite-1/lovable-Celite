// Filter and validation utilities

export interface FilterInput {
  startDate?: string;
  endDate?: string;
  status?: string;
}

export const isValidDate = (dateString: string): boolean => {
  if (!dateString) return false;
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime());
};

export const isDateInRange = (
  dateString: string,
  startDate?: string,
  endDate?: string
): boolean => {
  if (!isValidDate(dateString)) return false;

  const date = new Date(dateString);

  if (startDate && isValidDate(startDate)) {
    const start = new Date(startDate);
    if (date < start) return false;
  }

  if (endDate && isValidDate(endDate)) {
    const end = new Date(endDate);
    if (date > end) return false;
  }

  return true;
};

export const filterByDateRange = (
  items: { competencia: string }[],
  startDate?: string,
  endDate?: string
): { competencia: string }[] => {
  if (!items) return [];

  return items.filter((item) =>
    isDateInRange(item.competencia, startDate, endDate)
  );
};

export const filterByStatus = (
  items: { status_comissao: string }[],
  status: string
): { status_comissao: string }[] => {
  if (!items || !status) return items;
  if (status.toLowerCase() === 'all' || status === '') return items;

  return items.filter((item) => item.status_comissao === status);
};

export const filterByMultipleCriteria = (
  items: {
    competencia: string;
    status_comissao: string;
  }[],
  filter: FilterInput
): {
  competencia: string;
  status_comissao: string;
}[] => {
  if (!items) return [];

  let filtered = items;

  if (filter.startDate || filter.endDate) {
    filtered = filterByDateRange(filtered, filter.startDate, filter.endDate);
  }

  if (filter.status) {
    filtered = filterByStatus(filtered, filter.status);
  }

  return filtered;
};

export const validateStatus = (status: string): boolean => {
  const validStatuses = ['calculada', 'aprovada', 'paga', 'cancelada', 'all'];
  return validStatuses.includes(status.toLowerCase());
};

export const validateDateFormat = (dateString: string): boolean => {
  if (!dateString) return false;
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  return regex.test(dateString);
};

export const getMonthFromDate = (dateString: string): string => {
  if (!isValidDate(dateString)) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
};

export const getDateRange = (
  items: { competencia: string }[]
): { earliest: string; latest: string } | null => {
  if (!items || items.length === 0) return null;

  const dates = items
    .map((item) => new Date(item.competencia))
    .filter((date) => !isNaN(date.getTime()));

  if (dates.length === 0) return null;

  const sorted = dates.sort((a, b) => a.getTime() - b.getTime());

  return {
    earliest: sorted[0].toISOString().split('T')[0],
    latest: sorted[sorted.length - 1].toISOString().split('T')[0],
  };
};
