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

    // Bônus LTV agora é processado pela edge function verificar-bonus-ltv
    // executada mensalmente via CRON (dia 1 de cada mês)
    const bonusLtvCriado = null;

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
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        pagamento_id: novoPagamento.id,
        comissoes: calculoResult,
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
