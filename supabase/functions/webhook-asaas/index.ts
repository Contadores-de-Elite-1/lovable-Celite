import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.47.10';
import { crypto } from 'https://deno.land/std@0.224.0/crypto/mod.ts';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Determina se esta em modo de desenvolvimento
const isDevelopment = Deno.env.get('ENVIRONMENT') === 'development' || 
                      Deno.env.get('DENO_DEPLOYMENT_ID') === undefined;

async function validateAsaasSignature(
  payload: string,
  signature: string | null,
  secret: string | null
): Promise<boolean> {
  // Em desenvolvimento: apenas avisa, mas permite
  // Em producao: REJEITA se nao houver secret ou assinatura
  
  if (!secret) {
    console.error('[WEBHOOK] ASAAS_WEBHOOK_SECRET not configured');
    
    if (isDevelopment) {
      console.warn('[WEBHOOK] DEVELOPMENT MODE - Allowing webhook without secret');
      return true;
    }
    
    // Em producao: REJEITA
    console.error('[WEBHOOK] PRODUCTION MODE - Rejecting webhook without secret');
    return false;
  }

  if (!signature) {
    console.error('[WEBHOOK] No signature in x-asaas-webhook-signature header');
    
    if (isDevelopment) {
      console.warn('[WEBHOOK] DEVELOPMENT MODE - Allowing webhook without signature');
      return true;
    }
    
    // Em producao: REJEITA
    console.error('[WEBHOOK] PRODUCTION MODE - Rejecting webhook without signature');
    return false;
  }

  // Valida assinatura MD5(payload + secret)
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(payload + secret);
    const hashBuffer = await crypto.subtle.digest('MD5', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const expectedSignature = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    const isValid = expectedSignature === signature.toLowerCase();
    
    if (!isValid) {
      console.error('[WEBHOOK] Invalid signature', {
        received: signature.substring(0, 10) + '...',
        expected: expectedSignature.substring(0, 10) + '...',
        match: false
      });
    }
    
    return isValid;
    
  } catch (error) {
    console.error('[WEBHOOK] Error validating signature:', error);
    
    // Em caso de erro na validacao: SEMPRE REJEITA (dev e prod)
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

// Schema Zod para validacao robusta do payload
const PaymentSchema = z.object({
  id: z.string().min(1, 'Payment ID e obrigatorio'),
  customer: z.string().min(1, 'Customer ID e obrigatorio'),
  value: z.number().positive('Valor deve ser positivo'),
  netValue: z.number().positive('Valor liquido deve ser positivo'),
  dateCreated: z.string().regex(/^\d{4}-\d{2}-\d{2}/, 'Data invalida (esperado YYYY-MM-DD)'),
  confirmedDate: z.string().optional(),
  status: z.string(),
  billingType: z.string(),
  subscription: z.string().optional()
});

const WebhookPayloadSchema = z.object({
  event: z.string(),
  payment: PaymentSchema.optional()
});

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
      throw new Error('JSON invalido no payload');
    }

    // Valida payload com Zod
    try {
      WebhookPayloadSchema.parse(payload);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessages = error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
        console.error('[WEBHOOK] Payload validation failed:', errorMessages);
        return new Response(JSON.stringify({ 
          error: 'Payload invalido', 
          details: errorMessages 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        });
      }
      throw error;
    }

    // Validate webhook signature - check multiple possible header names
    const asaasSignature = req.headers.get('x-asaas-webhook-signature')
      || req.headers.get('asaas-access-token')
      || req.headers.get('x-asaas-signature');

    console.log('[WEBHOOK] Validating signature...');
    const isValidSignature = await validateAsaasSignature(
      payloadRaw,
      asaasSignature,
      asaasWebhookSecret
    );

    if (!isValidSignature) {
      console.error('[WEBHOOK] Signature validation FAILED - Rejecting webhook');
      return new Response(JSON.stringify({ error: 'Assinatura invalida' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 403,
      });
    }
    
    console.log('[WEBHOOK] Signature validated successfully');

    console.log('[WEBHOOK] Asaas webhook received:', payload.event || 'NO_EVENT');

    const eventosRelevantes = [
      'PAYMENT_CONFIRMED',
      'PAYMENT_RECEIVED',
      'PAYMENT_RECEIVED_IN_CASH',
      'SUBSCRIPTION_CREATED',
      'PAYMENT_AWAITING_RISK_ANALYSIS',  // Asaas pode enviar isso
    ];

    // Se não tem event, assume que é um pagamento confirmado
    const evento = payload.event || 'PAYMENT_CONFIRMED';

    if (!eventosRelevantes.includes(evento) && payload.event) {
      console.log('[WEBHOOK] Unrecognized event:', payload.event);
      // Se tem evento mas não reconhecemos, ignora
      // Mas se é payment, tenta processar de qualquer forma
      if (!payload.payment) {
        return new Response(JSON.stringify({ message: 'Evento ignorado' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        });
      }
      console.log('   Mas tem dados de pagamento, tentando processar...');
    }

    const payment = payload.payment;

    console.log('[PAYLOAD ANALYSIS]');
    console.log('  event:', payload.event);
    console.log('  payment exists:', !!payment);
    if (payment) {
      console.log('  payment.id:', payment.id);
      console.log('  payment.customer:', payment.customer);
      console.log('  payment.value:', payment.value);
      console.log('  payment.netValue:', payment.netValue);
      console.log('  payment fields:', Object.keys(payment).join(', '));
    }

    if (!payment || !payment.id || !payment.customer) {
      const missingFields = [];
      if (!payment) missingFields.push('payment object');
      if (payment && !payment.id) missingFields.push('id');
      if (payment && !payment.customer) missingFields.push('customer');
      throw new Error(`Dados incompletos: ${missingFields.join(', ')}`);
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
        status: 'pago',
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
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    const errorStack = error instanceof Error ? error.stack : '';

    console.error('[WEBHOOK] ERROR processing webhook');
    console.error('   Mensagem:', errorMessage);
    console.error('   Stack:', errorStack);

    try {
      await supabase.from('audit_logs').insert({
        acao: 'WEBHOOK_ASAAS_ERROR',
        tabela: 'pagamentos',
        payload: {
          error: errorMessage,
          stack: errorStack.substring(0, 500),
          event: (error as { event?: string })?.event || 'unknown',
          timestamp: new Date().toISOString(),
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
