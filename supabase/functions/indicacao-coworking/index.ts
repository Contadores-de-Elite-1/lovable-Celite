/**
 * indicacao-coworking — Edge Function V5.0
 *
 * Permite que um Contador crie uma indicação de MPE para um Coworking parceiro.
 *
 * Fluxo:
 *  1. Autentica o Contador via JWT
 *  2. Valida o CNPJ da MPE (formato + ReceitaWS)
 *  3. Verifica se já existe indicação ativa para o mesmo par MPE + Coworking
 *  4. Busca ou cria o registro da MPE pelo CNPJ
 *  5. Verifica que o Coworking está ativo
 *  6. Cria `indicacoes_coworking` com status 'pendente'
 *  7. Registra em audit_logs
 *  8. Retorna { success: true, indicacao_id }
 *
 * Erros tratados:
 *  - 401: usuário não autenticado ou sem role 'contador'
 *  - 400: payload inválido, CNPJ inválido ou indicação duplicada
 *  - 404: Coworking não encontrado ou inativo
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

interface IndicacaoPayload {
  mpe_cnpj: string;
  coworking_id: string;
  mensagem?: string;
}

interface ReceitaWSResponse {
  status: 'OK' | 'ERROR';
  message?: string;
  nome?: string;
  fantasia?: string;
  situacao?: string;  // 'ATIVA' | 'INAPTA' | etc.
  cnpj?: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Remove caracteres não numéricos do CNPJ */
function normalizarCNPJ(cnpj: string): string {
  return cnpj.replace(/\D/g, '');
}

/** Valida formato do CNPJ (14 dígitos + dígitos verificadores) */
function validarFormatoCNPJ(cnpj: string): boolean {
  const digits = normalizarCNPJ(cnpj);
  if (digits.length !== 14) return false;
  // Rejeita sequências repetidas (ex: 00000000000000)
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

/**
 * Consulta a ReceitaWS para validar o CNPJ e retornar dados da empresa.
 * Retorna null em caso de falha (timeout, rate limit, etc.) para não bloquear o fluxo.
 */
async function consultarReceitaWS(cnpj: string): Promise<ReceitaWSResponse | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000); // 8s timeout

    const response = await fetch(
      `https://www.receitaws.com.br/v1/cnpj/${cnpj}`,
      {
        signal: controller.signal,
        headers: { 'Accept': 'application/json' },
      }
    );
    clearTimeout(timeout);

    if (!response.ok) {
      logWarn('[ReceitaWS] Resposta não-OK', { status: response.status, cnpj });
      return null;
    }

    const data = await response.json() as ReceitaWSResponse;
    return data;
  } catch (err) {
    logWarn('[ReceitaWS] Falha na consulta (prosseguindo sem validação externa)', {
      cnpj,
      error: err instanceof Error ? err.message : String(err),
    });
    return null;
  }
}

/**
 * Retorna o registro do Contador logado.
 * Retorna null se o usuário não for um Contador ativo.
 */
async function obterContador(userId: string) {
  const { data, error } = await supabase
    .from('contadores')
    .select('id, nome_completo, ativo')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    logError('[obterContador] Erro ao buscar contador', { userId, error: error.message });
    return null;
  }
  return data;
}

/**
 * Resolve a MPE pelo CNPJ.
 * Se existir, retorna o registro. Caso contrário, cria um registro básico
 * (sem user_id, pois a MPE pode ainda não ter conta — será vinculada depois).
 */
async function resolverMPE(cnpj: string, nomeEmpresa: string, contadorId: string) {
  // Tenta encontrar MPE existente pelo CNPJ
  const { data: mpeExistente, error: errBusca } = await supabase
    .from('mpes')
    .select('id, nome_empresa, user_id, contador_responsavel_id')
    .eq('cnpj', cnpj)
    .maybeSingle();

  if (errBusca) {
    logError('[resolverMPE] Erro ao buscar MPE', { cnpj, error: errBusca.message });
    throw new Error('Erro ao verificar MPE no sistema');
  }

  if (mpeExistente) {
    logInfo('[resolverMPE] MPE encontrada', { mpe_id: mpeExistente.id, cnpj });
    return mpeExistente;
  }

  // MPE ainda não tem conta — cria registro básico para rastreamento
  // ATENÇÃO: mpes.user_id tem UNIQUE NOT NULL — uma MPE sem conta na plataforma
  // não pode ser inserida diretamente. A indicação é criada pelo CNPJ como referência,
  // e a MPE se vincula ao criar sua conta. Por isso, retornamos null para MPEs novas
  // e armazenamos apenas o CNPJ na indicação (campo dedicado).
  logInfo('[resolverMPE] MPE ainda não cadastrada na plataforma', { cnpj, nomeEmpresa });
  return null;
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

  // ── 2. Verificar role 'contador' ────────────────────────────────────────────
  const { data: roleData } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!roleData || roleData.role !== 'contador') {
    return new Response(
      JSON.stringify({ error: 'Apenas Contadores podem criar indicações' }),
      { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // ── 3. Obter registro do Contador ───────────────────────────────────────────
  const contador = await obterContador(user.id);
  if (!contador || !contador.ativo) {
    return new Response(
      JSON.stringify({ error: 'Perfil de Contador não encontrado ou inativo' }),
      { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // ── 4. Validar payload ──────────────────────────────────────────────────────
  let payload: IndicacaoPayload;
  try {
    payload = await req.json() as IndicacaoPayload;
  } catch {
    return new Response(
      JSON.stringify({ error: 'Payload JSON inválido' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const { mpe_cnpj, coworking_id, mensagem } = payload;

  if (!mpe_cnpj || !coworking_id) {
    return new Response(
      JSON.stringify({ error: 'Campos obrigatórios: mpe_cnpj, coworking_id' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // ── 5. Validar formato do CNPJ ──────────────────────────────────────────────
  const cnpjNormalizado = normalizarCNPJ(mpe_cnpj);
  if (!validarFormatoCNPJ(cnpjNormalizado)) {
    return new Response(
      JSON.stringify({ error: 'CNPJ inválido — verifique o número informado' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // ── 6. Consultar ReceitaWS (não-bloqueante) ─────────────────────────────────
  let nomeEmpresaRFB = 'Empresa não identificada';
  let cnpjAtivo = true;

  const dadosRFB = await consultarReceitaWS(cnpjNormalizado);

  if (dadosRFB) {
    if (dadosRFB.status === 'ERROR') {
      logWarn('[indicacao-coworking] CNPJ não encontrado na RFB', { cnpj: cnpjNormalizado });
      return new Response(
        JSON.stringify({ error: 'CNPJ não encontrado na Receita Federal' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    nomeEmpresaRFB = dadosRFB.fantasia || dadosRFB.nome || nomeEmpresaRFB;
    cnpjAtivo = dadosRFB.situacao === 'ATIVA';

    if (!cnpjAtivo) {
      logWarn('[indicacao-coworking] CNPJ com situação irregular', {
        cnpj: cnpjNormalizado,
        situacao: dadosRFB.situacao,
      });
      return new Response(
        JSON.stringify({
          error: `CNPJ com situação irregular na Receita Federal: ${dadosRFB.situacao}`,
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  }

  // ── 7. Verificar Coworking ──────────────────────────────────────────────────
  const { data: coworking, error: errCoworking } = await supabase
    .from('coworkings')
    .select('id, nome_fantasia, ativo')
    .eq('id', coworking_id)
    .maybeSingle();

  if (errCoworking || !coworking) {
    return new Response(
      JSON.stringify({ error: 'Coworking não encontrado' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  if (!coworking.ativo) {
    return new Response(
      JSON.stringify({ error: 'Este Coworking não está ativo na plataforma' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // ── 8. Resolver MPE (buscar ou null para nova) ──────────────────────────────
  const mpe = await resolverMPE(cnpjNormalizado, nomeEmpresaRFB, contador.id);

  // ── 9. Verificar indicação ativa existente ──────────────────────────────────
  // O índice parcial `idx_indicacoes_cw_active_unique` já garante unicidade no BD,
  // mas verificamos aqui para retornar um erro legível antes do insert.
  if (mpe) {
    const { data: indicacaoExistente } = await supabase
      .from('indicacoes_coworking')
      .select('id, status')
      .eq('mpe_id', mpe.id)
      .eq('coworking_id', coworking_id)
      .not('status', 'in', '("recusada","paga","sem_resposta")')
      .maybeSingle();

    if (indicacaoExistente) {
      return new Response(
        JSON.stringify({
          error: 'Já existe uma indicação ativa para esta MPE neste Coworking',
          indicacao_id: indicacaoExistente.id,
          status: indicacaoExistente.status,
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  }

  // ── 10. Criar indicação ─────────────────────────────────────────────────────
  // Se a MPE ainda não tem conta, armazenamos mpe_id = null e mpe_cnpj para rastreio.
  // Quando a MPE criar sua conta, o vínculo será estabelecido pelo CNPJ.
  const insertPayload = {
    contador_id: contador.id,
    coworking_id,
    status: 'pendente',
    mensagem_contador: mensagem ?? null,
    ...(mpe ? { mpe_id: mpe.id } : { mpe_cnpj: cnpjNormalizado }),
  };

  // Se MPE não existe no sistema, precisamos de mpe_id (NOT NULL constraint).
  // Neste caso, retornamos orientação para o Contador — a MPE deve se cadastrar primeiro.
  if (!mpe) {
    return new Response(
      JSON.stringify({
        error: 'A MPE indicada ainda não está cadastrada na plataforma.',
        instrucao: 'Peça para a MPE criar uma conta na plataforma usando o CNPJ informado, e então crie a indicação novamente.',
        mpe_cnpj: cnpjNormalizado,
        nome_empresa: nomeEmpresaRFB,
      }),
      { status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const { data: novaIndicacao, error: errInsert } = await supabase
    .from('indicacoes_coworking')
    .insert({
      contador_id: contador.id,
      mpe_id: mpe.id,
      coworking_id,
      status: 'pendente',
      mensagem_contador: mensagem ?? null,
    })
    .select('id')
    .single();

  if (errInsert) {
    logError('[indicacao-coworking] Erro ao criar indicação', {
      error: errInsert.message,
      contador_id: contador.id,
      mpe_id: mpe.id,
      coworking_id,
    });

    // Constraint de unicidade ativa — indicação duplicada
    if (errInsert.code === '23505') {
      return new Response(
        JSON.stringify({ error: 'Já existe uma indicação ativa para esta MPE neste Coworking' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Erro ao registrar indicação. Tente novamente.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  logInfo('[indicacao-coworking] Indicação criada com sucesso', {
    indicacao_id: novaIndicacao.id,
    contador_id: contador.id,
    mpe_id: mpe.id,
    coworking_id,
    cnpj: cnpjNormalizado,
  });

  // ── 11. Audit log ───────────────────────────────────────────────────────────
  await supabase.from('audit_logs').insert({
    acao: 'INDICACAO_COWORKING_CRIADA',
    tabela: 'indicacoes_coworking',
    registro_id: novaIndicacao.id,
    payload: {
      contador_id: contador.id,
      mpe_id: mpe.id,
      mpe_cnpj: cnpjNormalizado,
      nome_empresa_rfb: nomeEmpresaRFB,
      coworking_id,
      coworking_nome: coworking.nome_fantasia,
      mensagem: mensagem ?? null,
      validado_receita_ws: dadosRFB !== null,
    },
  }).catch((err) => {
    logWarn('[indicacao-coworking] Falha ao registrar audit log', { error: err.message });
  });

  return new Response(
    JSON.stringify({
      success: true,
      indicacao_id: novaIndicacao.id,
      mpe: {
        id: mpe.id,
        cnpj: cnpjNormalizado,
        nome_empresa: nomeEmpresaRFB,
      },
      coworking: {
        id: coworking.id,
        nome: coworking.nome_fantasia,
      },
      status: 'pendente',
      mensagem: 'Indicação criada com sucesso. O Coworking será notificado.',
    }),
    { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
});
