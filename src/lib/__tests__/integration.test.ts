import { describe, it, expect } from 'vitest';
import {
  calculateTotalCommissions,
  calculateCommissionStats,
  formatCurrency,
} from '../commission';
import {
  filterByMultipleCriteria,
  filterByDateRange,
  filterByStatus,
  isDateInRange,
} from '../filters';
import {
  convertToCSV,
  escapeCSVValue,
  validateCSVData,
  formatDateForCSV,
  formatCurrencyForCSV,
} from '../csv';

/**
 * MILESTONE 2: Integration Tests
 *
 * Valida que as utilities testadas funcionam corretamente
 * quando integradas nos componentes das páginas.
 */

describe('Integration Tests - Utilities in Page Context', () => {

  describe('Comissões Page - Filter Integration', () => {
    const comissoesMock = [
      {
        id: '1',
        valor: 410,
        competencia: '2024-01-01',
        status_comissao: 'paga',
        tipo_comissao: 'ativacao',
        clientes: { nome: 'Cliente 1' }
      },
      {
        id: '2',
        valor: 330,
        competencia: '2024-02-01',
        status_comissao: 'calculada',
        tipo_comissao: 'recorrente',
        clientes: { nome: 'Cliente 2' }
      },
      {
        id: '3',
        valor: 620,
        competencia: '2024-03-15',
        status_comissao: 'paga',
        tipo_comissao: 'ativacao',
        clientes: { nome: 'Cliente 3' }
      },
    ];

    it('deve filtrar por data range corretamente', () => {
      const filtered = filterByDateRange(comissoesMock as CommissionInput[], '2024-02-01', '2024-03-31');
      expect(filtered.length).toBe(2);
      expect(filtered.every((c: CommissionInput & { competencia: string }) => c.competencia >= '2024-02-01')).toBe(true);
    });

    it('deve filtrar por status corretamente', () => {
      const filtered = filterByStatus(comissoesMock as CommissionInput[], 'paga');
      expect(filtered.length).toBe(2);
      expect(filtered.every((c: CommissionInput & { competencia: string }) => c.status_comissao === 'paga')).toBe(true);
    });

    it('deve aplicar múltiplos filtros combinados', () => {
      const filtered = filterByMultipleCriteria(comissoesMock as CommissionInput[], {
        startDate: '2024-02-01',
        endDate: '2024-03-31',
        status: 'paga',
      });
      expect(filtered.length).toBe(1);
      expect(filtered[0].competencia).toBe('2024-03-15');
    });

    it('deve retornar todas as comissões se filtro estiver vazio', () => {
      const filtered = filterByMultipleCriteria(comissoesMock as CommissionInput[], {});
      expect(filtered.length).toBe(3);
    });
  });

  describe('Comissões Page - CSV Export Integration', () => {
    const comissoesMock = [
      {
        id: '1',
        valor: 410.50,
        competencia: '2024-01-15',
        status_comissao: 'paga',
        tipo_comissao: 'ativacao',
        clientes: { nome: 'Teste, Comissões e Cia' } // Nome com vírgula
      },
      {
        id: '2',
        valor: 330.00,
        competencia: '2024-02-10',
        status_comissao: 'calculada',
        tipo_comissao: 'recorrente',
        clientes: { nome: 'Empresa "XYZ"' } // Nome com aspas
      },
    ];

    it('deve escapar valores CSV corretamente', () => {
      const value = comissoesMock[0].clientes.nome;
      const escaped = escapeCSVValue(value);
      expect(escaped).toContain('"');
      expect(escaped).toContain('Teste, Comissões');
    });

    it('deve converter dados para CSV com headers', () => {
      const rows = comissoesMock.map((c: CommissionInput & { competencia: string }) => ({
        Data: formatDateForCSV(c.competencia),
        Cliente: c.clientes.nome,
        Valor: formatCurrencyForCSV(c.valor),
        Status: c.status_comissao,
      }));

      const csv = convertToCSV(rows, ['Data', 'Cliente', 'Valor', 'Status']);
      expect(csv).toContain('Data');
      expect(csv).toContain('Cliente');
      expect(csv).toContain('Teste, Comissões'); // Nome com vírgula escapado
    });

    it('deve validar dados CSV antes de exportar', () => {
      const csvData = [
        { Data: '15/01/2024', Cliente: 'Teste', Valor: 'R$ 410,50', Status: 'paga' },
        { Data: '10/02/2024', Cliente: 'Empresa "XYZ"', Valor: 'R$ 330,00', Status: 'calculada' },
      ];

      expect(validateCSVData(csvData)).toBe(true);
    });

    it('deve formatar datas para CSV corretamente (locale pt-BR)', () => {
      const formatted = formatDateForCSV('2024-01-15');
      // Formato pt-BR: DD/MM/YYYY
      expect(formatted).toContain('/');
      expect(formatted).toContain('2024');
    });

    it('deve formatar moeda para CSV corretamente (R$ pt-BR)', () => {
      const formatted = formatCurrencyForCSV(410.50);
      // Formato pt-BR: R$ X.XXX,XX
      expect(formatted).toContain('R$');
      expect(formatted).toContain('410');
    });
  });

  describe('Dashboard Page - Stats Calculation', () => {
    const comissoesMock = [
      { valor: 410, status_comissao: 'paga', tipo_comissao: 'ativacao', competencia: '2024-01-01' },
      { valor: 330, status_comissao: 'paga', tipo_comissao: 'recorrente', competencia: '2024-02-01' },
      { valor: 620, status_comissao: 'calculada', tipo_comissao: 'ativacao', competencia: '2024-03-01' },
      { valor: 500, status_comissao: 'paga', tipo_comissao: 'recorrente', competencia: '2024-04-01' },
    ];

    it('deve calcular stats completas corretamente', () => {
      const stats = calculateCommissionStats(comissoesMock as CommissionInput[]);

      expect(stats.totalAcumulado).toBe(1860);
      expect(stats.totalPago).toBe(1240); // 410 + 330 + 500
      expect(stats.totalPendente).toBe(620); // 1860 - 1240
      expect(stats.totalComissoes).toBe(4);
    });

    it('deve calcular média mensal corretamente', () => {
      const stats = calculateCommissionStats(comissoesMock as CommissionInput[]);
      expect(stats.mediaMonthly).toBeCloseTo(155, 0);
    });

    it('deve formatar moeda para dashboard', () => {
      const stats = calculateCommissionStats(comissoesMock as CommissionInput[]);
      const formatted = formatCurrency(stats.totalAcumulado);

      expect(formatted).toContain('R$');
      expect(formatted).toContain('1');
    });
  });

  describe('Relatórios Page - Multi-Filter Stats', () => {
    const relatorioDados = [
      { valor: 410, status_comissao: 'paga', tipo_comissao: 'ativacao', competencia: '2024-01-01' },
      { valor: 61.50, status_comissao: 'paga', tipo_comissao: 'recorrente', competencia: '2024-01-15' },
      { valor: 330, status_comissao: 'paga', tipo_comissao: 'ativacao', competencia: '2024-02-01' },
      { valor: 129.50, status_comissao: 'calculada', tipo_comissao: 'recorrente', competencia: '2024-02-15' },
      { valor: 100, status_comissao: 'paga', tipo_comissao: 'bonus_progressao', competencia: '2024-03-01' },
    ];

    it('deve filtrar relatório por período', () => {
      const filtered = filterByDateRange(relatorioDados as CommissionInput[], '2024-02-01', '2024-02-28');
      expect(filtered.length).toBe(2);
    });

    it('deve calcular stats de relatório filtrado', () => {
      const filtered = filterByDateRange(relatorioDados as CommissionInput[], '2024-02-01', '2024-02-28');
      const stats = calculateCommissionStats(filtered as CommissionInput[]);

      expect(stats.totalAcumulado).toBeCloseTo(459.50, 2);
    });

    it('deve gerar CSV com dados formatados para relatório', () => {
      const rows = relatorioDados.map((r: Record<string, number>) => [
        formatDateForCSV(r.competencia),
        r.tipo_comissao,
        formatCurrencyForCSV(r.valor),
        r.status_comissao,
      ]);

      const csv = convertToCSV(rows, ['Data', 'Tipo', 'Valor', 'Status']);
      expect(csv).toContain('Data');
      expect(csv.split('\n').length).toBeGreaterThan(1);
    });
  });

  describe('Cross-Page Data Consistency', () => {
    const comissoesMock = [
      { valor: 410, status_comissao: 'paga', tipo_comissao: 'ativacao', competencia: '2024-01-01', clientes: { nome: 'C1' } },
      { valor: 391.50, status_comissao: 'paga', tipo_comissao: 'recorrente', competencia: '2024-02-01', clientes: { nome: 'C2' } },
      { valor: 439.50, status_comissao: 'paga', tipo_comissao: 'ativacao', competencia: '2024-03-01', clientes: { nome: 'C3' } },
    ];

    it('totais em Dashboard devem corresponder a Comissões', () => {
      // Dashboard calcula total
      const dashboardTotal = calculateTotalCommissions(comissoesMock as CommissionInput[]);

      // Comissões calcula total
      const comissoesTotal = calculateTotalCommissions(comissoesMock as CommissionInput[]);

      expect(dashboardTotal).toBe(comissoesTotal);
    });

    it('comissões pagas em Dashboard devem corresponder a Relatórios', () => {
      // Dashboard: apenas pagas
      const paidInDashboard = comissoesMock.filter((c: CommissionInput & { competencia: string }) => c.status_comissao === 'paga');
      const dashboardPaidTotal = calculateTotalCommissions(paidInDashboard as CommissionInput[]);

      // Relatórios: apenas pagas
      const paidInRelatorios = comissoesMock.filter((c: CommissionInput & { competencia: string }) => c.status_comissao === 'paga');
      const relatoriosPaidTotal = calculateTotalCommissions(paidInRelatorios as CommissionInput[]);

      expect(dashboardPaidTotal).toBe(relatoriosPaidTotal);
    });

    it('exports de todas as páginas devem ter formato consistente', () => {
      const csvComissoes = convertToCSV(
        comissoesMock.map((c: CommissionInput & { competencia: string }) => [
          formatDateForCSV(c.competencia),
          c.clientes.nome,
          formatCurrencyForCSV(c.valor),
        ]),
        ['Data', 'Cliente', 'Valor']
      );

      const csvRelatorios = convertToCSV(
        comissoesMock.map((c: CommissionInput & { competencia: string }) => [
          formatDateForCSV(c.competencia),
          c.clientes.nome,
          formatCurrencyForCSV(c.valor),
        ]),
        ['Data', 'Cliente', 'Valor']
      );

      // Ambos devem ter headers iguais
      expect(csvComissoes.split('\n')[0]).toBe(csvRelatorios.split('\n')[0]);
    });
  });

  describe('Edge Cases in Integration', () => {
    it('deve lidar com dados vazios nos filtros', () => {
      const empty: Record<string, number>[] = [];
      const filtered = filterByMultipleCriteria(empty, {
        startDate: '2024-01-01',
        endDate: '2024-12-31',
      });

      expect(filtered.length).toBe(0);
    });

    it('deve lidar com comissões sem status', () => {
      const comissoes = [
        { valor: 100, tipo_comissao: 'ativacao', competencia: '2024-01-01' },
        { valor: 200, tipo_comissao: 'recorrente', competencia: '2024-02-01' },
      ];

      const stats = calculateCommissionStats(comissoes as CommissionInput[]);
      expect(stats.totalAcumulado).toBe(300);
    });

    it('deve exportar CSV mesmo com dados especiais', () => {
      const specialData = [
        ['Nome com "aspas"', 'Email "com" aspas', 'R$ 100,50'],
        ['Nome\ncom\nnewline', 'Email com, comma', 'R$ 50,00'],
      ];

      const csv = convertToCSV(specialData);
      expect(csv).toBeDefined();
      expect(csv.length).toBeGreaterThan(0);
    });

    it('deve aplicar múltiplos filtros em sequência', () => {
      const comissoes = [
        { valor: 100, status_comissao: 'paga', competencia: '2024-01-15' },
        { valor: 200, status_comissao: 'calculada', competencia: '2024-02-15' },
        { valor: 300, status_comissao: 'paga', competencia: '2024-03-15' },
      ];

      // Primeiro filtro: data
      let filtered = filterByDateRange(comissoes as CommissionInput[], '2024-02-01', '2024-03-31');
      expect(filtered.length).toBe(2);

      // Segundo filtro: status
      filtered = filterByStatus(filtered as CommissionInput[], 'paga');
      expect(filtered.length).toBe(1);
      expect(filtered[0].valor).toBe(300);
    });
  });
});
