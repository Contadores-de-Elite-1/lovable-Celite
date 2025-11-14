import { describe, it, expect } from 'vitest';
import {
  isValidDate,
  isDateInRange,
  filterByDateRange,
  filterByStatus,
  filterByMultipleCriteria,
  validateStatus,
  validateDateFormat,
  getMonthFromDate,
  getDateRange,
  FilterInput,
} from '../filters';

describe('Filter Utilities', () => {
  describe('isValidDate', () => {
    it('deve validar datas válidas', () => {
      expect(isValidDate('2024-01-01')).toBe(true);
      expect(isValidDate('2024-12-31')).toBe(true);
    });

    it('deve rejeitar datas inválidas', () => {
      expect(isValidDate('2024-13-01')).toBe(false);
      expect(isValidDate('2024-01-32')).toBe(false);
    });

    it('deve rejeitar string vazia', () => {
      expect(isValidDate('')).toBe(false);
    });

    it('deve rejeitar null ou undefined', () => {
      expect(isValidDate(null as unknown as string)).toBe(false);
      expect(isValidDate(undefined as unknown as string)).toBe(false);
    });
  });

  describe('isDateInRange', () => {
    it('deve validar data dentro do intervalo', () => {
      const date = '2024-06-15';
      const start = '2024-01-01';
      const end = '2024-12-31';
      expect(isDateInRange(date, start, end)).toBe(true);
    });

    it('deve rejeitar data antes do início', () => {
      const date = '2023-12-31';
      const start = '2024-01-01';
      const end = '2024-12-31';
      expect(isDateInRange(date, start, end)).toBe(false);
    });

    it('deve rejeitar data depois do final', () => {
      const date = '2025-01-01';
      const start = '2024-01-01';
      const end = '2024-12-31';
      expect(isDateInRange(date, start, end)).toBe(false);
    });

    it('deve validar data sem data de início', () => {
      const date = '2024-06-15';
      const end = '2024-12-31';
      expect(isDateInRange(date, undefined, end)).toBe(true);
    });

    it('deve validar data sem data de fim', () => {
      const date = '2024-06-15';
      const start = '2024-01-01';
      expect(isDateInRange(date, start, undefined)).toBe(true);
    });

    it('deve validar data sem nenhum intervalo', () => {
      const date = '2024-06-15';
      expect(isDateInRange(date)).toBe(true);
    });

    it('deve rejeitar data inválida', () => {
      expect(isDateInRange('data-invalida', '2024-01-01', '2024-12-31')).toBe(
        false
      );
    });
  });

  describe('filterByDateRange', () => {
    const items = [
      { competencia: '2024-01-15' },
      { competencia: '2024-06-15' },
      { competencia: '2024-12-15' },
      { competencia: '2025-01-15' },
    ];

    it('deve filtrar itens por intervalo de datas', () => {
      const result = filterByDateRange(items, '2024-01-01', '2024-12-31');
      expect(result).toHaveLength(3);
    });

    it('deve retornar array vazio se nenhum item corresponder', () => {
      const result = filterByDateRange(items, '2025-06-01', '2025-12-31');
      expect(result).toHaveLength(0);
    });

    it('deve retornar todos os itens sem filtro de data', () => {
      const result = filterByDateRange(items);
      expect(result).toHaveLength(4);
    });

    it('deve lidar com array vazio', () => {
      const result = filterByDateRange([], '2024-01-01', '2024-12-31');
      expect(result).toHaveLength(0);
    });

    it('deve lidar com null ou undefined', () => {
      expect(filterByDateRange(null as unknown as FilterInput[])).toHaveLength(0);
      expect(filterByDateRange(undefined as unknown as FilterInput[])).toHaveLength(0);
    });
  });

  describe('filterByStatus', () => {
    const items = [
      { status_comissao: 'paga' },
      { status_comissao: 'calculada' },
      { status_comissao: 'paga' },
      { status_comissao: 'aprovada' },
    ];

    it('deve filtrar itens por status', () => {
      const result = filterByStatus(items, 'paga');
      expect(result).toHaveLength(2);
      expect(result.every((item) => item.status_comissao === 'paga')).toBe(true);
    });

    it('deve retornar todos os itens para status all', () => {
      const result = filterByStatus(items, 'all');
      expect(result).toHaveLength(4);
    });

    it('deve retornar todos os itens para string vazia', () => {
      const result = filterByStatus(items, '');
      expect(result).toHaveLength(4);
    });

    it('deve retornar array vazio se nenhum item corresponder', () => {
      const result = filterByStatus(items, 'cancelada');
      expect(result).toHaveLength(0);
    });

    it('deve ser case-insensitive para all', () => {
      const result = filterByStatus(items, 'ALL');
      expect(result).toHaveLength(4);
    });
  });

  describe('filterByMultipleCriteria', () => {
    const items = [
      { competencia: '2024-01-15', status_comissao: 'paga' },
      { competencia: '2024-06-15', status_comissao: 'calculada' },
      { competencia: '2024-12-15', status_comissao: 'paga' },
      { competencia: '2025-01-15', status_comissao: 'aprovada' },
    ];

    it('deve filtrar por data e status', () => {
      const filter: FilterInput = {
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        status: 'paga',
      };
      const result = filterByMultipleCriteria(items, filter);
      expect(result).toHaveLength(2);
    });

    it('deve filtrar apenas por data', () => {
      const filter: FilterInput = {
        startDate: '2024-01-01',
        endDate: '2024-12-31',
      };
      const result = filterByMultipleCriteria(items, filter);
      expect(result).toHaveLength(3);
    });

    it('deve filtrar apenas por status', () => {
      const filter: FilterInput = { status: 'paga' };
      const result = filterByMultipleCriteria(items, filter);
      expect(result).toHaveLength(2);
    });

    it('deve retornar todos os itens para filtro vazio', () => {
      const filter: FilterInput = {};
      const result = filterByMultipleCriteria(items, filter);
      expect(result).toHaveLength(4);
    });
  });

  describe('validateStatus', () => {
    it('deve validar status válidos', () => {
      expect(validateStatus('calculada')).toBe(true);
      expect(validateStatus('aprovada')).toBe(true);
      expect(validateStatus('paga')).toBe(true);
      expect(validateStatus('cancelada')).toBe(true);
      expect(validateStatus('all')).toBe(true);
    });

    it('deve ser case-insensitive', () => {
      expect(validateStatus('PAGA')).toBe(true);
      expect(validateStatus('Aprovada')).toBe(true);
    });

    it('deve rejeitar status inválidos', () => {
      expect(validateStatus('invalido')).toBe(false);
      expect(validateStatus('pendente')).toBe(false);
    });

    it('deve rejeitar string vazia', () => {
      expect(validateStatus('')).toBe(false);
    });
  });

  describe('validateDateFormat', () => {
    it('deve validar formato YYYY-MM-DD', () => {
      expect(validateDateFormat('2024-01-01')).toBe(true);
      expect(validateDateFormat('2024-12-31')).toBe(true);
    });

    it('deve rejeitar formatos inválidos', () => {
      expect(validateDateFormat('01/01/2024')).toBe(false);
      expect(validateDateFormat('2024/01/01')).toBe(false);
      expect(validateDateFormat('01-01-2024')).toBe(false);
    });

    it('deve rejeitar string vazia', () => {
      expect(validateDateFormat('')).toBe(false);
    });

    it('deve rejeitar null ou undefined', () => {
      expect(validateDateFormat(null as unknown as string)).toBe(false);
      expect(validateDateFormat(undefined as unknown as string)).toBe(false);
    });
  });

  describe('getMonthFromDate', () => {
    it('deve extrair mês de uma data válida', () => {
      const month = getMonthFromDate('2024-01-15');
      expect(month).toBeTruthy();
      expect(month).toContain('24');
    });

    it('deve retornar string vazia para data inválida', () => {
      expect(getMonthFromDate('data-invalida')).toBe('');
      expect(getMonthFromDate('')).toBe('');
    });
  });

  describe('getDateRange', () => {
    const items = [
      { competencia: '2024-06-15' },
      { competencia: '2024-01-01' },
      { competencia: '2024-12-31' },
    ];

    it('deve retornar intervalo de datas', () => {
      const range = getDateRange(items);
      expect(range).not.toBeNull();
      expect(range?.earliest).toBe('2024-01-01');
      expect(range?.latest).toBe('2024-12-31');
    });

    it('deve retornar null para array vazio', () => {
      expect(getDateRange([])).toBeNull();
    });

    it('deve retornar null para null ou undefined', () => {
      expect(getDateRange(null as unknown as FilterInput[])).toBeNull();
      expect(getDateRange(undefined as unknown as FilterInput[])).toBeNull();
    });

    it('deve ignorar datas inválidas', () => {
      const mixedItems = [
        { competencia: '2024-06-15' },
        { competencia: 'data-invalida' },
        { competencia: '2024-01-01' },
      ];
      const range = getDateRange(mixedItems);
      expect(range?.earliest).toBe('2024-01-01');
      expect(range?.latest).toBe('2024-06-15');
    });
  });
});
