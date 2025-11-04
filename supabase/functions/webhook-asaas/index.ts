import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.47.10';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AsaasWebhookPayload {
  event: string;
  payment?: {
    id: string;
    customer: string;
    value: number;
    netValue: number;
    dateCreated: string;
    confirmedDate?: string;
    status: string;
    billingType: string;
    subscription?: string;
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
    const payload: AsaasWebhookPayload = await req.json();
    
    console.log('📥 Webhook Asaas recebido:', payload.event);

    // Validar eventos relevantes
    const eventosRelevantes = [
      'PAYMENT_CONFIRMED',
      'PAYMENT_RECEIVED',
      'PAYMENT_RECEIVED_IN_CASH',
      'SUBSCRIPTION_CREATED',
    ];

    if (!eventosRelevantes.includes(payload.event)) {
      console.log('⚠️ Evento ignorado:', payload.event);
      return new Response(JSON.stringify({ message: 'Evento ignorado' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    const payment = payload.payment;
    if (!payment) {
      throw new Error('Payload sem dados de pagamento');
    }

    // Buscar cliente no sistema via asaas_customer_id
    const { data: cliente, error: clienteError } = await supabase
      .from('clientes')
      .select('id, contador_id, plano, valor_mensal, data_ativacao')
      .eq('asaas_customer_id', payment.customer)
      .single();

    if (clienteError || !cliente) {
      console.error('❌ Cliente não encontrado:', payment.customer);
      return new Response(JSON.stringify({ error: 'Cliente não encontrado' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404,
      });
    }

    // Verificar se pagamento já foi processado
    const { data: pagamentoExistente } = await supabase
      .from('pagamentos')
      .select('id')
      .eq('asaas_payment_id', payment.id)
      .single();

    if (pagamentoExistente) {
      console.log('⚠️ Pagamento já processado:', payment.id);
      return new Response(JSON.stringify({ message: 'Pagamento já processado' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // Determinar competência (mês do pagamento)
    const competencia = new Date(payment.dateCreated).toISOString().slice(0, 10);
    const isPrimeiroPagamento = !cliente.data_ativacao || 
      new Date(cliente.data_ativacao).getMonth() === new Date(competencia).getMonth();

    // Registrar pagamento
    const { data: novoPagamento, error: pagamentoError } = await supabase
      .from('pagamentos')
      .insert({
        cliente_id: cliente.id,
        tipo: isPrimeiroPagamento ? 'ativacao' : 'mensalidade',
        valor_bruto: payment.value,
        valor_liquido: payment.netValue,
        competencia,
        status: 'confirmed',
        pago_em: payment.confirmedDate || new Date().toISOString(),
        asaas_payment_id: payment.id,
        asaas_event_id: payload.event,
      })
      .select()
      .single();

    if (pagamentoError) {
      console.error('❌ Erro ao criar pagamento:', pagamentoError);
      throw pagamentoError;
    }

    console.log('✅ Pagamento registrado:', novoPagamento.id);

    // Invocar cálculo de comissões
    const { data: calculoResult, error: calculoError } = await supabase.functions.invoke(
      'calcular-comissoes',
      {
        body: {
          pagamento_id: novoPagamento.id,
          cliente_id: cliente.id,
          contador_id: cliente.contador_id,
          valor_liquido: payment.netValue,
          competencia,
          is_primeira_mensalidade: isPrimeiroPagamento,
        },
      }
    );

    if (calculoError) {
      console.error('❌ Erro ao calcular comissões:', calculoError);
      throw calculoError;
    }

    console.log('✅ Comissões calculadas:', calculoResult);

    // ============================================
    // VERIFICAR BÔNUS LTV (12 MESES)
    // ============================================
    let bonusLtvCriado = null;
    
    if (cliente.data_ativacao) {
      const dataAtivacao = new Date(cliente.data_ativacao);
      const dataAtual = new Date();
      const mesesAtivo = Math.floor((dataAtual.getTime() - dataAtivacao.getTime()) / (1000 * 60 * 60 * 24 * 30));
      
      console.log(`📅 Cliente ativo há ${mesesAtivo} meses (desde ${cliente.data_ativacao})`);
      
      // Se completou 12 meses ou mais
      if (mesesAtivo >= 12) {
        // Verificar se já recebeu bônus LTV
        const { data: bonusExistente } = await supabase
          .from('bonus_historico')
          .select('id')
          .eq('contador_id', cliente.contador_id)
          .eq('tipo_bonus', 'bonus_ltv')
          .ilike('observacao', `%Cliente: ${cliente.id}%`)
          .single();
        
        if (!bonusExistente) {
          console.log('🎯 Cliente elegível para Bônus LTV! Calculando...');
          
          // Calcular ticket médio dos últimos 6 meses
          const data6MesesAtras = new Date();
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
          
          console.log(`💰 Ticket médio (últimos 6 meses): R$ ${ticketMedio.toFixed(2)}`);
          
          // Contar total de clientes ativos do contador
          const { count: totalClientesAtivos } = await supabase
            .from('clientes')
            .select('id', { count: 'exact', head: true })
            .eq('contador_id', cliente.contador_id)
            .eq('status', 'ativo');
          
          // Determinar percentual de bônus LTV
          let percentualLTV = 0.15; // Padrão: 15%
          let descricaoNivel = '1-4 clientes';
          
          if (totalClientesAtivos && totalClientesAtivos >= 15) {
            percentualLTV = 0.50; // 50%
            descricaoNivel = '15+ clientes';
          } else if (totalClientesAtivos && totalClientesAtivos >= 5) {
            percentualLTV = 0.30; // 30%
            descricaoNivel = '5-14 clientes';
          }
          
          const valorBonus = ticketMedio * percentualLTV;
          
          console.log(`🎁 Bônus LTV: ${(percentualLTV * 100)}% sobre R$ ${ticketMedio.toFixed(2)} = R$ ${valorBonus.toFixed(2)}`);
          
          // Criar bônus no histórico
          const mesAtual = dataAtual.toISOString().slice(0, 7);
          const competenciaBonus = `${mesAtual}-01`;
          
          const { data: bonus, error: erroBonus } = await supabase
            .from('bonus_historico')
            .insert({
              contador_id: cliente.contador_id,
              tipo_bonus: 'bonus_ltv',
              valor: valorBonus,
              competencia: competenciaBonus,
              status: 'pendente',
              observacao: `LTV 12 meses - Cliente: ${cliente.id} - Ticket: R$ ${ticketMedio.toFixed(2)} - ${descricaoNivel}`,
              marco_atingido: 12,
            })
            .select()
            .single();
          
          if (!erroBonus && bonus) {
            // Criar comissão vinculada ao bônus
            await supabase.from('comissoes').insert({
              contador_id: cliente.contador_id,
              cliente_id: cliente.id,
              tipo: 'bonus_ltv',
              valor: valorBonus,
              percentual: percentualLTV,
              competencia: competenciaBonus,
              status: 'calculada',
              observacao: `Bônus LTV 12 meses - ${(percentualLTV * 100)}% sobre ticket médio`,
            });
            
            bonusLtvCriado = bonus;
            console.log(`✅ Bônus LTV criado: R$ ${valorBonus.toFixed(2)}`);
          } else {
            console.error('❌ Erro ao criar bônus LTV:', erroBonus);
          }
        } else {
          console.log('⏭️ Cliente já recebeu Bônus LTV anteriormente');
        }
      }
    }

    // Log de auditoria
    await supabase.from('audit_logs').insert({
      acao: 'WEBHOOK_ASAAS_PROCESSED',
      tabela: 'pagamentos',
      registro_id: novoPagamento.id,
      payload: {
        event: payload.event,
        payment_id: payment.id,
        cliente_id: cliente.id,
        valor: payment.value,
        comissoes_criadas: calculoResult?.comissoes_criadas || 0,
        bonus_ltv_criado: bonusLtvCriado ? bonusLtvCriado.id : null,
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        pagamento_id: novoPagamento.id,
        comissoes: calculoResult,
        bonus_ltv: bonusLtvCriado ? {
          id: bonusLtvCriado.id,
          valor: bonusLtvCriado.valor,
          observacao: bonusLtvCriado.observacao,
        } : null,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('❌ Erro no webhook Asaas:', error);
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
