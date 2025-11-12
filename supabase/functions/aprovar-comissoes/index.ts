import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.47.10';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AprovarInput {
  competencia: string;
  contador_ids?: string[];
  observacao?: string;
}

function validarCompetenciaData(competencia: string): string {
  try {
    const data = new Date(competencia);
    if (isNaN(data.getTime())) {
      throw new Error('Data inválida');
    }
    const ano = data.getFullYear();
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    const dia = String(data.getDate()).padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
  } catch {
    throw new Error(`Competencia deve estar em formato YYYY-MM-DD. Recebido: ${competencia}`);
  }
}

function validarUUIDs(ids: string[]): string[] {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const invalidos = ids.filter(id => !uuidRegex.test(id));
  if (invalidos.length > 0) {
    throw new Error(`UUIDs inválidos: ${invalidos.join(', ')}`);
  }
  return ids;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    let input: AprovarInput;
    try {
      input = await req.json();
    } catch {
      throw new Error('JSON inválido no payload');
    }

    if (!input.competencia) {
      throw new Error('Competencia obrigatoria (formato: YYYY-MM-DD)');
    }

    const competenciaValidada = validarCompetenciaData(input.competencia);

    if (input.contador_ids && input.contador_ids.length > 0) {
      validarUUIDs(input.contador_ids);
    }

    console.log(`Aprovando comissoes para competencia: ${competenciaValidada}`);

    let query = supabase
      .from('comissoes')
      .select('id, contador_id, tipo, valor, competencia')
      .eq('status', 'calculada')
      .eq('competencia', competenciaValidada);

    if (input.contador_ids && input.contador_ids.length > 0) {
      query = query.in('contador_id', input.contador_ids);
    }

    const { data: comissoesCalculadas, error: erroConsulta } = await query;

    if (erroConsulta) {
      throw new Error(`Erro ao buscar comissoes: ${erroConsulta.message}`);
    }

    if (!comissoesCalculadas || comissoesCalculadas.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Nenhuma comissao calculada encontrada',
          comissoes_aprovadas: 0,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Encontradas ${comissoesCalculadas.length} comissoes para aprovar`);

    const comissoesIds = comissoesCalculadas.map((c) => c.id);

    const { error: erroAtualizacao, count } = await supabase
      .from('comissoes')
      .update({
        status: 'aprovada',
        observacao: input.observacao || 'Aprovada',
        updated_at: new Date().toISOString(),
      })
      .in('id', comissoesIds);

    if (erroAtualizacao) {
      throw new Error(`Erro ao atualizar status: ${erroAtualizacao.message}`);
    }

    const { error: erroBonusUpdate } = await supabase
      .from('bonus_historico')
      .update({
        status: 'aprovado',
      })
      .eq('competencia', competenciaValidada)
      .eq('status', 'pendente')
      .in('contador_id', [...new Set(comissoesCalculadas.map((c) => c.contador_id))]);

    if (erroBonusUpdate) {
      console.error('Erro ao atualizar bonus:', erroBonusUpdate);
    }

    const valorTotal = comissoesCalculadas.reduce((sum, c) => sum + (c.valor || 0), 0);

    const porContador = comissoesCalculadas.reduce((acc, c) => {
      if (!acc[c.contador_id]) {
        acc[c.contador_id] = { quantidade: 0, valor_total: 0 };
      }
      acc[c.contador_id].quantidade++;
      acc[c.contador_id].valor_total += c.valor || 0;
      return acc;
    }, {} as Record<string, { quantidade: number; valor_total: number }>);

    await supabase.from('audit_logs').insert({
      acao: 'COMISSOES_APROVADAS',
      tabela: 'comissoes',
      payload: {
        competencia: competenciaValidada,
        total_comissoes: count || comissoesCalculadas.length,
        valor_total: valorTotal,
        contadores_afetados: Object.keys(porContador).length,
        observacao: input.observacao,
      },
    }).catch(auditErr => console.error('Erro ao registrar audit log:', auditErr));

    console.log(`Comissoes aprovadas: ${count || comissoesCalculadas.length} | Valor total: R$ ${valorTotal.toFixed(2)}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `${count || comissoesCalculadas.length} comissoes aprovadas`,
        comissoes_aprovadas: count || comissoesCalculadas.length,
        valor_total: valorTotal,
        contadores_afetados: Object.keys(porContador).length,
        competencia: competenciaValidada,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Erro ao aprovar comissoes:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
