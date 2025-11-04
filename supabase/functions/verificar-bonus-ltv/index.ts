import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.47.10';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * BÔNUS LTV (Lifetime Value) - BONIFICAÇÕES 14-16
 * 
 * Regra Correta:
 * - Agrupa clientes por mês de ativação
 * - No 13º mês após ativação do grupo, verifica quantos ainda estão ativos
 * - Aplica percentual baseado no tamanho do grupo ativo:
 *   * 5-9 clientes: 15% (Bonificação 14)
 *   * 10-14 clientes: 30% (Bonificação 15)
 *   * 15+ clientes: 50% (Bonificação 16)
 * - Calcula sobre a SOMA das mensalidades de todos os clientes ativos do grupo
 * 
 * Executado mensalmente no dia 1 via CRON
 */
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    console.log('🎯 Iniciando verificação de Bônus LTV por Grupo...');

    const hoje = new Date();
    
    // Calcular data de referência: 13 meses atrás
    const data13MesesAtras = new Date(hoje);
    data13MesesAtras.setMonth(data13MesesAtras.getMonth() - 13);
    
    // Mês de competência do grupo (YYYY-MM)
    const mesGrupo = data13MesesAtras.toISOString().slice(0, 7);
    const inicioPeriodo = `${mesGrupo}-01`;
    const fimPeriodo = new Date(data13MesesAtras.getFullYear(), data13MesesAtras.getMonth() + 1, 1)
      .toISOString()
      .slice(0, 10);
    
    // Competência para pagamento (mês atual)
    const competencia = `${hoje.toISOString().slice(0, 7)}-01`;

    console.log(`📅 Processando grupos ativados em ${mesGrupo} (entre ${inicioPeriodo} e ${fimPeriodo})`);

    // 1. BUSCAR TODOS OS CONTADORES QUE TIVERAM ATIVAÇÕES NESSE MÊS
    const { data: contadoresComGrupos, error: erroContadores } = await supabase
      .from('clientes')
      .select('contador_id')
      .gte('data_ativacao', inicioPeriodo)
      .lt('data_ativacao', fimPeriodo)
      .eq('status', 'ativo');

    if (erroContadores) {
      throw erroContadores;
    }

    // Obter lista única de contadores
    const contadoresUnicos = [...new Set(contadoresComGrupos?.map(c => c.contador_id) || [])];

    console.log(`👥 ${contadoresUnicos.length} contadores com clientes ativados em ${mesGrupo}`);

    if (contadoresUnicos.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: `Nenhum grupo elegível para LTV no período ${mesGrupo}`,
          grupos_processados: 0,
          bonus_criados: 0,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const bonusCriados: any[] = [];

    // 2. PROCESSAR CADA CONTADOR
    for (const contadorId of contadoresUnicos) {
      console.log(`\n🔍 Processando contador: ${contadorId}`);

      // Verificar se já recebeu bônus LTV para esse grupo específico
      const { data: bonusExistente } = await supabase
        .from('bonus_historico')
        .select('id')
        .eq('contador_id', contadorId)
        .eq('tipo_bonus', 'bonus_ltv')
        .ilike('observacao', `%Grupo: ${mesGrupo}%`)
        .maybeSingle();

      if (bonusExistente) {
        console.log(`⏭️ Contador já recebeu LTV para grupo ${mesGrupo}, pulando...`);
        continue;
      }

      // 3. BUSCAR CLIENTES DO GRUPO (ativados nesse mês específico)
      const { data: clientesGrupo, error: erroClientes } = await supabase
        .from('clientes')
        .select('id, nome_empresa, valor_mensal, data_ativacao, status')
        .eq('contador_id', contadorId)
        .gte('data_ativacao', inicioPeriodo)
        .lt('data_ativacao', fimPeriodo);

      if (erroClientes || !clientesGrupo || clientesGrupo.length === 0) {
        console.log(`❌ Erro ao buscar clientes do grupo ou grupo vazio`);
        continue;
      }

      // 4. FILTRAR APENAS CLIENTES ATIVOS
      const clientesAtivos = clientesGrupo.filter(c => c.status === 'ativo');
      const totalInicial = clientesGrupo.length;
      const totalAtivos = clientesAtivos.length;

      console.log(`📊 Grupo ${mesGrupo}: ${totalAtivos}/${totalInicial} clientes ativos`);

      // 5. VERIFICAR ELEGIBILIDADE (mínimo 5 clientes ativos)
      if (totalAtivos < 5) {
        console.log(`⚠️ Grupo não elegível: menos de 5 clientes ativos (${totalAtivos})`);
        continue;
      }

      // 6. DETERMINAR PERCENTUAL DE BÔNUS LTV
      let percentualLTV = 0.15; // 15% (Bonificação 14)
      let descricaoNivel = '5-9 clientes';
      let bonificacaoNumero = 14;

      if (totalAtivos >= 15) {
        percentualLTV = 0.50; // 50% (Bonificação 16)
        descricaoNivel = '15+ clientes';
        bonificacaoNumero = 16;
      } else if (totalAtivos >= 10) {
        percentualLTV = 0.30; // 30% (Bonificação 15)
        descricaoNivel = '10-14 clientes';
        bonificacaoNumero = 15;
      }

      // 7. CALCULAR SOMA DAS MENSALIDADES DO GRUPO ATIVO
      const somaValores = clientesAtivos.reduce((sum, c) => sum + (c.valor_mensal || 0), 0);
      const valorBonus = somaValores * percentualLTV;

      console.log(`💰 Soma mensalidades grupo: R$ ${somaValores.toFixed(2)}`);
      console.log(`🎁 Bônus LTV ${bonificacaoNumero}: ${(percentualLTV * 100)}% = R$ ${valorBonus.toFixed(2)}`);

      // 8. CRIAR REGISTRO NO HISTÓRICO DE BÔNUS
      const observacao = `LTV 12 meses - Grupo: ${mesGrupo} - ${totalAtivos}/${totalInicial} clientes ativos (${descricaoNivel}) - Bonificação #${bonificacaoNumero}`;

      const { data: bonus, error: erroBonus } = await supabase
        .from('bonus_historico')
        .insert({
          contador_id: contadorId,
          tipo_bonus: 'bonus_ltv',
          valor: valorBonus,
          competencia: competencia,
          status: 'pendente',
          observacao: observacao,
          marco_atingido: 12, // 12 meses completados
        })
        .select()
        .single();

      if (erroBonus) {
        console.error(`❌ Erro ao criar bônus LTV:`, erroBonus);
        continue;
      }

      // 9. CRIAR COMISSÃO VINCULADA
      await supabase.from('comissoes').insert({
        contador_id: contadorId,
        tipo: 'bonus_ltv',
        valor: valorBonus,
        percentual: percentualLTV,
        competencia: competencia,
        status: 'calculada',
        observacao: `Bônus LTV ${bonificacaoNumero} - Grupo ${mesGrupo} - ${totalAtivos} clientes × ${(percentualLTV * 100)}%`,
      });

      bonusCriados.push({
        contador_id: contadorId,
        bonus_id: bonus.id,
        grupo: mesGrupo,
        clientes_ativos: totalAtivos,
        clientes_iniciais: totalInicial,
        percentual: percentualLTV,
        valor: valorBonus,
        bonificacao: bonificacaoNumero,
      });

      console.log(`✅ Bônus LTV #${bonificacaoNumero} criado: R$ ${valorBonus.toFixed(2)}`);
    }

    // 10. LOG DE AUDITORIA
    await supabase.from('audit_logs').insert({
      acao: 'LTV_BONUS_GRUPO_PROCESSADO',
      tabela: 'bonus_historico',
      payload: {
        mes_grupo: mesGrupo,
        competencia_pagamento: competencia,
        contadores_processados: contadoresUnicos.length,
        grupos_elegiveis: bonusCriados.length,
        bonus_criados: bonusCriados,
        total_distribuido: bonusCriados.reduce((sum, b) => sum + b.valor, 0),
      },
    });

    console.log(`\n🎉 Processamento LTV concluído:`);
    console.log(`   • Grupos processados: ${contadoresUnicos.length}`);
    console.log(`   • Bônus criados: ${bonusCriados.length}`);
    console.log(`   • Total distribuído: R$ ${bonusCriados.reduce((sum, b) => sum + b.valor, 0).toFixed(2)}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `${bonusCriados.length} bônus LTV criados para grupos de ${mesGrupo}`,
        mes_grupo: mesGrupo,
        competencia_pagamento: competencia,
        contadores_processados: contadoresUnicos.length,
        grupos_elegiveis: bonusCriados.length,
        bonus_criados: bonusCriados,
        total_distribuido: bonusCriados.reduce((sum, b) => sum + b.valor, 0),
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('❌ Erro ao processar Bônus LTV por Grupo:', error);
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
