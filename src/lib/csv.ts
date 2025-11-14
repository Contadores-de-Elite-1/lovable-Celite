// CSV export utilities

export interface CSVRow {
  [key: string]: string | number | boolean | null | undefined;
}

export const escapeCSVValue = (value: unknown): string => {
  if (value === null || value === undefined) {
    return '';
  }

  const stringValue = String(value);

  // Se contém aspas, vírgula, quebra de linha, envolve com aspas duplas
  if (stringValue.includes('"') || stringValue.includes(',') || stringValue.includes('\n')) {
    // Escapa aspas duplas duplicando-as
    return `"${stringValue.replace(/"/g, '""')}"`;
  }

  return stringValue;
};

export const convertToCSV = (
  data: CSVRow[],
  headers?: string[]
): string => {
  if (!data || data.length === 0) {
    return '';
  }

  // Se não houver headers, usar as chaves do primeiro objeto
  const csvHeaders =
    headers ||
    Object.keys(data[0]).filter((key) => data[0][key] !== undefined);

  // Criar linha de headers
  const headerRow = csvHeaders.map((header) => escapeCSVValue(header)).join(',');

  // Criar linhas de dados
  const dataRows = data.map((row) =>
    csvHeaders.map((header) => escapeCSVValue(row[header] || '')).join(',')
  );

  return [headerRow, ...dataRows].join('\n');
};

export const downloadCSV = (
  csvContent: string,
  filename: string
): void => {
  if (typeof window === 'undefined') {
    throw new Error('downloadCSV deve ser executado no browser');
  }

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const generateCSVFilename = (prefix: string = 'export'): string => {
  const date = new Date().toISOString().split('T')[0];
  return `${prefix}_${date}.csv`;
};

export const validateCSVData = (data: unknown): data is CSVRow[] => {
  if (!Array.isArray(data)) return false;
  if (data.length === 0) return true;

  // Verifica se todos são objetos
  return data.every((item) => typeof item === 'object' && item !== null);
};

export const formatCurrencyForCSV = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

export const formatDateForCSV = (dateString: string): string => {
  if (!dateString) return '';

  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;

    return date.toLocaleDateString('pt-BR');
  } catch {
    return dateString;
  }
};
