import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.47.10';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ProcessarPagamentoInput {
  competencia?: string;
}

function calcularCompetencia(): { inicio: string; fim: string; mes: string } {
  const hoje = new Date();
  const mesAnterior = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1);

  const ano = mesAnterior.getFullYear();
  const mes = String(mesAnterior.getMonth() + 1).padStart(2, '0');
  const dia = '01';

  const proximoMes = new Date(ano, mesAnterior.getMonth() + 1, 1);
  const anoProximo = proximoMes.getFullYear();
  const mesProximo = String(proximoMes.getMonth() + 1).padStart(2, '0');

  return {
    mes: `${ano}-${mes}`,
    inicio: `${ano}-${mes}-${dia}`,
    fim: `${anoProximo}-${mesProximo}-01`,
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    let input: ProcessarPagamentoInput = {};
    if (req.method === 'POST') {
      try {
        input = await req.json();
      } catch {
        input = {};
      }
    }

    const periodo = input.competencia ? (() => {
      const data = new Date(input.competencia!);
      const ano = data.getFullYear();
      const mes = String(data.getMonth() + 1).padStart(2, '0');
      const proximoMes = new Date(ano, data.getMonth() + 1, 1);
      const mesProx = String(proximoMes.getMonth() + 1).padStart(2, '0');
      return {
        mes: `${ano}-${mes}`,
        inicio: `${ano}-${mes}-01`,
        fim: `${proximoMes.getFullYear()}-${mesProx}-01`,
      };
    })() : calcularCompetencia();

    console.log(`Processando comissoes da competencia: ${periodo.mes}`);
    console.log(`Intervalo: ${periodo.inicio} ate ${periodo.fim}`);
    
    const { data: comissoes, error: comissoesError } = await supabase
      .from('comissoes')
      .select('id, contador_id, valor, tipo, observacao')
      .eq('status', 'aprovada')
      .gte('competencia', periodo.inicio)
      .lt('competencia', periodo.fim);

    if (comissoesError) {
      throw new Error(`Erro ao buscar comissoes: ${comissoesError.message}`);
    }

    if (!comissoes || comissoes.length === 0) {
      console.log('Nenhuma comissao aprovada para processar');
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Nenhuma comissao para processar',
          competencia: periodo.mes,
          processados: 0,
          acumulados: 0,
          valor_total_pago: 0,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    console.log(`Total de comissoes encontradas: ${comissoes.length}`);

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

    for (const [contadorId, { total, comissoes: comissoesContador }] of Object.entries(comissoesPorContador)) {
      if (total >= 100) {
        const ids = comissoesContador.map((c) => c.id);

        const { error: updateError } = await supabase
          .from('comissoes')
          .update({
            status: 'paga',
            pago_em: new Date().toISOString(),
          })
          .in('id', ids);

        if (updateError) {
          console.error(`Erro ao marcar comissoes como pagas para ${contadorId}:`, updateError);
          continue;
        }

        await supabase.from('notificacoes').insert({
          contador_id: contadorId,
          tipo: 'comissao_liberada',
          titulo: 'Comissoes Liberadas',
          mensagem: `Suas comissoes de ${periodo.mes} foram liberadas: R$ ${total.toFixed(2)}`,
          payload: {
            competencia: periodo.mes,
            valor_total: total,
            quantidade_comissoes: comissoesContador.length,
          },
        }).catch(notifErr => console.error('Erro ao criar notificacao:', notifErr));

        await supabase
          .from('bonus_historico')
          .update({
            status: 'pago',
            pago_em: new Date().toISOString(),
          })
          .eq('contador_id', contadorId)
          .gte('competencia', periodo.inicio)
          .lt('competencia', periodo.fim)
          .eq('status', 'aprovado')
          .catch(bonusErr => console.error('Erro ao atualizar bonus:', bonusErr));

        resultados.processados++;
        resultados.valor_total_pago += total;
        resultados.detalhes.push({
          contador_id: contadorId,
          status: 'pago',
          valor: total,
          comissoes: comissoesContador.length,
        });

        console.log(`Pagamento processado: ${contadorId} - R$ ${total.toFixed(2)}`);
      } else {
        resultados.acumulados++;
        resultados.detalhes.push({
          contador_id: contadorId,
          status: 'acumulado',
          valor: total,
          comissoes: comissoesContador.length,
        });

        console.log(`Acumulado para proximo mes: ${contadorId} - R$ ${total.toFixed(2)}`);
      }
    }

    await supabase.from('audit_logs').insert({
      acao: 'PROCESSAR_PAGAMENTO_COMISSOES',
      tabela: 'comissoes',
      payload: {
        competencia: periodo.mes,
        total_contadores: Object.keys(comissoesPorContador).length,
        processados: resultados.processados,
        acumulados: resultados.acumulados,
        valor_total: resultados.valor_total_pago,
      },
    }).catch(auditErr => console.error('Erro ao registrar audit log:', auditErr));

    console.log(`Processamento concluido: ${resultados.processados} processados, ${resultados.acumulados} acumulados`);

    return new Response(
      JSON.stringify({
        success: true,
        competencia: periodo.mes,
        ...resultados,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Erro ao processar pagamento de comissoes:', error);
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
