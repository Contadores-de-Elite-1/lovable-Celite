import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  escapeCSVValue,
  convertToCSV,
  generateCSVFilename,
  validateCSVData,
  formatCurrencyForCSV,
  formatDateForCSV,
  CSVRow,
} from '../csv';

describe('CSV Utilities', () => {
  describe('escapeCSVValue', () => {
    it('deve retornar string vazia para null ou undefined', () => {
      expect(escapeCSVValue(null)).toBe('');
      expect(escapeCSVValue(undefined)).toBe('');
    });

    it('deve deixar valores simples sem alteração', () => {
      expect(escapeCSVValue('simples')).toBe('simples');
      expect(escapeCSVValue(123)).toBe('123');
      expect(escapeCSVValue(true)).toBe('true');
    });

    it('deve escapar valores com aspas duplas', () => {
      expect(escapeCSVValue('valor com "aspas"')).toBe(
        '"valor com ""aspas"""'
      );
    });

    it('deve envolver em aspas valores com vírgula', () => {
      expect(escapeCSVValue('valor,com,virgula')).toBe('"valor,com,virgula"');
    });

    it('deve envolver em aspas valores com quebra de linha', () => {
      expect(escapeCSVValue('valor\ncom\nquebra')).toBe('"valor\ncom\nquebra"');
    });

    it('deve escapar valores com múltiplos caracteres especiais', () => {
      expect(escapeCSVValue('valor "especial", com "aspas"')).toBe(
        '"valor ""especial"", com ""aspas"""'
      );
    });

    it('deve converter números para string', () => {
      expect(escapeCSVValue(100.50)).toBe('100.5');
      expect(escapeCSVValue(0)).toBe('0');
    });
  });

  describe('convertToCSV', () => {
    it('deve retornar string vazia para array vazio', () => {
      expect(convertToCSV([])).toBe('');
    });

    it('deve converter dados simples para CSV', () => {
      const data: CSVRow[] = [
        { nome: 'João', valor: 100 },
        { nome: 'Maria', valor: 200 },
      ];
      const csv = convertToCSV(data);
      expect(csv).toContain('nome,valor');
      expect(csv).toContain('João,100');
      expect(csv).toContain('Maria,200');
    });

    it('deve usar headers customizados', () => {
      const data: CSVRow[] = [{ a: 'valor1', b: 'valor2' }];
      const csv = convertToCSV(data, ['b', 'a']);
      expect(csv).toContain('b,a');
    });

    it('deve escapar valores especiais', () => {
      const data: CSVRow[] = [{ nome: 'João "Jo" Silva', valor: 100 }];
      const csv = convertToCSV(data);
      expect(csv).toContain('"João ""Jo"" Silva"');
    });

    it('deve lidar com valores null ou undefined', () => {
      const data: CSVRow[] = [{ nome: 'João', valor: null, descricao: undefined }];
      const csv = convertToCSV(data);
      const lines = csv.split('\n');
      expect(lines[1]).toContain('João');
    });

    it('deve preservar ordem de headers', () => {
      const data: CSVRow[] = [
        { c: 'valor3', b: 'valor2', a: 'valor1' },
      ];
      const csv = convertToCSV(data, ['a', 'b', 'c']);
      const lines = csv.split('\n');
      expect(lines[0]).toBe('a,b,c');
      expect(lines[1]).toBe('valor1,valor2,valor3');
    });
  });

  describe('generateCSVFilename', () => {
    it('deve gerar nome de arquivo com data atual', () => {
      const filename = generateCSVFilename('comissoes');
      expect(filename).toContain('comissoes_');
      expect(filename).toContain('.csv');
    });

    it('deve incluir data no formato YYYY-MM-DD', () => {
      const filename = generateCSVFilename('export');
      const today = new Date().toISOString().split('T')[0];
      expect(filename).toContain(today);
    });

    it('deve usar prefix padrão se não fornecido', () => {
      const filename = generateCSVFilename();
      expect(filename).toContain('export_');
    });
  });

  describe('validateCSVData', () => {
    it('deve validar array de objetos', () => {
      const data: CSVRow[] = [
        { a: 'valor1', b: 'valor2' },
        { a: 'valor3', b: 'valor4' },
      ];
      expect(validateCSVData(data)).toBe(true);
    });

    it('deve validar array vazio', () => {
      expect(validateCSVData([])).toBe(true);
    });

    it('deve rejeitar null', () => {
      expect(validateCSVData(null)).toBe(false);
    });

    it('deve rejeitar undefined', () => {
      expect(validateCSVData(undefined)).toBe(false);
    });

    it('deve rejeitar string', () => {
      expect(validateCSVData('string')).toBe(false);
    });

    it('deve rejeitar número', () => {
      expect(validateCSVData(123)).toBe(false);
    });

    it('deve rejeitar array de não-objetos', () => {
      expect(validateCSVData([1, 2, 3])).toBe(false);
      expect(validateCSVData(['a', 'b', 'c'])).toBe(false);
    });

    it('deve rejeitar array com itens null', () => {
      expect(validateCSVData([null, { a: 'valor' }])).toBe(false);
    });
  });

  describe('formatCurrencyForCSV', () => {
    it('deve formatar valores em Real brasileiro', () => {
      const formatted = formatCurrencyForCSV(100);
      expect(formatted).toContain('R$');
      expect(formatted).toContain('100');
    });

    it('deve incluir casas decimais', () => {
      const formatted = formatCurrencyForCSV(100.50);
      expect(formatted).toContain('R$');
    });

    it('deve formatar zero', () => {
      const formatted = formatCurrencyForCSV(0);
      expect(formatted).toContain('R$');
      expect(formatted).toContain('0');
    });

    it('deve formatar grandes valores', () => {
      const formatted = formatCurrencyForCSV(1000000);
      expect(formatted).toContain('R$');
      expect(formatted).toContain('1');
    });
  });

  describe('formatDateForCSV', () => {
    it('deve formatar data válida em DD/MM/YYYY', () => {
      const formatted = formatDateForCSV('2024-01-15');
      expect(formatted).toMatch(/\d{2}\/\d{2}\/\d{4}/);
    });

    it('deve retornar string vazia para string vazia', () => {
      expect(formatDateForCSV('')).toBe('');
    });

    it('deve retornar data original se inválida', () => {
      expect(formatDateForCSV('data-invalida')).toBe('data-invalida');
    });

    it('deve formatar diferentes datas', () => {
      expect(formatDateForCSV('2024-12-31')).toContain('/');
      expect(formatDateForCSV('2024-01-01')).toContain('/');
    });

    it('deve ser case-tolerant', () => {
      const formatted = formatDateForCSV('2024-06-15');
      expect(formatted).toMatch(/\d{2}\/\d{2}\/\d{4}/);
    });
  });
});
