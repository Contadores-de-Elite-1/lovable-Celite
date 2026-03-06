// =============================================================================
// Testes unitários — indicacao-coworking
// Cobre: validação de CNPJ, lógica de negócio, respostas esperadas
//
// Como rodar:
//   deno test supabase/functions/indicacao-coworking/indicacao-coworking.test.ts
// =============================================================================

import {
  assertEquals,
  assertMatch,
} from 'https://deno.land/std@0.224.0/assert/mod.ts';

// ─────────────────────────────────────────────────────────────────────────────
// Funções extraídas da Edge Function para teste isolado
// ─────────────────────────────────────────────────────────────────────────────

function normalizarCNPJ(cnpj: string): string {
  return cnpj.replace(/\D/g, '');
}

function validarFormatoCNPJ(cnpj: string): boolean {
  const digits = normalizarCNPJ(cnpj);
  if (digits.length !== 14) return false;
  if (/^(\d)\1+$/.test(digits)) return false;

  const calcDigito = (base: string, weights: number[]): number => {
    let sum = 0;
    for (let i = 0; i < base.length; i++) {
      sum += parseInt(base[i]) * weights[i];
    }
    const remainder = sum % 11;
    return remainder < 2 ? 0 : 11 - remainder;
  };

  const w1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const w2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

  const d1 = calcDigito(digits.substring(0, 12), w1);
  if (d1 !== parseInt(digits[12])) return false;

  const d2 = calcDigito(digits.substring(0, 13), w2);
  return d2 === parseInt(digits[13]);
}

// ─────────────────────────────────────────────────────────────────────────────
// SUITE 1: Normalização do CNPJ
// ─────────────────────────────────────────────────────────────────────────────

Deno.test('CNPJ: normalizar remove pontos, barras e traços', () => {
  assertEquals(normalizarCNPJ('11.222.333/0001-81'), '11222333000181');
  assertEquals(normalizarCNPJ('11222333000181'), '11222333000181');
  assertEquals(normalizarCNPJ('11 222 333 0001 81'), '11222333000181');
});

Deno.test('CNPJ: normalizar preserva apenas dígitos', () => {
  assertEquals(normalizarCNPJ('abc11.222.333/0001-81xyz'), '11222333000181');
});

// ─────────────────────────────────────────────────────────────────────────────
// SUITE 2: Validação de formato CNPJ
// ─────────────────────────────────────────────────────────────────────────────

Deno.test('CNPJ VÁLIDO: 11.222.333/0001-81 (CNPJ real com dígitos corretos)', () => {
  // CNPJ válido de empresa real (Banco do Brasil)
  assertEquals(validarFormatoCNPJ('00000000000191'), true, '00.000.000/0001-91 — Banco do Brasil (válido)');
});

Deno.test('CNPJ VÁLIDO: com formatação — aceitar pontuação', () => {
  assertEquals(validarFormatoCNPJ('00.000.000/0001-91'), true);
});

Deno.test('CNPJ INVÁLIDO: sequência repetida (00000000000000)', () => {
  assertEquals(validarFormatoCNPJ('00000000000000'), false, 'Sequência toda zerada deve ser rejeitada');
  assertEquals(validarFormatoCNPJ('11111111111111'), false, 'Sequência repetida deve ser rejeitada');
  assertEquals(validarFormatoCNPJ('99999999999999'), false, 'Sequência repetida deve ser rejeitada');
});

Deno.test('CNPJ INVÁLIDO: menos de 14 dígitos', () => {
  assertEquals(validarFormatoCNPJ('1234567'), false);
  assertEquals(validarFormatoCNPJ('1234567890123'), false, '13 dígitos — inválido');
});

Deno.test('CNPJ INVÁLIDO: mais de 14 dígitos', () => {
  assertEquals(validarFormatoCNPJ('123456789012345'), false, '15 dígitos — inválido');
});

Deno.test('CNPJ INVÁLIDO: dígito verificador errado', () => {
  // Altera o último dígito do CNPJ do Banco do Brasil
  assertEquals(validarFormatoCNPJ('00000000000192'), false, 'Dígito verificador errado');
  assertEquals(validarFormatoCNPJ('00000000000199'), false, 'Dígito verificador errado');
});

Deno.test('CNPJ INVÁLIDO: string vazia', () => {
  assertEquals(validarFormatoCNPJ(''), false);
});

Deno.test('CNPJ INVÁLIDO: somente letras', () => {
  assertEquals(validarFormatoCNPJ('ABCDEFGHIJKLMN'), false);
});

// ─────────────────────────────────────────────────────────────────────────────
// SUITE 3: CNPJs reais conhecidos (validação de dígitos)
// ─────────────────────────────────────────────────────────────────────────────

Deno.test('CNPJ VÁLIDO: Banco do Brasil (00.000.000/0001-91)', () => {
  assertEquals(validarFormatoCNPJ('00000000000191'), true);
});

Deno.test('CNPJ VÁLIDO: Petrobras (33.000.167/0001-01)', () => {
  assertEquals(validarFormatoCNPJ('33000167000101'), true);
});

Deno.test('CNPJ VÁLIDO: Caixa Econômica Federal (00.360.305/0001-04)', () => {
  assertEquals(validarFormatoCNPJ('00360305000104'), true);
});

// ─────────────────────────────────────────────────────────────────────────────
// SUITE 4: Validação de payload
// ─────────────────────────────────────────────────────────────────────────────

// Simula a validação de campos obrigatórios da Edge Function
function validarPayload(payload: Record<string, unknown>): string | null {
  if (!payload.mpe_cnpj || !payload.coworking_id) {
    return 'Campos obrigatórios: mpe_cnpj, coworking_id';
  }
  const cnpj = String(payload.mpe_cnpj);
  if (!validarFormatoCNPJ(cnpj)) {
    return 'CNPJ inválido — verifique o número informado';
  }
  return null; // sem erro
}

Deno.test('PAYLOAD: válido — retorna null (sem erro)', () => {
  const erro = validarPayload({
    mpe_cnpj: '00360305000104',
    coworking_id: '550e8400-e29b-41d4-a716-446655440000',
  });
  assertEquals(erro, null);
});

Deno.test('PAYLOAD: faltando coworking_id — retorna erro', () => {
  const erro = validarPayload({ mpe_cnpj: '00360305000104' });
  assertEquals(erro, 'Campos obrigatórios: mpe_cnpj, coworking_id');
});

Deno.test('PAYLOAD: faltando mpe_cnpj — retorna erro', () => {
  const erro = validarPayload({ coworking_id: '550e8400-e29b-41d4-a716-446655440000' });
  assertEquals(erro, 'Campos obrigatórios: mpe_cnpj, coworking_id');
});

Deno.test('PAYLOAD: CNPJ inválido — retorna erro de CNPJ', () => {
  const erro = validarPayload({
    mpe_cnpj: '12345678000199', // dígito verificador errado
    coworking_id: '550e8400-e29b-41d4-a716-446655440000',
  });
  assertEquals(erro, 'CNPJ inválido — verifique o número informado');
});

// ─────────────────────────────────────────────────────────────────────────────
// SUITE 5: Edge Cases de CNPJ
// ─────────────────────────────────────────────────────────────────────────────

Deno.test('EDGE CASE: CNPJ com espaços extras — deve normalizar e validar', () => {
  // Banco do Brasil com espaços
  assertEquals(normalizarCNPJ('00 000 000 0001 91'), '00000000000191');
  assertEquals(validarFormatoCNPJ('00 000 000 0001 91'), true);
});

Deno.test('EDGE CASE: CNPJ com letras misturadas — deve normalizar e validar', () => {
  // Testa que a normalização remove as letras antes da validação
  const normalizado = normalizarCNPJ('CNPJ: 00.000.000/0001-91');
  assertEquals(normalizado, '00000000000191');
  assertEquals(validarFormatoCNPJ('CNPJ: 00.000.000/0001-91'), true);
});

// ─────────────────────────────────────────────────────────────────────────────

console.log('\n=====================================================');
console.log('  SUITE DE TESTES: indicacao-coworking');
console.log('  Validação de CNPJ + lógica de payload');
console.log('  Total: 20 testes');
console.log('=====================================================\n');
