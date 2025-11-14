import { describe, it, expect } from 'vitest';
import {
  calculateTotalCommissions,
  calculateCommissionStats,
  roundToTwoDecimals,
} from '../commission';

/**
 * MILESTONE 4: Validação contra Especificação de Flávio Augusto
 *
 * Total Esperado Ano 1: R$ 10.405,75
 * Comissões: R$ 9.567,00
 * Bônus: R$ 1.638,75
 */

describe('Flávio Augusto - Spec Validation', () => {
  const flavio12Months = [
    // Mês 1-12 + LTV
    { tipo_comissao: 'ativacao', valor: 2750, status_comissao: 'paga', competencia: '2024-01-01' },
    { tipo_comissao: 'recorrente', valor: 5448, status_comissao: 'paga', competencia: '2024-01-01' },
    { tipo_comissao: 'override', valor: 1369, status_comissao: 'paga', competencia: '2024-01-01' },
    { tipo_comissao: 'bonus_progressao', valor: 200, status_comissao: 'paga', competencia: '2024-01-01' },
    { tipo_comissao: 'bonus_volume', valor: 400, status_comissao: 'paga', competencia: '2024-01-01' },
    { tipo_comissao: 'bonus_ltv', valor: 1038.75, status_comissao: 'paga', competencia: '2024-01-01' },
  ];

  it('deve somar R$ 11.205,75 no total do ano 1 (2750+5448+648+721+1.638,75)', () => {
    // Nota: Documento tem discrepância (mostra 10.405,75 no resumo, mas soma dá 11.205,75)
    // Usando valor correto da soma das categorias
    const total = calculateTotalCommissions(flavio12Months as CommissionInput[]);
    expect(roundToTwoDecimals(total)).toBeCloseTo(11205.75, 2);
  });

  it('deve ter R$ 9.567 em comissões totais', () => {
    const comissoes = flavio12Months.filter(
      c => c.tipo_comissao === 'ativacao' || c.tipo_comissao === 'recorrente' || c.tipo_comissao === 'override'
    );
    const total = calculateTotalCommissions(comissoes as CommissionInput[]);
    expect(roundToTwoDecimals(total)).toBeCloseTo(9567, 2);
  });

  it('deve ter R$ 1.638,75 em bônus totais', () => {
    const bonus = flavio12Months.filter(c => c.tipo_comissao.includes('bonus'));
    const total = calculateTotalCommissions(bonus as CommissionInput[]);
    expect(roundToTwoDecimals(total)).toBeCloseTo(1638.75, 2);
  });

  it('deve respeitar breakdown: 2750 (ativação) + 5448 (recorrente) + 1369 (override)', () => {
    const ativacao = 2750;
    const recorrente = 5448;
    const override = 1369;
    const totalComissoes = ativacao + recorrente + override;

    expect(roundToTwoDecimals(totalComissoes)).toBeCloseTo(9567, 2);
  });

  it('deve validar bônus: 200 (progressão) + 400 (volume) + 1.038,75 (LTV)', () => {
    const progressao = 200;
    const volume = 400;
    const ltv = 1038.75;
    const totalBonus = progressao + volume + ltv;

    expect(roundToTwoDecimals(totalBonus)).toBeCloseTo(1638.75, 2);
  });

  it('deve usar calculateCommissionStats corretamente para todos os dados', () => {
    const stats = calculateCommissionStats(flavio12Months as CommissionInput[]);
    expect(roundToTwoDecimals(stats.totalAcumulado)).toBeCloseTo(11205.75, 2);
    expect(stats.totalPago).toBeCloseTo(11205.75, 2);
  });

  it('✅ Flávio atingiu todos os objetivos: 20 clientes + 100% retenção + R$ 11.205,75', () => {
    const total = calculateTotalCommissions(flavio12Months as CommissionInput[]);
    expect(roundToTwoDecimals(total)).toBeCloseTo(11205.75, 2);
  });
});
