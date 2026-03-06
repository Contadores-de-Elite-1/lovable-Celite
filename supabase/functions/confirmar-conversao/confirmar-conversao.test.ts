// =============================================================================
// Testes unitários — confirmar-conversao
// Cobre: cálculo de taxa 20%, lógica de negócio, casos de borda
//
// Como rodar:
//   deno test supabase/functions/confirmar-conversao/confirmar-conversao.test.ts
// =============================================================================

import {
  assertEquals,
  assertAlmostEquals,
} from 'https://deno.land/std@0.224.0/assert/mod.ts';

// ─────────────────────────────────────────────────────────────────────────────
// Constantes e funções extraídas da Edge Function para teste isolado
// ─────────────────────────────────────────────────────────────────────────────

const TAXA_PLATAFORMA_PCT = 20.00;
const ESTADOS_FINAIS = ['convertida', 'paga', 'recusada'] as const;

function calcularTaxa(valorBruto: number): {
  taxa_plataforma_pct: number;
  taxa_plataforma_valor: number;
  valor_contador_liquido: number;
} {
  const taxaPlataformaValor = parseFloat((valorBruto * (TAXA_PLATAFORMA_PCT / 100)).toFixed(2));
  const valorContadorLiquido = parseFloat((valorBruto - taxaPlataformaValor).toFixed(2));
  return {
    taxa_plataforma_pct: TAXA_PLATAFORMA_PCT,
    taxa_plataforma_valor: taxaPlataformaValor,
    valor_contador_liquido: valorContadorLiquido,
  };
}

function validarPayloadConfirmacao(payload: Record<string, unknown>): string | null {
  if (!payload.indicacao_id || payload.confirmacao === undefined) {
    return 'Campos obrigatórios: indicacao_id, confirmacao';
  }
  if (payload.confirmacao === true && (!payload.valor_comissao || Number(payload.valor_comissao) <= 0)) {
    return 'valor_comissao deve ser maior que zero ao confirmar uma conversão';
  }
  if (payload.confirmacao === false && !payload.motivo_recusa) {
    return 'motivo_recusa é obrigatório ao recusar uma indicação';
  }
  return null;
}

function isEstadoFinal(status: string): boolean {
  return (ESTADOS_FINAIS as readonly string[]).includes(status);
}

function resolverCompetenciaAtual(): string {
  const now = new Date();
  const ano = now.getUTCFullYear();
  const mes = String(now.getUTCMonth() + 1).padStart(2, '0');
  return `${ano}-${mes}-01`;
}

// ─────────────────────────────────────────────────────────────────────────────
// SUITE 1: Cálculo da taxa 20% — PRD Seção 3.2
// ─────────────────────────────────────────────────────────────────────────────

Deno.test('TAXA: R$200,00 bruto → plataforma R$40,00 (20%) | Contador R$160,00 (80%)', () => {
  // Exemplo exato do PRD
  const resultado = calcularTaxa(200.00);

  assertEquals(resultado.taxa_plataforma_pct, 20.00, 'Taxa deve ser 20%');
  assertEquals(resultado.taxa_plataforma_valor, 40.00, 'Plataforma retém R$40,00');
  assertEquals(resultado.valor_contador_liquido, 160.00, 'Contador recebe R$160,00');
  assertEquals(resultado.taxa_plataforma_valor + resultado.valor_contador_liquido, 200.00, 'Soma deve totalizar o valor bruto');
});

Deno.test('TAXA: R$500,00 bruto → plataforma R$100,00 (20%) | Contador R$400,00 (80%)', () => {
  const resultado = calcularTaxa(500.00);

  assertEquals(resultado.taxa_plataforma_valor, 100.00);
  assertEquals(resultado.valor_contador_liquido, 400.00);
  assertEquals(resultado.taxa_plataforma_valor + resultado.valor_contador_liquido, 500.00);
});

Deno.test('TAXA: R$1.000,00 bruto → plataforma R$200,00 | Contador R$800,00', () => {
  const resultado = calcularTaxa(1000.00);

  assertEquals(resultado.taxa_plataforma_valor, 200.00);
  assertEquals(resultado.valor_contador_liquido, 800.00);
});

Deno.test('TAXA: R$130,00 bruto (mensalidade padrão Pro) → plataforma R$26,00 | Contador R$104,00', () => {
  const resultado = calcularTaxa(130.00);

  assertEquals(resultado.taxa_plataforma_valor, 26.00);
  assertEquals(resultado.valor_contador_liquido, 104.00);
});

Deno.test('TAXA: R$99,99 bruto → arredondamento correto (2 casas decimais)', () => {
  const resultado = calcularTaxa(99.99);

  // 99.99 × 20% = 19.998 → arredonda para 20.00
  assertEquals(resultado.taxa_plataforma_valor, 20.00);
  assertEquals(resultado.valor_contador_liquido, 79.99);
  assertEquals(
    parseFloat((resultado.taxa_plataforma_valor + resultado.valor_contador_liquido).toFixed(2)),
    99.99,
    'Soma deve totalizar o bruto'
  );
});

Deno.test('TAXA: R$0,01 bruto — valor mínimo possível', () => {
  const resultado = calcularTaxa(0.01);

  // 0.01 × 20% = 0.002 → arredonda para 0.00
  assertEquals(resultado.taxa_plataforma_valor, 0.00);
  assertEquals(resultado.valor_contador_liquido, 0.01);
});

Deno.test('TAXA: verificar que percentual é sempre exatamente 20%', () => {
  const valores = [100, 250, 750, 1500, 5000];
  for (const valor of valores) {
    const resultado = calcularTaxa(valor);
    assertEquals(resultado.taxa_plataforma_pct, 20.00, `Taxa deve ser 20% para R$${valor}`);
  }
});

Deno.test('TAXA: Contador sempre recebe 80% (verificação de múltiplos valores)', () => {
  const casosDeUso = [
    { bruto: 100, esperado_contador: 80 },
    { bruto: 200, esperado_contador: 160 },
    { bruto: 300, esperado_contador: 240 },
    { bruto: 1000, esperado_contador: 800 },
  ];

  for (const caso of casosDeUso) {
    const resultado = calcularTaxa(caso.bruto);
    assertEquals(
      resultado.valor_contador_liquido,
      caso.esperado_contador,
      `R$${caso.bruto} bruto → Contador recebe R$${caso.esperado_contador}`
    );
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// SUITE 2: Validação de payload
// ─────────────────────────────────────────────────────────────────────────────

Deno.test('PAYLOAD CONFIRMAÇÃO: válido — retorna null (sem erro)', () => {
  const erro = validarPayloadConfirmacao({
    indicacao_id: '550e8400-e29b-41d4-a716-446655440000',
    valor_comissao: 200.00,
    confirmacao: true,
  });
  assertEquals(erro, null);
});

Deno.test('PAYLOAD RECUSA: válido — retorna null (sem erro)', () => {
  const erro = validarPayloadConfirmacao({
    indicacao_id: '550e8400-e29b-41d4-a716-446655440000',
    confirmacao: false,
    motivo_recusa: 'MPE não atende aos requisitos do espaço',
  });
  assertEquals(erro, null);
});

Deno.test('PAYLOAD: faltando indicacao_id — retorna erro', () => {
  const erro = validarPayloadConfirmacao({ confirmacao: true, valor_comissao: 200 });
  assertEquals(erro, 'Campos obrigatórios: indicacao_id, confirmacao');
});

Deno.test('PAYLOAD: faltando confirmacao — retorna erro', () => {
  const erro = validarPayloadConfirmacao({ indicacao_id: '550e8400-e29b-41d4-a716-446655440000' });
  assertEquals(erro, 'Campos obrigatórios: indicacao_id, confirmacao');
});

Deno.test('PAYLOAD: confirmacao=true sem valor_comissao — retorna erro', () => {
  const erro = validarPayloadConfirmacao({
    indicacao_id: '550e8400-e29b-41d4-a716-446655440000',
    confirmacao: true,
    // valor_comissao ausente
  });
  assertEquals(erro, 'valor_comissao deve ser maior que zero ao confirmar uma conversão');
});

Deno.test('PAYLOAD: confirmacao=true com valor_comissao=0 — retorna erro', () => {
  const erro = validarPayloadConfirmacao({
    indicacao_id: '550e8400-e29b-41d4-a716-446655440000',
    confirmacao: true,
    valor_comissao: 0,
  });
  assertEquals(erro, 'valor_comissao deve ser maior que zero ao confirmar uma conversão');
});

Deno.test('PAYLOAD: confirmacao=true com valor_comissao negativo — retorna erro', () => {
  const erro = validarPayloadConfirmacao({
    indicacao_id: '550e8400-e29b-41d4-a716-446655440000',
    confirmacao: true,
    valor_comissao: -100,
  });
  assertEquals(erro, 'valor_comissao deve ser maior que zero ao confirmar uma conversão');
});

Deno.test('PAYLOAD: confirmacao=false sem motivo_recusa — retorna erro', () => {
  const erro = validarPayloadConfirmacao({
    indicacao_id: '550e8400-e29b-41d4-a716-446655440000',
    confirmacao: false,
    // motivo_recusa ausente
  });
  assertEquals(erro, 'motivo_recusa é obrigatório ao recusar uma indicação');
});

// ─────────────────────────────────────────────────────────────────────────────
// SUITE 3: Controle de estados (idempotência)
// ─────────────────────────────────────────────────────────────────────────────

Deno.test('ESTADO: "pendente" — pode ser alterado', () => {
  assertEquals(isEstadoFinal('pendente'), false);
});

Deno.test('ESTADO: "em_negociacao" — pode ser alterado', () => {
  assertEquals(isEstadoFinal('em_negociacao'), false);
});

Deno.test('ESTADO FINAL: "convertida" — NÃO pode ser reprocessada', () => {
  assertEquals(isEstadoFinal('convertida'), true);
});

Deno.test('ESTADO FINAL: "paga" — NÃO pode ser reprocessada', () => {
  assertEquals(isEstadoFinal('paga'), true);
});

Deno.test('ESTADO FINAL: "recusada" — NÃO pode ser reprocessada', () => {
  assertEquals(isEstadoFinal('recusada'), true);
});

Deno.test('ESTADO: "sem_resposta" — pode ser alterado (reabertura)', () => {
  assertEquals(isEstadoFinal('sem_resposta'), false);
});

// ─────────────────────────────────────────────────────────────────────────────
// SUITE 4: Competência
// ─────────────────────────────────────────────────────────────────────────────

Deno.test('COMPETÊNCIA: formato YYYY-MM-01 (sempre dia 01 do mês)', () => {
  const competencia = resolverCompetenciaAtual();
  // Deve ter formato YYYY-MM-01
  const regex = /^\d{4}-\d{2}-01$/;
  assertEquals(regex.test(competencia), true, `Formato inválido: ${competencia}`);
});

Deno.test('COMPETÊNCIA: mês atual (não pode ser mês passado ou futuro)', () => {
  const competencia = resolverCompetenciaAtual();
  const now = new Date();
  const anoAtual = now.getUTCFullYear().toString();
  const mesAtual = String(now.getUTCMonth() + 1).padStart(2, '0');

  assertEquals(competencia.startsWith(`${anoAtual}-${mesAtual}`), true,
    `Competência deve ser ${anoAtual}-${mesAtual}-01, mas foi ${competencia}`);
});

// ─────────────────────────────────────────────────────────────────────────────
// SUITE 5: Cenário integrado completo (PRD Seção 3.2 — exemplo numérico)
// ─────────────────────────────────────────────────────────────────────────────

Deno.test('INTEGRAÇÃO: Cenário completo do PRD — MPE paga R$200 ao Coworking', () => {
  // PRD Seção 3.2:
  // "MPE paga R$200 de mensalidade ao Coworking pela plataforma
  //   Plataforma retém (taxa de indicação 20%): R$40
  //   Contador recebe automaticamente (80%):    R$160"

  const valorBruto = 200.00;
  const resultado = calcularTaxa(valorBruto);

  // Verificações conforme PRD
  assertEquals(resultado.taxa_plataforma_pct, 20.00, 'Taxa da plataforma: 20%');
  assertEquals(resultado.taxa_plataforma_valor, 40.00, 'Plataforma retém: R$40,00');
  assertEquals(resultado.valor_contador_liquido, 160.00, 'Contador recebe: R$160,00');

  // Invariante: bruto = taxa_plataforma + valor_contador
  assertEquals(
    resultado.taxa_plataforma_valor + resultado.valor_contador_liquido,
    valorBruto,
    'Soma deve ser igual ao valor bruto (sem perda de centavos)'
  );
});

Deno.test('INTEGRAÇÃO: Múltiplas conversões — taxas calculadas independentemente', () => {
  const conversoes = [
    { bruto: 100, esperado_taxa: 20, esperado_contador: 80 },
    { bruto: 200, esperado_taxa: 40, esperado_contador: 160 },
    { bruto: 500, esperado_taxa: 100, esperado_contador: 400 },
    { bruto: 1500, esperado_taxa: 300, esperado_contador: 1200 },
  ];

  let totalTaxas = 0;
  let totalContadores = 0;

  for (const c of conversoes) {
    const resultado = calcularTaxa(c.bruto);
    assertEquals(resultado.taxa_plataforma_valor, c.esperado_taxa);
    assertEquals(resultado.valor_contador_liquido, c.esperado_contador);
    totalTaxas += resultado.taxa_plataforma_valor;
    totalContadores += resultado.valor_contador_liquido;
  }

  const totalBruto = conversoes.reduce((acc, c) => acc + c.bruto, 0);
  assertEquals(totalTaxas + totalContadores, totalBruto, 'Soma total deve igualar bruto total');
});

// ─────────────────────────────────────────────────────────────────────────────

console.log('\n=====================================================');
console.log('  SUITE DE TESTES: confirmar-conversao');
console.log('  Cálculo de taxa 20% + validação de payload + estados');
console.log('  Total: 25 testes');
console.log('=====================================================\n');
