/**
 * WEBHOOK STRIPE - Complete Event Handler
 *
 * Processa eventos do Stripe:
 * - checkout.session.completed: Sessão finalizada
 * - customer.subscription.created: Assinatura criada
 * - customer.subscription.updated: Assinatura atualizada
 * - customer.subscription.deleted: Assinatura cancelada
 * - invoice.payment_succeeded: Pagamento recorrente confirmado
 * - invoice.payment_failed: Pagamento falhou
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.47.10';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
};

console.info('Stripe webhook server started');

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    console.log('[STRIPE_WEBHOOK] ========================================');
    console.log('[STRIPE_WEBHOOK] New webhook received from Stripe');
    console.log('[STRIPE_WEBHOOK] Timestamp:', new Date().toISOString());

    const payloadRaw = await req.text();
    const payload = JSON.parse(payloadRaw);

    console.log(`[STRIPE_WEBHOOK] Event type: ${payload.type}`);
    console.log(`[STRIPE_WEBHOOK] Event ID: ${payload.id}`);

    // Route to appropriate handler
    let result;

    switch (payload.type) {
      case 'checkout.session.completed':
        result = await handleCheckoutCompleted(payload.data.object, supabase);
        break;

      case 'customer.subscription.created':
        result = await handleSubscriptionCreated(payload.data.object, supabase);
        break;

      case 'customer.subscription.updated':
        result = await handleSubscriptionUpdated(payload.data.object, supabase);
        break;

      case 'customer.subscription.deleted':
        result = await handleSubscriptionDeleted(payload.data.object, supabase);
        break;

      case 'invoice.payment_succeeded':
        result = await handleInvoicePaymentSucceeded(payload.data.object, supabase);
        break;

      case 'invoice.payment_failed':
        result = await handleInvoicePaymentFailed(payload.data.object, supabase);
        break;

      default:
        console.log(`[STRIPE_WEBHOOK] Event not handled: ${payload.type}`);
        return new Response(
          JSON.stringify({
            success: true,
            message: `Event ${payload.type} received but not processed`,
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          }
        );
    }

    console.log('[STRIPE_WEBHOOK] Processing completed successfully');
    console.log('[STRIPE_WEBHOOK] ========================================');

    return new Response(
      JSON.stringify({
        success: true,
        ...result,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : '';

    console.error('[STRIPE_WEBHOOK] ERROR:', errorMessage);
    console.error('[STRIPE_WEBHOOK] Stack:', errorStack);

    try {
      await supabase.from('audit_logs').insert({
        acao: 'STRIPE_WEBHOOK_ERROR',
        tabela: 'webhook_logs',
        payload: {
          error: errorMessage,
          stack: errorStack.substring(0, 500),
          timestamp: new Date().toISOString(),
        },
      });
    } catch (auditError) {
      console.error('[STRIPE_WEBHOOK] Audit log error:', auditError);
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

/**
 * checkout.session.completed
 * Quando o checkout é concluído com sucesso
 */
async function handleCheckoutCompleted(session: any, supabase: any) {
  console.log('[CHECKOUT_COMPLETED] Processing checkout session');
  console.log(`[CHECKOUT_COMPLETED] Session ID: ${session.id}`);

  const contador_id = session.metadata?.contador_id;

  if (!contador_id) {
    throw new Error('contador_id not found in session metadata');
  }

  // Atualizar cliente ou criar se não existir
  const { data: cliente, error: clienteError } = await supabase
    .from('clientes')
    .upsert({
      contador_id: contador_id,
      stripe_customer_id: session.customer,
      stripe_subscription_id: session.subscription,
      status: 'ativo',
      data_ativacao: new Date().toISOString(),
    }, {
      onConflict: 'contador_id',
      returning: 'minimal',
    })
    .select()
    .single();

  if (clienteError) {
    console.error('[CHECKOUT_COMPLETED] Error upserting cliente:', clienteError);
  }

  // Log event
  await supabase.from('audit_logs').insert({
    acao: 'STRIPE_CHECKOUT_COMPLETED',
    tabela: 'clientes',
    registro_id: cliente?.id,
    payload: {
      session_id: session.id,
      customer_id: session.customer,
      subscription_id: session.subscription,
      contador_id: contador_id,
      timestamp: new Date().toISOString(),
    },
  });

  return { message: 'Checkout completed', cliente_id: cliente?.id };
}

/**
 * customer.subscription.created
 * Quando uma assinatura é criada
 */
async function handleSubscriptionCreated(subscription: any, supabase: any) {
  console.log('[SUBSCRIPTION_CREATED] Processing subscription');
  console.log(`[SUBSCRIPTION_CREATED] Subscription ID: ${subscription.id}`);

  const contador_id = subscription.metadata?.contador_id;

  if (!contador_id) {
    throw new Error('contador_id not found in subscription metadata');
  }

  // Atualizar cliente
  const { error: updateError } = await supabase
    .from('clientes')
    .update({
      stripe_subscription_id: subscription.id,
      stripe_price_id: subscription.items.data[0]?.price?.id,
      status: subscription.status === 'active' ? 'ativo' : 'lead',
    })
    .eq('stripe_customer_id', subscription.customer);

  if (updateError) {
    console.error('[SUBSCRIPTION_CREATED] Error updating cliente:', updateError);
  }

  // Log event
  await supabase.from('audit_logs').insert({
    acao: 'STRIPE_SUBSCRIPTION_CREATED',
    tabela: 'clientes',
    payload: {
      subscription_id: subscription.id,
      customer_id: subscription.customer,
      status: subscription.status,
      contador_id: contador_id,
      timestamp: new Date().toISOString(),
    },
  });

  return { message: 'Subscription created', subscription_id: subscription.id };
}

/**
 * customer.subscription.updated
 * Quando uma assinatura é atualizada
 */
async function handleSubscriptionUpdated(subscription: any, supabase: any) {
  console.log('[SUBSCRIPTION_UPDATED] Processing subscription update');
  console.log(`[SUBSCRIPTION_UPDATED] Subscription ID: ${subscription.id}`);

  // Atualizar status do cliente baseado na assinatura
  const newStatus = subscription.status === 'active' ? 'ativo' :
                   subscription.status === 'canceled' ? 'cancelado' :
                   subscription.status === 'past_due' ? 'inadimplente' : 'lead';

  const { error: updateError } = await supabase
    .from('clientes')
    .update({
      status: newStatus,
      ...(subscription.status === 'canceled' && {
        data_cancelamento: new Date().toISOString(),
      }),
    })
    .eq('stripe_subscription_id', subscription.id);

  if (updateError) {
    console.error('[SUBSCRIPTION_UPDATED] Error updating cliente:', updateError);
  }

  // Log event
  await supabase.from('audit_logs').insert({
    acao: 'STRIPE_SUBSCRIPTION_UPDATED',
    tabela: 'clientes',
    payload: {
      subscription_id: subscription.id,
      old_status: subscription.previous_attributes?.status,
      new_status: subscription.status,
      timestamp: new Date().toISOString(),
    },
  });

  return { message: 'Subscription updated', subscription_id: subscription.id, status: newStatus };
}

/**
 * customer.subscription.deleted
 * Quando uma assinatura é cancelada
 */
async function handleSubscriptionDeleted(subscription: any, supabase: any) {
  console.log('[SUBSCRIPTION_DELETED] Processing subscription deletion');
  console.log(`[SUBSCRIPTION_DELETED] Subscription ID: ${subscription.id}`);

  // Atualizar cliente como cancelado
  const { error: updateError } = await supabase
    .from('clientes')
    .update({
      status: 'cancelado',
      data_cancelamento: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', subscription.id);

  if (updateError) {
    console.error('[SUBSCRIPTION_DELETED] Error updating cliente:', updateError);
  }

  // Log event
  await supabase.from('audit_logs').insert({
    acao: 'STRIPE_SUBSCRIPTION_DELETED',
    tabela: 'clientes',
    payload: {
      subscription_id: subscription.id,
      customer_id: subscription.customer,
      timestamp: new Date().toISOString(),
    },
  });

  return { message: 'Subscription deleted', subscription_id: subscription.id };
}

/**
 * invoice.payment_succeeded
 * Quando um pagamento recorrente é confirmado
 * AQUI É ONDE CALCULAMOS AS COMISSÕES!
 */
async function handleInvoicePaymentSucceeded(invoice: any, supabase: any) {
  console.log('[INVOICE_PAID] Processing successful payment');
  console.log(`[INVOICE_PAID] Invoice ID: ${invoice.id}`);

  // Buscar cliente pela subscription
  const { data: cliente, error: clienteError } = await supabase
    .from('clientes')
    .select('*')
    .eq('stripe_subscription_id', invoice.subscription)
    .maybeSingle();

  if (clienteError || !cliente) {
    console.error('[INVOICE_PAID] Cliente not found:', clienteError);
    throw new Error(`Cliente not found for subscription ${invoice.subscription}`);
  }

  console.log(`[INVOICE_PAID] Cliente found: ${cliente.id}`);

  // Verificar idempotência
  const { data: existingPayment } = await supabase
    .from('pagamentos')
    .select('id')
    .eq('stripe_payment_id', invoice.payment_intent)
    .maybeSingle();

  if (existingPayment) {
    console.log(`[INVOICE_PAID] Payment already processed: ${existingPayment.id}`);
    return { message: 'Payment already processed (idempotent)', pagamento_id: existingPayment.id };
  }

  // Determinar tipo de pagamento (primeira mensalidade ou recorrente)
  const isFirstPayment = !cliente.data_ativacao ||
    new Date(cliente.data_ativacao).getMonth() === new Date().getMonth();

  const tipo = isFirstPayment ? 'ativacao' : 'recorrente';

  // Converter valores (Stripe usa centavos)
  const valorBruto = invoice.total / 100;
  const valorLiquido = invoice.amount_paid / 100;

  // Registrar pagamento
  const { data: newPayment, error: paymentError } = await supabase
    .from('pagamentos')
    .insert({
      cliente_id: cliente.id,
      tipo: tipo,
      valor_bruto: valorBruto,
      valor_liquido: valorLiquido,
      moeda: invoice.currency.toUpperCase(),
      status: 'pago',
      pago_em: new Date(invoice.status_transitions.paid_at * 1000).toISOString(),
      stripe_payment_id: invoice.payment_intent,
      stripe_charge_id: invoice.charge,
      customer_id: invoice.customer,
      order_id: invoice.id,
      metadata: invoice.metadata || {},
      competencia: new Date().toISOString().split('T')[0],
    })
    .select()
    .single();

  if (paymentError) {
    console.error('[INVOICE_PAID] Error registering payment:', paymentError);
    throw paymentError;
  }

  console.log(`[INVOICE_PAID] Payment registered: ${newPayment.id}`);

  // Calcular comissões via edge function
  console.log('[INVOICE_PAID] Calculating commissions...');

  let commissionResult = null;

  try {
    const { data: result, error: commissionError } = await supabase.functions.invoke(
      'calcular-comissoes',
      {
        body: {
          pagamento_id: newPayment.id,
          cliente_id: cliente.id,
          contador_id: cliente.contador_id,
          valor_liquido: valorLiquido,
          competencia: newPayment.competencia,
          is_primeira_mensalidade: isFirstPayment,
        },
      }
    );

    if (commissionError) {
      throw commissionError;
    }

    commissionResult = result;
    console.log('[INVOICE_PAID] Commissions calculated successfully');
  } catch (commissionError) {
    console.error('[INVOICE_PAID] Commission calculation error:', commissionError);

    await supabase.from('audit_logs').insert({
      acao: 'STRIPE_COMMISSION_ERROR',
      tabela: 'pagamentos',
      registro_id: newPayment.id,
      payload: {
        error: commissionError instanceof Error ? commissionError.message : String(commissionError),
        invoice_id: invoice.id,
        timestamp: new Date().toISOString(),
      },
    });
  }

  // Log success
  await supabase.from('audit_logs').insert({
    acao: 'STRIPE_INVOICE_PAID',
    tabela: 'pagamentos',
    registro_id: newPayment.id,
    payload: {
      invoice_id: invoice.id,
      payment_intent: invoice.payment_intent,
      cliente_id: cliente.id,
      valor_bruto: valorBruto,
      valor_liquido: valorLiquido,
      tipo: tipo,
      commissions_calculated: commissionResult ? true : false,
      timestamp: new Date().toISOString(),
    },
  });

  return {
    message: 'Invoice payment processed',
    pagamento_id: newPayment.id,
    comissoes_calculadas: commissionResult ? true : false,
    tipo: tipo,
  };
}

/**
 * invoice.payment_failed
 * Quando um pagamento falha
 */
async function handleInvoicePaymentFailed(invoice: any, supabase: any) {
  console.log('[INVOICE_FAILED] Processing failed payment');
  console.log(`[INVOICE_FAILED] Invoice ID: ${invoice.id}`);

  // Buscar cliente
  const { data: cliente } = await supabase
    .from('clientes')
    .select('id')
    .eq('stripe_subscription_id', invoice.subscription)
    .maybeSingle();

  if (cliente) {
    // Atualizar status para inadimplente
    await supabase
      .from('clientes')
      .update({ status: 'inadimplente' })
      .eq('id', cliente.id);
  }

  // Log event
  await supabase.from('audit_logs').insert({
    acao: 'STRIPE_INVOICE_FAILED',
    tabela: 'clientes',
    registro_id: cliente?.id,
    payload: {
      invoice_id: invoice.id,
      customer_id: invoice.customer,
      subscription_id: invoice.subscription,
      amount: invoice.amount_due / 100,
      attempt_count: invoice.attempt_count,
      timestamp: new Date().toISOString(),
    },
  });

  return { message: 'Invoice payment failed', cliente_id: cliente?.id };
}
