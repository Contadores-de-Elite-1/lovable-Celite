import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.47.10';

// Modulo de reconciliacao diaria
// Verifica inconsistencias entre pagamentos e comissoes
// Envia alertas se houver divergencias

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Divergencia {
  tipo: string;
  descricao: string;
  pagamento_id?: string;
  valor_esperado?: number;
  valor_encontrado?: number;
  severidade: 'baixa' | 'media' | 'alta' | 'critica';
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    console.log('[RECONCILIACAO] Iniciando reconciliacao diaria...');

    const hoje = new Date().toISOString().slice(0, 10);
    const ontem = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

    const divergencias: Divergencia[] = [];
    let totalVerificacoes = 0;

    // ========================================
    // VERIFICACAO 1: Pagamentos sem comissoes
    // ========================================
    console.log('[RECONCILIACAO] Verificacao 1: Pagamentos sem comissoes');

    const { data: pagamentosSemComissoes, error: erro1 } = await supabase
      .from('pagamentos')
      .select('id, valor_liquido, cliente_id, pago_em')
      .eq('status', 'pago')
      .gte('pago_em', ontem)
      .lte('pago_em', hoje);

    if (!erro1 && pagamentosSemComissoes) {
      for (const pagamento of pagamentosSemComissoes) {
        const { data: comissoes } = await supabase
          .from('comissoes')
          .select('id')
          .eq('pagamento_id', pagamento.id);

        if (!comissoes || comissoes.length === 0) {
          divergencias.push({
            tipo: 'PAGAMENTO_SEM_COMISSAO',
            descricao: `Pagamento ${pagamento.id} (R$ ${pagamento.valor_liquido}) nao gerou comissao`,
            pagamento_id: pagamento.id,
            valor_esperado: pagamento.valor_liquido,
            valor_encontrado: 0,
            severidade: 'critica'
          });
        }
        totalVerificacoes++;
      }
    }

    console.log(`[RECONCILIACAO] Verificacao 1: ${totalVerificacoes} pagamentos verificados`);

    // ========================================
    // VERIFICACAO 2: Comissoes duplicadas
    // ========================================
    console.log('[RECONCILIACAO] Verificacao 2: Comissoes duplicadas');

    const { data: comissoesDuplicadas, error: erro2 } = await supabase
      .from('comissoes')
      .select('pagamento_id, contador_id, tipo, valor')
      .not('pagamento_id', 'is', null)
      .gte('created_at', ontem)
      .lte('created_at', hoje);

    if (!erro2 && comissoesDuplicadas) {
      const mapaComissoes = new Map<string, number>();

      for (const comissao of comissoesDuplicadas) {
        const chave = `${comissao.pagamento_id}_${comissao.contador_id}_${comissao.tipo}`;
        const contagem = (mapaComissoes.get(chave) || 0) + 1;
        mapaComissoes.set(chave, contagem);

        if (contagem > 1) {
          divergencias.push({
            tipo: 'COMISSAO_DUPLICADA',
            descricao: `Comissao duplicada: pagamento ${comissao.pagamento_id}, contador ${comissao.contador_id}, tipo ${comissao.tipo}`,
            pagamento_id: comissao.pagamento_id,
            valor_encontrado: comissao.valor,
            severidade: 'alta'
          });
        }
      }
    }

    console.log(`[RECONCILIACAO] Verificacao 2: ${comissoesDuplicadas?.length || 0} comissoes verificadas`);

    // ========================================
    // VERIFICACAO 3: Valores negativos
    // ========================================
    console.log('[RECONCILIACAO] Verificacao 3: Valores negativos');

    const { data: comissoesNegativas, error: erro3 } = await supabase
      .from('comissoes')
      .select('id, pagamento_id, valor')
      .lt('valor', 0)
      .gte('created_at', ontem);

    if (!erro3 && comissoesNegativas && comissoesNegativas.length > 0) {
      for (const comissao of comissoesNegativas) {
        divergencias.push({
          tipo: 'VALOR_NEGATIVO',
          descricao: `Comissao ${comissao.id} tem valor negativo: R$ ${comissao.valor}`,
          pagamento_id: comissao.pagamento_id || undefined,
          valor_encontrado: comissao.valor,
          severidade: 'critica'
        });
      }
    }

    console.log(`[RECONCILIACAO] Verificacao 3: ${comissoesNegativas?.length || 0} comissoes negativas encontradas`);

    // ========================================
    // VERIFICACAO 4: Bonus Progressao inconsistente
    // ========================================
    console.log('[RECONCILIACAO] Verificacao 4: Bonus Progressao inconsistente');

    const { data: contadores, error: erro4 } = await supabase
      .from('contadores')
      .select('id, clientes_ativos');

    if (!erro4 && contadores) {
      for (const contador of contadores) {
        const marcoEsperado = [5, 10, 15].find(m => m === contador.clientes_ativos);

        if (marcoEsperado) {
          const { data: bonusProgressao } = await supabase
            .from('bonus_historico')
            .select('id')
            .eq('contador_id', contador.id)
            .eq('tipo_bonus', 'bonus_progressao')
            .eq('marco_atingido', marcoEsperado)
            .maybeSingle();

          if (!bonusProgressao) {
            divergencias.push({
              tipo: 'BONUS_PROGRESSAO_FALTANDO',
              descricao: `Contador ${contador.id} tem ${contador.clientes_ativos} clientes mas nao recebeu Bonus Progressao`,
              valor_esperado: 100,
              valor_encontrado: 0,
              severidade: 'media'
            });
          }
        }
      }
    }

    console.log(`[RECONCILIACAO] Verificacao 4: ${contadores?.length || 0} contadores verificados`);

    // ========================================
    // VERIFICACAO 5: Comissoes sem aprovacao (> 7 dias)
    // ========================================
    console.log('[RECONCILIACAO] Verificacao 5: Comissoes pendentes de aprovacao');

    const seteDiasAtras = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const { data: comissoesPendentes, error: erro5 } = await supabase
      .from('comissoes')
      .select('id, pagamento_id, valor, created_at')
      .eq('status', 'calculada')
      .lt('created_at', seteDiasAtras);

    if (!erro5 && comissoesPendentes && comissoesPendentes.length > 0) {
      for (const comissao of comissoesPendentes) {
        divergencias.push({
          tipo: 'COMISSAO_NAO_APROVADA',
          descricao: `Comissao ${comissao.id} esta 'calculada' ha mais de 7 dias (criada em ${comissao.created_at})`,
          pagamento_id: comissao.pagamento_id || undefined,
          valor_encontrado: comissao.valor,
          severidade: 'baixa'
        });
      }
    }

    console.log(`[RECONCILIACAO] Verificacao 5: ${comissoesPendentes?.length || 0} comissoes pendentes encontradas`);

    // ========================================
    // RESUMO E LOG DE AUDITORIA
    // ========================================

    const resumo = {
      data_reconciliacao: hoje,
      total_verificacoes: totalVerificacoes,
      divergencias_encontradas: divergencias.length,
      divergencias_criticas: divergencias.filter(d => d.severidade === 'critica').length,
      divergencias_altas: divergencias.filter(d => d.severidade === 'alta').length,
      divergencias_medias: divergencias.filter(d => d.severidade === 'media').length,
      divergencias_baixas: divergencias.filter(d => d.severidade === 'baixa').length,
      divergencias: divergencias
    };

    // Salvar log de auditoria
    await supabase.from('audit_logs').insert({
      acao: 'RECONCILIACAO_DIARIA',
      tabela: 'comissoes',
      payload: resumo
    });

    console.log('[RECONCILIACAO] Reconciliacao concluida:');
    console.log(`  - Total verificacoes: ${resumo.total_verificacoes}`);
    console.log(`  - Divergencias encontradas: ${resumo.divergencias_encontradas}`);
    console.log(`  - Criticas: ${resumo.divergencias_criticas}`);
    console.log(`  - Altas: ${resumo.divergencias_altas}`);
    console.log(`  - Medias: ${resumo.divergencias_medias}`);
    console.log(`  - Baixas: ${resumo.divergencias_baixas}`);

    // Se houver divergencias criticas, enviar alerta
    if (resumo.divergencias_criticas > 0) {
      console.error('[RECONCILIACAO] ALERTA: Divergencias CRITICAS encontradas!');
      
      // TODO: Integrar com Brevo ou email para enviar alerta
      // await enviarEmailAlerta(resumo);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Reconciliacao concluida: ${resumo.divergencias_encontradas} divergencias encontradas`,
        resumo
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('[RECONCILIACAO] Erro ao processar reconciliacao:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});

