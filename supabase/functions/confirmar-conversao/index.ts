/**
 * confirmar-conversao — Edge Function V5.0
 *
 * Permite que um Coworking confirme ou recuse uma indicação de MPE recebida.
 * Quando confirmada, calcula automaticamente:
 *  - Taxa da plataforma: 20% do valor bruto
 *  - Valor líquido do Contador: 80% do valor bruto
 *
 * Fluxo de confirmação:
 *  1. Autentica o Coworking via JWT
 *  2. Valida payload (indicacao_id, valor_comissao, confirmacao)
 *  3. Garante que a indicação pertence ao Coworking autenticado
 *  4. Garante idempotência (indicação já convertida não é reprocessada)
 *  5. Se confirmacao = true:
 *     a. Calcula taxa 20% e valor líquido 80%
 *     b. Atualiza indicacoes_coworking → status: 'convertida'
 *     c. Cria comissão para o Contador (status: 'aprovada')
 *     d. Registra receita em transacoes_plataforma
 *     e. Atualiza mpes.coworking_ativo_id
 *  6. Se confirmacao = false: marca status como 'recusada'
 *  7. Registra em audit_logs
 *  8. Retorna { success: true, ... }
 *
 * Regras de negócio:
 *  - Apenas o Coworking dono da indicação pode confirmar/recusar
 *  - Indicações 'convertida', 'paga', 'recusada' são imutáveis
 *  - valor_comissao > 0 obrigatório quando confirmacao = true
 *  - A taxa 20% é fixada pelo PRD (não editável pelo Coworking)
 *
 * Erros tratados:
 *  - 401: não autenticado
 *  - 403: usuário não é Coworking ou não é dono da indicação
 *  - 400: payload inválido ou estado inválido
 *  - 404: indicação não encontrada
 *  - 409: indicação já processada (idempotência)
 *  - 500: erro interno
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { logError, logInfo, logWarn } from '../_shared/logger.ts';

// ── Clientes ──────────────────────────────────────────────────────────────────

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

// ── CORS ──────────────────────────────────────────────────────────────────────

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ── Tipos ─────────────────────────────────────────────────────────────────────

interface ConfirmarConversaoPayload {
  indicacao_id: string;
  /** Valor bruto da comissão definida pelo Coworking (em BRL) */
  valor_comissao?: number;
  /** true = converter indicação; false = recusar indicação */
  confirmacao: boolean;
  /** Motivo da recusa (obrigatório quando confirmacao = false) */
  motivo_recusa?: string;
}

// ── Constantes de negócio ─────────────────────────────────────────────────────

/** Taxa retida pela plataforma sobre a comissão do Contador — PRD Seção 3.2 */
const TAXA_PLATAFORMA_PCT = 20.00; // 20%

/** Estados finais — indicações nesses estados não podem ser alteradas */
const ESTADOS_FINAIS = ['convertida', 'paga', 'recusada'] as const;

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Retorna a competência atual no formato YYYY-MM-01.
 * Usado para registrar em qual mês a conversão ocorreu.
 */
function resolverCompetenciaAtual(): string {
  const now = new Date();
  const ano = now.getUTCFullYear();
  const mes = String(now.getUTCMonth() + 1).padStart(2, '0');
  return `${ano}-${mes}-01`;
}

// ── Handler principal ─────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  // Preflight CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders });
  }

  // ── 1. Autenticação ─────────────────────────────────────────────────────────
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return new Response(
      JSON.stringify({ error: 'Token de autenticação ausente' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const supabaseUser = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    { global: { headers: { Authorization: authHeader } } }
  );

  const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
  if (authError || !user) {
    return new Response(
      JSON.stringify({ error: 'Não autenticado' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // ── 2. Verificar role 'coworking' ───────────────────────────────────────────
  const { data: roleData } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!roleData || roleData.role !== 'coworking') {
    return new Response(
      JSON.stringify({ error: 'Apenas Coworkings podem confirmar ou recusar indicações' }),
      { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // ── 3. Obter registro do Coworking ──────────────────────────────────────────
  const { data: coworking, error: errCoworking } = await supabase
    .from('coworkings')
    .select('id, nome_fantasia, ativo')
    .eq('user_id', user.id)
    .maybeSingle();

  if (errCoworking || !coworking || !coworking.ativo) {
    return new Response(
      JSON.stringify({ error: 'Perfil de Coworking não encontrado ou inativo' }),
      { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // ── 4. Validar payload ──────────────────────────────────────────────────────
  let payload: ConfirmarConversaoPayload;
  try {
    payload = await req.json() as ConfirmarConversaoPayload;
  } catch {
    return new Response(
      JSON.stringify({ error: 'Payload JSON inválido' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const { indicacao_id, valor_comissao, confirmacao, motivo_recusa } = payload;

  if (!indicacao_id || confirmacao === undefined) {
    return new Response(
      JSON.stringify({ error: 'Campos obrigatórios: indicacao_id, confirmacao' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  if (confirmacao && (!valor_comissao || valor_comissao <= 0)) {
    return new Response(
      JSON.stringify({ error: 'valor_comissao deve ser maior que zero ao confirmar uma conversão' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  if (!confirmacao && !motivo_recusa) {
    return new Response(
      JSON.stringify({ error: 'motivo_recusa é obrigatório ao recusar uma indicação' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // ── 5. Buscar indicação ─────────────────────────────────────────────────────
  const { data: indicacao, error: errIndicacao } = await supabase
    .from('indicacoes_coworking')
    .select('id, contador_id, mpe_id, coworking_id, status')
    .eq('id', indicacao_id)
    .maybeSingle();

  if (errIndicacao || !indicacao) {
    return new Response(
      JSON.stringify({ error: 'Indicação não encontrada' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // ── 6. Verificar propriedade (o Coworking é dono desta indicação?) ──────────
  if (indicacao.coworking_id !== coworking.id) {
    return new Response(
      JSON.stringify({ error: 'Esta indicação não pertence ao seu Coworking' }),
      { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // ── 7. Verificar estado da indicação (idempotência) ─────────────────────────
  if ((ESTADOS_FINAIS as readonly string[]).includes(indicacao.status)) {
    return new Response(
      JSON.stringify({
        error: `Esta indicação já foi processada (status: ${indicacao.status}) e não pode ser alterada`,
        status_atual: indicacao.status,
      }),
      { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const competencia = resolverCompetenciaAtual();

  // ══════════════════════════════════════════════════════════════════════════════
  // RECUSA — fluxo simples
  // ══════════════════════════════════════════════════════════════════════════════
  if (!confirmacao) {
    const { error: errRecusa } = await supabase
      .from('indicacoes_coworking')
      .update({
        status: 'recusada',
        motivo_recusa: motivo_recusa ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', indicacao_id);

    if (errRecusa) {
      logError('[confirmar-conversao] Erro ao recusar indicação', {
        error: errRecusa.message,
        indicacao_id,
      });
      return new Response(
        JSON.stringify({ error: 'Erro ao recusar indicação. Tente novamente.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    logInfo('[confirmar-conversao] Indicação recusada', {
      indicacao_id,
      coworking_id: coworking.id,
      motivo: motivo_recusa,
    });

    await supabase.from('audit_logs').insert({
      acao: 'INDICACAO_COWORKING_RECUSADA',
      tabela: 'indicacoes_coworking',
      registro_id: indicacao_id,
      payload: {
        coworking_id: coworking.id,
        coworking_nome: coworking.nome_fantasia,
        contador_id: indicacao.contador_id,
        motivo_recusa: motivo_recusa ?? null,
      },
    }).catch((err) => logWarn('[confirmar-conversao] Falha ao registrar audit log', { error: err.message }));

    return new Response(
      JSON.stringify({
        success: true,
        acao: 'recusada',
        indicacao_id,
        mensagem: 'Indicação recusada com sucesso. O Contador será notificado.',
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // CONFIRMAÇÃO — fluxo principal com cálculo de taxa
  // ══════════════════════════════════════════════════════════════════════════════

  // ── 8. Calcular valores (PRD Seção 3.2) ────────────────────────────────────
  //
  //  Exemplo: valor_comissao = R$200,00
  //   → taxa_plataforma (20%): R$40,00
  //   → valor_contador_liquido (80%): R$160,00
  //
  const valorBruto = valor_comissao!;
  const taxaPlataformaValor = parseFloat((valorBruto * (TAXA_PLATAFORMA_PCT / 100)).toFixed(2));
  const valorContadorLiquido = parseFloat((valorBruto - taxaPlataformaValor).toFixed(2));

  logInfo('[confirmar-conversao] Calculando taxa da plataforma', {
    valor_bruto: valorBruto,
    taxa_pct: TAXA_PLATAFORMA_PCT,
    taxa_valor: taxaPlataformaValor,
    valor_liquido_contador: valorContadorLiquido,
  });

  // ── 9. Atualizar indicação → status: 'convertida' ───────────────────────────
  const { error: errUpdate } = await supabase
    .from('indicacoes_coworking')
    .update({
      status: 'convertida',
      data_conversao: new Date().toISOString(),
      valor_comissao_bruta: valorBruto,
      taxa_plataforma_pct: TAXA_PLATAFORMA_PCT,
      taxa_plataforma_valor: taxaPlataformaValor,
      valor_contador_liquido: valorContadorLiquido,
      updated_at: new Date().toISOString(),
    })
    .eq('id', indicacao_id);

  if (errUpdate) {
    logError('[confirmar-conversao] Erro ao atualizar indicação', {
      error: errUpdate.message,
      indicacao_id,
    });
    return new Response(
      JSON.stringify({ error: 'Erro ao confirmar conversão. Tente novamente.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // ── 10. Criar comissão para o Contador ──────────────────────────────────────
  //
  // tipo: 'indicacao_coworking' — valor do enum tipo_comissao (migration v5_add_roles_enum)
  // status: 'aprovada' — comissão de indicação é aprovada automaticamente
  // (diferente das comissões das 17 bonificações que passam por aprovação manual)
  //
  const { data: novaComissao, error: errComissao } = await supabase
    .from('comissoes')
    .insert({
      contador_id: indicacao.contador_id,
      tipo: 'indicacao_coworking',        // enum tipo_comissao (adicionado na migration v5_add_roles_enum)
      base_calculo: valorBruto,
      percentual_aplicado: 100 - TAXA_PLATAFORMA_PCT, // 80%
      valor: valorContadorLiquido,
      status: 'aprovada',
      competencia,
      observacao: `Indicação convertida — ${coworking.nome_fantasia} (ID: ${indicacao_id})`,
    })
    .select('id')
    .single();

  if (errComissao) {
    logError('[confirmar-conversao] Erro ao criar comissão', {
      error: errComissao.message,
      contador_id: indicacao.contador_id,
      indicacao_id,
    });
    // Rollback manual: reverter indicação para status anterior ('pendente' ou 'em_negociacao')
    await supabase
      .from('indicacoes_coworking')
      .update({
        status: indicacao.status,
        data_conversao: null,
        valor_comissao_bruta: null,
        taxa_plataforma_pct: 20,
        taxa_plataforma_valor: null,
        valor_contador_liquido: null,
      })
      .eq('id', indicacao_id);

    return new Response(
      JSON.stringify({ error: 'Erro ao registrar comissão do Contador. Operação revertida.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  logInfo('[confirmar-conversao] Comissão criada para o Contador', {
    comissao_id: novaComissao.id,
    contador_id: indicacao.contador_id,
    valor: valorContadorLiquido,
  });

  // ── 11. Registrar receita da plataforma ─────────────────────────────────────
  const { error: errTransacao } = await supabase
    .from('transacoes_plataforma')
    .insert({
      tipo: 'taxa_indicacao',
      indicacao_id,
      valor_bruto: valorBruto,
      taxa_pct: TAXA_PLATAFORMA_PCT,
      valor_plataforma: taxaPlataformaValor,
      competencia,
    });

  if (errTransacao) {
    // Não fatal — comissão e indicação já foram criadas corretamente
    logWarn('[confirmar-conversao] Falha ao registrar transacao_plataforma', {
      error: errTransacao.message,
      indicacao_id,
    });
  }

  // ── 12. Atualizar coworking_ativo_id na MPE ─────────────────────────────────
  if (indicacao.mpe_id) {
    const { error: errMPE } = await supabase
      .from('mpes')
      .update({ coworking_ativo_id: coworking.id })
      .eq('id', indicacao.mpe_id);

    if (errMPE) {
      logWarn('[confirmar-conversao] Falha ao atualizar coworking_ativo_id na MPE', {
        error: errMPE.message,
        mpe_id: indicacao.mpe_id,
      });
    }
  }

  // ── 13. Audit log ────────────────────────────────────────────────────────────
  await supabase.from('audit_logs').insert({
    acao: 'INDICACAO_COWORKING_CONVERTIDA',
    tabela: 'indicacoes_coworking',
    registro_id: indicacao_id,
    payload: {
      coworking_id: coworking.id,
      coworking_nome: coworking.nome_fantasia,
      contador_id: indicacao.contador_id,
      mpe_id: indicacao.mpe_id,
      valor_bruto: valorBruto,
      taxa_plataforma_pct: TAXA_PLATAFORMA_PCT,
      taxa_plataforma_valor: taxaPlataformaValor,
      valor_contador_liquido: valorContadorLiquido,
      comissao_id: novaComissao.id,
      competencia,
    },
  }).catch((err) => logWarn('[confirmar-conversao] Falha ao registrar audit log', { error: err.message }));

  logInfo('[confirmar-conversao] Conversão processada com sucesso', {
    indicacao_id,
    comissao_id: novaComissao.id,
    taxa_plataforma: taxaPlataformaValor,
    valor_contador: valorContadorLiquido,
  });

  return new Response(
    JSON.stringify({
      success: true,
      acao: 'convertida',
      indicacao_id,
      financeiro: {
        valor_bruto: valorBruto,
        taxa_plataforma_pct: TAXA_PLATAFORMA_PCT,
        taxa_plataforma_valor: taxaPlataformaValor,
        valor_contador_liquido: valorContadorLiquido,
      },
      comissao_id: novaComissao.id,
      mensagem: `Conversão confirmada! O Contador receberá R$${valorContadorLiquido.toFixed(2)} de comissão.`,
    }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
});
