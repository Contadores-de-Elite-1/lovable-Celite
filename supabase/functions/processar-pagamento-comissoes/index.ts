import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.47.10';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    console.log('💰 Iniciando processamento de pagamento de comissões - Dia 25');

    // Obter mês anterior (competência a ser paga)
    const hoje = new Date();
    const mesAnterior = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1);
    const competencia = mesAnterior.toISOString().slice(0, 7); // YYYY-MM

    console.log('📅 Processando competência:', competencia);

    // Buscar todas as comissões aprovadas do mês anterior
    const { data: comissoes, error: comissoesError } = await supabase
      .from('comissoes')
      .select('id, contador_id, valor, tipo, observacao')
      .eq('status', 'aprovada')
      .gte('competencia', `${competencia}-01`)
      .lt('competencia', `${competencia}-32`);

    if (comissoesError) {
      throw comissoesError;
    }

    if (!comissoes || comissoes.length === 0) {
      console.log('⚠️ Nenhuma comissão aprovada para pagar');
      return new Response(
        JSON.stringify({ message: 'Nenhuma comissão para processar' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    // Agrupar por contador
    const comissoesPorContador = comissoes.reduce((acc, comissao) => {
      if (!acc[comissao.contador_id]) {
        acc[comissao.contador_id] = {
          total: 0,
          comissoes: [],
        };
      }
      acc[comissao.contador_id].total += Number(comissao.valor);
      acc[comissao.contador_id].comissoes.push(comissao);
      return acc;
    }, {} as Record<string, { total: number; comissoes: any[] }>);

    const resultados = {
      processados: 0,
      acumulados: 0,
      valor_total_pago: 0,
      detalhes: [] as any[],
    };

    // Processar cada contador
    for (const [contadorId, { total, comissoes: comissoesContador }] of Object.entries(comissoesPorContador)) {
      console.log(`📊 Contador ${contadorId}: R$ ${total.toFixed(2)}`);

      if (total >= 100) {
        // PAGAR: Total >= R$100
        const ids = comissoesContador.map((c) => c.id);
        
        const { error: updateError } = await supabase
          .from('comissoes')
          .update({
            status: 'paga',
            pago_em: new Date().toISOString(),
          })
          .in('id', ids);

        if (updateError) {
          console.error(`❌ Erro ao marcar comissões como pagas para ${contadorId}:`, updateError);
          continue;
        }

        // Criar notificação
        await supabase.from('notificacoes').insert({
          contador_id: contadorId,
          tipo: 'comissao_liberada',
          titulo: 'Comissões Liberadas! 🎉',
          mensagem: `Suas comissões de ${competencia} foram liberadas: R$ ${total.toFixed(2)}`,
          payload: {
            competencia,
            valor_total: total,
            quantidade_comissoes: comissoesContador.length,
          },
        });

        // Atualizar bônus relacionados
        await supabase
          .from('bonus_historico')
          .update({
            status: 'pago',
            pago_em: new Date().toISOString(),
          })
          .eq('contador_id', contadorId)
          .eq('competencia', `${competencia}-01`)
          .eq('status', 'pendente');

        resultados.processados++;
        resultados.valor_total_pago += total;
        resultados.detalhes.push({
          contador_id: contadorId,
          status: 'pago',
          valor: total,
          comissoes: comissoesContador.length,
        });

        console.log(`✅ Pagamento processado: ${contadorId} - R$ ${total.toFixed(2)}`);
      } else {
        // ACUMULAR: Total < R$100
        resultados.acumulados++;
        resultados.detalhes.push({
          contador_id: contadorId,
          status: 'acumulado',
          valor: total,
          comissoes: comissoesContador.length,
          mensagem: 'Valor mínimo R$100 não atingido, acumulando para próximo mês',
        });

        console.log(`⏳ Acumulado para próximo mês: ${contadorId} - R$ ${total.toFixed(2)}`);
      }
    }

    // Log de auditoria
    await supabase.from('audit_logs').insert({
      acao: 'PROCESSAR_PAGAMENTO_COMISSOES',
      tabela: 'comissoes',
      payload: {
        competencia,
        total_contadores: Object.keys(comissoesPorContador).length,
        processados: resultados.processados,
        acumulados: resultados.acumulados,
        valor_total: resultados.valor_total_pago,
      },
    });

    console.log('✅ Processamento concluído:', resultados);

    return new Response(
      JSON.stringify({
        success: true,
        competencia,
        ...resultados,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('❌ Erro ao processar pagamento de comissões:', error);
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
