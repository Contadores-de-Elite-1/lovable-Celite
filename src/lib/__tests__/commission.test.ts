import { describe, it, expect } from 'vitest';
import {
  calculateTotalCommissions,
  calculatePaidCommissions,
  calculatePendingCommissions,
  calculateMonthlyAverage,
  calculateCommissionStats,
  formatCurrency,
  roundToTwoDecimals,
  isValidCommissionValue,
  validateCommissionData,
  CommissionInput,
} from '../commission';

describe('Commission Calculations', () => {
  describe('calculateTotalCommissions', () => {
    it('deve retornar 0 para array vazio', () => {
      expect(calculateTotalCommissions([])).toBe(0);
    });

    it('deve retornar 0 para null ou undefined', () => {
      expect(calculateTotalCommissions(null as any)).toBe(0);
      expect(calculateTotalCommissions(undefined as any)).toBe(0);
    });

    it('deve somar corretamente valores de comissões', () => {
      const commissions: CommissionInput[] = [
        {
          valor: 100,
          tipo_comissao: 'ativacao',
          status_comissao: 'paga',
          competencia: '2024-01-01',
        },
        {
          valor: 200,
          tipo_comissao: 'recorrente',
          status_comissao: 'paga',
          competencia: '2024-01-01',
        },
        {
          valor: 50,
          tipo_comissao: 'bonus_volume',
          status_comissao: 'calculada',
          competencia: '2024-01-01',
        },
      ];
      expect(calculateTotalCommissions(commissions)).toBe(350);
    });

    it('deve lidar com valores decimais', () => {
      const commissions: CommissionInput[] = [
        {
          valor: 100.5,
          tipo_comissao: 'ativacao',
          status_comissao: 'paga',
          competencia: '2024-01-01',
        },
        {
          valor: 200.25,
          tipo_comissao: 'recorrente',
          status_comissao: 'paga',
          competencia: '2024-01-01',
        },
      ];
      expect(calculateTotalCommissions(commissions)).toBeCloseTo(300.75, 2);
    });

    it('deve lidar com valores negativos (conversão para número)', () => {
      const commissions: CommissionInput[] = [
        {
          valor: 100,
          tipo_comissao: 'ativacao',
          status_comissao: 'paga',
          competencia: '2024-01-01',
        },
        {
          valor: -50,
          tipo_comissao: 'desconto',
          status_comissao: 'cancelada',
          competencia: '2024-01-01',
        },
      ];
      expect(calculateTotalCommissions(commissions)).toBe(50);
    });
  });

  describe('calculatePaidCommissions', () => {
    it('deve retornar apenas comissões com status paga', () => {
      const commissions: CommissionInput[] = [
        {
          valor: 100,
          tipo_comissao: 'ativacao',
          status_comissao: 'paga',
          competencia: '2024-01-01',
        },
        {
          valor: 200,
          tipo_comissao: 'recorrente',
          status_comissao: 'calculada',
          competencia: '2024-01-01',
        },
        {
          valor: 150,
          tipo_comissao: 'bonus_volume',
          status_comissao: 'paga',
          competencia: '2024-01-01',
        },
      ];
      expect(calculatePaidCommissions(commissions)).toBe(250);
    });

    it('deve retornar 0 se nenhuma comissão for paga', () => {
      const commissions: CommissionInput[] = [
        {
          valor: 100,
          tipo_comissao: 'ativacao',
          status_comissao: 'calculada',
          competencia: '2024-01-01',
        },
        {
          valor: 200,
          tipo_comissao: 'recorrente',
          status_comissao: 'aprovada',
          competencia: '2024-01-01',
        },
      ];
      expect(calculatePaidCommissions(commissions)).toBe(0);
    });
  });

  describe('calculatePendingCommissions', () => {
    it('deve calcular corretamente comissões pendentes', () => {
      const total = 1000;
      const paid = 600;
      expect(calculatePendingCommissions(total, paid)).toBe(400);
    });

    it('deve retornar 0 se tudo foi pago', () => {
      expect(calculatePendingCommissions(1000, 1000)).toBe(0);
    });

    it('deve retornar 0 se o total pago é maior que o total', () => {
      expect(calculatePendingCommissions(1000, 1500)).toBe(0);
    });

    it('deve retornar o total se nada foi pago', () => {
      expect(calculatePendingCommissions(1000, 0)).toBe(1000);
    });
  });

  describe('calculateMonthlyAverage', () => {
    it('deve calcular a média mensal corretamente', () => {
      expect(calculateMonthlyAverage(1200, 12)).toBe(100);
      expect(calculateMonthlyAverage(2400, 12)).toBe(200);
    });

    it('deve usar 12 meses como padrão', () => {
      expect(calculateMonthlyAverage(1200)).toBe(100);
    });

    it('deve retornar 0 para months <= 0', () => {
      expect(calculateMonthlyAverage(1000, 0)).toBe(0);
      expect(calculateMonthlyAverage(1000, -5)).toBe(0);
    });

    it('deve lidar com decimais', () => {
      expect(calculateMonthlyAverage(1000, 3)).toBeCloseTo(333.33, 1);
    });
  });

  describe('calculateCommissionStats', () => {
    it('deve calcular stats completas corretamente', () => {
      const commissions: CommissionInput[] = [
        {
          valor: 100,
          tipo_comissao: 'ativacao',
          status_comissao: 'paga',
          competencia: '2024-01-01',
        },
        {
          valor: 200,
          tipo_comissao: 'recorrente',
          status_comissao: 'paga',
          competencia: '2024-01-01',
        },
        {
          valor: 150,
          tipo_comissao: 'bonus_volume',
          status_comissao: 'calculada',
          competencia: '2024-01-01',
        },
      ];

      const stats = calculateCommissionStats(commissions);

      expect(stats.totalAcumulado).toBe(450);
      expect(stats.totalPago).toBe(300);
      expect(stats.totalPendente).toBe(150);
      expect(stats.mediaMonthly).toBe(37.5);
      expect(stats.totalComissoes).toBe(3);
    });

    it('deve retornar stats zeradas para array vazio', () => {
      const stats = calculateCommissionStats([]);

      expect(stats.totalAcumulado).toBe(0);
      expect(stats.totalPago).toBe(0);
      expect(stats.totalPendente).toBe(0);
      expect(stats.mediaMonthly).toBe(0);
      expect(stats.totalComissoes).toBe(0);
    });
  });

  describe('formatCurrency', () => {
    it('deve formatar valor em Real brasileiro', () => {
      const formatted = formatCurrency(100);
      expect(formatted).toContain('R$');
      expect(formatted).toContain('100');
    });

    it('deve incluir separadores decimais', () => {
      const formatted = formatCurrency(1000.50);
      expect(formatted).toContain('R$');
    });

    it('deve formatar 0 corretamente', () => {
      expect(formatCurrency(0)).toContain('0');
    });
  });

  describe('roundToTwoDecimals', () => {
    it('deve arredondar para duas casas decimais', () => {
      expect(roundToTwoDecimals(100.125)).toBeCloseTo(100.13, 2);
      expect(roundToTwoDecimals(100.126)).toBeCloseTo(100.13, 2);
    });

    it('deve lidar com valores já arredondados', () => {
      expect(roundToTwoDecimals(100.10)).toBe(100.1);
    });

    it('deve retornar 0 para 0', () => {
      expect(roundToTwoDecimals(0)).toBe(0);
    });
  });

  describe('isValidCommissionValue', () => {
    it('deve validar números positivos', () => {
      expect(isValidCommissionValue(100)).toBe(true);
      expect(isValidCommissionValue(0)).toBe(true);
      expect(isValidCommissionValue(0.01)).toBe(true);
    });

    it('deve aceitar números negativos como válidos', () => {
      expect(isValidCommissionValue(-100)).toBe(true);
    });

    it('deve rejeitar NaN', () => {
      expect(isValidCommissionValue(NaN)).toBe(false);
    });

    it('deve rejeitar Infinity', () => {
      expect(isValidCommissionValue(Infinity)).toBe(false);
    });

    it('deve rejeitar null e undefined', () => {
      expect(isValidCommissionValue(null)).toBe(false);
      expect(isValidCommissionValue(undefined)).toBe(false);
    });

    it('deve converter strings numéricas válidas', () => {
      expect(isValidCommissionValue('100')).toBe(true);
      expect(isValidCommissionValue('100.50')).toBe(true);
    });

    it('deve rejeitar strings não numéricas', () => {
      expect(isValidCommissionValue('abc')).toBe(false);
    });
  });

  describe('validateCommissionData', () => {
    it('deve validar comissão válida', () => {
      const commission: CommissionInput = {
        valor: 100,
        tipo_comissao: 'ativacao',
        status_comissao: 'paga',
        competencia: '2024-01-01',
      };
      expect(validateCommissionData(commission)).toBe(true);
    });

    it('deve rejeitar comissão sem valor', () => {
      expect(
        validateCommissionData({
          tipo_comissao: 'ativacao',
          status_comissao: 'paga',
          competencia: '2024-01-01',
        })
      ).toBe(false);
    });

    it('deve rejeitar comissão com tipo_comissao inválido', () => {
      expect(
        validateCommissionData({
          valor: 100,
          tipo_comissao: 123,
          status_comissao: 'paga',
          competencia: '2024-01-01',
        })
      ).toBe(false);
    });

    it('deve rejeitar null ou undefined', () => {
      expect(validateCommissionData(null)).toBe(false);
      expect(validateCommissionData(undefined)).toBe(false);
    });

    it('deve rejeitar valores não-objeto', () => {
      expect(validateCommissionData('string')).toBe(false);
      expect(validateCommissionData(123)).toBe(false);
    });
  });
});
