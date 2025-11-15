/**
 * WEBHOOK STRIPE - Payment Confirmation
 *
 * Recebe confirmações de pagamento do Stripe via webhook
 * Processa eventos de payment_intent.succeeded
 * ID do pedido vem através dos metadata do PaymentIntent
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.47.10';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
};

interface StripePaymentIntent {
  id: string;
  object: string;
  amount: number;
  amount_received: number;
  currency: string;
  customer: string | null;
  description: string | null;
  metadata: Record<string, string>;
  status: string;
  created: number;
  charges: {
    data: Array<{
      id: string;
      amount: number;
      amount_captured: number;
      status: string;
      payment_method_details: {
        type: string;
        card?: {
          brand: string;
          last4: string;
        };
      };
    }>;
  };
}

interface StripeWebhookEvent {
  id: string;
  type: string;
  data: {
    object: StripePaymentIntent;
  };
}

console.info('Stripe webhook server started');

Deno.serve(async (req) => {
  // Responder OPTIONS para CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Inicializar cliente Supabase
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    console.log('[STRIPE_WEBHOOK] ========================================');
    console.log('[STRIPE_WEBHOOK] New webhook received from Stripe');
    console.log('[STRIPE_WEBHOOK] Timestamp:', new Date().toISOString());

    // Parse payload
    let payload: StripeWebhookEvent;
    let payloadRaw: string;

    try {
      payloadRaw = await req.text();
      console.log(`[STRIPE_WEBHOOK] Payload size: ${payloadRaw.length} bytes`);
      payload = JSON.parse(payloadRaw);
    } catch (parseError) {
      console.error('[STRIPE_WEBHOOK] JSON parse error:', parseError);
      throw new Error('Invalid JSON in webhook payload');
    }

    console.log(`[STRIPE_WEBHOOK] Event type: ${payload.type}`);
    console.log(`[STRIPE_WEBHOOK] Event ID: ${payload.id}`);

    // Processar apenas eventos de pagamento bem-sucedido
    if (payload.type !== 'payment_intent.succeeded') {
      console.log(`[STRIPE_WEBHOOK] Event ignored: ${payload.type}`);
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

    const paymentIntent = payload.data.object;

    console.log(`[STRIPE_WEBHOOK] Payment Intent ID: ${paymentIntent.id}`);
    console.log(`[STRIPE_WEBHOOK] Amount: ${paymentIntent.amount / 100} ${paymentIntent.currency.toUpperCase()}`);
    console.log(`[STRIPE_WEBHOOK] Status: ${paymentIntent.status}`);
    console.log(`[STRIPE_WEBHOOK] Metadata:`, paymentIntent.metadata);

    // Extrair order_id dos metadata
    const orderId = paymentIntent.metadata.order_id || paymentIntent.metadata.pedido_id;

    if (!orderId) {
      console.warn('[STRIPE_WEBHOOK] No order_id found in metadata');
      console.warn('[STRIPE_WEBHOOK] Metadata keys:', Object.keys(paymentIntent.metadata));

      // Log warning mas não falha o webhook
      await supabase.from('audit_logs').insert({
        acao: 'STRIPE_WEBHOOK_NO_ORDER_ID',
        tabela: 'pagamentos',
        payload: {
          payment_intent_id: paymentIntent.id,
          metadata: paymentIntent.metadata,
          timestamp: new Date().toISOString(),
        },
      });
    }

    // Verificar idempotência
    console.log('[STRIPE_WEBHOOK] Checking idempotency...');
    const { data: existingPayment, error: checkError } = await supabase
      .from('pagamentos')
      .select('id')
      .eq('stripe_payment_id', paymentIntent.id)
      .maybeSingle();

    if (checkError) {
      throw new Error(`Idempotency check error: ${checkError.message}`);
    }

    if (existingPayment) {
      console.log(`[STRIPE_WEBHOOK] Payment already processed: ${existingPayment.id}`);
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Payment already processed (idempotent)',
          pagamento_id: existingPayment.id,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    // Extrair dados do primeiro charge
    const charge = paymentIntent.charges.data[0];
    const paymentMethod = charge?.payment_method_details;

    // Converter valores de centavos para reais/dolares
    const amountInCurrency = paymentIntent.amount / 100;
    const amountReceivedInCurrency = paymentIntent.amount_received / 100;

    // Registrar pagamento no banco
    console.log('[STRIPE_WEBHOOK] Registering payment in database...');
    const { data: newPayment, error: paymentError } = await supabase
      .from('pagamentos')
      .insert({
        stripe_payment_id: paymentIntent.id,
        stripe_charge_id: charge?.id || null,
        tipo: 'mensalidade', // ou extrair dos metadata
        valor_bruto: amountInCurrency,
        valor_liquido: amountReceivedInCurrency,
        moeda: paymentIntent.currency.toUpperCase(),
        status: 'pago',
        pago_em: new Date(paymentIntent.created * 1000).toISOString(),
        metodo_pagamento: paymentMethod?.type || 'card',
        card_brand: paymentMethod?.card?.brand || null,
        card_last4: paymentMethod?.card?.last4 || null,
        customer_id: paymentIntent.customer,
        order_id: orderId || null,
        metadata: paymentIntent.metadata,
        competencia: new Date().toISOString().split('T')[0],
      })
      .select()
      .single();

    if (paymentError) {
      console.error('[STRIPE_WEBHOOK] Payment registration error:', paymentError);
      throw paymentError;
    }

    console.log(`[STRIPE_WEBHOOK] Payment registered: ${newPayment.id}`);

    // Registrar audit log
    await supabase
      .from('audit_logs')
      .insert({
        acao: 'STRIPE_WEBHOOK_PROCESSED',
        tabela: 'pagamentos',
        registro_id: newPayment.id,
        payload: {
          event_type: payload.type,
          payment_intent_id: paymentIntent.id,
          charge_id: charge?.id,
          amount: amountInCurrency,
          currency: paymentIntent.currency,
          order_id: orderId,
          status: paymentIntent.status,
        },
      })
      .catch((auditError) => {
        console.error('[STRIPE_WEBHOOK] Audit log error:', auditError);
      });

    console.log('[STRIPE_WEBHOOK] Processing completed successfully');
    console.log('[STRIPE_WEBHOOK] ========================================');

    // Retornar sucesso
    return new Response(
      JSON.stringify({
        success: true,
        pagamento_id: newPayment.id,
        payment_intent_id: paymentIntent.id,
        order_id: orderId,
        amount: amountInCurrency,
        currency: paymentIntent.currency,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : '';

    console.error('[STRIPE_WEBHOOK] ========================================');
    console.error('[STRIPE_WEBHOOK] ERROR PROCESSING WEBHOOK');
    console.error('[STRIPE_WEBHOOK] Message:', errorMessage);
    console.error('[STRIPE_WEBHOOK] Stack:', errorStack);
    console.error('[STRIPE_WEBHOOK] ========================================');

    // Tentar registrar erro em audit log
    try {
      await supabase.from('audit_logs').insert({
        acao: 'STRIPE_WEBHOOK_ERROR',
        tabela: 'pagamentos',
        payload: {
          error: errorMessage,
          stack: errorStack.substring(0, 500),
          timestamp: new Date().toISOString(),
        },
      });
    } catch (auditError) {
      console.error('[STRIPE_WEBHOOK] Failed to log error:', auditError);
    }

    // Retornar erro
    return new Response(
      JSON.stringify({
        error: errorMessage,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
