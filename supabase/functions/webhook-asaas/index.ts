import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.47.10';
import { create } from 'https://deno.land/std@0.168.0/hash/md5.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function validateAsaasSignature(
  payload: string,
  signature: string | null,
  secret: string | null
): boolean {
  // CRITICAL: Webhook signature MUST be validated in production
  if (!secret) {
    console.error('SECURITY ERROR: ASAAS_WEBHOOK_SECRET not configured. Refusing unsigned webhooks.');
    throw new Error('ASAAS_WEBHOOK_SECRET environment variable is required');
  }

  if (!signature) {
    console.error('SECURITY ERROR: No webhook signature provided. Rejecting request.');
    return false;
  }

  // Asaas signs with MD5(payload + secret)
  try {
    const hash = create('md5');
    hash.update(payload + secret);
    const expectedSignature = hash.toString();

    const isValid = expectedSignature === signature.toLowerCase();
    if (!isValid) {
      console.error('Invalid webhook signature - possible tampering or wrong secret');
    }
    return isValid;
  } catch (error) {
    console.error('Error validating signature:', error);
    return false;
  }
}

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

function validarValorMonetario(valor: unknown, nome: string): number {
  if (typeof valor !== 'number' || valor <= 0) {
    throw new Error(`${nome} inválido: ${valor}. Deve ser número positivo.`);
  }
  if (!Number.isFinite(valor)) {
    throw new Error(`${nome} não é número válido: ${valor}`);
  }
  return Math.round(valor * 100) / 100;
}

function parseCompetencia(dateCreated: string): string {
  try {
    const data = new Date(dateCreated);
    if (isNaN(data.getTime())) {
      throw new Error('Data inválida');
    }
    const ano = data.getFullYear();
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    const dia = String(data.getDate()).padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
  } catch {
    throw new Error(`Erro ao fazer parse da data: ${dateCreated}`);
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const asaasWebhookSecret = Deno.env.get('ASAAS_WEBHOOK_SECRET');
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    let payload: AsaasWebhookPayload;
    let payloadRaw: string;
    try {
      payloadRaw = await req.text();
      payload = JSON.parse(payloadRaw);
    } catch {
      throw new Error('JSON inválido no payload');
    }

    // Validate webhook signature
    const asaasSignature = req.headers.get('x-asaas-webhook-signature');
    const isValidSignature = validateAsaasSignature(
      payloadRaw,
      asaasSignature,
      asaasWebhookSecret
    );

    if (!isValidSignature) {
      console.error('Webhook signature validation failed');
      return new Response(JSON.stringify({ error: 'Assinatura inválida' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      });
    }

    console.log('Webhook Asaas recebido:', payload.event);

    const eventosRelevantes = [
      'PAYMENT_CONFIRMED',
      'PAYMENT_RECEIVED',
      'PAYMENT_RECEIVED_IN_CASH',
      'SUBSCRIPTION_CREATED',
    ];

    if (!eventosRelevantes.includes(payload.event)) {
      console.log('Evento ignorado:', payload.event);
      return new Response(JSON.stringify({ message: 'Evento ignorado' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    const payment = payload.payment;
    if (!payment || !payment.id || !payment.customer) {
      throw new Error('Dados de pagamento incompletos no payload');
    }

    const valoresValidados = {
      valor_bruto: validarValorMonetario(payment.value, 'valor_bruto'),
      valor_liquido: validarValorMonetario(payment.netValue, 'valor_liquido'),
    };

    if (valoresValidados.valor_liquido > valoresValidados.valor_bruto) {
      throw new Error('valor_liquido não pode ser maior que valor_bruto');
    }

    const competencia = parseCompetencia(payment.dateCreated);

    const { data: cliente, error: clienteError } = await supabase
      .from('clientes')
      .select('id, contador_id, data_ativacao')
      .eq('asaas_customer_id', payment.customer)
      .maybeSingle();

    if (clienteError) {
      throw new Error(`Erro ao buscar cliente: ${clienteError.message}`);
    }

    if (!cliente) {
      console.error('Cliente não encontrado:', payment.customer);
      return new Response(JSON.stringify({ error: 'Cliente não encontrado' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404,
      });
    }

    if (!cliente.contador_id) {
      throw new Error('Cliente sem contador_id vinculado');
    }

    const { data: pagamentoExistente, error: checkError } = await supabase
      .from('pagamentos')
      .select('id')
      .eq('asaas_payment_id', payment.id)
      .maybeSingle();

    if (checkError) {
      throw new Error(`Erro ao verificar idempotência: ${checkError.message}`);
    }

    if (pagamentoExistente) {
      console.log('Pagamento já processado (idempotência):', payment.id);
      return new Response(JSON.stringify({
        success: true,
        message: 'Pagamento já processado (idempotência)',
        pagamento_id: pagamentoExistente.id
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    const dataAtivacao = cliente.data_ativacao ? new Date(cliente.data_ativacao) : null;
    const dataPagamento = new Date(competencia);
    const isPrimeiroPagamento = !dataAtivacao ||
      (dataAtivacao.getFullYear() === dataPagamento.getFullYear() &&
       dataAtivacao.getMonth() === dataPagamento.getMonth());

    const dataConfirmacao = payment.confirmedDate
      ? new Date(payment.confirmedDate).toISOString()
      : new Date().toISOString();

    const { data: novoPagamento, error: pagamentoError } = await supabase
      .from('pagamentos')
      .insert({
        cliente_id: cliente.id,
        tipo: isPrimeiroPagamento ? 'ativacao' : 'mensalidade',
        valor_bruto: valoresValidados.valor_bruto,
        valor_liquido: valoresValidados.valor_liquido,
        competencia,
        status: 'confirmed',
        pago_em: dataConfirmacao,
        asaas_payment_id: payment.id,
        asaas_event_id: payload.event,
      })
      .select()
      .single();

    if (pagamentoError) {
      console.error('Erro ao criar pagamento:', pagamentoError);
      throw pagamentoError;
    }

    console.log('Pagamento registrado:', novoPagamento.id);

    let calculoResult = null;
    try {
      const { data: resultado, error: calculoError } = await supabase.functions.invoke(
        'calcular-comissoes',
        {
          body: {
            pagamento_id: novoPagamento.id,
            cliente_id: cliente.id,
            contador_id: cliente.contador_id,
            valor_liquido: valoresValidados.valor_liquido,
            competencia,
            is_primeira_mensalidade: isPrimeiroPagamento,
          },
        }
      );

      if (calculoError) {
        throw calculoError;
      }

      calculoResult = resultado;
      console.log('Comissoes calculadas com sucesso');
    } catch (err) {
      console.error('Erro ao calcular comissões. Pagamento registrado mas comissões pendentes:', err);

      await supabase.from('audit_logs').insert({
        acao: 'WEBHOOK_CALCULO_COMISSOES_ERRO',
        tabela: 'pagamentos',
        registro_id: novoPagamento.id,
        payload: {
          error: err instanceof Error ? err.message : String(err),
          pagamento_id: payment.id,
        },
      }).catch(e => console.error('Erro ao registrar audit log:', e));

      throw new Error(`Falha ao calcular comissões para pagamento ${novoPagamento.id}. Contate suporte.`);
    }

    await supabase.from('audit_logs').insert({
      acao: 'WEBHOOK_ASAAS_PROCESSED',
      tabela: 'pagamentos',
      registro_id: novoPagamento.id,
      payload: {
        event: payload.event,
        asaas_payment_id: payment.id,
        cliente_id: cliente.id,
        contador_id: cliente.contador_id,
        valor_bruto: valoresValidados.valor_bruto,
        valor_liquido: valoresValidados.valor_liquido,
        competencia,
        tipo: isPrimeiroPagamento ? 'ativacao' : 'mensalidade',
      },
    }).catch(auditErr => console.error('Erro ao registrar audit log:', auditErr));

    return new Response(
      JSON.stringify({
        success: true,
        pagamento_id: novoPagamento.id,
        comissoes_calculadas: calculoResult ? true : false,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Erro no webhook Asaas:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';

    try {
      await supabase.from('audit_logs').insert({
        acao: 'WEBHOOK_ASAAS_ERROR',
        tabela: 'pagamentos',
        payload: {
          error: errorMessage,
          event: (error as { event?: string })?.event || 'unknown',
        },
      });
    } catch (logErr) {
      console.error('Erro ao registrar erro no audit log:', logErr);
    }

    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
