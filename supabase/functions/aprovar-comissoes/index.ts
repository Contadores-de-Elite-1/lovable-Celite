import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.47.10';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AprovarInput {
  competencia: string; // YYYY-MM-DD format
  contador_ids?: string[]; // Opcional: aprovar apenas contadores específicos
  observacao?: string;
}

/**
 * APROVAR COMISSÕES
 * Transiciona comissões de 'calculada' para 'aprovada'
 * Apenas comissões aprovadas podem ser pagas
 */
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const input: AprovarInput = await req.json();
    console.log('✅ Iniciando aprovação de comissões:', input);

    if (!input.competencia) {
      throw new Error('Competência é obrigatória (formato: YYYY-MM-DD)');
    }

    // 1. BUSCAR COMISSÕES CALCULADAS
    let query = supabase
      .from('comissoes')
      .select('id, contador_id, tipo, valor, competencia')
      .eq('status', 'calculada')
      .eq('competencia', input.competencia);

    // Filtrar por contadores específicos, se fornecido
    if (input.contador_ids && input.contador_ids.length > 0) {
      query = query.in('contador_id', input.contador_ids);
    }

    const { data: comissoesCalculadas, error: erroConsulta } = await query;

    if (erroConsulta) {
      throw erroConsulta;
    }

    if (!comissoesCalculadas || comissoesCalculadas.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Nenhuma comissão calculada encontrada para aprovar',
          comissoes_aprovadas: 0,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`📊 ${comissoesCalculadas.length} comissões encontradas para aprovação`);

    // 2. ATUALIZAR STATUS PARA 'APROVADA'
    const comissoesIds = comissoesCalculadas.map((c) => c.id);
    
    const { error: erroAtualizacao, count } = await supabase
      .from('comissoes')
      .update({
        status: 'aprovada',
        observacao: input.observacao || 'Aprovada automaticamente',
        updated_at: new Date().toISOString(),
      })
      .in('id', comissoesIds);

    if (erroAtualizacao) {
      throw erroAtualizacao;
    }

    // 3. ATUALIZAR BÔNUS RELACIONADOS
    const { error: erroBonusUpdate } = await supabase
      .from('bonus_historico')
      .update({
        status: 'aprovado',
      })
      .eq('competencia', input.competencia)
      .eq('status', 'pendente')
      .in('contador_id', [...new Set(comissoesCalculadas.map((c) => c.contador_id))]);

    if (erroBonusUpdate) {
      console.warn('⚠️ Erro ao atualizar bônus:', erroBonusUpdate);
    }

    // 4. CALCULAR VALOR TOTAL APROVADO
    const valorTotal = comissoesCalculadas.reduce((sum, c) => sum + (c.valor || 0), 0);

    // 5. AGRUPAR POR CONTADOR
    const porContador = comissoesCalculadas.reduce((acc, c) => {
      if (!acc[c.contador_id]) {
        acc[c.contador_id] = { quantidade: 0, valor_total: 0 };
      }
      acc[c.contador_id].quantidade++;
      acc[c.contador_id].valor_total += c.valor || 0;
      return acc;
    }, {} as Record<string, { quantidade: number; valor_total: number }>);

    // 6. LOG DE AUDITORIA
    await supabase.from('audit_logs').insert({
      acao: 'COMISSOES_APROVADAS',
      tabela: 'comissoes',
      payload: {
        competencia: input.competencia,
        total_comissoes: count || comissoesCalculadas.length,
        valor_total: valorTotal,
        contadores_afetados: Object.keys(porContador).length,
        por_contador: porContador,
        observacao: input.observacao,
      },
    });

    console.log(`✅ ${count || comissoesCalculadas.length} comissões aprovadas com sucesso`);
    console.log(`💰 Valor total aprovado: R$ ${valorTotal.toFixed(2)}`);
    console.log(`👥 Contadores afetados: ${Object.keys(porContador).length}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `${count || comissoesCalculadas.length} comissões aprovadas com sucesso`,
        comissoes_aprovadas: count || comissoesCalculadas.length,
        valor_total: valorTotal,
        contadores_afetados: Object.keys(porContador).length,
        competencia: input.competencia,
        resumo_por_contador: porContador,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('❌ Erro ao aprovar comissões:', error);
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
