import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@14.21.0';
import { z } from 'https://esm.sh/zod@3.22.4';
import { logError, logInfo, logDebug } from '../_shared/logger.ts';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

// Schema de validacao para eventos do Stripe
const StripeEventSchema = z.object({
  id: z.string(),
  type: z.string(),
  data: z.object({
    object: z.any(),
  }),
});

type StripeEvent = z.infer<typeof StripeEventSchema>;

/**
 * Valida assinatura do webhook do Stripe
 * 
 * @param body - Body raw do request
 * @param signature - Assinatura do header Stripe
 * @returns true se valido, false caso contrario
 */
function validateStripeSignature(body: string, signature: string): boolean {
  const secret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
  
  if (!secret) {
    logError('STRIPE_WEBHOOK_SECRET nao configurado');
    return false;
  }

  if (!signature) {
    logError('Assinatura do webhook ausente');
    return false;
  }

  try {
    // Usa encoder para converter strings em bytes
    const encoder = new TextEncoder();
    const secretBytes = encoder.encode(secret);
    const messageBytes = encoder.encode(body);

    // Calcula HMAC-SHA256
    const key = await crypto.subtle.importKey(
      'raw',
      secretBytes,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const signatureBytes = await crypto.subtle.sign(
      'HMAC',
      key,
      messageBytes
    );

    // Converte para hex
    const calculatedSignature = Array.from(new Uint8Array(signatureBytes))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    // Stripe envia no formato: t=timestamp,v1=signature
    const parts = signature.split(',');
    let receivedSignature = '';

    for (const part of parts) {
      if (part.startsWith('v1=')) {
        receivedSignature = part.substring(3);
        break;
      }
    }

    // Compara assinaturas
    const isValid = calculatedSignature === receivedSignature;
    
    if (!isValid) {
      logError('Assinatura do webhook invalida', {
        received: receivedSignature,
        calculated: calculatedSignature
      });
    }

    return isValid;
  } catch (error) {
    logError('Erro ao validar assinatura', {
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    });
    return false;
  }
}

/**
 * Processa evento de pagamento bem-sucedido
 */
async function handlePaymentSucceeded(event: StripeEvent): Promise<void> {
  const paymentIntent = event.data.object;
  
  logInfo('Processando pagamento bem-sucedido', {
    payment_intent_id: paymentIntent.id,
    amount: paymentIntent.amount,
    email: paymentIntent.receipt_email
  });

  // Busca o pagamento na base de dados
  const { data: pagamentos, error: fetchError } = await supabase
    .from('pagamentos')
    .select('id, cliente_id, contador_id, valor, competencia')
    .eq('stripe_payment_intent_id', paymentIntent.id)
    .single();

  if (fetchError) {
    logError('Pagamento nao encontrado na base', {
      stripe_id: paymentIntent.id,
      error: fetchError.message
    });
    return;
  }

  // Atualiza status do pagamento
  const { error: updateError } = await supabase
    .from('pagamentos')
    .update({
      status: 'confirmado',
      data_confirmacao: new Date().toISOString(),
      stripe_event_id: event.id,
    })
    .eq('id', pagamentos.id);

  if (updateError) {
    logError('Erro ao atualizar pagamento', {
      pagamento_id: pagamentos.id,
      error: updateError.message
    });
    return;
  }

  // Chama Edge Function para calcular comissoes
  try {
    const response = await fetch(
      `${Deno.env.get('SUPABASE_URL')}/functions/v1/calcular-comissoes`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
        },
        body: JSON.stringify({
          pagamento_id: pagamentos.id,
          cliente_id: pagamentos.cliente_id,
          contador_id: pagamentos.contador_id,
          valor_liquido: paymentIntent.amount / 100, // Stripe retorna em centavos
          competencia: pagamentos.competencia,
          is_primeira_mensalidade: true,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      logError('Erro ao chamar calcular-comissoes', {
        status: response.status,
        error: error
      });
    } else {
      logInfo('Comissoes calculadas com sucesso', {
        pagamento_id: pagamentos.id
      });
    }
  } catch (error) {
    logError('Erro ao invocar calcular-comissoes', {
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }

  // Registra no audit_logs
  await supabase.from('audit_logs').insert({
    acao: 'webhook_stripe_payment_succeeded',
    detalhes: {
      stripe_event_id: event.id,
      pagamento_id: pagamentos.id,
      stripe_payment_intent_id: paymentIntent.id,
      amount: paymentIntent.amount,
    },
    created_at: new Date().toISOString(),
  });
}

/**
 * Processa evento de pagamento falhado
 */
async function handlePaymentFailed(event: StripeEvent): Promise<void> {
  const paymentIntent = event.data.object;

  logInfo('Processando pagamento falhado', {
    payment_intent_id: paymentIntent.id,
    status: paymentIntent.status
  });

  // Busca o pagamento
  const { data: pagamentos, error: fetchError } = await supabase
    .from('pagamentos')
    .select('id')
    .eq('stripe_payment_intent_id', paymentIntent.id)
    .single();

  if (fetchError) {
    logError('Pagamento nao encontrado', {
      stripe_id: paymentIntent.id
    });
    return;
  }

  // Atualiza status
  await supabase
    .from('pagamentos')
    .update({
      status: 'falhou',
      observacao: paymentIntent.last_payment_error?.message || 'Pagamento recusado',
      stripe_event_id: event.id,
    })
    .eq('id', pagamentos.id);

  logInfo('Pagamento marcado como falhou', {
    pagamento_id: pagamentos.id
  });

  // Registra audit
  await supabase.from('audit_logs').insert({
    acao: 'webhook_stripe_payment_failed',
    detalhes: {
      stripe_event_id: event.id,
      pagamento_id: pagamentos.id,
      error: paymentIntent.last_payment_error,
    },
    created_at: new Date().toISOString(),
  });
}

/**
 * Processa evento de reembolso
 */
async function handleChargeRefunded(event: StripeEvent): Promise<void> {
  const charge = event.data.object;

  logInfo('Processando reembolso', {
    charge_id: charge.id,
    amount_refunded: charge.amount_refunded
  });

  // Busca pagamento pelo charge ID
  const { data: pagamentos, error: fetchError } = await supabase
    .from('pagamentos')
    .select('id, comissoes(id)')
    .eq('stripe_charge_id', charge.id)
    .single();

  if (fetchError) {
    logError('Pagamento nao encontrado para reembolso', {
      charge_id: charge.id
    });
    return;
  }

  // Atualiza pagamento
  await supabase
    .from('pagamentos')
    .update({
      status: 'reembolsado',
      observacao: `Reembolso de R$ ${(charge.amount_refunded / 100).toFixed(2)}`,
      stripe_event_id: event.id,
    })
    .eq('id', pagamentos.id);

  // Atualiza comissoes associadas (cancelar)
  if (pagamentos.comissoes && pagamentos.comissoes.length > 0) {
    await supabase
      .from('comissoes')
      .update({ status: 'cancelada', observacao: 'Cancelada por reembolso' })
      .in('id', pagamentos.comissoes.map((c: any) => c.id));

    logInfo('Comissoes canceladas por reembolso', {
      pagamento_id: pagamentos.id,
      comissoes_canceladas: pagamentos.comissoes.length
    });
  }

  // Registra audit
  await supabase.from('audit_logs').insert({
    acao: 'webhook_stripe_charge_refunded',
    detalhes: {
      stripe_event_id: event.id,
      pagamento_id: pagamentos.id,
      charge_id: charge.id,
      amount_refunded: charge.amount_refunded,
    },
    created_at: new Date().toISOString(),
  });
}

/**
 * Processa evento de assinatura atualizada (recorrente)
 */
async function handleSubscriptionUpdated(event: StripeEvent): Promise<void> {
  const subscription = event.data.object;

  logInfo('Processando atualizacao de assinatura', {
    subscription_id: subscription.id,
    status: subscription.status
  });

  // Se assinatura foi cancelada
  if (subscription.status === 'canceled') {
    const { data: clientes } = await supabase
      .from('clientes')
      .select('id')
      .eq('stripe_subscription_id', subscription.id)
      .single();

    if (clientes) {
      await supabase
        .from('clientes')
        .update({ status: 'cancelado' })
        .eq('id', clientes.id);

      logInfo('Cliente marcado como cancelado', {
        cliente_id: clientes.id,
        subscription_id: subscription.id
      });
    }
  }

  // Registra audit
  await supabase.from('audit_logs').insert({
    acao: 'webhook_stripe_subscription_updated',
    detalhes: {
      stripe_event_id: event.id,
      subscription_id: subscription.id,
      status: subscription.status,
    },
    created_at: new Date().toISOString(),
  });
}

/**
 * Edge Function principal: processar webhooks do Stripe
 */
Deno.serve(async (req) => {
  // Apenas POST
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    // Le o body como texto (precisa para validar assinatura)
    const body = await req.text();

    // Obtem assinatura do header
    const signature = req.headers.get('stripe-signature') ?? '';

    // Valida assinatura
    if (!validateStripeSignature(body, signature)) {
      logError('Webhook rejeitado - assinatura invalida');
      return new Response('Unauthorized', { status: 401 });
    }

    // Parse do JSON
    let event: StripeEvent;
    try {
      const parsed = JSON.parse(body);
      event = StripeEventSchema.parse(parsed);
    } catch (error) {
      logError('Erro ao fazer parse do webhook', {
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });
      return new Response('Invalid payload', { status: 400 });
    }

    logDebug('Webhook recebido do Stripe', {
      event_id: event.id,
      event_type: event.type
    });

    // Processa conforme tipo de evento
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSucceeded(event);
        break;

      case 'payment_intent.payment_failed':
        await handlePaymentFailed(event);
        break;

      case 'charge.refunded':
        await handleChargeRefunded(event);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event);
        break;

      default:
        logDebug('Evento do Stripe nao processado', {
          event_type: event.type
        });
    }

    // Retorna sucesso ao Stripe
    return new Response(
      JSON.stringify({ received: true }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    logError('Erro no webhook Stripe', {
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      stack: error instanceof Error ? error.stack : undefined
    });

    // Retorna erro mas nao reenvia webhook
    return new Response(
      JSON.stringify({
        error: 'Internal server error'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
});

