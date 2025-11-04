import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.47.10';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * BÔNUS LTV (Lifetime Value)
 * Executado mensalmente para identificar clientes que completaram 12 meses ativos
 * e calcular bônus de 15%, 30% ou 50% sobre ticket médio dos últimos 6 meses
 */
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    console.log('🎯 Iniciando verificação de Bônus LTV...');

    const hoje = new Date();
    const dataReferencia12Meses = new Date(hoje);
    dataReferencia12Meses.setMonth(dataReferencia12Meses.getMonth() - 12);

    const mesAtual = hoje.toISOString().slice(0, 7); // YYYY-MM
    const competencia = `${mesAtual}-01`; // Primeiro dia do mês

    // 1. BUSCAR CLIENTES QUE COMPLETARAM 12 MESES EXATOS
    // Exemplo: Se hoje é 01/04/2025, busca clientes que ativaram entre 01/04/2024 e 30/04/2024
    const inicioPeriodo = new Date(dataReferencia12Meses.getFullYear(), dataReferencia12Meses.getMonth(), 1);
    const fimPeriodo = new Date(dataReferencia12Meses.getFullYear(), dataReferencia12Meses.getMonth() + 1, 1);
    
    console.log(`📅 Buscando clientes ativados entre ${inicioPeriodo.toISOString().slice(0, 10)} e ${fimPeriodo.toISOString().slice(0, 10)}`);
    
    const { data: clientesElegiveis, error: erroClientes } = await supabase
      .from('clientes')
      .select('id, contador_id, data_ativacao, valor_mensal, nome_empresa')
      .eq('status', 'ativo')
      .gte('data_ativacao', inicioPeriodo.toISOString().slice(0, 10))
      .lt('data_ativacao', fimPeriodo.toISOString().slice(0, 10));

    if (erroClientes) {
      throw erroClientes;
    }

    console.log(`📊 ${clientesElegiveis?.length || 0} clientes elegíveis para LTV`);

    if (!clientesElegiveis || clientesElegiveis.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Nenhum cliente elegível para LTV este mês',
          bonus_criados: 0 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const bonusCriados: string[] = [];

    // 2. PROCESSAR CADA CLIENTE
    for (const cliente of clientesElegiveis) {
      // Verificar se já recebeu bônus LTV
      const { data: bonusExistente } = await supabase
        .from('bonus_historico')
        .select('id')
        .eq('contador_id', cliente.contador_id)
        .eq('tipo_bonus', 'bonus_ltv')
        .eq('observacao', `LTV 12 meses - Cliente: ${cliente.id}`)
        .single();

      if (bonusExistente) {
        console.log(`⏭️ Cliente ${cliente.nome_empresa} já recebeu LTV, pulando...`);
        continue;
      }

      // 3. CALCULAR TICKET MÉDIO DOS ÚLTIMOS 6 MESES
      const data6MesesAtras = new Date(hoje);
      data6MesesAtras.setMonth(data6MesesAtras.getMonth() - 6);

      const { data: pagamentos6Meses } = await supabase
        .from('pagamentos')
        .select('valor_liquido')
        .eq('cliente_id', cliente.id)
        .eq('status', 'confirmed')
        .gte('competencia', data6MesesAtras.toISOString().slice(0, 10))
        .order('competencia', { ascending: false })
        .limit(6);

      const ticketMedio = pagamentos6Meses && pagamentos6Meses.length > 0
        ? pagamentos6Meses.reduce((sum, p) => sum + (p.valor_liquido || 0), 0) / pagamentos6Meses.length
        : cliente.valor_mensal || 0;

      console.log(`💰 Cliente ${cliente.nome_empresa}: Ticket médio = R$ ${ticketMedio.toFixed(2)}`);

      // 4. CONTAR TOTAL DE CLIENTES ATIVOS DO CONTADOR
      const { count: totalClientesAtivos } = await supabase
        .from('clientes')
        .select('id', { count: 'exact', head: true })
        .eq('contador_id', cliente.contador_id)
        .eq('status', 'ativo');

      // 5. DETERMINAR PERCENTUAL DE BÔNUS LTV
      let percentualLTV = 0.15; // Padrão: 15%
      let descricaoNivel = '1-14 clientes';

      if (totalClientesAtivos && totalClientesAtivos >= 15) {
        percentualLTV = 0.50; // 50%
        descricaoNivel = '15+ clientes';
      } else if (totalClientesAtivos && totalClientesAtivos >= 5) {
        percentualLTV = 0.30; // 30%
        descricaoNivel = '5-14 clientes';
      }

      const valorBonus = ticketMedio * percentualLTV;

      console.log(`🎁 Bônus LTV: ${(percentualLTV * 100)}% sobre R$ ${ticketMedio.toFixed(2)} = R$ ${valorBonus.toFixed(2)}`);

      // 6. CRIAR REGISTRO NO HISTÓRICO DE BÔNUS
      const { data: bonus, error: erroBonus } = await supabase
        .from('bonus_historico')
        .insert({
          contador_id: cliente.contador_id,
          tipo_bonus: 'bonus_ltv',
          valor: valorBonus,
          competencia: competencia,
          status: 'pendente',
          observacao: `LTV 12 meses - Cliente: ${cliente.id} (${cliente.nome_empresa}) - Ticket: R$ ${ticketMedio.toFixed(2)} - ${descricaoNivel}`,
          marco_atingido: 12, // 12 meses
        })
        .select()
        .single();

      if (erroBonus) {
        console.error(`❌ Erro ao criar bônus LTV para ${cliente.nome_empresa}:`, erroBonus);
        continue;
      }

      bonusCriados.push(bonus.id);

      // 7. CRIAR COMISSÃO VINCULADA
      await supabase.from('comissoes').insert({
        contador_id: cliente.contador_id,
        cliente_id: cliente.id,
        tipo: 'bonus_ltv',
        valor: valorBonus,
        percentual: percentualLTV,
        competencia: competencia,
        status: 'calculada',
        observacao: `Bônus LTV 12 meses - ${(percentualLTV * 100)}% sobre ticket médio`,
      });

      console.log(`✅ Bônus LTV criado para ${cliente.nome_empresa}: R$ ${valorBonus.toFixed(2)}`);
    }

    // 8. LOG DE AUDITORIA
    await supabase.from('audit_logs').insert({
      acao: 'LTV_BONUS_PROCESSADO',
      tabela: 'bonus_historico',
      payload: {
        competencia,
        total_clientes_elegiveis: clientesElegiveis.length,
        bonus_criados: bonusCriados.length,
        bonus_ids: bonusCriados,
      },
    });

    console.log(`🎉 Processamento LTV concluído: ${bonusCriados.length} bônus criados`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `${bonusCriados.length} bônus LTV criados com sucesso`,
        clientes_elegiveis: clientesElegiveis.length,
        bonus_criados: bonusCriados.length,
        bonus_ids: bonusCriados,
        competencia,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('❌ Erro ao processar Bônus LTV:', error);
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
